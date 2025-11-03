export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(200).send("OK");
    // Посмотрим, что реально приходит
    console.log("TG UPDATE:", JSON.stringify(req.body));

    const msg = req.body?.message || req.body?.edited_message
              || req.body?.channel_post || req.body?.callback_query?.message;

    const chat_id = msg?.chat?.id || req.body?.callback_query?.from?.id;
    const text = req.body?.message?.text
              || req.body?.callback_query?.data
              || "(no text)";

    if (!chat_id) return res.status(200).send("NO_CHAT");

    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: `echo: ${text}` })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("handler error", e);
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
