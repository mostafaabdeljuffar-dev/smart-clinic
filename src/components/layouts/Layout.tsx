import { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"
import Loading from "../shared/Loading";
import { useAuth } from "@/auth";
import { Outlet } from "react-router-dom";
import logo from "@assets/logo.png";
import { LogOut, Home as HomeIcon, Users, MessageCircle, Calendar, Menu, X } from "lucide-react";
import { auth } from "@/firebase";

export default function Layout() {
  const { i18n } = useTranslation();
  const { authenticated, signOut } = useAuth();
  const navigate = useNavigate()
  const user = auth.currentUser;
  const userName = user?.email ? user.email.split('@')[0] : "Patient";
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    i18n.changeLanguage(i18n.language);
    document.documentElement.dir =
      i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    if (authenticated === false) {
      navigate("/login", { replace: true });
    }
  }, [authenticated]);

  if (!authenticated) {
    return null;
  }

  const navigationItems = [
    { label: "Home", icon: HomeIcon, path: "/" },
    { label: "All Doctors", icon: Users, path: "/doctors" },
    { label: "Chat", icon: MessageCircle, path: "/chat" },
    { label: "Previous Appointments", icon: Calendar, path: "/appointments" },
  ];

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
        
        {/* Navbar */}
        <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img src={logo} alt="Smart Clinic Logo" className="h-8 w-auto" />
              </div>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center space-x-8">
                <button
                  onClick={() => navigate("/")}
                  className="flex items-center gap-2 text-[#1a3a60] hover:text-[#185ba5] font-medium transition-colors"
                >
                  <HomeIcon size={18} />
                  Home
                </button>
                <button
                  onClick={() => navigate("/doctors")}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#185ba5] font-medium transition-colors"
                >
                  <Users size={18} />
                  All Doctors
                </button>
                <button
                  onClick={() => navigate("/chat")}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#185ba5] font-medium transition-colors"
                >
                  <MessageCircle size={18} />
                  Chat
                </button>
                <button
                  onClick={() => navigate("/appointments")}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#185ba5] font-medium transition-colors"
                >
                  <Calendar size={18} />
                  Previous Appointments
                </button>
              </div>

              {/* User Info & Logout */}
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                  <span>Welcome,</span>
                  <span className="font-semibold text-[#1a3a60]">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
                
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed left-0 top-16 w-64 h-screen bg-white shadow-2xl z-40 lg:hidden transition-transform duration-300 overflow-y-auto ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="px-2 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-2 py-3 text-gray-600 hover:bg-blue-50 hover:text-[#185ba5] rounded-lg transition-colors font-medium"
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              <span>Welcome,</span>
              <span className="font-semibold text-[#1a3a60]"> {userName}</span>
            </p>
          </div>
        </aside>

        <Outlet />
        
        {/* Footer */}
        <footer className="bg-[#1a3a60] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* About Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img src={logo} alt="Smart Clinic Logo" className="h-16 w-auto" />
                </div>
                <p className="text-blue-200 text-sm leading-relaxed">
                  Providing quality healthcare services and connecting patients with experienced doctors for better health outcomes.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Quick Links</h4>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => navigate("/")}
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      Home
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/doctors")}
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      Find Doctors
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/appointments")}
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      Appointments
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate("/chat")}
                      className="text-blue-200 hover:text-white transition-colors text-sm"
                    >
                      Chat Support
                    </button>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Services</h4>
                <ul className="space-y-3">
                  <li>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                      Online Consultations
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                      Appointment Booking
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                      Medical Records
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-200 hover:text-white transition-colors text-sm">
                      Health Tips
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Contact Us</h4>
                <ul className="space-y-3">
                  <li className="text-blue-200 text-sm">
                    <span className="font-semibold">Email:</span>
                    <br />
                    info@smartclinic.com
                  </li>
                  <li className="text-blue-200 text-sm">
                    <span className="font-semibold">Phone:</span>
                    <br />
                    +1 (555) 123-4567
                  </li>
                  <li className="text-blue-200 text-sm">
                    <span className="font-semibold">Address:</span>
                    <br />
                    123 Medical Center, Cairo
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-800/30 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Copyright */}
                <div className="text-blue-200 text-sm text-center md:text-left">
                  &copy; 2026 Smart Clinic. All rights reserved.
                </div>

                {/* Social Links */}
                <div className="flex justify-center md:justify-end gap-6">
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-.921.345-.921.921v1.529h2.773l-.446 2.389h-2.327v7.403h-2.948v-7.403h-2.007v-2.389h2.007v-.878c0-2.889 1.436-4.649 4.499-4.649h1.747v2.142z" />
                    </svg>
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a href="#" className="text-blue-200 hover:text-white transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12c0-3.403 2.759-6.162 6.162-6.162s6.162 2.759 6.162 6.162c0 3.403-2.759 6.162-6.162 6.162s-6.162-2.759-6.162-6.162zm2.889 0c0 1.821 1.453 3.273 3.273 3.273s3.273-1.452 3.273-3.273c0-1.82-1.452-3.273-3.273-3.273s-3.273 1.452-3.273 3.273zm6.538-6.36c0 .795.645 1.44 1.44 1.44s1.44-.645 1.44-1.44-.645-1.44-1.44-1.44-1.44.645-1.44 1.44z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </Suspense>
    </div>
  );
}