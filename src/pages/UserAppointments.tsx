import { useState, useEffect } from "react";
import { Calendar, Clock, User, CheckCircle, XCircle } from "lucide-react";
import { auth, db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

type Appointment = {
  id: string;
  doctorName?: string;
  departmentName?: string;
  date: string;
  time: string;
  bookingNumber: number;
  status: string;
};

export default function UserAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "bookings"),
          where("patientId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const appointmentsData: Appointment[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Appointment));
        setAppointments(appointmentsData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#1a3a60]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">My Appointments</h1>
          <p className="text-gray-600">View your appointment history</p>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointments Yet</h3>
            <p className="text-gray-500">You haven't booked any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={24} className="text-[#185ba5]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1a3a60]">
                        {appointment.doctorName || appointment.departmentName}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Booking Number</p>
                      <p className="text-lg font-bold text-[#1a3a60]">#{appointment.bookingNumber}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === "confirmed" || appointment.status === "accepted"
                        ? "bg-green-100 text-green-700"
                        : appointment.status === "pending"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {appointment.status === "confirmed" || appointment.status === "accepted" ? (
                        <CheckCircle size={12} className="inline mr-1" />
                      ) : appointment.status === "cancelled" || appointment.status === "rejected" ? (
                        <XCircle size={12} className="inline mr-1" />
                      ) : null}
                      {appointment.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}