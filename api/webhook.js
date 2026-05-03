import axios from "axios";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  // ✅ Verification
  if (req.method === "GET") {
  console.log("VERIFY TOKEN FROM META:", req.query["hub.verify_token"]);
  console.log("VERIFY TOKEN FROM ENV:", VERIFY_TOKEN);

  return res.status(200).send(req.query["hub.challenge"]);
}

  // ✅ Handle messages
  if (req.method === "POST") {
    try {
      const body = req.body;

      const message =
        body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

      if (!message) {
        return res.sendStatus(200);
      }

      const from = message.from;
      const text = message.text?.body;

      console.log("User:", text);

      // 🤖 Gemini
      const geminiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text }] }]
        }
      );

      const reply =
        geminiRes.data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't understand.";

      // 📤 Send reply to WhatsApp
      await axios.post(
        `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: reply }
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.sendStatus(200);
    } catch (err) {
      console.error(err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  return res.sendStatus(405);
}