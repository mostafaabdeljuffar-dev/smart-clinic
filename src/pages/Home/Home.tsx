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
  LayoutDashboard, XCircle, AlertCircle, Sparkles, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Clinic list ──────────────────────────────────────────────────────────────
const CLINICS = [
  { id: "cardio_clinic",            name: "Cardiology",        icon: "🫀", color: "from-rose-500 to-pink-600" },
  { id: "chest_clinic",             name: "Chest",             icon: "🫁", color: "from-sky-500 to-blue-600" },
  { id: "dental_clinic",            name: "Dental",            icon: "🦷", color: "from-teal-500 to-cyan-600" },
  { id: "derma_clinic",             name: "Dermatology",       icon: "✨", color: "from-amber-500 to-orange-500" },
  { id: "ent_clinic",               name: "ENT",               icon: "👂", color: "from-violet-500 to-purple-600" },
  { id: "eye_clinic",               name: "Eye",               icon: "👁️", color: "from-indigo-500 to-blue-600" },
  { id: "gynecology_clinic",        name: "Gynecology",        icon: "🌸", color: "from-pink-500 to-rose-500" },
  { id: "internal_medicine_female", name: "Internal (Female)", icon: "💊", color: "from-fuchsia-500 to-pink-600" },
  { id: "internal_medicine_male",   name: "Internal (Male)",   icon: "💊", color: "from-blue-500 to-indigo-600" },
  { id: "neurology_clinic",         name: "Neurology",         icon: "🧠", color: "from-purple-500 to-violet-600" },
  { id: "neurosurgery_clinic",      name: "Neurosurgery",      icon: "⚕️", color: "from-slate-600 to-gray-700" },
  { id: "nutrition_clinic",         name: "Nutrition",         icon: "🥗", color: "from-green-500 to-emerald-600" },
  { id: "orthopedic_clinic",        name: "Orthopedic",        icon: "🦴", color: "from-orange-500 to-amber-600" },
  { id: "physiotherapy_clinic",     name: "Physiotherapy",     icon: "🏃", color: "from-lime-500 to-green-600" },
  { id: "surgery_clinic",           name: "Surgery",           icon: "🔬", color: "from-red-500 to-rose-600" },
  { id: "urology_clinic",           name: "Urology",           icon: "💧", color: "from-cyan-500 to-sky-600" },
];

type Slot = { id: string; time: string; date: string; capacity: number; maxCapacity: number };
type SlotsByDate = Record<string, Slot[]>;
type Step = "clinics" | "booking" | "success";
type ActiveAppointment = {
  id: string; clinicId: string; clinicName: string; clinicIcon: string;
  date: string; time: string; queueNumber: number; slotId: string;
};

// ─── helpers ─────────────────────────────────────────────────────────────────
const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

// ─── Component ────────────────────────────────────────────────────────────────
export default function AppointmentBooking() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser]     = useState<any>(null);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [authChecked, setAuthChecked]     = useState(false);

  const [selectedClinic, setSelectedClinic] = useState<(typeof CLINICS)[0] | null>(null);
  const [slotsByDate, setSlotsByDate]       = useState<SlotsByDate>({});
  const [slotsLoading, setSlotsLoading]     = useState(false);
  const [selectedDate, setSelectedDate]     = useState("");
  const [selectedSlot, setSelectedSlot]     = useState<Slot | null>(null);

  const [step, setStep]                   = useState<Step>("clinics");
  const [booking, setBooking]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling]       = useState(false);

  const [activeAppointment, setActiveAppointment] = useState<ActiveAppointment | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ queueNumber: number; clinicName: string; clinicIcon: string; date: string; time: string } | null>(null);

  // ── Auth + role guard ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Doctor? → redirect to their dashboard
          const doctorDoc = await getDoc(doc(db, "doctors", user.uid));
          if (doctorDoc.exists() && doctorDoc.data().role === "doctor") {
            navigate("/doctor-dashboard", { replace: true });
            return;
          }
          // Users collection
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role;
            if (role === "admin") setIsAdmin(true);
            else if (role !== "patient") {
              navigate("/unauthorized", { replace: true });
              return;
            }
          }
        } catch (_) {}
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, [navigate]);

  // ── Active appointment ───────────────────────────────────────────────────
  const fetchActiveAppointment = useCallback(async () => {
    if (!currentUser) return;
    setAppointmentLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, "appointments"),
        where("patientId", "==", currentUser.uid),
        where("status", "==", "upcoming")
      ));
      if (!snap.empty) {
        const d = snap.docs[0]; const data = d.data();
        const clinic = CLINICS.find((c) => c.id === data.clinicId);
        setActiveAppointment({
          id: d.id, clinicId: data.clinicId,
          clinicName: clinic?.name ?? data.clinicId,
          clinicIcon: clinic?.icon ?? "🏥",
          date: data.date, time: data.time,
          queueNumber: data.queueNumber, slotId: data.slotId,
        });
      } else setActiveAppointment(null);
    } catch (_) {}
    setAppointmentLoading(false);
  }, [currentUser]);

  useEffect(() => { if (currentUser) fetchActiveAppointment(); }, [currentUser, fetchActiveAppointment]);

  // ── Slots listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedClinic) return;
    setSlotsLoading(true); setSlotsByDate({}); setSelectedDate(""); setSelectedSlot(null);
    const unsub = onSnapshot(
      query(collection(db, "clinicSlots"), where("clinicId", "==", selectedClinic.id), where("isAvailable", "==", true)),
      (snapshot) => {
        const grouped: SlotsByDate = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (new Date(data.date + "T00:00:00").getDay() === 5) return;
          const slot: Slot = { id: d.id, time: data.time, date: data.date, capacity: data.capacity ?? 0, maxCapacity: data.maxCapacity ?? 10 };
          if (!grouped[data.date]) grouped[data.date] = [];
          grouped[data.date].push(slot);
        });
        const toMin = (t: string) => {
          const [time, p] = t.split(" "); let [h, m] = time.split(":").map(Number);
          if (p === "PM" && h !== 12) h += 12; if (p === "AM" && h === 12) h = 0;
          return h * 60 + m;
        };
        Object.values(grouped).forEach((s) => s.sort((a, b) => toMin(a.time) - toMin(b.time)));
        setSlotsByDate(grouped); setSlotsLoading(false);
      }
    );
    return () => unsub();
  }, [selectedClinic]);

  const sortedDates = Object.keys(slotsByDate).filter((d) => new Date(d + "T00:00:00").getDay() !== 5).sort().slice(0, 7);

  // ── Book ────────────────────────────────────────────────────────────────
  const handleBookNow = async () => {
    if (!currentUser || !selectedClinic || !selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const slotRef = doc(db, "clinicSlots", selectedSlot.id);
      let queueNumber = 0;
      await runTransaction(db, async (transaction) => {
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists()) throw new Error("Slot no longer exists.");
        const slotData = slotSnap.data();
        if (!slotData.isAvailable) throw new Error("This slot is no longer available.");
        const capacity: number = slotData.capacity ?? 0;
        const maxCapacity: number = slotData.maxCapacity ?? 10;
        if (capacity >= maxCapacity) throw new Error("This slot is fully booked.");
        const existingSnap = await getDocs(query(collection(db, "appointments"), where("patientId", "==", currentUser.uid), where("status", "==", "upcoming")));
        if (!existingSnap.empty) throw new Error("EXISTING_APPOINTMENT");
        const queueSnap = await getDocs(query(collection(db, "appointments"), where("clinicId", "==", selectedClinic.id), where("date", "==", selectedDate)));
        queueNumber = queueSnap.size + 1;
        const newCapacity = capacity + 1;
        transaction.update(slotRef, { capacity: newCapacity, ...(newCapacity >= maxCapacity ? { isAvailable: false } : {}) });
        const apptRef = doc(collection(db, "appointments"));
        transaction.set(apptRef, {
          clinicId: selectedClinic.id, patientId: currentUser.uid,
          patientName: currentUser.displayName ?? currentUser.email,
          slotId: selectedSlot.id, date: selectedDate, time: selectedSlot.time,
          queueNumber, status: "upcoming", createdAt: serverTimestamp(),
        });
      });
      setSuccessInfo({ queueNumber, clinicName: selectedClinic.name, clinicIcon: selectedClinic.icon, date: selectedDate, time: selectedSlot.time });
      setShowConfirm(false); setStep("success");
      await fetchActiveAppointment();
    } catch (err: any) {
      setShowConfirm(false);
      if (err.message === "EXISTING_APPOINTMENT") alert("You already have an upcoming appointment. Please cancel it first.");
      else alert(err.message || "Booking failed. Please try again.");
    } finally { setBooking(false); }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────
  const handleCancelAppointment = async () => {
    if (!activeAppointment) return;
    setCancelling(true);
    try {
      const slotRef = doc(db, "clinicSlots", activeAppointment.slotId);
      const apptRef = doc(db, "appointments", activeAppointment.id);
      await runTransaction(db, async (transaction) => {
        const slotSnap = await transaction.get(slotRef);
        transaction.delete(apptRef);
        if (slotSnap.exists()) {
          const data = slotSnap.data();
          transaction.update(slotRef, { capacity: Math.max(0, (data.capacity ?? 0) - 1), isAvailable: true });
        }
      });
      const remaining = await getDocs(query(collection(db, "appointments"), where("clinicId", "==", activeAppointment.clinicId), where("date", "==", activeAppointment.date), where("status", "==", "upcoming")));
      const sorted = remaining.docs.map((d) => ({ ref: d.ref, queue: d.data().queueNumber as number })).sort((a, b) => a.queue - b.queue);
      await Promise.all(sorted.map((item, idx) => updateDoc(item.ref, { queueNumber: idx + 1 })));
      setActiveAppointment(null); setShowCancelConfirm(false);
    } catch (err: any) { alert(err.message || "Cancellation failed."); }
    finally { setCancelling(false); }
  };

  const resetAll = () => {
    setSelectedClinic(null); setSelectedDate(""); setSelectedSlot(null);
    setSuccessInfo(null); setStep("clinics"); fetchActiveAppointment();
  };

  if (!authChecked) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2544] to-[#1a3a60]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto backdrop-blur-sm">
          <Loader2 className="animate-spin text-white" size={28} />
        </div>
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f4f9]">

      {/* Admin bar */}
      {isAdmin && (
        <div className="bg-[#0f2544] py-2 px-6 flex justify-end">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all border border-white/20">
            <LayoutDashboard size={15} /> Dashboard
          </button>
        </div>
      )}

      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2544] via-[#1a3a60] to-[#185ba5] text-white">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-blue-400/10 blur-2xl" />

        <div className="relative max-w-4xl mx-auto px-4 py-12">
          {step !== "clinics" && (
            <button onClick={resetAll} className="flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-5 transition-colors group">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to clinics
            </button>
          )}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Sparkles size={11} /> Smart Clinic
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
                {step === "clinics" && <>Book Your<br /><span className="text-blue-300">Appointment</span></>}
                {step === "booking" && <>{selectedClinic?.icon} {selectedClinic?.name}<br /><span className="text-blue-300 text-2xl font-bold">Select a Slot</span></>}
                {step === "success" && <>Booking<br /><span className="text-green-300">Confirmed ✓</span></>}
              </h1>
              <p className="text-blue-200/70 mt-2 text-sm">
                {step === "clinics" && "16 clinics · Available 6 days a week · Instant confirmation"}
                {step === "booking" && "Pick a date and time that works for you"}
                {step === "success" && "Your queue number is reserved — see you soon!"}
              </p>
            </div>

            {step === "clinics" && (
              <div className="hidden sm:flex flex-col items-end gap-1 text-right">
                <div className="flex items-center gap-1.5 text-blue-300 text-xs"><MapPin size={12} /> All specialties</div>
                <div className="text-3xl font-black text-white">16<span className="text-blue-300 text-lg font-bold"> clinics</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Active appointment banner ── */}
        {step === "clinics" && currentUser && (
          <>
            {appointmentLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded w-48" />
              </div>
            ) : activeAppointment ? (
              <div className="relative overflow-hidden bg-gradient-to-r from-[#1a3a60] to-[#185ba5] rounded-2xl p-5 shadow-lg shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl leading-none mt-1">{activeAppointment.clinicIcon}</div>
                    <div>
                      <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mb-0.5">Upcoming Appointment</p>
                      <p className="text-white font-black text-lg leading-tight">{activeAppointment.clinicName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="bg-white/15 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CalendarDays size={11} /> {formatDate(activeAppointment.date)}
                        </span>
                        <span className="bg-white/15 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock size={11} /> {activeAppointment.time}
                        </span>
                        <span className="bg-yellow-400/20 text-yellow-300 text-xs font-black px-2.5 py-1 rounded-full">
                          Queue #{activeAppointment.queueNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 text-xs font-semibold border border-red-400/30 rounded-xl px-3 py-2 transition-all flex-shrink-0">
                    <XCircle size={13} /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={18} className="text-green-500" />
                </div>
                <div>
                  <p className="text-gray-700 text-sm font-semibold">No upcoming appointments</p>
                  <p className="text-gray-400 text-xs mt-0.5">Pick a clinic below to get started</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 1: Clinic Grid ── */}
        {step === "clinics" && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Choose a Clinic</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {CLINICS.map((clinic, i) => (
                <button key={clinic.id} onClick={() => { if (!currentUser) { navigate("/login"); return; } setSelectedClinic(clinic); setStep("booking"); }}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 p-5 text-left overflow-hidden"
                >
                  {/* hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${clinic.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-2xl`} />
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${clinic.color} flex items-center justify-center mb-3 text-xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    {clinic.icon}
                  </div>
                  <p className="font-bold text-[#1a3a60] text-sm leading-snug">{clinic.name}</p>
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 group-hover:text-[#185ba5] transition-colors">
                    Book now <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Date & Time ── */}
        {step === "booking" && selectedClinic && (
          <div className="space-y-5">
            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-[#185ba5]" size={32} />
                <p className="text-gray-400 text-sm">Loading available slots...</p>
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <CalendarDays size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">No available slots right now</p>
                <p className="text-gray-400 text-sm mt-1">Please check back later</p>
              </div>
            ) : (
              <>
                {/* Date selector */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <CalendarDays size={15} className="text-[#185ba5]" />
                    </div>
                    <h2 className="font-bold text-[#1a3a60] text-sm">Select Date</h2>
                    <span className="text-xs text-gray-300 ml-1">· Fri excluded</span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {sortedDates.map((date) => {
                      const d = new Date(date + "T00:00:00");
                      const isSelected = selectedDate === date;
                      const count = slotsByDate[date]?.length ?? 0;
                      return (
                        <button key={date} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                          className={`flex-shrink-0 flex flex-col items-center rounded-2xl px-4 py-3 min-w-[68px] transition-all duration-150 border ${
                            isSelected
                              ? "bg-gradient-to-b from-[#185ba5] to-[#1a3a60] text-white border-transparent shadow-lg shadow-blue-300/30 scale-105"
                              : "bg-white text-[#1a3a60] border-gray-200 hover:border-blue-200 hover:shadow-sm"
                          }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span className="text-2xl font-black leading-tight">{d.getDate()}</span>
                          <span className={`text-[10px] ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className={`text-[10px] mt-1 font-bold ${isSelected ? "text-yellow-300" : "text-[#185ba5]"}`}>
                            {count} slots
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time selector */}
                {selectedDate && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Clock size={15} className="text-[#185ba5]" />
                      </div>
                      <h2 className="font-bold text-[#1a3a60] text-sm">Select Time</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {(slotsByDate[selectedDate] ?? []).map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const spotsLeft = slot.maxCapacity - slot.capacity;
                        const almostFull = spotsLeft <= 3;
                        return (
                          <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                            className={`flex flex-col items-center rounded-xl border px-3 py-3.5 transition-all duration-150 ${
                              isSelected
                                ? "bg-gradient-to-b from-[#185ba5] to-[#1a3a60] text-white border-transparent shadow-lg shadow-blue-300/30 scale-105"
                                : "bg-white text-[#1a3a60] border-gray-200 hover:border-blue-200 hover:shadow-sm"
                            }`}>
                            <span className="text-sm font-bold">{slot.time}</span>
                            <span className={`text-[10px] mt-1 font-semibold ${
                              isSelected ? "text-blue-200" : almostFull ? "text-orange-500" : "text-gray-400"
                            }`}>
                              {spotsLeft} left
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary card */}
                {selectedDate && selectedSlot && (
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                    <div className={`h-1.5 bg-gradient-to-r ${selectedClinic.color}`} />
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedClinic.color} flex items-center justify-center text-2xl shadow-md`}>
                          {selectedClinic.icon}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Appointment Summary</p>
                          <p className="font-black text-[#1a3a60] text-lg">{selectedClinic.name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          { label: "Date", value: formatDate(selectedDate), icon: <CalendarDays size={13} /> },
                          { label: "Time", value: selectedSlot.time, icon: <Clock size={13} /> },
                          { label: "Spots Left", value: `${selectedSlot.maxCapacity - selectedSlot.capacity}/${selectedSlot.maxCapacity}`, icon: <Sparkles size={13} /> },
                        ].map(({ label, value, icon }) => (
                          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">{icon}<span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span></div>
                            <p className="font-bold text-[#1a3a60] text-sm">{value}</p>
                          </div>
                        ))}
                      </div>

                      {activeAppointment ? (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          <span>You already have an appointment at <strong>{activeAppointment.clinicName}</strong>. Cancel it first.</span>
                        </div>
                      ) : (
                        <button onClick={() => setShowConfirm(true)}
                          className={`w-full py-4 rounded-xl font-black text-white text-sm bg-gradient-to-r ${selectedClinic.color} hover:opacity-90 shadow-lg transition-all active:scale-[0.98]`}>
                          Confirm Booking →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && successInfo && (
          <div className="flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center max-w-sm w-full">
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-200">
                  <span className="text-3xl">{successInfo.clinicIcon}</span>
                </div>
              </div>

              <h2 className="text-2xl font-black text-[#1a3a60] mb-1">You're Booked!</h2>
              <p className="text-gray-400 text-sm mb-6">Your appointment is confirmed</p>

              <div className="bg-gradient-to-br from-[#0f2544] to-[#185ba5] rounded-2xl p-5 mb-5 text-left space-y-3">
                {[
                  { label: "Clinic", value: successInfo.clinicName },
                  { label: "Date", value: formatDate(successInfo.date) },
                  { label: "Time", value: successInfo.time },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-blue-300">{label}</span>
                    <span className="font-bold text-white">{value}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-blue-300 text-sm">Your Queue #</span>
                  <span className="text-4xl font-black text-yellow-300">#{successInfo.queueNumber}</span>
                </div>
              </div>

              <button onClick={resetAll}
                className="w-full py-4 rounded-xl font-bold text-[#1a3a60] bg-gray-100 hover:bg-gray-200 transition-colors text-sm">
                Back to Clinics
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm Dialog ── */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[#1a3a60]">Confirm Booking</DialogTitle></DialogHeader>
          <div className="py-2 space-y-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              {[
                { label: "Clinic", value: selectedClinic?.name },
                { label: "Date", value: selectedDate ? formatDate(selectedDate) : "" },
                { label: "Time", value: selectedSlot?.time },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-[#1a3a60]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs text-center">One active appointment at a time.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={booking}>Back</Button>
            <Button className="flex-1 bg-[#185ba5] hover:bg-[#134885] text-white" onClick={handleBookNow} disabled={booking}>
              {booking ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Booking...</span> : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Dialog ── */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader><DialogTitle className="text-[#1a3a60]">Cancel Appointment</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2 text-sm mb-3">
              {[
                { label: "Clinic", value: activeAppointment?.clinicName },
                { label: "Date", value: activeAppointment ? formatDate(activeAppointment.date) : "" },
                { label: "Time", value: activeAppointment?.time },
                { label: "Queue #", value: `#${activeAppointment?.queueNumber}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-[#1a3a60]">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs text-center">Slot will be freed and queue adjusted automatically.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={cancelling}>Keep it</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleCancelAppointment} disabled={cancelling}>
              {cancelling ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Cancelling...</span> : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
