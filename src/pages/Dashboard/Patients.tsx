import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Users, Search, Trash2, Edit, Loader2, UserPlus } from "lucide-react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/firebase";
import { collection, doc, updateDoc, deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  role?: string;
}

const updatePatientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  role: z.enum(["patient", "doctor", "admin"]).optional(),
});

const addUserSchema = z.object({
  name: z.string().min(2, "الاسم لازم يكون أكتر من حرفين"),
  email: z.string().email("إيميل مش صحيح"),
  password: z.string().min(6, "الباسورد لازم يكون 6 أحرف على الأقل"),
  role: z.enum(["patient", "doctor", "admin"]),
});

type UpdatePatientFormValues = z.infer<typeof updatePatientSchema>;
type AddUserFormValues = z.infer<typeof addUserSchema>;

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const updateForm = useForm<UpdatePatientFormValues>({
    resolver: zodResolver(updatePatientSchema),
  });

  const addForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: "patient" },
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const patientList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Patient[];
      setPatients(patientList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateClick = (patient: Patient) => {
    setSelectedPatient(patient);
    updateForm.reset({
      name: patient.name,
      email: patient.email,
      role: (patient.role as "patient" | "doctor" | "admin") || "patient",
    });
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (values: UpdatePatientFormValues) => {
    if (!selectedPatient) return;
    try {
      await updateDoc(doc(db, "users", selectedPatient.id), {
        name: values.name,
        email: values.email,
        role: values.role,
      });
      setUpdateModalOpen(false);
      alert("تم تحديث البيانات بنجاح! ✅");
    } catch (error) {
      console.error("Update Error:", error);
      alert("فشل التحديث");
    }
  };

  const handleDeleteClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPatient) return;
    try {
      await deleteDoc(doc(db, "users", selectedPatient.id));
      setDeleteModalOpen(false);
      alert("تم حذف المستخدم ✅");
    } catch (error) {
      alert("خطأ أثناء الحذف");
    }
  };

  const handleAddSubmit = async (values: AddUserFormValues) => {
    setAddLoading(true);
    try {
      // بنعمل يوزر جديد في Firebase Auth
      const tempAuth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth,
        values.email,
        values.password
      );

      const newUser = userCredential.user;

      // بنحط بياناته في Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        name: values.name,
        email: values.email,
        role: values.role,
        status: "active",
        createdAt: new Date(),
      });

      addForm.reset();
      setAddModalOpen(false);
      alert("تم إضافة المستخدم بنجاح! ✅");
    } catch (error: any) {
      console.error("Add Error:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("الإيميل ده مستخدم بالفعل ❌");
      } else {
        alert("فشل الإضافة: " + error.message);
      }
    } finally {
      setAddLoading(false);
    }
  };

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1a3a60] mb-2">إدارة المستخدمين</h1>
          <p className="text-gray-600">عرض وتعديل بيانات المسجلين من Firestore</p>
        </div>

        {/* Search + Add Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                placeholder="ابحث بالاسم أو الإيميل..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="bg-[#185ba5] hover:bg-[#134885] text-white flex items-center gap-2"
              onClick={() => { addForm.reset({ role: "patient" }); setAddModalOpen(true); }}
            >
              <UserPlus size={18} />
              إضافة مستخدم
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الإيميل</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>العمليات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-10">
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Users size={18} className="text-blue-500" />
                        {patient.name}
                      </div>
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          patient.role === "doctor"
                            ? "bg-purple-100 text-purple-700"
                            : patient.role === "admin"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {patient.role || "patient"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateClick(patient)}
                          className="text-blue-600"
                        >
                          <Edit size={14} className="mr-1" /> تعديل
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(patient)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-1" /> حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add User Modal */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                سيتم إنشاء حساب جديد في Firebase Auth وإضافة البيانات في Firestore
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addForm.handleSubmit(handleAddSubmit)} className="space-y-4">
              <div>
                <Label>الاسم</Label>
                <Input {...addForm.register("name")} placeholder="اسم المستخدم" />
                {addForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{addForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label>الإيميل</Label>
                <Input {...addForm.register("email")} type="email" placeholder="example@email.com" />
                {addForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{addForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label>الباسورد</Label>
                <Input {...addForm.register("password")} type="password" placeholder="6 أحرف على الأقل" />
                {addForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{addForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <Label>الصلاحية (Role)</Label>
                <select
                  {...addForm.register("role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="patient">مريض (Patient)</option>
                  <option value="doctor">طبيب (Doctor)</option>
                  <option value="admin">مدير (Admin)</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={addLoading} className="bg-[#185ba5] hover:bg-[#134885]">
                  {addLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  {addLoading ? "جاري الإضافة..." : "إضافة المستخدم"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update Modal */}
        <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            </DialogHeader>
            <form onSubmit={updateForm.handleSubmit(handleUpdateSubmit)} className="space-y-4">
              <div>
                <Label>الاسم</Label>
                <Input {...updateForm.register("name")} />
                {updateForm.formState.errors.name && (
                  <p className="text-red-500 text-xs mt-1">{updateForm.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <Label>الإيميل</Label>
                <Input {...updateForm.register("email")} />
                {updateForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{updateForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label>الصلاحية (Role)</Label>
                <select
                  {...updateForm.register("role")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="patient">مريض (Patient)</option>
                  <option value="doctor">طبيب (Doctor)</option>
                  <option value="admin">مدير (Admin)</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUpdateModalOpen(false)}>إلغاء</Button>
                <Button type="submit">حفظ التغييرات</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>هل أنت متأكد من الحذف؟</DialogTitle>
              <DialogDescription>
                سيتم مسح بيانات <strong>{selectedPatient?.name}</strong> من قاعدة البيانات نهائياً.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>إلغاء</Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>تأكيد الحذف</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}