import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Search, Mail, Phone, Trash2, Edit, CheckCircle, XCircle, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Doctor type
interface Doctor {
  id: number;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  status: "Active" | "Inactive";
}

// Status toggle schema
const statusSchema = z.object({
  status: z.enum(["Active", "Inactive"]),
});

// Update doctor schema
const updateDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialization: z.string().min(2, "Specialization is required"),
});

// Add doctor schema
const addDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  specialization: z.string().min(2, "Specialization is required"),
});

type StatusFormValues = z.infer<typeof statusSchema>;
type UpdateDoctorFormValues = z.infer<typeof updateDoctorSchema>;
type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

export default function Doctors() {
  // Sample doctors data
  const [doctors, setDoctors] = useState<Doctor[]>([
    {
      id: 1,
      name: "Dr. Ahmed Hassan",
      email: "ahmed.hassan@clinic.com",
      phone: "+20 123 456 7890",
      specialization: "Cardiology",
      status: "Active"
    },
    {
      id: 2,
      name: "Dr. Fatima Ali",
      email: "fatima.ali@clinic.com",
      phone: "+20 234 567 8901",
      specialization: "Dermatology",
      status: "Active"
    },
    {
      id: 3,
      name: "Dr. Mohammed Karim",
      email: "mohammed.karim@clinic.com",
      phone: "+20 345 678 9012",
      specialization: "Orthopedics",
      status: "Inactive"
    }
  ]);

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Modal states
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Forms
  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
  });

  const updateForm = useForm<UpdateDoctorFormValues>({
    resolver: zodResolver(updateDoctorSchema),
  });

  const addForm = useForm<AddDoctorFormValues>({
    resolver: zodResolver(addDoctorSchema),
  });

  // Filtered and paginated data
  const filteredDoctors = useMemo(() => {
    return doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctors, searchTerm]);

  const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + rowsPerPage);

  // Handlers
  const handleStatusChange = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    statusForm.setValue("status", doctor.status);
    setStatusModalOpen(true);
  };

  const handleStatusSubmit = (values: StatusFormValues) => {
    if (selectedDoctor) {
      setDoctors(doctors.map(d =>
        d.id === selectedDoctor.id
          ? { ...d, status: values.status }
          : d
      ));
      setStatusModalOpen(false);
      setSelectedDoctor(null);
    }
  };

  const handleDeleteClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedDoctor) {
      setDoctors(doctors.filter(d => d.id !== selectedDoctor.id));
      setDeleteModalOpen(false);
      setSelectedDoctor(null);
    }
  };

  const handleUpdateClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    updateForm.setValue("name", doctor.name);
    updateForm.setValue("email", doctor.email);
    updateForm.setValue("phone", doctor.phone);
    updateForm.setValue("specialization", doctor.specialization);
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = (values: UpdateDoctorFormValues) => {
    if (selectedDoctor) {
      setDoctors(doctors.map(d =>
        d.id === selectedDoctor.id
          ? { ...d, ...values }
          : d
      ));
      setUpdateModalOpen(false);
      setSelectedDoctor(null);
    }
  };

  const handleAddClick = () => {
    addForm.reset();
    setAddModalOpen(true);
  };

  const handleAddSubmit = (values: AddDoctorFormValues) => {
    const newDoctor: Doctor = {
      id: Math.max(...doctors.map(d => d.id)) + 1,
      ...values,
      status: "Active"
    };
    setDoctors([...doctors, newDoctor]);
    setAddModalOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Doctors Management</h1>
          <p className="text-gray-600">Manage and view all your doctors</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search doctors by name, email, or specialization..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="bg-[#185ba5] hover:bg-[#134885]"
              onClick={handleAddClick}
            >
              Add Doctor
            </Button>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope size={20} className="text-[#185ba5]" />
                      </div>
                      <span className="font-medium text-gray-900">{doctor.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    {doctor.email}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    {doctor.phone}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {doctor.specialization}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(doctor)}
                      className={`${
                        doctor.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {doctor.status === "Active" ? (
                        <CheckCircle size={16} className="mr-1" />
                      ) : (
                        <XCircle size={16} className="mr-1" />
                      )}
                      {doctor.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateClick(doctor)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit size={16} className="mr-1" />
                        Update
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(doctor)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Status Change Modal */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Doctor Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedDoctor?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <select
                    {...statusForm.register("status")}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setStatusModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Status</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Doctor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedDoctor?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                No
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Update Doctor Modal */}
        <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Doctor</DialogTitle>
              <DialogDescription>
                Update doctor information for {selectedDoctor?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    {...updateForm.register("name")}
                    className="col-span-3"
                  />
                  {updateForm.formState.errors.name && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {updateForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...updateForm.register("email")}
                    className="col-span-3"
                  />
                  {updateForm.formState.errors.email && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {updateForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    {...updateForm.register("phone")}
                    className="col-span-3"
                  />
                  {updateForm.formState.errors.phone && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {updateForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="specialization" className="text-right">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    {...updateForm.register("specialization")}
                    className="col-span-3"
                  />
                  {updateForm.formState.errors.specialization && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {updateForm.formState.errors.specialization.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Doctor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Doctor Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Add a new doctor to the system with their information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="add-name"
                    {...addForm.register("name")}
                    className="col-span-3"
                  />
                  {addForm.formState.errors.name && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {addForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="add-email"
                    type="email"
                    {...addForm.register("email")}
                    className="col-span-3"
                  />
                  {addForm.formState.errors.email && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {addForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="add-phone"
                    {...addForm.register("phone")}
                    className="col-span-3"
                  />
                  {addForm.formState.errors.phone && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {addForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="add-specialization" className="text-right">
                    Specialization
                  </Label>
                  <Input
                    id="add-specialization"
                    {...addForm.register("specialization")}
                    className="col-span-3"
                  />
                  {addForm.formState.errors.specialization && (
                    <p className="col-span-4 text-sm text-red-500 text-right">
                      {addForm.formState.errors.specialization.message}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Doctor</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pagination and Rows Per Page */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={rowsPerPage.toString()} onValueChange={handleRowsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, filteredDoctors.length)} of {filteredDoctors.length} doctors
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  size="sm"
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  size="sm"
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </DashboardLayout>
  );
}