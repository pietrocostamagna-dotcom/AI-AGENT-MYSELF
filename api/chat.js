// bump: test commit
// api/chat.js — Fallback first: risponde sempre, poi tenta OpenAI se possibile (CommonJS)

const OFFLINE_PROFILE = {
  name: "Pietro Costamagna",
  title: "Brand & Communication Strategy Director",
  passions: "CrossFit, running, trail running; filosofia; letteratura; AI",
  objective: "Lead, Creative Storytelling & Campaigns (es. Under Armour)",
  experience: "17 anni con brand globali (Ferrero, Kellogg’s, Kia, P&G, etc.)",
  results: "Leffe +90% consideration; Iren +40% top-of-mind; BNPL 700k merchant",
  contacts: "pietro.costamagna@gmail.com · linkedin.com/in/pietromariacostamagna/"
};

function ruleBasedReply(q = "") {
  const t = q.toLowerCase();
  if (t.includes("passion")) return `I’m into ${OFFLINE_PROFILE.passions}.`;
  if (t.includes("objective") || t.includes("role") || t.includes("position"))
    return `I’m aiming for ${OFFLINE_PROFILE.objective}.`;
  if (t.includes("experience") || t.includes("background"))
    return `I have ${OFFLINE_PROFILE.experience}.`;
  if (t.includes("result") || t.includes("achievement") || t.includes("impact"))
    return `Key results: ${OFFLINE_PROFILE.results}.`;
  if (t.includes("contact") || t.includes("email") || t.includes("linkedin"))
    return `Contacts: ${OFFLINE_PROFILE.contacts}`;
  if (t.includes("ai"))
    return "I use AI daily for analysis, insight generation, reframing briefs, and creative inspiration.";
  return `I’m ${OFFLINE_PROFILE.name}, ${OFFLINE_PROFILE.title}. Ask me about passions, experience, objectives, or results.`;
}

module.exports = async (req, res) => {
  try {
    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    // Parse body
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
    if (!body) body = {};
    const { message, systemPrompt } = body;
    if (!message || typeof message !== "string") {
      // Anche senza message rispondiamo qualcosa (per non lasciare il sito muto)
      return res.status(200).json({ reply: ruleBasedReply("") });
    }

    // Se non c'è API key, rispondiamo con fallback
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith("sk-")) {
      return res.status(200).json({ reply: ruleBasedReply(message) });
    }

    // Tenta OpenAI
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
    if (!r.ok) {
      // Se OpenAI fallisce (401/429/500), non blocchiamo l’utente: fallback
      console.error("OpenAI error:", r.status, text);
      return res.status(200).json({ reply: ruleBasedReply(message) });
    }

    const data = JSON.parse(text);
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ reply: reply || ruleBasedReply(message) });
  } catch (e) {
    console.error("Function crash:", e);
    // Anche in crash, non lasciamo il sito muto
    return res.status(200).json({ reply: ruleBasedReply("") });
  }
};

// (facoltativo) Forza runtime Node moderno
module.exports.config = { runtime: "nodejs20.x" };
