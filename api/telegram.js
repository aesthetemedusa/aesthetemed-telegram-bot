export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;

  if (req.method !== "POST") return res.status(200).send("OK");

  const message = req.body?.message;
  const chat_id = message?.chat?.id;
  const text = message?.text || "";

  if (!chat_id) return res.status(200).send("no chat");

  const sendMessage = async (msg) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: msg })
    });
  };

  await sendMessage("Processing...");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const reply = response?.choices?.[0]?.message?.content || "No response";
  await sendMessage(reply);

  res.status(200).send("OK");
}
