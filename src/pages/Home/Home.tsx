import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  Loader2,
  ChevronLeft,
  CalendarDays,
  Clock,
  CheckCircle2,
  LayoutDashboard,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CLINICS = [
  { id: "cardio_clinic",            name: "Cardiology" },
  { id: "chest_clinic",             name: "Chest" },
  { id: "dental_clinic",            name: "Dental" },
  { id: "derma_clinic",             name: "Dermatology" },
  { id: "ent_clinic",               name: "ENT" },
  { id: "eye_clinic",               name: "Eye" },
  { id: "gynecology_clinic",        name: "Gynecology" },
  { id: "internal_medicine_female", name: "Internal Medicine (Female)" },
  { id: "internal_medicine_male",   name: "Internal Medicine (Male)" },
  { id: "neurology_clinic",         name: "Neurology" },
  { id: "neurosurgery_clinic",      name: "Neurosurgery" },
  { id: "nutrition_clinic",         name: "Nutrition" },
  { id: "orthopedic_clinic",        name: "Orthopedic" },
  { id: "physiotherapy_clinic",     name: "Physiotherapy" },
  { id: "surgery_clinic",           name: "Surgery" },
  { id: "urology_clinic",           name: "Urology" },
];

type Slot = {
  id: string;
  time: string;
  date: string;
  capacity: number;
  maxCapacity: number;
};
type SlotsByDate = Record<string, Slot[]>;
type Step = "clinics" | "booking" | "success";

type ActiveAppointment = {
  id: string;
  clinicId: string;
  clinicName: string;
  date: string;
  time: string;
  queueNumber: number;
  slotId: string;
};

export default function AppointmentBooking() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [selectedClinic, setSelectedClinic] = useState<(typeof CLINICS)[0] | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<SlotsByDate>({});
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [step, setStep] = useState<Step>("clinics");
  const [booking, setBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const [activeAppointment, setActiveAppointment] = useState<ActiveAppointment | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  const [successInfo, setSuccessInfo] = useState<{
    queueNumber: number;
    clinicName: string;
    date: string;
    time: string;
  } | null>(null);

  // Auth + admin check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
          }
        } catch (_) {}
      }
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Fetch user's active appointment
  const fetchActiveAppointment = useCallback(async () => {
    if (!currentUser) return;
    setAppointmentLoading(true);
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientId", "==", currentUser.uid),
        where("status", "==", "upcoming")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        const clinic = CLINICS.find((c) => c.id === data.clinicId);
        setActiveAppointment({
          id: d.id,
          clinicId: data.clinicId,
          clinicName: clinic?.name ?? data.clinicId,
          date: data.date,
          time: data.time,
          queueNumber: data.queueNumber,
          slotId: data.slotId,
        });
      } else {
        setActiveAppointment(null);
      }
    } catch (_) {}
    setAppointmentLoading(false);
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchActiveAppointment();
  }, [currentUser, fetchActiveAppointment]);

  // Real-time slots listener (only available slots, no Fridays)
  useEffect(() => {
    if (!selectedClinic) return;

    setSlotsLoading(true);
    setSlotsByDate({});
    setSelectedDate("");
    setSelectedSlot(null);

    const q = query(
      collection(db, "clinicSlots"),
      where("clinicId", "==", selectedClinic.id),
      where("isAvailable", "==", true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const grouped: SlotsByDate = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        // Skip Fridays (getDay() === 5)
        const dayOfWeek = new Date(data.date + "T00:00:00").getDay();
        if (dayOfWeek === 5) return;

        const slot: Slot = {
          id: d.id,
          time: data.time,
          date: data.date,
          capacity: data.capacity ?? 0,
          maxCapacity: data.maxCapacity ?? 10,
        };
        if (!grouped[data.date]) grouped[data.date] = [];
        grouped[data.date].push(slot);
      });

      // Sort times within each date
      const timeToMin = (t: string) => {
        const [time, period] = t.split(" ");
        let [h, m] = time.split(":").map(Number);
        if (period === "PM" && h !== 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return h * 60 + m;
      };
      Object.values(grouped).forEach((slots) =>
        slots.sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
      );

      setSlotsByDate(grouped);
      setSlotsLoading(false);
    });

    return () => unsub();
  }, [selectedClinic]);

  // Sorted dates, no Fridays, max 7 days
  const sortedDates = Object.keys(slotsByDate)
    .filter((d) => new Date(d + "T00:00:00").getDay() !== 5)
    .sort()
    .slice(0, 7);

  const handleSelectClinic = (clinic: (typeof CLINICS)[0]) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setSelectedClinic(clinic);
    setStep("booking");
  };

  // Transaction-based booking
  const handleBookNow = async () => {
    if (!currentUser || !selectedClinic || !selectedDate || !selectedSlot) return;
    setBooking(true);

    try {
      const slotRef = doc(db, "clinicSlots", selectedSlot.id);
      let queueNumber = 0;

      await runTransaction(db, async (transaction) => {
        // 1. Read slot
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists()) throw new Error("Slot no longer exists.");

        const slotData = slotSnap.data();
        if (!slotData.isAvailable) throw new Error("This slot is no longer available.");

        const capacity: number = slotData.capacity ?? 0;
        const maxCapacity: number = slotData.maxCapacity ?? 10;
        if (capacity >= maxCapacity) throw new Error("This slot is fully booked.");

        // 2. Check existing upcoming appointment
        const existingSnap = await getDocs(
          query(
            collection(db, "appointments"),
            where("patientId", "==", currentUser.uid),
            where("status", "==", "upcoming")
          )
        );
        if (!existingSnap.empty) throw new Error("EXISTING_APPOINTMENT");

        // 3. Calculate queue number
        const queueSnap = await getDocs(
          query(
            collection(db, "appointments"),
            where("clinicId", "==", selectedClinic.id),
            where("date", "==", selectedDate)
          )
        );
        queueNumber = queueSnap.size + 1;

        const newCapacity = capacity + 1;
        const nowFull = newCapacity >= maxCapacity;

        // 4. Update slot
        transaction.update(slotRef, {
          capacity: newCapacity,
          ...(nowFull ? { isAvailable: false } : {}),
        });

        // 5. Create appointment
        const apptRef = doc(collection(db, "appointments"));
        transaction.set(apptRef, {
          clinicId: selectedClinic.id,
          patientId: currentUser.uid,
          patientName: currentUser.displayName ?? currentUser.email,
          slotId: selectedSlot.id,
          date: selectedDate,
          time: selectedSlot.time,
          queueNumber,
          status: "upcoming",
          createdAt: serverTimestamp(),
        });
      });

      setSuccessInfo({
        queueNumber,
        clinicName: selectedClinic.name,
        date: selectedDate,
        time: selectedSlot.time,
      });

      setShowConfirm(false);
      setStep("success");
      await fetchActiveAppointment();
    } catch (err: any) {
      setShowConfirm(false);
      if (err.message === "EXISTING_APPOINTMENT") {
        alert("You already have an upcoming appointment. Please cancel it first.");
      } else {
        alert(err.message || "Booking failed. Please try again.");
      }
    } finally {
      setBooking(false);
    }
  };

  // Cancel appointment — decrement capacity, re-open slot, reorder queue
  const handleCancelAppointment = async () => {
    if (!activeAppointment) return;
    setCancelling(true);

    try {
      const slotRef = doc(db, "clinicSlots", activeAppointment.slotId);
      const apptRef = doc(db, "appointments", activeAppointment.id);

      await runTransaction(db, async (transaction) => {
        const slotSnap = await transaction.get(slotRef);

        // Delete appointment
        transaction.delete(apptRef);

        // Decrement capacity and re-open slot
        if (slotSnap.exists()) {
          const data = slotSnap.data();
          const newCapacity = Math.max(0, (data.capacity ?? 0) - 1);
          transaction.update(slotRef, {
            capacity: newCapacity,
            isAvailable: true,
          });
        }
      });

      // Reorder queue numbers for remaining appointments on that day
      const remaining = await getDocs(
        query(
          collection(db, "appointments"),
          where("clinicId", "==", activeAppointment.clinicId),
          where("date", "==", activeAppointment.date),
          where("status", "==", "upcoming")
        )
      );
      const sorted = remaining.docs
        .map((d) => ({ ref: d.ref, queue: d.data().queueNumber as number }))
        .sort((a, b) => a.queue - b.queue);

      await Promise.all(
        sorted.map((item, idx) => updateDoc(item.ref, { queueNumber: idx + 1 }))
      );

      setActiveAppointment(null);
      setShowCancelConfirm(false);
    } catch (err: any) {
      alert(err.message || "Cancellation failed. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const resetAll = () => {
    setSelectedClinic(null);
    setSelectedDate("");
    setSelectedSlot(null);
    setSuccessInfo(null);
    setStep("clinics");
    fetchActiveAppointment();
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#185ba5]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Admin Bar */}
      {isAdmin && (
        <div className="bg-[#1a3a60] py-2 px-6 flex justify-end">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-white text-[#1a3a60] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#1a3a60] to-[#185ba5] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          {step !== "clinics" && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to clinics
            </button>
          )}
          <h1 className="text-3xl font-bold">
            {step === "clinics" && "Book an Appointment"}
            {step === "booking" && `${selectedClinic?.name} Clinic`}
            {step === "success" && "Booking Confirmed"}
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            {step === "clinics" && "Choose a clinic to get started"}
            {step === "booking" && "Select an available date and time"}
            {step === "success" && "Your appointment has been successfully booked"}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Active Appointment Banner — only on clinics step */}
        {step === "clinics" && currentUser && (
          <>
            {appointmentLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-gray-400" />
                <span className="text-gray-400 text-sm">Checking your appointments...</span>
              </div>
            ) : activeAppointment ? (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#185ba5] flex items-center justify-center flex-shrink-0">
                      <CalendarDays size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a3a60] text-sm">Upcoming Appointment</p>
                      <p className="text-[#185ba5] font-bold mt-0.5">{activeAppointment.clinicName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{formatDate(activeAppointment.date)}</span>
                        <span>·</span>
                        <span>{activeAppointment.time}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#185ba5]">Queue #{activeAppointment.queueNumber}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-xs font-semibold border border-red-200 hover:border-red-400 bg-white rounded-lg px-3 py-2 transition-all flex-shrink-0"
                  >
                    <XCircle size={14} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-green-500" />
                </div>
                <p className="text-gray-500 text-sm">No upcoming appointments — pick a clinic below!</p>
              </div>
            )}
          </>
        )}

        {/* Step 1 — Clinic Grid */}
        {step === "clinics" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CLINICS.map((clinic) => (
              <button
                key={clinic.id}
                onClick={() => handleSelectClinic(clinic)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                  <CalendarDays size={20} className="text-[#185ba5]" />
                </div>
                <p className="font-semibold text-[#1a3a60] text-sm leading-snug">{clinic.name}</p>
                <p className="text-xs text-gray-400 mt-1">Book →</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Date & Time Picker */}
        {step === "booking" && selectedClinic && (
          <div className="space-y-6">
            {slotsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#185ba5]" size={36} />
              </div>
            ) : sortedDates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No available slots right now</p>
                <p className="text-gray-400 text-sm mt-1">Please check back later</p>
              </div>
            ) : (
              <>
                {/* Date Row */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays size={18} className="text-[#185ba5]" />
                    <h2 className="font-semibold text-[#1a3a60]">Select Date</h2>
                    <span className="text-xs text-gray-400 ml-1">(Fri excluded)</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {sortedDates.map((date) => {
                      const d = new Date(date + "T00:00:00");
                      const isSelected = selectedDate === date;
                      const slotsCount = slotsByDate[date]?.length ?? 0;
                      return (
                        <button
                          key={date}
                          onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                          className={`flex-shrink-0 flex flex-col items-center rounded-2xl border px-5 py-3 min-w-[72px] transition-all ${
                            isSelected
                              ? "bg-[#185ba5] text-white border-[#185ba5] shadow-md shadow-blue-200"
                              : "bg-white text-[#1a3a60] border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <span className={`text-xs font-medium ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                            {d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                          </span>
                          <span className="text-xl font-bold leading-tight">{d.getDate()}</span>
                          <span className={`text-xs ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span className={`text-xs mt-1 font-semibold ${isSelected ? "text-blue-100" : "text-[#185ba5]"}`}>
                            {slotsCount} slot{slotsCount !== 1 ? "s" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Grid */}
                {selectedDate && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock size={18} className="text-[#185ba5]" />
                      <h2 className="font-semibold text-[#1a3a60]">Select Time</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {(slotsByDate[selectedDate] ?? []).map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        const spotsLeft = slot.maxCapacity - slot.capacity;
                        const isAlmostFull = spotsLeft <= 3;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setSelectedSlot(slot)}
                            className={`flex flex-col items-center rounded-xl border px-3 py-3 transition-all ${
                              isSelected
                                ? "bg-[#185ba5] text-white border-[#185ba5] shadow-md shadow-blue-200"
                                : "bg-white text-[#1a3a60] border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <span className="text-sm font-semibold">{slot.time}</span>
                            <span className={`text-xs mt-1 ${
                              isSelected ? "text-blue-200" : isAlmostFull ? "text-orange-500 font-semibold" : "text-gray-400"
                            }`}>
                              {spotsLeft} left
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedDate && selectedSlot && (
                  <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6">
                    <h3 className="font-semibold text-[#1a3a60] mb-4">Appointment Summary</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Clinic</span>
                        <span className="font-semibold text-[#1a3a60]">{selectedClinic.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span className="font-semibold text-[#1a3a60]">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time</span>
                        <span className="font-semibold text-[#1a3a60]">{selectedSlot.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capacity</span>
                        <span className={`font-semibold ${
                          selectedSlot.maxCapacity - selectedSlot.capacity <= 3
                            ? "text-orange-500"
                            : "text-green-600"
                        }`}>
                          {selectedSlot.maxCapacity - selectedSlot.capacity} / {selectedSlot.maxCapacity} spots left
                        </span>
                      </div>
                    </div>

                    {activeAppointment ? (
                      <div className="mt-5 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>
                          You already have an appointment at {activeAppointment.clinicName}. Cancel it first to book a new one.
                        </span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowConfirm(true)}
                        className="w-full mt-5 bg-[#185ba5] hover:bg-[#134885] text-white rounded-xl py-5 font-semibold shadow-lg shadow-blue-200"
                      >
                        Book Now
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3 — Success */}
        {step === "success" && successInfo && (
          <div className="flex items-center justify-center py-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#1a3a60] mb-1">Booking Confirmed!</h2>
              <p className="text-gray-500 text-sm mb-6">Your appointment details</p>
              <div className="bg-blue-50 rounded-2xl p-6 mb-6 text-left space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Clinic</span>
                  <span className="font-semibold text-[#1a3a60]">{successInfo.clinicName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-[#1a3a60]">{formatDate(successInfo.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Time</span>
                  <span className="font-semibold text-[#1a3a60]">{successInfo.time}</span>
                </div>
                <div className="border-t border-blue-100 pt-3 flex justify-between items-center">
                  <span className="text-gray-500">Queue Number</span>
                  <span className="text-2xl font-bold text-[#185ba5]">#{successInfo.queueNumber}</span>
                </div>
              </div>
              <Button
                onClick={resetAll}
                className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-xl py-5 font-semibold"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Booking Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Clinic</span>
                <span className="font-medium text-[#1a3a60]">{selectedClinic?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-[#1a3a60]">{selectedDate ? formatDate(selectedDate) : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-[#1a3a60]">{selectedSlot?.time}</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs text-center">
              You can only have one active appointment at a time.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={booking}>
              Back
            </Button>
            <Button
              className="flex-1 bg-[#185ba5] hover:bg-[#134885] text-white"
              onClick={handleBookNow}
              disabled={booking}
            >
              {booking ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Booking...
                </span>
              ) : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2 text-sm mb-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Clinic</span>
                <span className="font-medium text-[#1a3a60]">{activeAppointment?.clinicName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-[#1a3a60]">
                  {activeAppointment ? formatDate(activeAppointment.date) : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-[#1a3a60]">{activeAppointment?.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Queue #</span>
                <span className="font-semibold text-[#185ba5]">#{activeAppointment?.queueNumber}</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs text-center">
              This slot will be freed up and the queue will be adjusted for others.
            </p>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelConfirm(false)} disabled={cancelling}>
              Keep it
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleCancelAppointment}
              disabled={cancelling}
            >
              {cancelling ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Cancelling...
                </span>
              ) : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
