import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsAPI, subjectsAPI, gradesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Subject {
  id: string;
  nama_mapel: string;
  created_at?: string;
  updated_at?: string;
}

interface Student {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jenis_kelamin: string;
}

export default function Grades() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [gradeType, setGradeType] = useState<"assignment" | "midterm" | "final">("assignment");
  const [formData, setFormData] = useState({
    student_id: "",
    mapel_id: "",
    semester: "",
    nilai: "",
    keterangan: "",
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: studentsAPI.getAll,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsAPI.getAll,
  });

  const addMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      if (type === "assignment") {
        return gradesAPI.createAssignment(data);
      } else if (type === "midterm") {
        return gradesAPI.createMidterm(data);
      } else {
        return gradesAPI.createFinal(data);
      }
    },
    onSuccess: (_, variables) => {
      const queryKey = variables.type === "assignment" ? "assignments" : variables.type === "midterm" ? "midterms" : "finals";
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      toast.success("Nilai berhasil ditambahkan");
      handleClose();
    },
    onError: (error: any) => {
      if (error?.message?.includes("sudah ada")) {
        toast.error(error.message);
      } else {
        toast.error("Gagal menambahkan nilai: " + error.message);
      }
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingGrade(null);
    setFormData({ student_id: "", mapel_id: "", semester: "", nilai: "", keterangan: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id) {
      toast.error("Silakan pilih siswa terlebih dahulu");
      return;
    }

    if (!formData.mapel_id) {
      toast.error("Silakan pilih mata pelajaran terlebih dahulu");
      return;
    }

    if (!formData.semester) {
      toast.error("Silakan pilih semester terlebih dahulu");
      return;
    }
    
    const submitData = {
      student_id: formData.student_id,
      mapel_id: formData.mapel_id,
      semester: formData.semester,
      nilai: parseFloat(formData.nilai),
      ...(gradeType === "assignment" && { keterangan: formData.keterangan }),
    };
    
    addMutation.mutate({ type: gradeType, data: submitData });
  };

  const hasSubjects = subjects && subjects.length > 0;
  const hasStudents = students && students.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Input Nilai</h2>
          <p className="text-sm md:text-base text-muted-foreground">Kelola nilai tugas, UTS, dan UAS siswa per mata pelajaran</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasSubjects || !hasStudents}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Nilai
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Edit Nilai" : "Tambah Nilai"}</DialogTitle>
              <DialogDescription>{editingGrade ? "Perbarui nilai siswa" : "Masukkan nilai siswa"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Jenis Nilai</Label>
                <Select value={gradeType} onValueChange={(value: any) => setGradeType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Tugas</SelectItem>
                    <SelectItem value="midterm">UTS</SelectItem>
                    <SelectItem value="final">UAS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="student">Siswa</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.nama} - {student.kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mapel">Mata Pelajaran</Label>
                <Select
                  value={formData.mapel_id}
                  onValueChange={(value) => setFormData({ ...formData, mapel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mata pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject: Subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.nama_mapel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024/2025 ganjil">2024/2025 Ganjil</SelectItem>
                    <SelectItem value="2024/2025 genap">2024/2025 Genap</SelectItem>
                    <SelectItem value="2023/2024 ganjil">2023/2024 Ganjil</SelectItem>
                    <SelectItem value="2023/2024 genap">2023/2024 Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="nilai">Nilai (0-100)</Label>
                <Input
                  id="nilai"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.nilai}
                  onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
                  required
                />
              </div>
              {gradeType === "assignment" && (
                <div>
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Input
                    id="keterangan"
                    placeholder="Contoh: Tugas 1, Quiz 2, dst"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button type="submit">{editingGrade ? "Perbarui" : "Tambah"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!hasSubjects && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada mata pelajaran. Silakan tambahkan mata pelajaran terlebih dahulu di menu{" "}
            <a href="/subjects" className="font-semibold underline">Mata Pelajaran</a>.
          </AlertDescription>
        </Alert>
      )}

      {!hasStudents && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada data siswa. Silakan tambahkan siswa terlebih dahulu di menu{" "}
            <a href="/students" className="font-semibold underline">Data Siswa</a>.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3 text-xs md:text-sm">
          <TabsTrigger value="assignments">Tugas</TabsTrigger>
          <TabsTrigger value="midterms">UTS</TabsTrigger>
          <TabsTrigger value="finals">UAS</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          <AssignmentsTable subjects={subjects || []} students={students || []} />
        </TabsContent>
        <TabsContent value="midterms">
          <MidtermsTable subjects={subjects || []} students={students || []} />
        </TabsContent>
        <TabsContent value="finals">
          <FinalsTable subjects={subjects || []} students={students || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AssignmentsTable({ subjects, students }: { subjects: Subject[]; students: Student[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [formData, setFormData] = useState({ student_id: "", mapel_id: "", semester: "", nilai: "", keterangan: "" });

  const { data: assignments } = useQuery({
    queryKey: ["assignments"],
    queryFn: gradesAPI.getAllAssignments,
  });

  const assignmentsWithRelations = useMemo(() => {
    if (!assignments) return [];
    return assignments.map((a: any) => ({
      ...a,
      student: students.find(s => s.id === a.student_id),
      subject: subjects.find(s => s.id === a.mapel_id),
    }));
  }, [assignments, students, subjects]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => gradesAPI.updateAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Nilai berhasil diperbarui");
      setOpen(false);
      setEditingGrade(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.deleteAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Nilai berhasil dihapus");
    },
  });

  const handleEdit = (assignment: any) => {
    setEditingGrade(assignment);
    setFormData({
      student_id: assignment.student_id,
      mapel_id: assignment.mapel_id || "",
      semester: assignment.semester,
      nilai: assignment.nilai.toString(),
      keterangan: assignment.keterangan || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingGrade.id,
      data: {
        student_id: formData.student_id,
        mapel_id: formData.mapel_id || null,
        semester: formData.semester,
        nilai: parseFloat(formData.nilai),
        keterangan: formData.keterangan,
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Daftar Nilai Tugas
          </CardTitle>
          <CardDescription>Total {assignments?.length || 0} nilai tugas</CardDescription>
        </CardHeader>
        <CardContent>
          {assignmentsWithRelations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Siswa</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">Mata Pelajaran</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Semester</TableHead>
                    <TableHead className="text-xs md:text-sm hidden lg:table-cell">Keterangan</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentsWithRelations.map((assignment: any) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{assignment.student?.nama || assignment.student_name || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{assignment.subject?.nama_mapel || assignment.nama_mapel || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden md:table-cell">{assignment.semester}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden lg:table-cell">{assignment.keterangan || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-xs md:text-sm">{Number(assignment.nilai).toFixed(0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button size="sm" variant="outline" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => handleEdit(assignment)}>
                            <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => deleteMutation.mutate(assignment.id)}>
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Belum ada nilai tugas</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nilai Tugas</DialogTitle>
            <DialogDescription>Perbarui nilai tugas siswa</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Siswa</Label>
              <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>{student.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mata Pelajaran</Label>
              <Select value={formData.mapel_id} onValueChange={(value) => setFormData({ ...formData, mapel_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.nama_mapel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025 ganjil">2024/2025 Ganjil</SelectItem>
                  <SelectItem value="2024/2025 genap">2024/2025 Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai</Label>
              <Input type="number" min="0" max="100" value={formData.nilai} onChange={(e) => setFormData({ ...formData, nilai: e.target.value })} />
            </div>
            <div>
              <Label>Keterangan</Label>
              <Input value={formData.keterangan} onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Perbarui</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MidtermsTable({ subjects, students }: { subjects: Subject[]; students: Student[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [formData, setFormData] = useState({ student_id: "", mapel_id: "", semester: "", nilai: "" });

  const { data: midterms } = useQuery({
    queryKey: ["midterms"],
    queryFn: gradesAPI.getAllMidterms,
  });

  const midtermsWithRelations = useMemo(() => {
    if (!midterms) return [];
    return midterms.map((m: any) => ({
      ...m,
      student: students.find(s => s.id === m.student_id),
      subject: subjects.find(s => s.id === m.mapel_id),
    }));
  }, [midterms, students, subjects]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => gradesAPI.updateMidterm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterms"] });
      toast.success("Nilai berhasil diperbarui");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.deleteMidterm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["midterms"] });
      toast.success("Nilai berhasil dihapus");
    },
  });

  const handleEdit = (midterm: any) => {
    setEditingGrade(midterm);
    setFormData({
      student_id: midterm.student_id,
      mapel_id: midterm.mapel_id || "",
      semester: midterm.semester,
      nilai: midterm.nilai.toString(),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingGrade.id,
      data: {
        student_id: formData.student_id,
        mapel_id: formData.mapel_id,
        semester: formData.semester,
        nilai: parseFloat(formData.nilai),
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Daftar Nilai UTS
          </CardTitle>
          <CardDescription>Total {midterms?.length || 0} nilai UTS</CardDescription>
        </CardHeader>
        <CardContent>
          {midtermsWithRelations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Siswa</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">Mata Pelajaran</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Semester</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {midtermsWithRelations.map((midterm: any) => (
                    <TableRow key={midterm.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{midterm.student?.nama || midterm.student_name || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{midterm.subject?.nama_mapel || midterm.nama_mapel || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden md:table-cell">{midterm.semester}</TableCell>
                      <TableCell className="text-right font-semibold text-xs md:text-sm">{Number(midterm.nilai).toFixed(0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button size="sm" variant="outline" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => handleEdit(midterm)}>
                            <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => deleteMutation.mutate(midterm.id)}>
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Belum ada nilai UTS</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nilai UTS</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Siswa</Label>
              <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>{student.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mata Pelajaran</Label>
              <Select value={formData.mapel_id} onValueChange={(value) => setFormData({ ...formData, mapel_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.nama_mapel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025 ganjil">2024/2025 Ganjil</SelectItem>
                  <SelectItem value="2024/2025 genap">2024/2025 Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai</Label>
              <Input type="number" min="0" max="100" value={formData.nilai} onChange={(e) => setFormData({ ...formData, nilai: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Perbarui</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FinalsTable({ subjects, students }: { subjects: Subject[]; students: Student[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [formData, setFormData] = useState({ student_id: "", mapel_id: "", semester: "", nilai: "" });

  const { data: finals } = useQuery({
    queryKey: ["finals"],
    queryFn: gradesAPI.getAllFinals,
  });

  const finalsWithRelations = useMemo(() => {
    if (!finals) return [];
    return finals.map((f: any) => ({
      ...f,
      student: students.find(s => s.id === f.student_id),
      subject: subjects.find(s => s.id === f.mapel_id),
    }));
  }, [finals, students, subjects]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => gradesAPI.updateFinal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finals"] });
      toast.success("Nilai berhasil diperbarui");
      setOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => gradesAPI.deleteFinal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finals"] });
      toast.success("Nilai berhasil dihapus");
    },
  });

  const handleEdit = (final: any) => {
    setEditingGrade(final);
    setFormData({
      student_id: final.student_id,
      mapel_id: final.mapel_id || "",
      semester: final.semester,
      nilai: final.nilai.toString(),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: editingGrade.id,
      data: {
        student_id: formData.student_id,
        mapel_id: formData.mapel_id,
        semester: formData.semester,
        nilai: parseFloat(formData.nilai),
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Daftar Nilai UAS
          </CardTitle>
          <CardDescription>Total {finals?.length || 0} nilai UAS</CardDescription>
        </CardHeader>
        <CardContent>
          {finalsWithRelations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Siswa</TableHead>
                    <TableHead className="text-xs md:text-sm hidden sm:table-cell">Mata Pelajaran</TableHead>
                    <TableHead className="text-xs md:text-sm hidden md:table-cell">Semester</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                    <TableHead className="text-right text-xs md:text-sm">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {finalsWithRelations.map((final: any) => (
                    <TableRow key={final.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{final.student?.nama || final.student_name || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden sm:table-cell">{final.subject?.nama_mapel || final.nama_mapel || "-"}</TableCell>
                      <TableCell className="text-xs md:text-sm hidden md:table-cell">{final.semester}</TableCell>
                      <TableCell className="text-right font-semibold text-xs md:text-sm">{Number(final.nilai).toFixed(0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 md:gap-2">
                          <Button size="sm" variant="outline" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => handleEdit(final)}>
                            <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 w-7 md:h-8 md:w-8 p-0" onClick={() => deleteMutation.mutate(final.id)}>
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Belum ada nilai UAS</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Nilai UAS</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Siswa</Label>
              <Select value={formData.student_id} onValueChange={(value) => setFormData({ ...formData, student_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>{student.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mata Pelajaran</Label>
              <Select value={formData.mapel_id} onValueChange={(value) => setFormData({ ...formData, mapel_id: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.nama_mapel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025 ganjil">2024/2025 Ganjil</SelectItem>
                  <SelectItem value="2024/2025 genap">2024/2025 Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nilai</Label>
              <Input type="number" min="0" max="100" value={formData.nilai} onChange={(e) => setFormData({ ...formData, nilai: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Perbarui</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
