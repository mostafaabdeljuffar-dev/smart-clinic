import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, EyeOff, Eye, Mail, Phone, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import logo from "@assets/logo.png";

type UserRole = "doctor" | "patient" | null;

// Patient Schema
const patientSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  studentId: z.string().min(1, "Student ID is required"),
  department: z.string().min(1, "Department is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Doctor Schema
const doctorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PatientFormValues = z.infer<typeof patientSchema>;
type DoctorFormValues = z.infer<typeof doctorSchema>;

export default function Register() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Patient form
  const patientForm = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  // Doctor form
  const doctorForm = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
  });

  const onPatientSubmit = async (values: PatientFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      console.log("Patient registered successfully!", userCredential);
      navigate("/");
    } catch (error: any) {
      console.log("Firebase Error:", error.code);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDoctorSubmit = async (values: DoctorFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      console.log("Doctor registered successfully!", userCredential);
      navigate("/");
    } catch (error: any) {
      console.log("Firebase Error:", error.code);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };


  // Role Selection Screen
  if (!userRole) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-4xl p-4 sm:p-8 md:p-10 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col items-center justify-center mb-8">
            <img src={logo} alt="Smart Clinic Logo" className="mb-2 object-contain" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a60] mb-2 text-center">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm md:text-base text-center">
              Please choose your account type
            </p>
          </div>

          <div className="space-y-4">
            {/* Patient Option */}
            <button
              onClick={() => setUserRole("patient")}
              className="w-full p-6 border-2 border-blue-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <User size={24} className="text-blue-600" />
                <h3 className="text-lg font-bold text-[#1a3a60]">Register as Patient</h3>
              </div>
              <p className="text-gray-500 text-sm">Create a patient account to book appointments and manage your health</p>
            </button>

            {/* Doctor Option */}
            <button
              onClick={() => setUserRole("doctor")}
              className="w-full p-6 border-2 border-green-200 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen size={24} className="text-green-600" />
                <h3 className="text-lg font-bold text-[#1a3a60]">Register as Doctor</h3>
              </div>
              <p className="text-gray-500 text-sm">Create a doctor account to manage your patients and appointments</p>
            </button>
          </div>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#185ba5] font-bold hover:underline decoration-blue-500/30 underline-offset-4"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Patient Registration Form
  if (userRole === "patient") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
        <div className="w-full max-w-md bg-white rounded-4xl p-4 sm:p-8 md:p-10 shadow-xl shadow-blue-900/5">
          <div className="flex flex-col items-center justify-center mb-8">
            <img src={logo} alt="Smart Clinic Logo" className="mb-2 object-contain" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a60] mb-2 text-center">
              Patient Registration
            </h2>
          </div>

          <form className="space-y-5" onSubmit={patientForm.handleSubmit(onPatientSubmit)}>
            {/* Username Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <User size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Username</label>
                  <input
                    type="text"
                    {...patientForm.register("username")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {patientForm.formState.errors.username && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.username.message}</p>}
            </div>

            {/* Email Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Email</label>
                  <input
                    type="email"
                    {...patientForm.register("email")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {patientForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.email.message}</p>}
            </div>

            {/* Student ID Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <User size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Student ID</label>
                  <input
                    type="text"
                    {...patientForm.register("studentId")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {patientForm.formState.errors.studentId && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.studentId.message}</p>}
            </div>

            {/* Department Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <BookOpen size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Department</label>
                  <input
                    type="text"
                    {...patientForm.register("department")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {patientForm.formState.errors.department && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.department.message}</p>}
            </div>

            {/* Phone Number Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Phone size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Phone Number</label>
                  <input
                    type="tel"
                    {...patientForm.register("phoneNumber")}
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {patientForm.formState.errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.phoneNumber.message}</p>}
            </div>

            {/* Password Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...patientForm.register("password")}
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
              {patientForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...patientForm.register("confirmPassword")}
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
              {patientForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{patientForm.formState.errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isLoading ? "Registering..." : "REGISTER"}
            </Button>

            <Button
              type="button"
              onClick={() => setUserRole(null)}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full py-6 text-base font-bold transition-all active:scale-[0.98]"
            >
              BACK
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-[#185ba5] font-bold hover:underline decoration-blue-500/30 underline-offset-4"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Doctor Registration Form
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-4xl p-4 sm:p-8 md:p-10 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={logo} alt="Smart Clinic Logo" className="mb-2 object-contain" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a60] mb-2 text-center">
            Doctor Registration
          </h2>
        </div>

        <form className="space-y-5" onSubmit={doctorForm.handleSubmit(onDoctorSubmit)}>
          {/* Name Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Full Name</label>
                <input
                  type="text"
                  {...doctorForm.register("name")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {doctorForm.formState.errors.name && <p className="text-red-500 text-xs mt-1">{doctorForm.formState.errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Mail size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Email</label>
                <input
                  type="email"
                  {...doctorForm.register("email")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {doctorForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{doctorForm.formState.errors.email.message}</p>}
          </div>

          {/* Phone Number Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Phone size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Phone Number</label>
                <input
                  type="tel"
                  {...doctorForm.register("phoneNumber")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {doctorForm.formState.errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{doctorForm.formState.errors.phoneNumber.message}</p>}
          </div>

          {/* Password Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Lock size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  {...doctorForm.register("password")}
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
            {doctorForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{doctorForm.formState.errors.password.message}</p>}
          </div>

          {/* Confirm Password Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <Lock size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Confirm Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...doctorForm.register("confirmPassword")}
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
            {doctorForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{doctorForm.formState.errors.confirmPassword.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            {isLoading ? "Registering..." : "REGISTER"}
          </Button>

          <Button
            type="button"
            onClick={() => setUserRole(null)}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full py-6 text-base font-bold transition-all active:scale-[0.98]"
          >
            BACK
          </Button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-[#185ba5] font-bold hover:underline decoration-blue-500/30 underline-offset-4"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}