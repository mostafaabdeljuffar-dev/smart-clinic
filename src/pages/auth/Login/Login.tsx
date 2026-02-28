import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Lock, EyeOff, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter"; // ضفنا Link هنا
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
import logo from "@assets/logo.png";

const loginSchema = z.object({
  username: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ميزة إضافية عشان الـ UX

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const [, setLocation] = useLocation();

  const onSubmit = async (values: LoginFormValues) => {
    const { username, password } = values;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, username, password);
      console.log("Logged in successfully!");
      setLocation("/");
    } catch (error: any) {
      console.log("Firebase Error:", error.code);
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
            Welcome Back!
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center">
            Please log in to your account
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Email Field */}
          <div className="w-full">
            <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
              <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                <User size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 py-2">
                <label className="text-xs text-gray-500 font-medium block">Email</label>
                <input
                  type="email"
                  {...register("username")}
                  className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                />
              </div>
            </div>
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
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
                  {...register("password")}
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
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {/* Forget Password (تعديل مصطفى اللي دمجناه) */}
          <div className="flex justify-end">
            <Link href="/forgot-password">
              <a className="text-sm font-semibold text-[#185ba5] hover:underline">
                Forgot Password?
              </a>
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
          >
            {isLoading ? "Logging in..." : "LOG IN"}
          </Button>
        </form>
      </div>
    </div>
  );
}