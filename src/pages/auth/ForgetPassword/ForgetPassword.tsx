import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, EyeOff, Eye, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/logo.png";
import { useLocation } from "wouter";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormValues = z.infer<typeof schema>

export default function ForgetPassword() {
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<"request" | "verify">("request")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [, setLocation] = useLocation()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: FormValues) => {
    console.log("Request Reset:", values)
    setEmail(values.email)
    // setStep("verify")
    setOtp("")
    console.log("Request Reset:", values)
    alert("Password reset request sent successfully!")
    setLocation("/login")
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()

    if (otp.length !== 6) {
      alert("Please enter the 6-digit code")
      return
    }

    console.log("OTP:", otp)
    console.log("New Password Verified")
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-4xl p-4 sm:p-8 md:p-10 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src={logo}
            alt="Smart Clinic Logo"
            className="mb-2 object-contain"
          />
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a60] mb-2 text-center">
            {step === "request" ? "Reset Password" : "Verify Email"}
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center">
            {step === "request" 
              ? "Enter your email and password to reset your password" 
              : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>
        {step === "request" ? (
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Email</label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="student@university.edu"
                    className={`w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0 ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    data-testid="input-email"
                  />
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
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
                    className={`w-full bg-transparent border-none outline-none text-[#1a3a60] font-bold text-lg tracking-widest focus:ring-0 p-0 h-5 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    data-testid="input-password"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 pl-2 flex items-center justify-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  data-testid="button-toggle-password"
                  >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
              data-testid="button-request-otp"
            >
              CONTINUE
            </Button>
          </form>
        ) : (
          <form className="space-y-8 flex flex-col items-center" onSubmit={handleVerifyOtp}>
            <div className="space-y-4 flex flex-col items-center w-full">
              <label className="text-sm font-semibold text-[#1a3a60]">Verification Code</label>
              
              <div className="flex items-center gap-2 text-blue-600 font-medium text-sm mt-2">
                <ShieldCheck size={16} />
                <span>Secure verification</span>
              </div>
            </div>

            <Button 
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all"
              data-testid="button-submit-otp"
            >
              VERIFY & UPDATE
            </Button>

            <button 
              type="button"
              onClick={() => setStep("request")}
              className="text-gray-500 text-sm font-semibold hover:text-[#185ba5] transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Change email/password
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={() => setLocation("/login")}
            className="text-gray-500 text-sm font-semibold hover:text-[#1a3a60] flex items-center justify-center gap-2 mx-auto cursor-pointer"
            data-testid="button-back-to-login"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}