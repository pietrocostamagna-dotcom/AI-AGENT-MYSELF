// keepalive
// api/chat.js  — sanity check
module.exports = async (req, res) => {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    return res.status(200).json({ ok: true, msg: "Function is wired." });
  } catch (e) {
    return res.status(500).send("Crash: " + String(e));
  }
};

// (facoltativo ma utile)
module.exports.config = { runtime: "nodejs18.x" };
