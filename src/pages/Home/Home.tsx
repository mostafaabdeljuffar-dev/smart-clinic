import { MessageCircle, Calendar, Stethoscope, Star, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  // Sample doctors data
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

  return (
    <div className="min-h-screen bg-gray-50">
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

            {/* Hero Cards */}
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

      {/* Doctors Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a3a60] mb-4">
              Meet Our Expert Doctors
            </h2>

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

                    <h3 className="text-xl font-bold text-[#1a3a60] mb-1">
                      {doctor.name}
                    </h3>

                    <p className="text-[#185ba5] font-semibold mb-2">
                      {doctor.specialty}
                    </p>

                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-gray-700">
                        {doctor.rating}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({doctor.reviews} reviews)
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {doctor.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{doctor.department}</span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 text-[#185ba5] font-bold">
                        <DollarSign className="w-4 h-4" />
                        <span>{doctor.price}</span>
                      </div>

                      <button className="bg-[#185ba5] hover:bg-[#134885] text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        Book Now
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            ))}

          </div>

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