export const config = { api: { bodyParser: true } };

const TG = (token) => ({
  send: (chat_id, text) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text })
    }),
  kb: (chat_id) =>
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text: "Choose:",
        reply_markup: {
          keyboard: [[{ text: "Endolift Under Eyes" }], [{ text: "Morpheus8 Face" }], [{ text: "IPL Rosacea" }]],
          resize_keyboard: true
        }
      })
    })
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const token = process.env.BOT_TOKEN;
  const openaiKey = process.env.OPENAI_API_KEY;
  const tg = TG(token);

  const upd = req.body;
  const msg = upd?.message || upd?.edited_message || upd?.callback_query?.message;
  const chat_id = msg?.chat?.id || upd?.callback_query?.from?.id;
  const text = upd?.message?.text || upd?.callback_query?.data || "";

  if (!chat_id) return res.status(200).send("NO_CHAT");

  if (text === "/start" || text.toLowerCase() === "menu") {
    await tg.kb(chat_id);
    return res.status(200).json({ ok: true });
  }

  await tg.send(chat_id, "Processing...");

  // 1) Быстрая проверка ключа
  if (!openaiKey || !openaiKey.startsWith("sk-")) {
    await tg.send(chat_id, "OpenAI key is missing/invalid. Set OPENAI_API_KEY in Vercel.");
    return res.status(200).json({ ok: false });
  }

  // 2) Запрос к OpenAI с явным логом ошибок
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s таймаут

    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Clinic reference assistant. Educational, non-patient-specific. Be concise." },
        { role: "user", content: text }
      ],
      temperature: 0.2,
      max_tokens: 500
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await resp.json();
    console.log("OPENAI RAW:", JSON.stringify(data)); // смотрим в Vercel Logs

    if (!resp.ok) {
      const msgErr = data?.error?.message || `OpenAI HTTP ${resp.status}`;
      await tg.send(chat_id, `OpenAI error: ${msgErr}`);
      return res.status(200).json({ ok: false });
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();
    await tg.send(chat_id, answer || "OpenAI returned empty message.");
    return res.status(200).json({ ok: true });

  } catch (e) {
    console.error("OPENAI CALL ERROR:", e);
    const reason = e?.name === "AbortError" ? "timeout" : String(e);
    await tg.send(chat_id, `OpenAI request failed: ${reason}`);
    return res.status(200).json({ ok: false });
  }
}
