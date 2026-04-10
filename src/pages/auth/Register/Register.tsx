import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, EyeOff, Eye, Mail, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import logo from "@assets/logo.png";

const CLINICS = [
  { label: "Cardiology",              clinicId: "cardio_clinic" },
  { label: "Chest",                   clinicId: "chest_clinic" },
  { label: "Dental",                  clinicId: "dental_clinic" },
  { label: "Dermatology",             clinicId: "derma_clinic" },
  { label: "ENT",                     clinicId: "ent_clinic" },
  { label: "Eye",                     clinicId: "eye_clinic" },
  { label: "Gynecology",              clinicId: "gynecology_clinic" },
  { label: "Internal Medicine (Female)", clinicId: "internal_medicine_female" },
  { label: "Internal Medicine (Male)",   clinicId: "internal_medicine_male" },
  { label: "Neurology",               clinicId: "neurology_clinic" },
  { label: "Neurosurgery",            clinicId: "neurosurgery_clinic" },
  { label: "Nutrition",               clinicId: "nutrition_clinic" },
  { label: "Orthopedic",              clinicId: "orthopedic_clinic" },
  { label: "Physiotherapy",           clinicId: "physiotherapy_clinic" },
  { label: "Surgery",                 clinicId: "surgery_clinic" },
  { label: "Urology",                 clinicId: "urology_clinic" },
];

const registerSchema = z.object({
  role: z.enum(['user', 'doctor']),
  username: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("Enter a valid email"),
  clinicId: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'user') {
    return data.username && data.username.length >= 3;
  }
  return true;
}, {
  message: "Username must be at least 3 characters",
  path: ["username"],
}).refine((data) => {
  if (data.role === 'doctor') {
    return data.name && data.name.length >= 3;
  }
  return true;
}, {
  message: "Name must be at least 3 characters",
  path: ["name"],
}).refine((data) => {
  if (data.role === 'doctor') {
    return data.clinicId && data.clinicId.length > 0;
  }
  return true;
}, {
  message: "Please select a specialization",
  path: ["clinicId"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'user' | 'doctor'>('user');

  const navigate = useNavigate();

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'user' },
  });

  useEffect(() => {
    registerForm.reset({ role });
  }, [role, registerForm]);

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. Create account in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      const finalName = values.role === 'user' ? values.username : values.name;

      // 2. Update Display Name
      await updateProfile(user, { displayName: finalName });

      // 3. Add to users collection
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: finalName,
        email: values.email,
        role: values.role === 'doctor' ? "pending" : "patient",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4. If Doctor, add to doctors collection with clinicId
      if (values.role === 'doctor') {
        const selectedClinic = CLINICS.find((c) => c.clinicId === values.clinicId);

        await setDoc(doc(db, "doctors", user.uid), {
          uid: user.uid,
          name: values.name,
          email: values.email,
          clinicId: values.clinicId,
          specialization: selectedClinic?.label ?? "",
          status: "pending",
          createdAt: serverTimestamp(),
        });
      }

      // 5. Send verification email
      await sendEmailVerification(user);
      await auth.signOut();

      alert("تم إنشاء الحساب ✅\nلازم تأكد الإيميل الأول قبل تسجيل الدخول 📧");
      navigate("/login");

    } catch (error: any) {
      console.error("Firebase Error:", error.code);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-4xl p-4 sm:p-8 md:p-10 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={logo} alt="Smart Clinic Logo" className="mb-2 object-contain" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a60] mb-2 text-center">
            Register
          </h2>
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`px-4 py-2 rounded-full font-semibold cursor-pointer transition-all ${role === 'user' ? 'bg-[#185ba5] text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              User
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`px-4 py-2 rounded-full font-semibold cursor-pointer transition-all ${role === 'doctor' ? 'bg-[#185ba5] text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              Doctor
            </button>
          </div>
        </div>

        <form className="space-y-5" onSubmit={registerForm.handleSubmit(onSubmit)}>

          {/* Name/Username */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">
                  {role === 'user' ? 'Username' : 'Name'}
                </label>
                <input
                  type="text"
                  {...registerForm.register(role === 'user' ? "username" : "name")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {registerForm.formState.errors[role === 'user' ? 'username' : 'name'] && (
              <p className="text-red-500 text-xs mt-1">
                {(registerForm.formState.errors[role === 'user' ? 'username' : 'name'] as any)?.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Mail size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Email</label>
                <input
                  type="email"
                  {...registerForm.register("email")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {registerForm.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {(registerForm.formState.errors.email as any).message}
              </p>
            )}
          </div>

          {/* Specialization (Clinic Selection) - Doctor Only */}
          {role === 'doctor' && (
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Stethoscope size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2 pr-3">
                  <label className="text-xs text-gray-500 font-medium block">Specialization</label>
                  <select
                    {...registerForm.register("clinicId")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0 cursor-pointer appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled className="text-gray-400">
                      Select your specialization
                    </option>
                    {CLINICS.map((clinic) => (
                      <option key={clinic.clinicId} value={clinic.clinicId} className="text-[#1a3a60]">
                        {clinic.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {registerForm.formState.errors.clinicId && (
                <p className="text-red-500 text-xs mt-1">
                  {(registerForm.formState.errors.clinicId as any).message}
                </p>
              )}
            </div>
          )}

          {/* Password */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Lock size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  {...registerForm.register("password")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-bold text-lg tracking-widest focus:ring-0 p-0 h-5"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="pr-4 pl-2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {registerForm.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {(registerForm.formState.errors.password as any).message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Lock size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...registerForm.register("confirmPassword")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-bold text-lg tracking-widest focus:ring-0 p-0 h-5"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="pr-4 pl-2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
            {registerForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {(registerForm.formState.errors.confirmPassword as any).message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            {isLoading ? "Registering..." : "REGISTER"}
          </Button>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#185ba5] font-bold hover:underline decoration-blue-500/30 underline-offset-4"
            >
              Log In
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}
