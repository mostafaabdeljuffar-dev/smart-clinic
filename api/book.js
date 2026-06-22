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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { idToken, slotId, clinicId, date, time } = req.body;
  if (!idToken || !slotId || !clinicId || !date || !time)
    return res.status(400).json({ error: "Missing fields" });

  // Verify token
  let uid, patientName;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
    patientName = decoded.name || decoded.email || "Unknown";
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let queueNumber = 0;
    const slotRef = db.collection("clinicSlots").doc(slotId);

    await db.runTransaction(async (tx) => {
      const ss = await tx.get(slotRef);
      if (!ss.exists) throw new Error("Slot no longer exists.");

      const sd = ss.data();
      if (!sd.isAvailable) throw new Error("SLOT_UNAVAILABLE");

      const cap = sd.capacity ?? 0, maxCap = sd.maxCapacity ?? 10;
      if (cap >= maxCap) throw new Error("SLOT_FULL");

      // Check existing appointment
      const ex = await db.collection("appointments")
        .where("patientId", "==", uid)
        .where("status", "==", "upcoming")
        .get();
      if (!ex.empty) throw new Error("EXISTING");

      // Calculate queue
      const qs = await db.collection("appointments")
        .where("clinicId", "==", clinicId)
        .where("date", "==", date)
        .get();
      queueNumber = qs.size + 1;

      const newCap = cap + 1;
      tx.update(slotRef, { capacity: newCap, ...(newCap >= maxCap ? { isAvailable: false } : {}) });
      tx.set(db.collection("appointments").doc(), {
        clinicId, patientId: uid, patientName,
        slotId, date, time, queueNumber,
        status: "upcoming",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.status(200).json({ queueNumber });
  } catch (err) {
    const msg = err.message;
    if (msg === "EXISTING") return res.status(409).json({ error: "EXISTING" });
    if (msg === "SLOT_FULL") return res.status(409).json({ error: "SLOT_FULL" });
    if (msg === "SLOT_UNAVAILABLE") return res.status(409).json({ error: "SLOT_UNAVAILABLE" });
    return res.status(500).json({ error: msg });
  }
}