import { LogOut, LayoutDashboard, Activity, Calendar, Menu, X, Stethoscope } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth";
import { auth } from "@/firebase";
import { useEffect, useState } from "react";
import logo from "@assets/logo.png";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { authenticated, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = auth.currentUser;
  const userName = user?.email ? user.email.split("@")[0] : "Doctor";

  const handleLogout = async () => {
    try {
      await auth.signOut();
      signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const navigationItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      onClick: () => {
        navigate("/dashboard");
        setIsSidebarOpen(false);
      },
    },
    {
      label: "Patients",
      icon: Activity,
      path: "/dashboard/patients",
      onClick: () => {
        navigate("/dashboard/patients");
        setIsSidebarOpen(false);
      },
    },
    {
      label: "Doctors",
      icon: Stethoscope,
      path: "/dashboard/doctors",
      onClick: () => {
        navigate("/dashboard/doctors");
        setIsSidebarOpen(false);
      },
    },
    {
      label: "Appointments",
      icon: Calendar,
      path: "/dashboard/appointments",
      onClick: () => {
        navigate("/dashboard/appointments");
        setIsSidebarOpen(false);
      },
    },
  ];

  useEffect(() => {
    if (authenticated === false) {
        navigate("/login", { replace: true });
    }
  }, [authenticated]);

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#f0f4f8] font-sans">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 w-64 h-screen bg-[#1a3a60] text-white hidden md:flex flex-col shadow-2xl overflow-y-auto">
        <div className="p-8 text-center border-b border-blue-800/50">
          <img src={logo} alt="Smart Clinic Logo" className="h-16 w-auto mx-auto mb-2" />
          <p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest">Management System</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl transition-all duration-300 font-bold text-sm border border-red-500/20"
          >
            <LogOut size={18} />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-black/50" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 w-64 h-screen bg-[#1a3a60] text-white flex flex-col shadow-2xl z-50 md:hidden transition-transform duration-300 overflow-y-auto ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 text-center border-b border-blue-800/50">
          <img src={logo} alt="Smart Clinic Logo" className="h-16 w-auto mx-auto mb-2" />
          <p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest">Management System</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-blue-800/50">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-3 rounded-xl transition-all duration-300 font-bold text-sm border border-red-500/20"
          >
            <LogOut size={18} />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen overflow-y-auto">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1a3a60]">Smart Clinic</h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 md:p-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3a60] capitalize">
                Welcome back, Dr. {userName} ✨
              </h2>
              <p className="text-gray-500 text-sm mt-1">We hope you have a great day at your clinic.</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
