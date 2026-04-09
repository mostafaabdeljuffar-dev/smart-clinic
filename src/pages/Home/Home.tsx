import { MessageCircle, Calendar, Stethoscope, Star, MapPin, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Department = {
  id: number;
  name: string;
  nameEn: string;
  description: string;
  icon: React.ComponentType<any>;
};

export default function Home() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setChecking(false);
        return;
      }

      try {
        // 1. تحقق من الإيميل
        await user.reload();
        if (!user.emailVerified) {
          await signOut(auth);
          alert("لازم تأكد الإيميل الأول قبل تسجيل الدخول 📧");
          setChecking(false);
          return;
        }

        // 2. جيب بيانات الـ user من Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          await signOut(auth);
          navigate("/unauthorized");
          return;
        }

        const userData = userDoc.data();
        const role = userData.role;

        // 3. تحقق من الـ role
        if (role === "admin") {
          setIsAdmin(true);

        } else if (role === "doctor") {
          // تحقق من الـ status في collection doctors
          const doctorDoc = await getDoc(doc(db, "doctors", user.uid));
          if (doctorDoc.exists() && doctorDoc.data().status === "active") {
            navigate("/doctor-dashboard");
          } else {
            await signOut(auth);
            alert("طلبك كدكتور لسه تحت المراجعة ⏳\nهيتم إشعارك لما يتم القبول");
          }

        } else if (role === "patient") {
          // تمام، يفضل في الـ Home
          
        } else {
          // role == pending أو أي حاجة تانية
          await signOut(auth);
          navigate("/unauthorized");
        }

      } catch (error) {
        console.error(error);
        navigate("/unauthorized");
      } finally {
        setChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const departments = [
    {
      id: 1,
      name: "جراحة عامة",
      nameEn: "General Surgery",
      description: "General surgery department for surgical procedures",
      icon: Stethoscope
    },
    {
      id: 2,
      name: "جلدية",
      nameEn: "Dermatology",
      description: "Skin care and dermatological treatments",
      icon: Star
    },
    {
      id: 3,
      name: "عظام",
      nameEn: "Orthopedics",
      description: "Bone and joint care and treatments",
      icon: MapPin
    },
    {
      id: 4,
      name: "أطفال",
      nameEn: "Pediatrics",
      description: "Children's health and medical care",
      icon: MessageCircle
    }
  ];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const handleBook = (department: Department) => {
    setSelectedDepartment(department);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;
    setShowConfirm(true);
  };

  const confirmBooking = () => {
    // Generate a random booking number
    const number = Math.floor(Math.random() * 1000) + 1;
    setBookingNumber(number);
    setShowConfirm(false);
    setShowSuccess(true);
    // Here you would typically save the booking to database
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setSelectedDepartment(null);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Admin Dashboard Bar */}
      {isAdmin && (
        <div className="bg-[#1a3a60] py-2 px-6 flex justify-end">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-white text-[#1a3a60] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1a3a60] to-[#185ba5] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
                Your Health, Our Priority
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Connect with the best doctors near you. Book appointments easily and get the medical help you need anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/doctors")}
                  className="bg-white text-[#1a3a60] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Find a Doctor
                </button>
                <button
                  onClick={() => navigate("/appointments")}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-[#1a3a60] transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-transform">
                    <Stethoscope className="w-12 h-12 text-blue-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Expert Doctors</h3>
                    <p className="text-blue-100 text-sm">Professional doctors ready to help you</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-transform">
                    <Calendar className="w-12 h-12 text-green-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
                    <p className="text-blue-100 text-sm">Book your appointment quickly</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-transform">
                    <MessageCircle className="w-12 h-12 text-purple-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
                    <p className="text-blue-100 text-sm">Support team ready anytime</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transform hover:scale-105 transition-transform">
                    <Star className="w-12 h-12 text-yellow-300 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Quality Care</h3>
                    <p className="text-blue-100 text-sm">Best medical service for patients</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a3a60] mb-4">
              Our Medical Departments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose a department and book your appointment easily.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {departments.map((department) => (
              <div
                key={department.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden cursor-pointer"
                onClick={() => setSelectedDepartment(department)}
              >
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <department.icon className="w-12 h-12 text-[#185ba5] mb-4" />
                    <h3 className="text-xl font-bold text-[#1a3a60] mb-1">{department.name}</h3>
                    <p className="text-[#185ba5] font-semibold mb-2">{department.nameEn}</p>
                    <p className="text-gray-600 text-sm mb-4">{department.description}</p>
                  <Button
                    onClick={() => handleBook(department)}
                    className="bg-[#185ba5] hover:bg-[#134885] text-white"
                  >
                    Book Appointment
                  </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots for Selected Department */}
          {selectedDepartment && (
            <div className="mt-12 bg-gray-50 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#1a3a60] mb-2">
                  Book Appointment in {selectedDepartment.name}
                </h3>
                <p className="text-gray-600">Select your preferred date and time</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                    className="w-full rounded-md border bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time
                  </label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedDepartment(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmBooking}
                      disabled={!selectedDate || !selectedTime}
                      className="flex-1"
                    >
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Booking</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-center mb-4">
                  Are you sure you want to book an appointment in {selectedDepartment?.name} on{" "}
                  {selectedDate?.toLocaleDateString()} at {selectedTime}?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Department:</span>
                    <span>{selectedDepartment?.name}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Date:</span>
                    <span>{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">Time:</span>
                    <span>{selectedTime}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmBooking}>
                  Confirm Booking
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Success Dialog */}
          <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Booking Confirmed!</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-lg mb-4">Your booking has been confirmed.</p>
                <p className="text-2xl font-bold text-[#185ba5]">Your number is: {bookingNumber}</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={closeSuccess}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/doctors")}
              className="bg-[#1a3a60] hover:bg-[#134885] text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View All Doctors
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}