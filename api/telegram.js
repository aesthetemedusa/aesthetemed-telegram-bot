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
          resize_keyboard: true,
          one_time_keyboard: false
        }
      })
    })
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(200).send("OK");

    const token = process.env.BOT_TOKEN;
    const openaiKey = process.env.OPENAI_API_KEY;
    const tg = TG(token);

    const upd = req.body;
    const msg = upd?.message || upd?.edited_message || upd?.callback_query?.message;
    const chat_id = msg?.chat?.id || upd?.callback_query?.from?.id;
    const text = upd?.message?.text || upd?.callback_query?.data || "";

    if (!chat_id) return res.status(200).send("NO_CHAT");

    // простые команды
    if (text === "/start" || text.toLowerCase() === "menu") {
      await tg.kb(chat_id);
      return res.status(200).json({ ok: true });
    }

    // предварительное уведомление
    await tg.send(chat_id, "Processing...");

    // GPT
    const prompt = [
      {
        role: "system",
        content:
          "You are an internal clinic reference assistant. Provide general, non-patient-specific, educational guidance only. No medical advice to patients. Be concise."
      },
      {
        role: "user",
        content: text
      }
    ];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: prompt,
        temperature: 0.2,
        max_tokens: 500
      })
    }).then((x) => x.json());

    const answer = r?.choices?.[0]?.message?.content?.trim();
    await tg.send(chat_id, answer || "No response.");

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("handler error", e);
    // fallback: эхо, чтобы пользователь не остался без ответа
    const msg = req.body?.message;
    const chat_id = msg?.chat?.id;
    if (chat_id) {
      await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: "Temporary error. Echo: " + (msg?.text || "") })
      });
    }
    return res.status(200).json({ ok: false });
  }
}
