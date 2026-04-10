import { useState, useEffect } from "react";
import { Calendar, Check, X, Clock, User, Hash, Stethoscope } from "lucide-react";
import DoctorLayout from "@/components/layouts/DoctorLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "@/auth";

interface Appointment {
  id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  queueNumber: number;
  slotId: string;
  status: string;
  createdAt: any;
}

export default function DoctorDashboard() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [clinicLoading, setClinicLoading] = useState(true);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointment: Appointment | null }>({ open: false, appointment: null });

  // ─── Fetch clinicId from doctors collection ──────────────────────────────
  useEffect(() => {
    if (!user?.userId) return;

    const fetchClinic = async () => {
      try {
        const doctorSnap = await getDoc(doc(db, "doctors", user.userId!));
        if (doctorSnap.exists()) {
          setClinicId(doctorSnap.data().clinicId ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch clinic:", err);
      } finally {
        setClinicLoading(false);
      }
    };

    fetchClinic();
  }, [user?.userId]);

  // ─── Realtime appointments listener ──────────────────────────────────────
  useEffect(() => {
    if (!clinicId) return;

    const q = query(
      collection(db, "appointments"),
      where("clinicId", "==", clinicId),
      where("status", "==", "upcoming")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps: Appointment[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Appointment, "id">),
      }));

      apps.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.queueNumber - b.queueNumber;
      });

      setAppointments(apps);
    });

    return () => unsubscribe();
  }, [clinicId]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmModal.appointment) return;
    try {
      await deleteDoc(doc(db, "appointments", confirmModal.appointment.id));
      setConfirmModal({ open: false, appointment: null });
    } catch (err) {
      console.error("Failed to confirm appointment:", err);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.appointment) return;
    try {
      await deleteDoc(doc(db, "appointments", cancelModal.appointment.id));
      setCancelModal({ open: false, appointment: null });
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };

  const groupedAppointments = appointments.reduce((acc, app) => {
    if (!acc[app.date]) acc[app.date] = [];
    acc[app.date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const formatClinicName = (id: string) =>
    id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // ─── Loading ──────────────────────────────────────────────────────────────
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

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <DoctorLayout>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a3a60]">
              Welcome, Dr. {user?.userName}
            </h1>
            {clinicId && (
              <div className="flex items-center gap-1.5 mt-1">
                <Stethoscope size={14} className="text-blue-500" />
                <span className="text-sm text-blue-600 font-medium">
                  {formatClinicName(clinicId)}
                </span>
              </div>
            )}
          </div>
          <div className="bg-[#1a3a60]/10 text-[#1a3a60] px-4 py-2 rounded-xl text-sm font-semibold">
            {appointments.length} upcoming
          </div>
        </div>

        {/* Empty state */}
        {appointments.length === 0 && (
          <div className="bg-white p-12 rounded-3xl shadow-xl shadow-blue-900/5 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={28} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#1a3a60] mb-1">No Upcoming Appointments</h3>
            <p className="text-gray-500 text-sm">Your queue is clear for now.</p>
          </div>
        )}

        {/* Appointments grouped by date */}
        {Object.entries(groupedAppointments).map(([date, apps]) => (
          <div key={date} className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a3a60]/5 to-transparent border-b border-gray-100">
              <h2 className="text-base font-bold text-[#1a3a60] flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </h2>
              <span className="bg-[#1a3a60] text-white text-xs font-bold px-3 py-1 rounded-full">
                {apps.length} patients
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {apps.map((app) => (
                <div key={app.id} className="flex items-center justify-between px-6 py-4 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1a3a60] to-blue-600 flex items-center justify-center shadow-md shadow-blue-900/20 flex-shrink-0">
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
                          <span className="text-xs font-mono truncate max-w-[120px]">{app.patientId}</span>
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
        ))}
      </div>

      {/* Confirm Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ open, appointment: null })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a60]">Confirm Appointment Done</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              {confirmModal.appointment && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-green-800 font-semibold">
                    <User size={14} /> {confirmModal.appointment.patientName}
                  </div>
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <Clock size={13} /> {confirmModal.appointment.date} — {confirmModal.appointment.time}
                  </div>
                  <div className="flex items-center gap-2 text-green-700 text-sm">
                    <Hash size={13} /> Queue #{confirmModal.appointment.queueNumber}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">This will permanently remove the appointment from the queue.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, appointment: null })}>Back</Button>
            <Button onClick={handleConfirm} className="bg-green-500 hover:bg-green-600 text-white">
              <Check size={16} className="mr-2" /> Mark as Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => setCancelModal({ open, appointment: null })}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1a3a60]">Cancel Appointment</DialogTitle>
            <DialogDescription className="space-y-2 pt-1">
              {cancelModal.appointment && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-red-800 font-semibold">
                    <User size={14} /> {cancelModal.appointment.patientName}
                  </div>
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <Clock size={13} /> {cancelModal.appointment.date} — {cancelModal.appointment.time}
                  </div>
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <Hash size={13} /> Queue #{cancelModal.appointment.queueNumber}
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">The patient will lose their queue spot permanently.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModal({ open: false, appointment: null })}>Keep It</Button>
            <Button variant="destructive" onClick={handleCancel}>
              <X size={16} className="mr-2" /> Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  );
}
