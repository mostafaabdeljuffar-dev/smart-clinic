import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col items-
    center justify-center gap-4 bg-gray-50">
      <ShieldX size={64} className="text-red-500" />
      <h1 className="text-4xl font-black text-red-600">401</h1>
      <p className="text-xl font-semibold text-gray-700">Unauthorized Access</p>
      <p className="text-gray-500">يلا يحبيبي من هنا كان غيرك اشطر </p>
      <button
        onClick={() => navigate("/")}
        className="bg-[#185ba5] text-white px-6 py-2 rounded-lg hover:bg-[#134885] transition-colors"
      >
        Go Home
      </button>
    </div>
  );
}