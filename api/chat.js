// api/chat.js  — Vercel Serverless Function (CommonJS)

module.exports = async (req, res) => {
  // CORS (facoltativo)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { message, systemPrompt } = body;
    if (!message) return res.status(400).send("Missing message");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).send("OPENAI_API_KEY not set");

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful assistant." },
        { role: "user", content: message }
      ],
      max_tokens: 220,
      temperature: 0.4
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await r.text();
    if (!r.ok) return res.status(r.status).send(text);

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).send(String(e));
  }
};
