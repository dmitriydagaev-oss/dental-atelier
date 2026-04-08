const BOT_TOKEN = import.meta.env.VITE_TG_BOT_TOKEN;
const CHAT_ID   = import.meta.env.VITE_TG_CHAT_ID;

export async function sendTelegramMessage(text) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    return res.json();
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

export function formatBookingLead({ name, phone, concern, time }) {
  const timeLabel = { morning: "Утро (9–13)", day: "День (13–17)", evening: "Вечер (17–21)" };
  return [
    "🦷 <b>Новая заявка с сайта</b>",
    "",
    `👤 <b>Имя:</b> ${name}`,
    `📞 <b>Телефон:</b> ${phone}`,
    time ? `🕐 <b>Время:</b> ${timeLabel[time] ?? time}` : null,
    concern ? `💬 <b>Беспокоит:</b> ${concern}` : null,
    "",
    "📍 <i>Источник: форма на сайте</i>",
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export function formatChatLead({ phone, messages }) {
  const snippet = messages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "👤" : "🤖"} ${m.text}`)
    .join("\n\n");
  return [
    "💬 <b>Пациент хочет записаться (из чата)</b>",
    "",
    `📞 <b>Телефон:</b> ${phone}`,
    "",
    "📋 <b>Фрагмент диалога:</b>",
    snippet,
  ].join("\n");
}
