import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Clock, User, CheckCircle, AlertCircle, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Department = {
  id: number;
  name: string;
  nameEn: string;
};

export default function Appointments() {
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const departments = [
    { id: 1, name: "عيادة القلب", nameEn: "Cardiology Clinic" },
    { id: 2, name: "عيادة الصدر", nameEn: "Chest Clinic" },
    { id: 3, name: "عيادة الأسنان", nameEn: "Dental Clinic" },
    { id: 4, name: "عيادة الجلدية", nameEn: "Dermatology Clinic" },
    { id: 5, name: "عيادة الأنف والأذن", nameEn: "ENT Clinic" },
    { id: 6, name: "عيادة العيون", nameEn: "Eye Clinic" },
    { id: 7, name: "عيادة النساء والتوليد", nameEn: "Gynecology Clinic" },
    { id: 8, name: "قسم الباطنة للنساء", nameEn: "Internal Medicine Female" },
    { id: 9, name: "قسم الباطنة للرجال", nameEn: "Internal Medicine Male" },
    { id: 10, name: "عيادة الأعصاب", nameEn: "Neurology Clinic" },
    { id: 11, name: "عيادة جراحة الأعصاب", nameEn: "Neurosurgery Clinic" },
    { id: 12, name: "عيادة التغذية", nameEn: "Nutrition Clinic" },
    { id: 13, name: "عيادة العظام", nameEn: "Orthopedic Clinic" },
    { id: 14, name: "عيادة العلاج الطبيعي", nameEn: "Physiotherapy Clinic" },
    { id: 15, name: "عيادة الجراحة", nameEn: "Surgery Clinic" },
    { id: 16, name: "عيادة المسالك البولية", nameEn: "Urology Clinic" }
  ];

  const timeSlots = [
    { date: "2026-04-10", time: "9:00 AM" },
    { date: "2026-04-10", time: "10:00 AM" },
    { date: "2026-04-10", time: "11:00 AM" },
    { date: "2026-04-11", time: "2:00 PM" },
    { date: "2026-04-11", time: "3:00 PM" },
    { date: "2026-04-11", time: "4:00 PM" }
  ];

  // Mock bookings data
  const bookings = [
    { id: 1, departmentId: 1, date: "2026-04-10", timeSlot: "9:00 AM", patientName: "Ahmed Hassan", status: "pending" },
    { id: 2, departmentId: 1, date: "2026-04-10", timeSlot: "10:00 AM", patientName: "Fatima Ali", status: "accepted" },
    { id: 3, departmentId: 2, date: "2026-04-10", timeSlot: "11:00 AM", patientName: "Mohammed Karim", status: "pending" },
    { id: 4, departmentId: 3, date: "2026-04-11", timeSlot: "2:00 PM", patientName: "Sara Ahmed", status: "rejected" },
    { id: 5, departmentId: 4, date: "2026-04-11", timeSlot: "3:00 PM", patientName: "Omar Youssef", status: "accepted" },
    { id: 6, departmentId: 1, date: "2026-04-10", timeSlot: "9:00 AM", patientName: "Laila Mahmoud", status: "pending" }
  ];

  const getBookingsForDepartment = (deptId: number) => bookings.filter(b => b.departmentId === deptId);

  const getBookingCount = (deptId: number, slot: { date: string; time: string }) =>
    bookings.filter(b => b.departmentId === deptId && b.date === slot.date && b.timeSlot === slot.time).length;

  const handleAccept = (bookingId: number) => {
    // In real app, update database
    console.log("Accept booking", bookingId);
  };

  const handleReject = (bookingId: number) => {
    // In real app, update database
    console.log("Reject booking", bookingId);
  };

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Appointments Management</h1>
          <p className="text-gray-600">Manage bookings across all departments</p>
        </div>

        {!selectedDepartment ? (
          <>
            {/* Departments Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                  onClick={() => setSelectedDepartment(dept)}
                >
                  <h3 className="text-lg font-bold text-[#1a3a60] mb-2">{dept.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{dept.nameEn}</p>
                  <div className="space-y-2">
                    {timeSlots.map((slot) => (
                      <div key={`${slot.date}-${slot.time}`} className="flex justify-between items-center text-sm">
                        <span className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span>{slot.date}</span>
                          <span className="text-gray-500">•</span>
                          <span>{slot.time}</span>
                        </span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                          {getBookingCount(dept.id, slot)} bookings
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Button variant="outline" size="sm">
                      <Eye size={14} className="mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Department Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#1a3a60]">{selectedDepartment.name}</h2>
                  <p className="text-gray-600">{selectedDepartment.nameEn}</p>
                </div>
                <Button variant="outline" onClick={() => setSelectedDepartment(null)}>
                  Back to Overview
                </Button>
              </div>

              <div className="space-y-4">
                {getBookingsForDepartment(selectedDepartment.id).map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User size={20} className="text-[#185ba5]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.patientName}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Clock size={14} />
                            {booking.date} • {booking.timeSlot}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          booking.status === "accepted"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-orange-100 text-orange-700"
                        }`}>
                          {booking.status === "accepted" && <CheckCircle size={12} className="inline mr-1" />}
                          {booking.status === "rejected" && <XCircle size={12} className="inline mr-1" />}
                          {booking.status === "pending" && <AlertCircle size={12} className="inline mr-1" />}
                          {booking.status}
                        </span>
                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAccept(booking.id)}>
                              <CheckCircle size={14} className="mr-1" />
                              Accept
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(booking.id)}>
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {getBookingsForDepartment(selectedDepartment.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No bookings for this department yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
