import { auth } from "@/firebase";
import { useLocation } from "wouter";
import { LogOut, LayoutDashboard, User as UserIcon, Activity, Calendar } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  
  // بنجيب بيانات المستخدم الحالي
  const user = auth.currentUser;
  
  // دالة لاستخراج الاسم من الإيميل (شيل أي حاجة من أول الـ @)
  const userName = user?.email ? user.email.split('@')[0] : "Doctor";

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setLocation("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0f4f8] font-sans">
      {/* Sidebar - القائمة الجانبية */}
      <aside className="w-64 bg-[#1a3a60] text-white hidden md:flex flex-col shadow-2xl">
        <div className="p-8 text-center border-b border-blue-800/50">
          <h1 className="text-xl font-bold tracking-wider">SMART CLINIC</h1>
          <p className="text-[10px] text-blue-300 mt-1 uppercase tracking-widest">Management System</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="flex items-center gap-3 p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-600/30">
            <LayoutDashboard size={20} />
            <span className="font-semibold text-sm">Dashboard</span>
          </div>
          <div className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all cursor-pointer">
            <Activity size={20} />
            <span className="text-sm">Patients</span>
          </div>
          <div className="flex items-center gap-3 p-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-xl transition-all cursor-pointer">
            <Calendar size={20} />
            <span className="text-sm">Appointments</span>
          </div>
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

      {/* Main Content - المحتوى الأساسي */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        {/* Top Bar */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3a60] capitalize">
              أهلاً {userName} ✨
            </h2>
            <p className="text-gray-500 text-sm mt-1">أتمنى لك يوماً سعيداً في عيادتك.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full shadow-sm border border-blue-500/10">
            <div className="w-10 h-10 bg-[#E1EFF9] rounded-full flex items-center justify-center text-[#1a3a60]">
              <UserIcon size={20} />
            </div>
            <span className="text-xs font-bold text-[#1a3a60] hidden sm:block">Dr. {userName}</span>
          </div>
        </header>

        {/* Dashboard Stats - لمحة سريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white flex flex-col justify-between h-40">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">إجمالي المرضى</p>
              <h3 className="text-3xl font-black text-[#1a3a60]">1,280</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white flex flex-col justify-between h-40">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase">كشوفات اليوم</p>
              <h3 className="text-3xl font-black text-[#1a3a60]">24</h3>
            </div>
          </div>

          <div className="bg-[#1a3a60] p-6 rounded-3xl shadow-xl shadow-blue-900/20 text-white flex flex-col justify-between h-40">
             <div className="flex justify-between items-start">
                <span className="bg-blue-500 text-[10px] px-2 py-1 rounded-md font-bold uppercase">قريباً</span>
             </div>
             <div>
                <p className="text-blue-200 text-xs font-bold uppercase">تنبيهات النظام</p>
                <h3 className="text-lg font-bold">لا توجد رسائل جديدة</h3>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}