import { useState, useEffect, useRef } from "react";
import ChatWidget from "./ChatWidget";
import { sendTelegramMessage, formatBookingLead } from "./lib/telegram";

// ─── Icon components ────────────────────────────────────────────────────────
function CheckIcon({ dark }) {
  return (
    <span
      className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
        dark ? "bg-white/20 text-white" : "bg-[#EAF2F1] text-[#2F6B66]"
      }`}
    >
      ✓
    </span>
  );
}

function StarIcon() {
  return <span className="text-[#C8A96B] text-lg">★</span>;
}

// ─── Data ────────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C10.477 4 6 8.477 6 14c0 3.314 1.567 6.263 4 8.17V26a2 2 0 002 2h8a2 2 0 002-2v-3.83C24.433 20.263 26 17.314 26 14c0-5.523-4.477-10-10-10z" stroke="#2F6B66" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="14" r="3" fill="#C8A96B"/>
      </svg>
    ),
    title: "Лечение зубов без боли",
    price: "от 3 900 ₽",
    badge: null,
    points: [
      "Анестезия до первого прикосновения",
      "Лечение за 1–2 визита без бесконечных записей",
      "Точная стоимость до начала работы",
      "Гарантия на пломбу — 3 года письменно",
    ],
    cta: "Записаться на осмотр",
    featured: false,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="10" y="20" width="12" height="8" rx="2" stroke="white" strokeWidth="1.5"/>
        <path d="M16 20V8M13 11l3-3 3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="8" r="3" stroke="#C8A96B" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Имплантация под ключ",
    price: "от 42 000 ₽ всё включено",
    badge: "Популярно",
    points: [
      "Импланты Nobel Biocare и Straumann",
      "Цена включает имплант, абатмент и коронку",
      "Рассрочка 0% до 24 месяцев",
      "Пожизненная гарантия на имплант",
    ],
    cta: "Рассчитать стоимость",
    featured: true,
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="#2F6B66" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 16.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5" stroke="#C8A96B" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="10" r="2.5" stroke="#2F6B66" strokeWidth="1.5"/>
      </svg>
    ),
    title: "Красивая улыбка",
    price: "от 18 000 ₽",
    badge: null,
    points: [
      "Виниры E.max — незаметные и прочные",
      "Отбеливание Zoom4 — на 8 тонов за 90 минут",
      "Mock-up — примерка улыбки до начала работы",
      "Результат виден сразу после процедуры",
    ],
    cta: "Смотреть работы",
    featured: false,
  },
];

const TEAM = [
  {
    photo: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=600&q=80",
    name: "Елена Смирнова",
    role: "Главный врач · Терапевт",
    exp: "16 лет практики",
    facts: [
      "Специализация — безболезненное лечение пациентов с дентофобией",
      "Сертификат CEREC: реставрация за один визит",
      "Провела более 2 000 процедур для тревожных пациентов",
    ],
  },
  {
    photo: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80",
    name: "Андрей Козлов",
    role: "Хирург · Имплантолог",
    exp: "11 лет практики",
    facts: [
      "Установил более 1 400 имплантов Nobel и Straumann",
      "Повышение квалификации в Гамбурге и Вене",
      "Приживаемость имплантов — 99,1% по собственной статистике",
    ],
  },
  {
    photo: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
    name: "Ольга Петрова",
    role: "Ортопед · Эстетика",
    exp: "9 лет практики",
    facts: [
      "Специализация — виниры E.max и дизайн улыбки",
      "Авторская методика подбора формы и цвета зубов",
      "Делает mock-up (пробную улыбку) до любой эстетической работы",
    ],
  },
];

const REVIEWS = [
  {
    name: "Марина К.",
    age: "38 лет",
    tag: "Лечение кариеса · 2024",
    stars: 5,
    text: "14 лет не ходила к стоматологу — просто боялась. Подруга уговорила попробовать именно сюда. Елена сделала анестезию так, что я даже не заметила укол. Просидела час в кресле и ничего не почувствовала. Теперь прихожу на плановые осмотры без страха.",
  },
  {
    name: "Дмитрий Р.",
    age: "47 лет",
    tag: "Имплантация · 2023",
    stars: 5,
    text: "Меня пугало, что имплант обойдётся в одну сумму, а по факту выйдет другая. Здесь перед процедурой выдали бумагу с точной цифрой — 54 000 ₽ за всё. Так и вышло. Через 4 месяца коронка на месте. Буду рекомендовать.",
  },
  {
    name: "Светлана В.",
    age: "31 год",
    tag: "Виниры E.max · 2024",
    stars: 5,
    text: "Стеснялась улыбаться с подросткового возраста. Пришла на консультацию — Ольга прямо в кресле сделала mock-up из временного материала. Я впервые увидела, как буду выглядеть. Готовые виниры сделали точно так же. Это изменило мне жизнь.",
  },
];

// ─── Animated counter ────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "", duration = 1600 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {value.toLocaleString("ru")}
      {suffix}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function DentalAtelier() {
  const [form, setForm] = useState({ name: "", phone: "", concern: "", time: "" });
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    await sendTelegramMessage(formatBookingLead(form));
    setSent(true);
  }

  return (
    <div className="font-sans text-[#1F1F1F] bg-[#FAF8F5] antialiased">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E7E0D8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="#" className="font-serif text-xl tracking-wide select-none">
            Dental&nbsp;<span className="text-[#C8A96B]">Atelier</span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-8 text-sm text-[#6F6A64]">
            {[["#services","Услуги"],["#team","Врачи"],["#reviews","Отзывы"],["#booking","Запись"]].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-[#2F6B66] transition-colors duration-200">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href="tel:+74951234567" className="hidden sm:block text-sm text-[#2F6B66] font-medium hover:text-[#245a55] transition-colors">
              +7 (495) 123-45-67
            </a>
            <a
              href="#booking"
              className="text-sm bg-[#2F6B66] text-white px-5 py-2.5 rounded-full hover:bg-[#245a55] transition-colors"
            >
              Записаться
            </a>
            {/* Burger */}
            <button
              className="md:hidden p-2 text-[#1F1F1F]"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Меню"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className={`h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#E7E0D8] bg-[#FAF8F5] px-4 py-4 flex flex-col gap-4 text-sm">
            {[["#services","Услуги"],["#team","Врачи"],["#reviews","Отзывы"],["#booking","Запись"]].map(([href, label]) => (
              <a key={href} href={href} className="text-[#6F6A64] hover:text-[#2F6B66]" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href="tel:+74951234567" className="text-[#2F6B66] font-medium">+7 (495) 123-45-67</a>
          </div>
        )}
      </header>

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4 sm:px-6">
        {/* Background decorations */}
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, #C8A96B18 0%, transparent 65%)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, #2F6B6612 0%, transparent 65%)" }} />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-[#EAF2F1] text-[#2F6B66] text-xs font-medium px-4 py-2 rounded-full mb-6 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F6B66] animate-pulse" />
              Принимаем сегодня · Без очереди
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl xl:text-6xl leading-[1.1] mb-6">
              Страшно лечить зубы?{" "}
              <span className="text-[#2F6B66] relative">
                Ничего не&nbsp;почувствуете
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 8" fill="none" aria-hidden>
                  <path d="M2 6 Q75 2 150 5 Q225 8 298 4" stroke="#C8A96B" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>

            <p className="text-[#6F6A64] text-lg leading-relaxed mb-8 max-w-lg">
              Работаем под современной анестезией — она наступает за 90 секунд. Каждый шаг
              объясняем заранее. Точную стоимость называем до того, как взяли инструмент.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#booking"
                className="inline-flex items-center justify-center gap-2 bg-[#2F6B66] text-white font-medium px-7 py-4 rounded-full hover:bg-[#245a55] transition-all duration-200 shadow-lg shadow-[#2F6B6625]"
              >
                Получить план лечения и точную стоимость
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a
                href="tel:+74951234567"
                className="inline-flex items-center justify-center gap-2 border border-[#E7E0D8] text-[#1F1F1F] font-medium px-7 py-4 rounded-full hover:border-[#2F6B66] hover:text-[#2F6B66] transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 3.7a1 1 0 01-.54 1.06l-1.548.775a11.037 11.037 0 005.553 5.553l.775-1.548a1 1 0 011.059-.54l3.7.74a1 1 0 01.836.986V13a1 1 0 01-1 1h-1C6.082 14 2 9.918 2 5V3z" fill="currentColor"/>
                </svg>
                +7 (495) 123-45-67
              </a>
            </div>

            {/* Micro trust */}
            <div className="mt-10 pt-8 border-t border-[#E7E0D8] flex flex-wrap gap-8">
              {[
                { n: <AnimatedNumber target={4800} suffix="+" />, l: "пациентов прошли лечение" },
                { n: "97%", l: "процедур — без боли" },
                { n: "0 ₽", l: "скрытых доплат" },
              ].map(({ n, l }) => (
                <div key={l}>
                  <p className="font-serif text-3xl text-[#2F6B66]">{n}</p>
                  <p className="text-xs text-[#6F6A64] mt-0.5">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden aspect-[4/5] bg-[#F3EEE7]">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=900&q=80"
                alt="Современный стоматологический кабинет Dental Atelier"
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/20 to-transparent" />
            </div>

            {/* Floating card — guarantee */}
            <div className="absolute -bottom-6 -left-6 bg-white border border-[#E7E0D8] rounded-2xl px-5 py-4 shadow-xl">
              <p className="text-xs text-[#6F6A64] mb-1">Гарантия на работу</p>
              <p className="font-serif text-3xl text-[#C8A96B]">до 5 лет</p>
              <p className="text-xs text-[#6F6A64] mt-1">Письменно</p>
            </div>

            {/* Floating card — rating */}
            <div className="absolute -top-6 -right-6 bg-white border border-[#E7E0D8] rounded-2xl px-5 py-4 shadow-xl">
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map((i) => <span key={i} className="text-[#C8A96B] text-sm">★</span>)}
              </div>
              <p className="font-semibold text-sm text-[#1F1F1F]">4.9 / 5.0</p>
              <p className="text-xs text-[#6F6A64]">312 отзывов</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUST FACTS ──────────────────────────────────────────────── */}
      <section className="bg-[#F3EEE7] py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-[#C8A96B] mb-12">
            Три причины, которые нас отличают
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                number: "97%",
                headline: "пациентов не чувствуют боли во время процедуры",
                body: "Работаем только с артикаином последнего поколения. Если вы всё же почувствуете дискомфорт — врач останавливается и добавляет дозу. Без обсуждений.",
                icon: "🛡️",
              },
              {
                number: "0 ₽",
                headline: "скрытых доплат — итоговая сумма фиксируется письменно",
                body: "Перед каждой процедурой вы получаете распечатанный план с итоговой суммой. Если в процессе выясняется что-то новое — работа останавливается, вы принимаете решение сами.",
                icon: "📋",
              },
              {
                number: "12",
                headline: "лет работы — ни одного судебного иска",
                body: "Более 4 800 пациентов. Рецидивы, требующие бесплатного повторного лечения, составляют менее 0,4%. Подтверждено внутренней статистикой клиники.",
                icon: "🏆",
              },
            ].map(({ number, headline, body, icon }) => (
              <div
                key={number}
                className="bg-white rounded-2xl p-8 border border-[#E7E0D8] flex flex-col gap-4 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start justify-between">
                  <p className="font-serif text-5xl text-[#2F6B66] leading-none">{number}</p>
                  <span className="text-2xl">{icon}</span>
                </div>
                <p className="font-semibold text-[#1F1F1F] leading-snug text-sm">{headline}</p>
                <p className="text-sm text-[#6F6A64] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES ─────────────────────────────────────────────────── */}
      <section id="services" className="py-24 px-4 sm:px-6 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-widest text-[#C8A96B] mb-3">
                Услуги
              </p>
              <h2 className="font-serif text-4xl leading-tight">
                Мы решаем конкретные проблемы — не продаём «комплексные программы»
              </h2>
            </div>
            <a href="#booking" className="shrink-0 text-sm text-[#2F6B66] font-medium underline underline-offset-4 hover:text-[#245a55] transition-colors">
              Все услуги и цены →
            </a>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {SERVICES.map(({ icon, title, price, badge, points, cta, featured }) => (
              <div
                key={title}
                className={`relative rounded-2xl p-8 flex flex-col gap-6 border transition-all duration-300 ${
                  featured
                    ? "bg-[#2F6B66] text-white border-[#2F6B66] shadow-2xl shadow-[#2F6B6640] scale-[1.02]"
                    : "bg-white border-[#E7E0D8] hover:shadow-md"
                }`}
              >
                {badge && (
                  <span className="absolute -top-3 left-8 bg-[#C8A96B] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    {badge}
                  </span>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${featured ? "bg-white/15" : "bg-[#F3EEE7]"}`}>
                  {icon}
                </div>
                <div>
                  <h3 className={`font-serif text-2xl mb-1.5 ${featured ? "text-white" : "text-[#1F1F1F]"}`}>
                    {title}
                  </h3>
                  <p className="text-sm font-semibold text-[#C8A96B]">{price}</p>
                </div>
                <ul className="flex flex-col gap-3">
                  {points.map((p) => (
                    <li key={p} className={`flex gap-3 text-sm ${featured ? "text-white/85" : "text-[#6F6A64]"}`}>
                      <CheckIcon dark={featured} />
                      {p}
                    </li>
                  ))}
                </ul>
                <a
                  href="#booking"
                  className={`mt-auto inline-block text-center text-sm font-medium py-3.5 px-6 rounded-full transition-all duration-200 ${
                    featured
                      ? "bg-[#C8A96B] text-white hover:bg-[#b5944f] shadow-md shadow-[#C8A96B40]"
                      : "border border-[#E7E0D8] text-[#1F1F1F] hover:border-[#2F6B66] hover:text-[#2F6B66]"
                  }`}
                >
                  {cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BEFORE/AFTER STRIP ──────────────────────────────────────────── */}
      <section className="bg-[#2F6B66] py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <p className="font-serif text-3xl text-white mb-2">Первый осмотр — бесплатно</p>
            <p className="text-white/70 text-sm">Панорамный снимок, консультация и план лечения включены</p>
          </div>
          <a
            href="#booking"
            className="shrink-0 inline-flex items-center gap-2 bg-[#C8A96B] text-white font-medium px-8 py-4 rounded-full hover:bg-[#b5944f] transition-colors shadow-lg"
          >
            Записаться сейчас
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </section>

      {/* ── 4. TEAM ─────────────────────────────────────────────────────── */}
      <section id="team" className="bg-[#F3EEE7] py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-[#C8A96B] mb-3">
              Врачи
            </p>
            <h2 className="font-serif text-4xl leading-tight">
              Вы будете знать, кто именно вас лечит — ещё до записи
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TEAM.map(({ photo, name, role, exp, facts }) => (
              <div
                key={name}
                className="bg-white rounded-2xl overflow-hidden border border-[#E7E0D8] group hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo}
                    alt={name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="font-serif text-xl text-[#1F1F1F]">{name}</h3>
                    <p className="text-sm text-[#2F6B66] font-medium">{role}</p>
                    <span className="inline-block mt-1.5 text-xs font-semibold text-[#C8A96B] bg-[#C8A96B15] px-3 py-1 rounded-full">
                      {exp}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {facts.map((f) => (
                      <li key={f} className="flex gap-2 text-sm text-[#6F6A64] leading-snug">
                        <span className="shrink-0 text-[#2F6B66] mt-0.5">·</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#booking"
                    className="mt-2 text-sm text-center text-[#2F6B66] font-medium border border-[#2F6B66]/30 rounded-full py-2.5 hover:bg-[#2F6B66] hover:text-white transition-all duration-200"
                  >
                    Записаться к {name.split(" ")[0]}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. TESTIMONIALS ─────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 px-4 sm:px-6 bg-[#FAF8F5]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-medium uppercase tracking-widest text-[#C8A96B] mb-3">
              Отзывы
            </p>
            <h2 className="font-serif text-4xl leading-tight">
              Что говорят люди, которые тоже откладывали лечение годами
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {REVIEWS.map(({ name, age, tag, stars, text }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-8 border border-[#E7E0D8] flex flex-col gap-5 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => <StarIcon key={i} />)}
                </div>
                <p className="text-[#1F1F1F] leading-relaxed text-sm flex-1">
                  «{text}»
                </p>
                <div className="pt-4 border-t border-[#E7E0D8]">
                  <p className="font-semibold text-[#1F1F1F] text-sm">{name}, {age}</p>
                  <p className="text-xs text-[#6F6A64] mt-0.5">{tag}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Aggregate row */}
          <div className="mt-12 py-8 border-t border-[#E7E0D8] flex flex-wrap gap-10 items-center justify-center">
            {[
              { val: "4.9 / 5.0", label: "Яндекс.Карты" },
              { val: "312", label: "отзывов на Google Maps" },
              { val: "НМА России", label: "Член Нац. мед. ассоциации" },
              { val: "Лицензия МЗ РФ", label: "№ ЛО-77-01-123456" },
            ].map(({ val, label }) => (
              <div key={val} className="text-center">
                <p className="font-serif text-2xl text-[#2F6B66]">{val}</p>
                <p className="text-xs text-[#6F6A64] mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. BOOKING ──────────────────────────────────────────────────── */}
      <section id="booking" className="bg-[#F3EEE7] py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">

          {/* Left: reassurance */}
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#C8A96B] mb-4">
              Запись на приём
            </p>
            <h2 className="font-serif text-4xl leading-tight mb-6">
              Первый шаг — бесплатный осмотр. Без давления, без навязанных планов.
            </h2>
            <p className="text-[#6F6A64] leading-relaxed mb-8">
              На первом приёме врач осматривает зубы, делает снимок и объясняет, что нужно
              сделать и сколько это стоит. Вы решаете сами — лечиться сразу или подумать.
              Никаких звонков с напоминаниями «запишитесь прямо сейчас».
            </p>

            <ul className="flex flex-col gap-4 mb-10">
              {[
                "Первичный осмотр + панорамный снимок — бесплатно",
                "Подробный письменный план лечения на руки",
                "Фиксированная стоимость до начала процедуры",
                "Возможность записаться к конкретному врачу",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#1F1F1F]">
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>

            {/* Contact info */}
            <div className="bg-white rounded-2xl border border-[#E7E0D8] p-6 flex flex-col gap-4">
              {[
                { icon: "📍", text: "Москва, ул. Примерная, д. 12" },
                { icon: "🕐", text: "Пн–Сб: 9:00 – 21:00 · Вс: 10:00 – 18:00" },
                { icon: "📞", text: "+7 (495) 123-45-67" },
                { icon: "✉️", text: "hello@dental-atelier.ru" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-[#6F6A64]">
                  <span className="text-lg w-6 text-center">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: form */}
          <div className="bg-white rounded-2xl border border-[#E7E0D8] p-8 shadow-sm">
            {sent ? (
              <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#EAF2F1] flex items-center justify-center text-3xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl text-[#1F1F1F]">Заявка отправлена</h3>
                <p className="text-sm text-[#6F6A64] max-w-sm">
                  Мы позвоним в течение 30 минут в рабочее время (пн–сб, 9:00–21:00),
                  чтобы подтвердить удобное время.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", phone: "", concern: "", time: "" }); }}
                  className="text-sm text-[#2F6B66] underline underline-offset-4 hover:text-[#245a55]"
                >
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <h3 className="font-serif text-2xl text-[#1F1F1F] mb-1">
                  Записаться на бесплатный осмотр
                </h3>
                <p className="text-sm text-[#6F6A64] -mt-3">
                  Ответим в течение 30 минут
                </p>

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6F6A64] uppercase tracking-wide">
                    Имя *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ваше имя"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="border border-[#E7E0D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2F6B66] focus:ring-2 focus:ring-[#2F6B6615] transition-all bg-[#FAF8F5] placeholder:text-[#B0A89F]"
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6F6A64] uppercase tracking-wide">
                    Телефон *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="border border-[#E7E0D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2F6B66] focus:ring-2 focus:ring-[#2F6B6615] transition-all bg-[#FAF8F5] placeholder:text-[#B0A89F]"
                  />
                </div>

                {/* Concern */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6F6A64] uppercase tracking-wide">
                    Что беспокоит? (необязательно)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Опишите вкратце — это поможет врачу подготовиться"
                    value={form.concern}
                    onChange={(e) => setForm({ ...form, concern: e.target.value })}
                    className="border border-[#E7E0D8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2F6B66] focus:ring-2 focus:ring-[#2F6B6615] transition-all bg-[#FAF8F5] placeholder:text-[#B0A89F] resize-none"
                  />
                </div>

                {/* Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#6F6A64] uppercase tracking-wide">
                    Удобное время
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "morning", label: "Утро", sub: "9–13" },
                      { val: "day",     label: "День",  sub: "13–17" },
                      { val: "evening", label: "Вечер", sub: "17–21" },
                    ].map(({ val, label, sub }) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setForm({ ...form, time: val })}
                        className={`flex flex-col items-center border rounded-xl py-3 text-sm transition-all duration-200 ${
                          form.time === val
                            ? "border-[#2F6B66] bg-[#EAF2F1] text-[#2F6B66]"
                            : "border-[#E7E0D8] text-[#6F6A64] hover:border-[#2F6B66]/50"
                        }`}
                      >
                        <span className="font-medium">{label}</span>
                        <span className="text-xs opacity-70">{sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2F6B66] text-white font-medium py-4 rounded-full hover:bg-[#245a55] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#2F6B6625] mt-1"
                >
                  Получить план лечения бесплатно
                </button>

                <p className="text-center text-xs text-[#6F6A64]">
                  Нажимая кнопку, вы соглашаетесь с{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-[#2F6B66]">
                    политикой конфиденциальности
                  </a>
                  . Мы не передаём данные третьим лицам.
                </p>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#1A1A1A] text-white py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-10 pb-10 border-b border-white/10">
            <div className="sm:col-span-2">
              <p className="font-serif text-2xl text-white mb-3">
                Dental&nbsp;<span className="text-[#C8A96B]">Atelier</span>
              </p>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                Стоматология без боли, без осуждения, без скрытых доплат.
                12 лет — более 4 800 пациентов.
              </p>
              <div className="flex gap-3 mt-5">
                {["ВКонтакте","Telegram","WhatsApp"].map((s) => (
                  <a key={s} href="#" className="text-xs text-white/40 border border-white/10 rounded-full px-3 py-1.5 hover:border-white/30 hover:text-white/70 transition-colors">
                    {s}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                Контакты
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-white/60">
                <li>+7 (495) 123-45-67</li>
                <li>hello@dental-atelier.ru</li>
                <li>Москва, ул. Примерная, 12</li>
                <li>Пн–Сб: 9:00 – 21:00</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">
                Документы
              </p>
              <ul className="flex flex-col gap-2.5 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Лицензия МЗ РФ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Договор оферты</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Прайс-лист</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
            <p>© {new Date().getFullYear()} Dental Atelier. Все права защищены.</p>
            <p>Информация на сайте не является публичной офертой</p>
          </div>
        </div>
      </footer>

      {/* ── AI CHAT WIDGET ──────────────────────────────────────────────── */}
      <ChatWidget />

    </div>
  );
}
