import { Toaster } from "react-hot-toast";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../shared/Loading";
import { useAuth } from "@/auth";
import { Outlet } from "react-router-dom";
import logo from "@assets/logo.png";
import { LogOut, Home as HomeIcon, Users, Menu, X, Phone, Mail } from "lucide-react";
import { auth } from "@/firebase";

export default function Layout() {
  const { authenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const user = auth.currentUser;
  const userName = user?.email ? user.email.split("@")[0] : "Patient";
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
    if (authenticated === false) navigate("/login", { replace: true });
  }, [authenticated]);

  if (!authenticated) return null;

  const navItems = [
    { label: "Home",        icon: HomeIcon, path: "/" },
    { label: "All Doctors", icon: Users,    path: "/doctors" },
  ];

  return (
    <div className="min-h-dvh bg-white overflow-x-hidden">
      <Toaster />

      <Suspense fallback={<div className="flex flex-auto flex-col h-dvh"><Loading loading={true} /></div>}>

        {/* ── Navbar ── */}
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">

              {/* Logo */}
              <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
                <img src={logo} alt="Smart Clinic" className="h-8 w-auto" />
              </div>

              {/* Desktop nav */}
              <div className="hidden lg:flex items-center gap-8">
                {navItems.map((item) => (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    className="flex items-center gap-2 text-gray-600 hover:text-[#185ba5] font-medium transition-colors text-sm">
                    <item.icon size={17} />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-1.5 text-sm text-gray-500">
                  <span>Welcome,</span>
                  <span className="font-semibold text-[#1a3a60]">{userName}</span>
                </div>

                <button onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Logout</span>
                </button>

                {/* Mobile menu button */}
                <button onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  {isMobileSidebarOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile overlay */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-30 lg:hidden bg-black/40"
            onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        {/* Mobile sidebar */}
        <aside className={`fixed left-0 top-16 w-60 h-screen bg-white shadow-2xl z-40 lg:hidden transition-transform duration-300 ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <nav className="px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <button key={item.path}
                onClick={() => { navigate(item.path); setIsMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-gray-600 hover:bg-blue-50 hover:text-[#185ba5] rounded-xl transition-colors font-medium text-sm">
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Welcome, <span className="font-semibold text-[#1a3a60]">{userName}</span>
            </p>
          </div>
        </aside>

        <Outlet />

        {/* ── Footer ── */}
        <footer className="bg-[#1a3a60] text-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">

              {/* About */}
              <div>
                <img src={logo} alt="Smart Clinic" className="h-12 w-auto mb-4" />
                <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
                  Providing quality healthcare services and connecting patients with experienced doctors for better health outcomes.
                </p>
              </div>

              {/* Contact */}
              <div>
                <h4 className="text-base font-bold mb-5 text-white">Contact Us</h4>
                <ul className="space-y-4">
                  <li>
                    <a href="tel:01118593566"
                      className="flex items-center gap-3 text-blue-200 hover:text-white transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Phone size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Phone</p>
                        <p className="font-semibold text-sm">01118593566</p>
                      </div>
                    </a>
                  </li>
                  <li>
                    <a href="mailto:ashour2j83@gmail.com"
                      className="flex items-center gap-3 text-blue-200 hover:text-white transition-colors group">
                      <div className="w-9 h-9 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors">
                        <Mail size={15} />
                      </div>
                      <div>
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Email</p>
                        <p className="font-semibold text-sm">ashour2j83@gmail.com</p>
                      </div>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-blue-800/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-blue-300 text-sm">© 2026 Smart Clinic. All rights reserved.</p>
              <div className="flex gap-3">
                {[
                  { label: "Facebook", d: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-.921.345-.921.921v1.529h2.773l-.446 2.389h-2.327v7.403h-2.948v-7.403h-2.007v-2.389h2.007v-.878c0-2.889 1.436-4.649 4.499-4.649h1.747v2.142z" },
                  { label: "Twitter",  d: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" },
                  { label: "Instagram", d: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12c0-3.403 2.759-6.162 6.162-6.162s6.162 2.759 6.162 6.162c0 3.403-2.759 6.162-6.162 6.162s-6.162-2.759-6.162-6.162zm2.889 0c0 1.821 1.453 3.273 3.273 3.273s3.273-1.452 3.273-3.273c0-1.82-1.452-3.273-3.273-3.273s-3.273 1.452-3.273 3.273zm6.538-6.36c0 .795.645 1.44 1.44 1.44s1.44-.645 1.44-1.44-.645-1.44-1.44-1.44-1.44.645-1.44 1.44z" },
                ].map(({ label, d }) => (
                  <a key={label} href="#"
                    className="w-8 h-8 rounded-lg bg-white/8 hover:bg-white/20 flex items-center justify-center text-blue-300 hover:text-white transition-all">
                    <span className="sr-only">{label}</span>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={d} /></svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

      </Suspense>
    </div>
  );
}
