import { useState, useRef, useEffect, useCallback } from "react";
import { askGemini } from "./lib/gemini";
import { sendTelegramMessage, formatChatLead } from "./lib/telegram";

// ─── Quick reply chips shown before first user message ──────────────────────
const QUICK_REPLIES = [
  { label: "🦷 Болит зуб",         text: "У меня болит зуб" },
  { label: "😰 Боюсь боли",        text: "Боюсь, что будет больно" },
  { label: "💸 Сколько стоит?",    text: "Хочу узнать примерные цены" },
  { label: "😔 Давно не был",      text: "Мне стыдно — я давно не был у стоматолога" },
  { label: "✨ Хочу виниры",       text: "Хочу красивую улыбку, интересуют виниры" },
  { label: "🔩 Нужен имплант",     text: "Интересует имплантация зуба" },
];

const WELCOME_TEXT =
  `Здравствуйте! Я — консультант клиники Dental Atelier.\n\n` +
  `Расскажите, что вас беспокоит — постараюсь объяснить, что происходит, ` +
  `и помогу разобраться, что делать дальше.\n\n` +
  `Всё что вы напишете — конфиденциально. Вас здесь не осудят.`;

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-[#6F6A64] animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

// ─── Single message bubble ───────────────────────────────────────────────────
function Bubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#2F6B66] text-white text-[11px] font-semibold flex items-center justify-center shrink-0 mb-0.5">
          DA
        </div>
      )}
      <div
        className={`max-w-[78%] text-sm leading-relaxed px-4 py-3 whitespace-pre-wrap break-words ${
          isUser
            ? "bg-[#2F6B66] text-white rounded-2xl rounded-br-sm"
            : "bg-white text-[#1F1F1F] border border-[#E7E0D8] rounded-2xl rounded-bl-sm shadow-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Booking form inside chat ────────────────────────────────────────────────
function BookingForm({ messages, onDone, onCancel }) {
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!phone.trim()) return;
    setSending(true);
    await sendTelegramMessage(formatChatLead({ phone, messages }));
    setSending(false);
    onDone(phone);
  }

  return (
    <div className="px-4 py-4 bg-[#EAF2F1] border-t-2 border-[#2F6B66] shrink-0">
      <p className="text-sm font-semibold text-[#1F1F1F] mb-0.5">
        📅 Записать вас на приём?
      </p>
      <p className="text-xs text-[#6F6A64] mb-3">
        Оставьте номер — перезвоним в течение 30 минут, без давления:
      </p>
      <div className="flex gap-2">
        <input
          autoFocus
          type="tel"
          placeholder="+7 (___) ___-__-__"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1 min-w-0 border border-[#E7E0D8] rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#2F6B66] placeholder:text-[#B0A89F]"
        />
        <button
          onClick={submit}
          disabled={!phone.trim() || sending}
          className="w-10 h-10 bg-[#2F6B66] text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-[#245a55] transition-colors shrink-0"
        >
          {sending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8H2M9 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <button
          onClick={onCancel}
          className="text-[#6F6A64] hover:text-[#1F1F1F] text-lg leading-none px-1"
          title="Отмена"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── Main widget ─────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([
    { role: "assistant", text: WELCOME_TEXT },
  ]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [bookingMode, setBookingMode] = useState(false);
  const [leadSent, setLeadSent]       = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [unread, setUnread]           = useState(0);

  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, bookingMode]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setUnread(0);
    }
  }, [open]);

  // Pulse unread badge while closed
  useEffect(() => {
    if (!open && messages.length > 1) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") setUnread((n) => n + 1);
    }
  }, [messages]); // eslint-disable-line

  const sendMessage = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;
      setInput("");
      setHasInteracted(true);

      const updated = [...messages, { role: "user", text }];
      setMessages(updated);
      setLoading(true);

      try {
        // Exclude the static welcome message from API history
        const history = updated.slice(1);
        const reply = await askGemini(history);
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);

        // Auto-detect booking intent in AI reply and show phone form
        const BOOKING_TRIGGERS = [
          "записаться", "запись", "оставьте номер", "перезвоним",
          "позвоним", "следующий шаг", "консультац", "приём", "прием",
          "оставить телефон", "свяжемся",
        ];
        const replyLower = reply.toLowerCase();
        const hasBookingIntent = BOOKING_TRIGGERS.some((t) => replyLower.includes(t));
        if (hasBookingIntent && !leadSent) {
          setTimeout(() => setBookingMode(true), 600);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Что-то пошло не так. Пожалуйста, попробуйте ещё раз или позвоните нам: +7 (495) 123-45-67.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages]
  );

  function handleBookingDone(phone) {
    setLeadSent(true);
    setBookingMode(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: `Отлично! Записал ваш номер ${phone}.\n\nМы позвоним в течение 30 минут (пн–сб, 9:00–21:00). Если хочется быстрее — можете набрать сами: +7 (495) 123-45-67.`,
      },
    ]);
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      {!open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Tooltip bubble — appears before first interaction */}
          {!hasInteracted && (
            <div className="bg-white border border-[#E7E0D8] rounded-2xl rounded-br-sm px-4 py-3 shadow-lg max-w-[220px] text-sm text-[#1F1F1F] leading-snug">
              Есть вопрос? Я помогу разобраться — без давления 👋
            </div>
          )}

          <button
            onClick={() => setOpen(true)}
            className="relative w-16 h-16 bg-[#2F6B66] text-white rounded-full shadow-xl hover:bg-[#245a55] hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
            aria-label="Открыть чат"
          >
            {/* Unread badge */}
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 bg-[#C8A96B] text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1">
                {unread}
              </span>
            )}
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-[#2F6B66] animate-ping opacity-20" />
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="
            fixed z-50 flex flex-col bg-white overflow-hidden
            /* mobile: full-screen */
            inset-0
            /* desktop: bottom-right card */
            sm:inset-auto sm:bottom-6 sm:right-6
            sm:w-[390px] sm:rounded-2xl sm:border sm:border-[#E7E0D8] sm:shadow-2xl
          "
          style={{ maxHeight: "100dvh", height: "100dvh" }}
          /* desktop fixed height */
          // We rely on flex-col + flex-1 on messages to fill the space
        >
          {/* Header */}
          <div className="shrink-0 bg-[#2F6B66] text-white px-5 py-4 flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
              DA
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Dental Atelier</p>
              <p className="text-xs text-white/70 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Онлайн · отвечаем сейчас
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 transition-colors text-xl leading-none"
              aria-label="Закрыть чат"
            >
              ×
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 bg-[#FAF8F5]">
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} text={m.text} />
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-[#2F6B66] flex items-center justify-center shrink-0">
                  <span className="text-white text-[11px] font-semibold">DA</span>
                </div>
                <div className="bg-white border border-[#E7E0D8] rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies — show only before first user message */}
          {!hasInteracted && !loading && (
            <div className="shrink-0 px-4 py-3 bg-[#FAF8F5] border-t border-[#E7E0D8]">
              <p className="text-[11px] text-[#6F6A64] mb-2 font-medium uppercase tracking-wide">
                Частые вопросы
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_REPLIES.map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => sendMessage(text)}
                    className="text-xs text-[#2F6B66] border border-[#2F6B66]/30 bg-white rounded-full px-3 py-1.5 hover:bg-[#EAF2F1] hover:border-[#2F6B66] transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Booking form (replaces input) */}
          {bookingMode && !leadSent && (
            <BookingForm
              messages={messages}
              onDone={handleBookingDone}
              onCancel={() => setBookingMode(false)}
            />
          )}

          {/* Input bar */}
          {!bookingMode && (
            <div className="shrink-0 border-t border-[#E7E0D8] bg-white px-3 py-3">
              {/* Action chips */}
              {hasInteracted && !leadSent && (
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setBookingMode(true)}
                    className="shrink-0 text-xs font-medium text-[#2F6B66] border border-[#2F6B66] rounded-full px-3 py-1.5 hover:bg-[#EAF2F1] transition-colors"
                  >
                    📅 Записаться
                  </button>
                  <button
                    onClick={() => sendMessage("Сколько примерно стоит лечение?")}
                    className="shrink-0 text-xs text-[#6F6A64] border border-[#E7E0D8] rounded-full px-3 py-1.5 hover:border-[#2F6B66]/40 transition-colors"
                  >
                    💰 Узнать цену
                  </button>
                  <button
                    onClick={() => sendMessage("Это срочно или можно подождать?")}
                    className="shrink-0 text-xs text-[#6F6A64] border border-[#E7E0D8] rounded-full px-3 py-1.5 hover:border-[#2F6B66]/40 transition-colors"
                  >
                    ⏱ Насколько срочно?
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Напишите ваш вопрос..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={loading}
                  className="flex-1 min-w-0 border border-[#E7E0D8] rounded-xl px-4 py-2.5 text-sm bg-[#FAF8F5] focus:outline-none focus:border-[#2F6B66] focus:ring-2 focus:ring-[#2F6B6615] placeholder:text-[#B0A89F] disabled:opacity-60 transition-all"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-[#2F6B66] text-white rounded-xl flex items-center justify-center disabled:opacity-30 hover:bg-[#245a55] active:scale-95 transition-all shrink-0"
                  aria-label="Отправить"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M14 8H2M9 3l5 5-5 5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-center text-[10px] text-[#B0A89F] mt-2">
                Powered by AI · Dental Atelier
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
