import { Toaster } from "react-hot-toast";
import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import Loading from "../shared/Loading";
import { useAuth } from "@/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { authenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    i18n.changeLanguage(i18n.language);
    document.documentElement.dir =
      i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    if (authenticated === false) {
      setLocation("/login");
    }
  }, [authenticated, setLocation]);

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-white overflow-x-hidden">
      <Toaster />

      <Suspense
        fallback={
          <div className="flex flex-auto flex-col h-dvh">
            <Loading loading={true} />
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}