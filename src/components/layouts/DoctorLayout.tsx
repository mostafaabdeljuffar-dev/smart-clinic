import { LogOut, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth";
import { useEffect } from "react";
import logo from "@assets/logo.png";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

export default function DoctorLayout({ children }: DoctorLayoutProps) {
  const navigate = useNavigate();
  const { authenticated, signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    if (authenticated === false) {
      navigate("/login", { replace: true });
    }
  }, [authenticated, navigate]);

  if (!authenticated) {
    return null;
  }

  const userName = user?.userName || "Doctor";

  return (
    <div className="min-h-screen bg-[#f0f4f8] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 md:p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Smart Clinic Logo" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a3a60]">
                Doctor Dashboard
              </h1>
              <p className="text-gray-500 text-sm">Welcome back, Dr. {userName} ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-gray-600">
              <Calendar size={20} />
              <span className="font-medium">My Appointments</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}