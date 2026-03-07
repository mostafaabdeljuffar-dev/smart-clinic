import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Users, Search, Mail, Phone, Calendar } from "lucide-react";

export default function Patients() {
  // Sample patients data
  const patients = [
    {
      id: 1,
      name: "Ahmed Hassan",
      email: "ahmed@example.com",
      phone: "+20 123 456 7890",
      lastVisit: "2026-03-05",
      status: "Active"
    },
    {
      id: 2,
      name: "Fatima Ali",
      email: "fatima@example.com",
      phone: "+20 234 567 8901",
      lastVisit: "2026-03-03",
      status: "Active"
    },
    {
      id: 3,
      name: "Mohammed Karim",
      email: "mohammed@example.com",
      phone: "+20 345 678 9012",
      lastVisit: "2026-02-28",
      status: "Inactive"
    }
  ];

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Patients Management</h1>
          <p className="text-gray-600">Manage and view all your patients</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search patients by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#185ba5]"
              />
            </div>
            <button className="bg-[#185ba5] hover:bg-[#134885] text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Add Patient
            </button>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Visit</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users size={20} className="text-[#185ba5]" />
                      </div>
                      <span className="font-medium text-gray-900">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {patient.email}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {patient.phone}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    {patient.lastVisit}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      patient.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-[#185ba5] hover:text-[#134885] font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
