import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@assets/logo.png";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase";
import { useNavigate } from "react-router-dom";

// Email schema
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type EmailFormValues = z.infer<typeof emailSchema>;
type Step = "request" | "success";

export default function ForgetPassword() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => {
        navigate("/login"); // الأفضل نرجعه للوجين عشان يجرب الباسورد الجديد
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step, navigate]);

  const onEmailSubmit = async (values: EmailFormValues) => {
    setIsLoading(true);
    try {
      // هنا بقى شلنا الـ actionCodeSettings خالص
      // ده هيخلي فيربيز يبعت الإيميل الافتراضي اللي بيفتح صفحة فيربيز
      await sendPasswordResetEmail(auth, values.email);

      setEmail(values.email);
      setStep("success");
      console.log("Password reset email sent successfully!");
    } catch (error: any) {
      // كـ Penetrator Tester، ده هيفيدك تعرف لو الإيميل فيه مشكلة
      console.error("Firebase Error Code:", error.code);
      alert("Error: " + error.message);
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
            {step === "success" && "Check Your Email"}
          </h2>
          <p className="text-gray-500 text-sm md:text-base text-center">
            {step === "request" && "Enter your email to receive a password reset link"}
            {step === "success" && `We've sent a reset link to ${email}. Please check your inbox and spam folder.`}
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
              {emailForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
              )}
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

        {step === "success" && (
          <div className="space-y-8 flex flex-col items-center">
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 p-4 rounded-xl w-full justify-center">
              <ShieldCheck size={20} />
              <span>Reset link sent!</span>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-[#185ba5] hover:bg-[#134885] text-white rounded-full py-6 text-base font-bold transition-all"
            >
              BACK TO LOGIN
            </Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-gray-500 text-sm font-semibold hover:text-[#1a3a60] flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}