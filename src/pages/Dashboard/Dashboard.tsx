import { Activity, Calendar } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/unauthorized");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        } else {
          navigate("/unauthorized");
        }
      } catch {
        navigate("/unauthorized");
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white flex flex-col justify-between h-40">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Total Patients</p>
            <h3 className="text-3xl font-black text-[#1a3a60]">1,280</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-blue-900/5 border border-white flex flex-col justify-between h-40">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase">Today's Appointments</p>
            <h3 className="text-3xl font-black text-[#1a3a60]">24</h3>
          </div>
        </div>

        <div className="bg-[#1a3a60] p-6 rounded-3xl shadow-xl shadow-blue-900/20 text-white flex flex-col justify-between h-40">
          <div className="flex justify-between items-start">
            <span className="bg-blue-500 text-[10px] px-2 py-1 rounded-md font-bold uppercase">Coming Soon</span>
          </div>
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase">System Alerts</p>
            <h3 className="text-lg font-bold">No new messages</h3>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}