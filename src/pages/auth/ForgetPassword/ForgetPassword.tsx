import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/logo.png";
import { useLocation } from "wouter";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgetPassword() {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // إرسال طلب إعادة التعيين لفايربيز
      await sendPasswordResetEmail(auth, values.email);
      setEmail(values.email);
      setStep("verify");
    } catch (error: any) {
      // معالجة الأخطاء الشائعة (Security & UX)
      if (error.code === "auth/user-not-found") {
        alert("This email is not registered in our system.");
      } else if (error.code === "auth/too-many-requests") {
        alert("Too many requests. Please try again later.");
      } else {
        alert("Something went wrong. Please try again.");
      }
      console.error("Firebase Error:", error.code);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-blue-900/10 border border-blue-50/50">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={logo} alt="Smart Clinic Logo" className="mb-4 w-20 object-contain" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1a3a60] mb-2 text-center">
            {step === "request" ? "Forgot Password?" : "Check Your Email"}
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center px-4">
            {step === "request" 
              ? "No worries! Enter your email and we'll send you a reset link." 
              : `A recovery link has been sent to ${email}`}
          </p>
        </div>

        {step === "request" ? (
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="w-full">
              <div className="relative flex items-center gap-3 bg-[#f0f4f8] rounded-2xl border border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all duration-300 overflow-hidden">
                <div className="h-14 ps-4 pe-2 flex items-center justify-center text-blue-600/70">
                  <Mail size={22} />
                </div>
                <div className="flex-1 py-2 pe-4">
                  <label className="text-[10px] uppercase tracking-wider text-blue-600 font-bold block mb-0.5">Email Address</label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="name@example.com"
                    className="w-full bg-transparent border-none outline-none text-[#1a3a60] font-semibold text-sm focus:ring-0 p-0 placeholder:text-gray-400"
                  />
                </div>
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs font-medium mt-2 ms-2">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-2xl py-7 text-base font-bold shadow-xl shadow-blue-500/25 transition-all active:scale-[0.97] disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  SENDING LINK...
                </span>
              ) : "SEND RESET LINK"}
            </Button>
          </form>
        ) : (
          <div className="space-y-8 flex flex-col items-center">
            <div className="flex flex-col items-center gap-3 text-green-600 bg-green-50 p-6 rounded-3xl w-full border border-green-100">
              <div className="bg-green-500 text-white p-2 rounded-full shadow-lg shadow-green-200">
                <ShieldCheck size={32} />
              </div>
              <span className="font-bold">Email Sent Successfully!</span>
            </div>
            
            <p className="text-center text-gray-500 text-sm leading-relaxed">
              We've sent a secure link to your inbox. Please click it to create a new password, then return here to login.
            </p>

            <Button 
              onClick={() => setLocation("/login")}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-2xl py-7 text-base font-bold transition-all shadow-lg shadow-blue-900/10"
            >
              RETURN TO LOGIN
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <button 
            onClick={() => setLocation("/login")}
            className="text-gray-400 text-sm font-bold hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}