export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.BOT_TOKEN;
  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  const chat_id = req.body?.message?.chat?.id;
  const text = req.body?.message?.text || "";

  if (!chat_id) return res.status(200).end();

  const sendMessage = async (msg) => {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({chat_id, text: msg})
    });
  };

  await sendMessage("Working...");

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are AestheteMed Knowledge Reference AI. Provide reference-based insights. Do not give direct medical instructions." },
        { role: "user", content: text }
      ],
      max_tokens: 700,
      temperature: 0.1
    })
  });

  const data = await completion.json();
  const answer = data?.choices?.[0]?.message?.content || "No response.";

  await sendMessage(answer);
  res.status(200).end();
}
