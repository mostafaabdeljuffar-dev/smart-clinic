import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Search, Mail, Trash2, Edit, CheckCircle, XCircle, Stethoscope, Loader2 } from "lucide-react";
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

// Firestore imports
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase"; // adjust path if needed

// Doctor type
interface Doctor {
  id: string; // Firestore doc ID
  name: string;
  email: string;
  role: "doctor" | "pending";
  description: string;
  specialization: string;
}

// Update doctor schema
const updateDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  description: z.string().min(2, "Description is required"),
  specialization: z.string().min(2, "Specialization is required"),
});

// Add doctor schema
const addDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  description: z.string().min(2, "Description is required"),
  specialization: z.string().min(2, "Specialization is required"),
});

type UpdateDoctorFormValues = z.infer<typeof updateDoctorSchema>;
type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [actionLoading, setActionLoading] = useState(false);

  // Forms
  const updateForm = useForm<UpdateDoctorFormValues>({
    resolver: zodResolver(updateDoctorSchema),
  });

  const addForm = useForm<AddDoctorFormValues>({
    resolver: zodResolver(addDoctorSchema),
  });

  // ─── Fetch doctors from Firestore ───────────────────────────────────────────
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "doctors"));
      const data: Doctor[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name ?? "",
        email: docSnap.data().email ?? "",
        role: docSnap.data().role ?? "pending",
        description: docSnap.data().description ?? "",
        specialization: docSnap.data().specialization ?? "",
      }));
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // ─── Filtered and paginated data ────────────────────────────────────────────
  const filteredDoctors = useMemo(() => {
    return doctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctors, searchTerm]);

  const totalPages = Math.ceil(filteredDoctors.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + rowsPerPage);

  // ─── Status toggle ──────────────────────────────────────────────────────────
  const handleStatusChange = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStatusModalOpen(true);
  };

  const handleStatusConfirm = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      const newRole: "doctor" | "pending" =
        selectedDoctor.role === "doctor" ? "pending" : "doctor";
      const ref = doc(db, "doctors", selectedDoctor.id);
      await updateDoc(ref, { role: newRole });
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDoctor.id ? { ...d, role: newRole } : d
        )
      );
      setStatusModalOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "doctors", selectedDoctor.id));
      setDoctors((prev) => prev.filter((d) => d.id !== selectedDoctor.id));
      setDeleteModalOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error deleting doctor:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Update ─────────────────────────────────────────────────────────────────
  const handleUpdateClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    updateForm.setValue("name", doctor.name);
    updateForm.setValue("email", doctor.email);
    updateForm.setValue("description", doctor.description);
    updateForm.setValue("specialization", doctor.specialization);
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (values: UpdateDoctorFormValues) => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      const ref = doc(db, "doctors", selectedDoctor.id);
      await updateDoc(ref, { ...values });
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === selectedDoctor.id ? { ...d, ...values } : d
        )
      );
      setUpdateModalOpen(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error updating doctor:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Add ────────────────────────────────────────────────────────────────────
  const handleAddClick = () => {
    addForm.reset();
    setAddModalOpen(true);
  };

  const handleAddSubmit = async (values: AddDoctorFormValues) => {
    setActionLoading(true);
    try {
      const docRef = await addDoc(collection(db, "doctors"), {
        ...values,
        role: "pending", // new doctors start as pending
      });
      const newDoctor: Doctor = {
        id: docRef.id,
        ...values,
        role: "pending",
      };
      setDoctors((prev) => [...prev, newDoctor]);
      setAddModalOpen(false);
    } catch (error) {
      console.error("Error adding doctor:", error);
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Pagination ─────────────────────────────────────────────────────────────
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Doctors Management</h1>
          <p className="text-gray-600">Manage and view all your doctors</p>
        </div>

        {/* Search and Add */}
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
            <Button className="bg-[#185ba5] hover:bg-[#134885]" onClick={handleAddClick}>
              Add Doctor
            </Button>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-[#185ba5]" size={36} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-gray-400">
                      No doctors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDoctors.map((doctor) => (
                    <TableRow key={doctor.id}>
                      {/* Name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Stethoscope size={20} className="text-[#185ba5]" />
                          </div>
                          <span className="font-medium text-gray-900">{doctor.name}</span>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-gray-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          {doctor.email}
                        </div>
                      </TableCell>

                      {/* Specialization */}
                      <TableCell className="text-gray-600 text-sm">
                        {doctor.specialization}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-gray-600 text-sm max-w-[200px] truncate">
                        {doctor.description}
                      </TableCell>

                      {/* Status badge — Active if role=="doctor", Inactive if role=="pending" */}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(doctor)}
                          className={
                            doctor.role === "doctor"
                              ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          }
                        >
                          {doctor.role === "doctor" ? (
                            <CheckCircle size={16} className="mr-1" />
                          ) : (
                            <XCircle size={16} className="mr-1" />
                          )}
                          {doctor.role === "doctor" ? "Active" : "Inactive"}
                        </Button>
                      </TableCell>

                      {/* Actions */}
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
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* ── Status Toggle Modal ── */}
        <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Doctor Status</DialogTitle>
              <DialogDescription>
                {selectedDoctor?.role === "doctor"
                  ? `Are you sure you want to set ${selectedDoctor?.name} to Inactive (pending)?`
                  : `Are you sure you want to activate ${selectedDoctor?.name} as a Doctor?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button onClick={handleStatusConfirm} disabled={actionLoading}>
                {actionLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Modal ── */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Doctor</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedDoctor?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>
                No
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={actionLoading}>
                {actionLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Update Modal ── */}
        <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Doctor</DialogTitle>
              <DialogDescription>Update info for {selectedDoctor?.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}>
              <div className="grid gap-4 py-4">
                {(["name", "email", "specialization", "description"] as const).map((field) => (
                  <div key={field} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`update-${field}`} className="text-right capitalize">
                      {field}
                    </Label>
                    <Input
                      id={`update-${field}`}
                      type={field === "email" ? "email" : "text"}
                      {...updateForm.register(field)}
                      className="col-span-3"
                    />
                    {updateForm.formState.errors[field] && (
                      <p className="col-span-4 text-sm text-red-500 text-right">
                        {updateForm.formState.errors[field]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                  Update Doctor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Add Doctor Modal ── */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Add a new doctor — they will start with Inactive (pending) status.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)}>
              <div className="grid gap-4 py-4">
                {(["name", "email", "specialization", "description"] as const).map((field) => (
                  <div key={field} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`add-${field}`} className="text-right capitalize">
                      {field}
                    </Label>
                    <Input
                      id={`add-${field}`}
                      type={field === "email" ? "email" : "text"}
                      {...addForm.register(field)}
                      className="col-span-3"
                    />
                    {addForm.formState.errors[field] && (
                      <p className="col-span-4 text-sm text-red-500 text-right">
                        {addForm.formState.errors[field]?.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                  Add Doctor
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Pagination ── */}
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
            Showing {filteredDoctors.length === 0 ? 0 : startIndex + 1} to{" "}
            {Math.min(startIndex + rowsPerPage, filteredDoctors.length)} of{" "}
            {filteredDoctors.length} doctors
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
