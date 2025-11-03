export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  if (req.method !== "POST") return res.status(200).send("OK");

  const chat_id = req.body?.message?.chat?.id;
  const text = req.body?.message?.text || "";

  if (!chat_id) return res.status(200).send("No message");

  const sendMessage = async (msg) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: msg })
    });
  };

  await sendMessage("Processing...");

  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: text }]
    })
  }).then(r => r.json());

  await sendMessage(gptResponse.choices?.[0]?.message?.content || "No answer");

  res.status(200).send("OK");
}
