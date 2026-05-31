import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();
const DAILY_LIMIT = 5;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uid, message, history } = req.body;

  if (!uid || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check & update daily limit
    const today = new Date().toISOString().split("T")[0];
    const limitRef = db.collection("chat_limits").doc(uid);

    const limitResult = await db.runTransaction(async (tx) => {
      const limitSnap = await tx.get(limitRef);

      if (!limitSnap.exists || limitSnap.data().resetAt !== today) {
        tx.set(limitRef, { count: 1, resetAt: today });
        return { allowed: true, remaining: DAILY_LIMIT - 1 };
      }

      const count = limitSnap.data().count ?? 0;
      if (count >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0 };
      }

      tx.update(limitRef, { count: count + 1 });
      return { allowed: true, remaining: DAILY_LIMIT - count - 1 };
    });

    if (!limitResult.allowed) {
      return res.status(429).json({
        error: "Daily limit reached",
        message: `You have used all ${DAILY_LIMIT} messages for today. Come back tomorrow!`,
      });
    }

    // Send to OpenRouter
    const systemPrompt =
      process.env.CHATBOT_SYSTEM_PROMPT ||
      "You are a helpful medical assistant for Smart Clinic.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: "user", content: message },
    ];

    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://smart-clinic-mu.vercel.app",
        "X-Title": "Smart Clinic Chatbot",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openRouterRes.ok) {
      const errText = await openRouterRes.text();
      console.error("OpenRouter error:", errText);
      throw new Error("AI service error");
    }

    const data = await openRouterRes.json();
    const reply =
      data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply, remaining: limitResult.remaining });

  } catch (err) {
    console.error("chatbot error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}