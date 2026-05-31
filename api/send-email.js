const admin = require("firebase-admin");

// ── Initialize Firebase Admin (once) ─────────────────────────────────────────
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, "\n")
  );
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDateLong = (d) =>
  new Date(d + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

const formatClinicName = (id) =>
  id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// ── Handler ───────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { idToken, appointmentId, type } = req.body;

  if (!idToken || !appointmentId || !type) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (type !== "confirm" && type !== "cancel") {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    // 1. Verify Firebase ID Token
    const decoded = await admin.auth().verifyIdToken(idToken);
    const doctorUid = decoded.uid;

    // 2. Check role = "doctor"
    const doctorSnap = await db.collection("doctors").doc(doctorUid).get();
    if (!doctorSnap.exists || doctorSnap.data().role !== "doctor") {
      return res.status(403).json({ error: "Not authorized" });
    }
    const clinicId = doctorSnap.data().clinicId;

    // 3. Fetch appointment
    const apptSnap = await db.collection("appointments").doc(appointmentId).get();
    if (!apptSnap.exists) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    const appt = apptSnap.data();

    // 4. Confirm appointment belongs to this clinic
    if (appt.clinicId !== clinicId) {
      return res.status(403).json({ error: "Appointment does not belong to your clinic" });
    }

    // 5. Fetch patient email
    const patientSnap = await db.collection("users").doc(appt.patientId).get();
    if (!patientSnap.exists) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const patientEmail = patientSnap.data().email;
    if (!patientEmail) {
      return res.status(400).json({ error: "Patient has no email" });
    }

    // 6. Send via EmailJS REST API
    const templateId = type === "confirm"
      ? process.env.EMAILJS_TEMPLATE_CONFIRM
      : process.env.EMAILJS_TEMPLATE_CANCEL;

    const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id:  process.env.EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id:     process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email:     patientEmail,
          patient_name: appt.patientName,
          clinic_name:  formatClinicName(clinicId),
          date:         formatDateLong(appt.date),
          time:         appt.time,
          queue:        appt.queueNumber ?? "",
        },
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("EmailJS error:", errText);
      return res.status(200).json({ success: true, emailSent: false });
    }

    return res.status(200).json({ success: true, emailSent: true });

  } catch (err) {
    console.error("send-email error:", err);

    if (err.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired, please re-login" });
    }
    if (err.code === "auth/argument-error") {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
};