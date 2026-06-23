import { Suspense, lazy } from "react"
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"

import Layout from "./components/layouts/Layout"
import Home from "./pages/Home"
import Login from "./pages/auth/Login/Login"
import ForgetPassword from "./pages/auth/ForgetPassword/ForgetPassword"
import { AuthProvider } from "./auth"
import { useAuth } from "@/auth"
import Register from "./pages/auth/Register/Register"
import Dashboard from "./pages/Dashboard"
import DoctorDashboard from "./pages/Doctor/DoctorDashboard"

const NotFound = lazy(() => import("./pages/not-found"))
const Unauthorized = lazy(() => import("./pages/unauthorized"))
const UserAppointments = lazy(() => import("./pages/UserAppointments"))
const AllDoctors = lazy(() => import("./pages/AllDoctors"))

const Patients = lazy(() => import("./pages/Dashboard/Patients").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Patients Management</h1><p className="text-gray-500">Coming soon...</p></div> })))
const Doctors = lazy(() => import("./pages/Dashboard/Doctors").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Doctors Management</h1><p className="text-gray-500">Coming soon...</p></div> })))
const Appointments = lazy(() => import("./pages/Dashboard/Appointments").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Appointments Management</h1><p className="text-gray-500">Coming soon...</p></div> })))

function ProtectedRoute() {
  const { authenticated } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const { authenticated, user } = useAuth();
  if (!authenticated) return <Navigate to="/login" replace />;
  const hasRole = allowedRoles.some((role) => user?.authority?.includes(role));
  if (!hasRole) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Home — requires login */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/appointments" element={<UserAppointments />} />
                <Route path="/doctors" element={<AllDoctors />} />
              </Route>
            </Route>

            {/* Dashboard — admin only */}
            <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/patients" element={<Patients />} />
              <Route path="/dashboard/doctors" element={<Doctors />} />
              <Route path="/dashboard/appointments" element={<Appointments />} />
            </Route>

            {/* Doctor Dashboard — مؤقتاً بدون role check لتشخيص المشكلة */}
            <Route element={<ProtectedRoute />}>
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  )
}

export default Router
