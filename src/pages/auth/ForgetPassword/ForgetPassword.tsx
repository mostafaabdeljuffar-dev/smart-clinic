import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@assets/logo.png";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { useNavigate } from "react-router-dom";

// Email schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

// OTP schema
const otpSchema = z.object({
  otp: z.string().length(4, "Please enter 4-digit code"),
});

// Password reset schema
const passwordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

type Step = "request" | "verify" | "resetPassword" | "success";

export default function ForgetPassword() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  // Auto navigate to home after 5 seconds on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        navigate("/");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email);
      setEmail(values.email);
      setStep("verify");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit = async (values: OtpFormValues) => {
    setIsLoading(true);
    try {
      // In a real app, you'd verify the OTP here
      // For now, we'll simulate success and move to password reset
      // You would typically verify the OTP with your backend or SMS service
      setStep("resetPassword");
      console.log("values: ", values);
    } catch (error: any) {
      alert("Invalid OTP code");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsLoading(true);
    try {
      // In a real implementation, you'd use the oobCode from the email link
      // For demo purposes, we'll use a placeholder
      // await confirmPasswordReset(auth, oobCode, values.password);
      setStep("success");
      console.log("values: ", values);
    } catch (error: any) {
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
            {step === "request" && "Reset Password"}
            {step === "verify" && "Verify Code"}
            {step === "resetPassword" && "New Password"}
            {step === "success" && "Password Reset Successful"}
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center">
            {step === "request" && "Enter your email to receive a password reset link"}
            {step === "verify" && `We've sent a verification code to ${email}`}
            {step === "resetPassword" && "Enter your new password"}
            {step === "success" && "Your password has been reset successfully"}
          </p>
        </div>

        {step === "request" && (
          <form className="space-y-5" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Email</label>
                  <input
                    type="email"
                    {...emailForm.register("email")}
                    placeholder="your-email@example.com"
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0"
                  />
                </div>
              </div>
              {emailForm.formState.errors.email && <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isLoading ? "SENDING..." : "SEND RESET LINK"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form className="space-y-5" onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
            <div className="w-full">
              <label className="text-xs text-gray-500 font-medium block mb-3 text-center">Enter 4-digit verification code</label>
              <div className="flex gap-2 justify-center mb-4">
                {Array.from({ length: 4 }, (_, index) => {
                  const otpValue = otpForm.watch("otp") || "";
                  return (
                    <div
                      key={index}
                      className="w-12 h-12 border-2 border-blue-200 rounded-lg flex items-center justify-center text-xl font-bold text-[#1a3a60] bg-[#f0f4f8]"
                    >
                      {otpValue[index] || ""}
                    </div>
                  );
                })}
              </div>
              <Input
                type="text"
                maxLength={4}
                className="w-full text-center text-xl font-bold border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                {...otpForm.register("otp")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").substring(0, 4);
                  otpForm.setValue("otp", value);
                }}
                placeholder="Enter 4-digit code"
                autoFocus
              />
              {otpForm.formState.errors.otp && <p className="text-red-500 text-xs mt-1 text-center">{otpForm.formState.errors.otp.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isLoading ? "VERIFYING..." : "VERIFY CODE"}
            </Button>

            <Button
              type="button"
              onClick={() => setStep("request")}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full py-6 text-base font-bold transition-all active:scale-[0.98]"
            >
              BACK
            </Button>
          </form>
        )}

        {step === "resetPassword" && (
          <form className="space-y-5" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            {/* New Password Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...passwordForm.register("password")}
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
              {passwordForm.formState.errors.password && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-xl border border-blue-100 overflow-hidden focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <div className="h-14.5 ps-4 pe-3 flex items-center justify-center text-gray-500 bg-[#E1EFF9]">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <div className="flex-1 py-2">
                  <label className="text-xs text-gray-500 font-medium block">Confirm New Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
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
              {passwordForm.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]"
            >
              {isLoading ? "RESETTING..." : "RESET PASSWORD"}
            </Button>

            <Button
              type="button"
              onClick={() => setStep("verify")}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-full py-6 text-base font-bold transition-all active:scale-[0.98]"
            >
              BACK
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="space-y-8 flex flex-col items-center">
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 p-4 rounded-xl w-full justify-center">
              <ShieldCheck size={20} />
              <span>Password reset successfully!</span>
            </div>
            
            <p className="text-center text-gray-500 text-sm">
              Your password has been updated. You will be redirected to the home page in 5 seconds.
            </p>

            <Button 
              onClick={() => navigate("/")}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold transition-all"
            >
              GO TO HOME
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-500 text-sm font-semibold hover:text-[#1a3a60] flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}