import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  Clock, User, CheckCircle, AlertCircle, XCircle, Eye,
  CalendarDays, Trash2, RefreshCw, ChevronLeft, Loader2,
  UmbrellaOff, CalendarX, AlarmMinus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase";
import {
  collection, query, where, getDocs, onSnapshot,
  updateDoc, deleteDoc, doc, writeBatch, serverTimestamp, Timestamp,
} from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLINICS = [
  { id: "cardio_clinic",            name: "Cardiology",                 nameAr: "عيادة القلب" },
  { id: "chest_clinic",             name: "Chest",                      nameAr: "عيادة الصدر" },
  { id: "dental_clinic",            name: "Dental",                     nameAr: "عيادة الأسنان" },
  { id: "derma_clinic",             name: "Dermatology",                nameAr: "عيادة الجلدية" },
  { id: "ent_clinic",               name: "ENT",                        nameAr: "عيادة الأنف والأذن" },
  { id: "eye_clinic",               name: "Eye",                        nameAr: "عيادة العيون" },
  { id: "gynecology_clinic",        name: "Gynecology",                 nameAr: "عيادة النساء والتوليد" },
  { id: "internal_medicine_female", name: "Internal Medicine (Female)", nameAr: "قسم الباطنة للنساء" },
  { id: "internal_medicine_male",   name: "Internal Medicine (Male)",   nameAr: "قسم الباطنة للرجال" },
  { id: "neurology_clinic",         name: "Neurology",                  nameAr: "عيادة الأعصاب" },
  { id: "neurosurgery_clinic",      name: "Neurosurgery",               nameAr: "عيادة جراحة الأعصاب" },
  { id: "nutrition_clinic",         name: "Nutrition",                  nameAr: "عيادة التغذية" },
  { id: "orthopedic_clinic",        name: "Orthopedic",                 nameAr: "عيادة العظام" },
  { id: "physiotherapy_clinic",     name: "Physiotherapy",              nameAr: "عيادة العلاج الطبيعي" },
  { id: "surgery_clinic",           name: "Surgery",                    nameAr: "عيادة الجراحة" },
  { id: "urology_clinic",           name: "Urology",                    nameAr: "عيادة المسالك البولية" },
];

const TIME_SLOTS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM"];
const MAX_CAPACITY = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

type Appointment = {
  id: string; clinicId: string; patientId: string; patientName: string;
  date: string; time: string; slotId: string; queueNumber: number;
  status: string; createdAt?: Timestamp;
};
type ClinicSummary = { clinicId: string; totalAppointments: number; upcomingCount: number };
type VacationMode = "full_day" | "specific_slot";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns next 7 calendar days starting from today,
 * EXCLUDING Friday (day === 5).
 * Result is always 6 working days (Sat–Thu).
 */
function getWorkingDays(): string[] {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);

  // If today is Friday, skip to Saturday
  if (cursor.getDay() === 5) {
    cursor.setDate(cursor.getDate() + 1);
  }

  // Collect 7 days skipping Friday = always 6 working days
  for (let i = 0; i < 7; i++) {
    if (cursor.getDay() !== 5) {
      days.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Appointments() {
  const [selectedClinic, setSelectedClinic] = useState<(typeof CLINICS)[0] | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ClinicSummary>>({});
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [apptLoading, setApptLoading] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [generateDone, setGenerateDone] = useState(false);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Vacation
  const [showVacation, setShowVacation] = useState(false);
  const [vacMode, setVacMode] = useState<VacationMode>("full_day");
  const [vacDate, setVacDate] = useState("");
  const [vacClinic, setVacClinic] = useState("");
  const [vacTime, setVacTime] = useState("");
  const [vacLoading, setVacLoading] = useState(false);
  const [vacDone, setVacDone] = useState<string | null>(null);

  const workingDays = getWorkingDays();

  // ── Summary listener ──
  useEffect(() => {
    setSummaryLoading(true);
    const unsub = onSnapshot(query(collection(db, "appointments")), (snap) => {
      const map: Record<string, ClinicSummary> = {};
      snap.docs.forEach((d) => {
        const data = d.data(); const cid = data.clinicId as string;
        if (!map[cid]) map[cid] = { clinicId: cid, totalAppointments: 0, upcomingCount: 0 };
        map[cid].totalAppointments++;
        if (data.status === "upcoming") map[cid].upcomingCount++;
      });
      setSummaries(map); setSummaryLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Clinic appointments listener ──
  useEffect(() => {
    if (!selectedClinic) return;
    setApptLoading(true);
    const unsub = onSnapshot(
      query(collection(db, "appointments"), where("clinicId", "==", selectedClinic.id)),
      (snap) => {
        const list: Appointment[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }));
        list.sort((a, b) => a.date !== b.date ? a.date.localeCompare(b.date) : a.queueNumber - b.queueNumber);
        setAppointments(list); setApptLoading(false);
      }
    );
    return () => unsub();
  }, [selectedClinic]);

  // ── Generate weekly slots ──
  const generateWeeklySlots = async () => {
    setGenerating(true); setGenerateDone(false);
    try {
      const days = getWorkingDays(); // 6 days, no Friday

      // Delete all existing slots
      const existingSnap = await getDocs(collection(db, "clinicSlots"));
      const toDelete = existingSnap.docs.map((d) => d.ref);
      for (let i = 0; i < toDelete.length; i += 500) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + 500).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      // Create new slots: 16 clinics × 6 days × 5 times = 480 docs
      const newSlots: object[] = [];
      for (const clinic of CLINICS)
        for (const date of days)
          for (const time of TIME_SLOTS)
            newSlots.push({
              clinicId: clinic.id, date, time,
              isAvailable: true, capacity: 0, maxCapacity: MAX_CAPACITY,
              slotId: "", createdAt: serverTimestamp(),
            });

      for (let i = 0; i < newSlots.length; i += 500) {
        const batch = writeBatch(db);
        newSlots.slice(i, i + 500).forEach((slot) => {
          batch.set(doc(collection(db, "clinicSlots")), slot);
        });
        await batch.commit();
      }
      setGenerateDone(true);
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setGenerating(false); setShowGenerateConfirm(false); }
  };

  // ── Delete appointment ──
  const handleDeleteAppointment = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "appointments", deleteTarget.id));
      if (deleteTarget.slotId) {
        const slotSnap = await getDocs(query(collection(db, "clinicSlots"), where("__name__", "==", deleteTarget.slotId)));
        if (!slotSnap.empty) {
          const slotData = slotSnap.docs[0].data();
          await updateDoc(doc(db, "clinicSlots", deleteTarget.slotId), {
            capacity: Math.max(0, (slotData.capacity ?? 0) - 1), isAvailable: true,
          });
        }
      }
      const remainingSnap = await getDocs(query(
        collection(db, "appointments"),
        where("clinicId", "==", deleteTarget.clinicId),
        where("date", "==", deleteTarget.date),
        where("status", "==", "upcoming")
      ));
      const sorted = remainingSnap.docs
        .map((d) => ({ ref: d.ref, queue: d.data().queueNumber as number }))
        .sort((a, b) => a.queue - b.queue);
      await Promise.all(sorted.map((item, idx) => updateDoc(item.ref, { queueNumber: idx + 1 })));
      setDeleteTarget(null);
    } catch (err: any) { alert("Error: " + err.message); }
    finally { setDeleting(false); }
  };

  // ── Vacation: Cancel full day ──
  const handleCancelFullDay = async () => {
    if (!vacDate) return;
    setVacLoading(true); setVacDone(null);
    try {
      const slotsSnap = await getDocs(query(collection(db, "clinicSlots"), where("date", "==", vacDate)));
      if (slotsSnap.empty) { setVacDone("⚠️ No slots found for this date."); return; }
      const batch = writeBatch(db);
      slotsSnap.docs.forEach((d) => batch.update(d.ref, { isAvailable: false }));
      await batch.commit();
      setVacDone(`✅ Cancelled all ${slotsSnap.size} slots for ${formatDate(vacDate)}.`);
    } catch (err: any) { setVacDone("❌ Error: " + err.message); }
    finally { setVacLoading(false); }
  };

  // ── Vacation: Cancel specific slot ──
  const handleCancelSpecificSlot = async () => {
    if (!vacDate || !vacClinic || !vacTime) return;
    setVacLoading(true); setVacDone(null);
    try {
      const slotsSnap = await getDocs(query(
        collection(db, "clinicSlots"),
        where("clinicId", "==", vacClinic),
        where("date", "==", vacDate),
        where("time", "==", vacTime)
      ));
      if (slotsSnap.empty) { setVacDone("⚠️ Slot not found."); return; }
      const batch = writeBatch(db);
      slotsSnap.docs.forEach((d) => batch.update(d.ref, { isAvailable: false }));
      await batch.commit();
      const clinicName = CLINICS.find(c => c.id === vacClinic)?.nameAr ?? vacClinic;
      setVacDone(`✅ Cancelled ${vacTime} slot for ${clinicName} on ${formatDate(vacDate)}.`);
    } catch (err: any) { setVacDone("❌ Error: " + err.message); }
    finally { setVacLoading(false); }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (filterDate && a.date !== filterDate) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });
  const uniqueDates = [...new Set(appointments.map((a) => a.date))].sort();

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      upcoming:  { bg: "bg-blue-100",   text: "text-blue-700",   icon: <Clock size={11} className="inline mr-1" /> },
      completed: { bg: "bg-green-100",  text: "text-green-700",  icon: <CheckCircle size={11} className="inline mr-1" /> },
      cancelled: { bg: "bg-red-100",    text: "text-red-700",    icon: <XCircle size={11} className="inline mr-1" /> },
      pending:   { bg: "bg-orange-100", text: "text-orange-700", icon: <AlertCircle size={11} className="inline mr-1" /> },
    };
    const s = map[status] ?? map["pending"];
    return <span className={`${s.bg} ${s.text} px-2.5 py-1 rounded-full text-xs font-semibold capitalize`}>{s.icon}{status}</span>;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1a3a60] mb-1">Appointments</h1>
            <p className="text-gray-500 text-sm">Manage bookings and generate weekly slots</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => { setShowVacation(true); setVacDone(null); setVacDate(""); setVacClinic(""); setVacTime(""); }}
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
            >
              <UmbrellaOff size={16} /> Manage Vacation
            </Button>
            <Button
              onClick={() => { setGenerateDone(false); setShowGenerateConfirm(true); }}
              className="bg-[#185ba5] hover:bg-[#134885] text-white flex items-center gap-2"
              disabled={generating}
            >
              {generating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><CalendarDays size={16} /> Generate Weekly Slots</>}
            </Button>
          </div>
        </div>

        {generateDone && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 text-sm text-green-700">
            <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
            Weekly slots generated successfully — 6 working days (Sat–Thu, no Friday) × 16 clinics × 5 times = 480 slots.
          </div>
        )}

        {/* Clinic Cards */}
        {!selectedClinic ? (
          <div>
            {summaryLoading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#185ba5]" size={36} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {CLINICS.map((clinic) => {
                  const summary = summaries[clinic.id];
                  return (
                    <div key={clinic.id}
                      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6"
                      onClick={() => { setSelectedClinic(clinic); setFilterDate(""); setFilterStatus(""); }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-[#1a3a60] text-base">{clinic.nameAr}</h3>
                          <p className="text-sm text-gray-400 mt-0.5">{clinic.name}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <CalendarDays size={18} className="text-[#185ba5]" />
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm mb-4">
                        <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-[#185ba5]">{summary?.upcomingCount ?? 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Upcoming</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-gray-600">{summary?.totalAppointments ?? 0}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Total</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full"
                        onClick={(e) => { e.stopPropagation(); setSelectedClinic(clinic); setFilterDate(""); setFilterStatus(""); }}>
                        <Eye size={14} className="mr-2" /> View Appointments
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setSelectedClinic(null)} className="flex items-center gap-1 text-gray-500 hover:text-[#185ba5] text-sm transition-colors">
                <ChevronLeft size={16} /> All Clinics
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-semibold text-[#1a3a60]">{selectedClinic.nameAr}</span>
              <span className="text-gray-400 text-sm">({selectedClinic.name})</span>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
              <span className="text-sm text-gray-500 font-medium">Filter:</span>
              <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1a3a60] bg-white focus:outline-none focus:border-blue-400">
                <option value="">All Dates</option>
                {uniqueDates.map((d) => <option key={d} value={d}>{formatDate(d)}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1a3a60] bg-white focus:outline-none focus:border-blue-400">
                <option value="">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {(filterDate || filterStatus) && (
                <button onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <XCircle size={13} /> Clear
                </button>
              )}
              <span className="ml-auto text-sm text-gray-400">{filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}</span>
            </div>

            {apptLoading ? (
              <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#185ba5]" size={32} /></div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <CalendarDays size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appt) => (
                  <div key={appt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 flex-wrap">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-[#185ba5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1a3a60] text-sm truncate">{appt.patientName}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><CalendarDays size={11} /> {formatDate(appt.date)}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={11} /> {appt.time}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#185ba5]">Queue #{appt.queueNumber}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={appt.status} />
                      <button onClick={() => setDeleteTarget(appt)} className="text-gray-300 hover:text-red-500 transition-colors" title="Cancel">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════ VACATION DIALOG ════ */}
      <Dialog open={showVacation} onOpenChange={(o) => { setShowVacation(o); setVacDone(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1a3a60]">
              <UmbrellaOff size={18} className="text-orange-500" /> Manage Vacation / Cancel Slots
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mt-1">
            <button onClick={() => { setVacMode("full_day"); setVacDone(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${vacMode === "full_day" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
              <CalendarX size={15} /> Full Day Off
            </button>
            <button onClick={() => { setVacMode("specific_slot"); setVacDone(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${vacMode === "specific_slot" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-500 border-gray-200 hover:border-orange-300"}`}>
              <AlarmMinus size={15} /> Specific Slot
            </button>
          </div>

          <div className="space-y-4 mt-2">
            {vacMode === "full_day" && (
              <>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>This will mark <strong>all slots</strong> across all clinics on the selected day as <strong>unavailable</strong>.</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Select Day</label>
                  <div className="grid grid-cols-3 gap-2">
                    {workingDays.map((d) => (
                      <button key={d} onClick={() => setVacDate(d)}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${vacDate === d ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
                        {formatDate(d)}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCancelFullDay} disabled={!vacDate || vacLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  {vacLoading ? <><Loader2 size={15} className="animate-spin mr-2" /> Processing...</> : <><CalendarX size={15} className="mr-2" /> Cancel Full Day</>}
                </Button>
              </>
            )}

            {vacMode === "specific_slot" && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>Select a clinic, day and time to cancel that specific slot only.</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Clinic</label>
                  <select value={vacClinic} onChange={(e) => setVacClinic(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-[#1a3a60] bg-white focus:outline-none focus:border-orange-400">
                    <option value="">Select clinic...</option>
                    {CLINICS.map((c) => <option key={c.id} value={c.id}>{c.nameAr} — {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Day</label>
                  <div className="grid grid-cols-3 gap-2">
                    {workingDays.map((d) => (
                      <button key={d} onClick={() => setVacDate(d)}
                        className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all text-center ${vacDate === d ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
                        {formatDate(d)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1.5">Time Slot</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button key={t} onClick={() => setVacTime(t)}
                        className={`py-1.5 px-4 rounded-xl text-xs font-semibold border transition-all ${vacTime === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCancelSpecificSlot} disabled={!vacDate || !vacClinic || !vacTime || vacLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  {vacLoading ? <><Loader2 size={15} className="animate-spin mr-2" /> Processing...</> : <><AlarmMinus size={15} className="mr-2" /> Cancel This Slot</>}
                </Button>
              </>
            )}

            {vacDone && (
              <div className={`rounded-xl p-3 text-sm font-medium text-center ${vacDone.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {vacDone}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ GENERATE CONFIRM DIALOG ════ */}
      <Dialog open={showGenerateConfirm} onOpenChange={setShowGenerateConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Generate Weekly Slots</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>This will <strong>delete all existing slots</strong> and create fresh ones. Friday is excluded automatically.</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 text-gray-600">
              <div className="flex justify-between"><span>Clinics</span><span className="font-semibold">16</span></div>
              <div className="flex justify-between"><span>Days</span><span className="font-semibold">6 (Sat–Thu, no Fri)</span></div>
              <div className="flex justify-between"><span>Times per day</span><span className="font-semibold">5 (8AM–12PM)</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 mt-1"><span>Total slots</span><span className="font-bold text-[#185ba5]">480</span></div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowGenerateConfirm(false)} disabled={generating}>Cancel</Button>
            <Button className="flex-1 bg-[#185ba5] hover:bg-[#134885] text-white" onClick={generateWeeklySlots} disabled={generating}>
              {generating ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Generating...</span> : <span className="flex items-center gap-2"><RefreshCw size={15} /> Confirm & Generate</span>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ DELETE APPOINTMENT DIALOG ════ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Cancel Appointment</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2 text-sm mb-3">
              <div className="flex justify-between"><span className="text-gray-500">Patient</span><span className="font-medium text-[#1a3a60]">{deleteTarget?.patientName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium text-[#1a3a60]">{deleteTarget ? formatDate(deleteTarget.date) : ""}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium text-[#1a3a60]">{deleteTarget?.time}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Queue #</span><span className="font-semibold text-[#185ba5]">#{deleteTarget?.queueNumber}</span></div>
            </div>
            <p className="text-gray-400 text-xs text-center">The slot will be freed and queue adjusted automatically.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>Keep</Button>
            <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteAppointment} disabled={deleting}>
              {deleting ? <span className="flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Cancelling...</span> : "Yes, Cancel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
