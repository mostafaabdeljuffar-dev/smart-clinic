import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage } from "@/firebase";
import {
  collection, query, where, onSnapshot, updateDoc,
  doc, getDocs, getDoc, runTransaction, serverTimestamp, setDoc,
  arrayUnion, increment, writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import {
  Loader2, ChevronLeft, CalendarDays, Clock, CheckCircle2,
  LayoutDashboard, XCircle, AlertCircle, Sparkles, Globe, Sun, Moon,
  Search, X, User, Camera, Star, StarHalf, Upload, MessageCircle,
  Send, Bot, ChevronDown, ArrowLeft, Edit3, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);
}

const T = {
  en: {
    dir: "ltr" as const,
    tag: "Smart Clinic", h1a: "Book Your", h1b: "Appointment",
    heroSub: "16 clinics · 6 days a week · Instant confirmation",
    bookingH2: "Select a Slot", bookingSub: "Pick a date and time that works for you",
    successH1a: "Booking", successH1b: "Confirmed ✓",
    successSub: "Your queue number is reserved — see you soon!",
    chooseClinic: "Choose a Clinic", bookNow: "Book now",
    selectDate: "Select Date", friExcluded: "Fri excluded", selectTime: "Select Time",
    summaryTitle: "Appointment Summary", date: "Date", time: "Time", spotsLeft: "Spots Left",
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
    searchPlaceholder: "Search clinics...", noResults: "No clinics found",
    profile: "Profile", editPhoto: "Change Photo", uploadPhoto: "Upload Photo",
    name: "Name", email: "Email", savePhoto: "Save", uploading: "Uploading...",
    photoUpdated: "Photo updated!", myProfile: "My Profile",
    rateClinic: "Rate clinic", submitReview: "Submit",
    totalReviews: "reviews", reviewPrompt: "How was your experience?",
    reviewSuccess: "Thank you for your review!", alreadyReviewed: "Already reviewed.",
    noReviews: "No reviews yet. Be the first!",
    chatTitle: "NovaMed AI", chatSubtitle: "Ask about clinics & appointments",
    chatPlaceholder: "Type your question...",
    chatWelcome: "Hello! 👋 I'm NovaMed, your Smart Clinic AI assistant. How can I help you today?",
    verified: "Verified Patient", backToBooking: "Back to Booking",
    totalAppts: "Total Appointments", availableClinics: "Available Clinics",
    profilePhoto: "Profile Photo", currentPhoto: "Current Photo",
    notUploaded: "New photo - not uploaded yet", active: "Active",
    pngJpg: "PNG, JPG up to 5MB", profileInfo: "Patient Profile",
  },
  ar: {
    dir: "rtl" as const,
    tag: "عيادة ذكية", h1a: "احجز", h1b: "موعدك",
    heroSub: "١٦ عيادة · ٦ أيام أسبوعيًا · تأكيد فوري",
    bookingH2: "اختر ميعادًا", bookingSub: "اختر التاريخ والوقت المناسب لك",
    successH1a: "تم الحجز", successH1b: "بنجاح ✓",
    successSub: "رقمك في الطابور محجوز — نراك قريبًا!",
    chooseClinic: "اختر العيادة", bookNow: "احجز الآن",
    selectDate: "اختر التاريخ", friExcluded: "الجمعة مستثناة", selectTime: "اختر الوقت",
    summaryTitle: "ملخص الحجز", date: "التاريخ", time: "الوقت", spotsLeft: "المقاعد المتبقية",
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
    searchPlaceholder: "ابحث عن عيادة...", noResults: "لا توجد عيادات مطابقة",
    profile: "الملف الشخصي", editPhoto: "تغيير الصورة", uploadPhoto: "رفع صورة",
    name: "الاسم", email: "البريد الإلكتروني", savePhoto: "حفظ", uploading: "جارٍ الرفع...",
    photoUpdated: "تم تحديث الصورة!", myProfile: "ملفي الشخصي",
    rateClinic: "قيّم العيادة", submitReview: "إرسال",
    totalReviews: "تقييم", reviewPrompt: "كيف كانت تجربتك؟",
    reviewSuccess: "شكرًا على تقييمك!", alreadyReviewed: "لقد قيّمت هذه العيادة من قبل.",
    noReviews: "لا توجد تقييمات بعد. كن الأول!",
    chatTitle: "NovaMed AI", chatSubtitle: "اسأل عن العيادات والمواعيد",
    chatPlaceholder: "اكتب سؤالك هنا...",
    chatWelcome: "أهلاً! 👋 أنا NovaMed، مساعد العيادة الذكية. إزي أقدر أساعدك النهارده؟",
    verified: "مريض موثق", backToBooking: "العودة للحجز",
    totalAppts: "إجمالي المواعيد", availableClinics: "العيادات المتاحة",
    profilePhoto: "صورة الملف الشخصي", currentPhoto: "الصورة الحالية",
    notUploaded: "صورة جديدة - لم تُرفع بعد", active: "معتمدة",
    pngJpg: "PNG, JPG حتى 5MB", profileInfo: "ملف المريض",
  },
};

const CLINICS = [
  { id: "cardio_clinic",            en: "Cardiology",        ar: "القلب",            icon: "🫀", grad: "from-rose-500 to-pink-600",     glow: "#f43f5e" },
  { id: "chest_clinic",             en: "Chest",             ar: "الصدر",            icon: "🫁", grad: "from-sky-500 to-blue-600",      glow: "#0ea5e9" },
  { id: "dental_clinic",            en: "Dental",            ar: "الأسنان",          icon: "🦷", grad: "from-teal-500 to-cyan-600",     glow: "#14b8a6" },
  { id: "derma_clinic",             en: "Dermatology",       ar: "الجلدية",          icon: "✨", grad: "from-amber-500 to-orange-500",  glow: "#f59e0b" },
  { id: "ent_clinic",               en: "ENT",               ar: "أنف وأذن وحنجرة",  icon: "👂", grad: "from-violet-500 to-purple-600", glow: "#8b5cf6" },
  { id: "eye_clinic",               en: "Eye",               ar: "العيون",           icon: "👁️", grad: "from-indigo-500 to-blue-600",   glow: "#6366f1" },
  { id: "gynecology_clinic",        en: "Gynecology",        ar: "النساء والتوليد",  icon: "🌸", grad: "from-pink-500 to-rose-500",     glow: "#ec4899" },
  { id: "internal_medicine_female", en: "Internal (F)",      ar: "باطنة نساء",       icon: "💊", grad: "from-fuchsia-500 to-pink-600",  glow: "#d946ef" },
  { id: "internal_medicine_male",   en: "Internal (M)",      ar: "باطنة رجال",       icon: "💊", grad: "from-blue-500 to-indigo-600",   glow: "#3b82f6" },
  { id: "neurology_clinic",         en: "Neurology",         ar: "الأعصاب",          icon: "🧠", grad: "from-purple-500 to-violet-600", glow: "#a855f7" },
  { id: "neurosurgery_clinic",      en: "Neurosurgery",      ar: "جراحة الأعصاب",    icon: "⚕️", grad: "from-slate-500 to-gray-600",    glow: "#64748b" },
  { id: "nutrition_clinic",         en: "Nutrition",         ar: "التغذية",          icon: "🥗", grad: "from-green-500 to-emerald-600", glow: "#22c55e" },
  { id: "orthopedic_clinic",        en: "Orthopedic",        ar: "العظام",           icon: "🦴", grad: "from-orange-500 to-amber-600",  glow: "#f97316" },
  { id: "physiotherapy_clinic",     en: "Physiotherapy",     ar: "العلاج الطبيعي",   icon: "🏃", grad: "from-lime-500 to-green-600",    glow: "#84cc16" },
  { id: "surgery_clinic",           en: "Surgery",           ar: "الجراحة",          icon: "🔬", grad: "from-red-500 to-rose-600",      glow: "#ef4444" },
  { id: "urology_clinic",           en: "Urology",           ar: "المسالك البولية",  icon: "💧", grad: "from-cyan-500 to-sky-600",      glow: "#06b6d4" },
];


const QUICK_Q_AR = ["إيه العيادات المتاحة؟","إزاي أحجز موعد؟","المواعيد من إمتى لإمتى؟","هل محتاج كارنيه؟","أقدر أحجز أكتر من موعد؟","إزاي ألغي الموعد؟"];
const QUICK_Q_EN = ["What clinics are available?","How do I book?","Working hours?","Do I need a student ID?","Multiple appointments?","How to cancel?"];

type Slot = { id: string; time: string; date: string; capacity: number; maxCapacity: number };
type SlotsByDate = Record<string, Slot[]>;
type Step = "clinics" | "booking" | "success";
type Lang = "en" | "ar";
type Theme = "dark" | "light";
type View = "home" | "profile";
type ActiveAppt = { id: string; clinicId: string; clinicName: string; clinicIcon: string; date: string; time: string; queueNumber: number; slotId: string };
type UserProfile = { name: string; email: string; imageUrl?: string };
type ClinicRating = { avgRating: number; totalReviews: number; userReviewed: boolean };
type ChatMsg = { role: "user" | "assistant"; content: string };

const fmtDate = (d: string, lang: Lang) =>
  new Date(d + "T00:00:00").toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric" });
const cName = (c: typeof CLINICS[0] | null | undefined, lang: Lang) => c ? (lang === "ar" ? c.ar : c.en) : "";

function StarRating({ value, onChange, size = 28, readonly = false }: { value: number; onChange?: (v: number) => void; size?: number; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1" style={{ direction: "ltr" }}>
      {[1,2,3,4,5].map((s) => {
        const filled = (hover || value) >= s;
        return (
          <button key={s} type="button" disabled={readonly} onClick={() => !readonly && onChange?.(s)}
            onMouseEnter={() => !readonly && setHover(s)} onMouseLeave={() => !readonly && setHover(0)}
            style={{ background:"none", border:"none", padding:2, cursor: readonly?"default":"pointer", transform: !readonly&&hover>=s?"scale(1.25)":"scale(1)", transition:"transform 0.15s" }}>
            <Star size={size} fill={filled?"#fbbf24":"none"} stroke={filled?"#fbbf24":"#6b7280"} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

function RatingDisplay({ value, small=false }: { value: number; small?: boolean }) {
  const sz = small ? 14 : 18;
  return (
    <div className="flex items-center gap-0.5" style={{ direction:"ltr" }}>
      {[1,2,3,4,5].map((s) => {
        const full = value >= s, half = !full && value >= s-0.5;
        return full ? <Star key={s} size={sz} fill="#fbbf24" stroke="#fbbf24" strokeWidth={1} />
          : half ? <StarHalf key={s} size={sz} fill="#fbbf24" stroke="#fbbf24" strokeWidth={1} />
          : <Star key={s} size={sz} fill="none" stroke="#6b7280" strokeWidth={1.5} />;
      })}
    </div>
  );
}

// ── Initialize clinics in Firestore if missing ──────────────────────────────
async function initClinicsInFirestore() {
  try {
    const batch = writeBatch(db);
    let hasWrites = false;
    for (const clinic of CLINICS) {
      const ref = doc(db, "clinics", clinic.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        batch.set(ref, {
          clinicId: clinic.id,
          nameEn: clinic.en,
          nameAr: clinic.ar,
          icon: clinic.icon,
          ratingSum: 0,
          reviewCount: 0,
          reviewedBy: [],
          createdAt: serverTimestamp(),
        });
        hasWrites = true;
      } else {
        // ensure rating fields exist
        const d = snap.data();
        if (d.ratingSum === undefined || d.reviewCount === undefined || d.reviewedBy === undefined) {
          batch.update(ref, {
            ...(d.ratingSum === undefined && { ratingSum: 0 }),
            ...(d.reviewCount === undefined && { reviewCount: 0 }),
            ...(d.reviewedBy === undefined && { reviewedBy: [] }),
          });
          hasWrites = true;
        }
      }
    }
    if (hasWrites) await batch.commit();
  } catch (e) {
    console.error("initClinics error:", e);
  }
}

export default function AppointmentBooking() {
  const navigate = useNavigate();
  const [lang, setLang]   = useState<Lang>("ar");
  const [theme, setTheme] = useState<Theme>("light");
  const [view, setView]   = useState<View>("home");
  const t = T[lang]; const dk = theme==="dark"; const isRtl = lang==="ar";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin]         = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [userProfile, setUserProfile]       = useState<UserProfile | null>(null);
  const [, setProfileLoading] = useState(false);
  const [photoFile, setPhotoFile]           = useState<File | null>(null);
  const [photoPreview, setPhotoPreview]     = useState<string | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadSuccess, setUploadSuccess]   = useState(false);
  const [apptCount, setApptCount]           = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatOpen, setChatOpen]       = useState(false);
  const [chatMsgs, setChatMsgs]       = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatUnread, setChatUnread]   = useState(0);
  const chatEndRef   = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [clinicRatings, setClinicRatings]         = useState<Record<string, ClinicRating>>({});
  const [showReview, setShowReview]               = useState(false);
  const [reviewClinicId, setReviewClinicId]       = useState<string|null>(null);
  const [reviewRating, setReviewRating]           = useState(0);
  const [submittingReview, setSubmittingReview]   = useState(false);
  const [reviewDone, setReviewDone]               = useState(false);

  const [selectedClinic, setSelectedClinic] = useState<typeof CLINICS[0]|null>(null);
  const [slotsByDate, setSlotsByDate]       = useState<SlotsByDate>({});
  const [slotsLoading, setSlotsLoading]     = useState(false);
  const [selectedDate, setSelectedDate]     = useState("");
  const [selectedSlot, setSelectedSlot]     = useState<Slot|null>(null);
  const [step, setStep]                     = useState<Step>("clinics");
  const [booking, setBooking]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]         = useState(false);
  const [activeAppt, setActiveAppt]         = useState<ActiveAppt|null>(null);
  const [apptLoading, setApptLoading]       = useState(false);
  const [successInfo, setSuccessInfo]       = useState<{queueNumber:number;clinicName:string;clinicIcon:string;date:string;time:string}|null>(null);

  /* auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const dd = await getDoc(doc(db,"doctors",user.uid));
          if (dd.exists()&&dd.data().role==="doctor"){navigate("/doctor-dashboard",{replace:true});return;}
          const ud = await getDoc(doc(db,"users",user.uid));
          if (ud.exists()) {
            const r = ud.data().role;
            if (r==="admin") setIsAdmin(true);
            else if (r!=="patient"){navigate("/unauthorized",{replace:true});return;}
            setUserProfile({name:ud.data().name??user.displayName??"—",email:ud.data().email??user.email??"—",imageUrl:ud.data().imageUrl});
          }
          // init clinics in Firestore
          await initClinicsInFirestore();
        } catch(_){}
      }
      setAuthChecked(true);
    });
    return ()=>unsub();
  },[navigate]);

  /* init chat */
  useEffect(()=>{
    if(chatMsgs.length===0) setChatMsgs([{role:"assistant",content:t.chatWelcome}]);
  },[]);

  /* chat scroll */
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); },[chatMsgs]);

  /* fetch profile */
  const fetchProfile = useCallback(async()=>{
    if(!currentUser) return;
    setProfileLoading(true);
    try {
      const ud = await getDoc(doc(db,"users",currentUser.uid));
      if(ud.exists()){
        const d=ud.data();
        setUserProfile({name:d.name??currentUser.displayName??"—",email:d.email??currentUser.email??"—",imageUrl:d.imageUrl});
      }
      const snap = await getDocs(query(collection(db,"appointments"),where("patientId","==",currentUser.uid)));
      setApptCount(snap.size);
    } catch(_){}
    setProfileLoading(false);
  },[currentUser]);

  useEffect(()=>{ if(view==="profile"&&currentUser) fetchProfile(); },[view,currentUser,fetchProfile]);

  /* ratings — live listener */
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"clinics"),(snap)=>{
      const r:Record<string,ClinicRating>={};
      snap.docs.forEach((d)=>{
        const data=d.data(), total=data.reviewCount??0, sum=data.ratingSum??0;
        r[d.id]={
          avgRating:total>0?Math.round((sum/total)*10)/10:0,
          totalReviews:total,
          userReviewed:currentUser?(data.reviewedBy??[]).includes(currentUser.uid):false,
        };
      });
      setClinicRatings(r);
    });
    return ()=>unsub();
  },[currentUser]);

  /* photo */
  const handlePhotoSelect = (e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]; if(!file) return;
    setPhotoFile(file); setUploadSuccess(false);
    const reader=new FileReader();
    reader.onload=()=>setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const handlePhotoUpload = async()=>{
    if(!photoFile||!currentUser) return;
    setUploading(true);
    try {
      const storageRef=ref(storage,`uploads/${currentUser.uid}/profile_${Date.now()}`);
      await uploadBytes(storageRef,photoFile);
      const url=await getDownloadURL(storageRef);
      await setDoc(doc(db,"users",currentUser.uid),{imageUrl:url},{merge:true});
      setUserProfile((p)=>p?{...p,imageUrl:url}:p);
      setPhotoFile(null); setPhotoPreview(null); setUploadSuccess(true);
      setTimeout(()=>setUploadSuccess(false),3000);
    } catch(err:any){alert(err.message);}
    setUploading(false);
  };

  /* chat */
 const sendChat = async (message: string) => {
  if (!message.trim() || chatLoading) return;
  const userMsg: ChatMsg = { role: "user", content: message };
  const newMsgs = [...chatMsgs, userMsg];
  setChatMsgs(newMsgs); setChatInput(""); setChatLoading(true);
  try {
    const uid = currentUser?.uid;
    if (!uid) throw new Error("Not authenticated");

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        message,
        history: newMsgs.slice(1, -1).map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await res.json();

    if (res.status === 429) {
      setChatMsgs((p) => [...p, {
        role: "assistant",
        content: lang === "ar"
          ? "عذراً، استخدمت الـ 5 رسايل اليومية. 🌙 عود غداً!"
          : "Sorry, you've used all 5 daily messages. 🌙 Come back tomorrow!",
      }]);
      setChatLoading(false);
      return;
    }

    if (!res.ok) throw new Error(data.error || "Error");

    setChatMsgs((p) => [...p, { role: "assistant", content: data.reply }]);
    if (!chatOpen) setChatUnread((n) => n + 1);

  } catch {
    setChatMsgs((p) => [...p, {
      role: "assistant",
      content: lang === "ar" ? "معلش، في مشكلة في الاتصال. حاول تاني! 🙏" : "Sorry, connection error. Try again! 🙏",
    }]);
  }
  setChatLoading(false);
};
  /* review */
  const handleSubmitReview = async()=>{
    if(!currentUser||!reviewClinicId||reviewRating===0) return;
    setSubmittingReview(true);
    try {
      await setDoc(doc(db,"clinics",reviewClinicId),{
        ratingSum:increment(reviewRating),
        reviewCount:increment(1),
        reviewedBy:arrayUnion(currentUser.uid),
        updatedAt:serverTimestamp(),
      },{merge:true});
      setReviewDone(true);
      setTimeout(()=>{setShowReview(false);setReviewDone(false);setReviewRating(0);setReviewClinicId(null);},2000);
    } catch(err:any){alert(err.message);}
    setSubmittingReview(false);
  };

  /* active appt */
  const fetchActive = useCallback(async()=>{
    if(!currentUser) return;
    setApptLoading(true);
    try {
      const snap=await getDocs(query(collection(db,"appointments"),where("patientId","==",currentUser.uid),where("status","==","upcoming")));
      if(!snap.empty){
        const d=snap.docs[0],data=d.data(),clinic=CLINICS.find((c)=>c.id===data.clinicId);
        setActiveAppt({id:d.id,clinicId:data.clinicId,clinicName:cName(clinic,lang),clinicIcon:clinic?.icon??"🏥",date:data.date,time:data.time,queueNumber:data.queueNumber,slotId:data.slotId});
      } else setActiveAppt(null);
    } catch(_){}
    setApptLoading(false);
  },[currentUser,lang]);

  useEffect(()=>{ if(currentUser) fetchActive(); },[currentUser,fetchActive]);

  /* slots */
  useEffect(()=>{
    if(!selectedClinic) return;
    setSlotsLoading(true); setSlotsByDate({}); setSelectedDate(""); setSelectedSlot(null);
    const unsub=onSnapshot(query(collection(db,"clinicSlots"),where("clinicId","==",selectedClinic.id),where("isAvailable","==",true)),(snap)=>{
      const g:SlotsByDate={};
      snap.docs.forEach((d)=>{
        const data=d.data();
        if(new Date(data.date+"T00:00:00").getDay()===5) return;
        const s:Slot={id:d.id,time:data.time,date:data.date,capacity:data.capacity??0,maxCapacity:data.maxCapacity??10};
        if(!g[data.date]) g[data.date]=[];
        g[data.date].push(s);
      });
      const toMin=(tt:string)=>{const[tm,p]=tt.split(" ");let[h,m]=tm.split(":").map(Number);if(p==="PM"&&h!==12)h+=12;if(p==="AM"&&h===12)h=0;return h*60+m;};
      Object.values(g).forEach((s)=>s.sort((a,b)=>toMin(a.time)-toMin(b.time)));
      setSlotsByDate(g); setSlotsLoading(false);
    });
    return ()=>unsub();
  },[selectedClinic]);

  const sortedDates=Object.keys(slotsByDate).filter((d)=>new Date(d+"T00:00:00").getDay()!==5).sort().slice(0,7);
  const filteredClinics=CLINICS.filter((c)=>{ const q=searchQuery.toLowerCase().trim(); if(!q) return true; return c.en.toLowerCase().includes(q)||c.ar.includes(q); });

  /* book */
  const handleBook=async()=>{
    if(!currentUser||!selectedClinic||!selectedDate||!selectedSlot) return;
    setBooking(true);
    try {
      const slotRef=doc(db,"clinicSlots",selectedSlot.id);
      let queueNumber=0;
      await runTransaction(db,async(tx)=>{
        const ss=await tx.get(slotRef);
        if(!ss.exists()) throw new Error("Slot no longer exists.");
        const sd=ss.data();
        if(!sd.isAvailable) throw new Error(lang==="ar"?"هذا الموعد لم يعد متاحًا.":"This slot is no longer available.");
        const cap=sd.capacity??0,maxCap=sd.maxCapacity??10;
        if(cap>=maxCap) throw new Error(lang==="ar"?"هذا الموعد ممتلئ.":"This slot is fully booked.");
        const ex=await getDocs(query(collection(db,"appointments"),where("patientId","==",currentUser.uid),where("status","==","upcoming")));
        if(!ex.empty) throw new Error("EXISTING");
        const qs=await getDocs(query(collection(db,"appointments"),where("clinicId","==",selectedClinic.id),where("date","==",selectedDate)));
        queueNumber=qs.size+1;
        const newCap=cap+1;
        tx.update(slotRef,{capacity:newCap,...(newCap>=maxCap?{isAvailable:false}:{})});
        tx.set(doc(collection(db,"appointments")),{clinicId:selectedClinic.id,patientId:currentUser.uid,patientName:currentUser.displayName??currentUser.email,slotId:selectedSlot.id,date:selectedDate,time:selectedSlot.time,queueNumber,status:"upcoming",createdAt:serverTimestamp()});
      });
      setSuccessInfo({queueNumber,clinicIcon:selectedClinic.icon,clinicName:cName(selectedClinic,lang),date:selectedDate,time:selectedSlot.time});
      setShowConfirm(false); setStep("success"); await fetchActive();
    } catch(err:any){
      setShowConfirm(false);
      if(err.message==="EXISTING") alert(lang==="ar"?"لديك موعد قائم بالفعل. يُرجى إلغاؤه أولًا.":"You already have an upcoming appointment.");
      else alert(err.message||(lang==="ar"?"فشل الحجز.":"Booking failed."));
    } finally{setBooking(false);}
  };

  /* cancel */
  const handleCancel=async()=>{
    if(!activeAppt) return;
    setCancelling(true);
    try {
      const slotRef=doc(db,"clinicSlots",activeAppt.slotId);
      await runTransaction(db,async(tx)=>{
        const ss=await tx.get(slotRef);
        tx.delete(doc(db,"appointments",activeAppt.id));
        if(ss.exists()) tx.update(slotRef,{capacity:Math.max(0,(ss.data().capacity??0)-1),isAvailable:true});
      });
      const rem=await getDocs(query(collection(db,"appointments"),where("clinicId","==",activeAppt.clinicId),where("date","==",activeAppt.date),where("status","==","upcoming")));
      const sorted=rem.docs.map((d)=>({ref:d.ref,q:d.data().queueNumber as number})).sort((a,b)=>a.q-b.q);
      await Promise.all(sorted.map((item,i)=>updateDoc(item.ref,{queueNumber:i+1})));
      setActiveAppt(null); setShowCancelConfirm(false);
    } catch(err:any){alert(err.message);}
    finally{setCancelling(false);}
  };

  const resetAll=()=>{setSelectedClinic(null);setSelectedDate("");setSelectedSlot(null);setSuccessInfo(null);setStep("clinics");fetchActive();};

  /* tokens */
  const pageBg=dk?"#06091a":"#f0f4f9";
  const cardBg=dk?"rgba(255,255,255,0.03)":"#ffffff";
  const cardBorder=dk?"rgba(255,255,255,0.08)":"#e5e7eb";
  const textPrimary=dk?"rgba(255,255,255,0.85)":"#1a3a60";
  const textMuted=dk?"rgba(255,255,255,0.35)":"#6b7280";
  const textFaint=dk?"rgba(255,255,255,0.18)":"#9ca3af";

  if(!authChecked) return (
    <div className="h-screen flex items-center justify-center" style={{background:pageBg,fontFamily:"Cairo, sans-serif"}}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{background:dk?"rgba(255,255,255,.05)":"#e0eaf6",border:`1px solid ${cardBorder}`}}>
        <Loader2 className="animate-spin" size={26} style={{color:dk?"#60a5fa":"#185ba5"}} />
      </div>
    </div>
  );

  if(view==="profile") return (
    <div dir={t.dir} style={{fontFamily:"Cairo, sans-serif",background:pageBg,minHeight:"100vh",color:textPrimary}}>
      <style>{`@keyframes floatUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}.fade-in{animation:floatUp .4s ease both}`}</style>
      <div className="relative" style={{background:"linear-gradient(135deg,#0f2544 0%,#1a3a60 50%,#185ba5 100%)",paddingBottom:90}}>
        <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)",backgroundSize:"28px 28px"}} />
        <div className="relative max-w-2xl mx-auto px-4 pt-6">
          <button onClick={()=>setView("home")} className={`flex items-center gap-2 text-sm font-semibold ${isRtl?"flex-row-reverse":""}`}
            style={{color:"rgba(255,255,255,.7)",background:"none",border:"none",cursor:"pointer"}}>
            <ArrowLeft size={16} style={{transform:isRtl?"rotate(180deg)":"none"}} /> {t.backLabel}
          </button>
        </div>
        <div className="relative max-w-2xl mx-auto px-4 pt-8 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full overflow-hidden" style={{border:"4px solid rgba(255,255,255,.25)",boxShadow:"0 12px 40px rgba(0,0,0,.35)"}}>
              {photoPreview?<img src={photoPreview} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :userProfile?.imageUrl?<img src={userProfile.imageUrl} alt="avatar" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<div className="w-full h-full flex items-center justify-center" style={{background:"linear-gradient(135deg,#3b82f6,#7c3aed)"}}><User size={56} color="white"/></div>}
            </div>
            <button onClick={()=>fileInputRef.current?.click()} className="absolute bottom-1 end-1 w-10 h-10 rounded-full flex items-center justify-center"
              style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",border:"3px solid white",boxShadow:"0 4px 16px rgba(59,130,246,.5)",cursor:"pointer"}}>
              <Camera size={16} color="white"/>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect}/>
          <h1 className="text-2xl font-black text-white mb-1">{userProfile?.name??"—"}</h1>
          <p className="text-sm mb-4" style={{color:"rgba(255,255,255,.6)"}}>{userProfile?.email}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
            style={{background:"rgba(34,197,94,.15)",color:"#4ade80",border:"1px solid rgba(34,197,94,.25)"}}>
            <Shield size={12}/>{t.verified}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10 pb-10 space-y-4">
        <div className="grid grid-cols-2 gap-3 fade-in">
          {[{label:t.totalAppts,value:apptCount,icon:<CalendarDays size={22}/>,color:"#3b82f6"},{label:t.availableClinics,value:16,icon:<Sparkles size={22}/>,color:"#8b5cf6"}].map(({label,value,icon,color})=>(
            <div key={label} className="rounded-2xl p-5" style={{background:cardBg,border:`1px solid ${cardBorder}`,boxShadow:dk?"none":"0 4px 20px rgba(0,0,0,.06)"}}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{background:`${color}18`,color}}>{icon}</div>
              <p className="text-3xl font-black" style={{color:textPrimary}}>{value}</p>
              <p className="text-xs mt-1" style={{color:textMuted}}>{label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl overflow-hidden fade-in" style={{background:cardBg,border:`1px solid ${cardBorder}`,boxShadow:dk?"none":"0 4px 20px rgba(0,0,0,.06)"}}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{borderColor:cardBorder}}>
            <h2 className="font-black text-sm" style={{color:textPrimary}}>{t.profileInfo}</h2>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"rgba(59,130,246,.1)"}}><User size={15} style={{color:"#3b82f6"}}/></div>
          </div>
          <div className="p-5 space-y-4">
            {[{label:t.name,value:userProfile?.name??"—",icon:<User size={14}/>,ltr:false},{label:t.email,value:userProfile?.email??"—",icon:<Edit3 size={14}/>,ltr:true}].map(({label,value,icon,ltr})=>(
              <div key={label} className={`flex items-start gap-3 ${isRtl?"flex-row-reverse":""}`}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:dk?"rgba(255,255,255,.06)":"#f3f4f6",color:textMuted}}>{icon}</div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{color:textFaint}}>{label}</p>
                  <p className="font-bold text-sm" style={{color:textPrimary,direction:ltr?"ltr":t.dir}}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden fade-in" style={{background:cardBg,border:`1px solid ${cardBorder}`,boxShadow:dk?"none":"0 4px 20px rgba(0,0,0,.06)"}}>
          <div className="px-5 py-4 border-b" style={{borderColor:cardBorder}}>
            <h2 className="font-black text-sm" style={{color:textPrimary}}>{t.profilePhoto}</h2>
          </div>
          <div className="p-5 space-y-4">
            {(userProfile?.imageUrl||photoPreview)&&(
              <div className={`flex items-center gap-4 ${isRtl?"flex-row-reverse":""}`}>
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0" style={{border:`2px solid ${cardBorder}`}}>
                  <img src={photoPreview||userProfile?.imageUrl} alt="current" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                </div>
                <div className={isRtl?"text-right":""}>
                  <p className="text-sm font-bold" style={{color:textPrimary}}>{t.currentPhoto}</p>
                  <p className="text-xs mt-0.5" style={{color:textFaint}}>{photoPreview?t.notUploaded:t.active}</p>
                </div>
              </div>
            )}
            {photoPreview?(
              <div className={`flex gap-3 ${isRtl?"flex-row-reverse":""}`}>
                <button onClick={()=>{setPhotoFile(null);setPhotoPreview(null);}} className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{background:"transparent",border:`1px solid ${cardBorder}`,color:textMuted,cursor:"pointer"}}>{t.back}</button>
                <button onClick={handlePhotoUpload} disabled={uploading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{background:uploading?"rgba(59,130,246,.5)":"linear-gradient(135deg,#3b82f6,#1d4ed8)",cursor:"pointer",border:"none",boxShadow:uploading?"none":"0 4px 16px rgba(59,130,246,.4)"}}>
                  {uploading?<><Loader2 size={14} className="animate-spin"/>{t.uploading}</>:<><Upload size={14}/>{t.savePhoto}</>}
                </button>
              </div>
            ):(
              <button onClick={()=>fileInputRef.current?.click()} className="w-full py-5 rounded-xl text-sm font-bold flex flex-col items-center gap-2"
                style={{background:dk?"rgba(255,255,255,.03)":"#f9fafb",border:`2px dashed ${cardBorder}`,color:textMuted,cursor:"pointer"}}>
                <Camera size={26} style={{color:dk?"#60a5fa":"#3b82f6"}}/>
                <span>{userProfile?.imageUrl?t.editPhoto:t.uploadPhoto}</span>
                <span className="text-[10px]" style={{color:textFaint}}>{t.pngJpg}</span>
              </button>
            )}
            {uploadSuccess&&(
              <div className="flex items-center gap-2 rounded-xl p-3" style={{background:"rgba(34,197,94,.08)",border:"1px solid rgba(34,197,94,.2)",color:"#4ade80"}}>
                <CheckCircle2 size={15}/><span className="text-xs font-semibold">{t.photoUpdated}</span>
              </div>
            )}
          </div>
        </div>
        {activeAppt&&(
          <div className="rounded-2xl p-5 fade-in" style={{background:"linear-gradient(135deg,#0f2544,#185ba5)",boxShadow:"0 8px 32px rgba(24,91,165,.3)"}}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{color:"rgba(147,197,253,.7)"}}>{t.upcoming}</p>
            <div className={`flex items-center gap-3 ${isRtl?"flex-row-reverse":""}`}>
              <span className="text-3xl">{activeAppt.clinicIcon}</span>
              <div className={isRtl?"text-right":""}>
                <p className="font-black text-white">{activeAppt.clinicName}</p>
                <p className="text-xs mt-1" style={{color:"rgba(147,197,253,.7)"}}>{fmtDate(activeAppt.date,lang)} · {activeAppt.time}</p>
              </div>
              <span className="ms-auto text-xs font-black px-3 py-1.5 rounded-full" style={{background:"rgba(251,191,36,.15)",color:"#fde047",border:"1px solid rgba(251,191,36,.2)"}}>#{activeAppt.queueNumber}</span>
            </div>
          </div>
        )}
        <button onClick={()=>setView("home")} className="w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",boxShadow:"0 4px 16px rgba(59,130,246,.3)",border:"none",cursor:"pointer"}}>
          {t.backToBooking}
        </button>
      </div>
    </div>
  );

  return (
    <div dir={t.dir} style={{fontFamily:"Cairo, sans-serif",background:pageBg,minHeight:"100vh",color:textPrimary,transition:"background .3s,color .3s"}}>
      <style>{`
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        @keyframes floatUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseRing{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.4);opacity:0}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chatUp{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes dot{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        @keyframes novaDot{0%,80%,100%{transform:scale(0);opacity:0}40%{transform:scale(1);opacity:1}}
        .clinic-card{animation:floatUp .4s ease both}
        .queue-num{background:linear-gradient(135deg,#fbbf24,#f59e0b,#fde68a,#fbbf24);background-size:300% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:shimmer 3s linear infinite}
        .chat-window{animation:chatUp .3s cubic-bezier(.34,1.56,.64,1) both}
        .fade-in{animation:fadeIn .35s ease both}
        .dot{width:7px;height:7px;border-radius:50%;background:#60a5fa;display:inline-block;animation:dot 1.2s ease-in-out infinite}
        .dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
        .nova-dot{width:6px;height:6px;border-radius:50%;background:#38bdf8;display:inline-block;box-shadow:0 0 6px rgba(56,189,248,0.6);animation:novaDot 1.2s ease-in-out infinite}
        .nova-dot:nth-child(2){animation-delay:.2s}.nova-dot:nth-child(3){animation-delay:.4s}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(100,116,139,.3);border-radius:4px}
      `}</style>

      {dk&&<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div style={{position:"absolute",top:"-10%",left:"15%",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(59,130,246,.12),transparent 70%)",animation:"pulseRing 7s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:"40%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,.10),transparent 70%)",animation:"pulseRing 9s ease-in-out infinite",animationDelay:"3s"}}/>
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)",backgroundSize:"32px 32px"}}/>
      </div>}

      {isAdmin&&<div className="relative z-10 py-2 px-6 flex justify-end" style={{background:dk?"rgba(0,0,0,.2)":"#1a3a60",borderBottom:`1px solid ${cardBorder}`}}>
        <button onClick={()=>navigate("/dashboard")} className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold border"
          style={{background:dk?"rgba(255,255,255,.08)":"rgba(255,255,255,.15)",color:"white",borderColor:dk?"rgba(255,255,255,.1)":"rgba(255,255,255,.25)",cursor:"pointer"}}>
          <LayoutDashboard size={14}/>{t.dashboard}
        </button>
      </div>}

      {/* HERO */}
      <div className="relative z-10" style={{background:dk?"transparent":"linear-gradient(135deg,#0f2544,#1a3a60,#185ba5)"}}>
        {dk&&<div className="absolute top-0 left-0 right-0 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(96,165,250,.4),rgba(167,139,250,.4),transparent)"}}/>}
        <div className="max-w-4xl mx-auto px-4 pt-10 pb-16">
          <div className={`flex items-center justify-between mb-10 ${isRtl?"flex-row-reverse":""}`}>
            <div>
              {step!=="clinics"&&<button onClick={resetAll} className={`flex items-center gap-1.5 text-sm ${isRtl?"flex-row-reverse":""}`}
                style={{color:dk?"rgba(255,255,255,.4)":"rgba(255,255,255,.7)",background:"none",border:"none",cursor:"pointer"}}>
                <ChevronLeft size={15} style={{transform:isRtl?"rotate(180deg)":"none"}}/>{t.backLabel}
              </button>}
            </div>
            <div className={`flex items-center gap-2 ${isRtl?"flex-row-reverse":""}`}>
              {currentUser&&<button onClick={()=>setView("profile")}
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full border backdrop-blur-sm overflow-hidden"
                style={{background:dk?"rgba(255,255,255,.05)":"rgba(255,255,255,.15)",color:"rgba(255,255,255,.95)",borderColor:dk?"rgba(255,255,255,.12)":"rgba(255,255,255,.3)",cursor:"pointer"}}>
                {userProfile?.imageUrl?<img src={userProfile.imageUrl} alt="av" style={{width:20,height:20,borderRadius:"50%",objectFit:"cover"}}/>:<User size={14}/>}
                {t.profile}
              </button>}
              <button onClick={()=>setTheme(dk?"light":"dark")}
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full border backdrop-blur-sm"
                style={{background:dk?"rgba(255,255,255,.05)":"rgba(255,255,255,.15)",color:dk?"rgba(255,255,255,.6)":"rgba(255,255,255,.9)",borderColor:dk?"rgba(255,255,255,.12)":"rgba(255,255,255,.3)",cursor:"pointer"}}>
                {dk?<Sun size={14}/>:<Moon size={14}/>}{dk?(lang==="ar"?"فاتح":"Light"):(lang==="ar"?"داكن":"Dark")}
              </button>
              <button onClick={()=>setLang(lang==="en"?"ar":"en")}
                className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full border backdrop-blur-sm"
                style={{background:dk?"rgba(255,255,255,.05)":"rgba(255,255,255,.15)",color:dk?"rgba(255,255,255,.5)":"rgba(255,255,255,.9)",borderColor:dk?"rgba(255,255,255,.12)":"rgba(255,255,255,.3)",cursor:"pointer"}}>
                <Globe size={13}/>{lang==="en"?"عربي":"English"}
              </button>
            </div>
          </div>
          <div className={`flex items-end justify-between gap-6 ${isRtl?"flex-row-reverse":""}`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{background:dk?"rgba(59,130,246,.1)":"rgba(255,255,255,.15)",color:dk?"#93c5fd":"white",border:`1px solid ${dk?"rgba(59,130,246,.15)":"rgba(255,255,255,.25)"}`}}>
                <Sparkles size={11}/>{t.tag}
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-[1.1] tracking-tight text-white">
                {step==="clinics"&&<>{t.h1a} <span style={{background:"linear-gradient(135deg,#60a5fa,#a78bfa,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{t.h1b}</span></>}
                {step==="booking"&&<>{selectedClinic?.icon} {cName(selectedClinic,lang)}<br/><span style={{color:"#93c5fd",fontSize:"1.4rem",fontWeight:700}}>{t.bookingH2}</span></>}
                {step==="success"&&<>{t.successH1a} <span style={{color:"#4ade80"}}>{t.successH1b}</span></>}
              </h1>
              <p className="text-sm" style={{color:dk?"rgba(255,255,255,.35)":"rgba(255,255,255,.75)"}}>
                {step==="clinics"&&t.heroSub}{step==="booking"&&t.bookingSub}{step==="success"&&t.successSub}
              </p>
            </div>
            {step==="clinics"&&<div className={`hidden sm:flex flex-col gap-0.5 flex-shrink-0 ${isRtl?"items-start":"items-end"}`}>
              <p className="text-xs" style={{color:dk?"rgba(255,255,255,.2)":"rgba(255,255,255,.5)"}}>{t.allClinics}</p>
              <p className="text-6xl font-black text-white leading-none">16</p>
              <p className="text-sm font-bold" style={{color:dk?"#60a5fa":"#93c5fd"}}>{t.clinicsLabel}</p>
            </div>}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{background:`linear-gradient(to bottom,transparent,${pageBg})`}}/>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 pb-24 space-y-4">
        {/* Active appt banner */}
        {step==="clinics"&&currentUser&&(
          apptLoading?(
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
              <div className="w-8 h-8 rounded-xl animate-pulse" style={{background:cardBorder}}/><div className="h-3 rounded w-40 animate-pulse" style={{background:cardBorder}}/>
            </div>
          ):activeAppt?(
            <div className="relative overflow-hidden rounded-2xl p-5" style={{background:dk?"rgba(59,130,246,.05)":"linear-gradient(135deg,#1a3a60,#185ba5)",border:dk?"1px solid rgba(59,130,246,.2)":"none"}}>
              <div className={`flex items-start justify-between gap-4 flex-wrap ${isRtl?"flex-row-reverse":""}`}>
                <div className={`flex items-start gap-4 ${isRtl?"flex-row-reverse":""}`}>
                  <div className="text-3xl leading-none mt-1 flex-shrink-0">{activeAppt.clinicIcon}</div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{color:dk?"#60a5fa":"rgba(255,255,255,.7)"}}>{t.upcoming}</p>
                    <p className="font-black text-lg text-white">{activeAppt.clinicName}</p>
                    <div className={`flex flex-wrap items-center gap-2 mt-2 ${isRtl?"flex-row-reverse":""}`}>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.75)"}}><CalendarDays size={10}/>{fmtDate(activeAppt.date,lang)}</span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1" style={{background:"rgba(255,255,255,.12)",color:"rgba(255,255,255,.75)"}}><Clock size={10}/>{activeAppt.time}</span>
                      <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{background:"rgba(234,179,8,.15)",color:"#fde047",border:"1px solid rgba(234,179,8,.2)"}}>{t.queue} #{activeAppt.queueNumber}</span>
                    </div>
                  </div>
                </div>
                <button onClick={()=>setShowCancelConfirm(true)} className="flex items-center gap-1.5 text-xs font-semibold rounded-xl px-3 py-2 flex-shrink-0"
                  style={{background:"rgba(239,68,68,.15)",color:"#fca5a5",border:"1px solid rgba(239,68,68,.2)",cursor:"pointer"}}>
                  <XCircle size={13}/>{t.cancel}
                </button>
              </div>
            </div>
          ):(
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"rgba(34,197,94,.1)",border:"1px solid rgba(34,197,94,.15)"}}><CheckCircle2 size={16} className="text-green-400"/></div>
              <div><p className="text-sm font-semibold" style={{color:textPrimary}}>{t.noAppt}</p><p className="text-xs mt-0.5" style={{color:textFaint}}>{t.noApptSub}</p></div>
            </div>
          )
        )}

        {/* STEP 1 - Clinics */}
        {step==="clinics"&&(
          <div>
            <div className="relative mb-5" style={{direction:"ltr"}}>
              <div className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all"
                style={{background:dk?"rgba(255,255,255,0.04)":"white",border:`1.5px solid ${searchQuery?(dk?"rgba(59,130,246,.5)":"#3b82f6"):cardBorder}`,boxShadow:searchQuery?`0 0 0 3px ${dk?"rgba(59,130,246,.1)":"rgba(59,130,246,.08)"}`:undefined,transition:"all 0.2s"}}>
                <Search size={17} style={{color:searchQuery?(dk?"#60a5fa":"#3b82f6"):textFaint,flexShrink:0,transition:"color 0.2s"}}/>
                <input type="text" value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder}
                  style={{flex:1,background:"transparent",border:"none",outline:"none",color:textPrimary,fontSize:"0.9rem",fontFamily:"Cairo, sans-serif",fontWeight:600,direction:t.dir}}/>
                {searchQuery&&<button onClick={()=>setSearchQuery("")} style={{background:"none",border:"none",padding:0,cursor:"pointer"}}><X size={15} style={{color:textFaint}}/></button>}
              </div>
              {searchQuery&&<p className="text-xs mt-2 px-1 fade-in" style={{color:textFaint,direction:t.dir}}>
                {filteredClinics.length>0?`${filteredClinics.length} ${lang==="ar"?"عيادة مطابقة":"clinic(s) found"}`:t.noResults}
              </p>}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[.2em] mb-4" style={{color:textFaint}}>{t.chooseClinic}</p>
            {filteredClinics.length===0?(
              <div className="rounded-2xl p-12 text-center fade-in" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
                <Search size={38} className="mx-auto mb-3" style={{color:textFaint}}/><p className="font-semibold" style={{color:textMuted}}>{t.noResults}</p>
              </div>
            ):(
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredClinics.map((clinic,i)=>{
                  const rating=clinicRatings[clinic.id];
                  return (
                    <div key={clinic.id} className="relative" style={{animation:`floatUp .4s ease both`,animationDelay:`${i*30}ms`}}>
                      <button onClick={()=>{if(!currentUser){navigate("/login");return;}setSelectedClinic(clinic);setStep("booking");}}
                        className="group relative rounded-2xl p-5 text-left overflow-hidden transition-all duration-250 hover:-translate-y-1.5 w-full"
                        style={{background:cardBg,border:`1px solid ${cardBorder}`,cursor:"pointer"}}>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" style={{background:`radial-gradient(circle at 30% 30%,${clinic.glow}22,transparent 70%)`}}/>
                        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${clinic.grad} opacity-0 group-hover:opacity-80 transition-opacity duration-300`}/>
                        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${clinic.grad} flex items-center justify-center mb-3.5 text-2xl group-hover:scale-110 transition-transform duration-250`} style={{boxShadow:`0 4px 20px ${clinic.glow}44`}}>{clinic.icon}</div>
                        <p className="relative font-bold text-sm leading-snug" style={{color:textPrimary}}>{cName(clinic,lang)}</p>
                        {rating&&rating.totalReviews>0?(
                          <div className={`relative flex items-center gap-1.5 mt-2 ${isRtl?"flex-row-reverse":""}`}>
                            <RatingDisplay value={rating.avgRating} small/>
                            <span className="text-[10px] font-bold" style={{color:"#fbbf24"}}>{rating.avgRating.toFixed(1)}</span>
                            <span className="text-[10px]" style={{color:textFaint}}>({rating.totalReviews})</span>
                          </div>
                        ):(
                          <p className={`relative text-xs mt-1.5 flex items-center gap-1 ${isRtl?"flex-row-reverse":""}`} style={{color:textMuted}}>{t.bookNow}<span>{isRtl?"←":"→"}</span></p>
                        )}
                      </button>
                      {currentUser&&<button onClick={()=>{setReviewClinicId(clinic.id);setReviewRating(0);setReviewDone(false);setShowReview(true);}}
                        className="absolute top-2.5 end-2.5 w-7 h-7 rounded-lg flex items-center justify-center" title={t.rateClinic}
                        style={{background:rating?.userReviewed?"rgba(251,191,36,.15)":(dk?"rgba(255,255,255,.06)":"rgba(0,0,0,.04)"),border:`1px solid ${rating?.userReviewed?"rgba(251,191,36,.3)":cardBorder}`,cursor:"pointer"}}>
                        <Star size={13} fill={rating?.userReviewed?"#fbbf24":"none"} stroke={rating?.userReviewed?"#fbbf24":textFaint}/>
                      </button>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 - Booking */}
        {step==="booking"&&selectedClinic&&(
          <div className="space-y-4">
            {slotsLoading?(
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="animate-spin" size={30} style={{color:dk?"#60a5fa":"#185ba5"}}/><p className="text-sm" style={{color:textMuted}}>{t.loading}</p>
              </div>
            ):sortedDates.length===0?(
              <div className="rounded-2xl p-12 text-center" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
                <CalendarDays size={38} className="mx-auto mb-3" style={{color:textFaint}}/><p className="font-semibold" style={{color:textMuted}}>{t.noSlots}</p><p className="text-sm mt-1" style={{color:textFaint}}>{t.noSlotsSub}</p>
              </div>
            ):(
              <>
                <div className="rounded-2xl p-5" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
                  <div className={`flex items-center gap-2 mb-4 ${isRtl?"flex-row-reverse":""}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:dk?"rgba(59,130,246,.15)":"#eff6ff",border:"1px solid rgba(59,130,246,.15)"}}><CalendarDays size={14} style={{color:dk?"#60a5fa":"#185ba5"}}/></div>
                    <h2 className="font-bold text-sm" style={{color:textPrimary}}>{t.selectDate}</h2>
                    <span className="text-xs" style={{color:textFaint}}>· {t.friExcluded}</span>
                  </div>
                  <div className={`flex gap-2.5 overflow-x-auto pb-1 ${isRtl?"flex-row-reverse":""}`}>
                    {sortedDates.map((date)=>{
                      const d=new Date(date+"T00:00:00"),isSel=selectedDate===date,count=slotsByDate[date]?.length??0;
                      return (
                        <button key={date} onClick={()=>{setSelectedDate(date);setSelectedSlot(null);}}
                          className="flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 min-w-[70px] border transition-all duration-200"
                          style={isSel?{background:"linear-gradient(to bottom,#3b82f6,#1d4ed8)",borderColor:"rgba(59,130,246,.4)",color:"white",transform:"scale(1.05)",boxShadow:"0 8px 24px rgba(59,130,246,.35)",cursor:"pointer"}:{background:dk?"rgba(255,255,255,.04)":"white",borderColor:cardBorder,color:textMuted,cursor:"pointer"}}>
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{color:isSel?"rgba(147,197,253,1)":textFaint}}>{d.toLocaleDateString(isRtl?"ar-EG":"en-US",{weekday:"short"})}</span>
                          <span className="text-2xl font-black leading-tight">{d.getDate()}</span>
                          <span className="text-[10px]" style={{color:isSel?"rgba(147,197,253,1)":textFaint}}>{d.toLocaleDateString(isRtl?"ar-EG":"en-US",{month:"short"})}</span>
                          <span className="text-[10px] mt-1 font-bold" style={{color:isSel?"#fde047":"#3b82f6"}}>{count} {t.slots}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {selectedDate&&<div className="rounded-2xl p-5" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
                  <div className={`flex items-center gap-2 mb-4 ${isRtl?"flex-row-reverse":""}`}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:dk?"rgba(139,92,246,.15)":"#f5f3ff",border:"1px solid rgba(139,92,246,.15)"}}><Clock size={14} style={{color:dk?"#a78bfa":"#7c3aed"}}/></div>
                    <h2 className="font-bold text-sm" style={{color:textPrimary}}>{t.selectTime}</h2>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                    {(slotsByDate[selectedDate]??[]).map((slot)=>{
                      const isSel=selectedSlot?.id===slot.id,left=slot.maxCapacity-slot.capacity;
                      return (
                        <button key={slot.id} onClick={()=>setSelectedSlot(slot)}
                          className="flex flex-col items-center rounded-xl border px-3 py-3.5 transition-all duration-200"
                          style={isSel?{background:"linear-gradient(to bottom,#7c3aed,#5b21b6)",borderColor:"rgba(139,92,246,.4)",color:"white",transform:"scale(1.05)",boxShadow:"0 8px 20px rgba(139,92,246,.35)",cursor:"pointer"}:{background:dk?"rgba(255,255,255,.04)":"white",borderColor:cardBorder,color:textMuted,cursor:"pointer"}}>
                          <span className="text-sm font-bold">{slot.time}</span>
                          <span className="text-[10px] mt-1 font-semibold" style={{color:isSel?"rgba(196,181,253,1)":left<=3?"#f97316":textFaint}}>{left} {t.left}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>}
                {selectedDate&&selectedSlot&&<div className="relative overflow-hidden rounded-2xl" style={{background:cardBg,border:`1px solid ${cardBorder}`}}>
                  <div className={`h-[3px] bg-gradient-to-r ${selectedClinic.grad}`}/>
                  <div className="absolute inset-0 pointer-events-none" style={{background:`radial-gradient(ellipse at top left,${selectedClinic.glow}12,transparent 60%)`}}/>
                  <div className="relative p-6">
                    <div className={`flex items-center gap-3 mb-6 ${isRtl?"flex-row-reverse":""}`}>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedClinic.grad} flex items-center justify-center text-2xl`} style={{boxShadow:`0 6px 24px ${selectedClinic.glow}55`}}>{selectedClinic.icon}</div>
                      <div className={isRtl?"text-right":""}>
                        <p className="text-xs" style={{color:textFaint}}>{t.summaryTitle}</p>
                        <p className="font-black text-xl" style={{color:textPrimary}}>{cName(selectedClinic,lang)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[{label:t.date,value:fmtDate(selectedDate,lang),icon:<CalendarDays size={12}/>},{label:t.time,value:selectedSlot.time,icon:<Clock size={12}/>},{label:t.spotsLeft,value:`${selectedSlot.maxCapacity-selectedSlot.capacity}/${selectedSlot.maxCapacity}`,icon:<Sparkles size={12}/>}].map(({label,value,icon})=>(
                        <div key={label} className="rounded-xl p-3 text-center" style={{background:dk?"rgba(255,255,255,.05)":"#f9fafb",border:`1px solid ${cardBorder}`}}>
                          <div className={`flex items-center justify-center gap-1 mb-1 ${isRtl?"flex-row-reverse":""}`} style={{color:textFaint}}>{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
                          <p className="font-bold text-sm" style={{color:textPrimary}}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {activeAppt?(
                      <div className={`flex items-start gap-2 rounded-xl p-3 text-xs ${isRtl?"flex-row-reverse text-right":""}`} style={{background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.18)",color:"#fbbf24"}}>
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>
                        <span>{t.existingWarn} <strong>{activeAppt.clinicName}</strong>. {t.cancelFirst}</span>
                      </div>
                    ):(
                      <button onClick={()=>setShowConfirm(true)}
                        className={`relative w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r ${selectedClinic.grad} overflow-hidden group transition-all active:scale-[0.98]`}
                        style={{boxShadow:`0 8px 28px ${selectedClinic.glow}55`,cursor:"pointer",border:"none"}}>
                        <span className="relative z-10">{t.confirmBtn}</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"/>
                      </button>
                    )}
                  </div>
                </div>}
              </>
            )}
          </div>
        )}

        {/* STEP 3 - Success */}
        {step==="success"&&successInfo&&(
          <div className="flex items-center justify-center py-6">
            <div className="relative overflow-hidden rounded-3xl p-8 text-center max-w-sm w-full" style={{background:dk?"rgba(255,255,255,.03)":"white",border:`1px solid ${dk?"rgba(255,255,255,.12)":"#e5e7eb"}`,boxShadow:dk?"none":"0 20px 60px rgba(0,0,0,.08)"}}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{background:"linear-gradient(90deg,transparent,rgba(34,197,94,.5),transparent)"}}/>
              <div className="relative">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-green-500/20" style={{animation:"pulseRing 2s ease-in-out infinite"}}/>
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center" style={{boxShadow:"0 8px 32px rgba(34,197,94,.4)"}}><span className="text-4xl">{successInfo.clinicIcon}</span></div>
                </div>
                <h2 className="text-3xl font-black mb-1" style={{color:textPrimary}}>{t.youreBooked}</h2>
                <p className="text-sm mb-6" style={{color:textMuted}}>{t.apptConfirmed}</p>
                <div className="rounded-2xl p-5 mb-5 space-y-3" style={{background:dk?"rgba(0,0,0,.3)":"linear-gradient(135deg,#0f2544,#185ba5)"}}>
                  {[{label:t.clinic,value:successInfo.clinicName},{label:t.date,value:fmtDate(successInfo.date,lang)},{label:t.time,value:successInfo.time}].map(({label,value})=>(
                    <div key={label} className={`flex justify-between text-sm ${isRtl?"flex-row-reverse":""}`}>
                      <span style={{color:"rgba(147,197,253,.7)"}}>{label}</span><span className="font-bold text-white">{value}</span>
                    </div>
                  ))}
                  <div className={`border-t pt-3 flex justify-between items-center ${isRtl?"flex-row-reverse":""}`} style={{borderColor:"rgba(255,255,255,.1)"}}>
                    <span className="text-sm" style={{color:"rgba(147,197,253,.7)"}}>{t.yourQueue}</span>
                    <span className="queue-num text-5xl font-black">#{successInfo.queueNumber}</span>
                  </div>
                </div>
                <button onClick={resetAll} className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                  style={{background:dk?"rgba(255,255,255,.04)":"#f3f4f6",color:dk?"rgba(255,255,255,.4)":"#6b7280",border:`1px solid ${cardBorder}`,cursor:"pointer"}}>{t.backToClinics}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ CHATBOT — NovaMed AI ════ */}
      <div className="fixed bottom-5 end-5 z-50" style={{fontFamily:"Cairo, sans-serif"}}>
        {chatOpen&&(
          <div className="chat-window mb-3 flex flex-col overflow-hidden" style={{
            width:360,height:540,
            background:"linear-gradient(160deg,#080f1f 0%,#0a1628 50%,#060d1a 100%)",
            border:"1px solid rgba(56,189,248,0.15)",
            borderRadius:24,
            boxShadow:"0 32px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(56,189,248,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
            position:"relative",
          }}>
            <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(56,189,248,0.04) 1px,transparent 1px)",backgroundSize:"24px 24px",borderRadius:24,pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:200,background:"radial-gradient(ellipse at 50% -20%,rgba(56,189,248,0.12),transparent 70%)",pointerEvents:"none",borderRadius:24}}/>

            {/* Header */}
            <div className="relative flex-shrink-0 px-5 py-4" style={{borderBottom:"1px solid rgba(56,189,248,0.1)"}}>
              <div className={`flex items-center justify-between ${isRtl?"flex-row-reverse":""}`}>
                <div className={`flex items-center gap-3 ${isRtl?"flex-row-reverse":""}`}>
                  <div className="relative flex-shrink-0">
                    <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#0ea5e9,#38bdf8,#7dd3fc)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(56,189,248,0.4), 0 0 40px rgba(56,189,248,0.15)"}}>
                      <Bot size={20} color="white"/>
                    </div>
                    <div style={{position:"absolute",bottom:1,right:1,width:9,height:9,borderRadius:"50%",background:"#22c55e",border:"2px solid #080f1f",boxShadow:"0 0 6px #22c55e"}}/>
                  </div>
                  <div className={isRtl?"text-right":""}>
                    <div className={`flex items-center gap-2 ${isRtl?"flex-row-reverse":""}`}>
                      <p style={{fontSize:"0.95rem",fontWeight:900,background:"linear-gradient(135deg,#f0f9ff,#bae6fd)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:"-0.02em"}}>NovaMed</p>
                      <span style={{fontSize:"0.55rem",fontWeight:800,letterSpacing:"0.15em",color:"#0ea5e9",background:"rgba(14,165,233,0.12)",border:"1px solid rgba(14,165,233,0.25)",padding:"1px 5px",borderRadius:4}}>AI</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${isRtl?"flex-row-reverse":""}`}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 4px #22c55e"}}/>
                      <p style={{fontSize:"0.65rem",color:"rgba(148,163,184,0.7)",fontWeight:600}}>{t.chatSubtitle}</p>
                    </div>
                  </div>
                </div>
                <button onClick={()=>setChatOpen(false)} style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(148,163,184,0.6)"}}>
                  <ChevronDown size={15}/>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative" dir={t.dir} style={{scrollbarWidth:"thin",scrollbarColor:"rgba(56,189,248,0.2) transparent"}}>
              {chatMsgs.map((msg,i)=>(
                <div key={i} className={`flex ${msg.role==="user"?(isRtl?"justify-start":"justify-end"):(isRtl?"justify-end":"justify-start")} fade-in`}>
                  {msg.role==="assistant"&&(
                    <div className="flex-shrink-0 me-2.5 mt-1" style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#0c4a6e,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(14,165,233,0.3)",border:"1px solid rgba(56,189,248,0.2)"}}>
                      <Bot size={13} color="#bae6fd"/>
                    </div>
                  )}
                  <div style={{maxWidth:"76%"}}>
                    <div style={msg.role==="user"?{
                      background:"linear-gradient(135deg,#0c4a6e,#0369a1)",color:"#e0f2fe",
                      borderRadius:"16px 16px 4px 16px",padding:"10px 14px",fontSize:"0.82rem",lineHeight:1.6,
                      boxShadow:"0 4px 16px rgba(14,165,233,0.2)",border:"1px solid rgba(56,189,248,0.2)",
                    }:{
                      background:"rgba(255,255,255,0.04)",color:"rgba(226,232,240,0.9)",
                      borderRadius:"16px 16px 16px 4px",padding:"10px 14px",fontSize:"0.82rem",lineHeight:1.6,
                      border:"1px solid rgba(255,255,255,0.07)",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                  {msg.role==="user"&&(
                    <div className="flex-shrink-0 ms-2.5 mt-1" style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid rgba(255,255,255,0.1)"}}>
                      <User size={13} color="rgba(148,163,184,0.8)"/>
                    </div>
                  )}
                </div>
              ))}
              {chatLoading&&(
                <div className={`flex ${isRtl?"justify-end":"justify-start"} fade-in`}>
                  <div className="flex-shrink-0 me-2.5" style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#0c4a6e,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px rgba(14,165,233,0.3)",border:"1px solid rgba(56,189,248,0.2)"}}>
                    <Bot size={13} color="#bae6fd"/>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px 16px 16px 4px",padding:"12px 16px",display:"flex",alignItems:"center",gap:5}}>
                    <span className="nova-dot"/><span className="nova-dot"/><span className="nova-dot"/>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Quick questions */}
            {chatMsgs.length<=1&&(
              <div className="px-4 pb-3">
                <p style={{fontSize:"0.6rem",fontWeight:700,letterSpacing:"0.12em",color:"rgba(100,116,139,0.5)",marginBottom:8,textTransform:"uppercase",direction:t.dir}}>
                  {lang==="ar"?"أسئلة سريعة":"Quick Questions"}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{direction:t.dir,scrollbarWidth:"none"}}>
                  {(isRtl?QUICK_Q_AR:QUICK_Q_EN).map((q)=>(
                    <button key={q} onClick={()=>sendChat(q)}
                      style={{flexShrink:0,fontSize:"0.7rem",padding:"5px 11px",borderRadius:20,cursor:"pointer",background:"rgba(14,165,233,0.08)",color:"#7dd3fc",border:"1px solid rgba(56,189,248,0.18)",whiteSpace:"nowrap",fontFamily:"Cairo, sans-serif",fontWeight:600,transition:"all 0.2s"}}
                      onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(14,165,233,0.18)";e.currentTarget.style.borderColor="rgba(56,189,248,0.4)";}}
                      onMouseLeave={(e)=>{e.currentTarget.style.background="rgba(14,165,233,0.08)";e.currentTarget.style.borderColor="rgba(56,189,248,0.18)";}}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 p-3" style={{borderTop:"1px solid rgba(56,189,248,0.08)"}}>
              <div className={`flex items-center gap-2 ${isRtl?"flex-row-reverse":""}`}
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"6px 6px 6px 14px"}}
                onFocusCapture={(e)=>{e.currentTarget.style.borderColor="rgba(56,189,248,0.4)";e.currentTarget.style.boxShadow="0 0 0 3px rgba(56,189,248,0.08)";}}
                onBlurCapture={(e)=>{e.currentTarget.style.borderColor="rgba(56,189,248,0.15)";e.currentTarget.style.boxShadow="none";}}>
                <input ref={chatInputRef} type="text" value={chatInput} onChange={(e)=>setChatInput(e.target.value)}
                  onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendChat(chatInput);}}}
                  placeholder={t.chatPlaceholder}
                  style={{flex:1,background:"transparent",border:"none",outline:"none",color:"rgba(226,232,240,0.9)",fontSize:"0.82rem",fontFamily:"Cairo, sans-serif",direction:t.dir,fontWeight:500}}/>
                <button onClick={()=>sendChat(chatInput)} disabled={chatLoading||!chatInput.trim()}
                  style={{width:34,height:34,borderRadius:10,border:"none",cursor:chatInput.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",background:chatInput.trim()?"linear-gradient(135deg,#0ea5e9,#0284c7)":"rgba(255,255,255,0.04)",boxShadow:chatInput.trim()?"0 0 16px rgba(14,165,233,0.4)":"none"}}>
                  <Send size={14} color={chatInput.trim()?"white":"rgba(100,116,139,0.4)"} style={{transform:isRtl?"rotate(180deg)":"none"}}/>
                </button>
              </div>
              <p style={{fontSize:"0.58rem",textAlign:"center",color:"rgba(100,116,139,0.35)",marginTop:8,fontWeight:500}}>NovaMed AI · Smart Clinic</p>
            </div>
          </div>
        )}

        {/* FAB */}
        <button onClick={()=>{setChatOpen((v)=>!v);setChatUnread(0);setTimeout(()=>chatInputRef.current?.focus(),300);}}
          className="relative flex items-center justify-center transition-all active:scale-95"
          style={{
            width:58,height:58,
            background:chatOpen?"rgba(14,165,233,0.15)":"linear-gradient(135deg,#0c4a6e,#0ea5e9,#38bdf8)",
            boxShadow:chatOpen?"0 8px 24px rgba(0,0,0,.4), 0 0 0 1px rgba(56,189,248,0.2)":"0 8px 32px rgba(14,165,233,0.5), 0 0 0 1px rgba(56,189,248,0.3), 0 0 60px rgba(14,165,233,0.15)",
            border:chatOpen?"1px solid rgba(56,189,248,0.25)":"none",
            borderRadius:18,cursor:"pointer",marginLeft:"auto",
            transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
          {chatOpen?<X size={22} color="rgba(56,189,248,0.8)"/>:<MessageCircle size={22} color="white"/>}
          {!chatOpen&&<div style={{position:"absolute",inset:-3,borderRadius:21,border:"1px solid rgba(56,189,248,0.2)",animation:"pulseRing 2s ease-in-out infinite",pointerEvents:"none"}}/>}
          {!chatOpen&&chatUnread>0&&(
            <span style={{position:"absolute",top:-4,right:-4,width:20,height:20,borderRadius:"50%",background:"linear-gradient(135deg,#ef4444,#dc2626)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.6rem",fontWeight:900,color:"white",boxShadow:"0 0 10px rgba(239,68,68,0.6)",border:"2px solid #080f1f"}}>
              {chatUnread}
            </span>
          )}
        </button>
      </div>

      {/* REVIEW DIALOG */}
      <Dialog open={showReview} onOpenChange={(v)=>{setShowReview(v);if(!v){setReviewRating(0);setReviewDone(false);}}}>
        <DialogContent dir={t.dir} className="sm:max-w-sm rounded-3xl p-0 overflow-hidden" style={{background:dk?"#0d1a2e":"white",border:`1px solid ${cardBorder}`,fontFamily:"Cairo, sans-serif"}}>
          {(()=>{
            const clinic=CLINICS.find((c)=>c.id===reviewClinicId);
            const rating=reviewClinicId?clinicRatings[reviewClinicId]:null;
            const alreadyReviewed=rating?.userReviewed??false;
            return (
              <>
                <div className={`relative h-20 bg-gradient-to-r ${clinic?.grad??"from-blue-500 to-indigo-600"} flex items-center justify-center`}>
                  <span className="text-4xl">{clinic?.icon}</span>
                  <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(rgba(255,255,255,.08) 1px,transparent 1px)",backgroundSize:"16px 16px"}}/>
                </div>
                <div className="p-6">
                  <DialogHeader><DialogTitle className="text-center font-black text-lg mb-1" style={{color:textPrimary}}>{cName(clinic,lang)}</DialogTitle></DialogHeader>
                  {reviewDone?(
                    <div className="flex flex-col items-center gap-3 py-6 fade-in">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{background:"rgba(34,197,94,.15)"}}><CheckCircle2 size={28} className="text-green-400"/></div>
                      <p className="font-bold text-center" style={{color:textPrimary}}>{t.reviewSuccess}</p>
                    </div>
                  ):alreadyReviewed?(
                    <div className="py-5 space-y-3 text-center">
                      <div className="flex justify-center"><RatingDisplay value={rating?.avgRating??0}/></div>
                      <p className="font-black text-3xl" style={{color:"#fbbf24"}}>{rating?.avgRating?.toFixed(1)}</p>
                      <p className="text-xs" style={{color:textFaint}}>{rating?.totalReviews} {t.totalReviews}</p>
                      <div className="rounded-xl p-3 mt-2" style={{background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.15)"}}>
                        <p className="text-xs font-semibold flex items-center justify-center gap-1.5" style={{color:"#fbbf24"}}><Star size={12} fill="#fbbf24" stroke="#fbbf24"/>{t.alreadyReviewed}</p>
                      </div>
                    </div>
                  ):(
                    <div className="py-4 space-y-5">
                      {rating&&rating.totalReviews>0&&<div className={`flex items-center gap-2 rounded-xl p-3 ${isRtl?"flex-row-reverse":""}`} style={{background:dk?"rgba(255,255,255,.04)":"#f9fafb",border:`1px solid ${cardBorder}`}}>
                        <RatingDisplay value={rating.avgRating} small/>
                        <span className="text-sm font-bold" style={{color:"#fbbf24"}}>{rating.avgRating.toFixed(1)}</span>
                        <span className="text-xs" style={{color:textFaint}}>({rating.totalReviews} {t.totalReviews})</span>
                      </div>}
                      {(!rating||rating.totalReviews===0)&&<p className="text-center text-xs" style={{color:textFaint}}>{t.noReviews}</p>}
                      <div className="text-center space-y-3">
                        <p className="text-sm font-bold" style={{color:textMuted}}>{t.reviewPrompt}</p>
                        <div className="flex justify-center"><StarRating value={reviewRating} onChange={setReviewRating} size={36}/></div>
                      </div>
                      <div className={`flex gap-2.5 ${isRtl?"flex-row-reverse":""}`}>
                        <Button variant="outline" className="flex-1" onClick={()=>setShowReview(false)} style={{background:"transparent",borderColor:cardBorder,color:textMuted,fontFamily:"Cairo, sans-serif"}}>{t.back}</Button>
                        <Button className="flex-1 text-white" disabled={reviewRating===0||submittingReview} onClick={handleSubmitReview}
                          style={{background:reviewRating>0?`linear-gradient(135deg,${clinic?.glow??"#3b82f6"},${clinic?.glow??"#1d4ed8"}cc)`:undefined,fontFamily:"Cairo, sans-serif"}}>
                          {submittingReview?<Loader2 size={14} className="animate-spin"/>:t.submitReview}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* CONFIRM */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent dir={t.dir} className="sm:max-w-sm rounded-2xl" style={{background:dk?"#0d1a2e":"white",border:`1px solid ${cardBorder}`,fontFamily:"Cairo, sans-serif"}}>
          <DialogHeader><DialogTitle style={{color:textPrimary}}>{t.confirmTitle}</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3 text-sm">
            <div className="rounded-xl p-4 space-y-2" style={{background:dk?"rgba(255,255,255,.05)":"#f9fafb",border:`1px solid ${cardBorder}`}}>
              {[{label:t.clinic,value:cName(selectedClinic,lang)},{label:t.date,value:selectedDate?fmtDate(selectedDate,lang):""},{label:t.time,value:selectedSlot?.time??""}].map(({label,value})=>(
                <div key={label} className={`flex justify-between ${isRtl?"flex-row-reverse":""}`}>
                  <span style={{color:textMuted}}>{label}</span><span className="font-semibold" style={{color:textPrimary}}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{color:textFaint}}>{t.oneAppt}</p>
          </div>
          <div className={`flex gap-3 ${isRtl?"flex-row-reverse":""}`}>
            <Button variant="outline" className="flex-1" onClick={()=>setShowConfirm(false)} disabled={booking} style={{background:"transparent",borderColor:cardBorder,color:textMuted}}>{t.back}</Button>
            <Button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white" onClick={handleBook} disabled={booking}>
              {booking?<span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin"/>{t.booking}</span>:t.confirm}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CANCEL */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent dir={t.dir} className="sm:max-w-sm rounded-2xl" style={{background:dk?"#0d1a2e":"white",border:`1px solid ${cardBorder}`,fontFamily:"Cairo, sans-serif"}}>
          <DialogHeader><DialogTitle style={{color:textPrimary}}>{t.cancelTitle}</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="rounded-xl p-4 space-y-2 text-sm mb-3" style={{background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.15)"}}>
              {[{label:t.clinic,value:activeAppt?.clinicName??""},{label:t.date,value:activeAppt?fmtDate(activeAppt.date,lang):""},{label:t.time,value:activeAppt?.time??""},{label:t.queue,value:`#${activeAppt?.queueNumber}`}].map(({label,value})=>(
                <div key={label} className={`flex justify-between ${isRtl?"flex-row-reverse":""}`}>
                  <span style={{color:textMuted}}>{label}</span><span className="font-semibold" style={{color:textPrimary}}>{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-center" style={{color:textFaint}}>{t.slotFreed}</p>
          </div>
          <div className={`flex gap-3 ${isRtl?"flex-row-reverse":""}`}>
            <Button variant="outline" className="flex-1" onClick={()=>setShowCancelConfirm(false)} disabled={cancelling} style={{background:"transparent",borderColor:cardBorder,color:textMuted}}>{t.keepIt}</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white" onClick={handleCancel} disabled={cancelling}>
              {cancelling?<span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin"/>{t.cancelling}</span>:t.yesCancel}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}