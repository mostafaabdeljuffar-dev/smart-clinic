import "./mock"
import { Suspense, lazy } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"

import Layout from "./components/layouts/Layout"
import Home from "./pages/Home"
import Login from "./pages/auth/Login/Login"
import ForgetPassword from "./pages/auth/ForgetPassword/ForgetPassword"
import { AuthProvider } from "./auth"
import Register from "./pages/auth/Register/Register"
import Dashboard from "./pages/Dashboard"
import DoctorDashboard from "./pages/Doctor/DoctorDashboard"

const NotFound = lazy(() => import("./pages/not-found"))
const Unauthorized = lazy(() => import("./pages/unauthorized"))

const Patients = lazy(() => import("./pages/Dashboard/Patients").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Patients Management</h1><p className="text-gray-500">Coming soon...</p></div> })))
const Doctors = lazy(() => import("./pages/Dashboard/Doctors").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Doctors Management</h1><p className="text-gray-500">Coming soon...</p></div> })))
const Appointments = lazy(() => import("./pages/Dashboard/Appointments").catch(() => ({ default: () => <div className="p-10"><h1 className="text-2xl font-bold">Appointments Management</h1><p className="text-gray-500">Coming soon...</p></div> })))

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* Home with Layout */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
            </Route>

            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/patients" element={<Patients />} />
            <Route path="/dashboard/doctors" element={<Doctors />} />
            <Route path="/dashboard/appointments" element={<Appointments />} />

            {/* Doctor Dashboard */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgetPassword />} />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </Suspense>
  )
}

export default Router