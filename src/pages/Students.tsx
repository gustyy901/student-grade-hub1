import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Students() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    nis: "",
    nama: "",
    kelas: "",
    jenis_kelamin: "",
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentsAPI.getAll,
  });

  const addMutation = useMutation({
    mutationFn: studentsAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa berhasil ditambahkan");
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan siswa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => studentsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa berhasil diperbarui");
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui siswa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: studentsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Siswa berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus siswa");
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingStudent(null);
    setFormData({ nis: "", nama: "", kelas: "", jenis_kelamin: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi jenis_kelamin
    if (!formData.jenis_kelamin) {
      toast.error("Silakan pilih jenis kelamin");
      return;
    }
    
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      nama: student.nama,
      kelas: student.kelas,
      jenis_kelamin: student.jenis_kelamin,
    });
    setOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Data Siswa</h2>
          <p className="text-sm md:text-base text-muted-foreground">Kelola data siswa dalam sistem</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingStudent(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Siswa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Siswa" : "Tambah Siswa"}</DialogTitle>
              <DialogDescription>
                {editingStudent ? "Perbarui data siswa" : "Masukkan data siswa baru"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nis">NIS</Label>
                <Input
                  id="nis"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="kelas">Kelas</Label>
                <Input
                  id="kelas"
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select
                  value={formData.jenis_kelamin}
                  onValueChange={(value) => setFormData({ ...formData, jenis_kelamin: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingStudent ? "Perbarui" : "Tambah"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Daftar Siswa</CardTitle>
          <CardDescription className="text-xs md:text-sm">Total {students?.length || 0} siswa terdaftar</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p>Memuat data...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">NIS</TableHead>
                  <TableHead className="text-xs md:text-sm">Nama</TableHead>
                  <TableHead className="text-xs md:text-sm hidden sm:table-cell">Kelas</TableHead>
                  <TableHead className="text-xs md:text-sm hidden md:table-cell">Jenis Kelamin</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students?.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-xs md:text-sm">{student.nis}</TableCell>
                    <TableCell className="text-xs md:text-sm">{student.nama}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden sm:table-cell">{student.kelas}</TableCell>
                    <TableCell className="text-xs md:text-sm hidden md:table-cell">{student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(student)}
                        >
                          <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Yakin ingin menghapus siswa ini?")) {
                              deleteMutation.mutate(student.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
