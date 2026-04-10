import { Activity, Calendar, Users, ClipboardList, Home } from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/firebase";
import { doc, getDoc, collection, getCountFromServer } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [totalDoctors, setTotalDoctors] = useState<number | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  // Fetch counts once admin is confirmed
  useEffect(() => {
    if (!isAdmin) return;

    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [usersSnap, apptsSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "appointments")),
        ]);

        setTotalUsers(usersSnap.data().count);
        setTotalAppointments(apptsSnap.data().count);

        // Count patients and doctors from users collection via query count
        const { query, where } = await import("firebase/firestore");
        const [patientsSnap, doctorsSnap] = await Promise.all([
          getCountFromServer(query(collection(db, "users"), where("role", "==", "patient"))),
          getCountFromServer(query(collection(db, "users"), where("role", "==", "doctor"))),
        ]);
        setTotalPatients(patientsSnap.data().count);
        setTotalDoctors(doctorsSnap.data().count);
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isAdmin]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!isAdmin) return null;

  const StatCard = ({
    icon,
    label,
    value,
    iconBg,
    iconColor,
    dark,
  }: {
    icon: React.ReactNode;
    label: string;
    value: number | null;
    iconBg?: string;
    iconColor?: string;
    dark?: boolean;
  }) => (
    <div
      className={`p-6 rounded-3xl shadow-xl flex flex-col justify-between h-40 ${
        dark
          ? "bg-[#1a3a60] text-white shadow-blue-900/20"
          : "bg-white border border-gray-100 shadow-blue-900/5"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
          dark ? "bg-white/10" : iconBg
        }`}
      >
        <span className={dark ? "text-white" : iconColor}>{icon}</span>
      </div>
      <div>
        <p
          className={`text-xs font-bold uppercase tracking-wide mb-1 ${
            dark ? "text-blue-200" : "text-gray-400"
          }`}
        >
          {label}
        </p>
        {statsLoading ? (
          <div className={`h-9 w-20 rounded-lg animate-pulse ${dark ? "bg-white/10" : "bg-gray-100"}`} />
        ) : (
          <h3
            className={`text-3xl font-black ${
              dark ? "text-white" : "text-[#1a3a60]"
            }`}
          >
            {value?.toLocaleString() ?? "—"}
          </h3>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1a3a60]">Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Overview of your clinic system</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:text-[#185ba5] text-gray-500 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <Home size={16} />
            Home
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            icon={<Users size={20} />}
            label="Total Users"
            value={totalUsers}
            iconBg="bg-blue-50"
            iconColor="text-[#185ba5]"
          />
          <StatCard
            icon={<Activity size={20} />}
            label="Patients"
            value={totalPatients}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            icon={<ClipboardList size={20} />}
            label="Doctors"
            value={totalDoctors}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <StatCard
            icon={<Calendar size={20} />}
            label="Appointments"
            value={totalAppointments}
            dark
          />
        </div>

      </div>
    </DashboardLayout>
  );
}
