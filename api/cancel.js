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

  const { idToken, appointmentId } = req.body;
  if (!idToken || !appointmentId)
    return res.status(400).json({ error: "Missing fields" });

  // Verify token
  let uid;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const apptRef = db.collection("appointments").doc(appointmentId);
    const apptSnap = await apptRef.get();

    if (!apptSnap.exists) return res.status(404).json({ error: "Appointment not found" });

    const appt = apptSnap.data();

    // تأكد إن الـ appointment بتاع اليوزر ده
    if (appt.patientId !== uid) return res.status(403).json({ error: "Forbidden" });

    const { slotId, clinicId, date } = appt;

    // حذف الـ appointment وتعديل الـ slot
    await db.runTransaction(async (tx) => {
      const slotRef = db.collection("clinicSlots").doc(slotId);
      const slotSnap = await tx.get(slotRef);

      tx.delete(apptRef);

      if (slotSnap.exists) {
        const cap = slotSnap.data().capacity ?? 0;
        tx.update(slotRef, {
          capacity: Math.max(0, cap - 1),
          isAvailable: true,
        });
      }
    });

    // إعادة ترتيب الـ queue
    const rem = await db.collection("appointments")
      .where("clinicId", "==", clinicId)
      .where("date", "==", date)
      .where("status", "==", "upcoming")
      .get();

    const sorted = rem.docs
      .map((d) => ({ ref: d.ref, q: d.data().queueNumber }))
      .sort((a, b) => a.q - b.q);

    const batch = db.batch();
    sorted.forEach((item, i) => batch.update(item.ref, { queueNumber: i + 1 }));
    await batch.commit();

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("cancel error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}