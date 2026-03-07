import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { sendEmailVerification } from "firebase/auth";
import { User, Lock, EyeOff, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase";
import logo from "@assets/logo.png";

// Schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Save username in displayName
      await updateProfile(userCredential.user, {
        displayName: values.username
      });

      await sendEmailVerification(userCredential.user);

        alert("تم تسجيل الحساب، تحقق من إيميلك لتأكيد الحساب!");
      navigate("/");
    } catch (error: any) {
      alert(error.message);
      console.log("Firebase Error:", error.code);
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
        </div>

        <form className="space-y-5" onSubmit={registerForm.handleSubmit(onSubmit)}>
          {/* Username */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Username</label>
                <input
                  type="text"
                  {...registerForm.register("username")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {registerForm.formState.errors.username && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.username.message}</p>}
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
            {registerForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.email.message}</p>}
          </div>

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
            {registerForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.password.message}</p>}
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
            {registerForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>}
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