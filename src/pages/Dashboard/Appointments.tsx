import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Calendar, Clock, User, CheckCircle, AlertCircle } from "lucide-react";

export default function Appointments() {
  // Sample appointments data
  const appointments = [
    {
      id: 1,
      patientName: "Ahmed Hassan",
      date: "2026-03-08",
      time: "10:00 AM",
      type: "Consultation",
      status: "Confirmed",
      notes: "Follow-up visit"
    },
    {
      id: 2,
      patientName: "Fatima Ali",
      date: "2026-03-08",
      time: "11:30 AM",
      type: "Check-up",
      status: "Confirmed",
      notes: "Regular check-up"
    },
    {
      id: 3,
      patientName: "Mohammed Karim",
      date: "2026-03-08",
      time: "02:00 PM",
      type: "Lab Test",
      status: "Pending",
      notes: "Blood test required"
    }
  ];

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Appointments Management</h1>
          <p className="text-gray-600">View and manage your appointments</p>
        </div>

        {/* Appointments Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Today's Appointments</p>
                <h3 className="text-3xl font-bold text-[#1a3a60] mt-2">5</h3>
              </div>
              <Calendar className="text-[#185ba5] bg-blue-100 p-3 rounded-lg" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Confirmed</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">4</h3>
              </div>
              <CheckCircle className="text-green-600 bg-green-100 p-3 rounded-lg" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <h3 className="text-3xl font-bold text-orange-600 mt-2">1</h3>
              </div>
              <AlertCircle className="text-orange-600 bg-orange-100 p-3 rounded-lg" size={40} />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-[#1a3a60]">Upcoming Appointments</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={20} className="text-[#185ba5]" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                        <p className="text-sm text-gray-500">{appointment.type}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm">{appointment.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm">{appointment.time}</span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === "Confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[#185ba5] hover:text-[#134885] font-medium text-sm">
                      Edit
                    </button>
                    <button className="text-red-500 hover:text-red-700 font-medium text-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
