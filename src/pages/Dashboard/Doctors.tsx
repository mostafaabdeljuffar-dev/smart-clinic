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
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase";

// ─── Clinics ──────────────────────────────────────────────────────────────────

const CLINICS = [
  { id: "cardio_clinic",            name: "Cardiology" },
  { id: "chest_clinic",             name: "Chest" },
  { id: "dental_clinic",            name: "Dental" },
  { id: "derma_clinic",             name: "Dermatology" },
  { id: "ent_clinic",               name: "ENT" },
  { id: "eye_clinic",               name: "Eye" },
  { id: "gynecology_clinic",        name: "Gynecology" },
  { id: "internal_medicine_female", name: "Internal Medicine (Female)" },
  { id: "internal_medicine_male",   name: "Internal Medicine (Male)" },
  { id: "neurology_clinic",         name: "Neurology" },
  { id: "neurosurgery_clinic",      name: "Neurosurgery" },
  { id: "nutrition_clinic",         name: "Nutrition" },
  { id: "orthopedic_clinic",        name: "Orthopedic" },
  { id: "physiotherapy_clinic",     name: "Physiotherapy" },
  { id: "surgery_clinic",           name: "Surgery" },
  { id: "urology_clinic",           name: "Urology" },
];

const clinicName = (id: string) => CLINICS.find((c) => c.id === id)?.name ?? id;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Doctor {
  id: string;
  name: string;
  email: string;
  role: "doctor" | "pending";
  description: string;
  specialization: string;
  clinicId: string;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const doctorSchema = z.object({
  name:           z.string().min(2, "Name must be at least 2 characters"),
  email:          z.string().email("Please enter a valid email"),
  description:    z.string().min(2, "Description is required"),
  specialization: z.string().min(2, "Specialization is required"),
  clinicId:       z.string().min(1, "Please select a clinic"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

// ─── Form field config ────────────────────────────────────────────────────────

const TEXT_FIELDS = [
  { key: "name",           label: "Name",           type: "text" },
  { key: "email",          label: "Email",          type: "email" },
  { key: "specialization", label: "Specialization", type: "text" },
  { key: "description",    label: "Description",    type: "text" },
] as const;

// ─── Reusable Doctor Form ─────────────────────────────────────────────────────

function DoctorForm({
  form,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: ReturnType<typeof useForm<DoctorFormValues>>;
  onSubmit: (v: DoctorFormValues) => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 py-4">
        {TEXT_FIELDS.map(({ key, label, type }) => (
          <div key={key} className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={`form-${key}`} className="text-right text-sm font-medium">
              {label}
            </Label>
            <div className="col-span-3">
              <Input
                id={`form-${key}`}
                type={type}
                {...form.register(key)}
                className={form.formState.errors[key] ? "border-red-400" : ""}
              />
              {form.formState.errors[key] && (
                <p className="text-xs text-red-500 mt-1">
                  {form.formState.errors[key]?.message}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Clinic Selection */}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right text-sm font-medium">Clinic</Label>
          <div className="col-span-3">
            <Controller
              name="clinicId"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger
                    className={`w-full ${form.formState.errors.clinicId ? "border-red-400" : ""}`}
                  >
                    <SelectValue placeholder="Select a clinic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLINICS.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.clinicId && (
              <p className="text-xs text-red-500 mt-1">
                {form.formState.errors.clinicId.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#185ba5] hover:bg-[#134885] text-white" disabled={loading}>
          {loading && <Loader2 className="animate-spin mr-2" size={15} />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const updateForm = useForm<DoctorFormValues>({ resolver: zodResolver(doctorSchema) });
  const addForm    = useForm<DoctorFormValues>({ resolver: zodResolver(doctorSchema) });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "doctors"));
      const data: Doctor[] = snapshot.docs.map((d) => ({
        id:             d.id,
        name:           d.data().name           ?? "",
        email:          d.data().email          ?? "",
        role:           d.data().role           ?? "pending",
        description:    d.data().description    ?? "",
        specialization: d.data().specialization ?? "",
        clinicId:       d.data().clinicId       ?? "",
      }));
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDoctors(); }, []);

  // ── Filter + Paginate ──────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    doctors.filter((d) =>
      [d.name, d.email, d.specialization, clinicName(d.clinicId)]
        .some((v) => v.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [doctors, searchTerm]
  );

  const totalPages   = Math.ceil(filtered.length / rowsPerPage);
  const startIndex   = (currentPage - 1) * rowsPerPage;
  const paginated    = filtered.slice(startIndex, startIndex + rowsPerPage);

  // ── Status ─────────────────────────────────────────────────────────────────
  const handleStatusConfirm = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      const newRole: "doctor" | "pending" = selectedDoctor.role === "doctor" ? "pending" : "doctor";
      await updateDoc(doc(db, "doctors", selectedDoctor.id), { role: newRole });
      setDoctors((prev) => prev.map((d) => d.id === selectedDoctor.id ? { ...d, role: newRole } : d));
      setStatusModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "doctors", selectedDoctor.id));
      setDoctors((prev) => prev.filter((d) => d.id !== selectedDoctor.id));
      setDeleteModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ── Update ─────────────────────────────────────────────────────────────────
  const openUpdate = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    updateForm.reset({
      name:           doctor.name,
      email:          doctor.email,
      description:    doctor.description,
      specialization: doctor.specialization,
      clinicId:       doctor.clinicId,
    });
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (values: DoctorFormValues) => {
    if (!selectedDoctor) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "doctors", selectedDoctor.id), { ...values });
      setDoctors((prev) => prev.map((d) => d.id === selectedDoctor.id ? { ...d, ...values } : d));
      setUpdateModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ── Add ────────────────────────────────────────────────────────────────────
  const openAdd = () => { addForm.reset(); setAddModalOpen(true); };

  const handleAddSubmit = async (values: DoctorFormValues) => {
    setActionLoading(true);
    try {
      const ref = await addDoc(collection(db, "doctors"), { ...values, role: "pending" });
      setDoctors((prev) => [...prev, { id: ref.id, ...values, role: "pending" }]);
      setAddModalOpen(false);
    } catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">Doctors Management</h1>
          <p className="text-gray-500 text-sm">Manage and view all registered doctors</p>
        </div>

        {/* Search + Add */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by name, email, specialization or clinic..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Button
              className="bg-[#185ba5] hover:bg-[#134885] text-white flex-shrink-0"
              onClick={openAdd}
            >
              + Add Doctor
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-[#185ba5]" size={36} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-[#1a3a60]">Doctor</TableHead>
                  <TableHead className="font-semibold text-[#1a3a60]">Email</TableHead>
                  <TableHead className="font-semibold text-[#1a3a60]">Clinic</TableHead>
                  <TableHead className="font-semibold text-[#1a3a60]">Specialization</TableHead>
                  <TableHead className="font-semibold text-[#1a3a60]">Status</TableHead>
                  <TableHead className="font-semibold text-[#1a3a60]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-gray-400">
                      No doctors found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((doctor) => (
                    <TableRow key={doctor.id} className="hover:bg-gray-50/50">
                      {/* Doctor */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <Stethoscope size={17} className="text-[#185ba5]" />
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{doctor.name}</span>
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-gray-500 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-gray-400 flex-shrink-0" />
                          {doctor.email}
                        </div>
                      </TableCell>

                      {/* Clinic */}
                      <TableCell>
                        {doctor.clinicId ? (
                          <span className="bg-blue-50 text-[#185ba5] text-xs font-semibold px-2.5 py-1 rounded-full">
                            {clinicName(doctor.clinicId)}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Specialization */}
                      <TableCell className="text-gray-500 text-sm">
                        {doctor.specialization}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <button
                          onClick={() => { setSelectedDoctor(doctor); setStatusModalOpen(true); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            doctor.role === "doctor"
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {doctor.role === "doctor"
                            ? <CheckCircle size={13} />
                            : <XCircle size={13} />}
                          {doctor.role === "doctor" ? "Active" : "Pending"}
                        </button>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openUpdate(doctor)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#185ba5] hover:text-[#134885] border border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Edit size={13} /> Edit
                          </button>
                          <button
                            onClick={() => { setSelectedDoctor(doctor); setDeleteModalOpen(true); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-all"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page:</span>
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(v) => { setRowsPerPage(parseInt(v)); setCurrentPage(1); }}
                >
                  <SelectTrigger className="w-16 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <span className="text-sm text-gray-400">
                {startIndex + 1}–{Math.min(startIndex + rowsPerPage, filtered.length)} of {filtered.length}
              </span>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      size="sm"
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        size="sm"
                        onClick={() => setCurrentPage(page)}
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
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* ── Status Modal ── */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Doctor Status</DialogTitle>
            <DialogDescription>
              {selectedDoctor?.role === "doctor"
                ? `Set ${selectedDoctor?.name} back to Pending?`
                : `Activate ${selectedDoctor?.name} as an active Doctor?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button className="bg-[#185ba5] hover:bg-[#134885] text-white" onClick={handleStatusConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="animate-spin mr-2" size={14} />} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Doctor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedDoctor?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>No</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="animate-spin mr-2" size={14} />} Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Update Modal ── */}
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Doctor</DialogTitle>
            <DialogDescription>Editing info for {selectedDoctor?.name}</DialogDescription>
          </DialogHeader>
          <DoctorForm
            form={updateForm}
            onSubmit={handleUpdateSubmit}
            onCancel={() => setUpdateModalOpen(false)}
            loading={actionLoading}
            submitLabel="Save Changes"
          />
        </DialogContent>
      </Dialog>

      {/* ── Add Modal ── */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
            <DialogDescription>New doctors start with Pending status.</DialogDescription>
          </DialogHeader>
          <DoctorForm
            form={addForm}
            onSubmit={handleAddSubmit}
            onCancel={() => setAddModalOpen(false)}
            loading={actionLoading}
            submitLabel="Add Doctor"
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
