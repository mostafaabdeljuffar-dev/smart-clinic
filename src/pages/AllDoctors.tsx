import { useState } from "react";
import { Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Doctor = {
  id: number;
  name: string;
  specialty: string;
  department: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
};

export default function AllDoctors() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showBooking, setShowBooking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState<number | null>(null);

  const doctors = [
    {
      id: 1,
      name: "Dr. Mohamed Ashour",
      specialty: "جراحة عامة",
      department: "Surgery Department",
      price: 1000,
      rating: 4.8,
      reviews: 124,
      image: "https://scontent.fcai19-3.fna.fbcdn.net/v/t39.30808-6/527338358_2319736091814886_438638377195686443_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeG8P-jiktpvbQJu4Q76fsiXp1rNu4Zn7RmnWs27hmftGWNGdnC2NKllouKDpoPtt-diKA3aqyIRibK9Gw_XJncl&_nc_ohc=vOpuKDMJnDsQ7kNvwFjy_r0&_nc_oc=Adkkf3y5FZMr1vHv4Te-d5F05V0DIsTDA1Lx90jmYigF_HcLw1_Mtv8CJqROh4wCrNE&_nc_zt=23&_nc_ht=scontent.fcai19-3.fna&_nc_gid=ZqYF_DWW3waFPFNutb0qMA&_nc_ss=8&oh=00_Afz7Qq_frXdudd9R6Ii55zIKk33XGeaJXen27N4umPFzTw&oe=69B1BE8A",
      description: "Dr. Mohamed is a general surgeon. He helps patients who need surgery and takes good care of them before and after the operation."
    },
    {
      id: 2,
      name: "Dr. Sarah Ahmed",
      specialty: "جلدية",
      department: "Skin Care",
      price: 120,
      rating: 4.9,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      description: "Dr. Sarah treats skin problems like acne, rashes, and allergies. She also helps patients take better care of their skin."
    },
    {
      id: 3,
      name: "Dr. Mohamed Ali",
      specialty: "عظام",
      department: "Bone & Joint",
      price: 180,
      rating: 4.7,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
      description: "Dr. Mohamed helps patients with bone and joint problems. He treats injuries, fractures, and pain in the body."
    },
    {
      id: 4,
      name: "Dr. Mostafa Ashry",
      specialty: "أطفال",
      department: "Children's Health",
      price: 100,
      rating: 4.9,
      reviews: 203,
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      description: "Dr. Mostafa is a children's doctor. He checks kids' health and helps them grow strong and healthy."
    }
  ];

  const timeSlots = [
    "9:00 AM", "10:00 AM", "11:00 AM", "2:00 PM", "3:00 PM", "4:00 PM"
  ];

  const handleBook = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBooking(true);
  };

  const handleConfirmBooking = () => {
    if (!selectedDate || !selectedTime) return;

    setShowBooking(false);
    setShowConfirm(true);
  };

  const confirmBooking = () => {
    const number = Math.floor(Math.random() * 1000) + 1;
    setBookingNumber(number);
    setShowConfirm(false);
    setShowSuccess(true);
    // Here you would save to database
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1a3a60] mb-4">
            Our Expert Doctors
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a doctor and book your appointment easily.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-blue-50"
                  />
                  <h3 className="text-xl font-bold text-[#1a3a60] mb-1">{doctor.name}</h3>
                  <p className="text-[#185ba5] font-semibold mb-2">{doctor.specialty}</p>
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700">{doctor.rating}</span>
                    <span className="text-sm text-gray-500">({doctor.reviews} reviews)</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{doctor.description}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{doctor.department}</span>
                  </div>
                  <Button
                    onClick={() => handleBook(doctor)}
                    className="bg-[#185ba5] hover:bg-[#134885] text-white"
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment with {selectedDoctor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                className="w-full rounded-md border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time
              </label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
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
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowBooking(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={!selectedDate || !selectedTime}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Booking</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center mb-4">
              Are you sure you want to book an appointment with {selectedDoctor?.name} on{" "}
              {selectedDate?.toLocaleDateString()} at {selectedTime}?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Doctor:</span>
                <span>{selectedDoctor?.name}</span>
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
            <p className="text-2xl font-bold text-[#185ba5]">Your number is: #{bookingNumber}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={closeSuccess}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}