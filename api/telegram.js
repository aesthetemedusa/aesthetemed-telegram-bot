export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(200).send("OK");
    const msg = req.body?.message;
    const chat_id = msg?.chat?.id;
    const text = msg?.text || "(no text)";

    if (!chat_id) return res.status(200).send("NO_CHAT");

    // эхо-ответ
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: `echo: ${text}` })
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("handler error", e);
    return res.status(200).json({ ok: false });
  }
}
