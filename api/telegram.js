export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  if (req.method !== "POST") {
    return res.status(200).send("Bot is running ✅");
  }

  // ВАЖНО: правильные поля Telegram
  const chat_id = req.body?.message?.chat?.id;
  const text = req.body?.message?.text || "";

  if (!chat_id) return res.status(200).end();

  const sendMessage = async (msg) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: msg }),
    });
  };

  // Сообщаем пользователю что обработка началась
  await sendMessage("Processing your request... ⏳");

  // Запрос к OpenAI ChatGPT
  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are AestheteMed Protocol Reference AI. Respond clearly, professionally, and briefly. Not medical advice. Internal clinic use only." },
        { role: "user", content: text }
      ]
    })
  });

  const data = await completion.json();
  const reply = data?.choices?.[0]?.message?.content || "I’m not sure. Please rephrase.";

  await sendMessage(reply);

  return res.status(200).json({ ok: true });
}
