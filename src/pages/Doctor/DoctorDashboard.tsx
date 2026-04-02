import { useState } from "react";
import { Calendar, Check, X, Trash2 } from "lucide-react";
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

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: '1', patientName: 'John Doe', date: '2024-04-02', time: '10:00 AM', status: 'pending' },
    { id: '2', patientName: 'Jane Smith', date: '2024-04-02', time: '11:00 AM', status: 'confirmed' },
    { id: '3', patientName: 'Bob Johnson', date: '2024-04-03', time: '2:00 PM', status: 'pending' },
  ]);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; appointmentId: string | null }>({ open: false, appointmentId: null });
  const [cancelAllModal, setCancelAllModal] = useState<{ open: boolean; date: string | null }>({ open: false, date: null });

  const confirmAppointment = (id: string) => {
    setConfirmModal({ open: true, appointmentId: id });
  };

  const cancelAppointment = (id: string) => {
    setCancelModal({ open: true, appointmentId: id });
  };

  const cancelAllForDay = (date: string) => {
    setCancelAllModal({ open: true, date });
  };

  const handleConfirmAppointment = () => {
    if (confirmModal.appointmentId) {
      setAppointments(apps => apps.map(app => app.id === confirmModal.appointmentId ? { ...app, status: 'confirmed' } : app));
      setConfirmModal({ open: false, appointmentId: null });
    }
  };

  const handleCancelAppointment = () => {
    if (cancelModal.appointmentId) {
      setAppointments(apps => apps.map(app => app.id === cancelModal.appointmentId ? { ...app, status: 'cancelled' } : app));
      setCancelModal({ open: false, appointmentId: null });
    }
  };

  const handleCancelAllForDay = () => {
    if (cancelAllModal.date) {
      setAppointments(apps => apps.map(app => app.date === cancelAllModal.date ? { ...app, status: 'cancelled' } : app));
      setCancelAllModal({ open: false, date: null });
    }
  };

  const groupedAppointments = appointments.reduce((acc, app) => {
    if (!acc[app.date]) acc[app.date] = [];
    acc[app.date].push(app);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#1a3a60]">My Appointments</h1>

        {Object.entries(groupedAppointments).map(([date, apps]) => (
          <div key={date} className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#1a3a60] flex items-center gap-2">
                <Calendar size={20} />
                {new Date(date).toLocaleDateString()}
              </h2>
              <button
                onClick={() => cancelAllForDay(date)}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Cancel All
              </button>
            </div>

            <div className="space-y-3">
              {apps.map(app => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-[#1a3a60]">{app.patientName}</p>
                    <p className="text-sm text-gray-600">{app.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmAppointment(app.id)}
                        className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => cancelAppointment(app.id)}
                        className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Confirm Appointment Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => setConfirmModal({ open, appointmentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to confirm this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal({ open: false, appointmentId: null })}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAppointment}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Modal */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => setCancelModal({ open, appointmentId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModal({ open: false, appointmentId: null })}>
              Keep
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel All Appointments Modal */}
      <Dialog open={cancelAllModal.open} onOpenChange={(open) => setCancelAllModal({ open, date: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel All Appointments</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel all appointments for {cancelAllModal.date ? new Date(cancelAllModal.date).toLocaleDateString() : 'this day'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelAllModal({ open: false, date: null })}>
              Keep All
            </Button>
            <Button variant="destructive" onClick={handleCancelAllForDay}>
              Cancel All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DoctorLayout>
  );
}