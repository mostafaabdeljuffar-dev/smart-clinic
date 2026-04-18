import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import {
  collection, query, where, onSnapshot, updateDoc,
  doc, getDocs, getDoc, runTransaction, serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Loader2, ChevronLeft, CalendarDays, Clock, CheckCircle2,
  LayoutDashboard, XCircle, AlertCircle, Sparkles, Globe, Sun, Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ─── Google Font ─────────────────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);
}

/* ─── i18n ────────────────────────────────────────────────────────────────── */
const T = {
  en: {
    dir: "ltr" as const,
    tag: "Smart Clinic",
    h1a: "Book Your", h1b: "Appointment",
    heroSub: "16 clinics · 6 days a week · Instant confirmation",
    bookingH2: "Select a Slot", bookingSub: "Pick a date and time that works for you",
    successH1a: "Booking", successH1b: "Confirmed ✓",
    successSub: "Your queue number is reserved — see you soon!",
    chooseClinic: "Choose a Clinic", bookNow: "Book now",
    selectDate: "Select Date", friExcluded: "Fri excluded", selectTime: "Select Time",
    summaryTitle: "Appointment Summary",
    date: "Date", time: "Time", spotsLeft: "Spots Left",
    confirmBtn: "Confirm Booking →",
    existingWarn: "You already have an appointment at", cancelFirst: "Cancel it first.",
    upcoming: "Upcoming Appointment", queue: "Queue", cancel: "Cancel",
    noAppt: "No upcoming appointments", noApptSub: "Pick a clinic below to get started",
    confirmTitle: "Confirm Booking", clinic: "Clinic", confirm: "Confirm", back: "Back",
    oneAppt: "One active appointment at a time.",
    cancelTitle: "Cancel Appointment", keepIt: "Keep it", yesCancel: "Yes, Cancel",
    slotFreed: "Slot will be freed and queue adjusted automatically.",
    backToClinics: "Back to Clinics", youreBooked: "You're Booked!",
    apptConfirmed: "Your appointment is confirmed", yourQueue: "Your Queue #",
    slots: "slots", left: "left", loading: "Loading available slots...",
    noSlots: "No available slots right now", noSlotsSub: "Please check back later",
    dashboard: "Dashboard", backLabel: "Back to clinics",
    cancelling: "Cancelling...", booking: "Booking...",
    allClinics: "All specialties", clinicsLabel: "clinics",
  },
  ar: {
    dir: "rtl" as const,
    tag: "عيادة ذكية",
    h1a: "احجز", h1b: "موعدك",
    heroSub: "١٦ عيادة · ٦ أيام أسبوعيًا · تأكيد فوري",
    bookingH2: "اختر ميعادًا", bookingSub: "اختر التاريخ والوقت المناسب لك",
    successH1a: "تم الحجز", successH1b: "بنجاح ✓",
    successSub: "رقمك في الطابور محجوز — نراك قريبًا!",
    chooseClinic: "اختر العيادة", bookNow: "احجز الآن",
    selectDate: "اختر التاريخ", friExcluded: "الجمعة مستثناة", selectTime: "اختر الوقت",
    summaryTitle: "ملخص الحجز",
    date: "التاريخ", time: "الوقت", spotsLeft: "المقاعد المتبقية",
    confirmBtn: "تأكيد الحجز ←",
    existingWarn: "لديك بالفعل موعد في", cancelFirst: "يُرجى إلغاؤه أولًا.",
    upcoming: "الموعد القادم", queue: "طابور", cancel: "إلغاء",
    noAppt: "لا توجد مواعيد قادمة", noApptSub: "اختر عيادة أدناه للبدء",
    confirmTitle: "تأكيد الحجز", clinic: "العيادة", confirm: "تأكيد", back: "رجوع",
    oneAppt: "موعد نشط واحد فقط في كل مرة.",
    cancelTitle: "إلغاء الموعد", keepIt: "احتفظ به", yesCancel: "نعم، إلغاء",
    slotFreed: "سيُحرَّر المكان وتُعدَّل الأرقام تلقائيًا.",
    backToClinics: "العودة للعيادات", youreBooked: "تم الحجز!",
    apptConfirmed: "موعدك مؤكد", yourQueue: "رقمك في الطابور",
    slots: "مواعيد", left: "متبقٍ", loading: "جارٍ تحميل المواعيد...",
    noSlots: "لا توجد مواعيد متاحة الآن", noSlotsSub: "يُرجى المراجعة لاحقًا",
    dashboard: "لوحة التحكم", backLabel: "العودة للعيادات",
    cancelling: "جارٍ الإلغاء...", booking: "جارٍ الحجز...",
    allClinics: "جميع التخصصات", clinicsLabel: "عيادة",
  },
};

/* ─── Clinics ─────────────────────────────────────────────────────────────── */
const CLINICS = [
  { id: "cardio_clinic",            en: "Cardiology",           ar: "القلب",            icon: "🫀", grad: "from-rose-500 to-pink-600",     glow: "#f43f5e" },
  { id: "chest_clinic",             en: "Chest",                ar: "الصدر",            icon: "🫁", grad: "from-sky-500 to-blue-600",      glow: "#0ea5e9" },
  { id: "dental_clinic",            en: "Dental",               ar: "الأسنان",          icon: "🦷", grad: "from-teal-500 to-cyan-600",     glow: "#14b8a6" },
  { id: "derma_clinic",             en: "Dermatology",          ar: "الجلدية",          icon: "✨", grad: "from-amber-500 to-orange-500",  glow: "#f59e0b" },
  { id: "ent_clinic",               en: "ENT",                  ar: "أنف وأذن وحنجرة",  icon: "👂", grad: "from-violet-500 to-purple-600", glow: "#8b5cf6" },
  { id: "eye_clinic",               en: "Eye",                  ar: "العيون",           icon: "👁️", grad: "from-indigo-500 to-blue-600",   glow: "#6366f1" },
  { id: "gynecology_clinic",        en: "Gynecology",           ar: "النساء والتوليد",  icon: "🌸", grad: "from-pink-500 to-rose-500",     glow: "#ec4899" },
  { id: "internal_medicine_female", en: "Internal (F)",         ar: "باطنة نساء",       icon: "💊", grad: "from-fuchsia-500 to-pink-600",  glow: "#d946ef" },
  { id: "internal_medicine_male",   en: "Internal (M)",         ar: "باطنة رجال",       icon: "💊", grad: "from-blue-500 to-indigo-600",   glow: "#3b82f6" },
  { id: "neurology_clinic",         en: "Neurology",            ar: "الأعصاب",          icon: "🧠", grad: "from-purple-500 to-violet-600", glow: "#a855f7" },
  { id: "neurosurgery_clinic",      en: "Neurosurgery",         ar: "جراحة الأعصاب",    icon: "⚕️", grad: "from-slate-500 to-gray-600",    glow: "#64748b" },
  { id: "nutrition_clinic",         en: "Nutrition",            ar: "التغذية",          icon: "🥗", grad: "from-green-500 to-emerald-600", glow: "#22c55e" },
  { id: "orthopedic_clinic",        en: "Orthopedic",           ar: "العظام",           icon: "🦴", grad: "from-orange-500 to-amber-600",  glow: "#f97316" },
  { id: "physiotherapy_clinic",     en: "Physiotherapy",        ar: "العلاج الطبيعي",   icon: "🏃", grad: "from-lime-500 to-green-600",    glow: "#84cc16" },
  { id: "surgery_clinic",           en: "Surgery",              ar: "الجراحة",          icon: "🔬", grad: "from-red-500 to-rose-600",      glow: "#ef4444" },
  { id: "urology_clinic",           en: "Urology",              ar: "المسالك البولية",  icon: "💧", grad: "from-cyan-500 to-sky-600",      glow: "#06b6d4" },
];

type Slot = { id: string; time: string; date: string; capacity: number; maxCapacity: number };
type SlotsByDate = Record<string, Slot[]>;
type Step = "clinics" | "booking" | "success";
type Lang = "en" | "ar";
type Theme = "dark" | "light";
type ActiveAppt = {
  id: string; clinicId: string; clinicName: string; clinicIcon: string;
  date: string; time: string; queueNumber: number; slotId: string;
};

const fmtDate = (d: string, lang: Lang) =>
  new Date(d + "T00:00:00").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

const cName = (c: typeof CLINICS[0] | null | undefined, lang: Lang) =>
  c ? (lang === "ar" ? c.ar : c.en) : "";

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [lang, setLang]     = useState<Lang>("ar");
  const [theme, setTheme]   = useState<Theme>("light");
  const t   = T[lang];
  const dk  = theme === "dark";
  const isRtl = lang === "ar";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState<(typeof CLINICS)[0] | null>(null);
  const [slotsByDate, setSlotsByDate]       = useState<SlotsByDate>({});
  const [slotsLoading, setSlotsLoading]     = useState(false);
  const [selectedDate, setSelectedDate]     = useState("");
  const [selectedSlot, setSelectedSlot]     = useState<Slot | null>(null);

  const [step, setStep]                           = useState<Step>("clinics");
  const [booking, setBooking]                     = useState(false);
  const [showConfirm, setShowConfirm]             = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]               = useState(false);
  const [activeAppt, setActiveAppt]               = useState<ActiveAppt | null>(null);
  const [apptLoading, setApptLoading]             = useState(false);
  const [successInfo, setSuccessInfo] = useState<{
    queueNumber: number; clinicName: string; clinicIcon: string; date: string; time: string;
  } | null>(null);

  /* ── Auth ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const dd = await getDoc(doc(db, "doctors", user.uid));
          if (dd.exists() && dd.data().role === "doctor") { navigate("/doctor-dashboard", { replace: true }); return; }
          const ud = await getDoc(doc(db, "users", user.uid));
          if (ud.exists()) {
            const r = ud.data().role;
            if (r === "admin") setIsAdmin(true);
            else if (r !== "patient") { navigate("/unauthorized", { replace: true }); return; }
          }
        } catch (_) {}
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [navigate]);

  /* ── Active appointment ────────────────────────────────────────────────── */
  const fetchActive = useCallback(async () => {
    if (!currentUser) return;
    setApptLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, "appointments"),
        where("patientId", "==", currentUser.uid),
        where("status", "==", "upcoming")
      ));
      if (!snap.empty) {
        const d = snap.docs[0]; const data = d.data();
        const clinic = CLINICS.find((c) => c.id === data.clinicId);
        setActiveAppt({
          id: d.id, clinicId: data.clinicId,
          clinicName: cName(clinic, lang),
          clinicIcon: clinic?.icon ?? "🏥",
          date: data.date, time: data.time,
          queueNumber: data.queueNumber, slotId: data.slotId,
        });
      } else setActiveAppt(null);
    } catch (_) {}
    setApptLoading(false);
  }, [currentUser, lang]);

  useEffect(() => { if (currentUser) fetchActive(); }, [currentUser, fetchActive]);

  /* ── Slots listener ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!selectedClinic) return;
    setSlotsLoading(true); setSlotsByDate({}); setSelectedDate(""); setSelectedSlot(null);
    const unsub = onSnapshot(
      query(collection(db, "clinicSlots"), where("clinicId", "==", selectedClinic.id), where("isAvailable", "==", true)),
      (snap) => {
        const g: SlotsByDate = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (new Date(data.date + "T00:00:00").getDay() === 5) return;
          const s: Slot = { id: d.id, time: data.time, date: data.date, capacity: data.capacity ?? 0, maxCapacity: data.maxCapacity ?? 10 };
          if (!g[data.date]) g[data.date] = [];
          g[data.date].push(s);
        });
        const toMin = (tt: string) => { const [tm, p] = tt.split(" "); let [h, m] = tm.split(":").map(Number); if (p === "PM" && h !== 12) h += 12; if (p === "AM" && h === 12) h = 0; return h * 60 + m; };
        Object.values(g).forEach((s) => s.sort((a, b) => toMin(a.time) - toMin(b.time)));
        setSlotsByDate(g); setSlotsLoading(false);
      }
    );
    return () => unsub();
  }, [selectedClinic]);

  const sortedDates = Object.keys(slotsByDate).filter((d) => new Date(d + "T00:00:00").getDay() !== 5).sort().slice(0, 7);

  /* ── Book ──────────────────────────────────────────────────────────────── */
  const handleBook = async () => {
    if (!currentUser || !selectedClinic || !selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const slotRef = doc(db, "clinicSlots", selectedSlot.id);
      let queueNumber = 0;
      await runTransaction(db, async (tx) => {
        const ss = await tx.get(slotRef);
        if (!ss.exists()) throw new Error("Slot no longer exists.");
        const sd = ss.data();
        if (!sd.isAvailable) throw new Error(lang === "ar" ? "هذا الموعد لم يعد متاحًا." : "This slot is no longer available.");
        const cap = sd.capacity ?? 0, maxCap = sd.maxCapacity ?? 10;
        if (cap >= maxCap) throw new Error(lang === "ar" ? "هذا الموعد ممتلئ." : "This slot is fully booked.");
        const ex = await getDocs(query(collection(db, "appointments"), where("patientId", "==", currentUser.uid), where("status", "==", "upcoming")));
        if (!ex.empty) throw new Error("EXISTING");
        const qs = await getDocs(query(collection(db, "appointments"), where("clinicId", "==", selectedClinic.id), where("date", "==", selectedDate)));
        queueNumber = qs.size + 1;
        const newCap = cap + 1;
        tx.update(slotRef, { capacity: newCap, ...(newCap >= maxCap ? { isAvailable: false } : {}) });
        tx.set(doc(collection(db, "appointments")), {
          clinicId: selectedClinic.id, patientId: currentUser.uid,
          patientName: currentUser.displayName ?? currentUser.email,
          slotId: selectedSlot.id, date: selectedDate, time: selectedSlot.time,
          queueNumber, status: "upcoming", createdAt: serverTimestamp(),
        });
      });
      setSuccessInfo({ queueNumber, clinicIcon: selectedClinic.icon, clinicName: cName(selectedClinic, lang), date: selectedDate, time: selectedSlot.time });
      setShowConfirm(false); setStep("success"); await fetchActive();
    } catch (err: any) {
      setShowConfirm(false);
      if (err.message === "EXISTING") alert(lang === "ar" ? "لديك موعد قائم بالفعل. يُرجى إلغاؤه أولًا." : "You already have an upcoming appointment.");
      else alert(err.message || (lang === "ar" ? "فشل الحجز." : "Booking failed."));
    } finally { setBooking(false); }
  };

  /* ── Cancel ────────────────────────────────────────────────────────────── */
  const handleCancel = async () => {
    if (!activeAppt) return;
    setCancelling(true);
    try {
      const slotRef = doc(db, "clinicSlots", activeAppt.slotId);
      await runTransaction(db, async (tx) => {
        const ss = await tx.get(slotRef);
        tx.delete(doc(db, "appointments", activeAppt.id));
        if (ss.exists()) tx.update(slotRef, { capacity: Math.max(0, (ss.data().capacity ?? 0) - 1), isAvailable: true });
      });
      const rem = await getDocs(query(collection(db, "appointments"), where("clinicId", "==", activeAppt.clinicId), where("date", "==", activeAppt.date), where("status", "==", "upcoming")));
      const sorted = rem.docs.map((d) => ({ ref: d.ref, q: d.data().queueNumber as number })).sort((a, b) => a.q - b.q);
      await Promise.all(sorted.map((item, i) => updateDoc(item.ref, { queueNumber: i + 1 })));
      setActiveAppt(null); setShowCancelConfirm(false);
    } catch (err: any) { alert(err.message); }
    finally { setCancelling(false); }
  };

  const resetAll = () => { setSelectedClinic(null); setSelectedDate(""); setSelectedSlot(null); setSuccessInfo(null); setStep("clinics"); fetchActive(); };

  /* ── Theme tokens ──────────────────────────────────────────────────────── */
  // bg colors
  const pageBg      = dk ? "#06091a"   : "#f0f4f9";
  const cardBg      = dk ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder  = dk ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const textPrimary = dk ? "rgba(255,255,255,0.85)" : "#1a3a60";
  const textMuted   = dk ? "rgba(255,255,255,0.35)" : "#6b7280";
  const textFaint   = dk ? "rgba(255,255,255,0.18)" : "#9ca3af";

  /* ── Loading ───────────────────────────────────────────────────────────── */
  if (!authChecked) return (
    <div className="h-screen flex items-center justify-center" style={{ background: dk ? "radial-gradient(ellipse at center,#0d1f3c,#06091a)" : "#f0f4f9", fontFamily: "Cairo, sans-serif" }}>
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: dk ? "rgba(255,255,255,.05)" : "#e0eaf6", border: `1px solid ${cardBorder}` }}>
          <Loader2 className="animate-spin" size={26} style={{ color: dk ? "#60a5fa" : "#185ba5" }} />
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div dir={t.dir} style={{ fontFamily: "Cairo, sans-serif", background: pageBg, minHeight: "100vh", color: textPrimary, transition: "background .3s,color .3s" }}>

      {/* ── Global CSS ── */}
      <style>{`
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes floatUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseRing{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.4);opacity:0}}
        .clinic-card{animation:floatUp .4s ease both}
        .queue-num{background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 30%,#fde68a 60%,#fbbf24 100%);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
      `}</style>

      {/* ── Dark mode ambient orbs ── */}
      {dk && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div style={{ position:"absolute", top:"-10%", left:"15%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,.12) 0%,transparent 70%)", animation:"pulseRing 7s ease-in-out infinite" }} />
          <div style={{ position:"absolute", top:"40%", right:"-8%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,.10) 0%,transparent 70%)", animation:"pulseRing 9s ease-in-out infinite", animationDelay:"3s" }} />
          <div style={{ position:"absolute", bottom:"5%", left:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(6,182,212,.08) 0%,transparent 70%)", animation:"pulseRing 11s ease-in-out infinite", animationDelay:"5s" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        </div>
      )}

      {/* ── Admin bar ── */}
      {isAdmin && (
        <div className="relative z-10 py-2 px-6 flex justify-end" style={{ background: dk ? "rgba(0,0,0,.2)" : "#1a3a60", backdropFilter: dk ? "blur(8px)" : "none", borderBottom: `1px solid ${cardBorder}` }}>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all border"
            style={{ background: dk ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.15)", color: "white", borderColor: dk ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.25)" }}>
            <LayoutDashboard size={14} /> {t.dashboard}
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <div className="relative z-10" style={{ background: dk ? "transparent" : "linear-gradient(135deg,#0f2544 0%,#1a3a60 50%,#185ba5 100%)" }}>
        {dk && <div className="absolute top-0 left-0 right-0 h-px" style={{ background:"linear-gradient(90deg,transparent,rgba(96,165,250,.4),rgba(167,139,250,.4),transparent)" }} />}

        <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
          {/* Top nav row */}
          <div className={`flex items-center justify-between mb-10 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div>
              {step !== "clinics" ? (
                <button onClick={resetAll} className={`flex items-center gap-1.5 text-sm transition-colors group ${isRtl ? "flex-row-reverse" : ""}`}
                  style={{ color: dk ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.7)" }}>
                  <ChevronLeft size={15} className={`transition-transform ${isRtl ? "rotate-180" : ""}`} />
                  {t.backLabel}
                </button>
              ) : <div />}
            </div>

            {/* Controls: theme + lang */}
            <div className={`flex items-center gap-2 ${isRtl ? "flex-row-reverse" : ""}`}>
              {/* Theme toggle */}
              <button onClick={() => setTheme(dk ? "light" : "dark")}
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full transition-all border backdrop-blur-sm"
                style={{ background: dk ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.15)", color: dk ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.9)", borderColor: dk ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.3)" }}>
                {dk ? <Sun size={14} /> : <Moon size={14} />}
                {dk ? (lang === "ar" ? "فاتح" : "Light") : (lang === "ar" ? "داكن" : "Dark")}
              </button>

              {/* Lang toggle */}
              <button onClick={() => setLang(lang === "en" ? "ar" : "en")}
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full transition-all border backdrop-blur-sm"
                style={{ background: dk ? "rgba(255,255,255,.05)" : "rgba(255,255,255,.15)", color: dk ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.9)", borderColor: dk ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.3)" }}>
                <Globe size={13} />
                {lang === "en" ? "عربي" : "English"}
              </button>
            </div>
          </div>

          {/* Hero text */}
          <div className={`flex items-end justify-between gap-6 ${isRtl ? "flex-row-reverse" : ""}`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: dk ? "rgba(59,130,246,.1)" : "rgba(255,255,255,.15)", color: dk ? "#93c5fd" : "white", border: `1px solid ${dk ? "rgba(59,130,246,.15)" : "rgba(255,255,255,.25)"}` }}>
                <Sparkles size={11} /> {t.tag}
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight" style={{ color: "white" }}>
                {step === "clinics" && (
                  <>{t.h1a} <span style={{ background:"linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{t.h1b}</span></>
                )}
                {step === "booking" && (
                  <>{selectedClinic?.icon} {cName(selectedClinic, lang)}<br />
                  <span style={{ color: "#93c5fd", fontSize: "1.4rem", fontWeight: 700 }}>{t.bookingH2}</span></>
                )}
                {step === "success" && (
                  <>{t.successH1a} <span style={{ color: "#4ade80" }}>{t.successH1b}</span></>
                )}
              </h1>

              <p className="text-sm" style={{ color: dk ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.75)" }}>
                {step === "clinics" && t.heroSub}
                {step === "booking" && t.bookingSub}
                {step === "success" && t.successSub}
              </p>
            </div>

            {step === "clinics" && (
              <div className={`hidden sm:flex flex-col gap-0.5 flex-shrink-0 ${isRtl ? "items-start" : "items-end"}`}>
                <p className="text-xs" style={{ color: dk ? "rgba(255,255,255,.2)" : "rgba(255,255,255,.5)" }}>{t.allClinics}</p>
                <p className="text-6xl font-black text-white leading-none">16</p>
                <p className="text-sm font-bold" style={{ color: dk ? "#60a5fa" : "#93c5fd" }}>{t.clinicsLabel}</p>
              </div>
            )}
          </div>
        </div>

        {/* Hero fade-out bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: `linear-gradient(to bottom,transparent,${pageBg})` }} />
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20 space-y-4">

        {/* Active appointment banner */}
        {step === "clinics" && currentUser && (
          apptLoading ? (
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="w-8 h-8 rounded-xl animate-pulse" style={{ background: cardBorder }} />
              <div className="h-3 rounded w-40 animate-pulse" style={{ background: cardBorder }} />
            </div>
          ) : activeAppt ? (
            <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: dk ? "rgba(59,130,246,.05)" : "linear-gradient(135deg,#1a3a60,#185ba5)", border: dk ? "1px solid rgba(59,130,246,.2)" : "none" }}>
              {!dk && <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
              <div className={`relative flex items-start justify-between gap-4 flex-wrap ${isRtl ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-start gap-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                  <div className="text-3xl leading-none mt-1 flex-shrink-0">{activeAppt.clinicIcon}</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: dk ? "#60a5fa" : "rgba(255,255,255,.7)" }}>{t.upcoming}</p>
                    <p className="font-black text-lg text-white">{activeAppt.clinicName}</p>
                    <div className={`flex flex-wrap items-center gap-2 mt-2 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.75)" }}>
                        <CalendarDays size={10} /> {fmtDate(activeAppt.date, lang)}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background:"rgba(255,255,255,.12)", color:"rgba(255,255,255,.75)" }}>
                        <Clock size={10} /> {activeAppt.time}
                      </span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ background:"rgba(234,179,8,.15)", color:"#fde047", border:"1px solid rgba(234,179,8,.2)" }}>
                        {t.queue} #{activeAppt.queueNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowCancelConfirm(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 transition-all flex-shrink-0"
                  style={{ background:"rgba(239,68,68,.15)", color:"#fca5a5", border:"1px solid rgba(239,68,68,.2)" }}>
                  <XCircle size={13} /> {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(34,197,94,.1)", border:"1px solid rgba(34,197,94,.15)" }}>
                <CheckCircle2 size={16} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>{t.noAppt}</p>
                <p className="text-xs mt-0.5" style={{ color: textFaint }}>{t.noApptSub}</p>
              </div>
            </div>
          )
        )}

        {/* ── Step 1: Clinics ── */}
        {step === "clinics" && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-4" style={{ color: textFaint }}>{t.chooseClinic}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CLINICS.map((clinic, i) => (
                <button key={clinic.id}
                  onClick={() => { if (!currentUser) { navigate("/login"); return; } setSelectedClinic(clinic); setStep("booking"); }}
                  className="clinic-card group relative rounded-2xl p-5 text-left overflow-hidden transition-all duration-250 hover:-translate-y-1.5"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}`, animationDelay: `${i * 30}ms` }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                    style={{ background:`radial-gradient(circle at 30% 30%,${clinic.glow}22 0%,transparent 70%)` }} />
                  <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${clinic.grad} opacity-0 group-hover:opacity-80 transition-opacity duration-300`} />

                  <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${clinic.grad} flex items-center justify-center mb-3.5 text-2xl transition-all duration-250 group-hover:scale-110`}
                    style={{ boxShadow:`0 4px 20px ${clinic.glow}44` }}>
                    {clinic.icon}
                  </div>
                  <p className="relative font-bold text-sm leading-snug transition-colors" style={{ color: textPrimary }}>{cName(clinic, lang)}</p>
                  <p className={`relative text-xs mt-1.5 flex items-center gap-1 transition-colors ${isRtl ? "flex-row-reverse" : ""}`} style={{ color: textMuted }}>
                    {t.bookNow} <span className="inline-block">{isRtl ? "←" : "→"}</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Booking ── */}
        {step === "booking" && selectedClinic && (
          <div className="space-y-4">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="animate-spin" size={30} style={{ color: dk ? "#60a5fa" : "#185ba5" }} />
                <p className="text-sm" style={{ color: textMuted }}>{t.loading}</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="rounded-2xl p-12 text-center" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <CalendarDays size={38} className="mx-auto mb-3" style={{ color: textFaint }} />
                <p className="font-semibold" style={{ color: textMuted }}>{t.noSlots}</p>
                <p className="text-sm mt-1" style={{ color: textFaint }}>{t.noSlotsSub}</p>
              </div>
            ) : (
              <>
                {/* Date selector */}
                <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                  <div className={`flex items-center gap-2 mb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dk ? "rgba(59,130,246,.15)" : "#eff6ff", border: "1px solid rgba(59,130,246,.15)" }}>
                      <CalendarDays size={14} style={{ color: dk ? "#60a5fa" : "#185ba5" }} />
                    </div>
                    <h2 className="font-bold text-sm" style={{ color: textPrimary }}>{t.selectDate}</h2>
                    <span className="text-xs" style={{ color: textFaint }}>· {t.friExcluded}</span>
                  </div>
                  <div className={`flex gap-2.5 overflow-x-auto pb-1 ${isRtl ? "flex-row-reverse" : ""}`}>
                    {sortedDates.map((date) => {
                      const d = new Date(date + "T00:00:00");
                      const isSel = selectedDate === date;
                      const count = slotsByDate[date]?.length ?? 0;
                      return (
                        <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                          className="flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 min-w-[70px] border transition-all duration-200"
                          style={isSel
                            ? { background:"linear-gradient(to bottom,#3b82f6,#1d4ed8)", borderColor:"rgba(59,130,246,.4)", color:"white", transform:"scale(1.05)", boxShadow:"0 8px 24px rgba(59,130,246,.35)" }
                            : { background: dk ? "rgba(255,255,255,.04)" : "white", borderColor: cardBorder, color: textMuted }
                          }>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: isSel ? "rgba(147,197,253,1)" : textFaint }}>
                            {d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", { weekday:"short" })}
                          </span>
                          <span className="text-2xl font-black leading-tight">{d.getDate()}</span>
                          <span className="text-[10px]" style={{ color: isSel ? "rgba(147,197,253,1)" : textFaint }}>
                            {d.toLocaleDateString(isRtl ? "ar-EG" : "en-US", { month:"short" })}
                          </span>
                          <span className="text-[10px] mt-1 font-bold" style={{ color: isSel ? "#fde047" : "#3b82f6" }}>{count} {t.slots}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time selector */}
                {selectedDate && (
                  <div className="rounded-2xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className={`flex items-center gap-2 mb-4 ${isRtl ? "flex-row-reverse" : ""}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: dk ? "rgba(139,92,246,.15)" : "#f5f3ff", border:"1px solid rgba(139,92,246,.15)" }}>
                        <Clock size={14} style={{ color: dk ? "#a78bfa" : "#7c3aed" }} />
                      </div>
                      <h2 className="font-bold text-sm" style={{ color: textPrimary }}>{t.selectTime}</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {(slotsByDate[selectedDate] ?? []).map((slot) => {
                        const isSel = selectedSlot?.id === slot.id;
                        const left = slot.maxCapacity - slot.capacity;
                        return (
                          <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                            className="flex flex-col items-center rounded-xl border px-3 py-3.5 transition-all duration-200"
                            style={isSel
                              ? { background:"linear-gradient(to bottom,#7c3aed,#5b21b6)", borderColor:"rgba(139,92,246,.4)", color:"white", transform:"scale(1.05)", boxShadow:"0 8px 20px rgba(139,92,246,.35)" }
                              : { background: dk ? "rgba(255,255,255,.04)" : "white", borderColor: cardBorder, color: textMuted }
                            }>
                            <span className="text-sm font-bold">{slot.time}</span>
                            <span className="text-[10px] mt-1 font-semibold" style={{ color: isSel ? "rgba(196,181,253,1)" : left <= 3 ? "#f97316" : textFaint }}>{left} {t.left}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedDate && selectedSlot && (
                  <div className="relative overflow-hidden rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className={`h-[3px] bg-gradient-to-r ${selectedClinic.grad}`} />
                    <div className="absolute inset-0 pointer-events-none" style={{ background:`radial-gradient(ellipse at top left,${selectedClinic.glow}12 0%,transparent 60%)` }} />
                    <div className="relative p-6">
                      <div className={`flex items-center gap-3 mb-6 ${isRtl ? "flex-row-reverse" : ""}`}>
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedClinic.grad} flex items-center justify-center text-2xl`}
                          style={{ boxShadow:`0 6px 24px ${selectedClinic.glow}55` }}>
                          {selectedClinic.icon}
                        </div>
                        <div className={isRtl ? "text-right" : ""}>
                          <p className="text-xs" style={{ color: textFaint }}>{t.summaryTitle}</p>
                          <p className="font-black text-xl" style={{ color: textPrimary }}>{cName(selectedClinic, lang)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          { label: t.date, value: fmtDate(selectedDate, lang), icon: <CalendarDays size={12} /> },
                          { label: t.time, value: selectedSlot.time, icon: <Clock size={12} /> },
                          { label: t.spotsLeft, value: `${selectedSlot.maxCapacity - selectedSlot.capacity}/${selectedSlot.maxCapacity}`, icon: <Sparkles size={12} /> },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="rounded-xl p-3 text-center" style={{ background: dk ? "rgba(255,255,255,.05)" : "#f9fafb", border: `1px solid ${cardBorder}` }}>
                            <div className={`flex items-center justify-center gap-1 mb-1 ${isRtl ? "flex-row-reverse" : ""}`} style={{ color: textFaint }}>
                              {icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                            </div>
                            <p className="font-bold text-sm" style={{ color: textPrimary }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {activeAppt ? (
                        <div className={`flex items-start gap-2 rounded-xl p-3 text-xs ${isRtl ? "flex-row-reverse text-right" : ""}`}
                          style={{ background:"rgba(245,158,11,.08)", border:"1px solid rgba(245,158,11,.18)", color:"#fbbf24" }}>
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          <span>{t.existingWarn} <strong>{activeAppt.clinicName}</strong>. {t.cancelFirst}</span>
                        </div>
                      ) : (
                        <button onClick={() => setShowConfirm(true)}
                          className={`relative w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r ${selectedClinic.grad} overflow-hidden group transition-all active:scale-[0.98]`}
                          style={{ boxShadow:`0 8px 28px ${selectedClinic.glow}55` }}>
                          <span className="relative z-10">{t.confirmBtn}</span>
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === "success" && successInfo && (
          <div className="flex items-center justify-center py-6">
            <div className="relative overflow-hidden rounded-3xl p-8 text-center max-w-sm w-full" style={{ background: dk ? "rgba(255,255,255,.03)" : "white", border: `1px solid ${dk ? "rgba(255,255,255,.12)" : "#e5e7eb"}`, boxShadow: dk ? "none" : "0 20px 60px rgba(0,0,0,.08)" }}>
              {!dk && <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-white pointer-events-none rounded-3xl" />}
              {dk && <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/4 pointer-events-none" />}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background:"linear-gradient(90deg,transparent,rgba(34,197,94,.5),transparent)" }} />
              <div className="relative">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-500/20" style={{ animation:"pulseRing 2s ease-in-out infinite" }} />
                  <div className="absolute inset-3 rounded-full bg-green-500/10" style={{ animation:"pulseRing 2.5s ease-in-out infinite", animationDelay:".4s" }} />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center" style={{ boxShadow:"0 8px 32px rgba(34,197,94,.4)" }}>
                    <span className="text-4xl">{successInfo.clinicIcon}</span>
                  </div>
                </div>
                <h2 className="text-3xl font-black mb-1" style={{ color: textPrimary }}>{t.youreBooked}</h2>
                <p className="text-sm mb-6" style={{ color: textMuted }}>{t.apptConfirmed}</p>
                <div className="rounded-2xl p-5 mb-5 space-y-3" style={{ background: dk ? "rgba(0,0,0,.3)" : "linear-gradient(135deg,#0f2544,#185ba5)" }}>
                  {[
                    { label: t.clinic, value: successInfo.clinicName },
                    { label: t.date, value: fmtDate(successInfo.date, lang) },
                    { label: t.time, value: successInfo.time },
                  ].map(({ label, value }) => (
                    <div key={label} className={`flex justify-between text-sm ${isRtl ? "flex-row-reverse" : ""}`}>
                      <span style={{ color:"rgba(147,197,253,.7)" }}>{label}</span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                  ))}
                  <div className={`border-t pt-3 flex justify-between items-center ${isRtl ? "flex-row-reverse" : ""}`} style={{ borderColor:"rgba(255,255,255,.1)" }}>
                    <span className="text-sm" style={{ color:"rgba(147,197,253,.7)" }}>{t.yourQueue}</span>
                    <span className="queue-num text-5xl font-black">#{successInfo.queueNumber}</span>
                  </div>
                </div>
                <button onClick={resetAll} className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{ background: dk ? "rgba(255,255,255,.04)" : "#f3f4f6", color: dk ? "rgba(255,255,255,.4)" : "#6b7280", border: `1px solid ${cardBorder}` }}>
                  {t.backToClinics}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent dir={t.dir} className="sm:max-w-sm rounded-2xl text-white" style={{ background: dk ? "#0d1a2e" : "white", border: `1px solid ${cardBorder}`, fontFamily:"Cairo, sans-serif" }}>
          <DialogHeader><DialogTitle style={{ color: textPrimary }}>{t.confirmTitle}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3 text-sm">
            <div className="rounded-xl p-4 space-y-2" style={{ background: dk ? "rgba(255,255,255,.05)" : "#f9fafb", border:`1px solid ${cardBorder}` }}>
              {[
                { label: t.clinic, value: cName(selectedClinic, lang) },
                { label: t.date,   value: selectedDate ? fmtDate(selectedDate, lang) : "" },
                { label: t.time,   value: selectedSlot?.time ?? "" },
              ].map(({ label, value }) => (
                <div key={label} className={`flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span style={{ color: textMuted }}>{label}</span>
                  <span className="font-semibold" style={{ color: textPrimary }}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: textFaint }}>{t.oneAppt}</p>
          </div>
          <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={booking}
              style={{ background:"transparent", borderColor: cardBorder, color: textMuted }}>{t.back}</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white" onClick={handleBook} disabled={booking}>
              {booking ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />{t.booking}</span> : t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel dialog ── */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent dir={t.dir} className="sm:max-w-sm rounded-2xl" style={{ background: dk ? "#0d1a2e" : "white", border:`1px solid ${cardBorder}`, fontFamily:"Cairo, sans-serif" }}>
          <DialogHeader><DialogTitle style={{ color: textPrimary }}>{t.cancelTitle}</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="rounded-xl p-4 space-y-2 text-sm mb-3" style={{ background:"rgba(239,68,68,.06)", border:"1px solid rgba(239,68,68,.15)" }}>
              {[
                { label: t.clinic, value: activeAppt?.clinicName ?? "" },
                { label: t.date,   value: activeAppt ? fmtDate(activeAppt.date, lang) : "" },
                { label: t.time,   value: activeAppt?.time ?? "" },
                { label: t.queue,  value: `#${activeAppt?.queueNumber}` },
              ].map(({ label, value }) => (
                <div key={label} className={`flex justify-between ${isRtl ? "flex-row-reverse" : ""}`}>
                  <span style={{ color: textMuted }}>{label}</span>
                  <span className="font-semibold" style={{ color: textPrimary }}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{ color: textFaint }}>{t.slotFreed}</p>
          </div>
          <div className={`flex gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={cancelling}
              style={{ background:"transparent", borderColor: cardBorder, color: textMuted }}>{t.keepIt}</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />{t.cancelling}</span> : t.yesCancel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
