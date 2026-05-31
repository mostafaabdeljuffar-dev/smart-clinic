import * as admin from "firebase-admin";

// ── Initialize Firebase Admin (once) ─────────────────────────────────────────
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const DAILY_LIMIT = 5;

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, message, history } = req.body;

  // 1. Validate inputs
  if (!idToken || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 2. Verify Firebase ID Token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    // 3. Check role — only patient or admin allowed
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(403).json({ error: "User not found" });
    }
    const role = userSnap.data().role;
    if (role !== "patient" && role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // 4. Check & update daily limit
    const today = new Date().toISOString().split("T")[0]; // "2026-05-30"
    const limitRef = db.collection("chat_limits").doc(uid);

    const limitResult = await db.runTransaction(async (tx) => {
      const limitSnap = await tx.get(limitRef);

      if (!limitSnap.exists || limitSnap.data().resetAt !== today) {
        // New day or first time — reset counter
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

    // 5. Build messages array for OpenRouter
    const systemPrompt = process.env.CHATBOT_SYSTEM_PROMPT ||
      "You are a helpful medical assistant for Smart Clinic. Help patients with general health questions, clinic information, and appointment guidance. Never provide specific medical diagnoses or prescriptions. Always recommend consulting a doctor for serious concerns.";

    const messages = [
      { role: "system", content: systemPrompt },
      ...(Array.isArray(history) ? history.slice(-6) : []), // last 6 messages for context
      { role: "user", content: message },
    ];

    // 6. Call OpenRouter
    const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.SITE_URL || "https://smart-clinic.vercel.app",
        "X-Title": "Smart Clinic Chatbot",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",
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
    const reply = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    // 7. Return response + remaining count
    return res.status(200).json({
      reply,
      remaining: limitResult.remaining,
    });

  } catch (err) {
    console.error("chatbot error:", err);

    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired, please re-login" });
    }
    if (err.code === "auth/argument-error") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}