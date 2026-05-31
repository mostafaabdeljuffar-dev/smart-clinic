import { useState, useEffect } from "react";
import { Calendar, Check, X, Clock, User, Hash, Stethoscope, Loader2, Sun } from "lucide-react";
import DoctorLayout from "@/components/layouts/DoctorLayout";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase";
import {
  collection, query, where, onSnapshot,
  doc, getDoc, deleteDoc, getDocs, updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/auth";

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  patientEmail?: string;
  date: string;
  time: string;
  queueNumber: number;
  slotId: string;
  status: string;
  createdAt: any;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const todayDate = new Date();
const IS_FRIDAY = todayDate.getDay() === 5;
const START_DATE = IS_FRIDAY
  ? new Date(todayDate.getTime() + 24 * 60 * 60 * 1000)
  : todayDate;

const getWeekDates = (): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(START_DATE);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

const WEEK_DATES = getWeekDates();

const formatDateLong = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

const formatDateShort = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("ar-EG", {
    weekday: "long", month: "short", day: "numeric",
  });

const formatClinicName = (id: string) =>
  id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isToday    = (d: string) => d === todayDate.toISOString().split("T")[0];
const isTomorrow = (d: string) => {
  const t = new Date(todayDate);
  t.setDate(t.getDate() + 1);
  return d === t.toISOString().split("T")[0];
};
const getDayLabel = (d: string) => {
  if (isToday(d))    return "اليوم";
  if (isTomorrow(d)) return "غداً";
  return null;
};

// ── Email helpers (via /api/send-email) ───────────────────────────────────────
async function sendEmail(payload: {
  type: "confirm" | "cancel";
  to_email: string;
  patient_name: string;
  clinic_name: string;
  date: string;
  time: string;
  queue?: number;
}) {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Email API error: ${res.status}`);
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

async function getPatientEmail(patientId: string): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, "users", patientId));
    if (!snap.exists()) return null;
    return snap.data().email ?? null;
  } catch { return null; }
}

// ════════════════════════════════════════════════════════════════════════════
export default function DoctorDashboard() {
  const { user } = useAuth();

  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [clinicId,      setClinicId]      = useState<string | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });
  const [cancelModal,  setCancelModal]  = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch clinicId ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "doctors", user.userId!));
        if (snap.exists()) setClinicId(snap.data().clinicId ?? null);
      } catch (err) { console.error(err); }
      finally { setClinicLoading(false); }
    })();
  }, [user?.userId]);

  // ── Real-time appointments listener ────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return;
    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", clinicId),
      where("status",   "==", "upcoming"),
      where("date",     "in", WEEK_DATES)
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Appointment[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }))
        .sort((a, b) =>
          a.date !== b.date
            ? a.date.localeCompare(b.date)
            : a.queueNumber - b.queueNumber
        );
      setAppointments(list);
    });
    return () => unsub();
  }, [clinicId]);

  // ── Group by date ───────────────────────────────────────────────────────
  const groupedByDate = WEEK_DATES.reduce((acc, date) => {
    acc[date] = appointments.filter((a) => a.date === date);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // ── Reorder queue after delete ──────────────────────────────────────────
  const reorderQueue = async (date: string) => {
    const remaining = await getDocs(query(
      collection(db, "appointments"),
      where("clinicId", "==", clinicId!),
      where("date",     "==", date),
      where("status",   "==", "upcoming")
    ));
    const sorted = remaining.docs
      .map((d) => ({ ref: d.ref, q: d.data().queueNumber as number }))
      .sort((a, b) => a.q - b.q);
    await Promise.all(sorted.map((item, i) => updateDoc(item.ref, { queueNumber: i + 1 })));
  };

  // ── Confirm (done) ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const appt = confirmModal.appointment;
    if (!appt) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "appointments", appt.id));
      await reorderQueue(appt.date);

      const email = await getPatientEmail(appt.patientId);
      if (email) {
        await sendEmail({
          type: "confirm",
          to_email: email,
          patient_name: appt.patientName,
          clinic_name:  formatClinicName(clinicId!),
          date:  appt.date,
          time:  appt.time,
          queue: appt.queueNumber,
        });
      }
      setConfirmModal({ open: false, appointment: null });
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ── Cancel ──────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    const appt = cancelModal.appointment;
    if (!appt) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "appointments", appt.id));

      // Free the slot
      if (appt.slotId) {
        const slotRef  = doc(db, "clinicSlots", appt.slotId);
        const slotSnap = await getDoc(slotRef);
        if (slotSnap.exists()) {
          const cap = slotSnap.data().capacity ?? 0;
          await updateDoc(slotRef, { capacity: Math.max(0, cap - 1), isAvailable: true });
        }
      }

      await reorderQueue(appt.date);

      const email = await getPatientEmail(appt.patientId);
      if (email) {
        await sendEmail({
          type: "cancel",
          to_email: email,
          patient_name: appt.patientName,
          clinic_name:  formatClinicName(clinicId!),
          date: appt.date,
          time: appt.time,
        });
      }
      setCancelModal({ open: false, appointment: null });
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (clinicLoading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#1a3a60] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#1a3a60] font-medium">Loading your clinic...</p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  const totalAppointments = appointments.length;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <DoctorLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1a3a60]">
              Welcome, Dr. {user?.userName}
            </h1>
            {clinicId && (
              <div className="flex items-center gap-1.5 mt-1">
                <Stethoscope size={14} className="text-blue-500" />
                <span className="text-sm text-blue-600 font-medium">{formatClinicName(clinicId)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {IS_FRIDAY && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-semibold">
                <Sun size={15} />
                Today is a holiday — showing week from Saturday
              </div>
            )}
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
              <Calendar size={15} />
              {formatDateShort(WEEK_DATES[0])}
            </div>
            <div className="bg-[#1a3a60] text-white px-4 py-2 rounded-xl text-sm font-semibold">
              {totalAppointments} upcoming
            </div>
          </div>
        </div>

        {/* Empty state */}
        {totalAppointments === 0 && (
          <div className="bg-white p-12 rounded-3xl shadow-xl shadow-blue-900/5 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-blue-300" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a3a60] mb-1">لا توجد مواعيد هذا الأسبوع</h3>
            <p className="text-gray-400 text-sm">قائمة الانتظار فارغة للأسبوع القادم</p>
          </div>
        )}

        {/* Week appointments grouped by day */}
        <div className="space-y-4">
          {WEEK_DATES.map((date) => {
            const dayAppts      = groupedByDate[date];
            if (dayAppts.length === 0) return null;
            const dayLabel      = getDayLabel(date);
            const todayHighlight = isToday(date);

            return (
              <div key={date} className={`bg-white rounded-3xl shadow-xl overflow-hidden ${
                todayHighlight ? "ring-2 ring-blue-400 shadow-blue-900/10" : "shadow-blue-900/5"
              }`}>
                {/* Day header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${
                  todayHighlight
                    ? "bg-gradient-to-r from-[#1a3a60]/10 to-blue-50"
                    : "bg-gradient-to-r from-[#1a3a60]/5 to-transparent"
                }`}>
                  <h2 className="text-base font-bold text-[#1a3a60] flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    {formatDateLong(date)}
                    {dayLabel && (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        todayHighlight ? "bg-blue-500 text-white" : "bg-amber-100 text-amber-700"
                      }`}>
                        {dayLabel}
                      </span>
                    )}
                  </h2>
                  <span className="bg-[#1a3a60] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {dayAppts.length} patients
                  </span>
                </div>

                {/* Appointments rows */}
                <div className="divide-y divide-gray-50">
                  {dayAppts.map((app) => (
                    <div key={app.id} className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition-colors flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1a3a60] to-blue-600 flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
                          <span className="text-white font-bold text-sm">#{app.queueNumber}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <User size={13} className="text-gray-400" />
                            <p className="font-semibold text-[#1a3a60] text-sm">{app.patientName}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock size={12} />
                              <span className="text-xs">{app.time}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Hash size={11} />
                              <span className="text-xs font-mono truncate max-w-[100px]">{app.patientId}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                          {app.status}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmModal({ open: true, appointment: app })}
                            title="Mark as Done"
                            className="w-9 h-9 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setCancelModal({ open: true, appointment: app })}
                            title="Cancel"
                            className="w-9 h-9 bg-red-500 text-white rounded-xl hover:bg-red-600 flex items-center justify-center shadow-sm transition-all hover:scale-105 active:scale-95"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => !actionLoading && setConfirmModal({ open, appointment: null })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a60]">Mark as Done</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                {confirmModal.appointment && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
                      <User size={14} /> {confirmModal.appointment.patientName}
                    </div>
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <Clock size={13} /> {confirmModal.appointment.time}
                    </div>
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <Hash size={13} /> Queue #{confirmModal.appointment.queueNumber}
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  This will remove the appointment and send a confirmation email to the patient.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, appointment: null })} disabled={actionLoading}>
              Back
            </Button>
            <Button onClick={handleConfirm} className="bg-green-500 hover:bg-green-600 text-white" disabled={actionLoading}>
              {actionLoading ? <Loader2 size={15} className="animate-spin mr-2" /> : <Check size={15} className="mr-2" />}
              Mark as Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Modal ── */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => !actionLoading && setCancelModal({ open, appointment: null })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a60]">Cancel Appointment</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-1">
                {cancelModal.appointment && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2 space-y-1.5">
                    <div className="flex items-center gap-2 text-red-800 font-semibold text-sm">
                      <User size={14} /> {cancelModal.appointment.patientName}
                    </div>
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <Clock size={13} /> {cancelModal.appointment.time}
                    </div>
                    <div className="flex items-center gap-2 text-red-700 text-sm">
                      <Hash size={13} /> Queue #{cancelModal.appointment.queueNumber}
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  The patient will receive a cancellation email and lose their queue spot.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModal({ open: false, appointment: null })} disabled={actionLoading}>
              Keep It
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={15} className="animate-spin mr-2" /> : <X size={15} className="mr-2" />}
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  );
}
