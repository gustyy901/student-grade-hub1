import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileDown, FileSpreadsheet, Loader2, FileText, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI, gradesAPI } from "@/lib/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Reports() {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: studentsAPI.getAll,
  });

  const handleExportPDF = async () => {
    if (!selectedStudent || !selectedSemester) {
      toast.error("Pilih siswa dan semester terlebih dahulu");
      return;
    }

    setIsExporting(true);
    try {
      const student = students?.find((s: any) => s.id === selectedStudent);
      if (!student) {
        toast.error("Data siswa tidak ditemukan");
        return;
      }

      const gradeDetail = await gradesAPI.getDetail(selectedStudent, selectedSemester);
      const assignments = gradeDetail?.assignments || [];
      const midterms = gradeDetail?.midterms || [];
      const finals = gradeDetail?.finals || [];

      const avgAssignment = assignments && assignments.length > 0
        ? assignments.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / assignments.length
        : 0;
      const midtermScore = midterms && midterms.length > 0 ? Number(midterms[0].nilai) : 0;
      const finalScore = finals && finals.length > 0 ? Number(finals[0].nilai) : 0;
      const weightedAverage = (avgAssignment * 0.4) + (midtermScore * 0.3) + (finalScore * 0.3);

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("RAPOR SISWA", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.text(`NIS: ${student.nis}`, 20, 40);
      doc.text(`Nama: ${student.nama}`, 20, 50);
      doc.text(`Kelas: ${student.kelas}`, 20, 60);
      doc.text(`Semester: ${selectedSemester}`, 20, 70);

      if (assignments && assignments.length > 0) {
        autoTable(doc, {
          startY: 85,
          head: [["No", "Keterangan", "Nilai"]],
          body: assignments.map((a: any, idx: number) => [
            idx + 1,
            a.keterangan || `Tugas ${idx + 1}`,
            Number(a.nilai).toFixed(2)
          ]),
          theme: "grid",
        });
      }

      const finalY = (doc as any).lastAutoTable?.finalY || 85;
      doc.text(`Rata-rata Tugas: ${avgAssignment.toFixed(2)}`, 20, finalY + 15);
      doc.text(`Nilai UTS: ${midtermScore.toFixed(2)}`, 20, finalY + 25);
      doc.text(`Nilai UAS: ${finalScore.toFixed(2)}`, 20, finalY + 35);
      
      doc.setFontSize(14);
      doc.text(`NILAI AKHIR: ${weightedAverage.toFixed(2)}`, 20, finalY + 50);
      doc.text(`Status: ${weightedAverage >= 75 ? "LULUS" : "TIDAK LULUS"}`, 20, finalY + 60);

      doc.save(`Rapor_${student.nama}_${selectedSemester}.pdf`);
      toast.success("Rapor berhasil diexport ke PDF");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Gagal export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const allStudents = await studentsAPI.getAll();
      const allAssignments = await gradesAPI.getAllAssignments();
      const allMidterms = await gradesAPI.getAllMidterms();
      const allFinals = await gradesAPI.getAllFinals();

      if (!allStudents || allStudents.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      const excelData = allStudents.map((student: any) => {
        const studentAssignments = allAssignments?.filter((a: any) => a.student_id === student.id) || [];
        const studentMidterms = allMidterms?.filter((m: any) => m.student_id === student.id) || [];
        const studentFinals = allFinals?.filter((f: any) => f.student_id === student.id) || [];

        const avgAssignment = studentAssignments.length > 0
          ? studentAssignments.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / studentAssignments.length
          : 0;

        return {
          NIS: student.nis,
          Nama: student.nama,
          Kelas: student.kelas,
          "Jenis Kelamin": student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
          "Jumlah Tugas": studentAssignments.length,
          "Rata-rata Tugas": avgAssignment.toFixed(2),
          "Jumlah UTS": studentMidterms.length,
          "Jumlah UAS": studentFinals.length,
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const maxWidth = excelData.reduce((w: number, r: any) => Math.max(w, r.Nama.length), 10);
      ws["!cols"] = [
        { wch: 15 },
        { wch: maxWidth },
        { wch: 10 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai");

      if (allAssignments && allAssignments.length > 0) {
        const assignmentsData = allAssignments.map((a: any) => ({
          Siswa: a.student_name,
          Kelas: a.kelas,
          "Mata Pelajaran": a.nama_mapel,
          Semester: a.semester,
          Keterangan: a.keterangan || "",
          Nilai: Number(a.nilai).toFixed(2),
        }));
        const wsAssignments = XLSX.utils.json_to_sheet(assignmentsData);
        XLSX.utils.book_append_sheet(wb, wsAssignments, "Detail Tugas");
      }

      XLSX.writeFile(wb, "Rekap_Nilai_Siswa.xlsx");
      toast.success("Data berhasil diexport ke Excel");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Gagal export Excel");
    } finally {
      setIsExporting(false);
    }
  };

  const pdfFeatures = [
    "Identitas siswa lengkap",
    "Daftar semua nilai tugas",
    "Nilai UTS dan UAS",
    "Nilai akhir weighted average",
    "Status kelulusan",
  ];

  const excelFeatures = [
    "Data siswa lengkap",
    "Ringkasan nilai per siswa",
    "Detail nilai tugas (sheet terpisah)",
    "Perhitungan rata-rata tugas",
    "Statistik lengkap",
    "Ready untuk analisis pivot table",
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Download className="h-6 w-6 text-white" />
          </div>
          <h2 className="page-title">Laporan & Export</h2>
        </div>
        <p className="page-description">Export data nilai siswa dalam berbagai format</p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PDF Export Card */}
        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-card hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Export Rapor (PDF)</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Download rapor siswa dalam format PDF
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-5">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pilih Siswa</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Pilih siswa" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id} className="rounded-lg">
                      {student.nama} - {student.kelas}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Pilih Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="h-12 rounded-xl border-2 border-border/50 bg-background/50 hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="2024/2025 ganjil" className="rounded-lg">2024/2025 Ganjil</SelectItem>
                  <SelectItem value="2024/2025 genap" className="rounded-lg">2024/2025 Genap</SelectItem>
                  <SelectItem value="2023/2024 ganjil" className="rounded-lg">2023/2024 Ganjil</SelectItem>
                  <SelectItem value="2023/2024 genap" className="rounded-lg">2023/2024 Genap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleExportPDF} 
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
              disabled={isExporting || !selectedStudent || !selectedSemester}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sedang Export...
                </>
              ) : (
                <>
                  <FileDown className="h-5 w-5 mr-2" />
                  Export ke PDF
                </>
              )}
            </Button>
            
            {/* Features List */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm font-semibold text-foreground mb-3">Format rapor mencakup:</p>
              <ul className="space-y-2">
                {pdfFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Excel Export Card */}
        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-card hover:shadow-xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
                <FileSpreadsheet className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Export Rekap (Excel)</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Download rekapitulasi data nilai dalam format Excel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-5">
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
              <p className="text-sm text-muted-foreground">
                Export semua data siswa dan nilai dalam satu file Excel untuk analisis lebih lanjut.
              </p>
            </div>
            
            <Button 
              onClick={handleExportExcel} 
              className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sedang Export...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Export ke Excel
                </>
              )}
            </Button>
            
            {/* Features List */}
            <div className="pt-4 border-t border-border/50">
              <p className="text-sm font-semibold text-foreground mb-3">File Excel berisi:</p>
              <ul className="space-y-2">
                {excelFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guide Card */}
      <Card className="relative rounded-2xl border-0 shadow-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold">Panduan Export</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                Cara Export Rapor PDF
              </h4>
              <ol className="space-y-3">
                {[
                  "Pastikan data siswa dan nilai sudah lengkap",
                  "Pilih siswa dari dropdown",
                  "Pilih semester yang ingin di-export",
                  "Klik tombol \"Export ke PDF\"",
                  "File PDF akan otomatis terdownload",
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-600 flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <FileSpreadsheet className="h-4 w-4 text-white" />
                </div>
                Cara Export Excel
              </h4>
              <ol className="space-y-3">
                {[
                  "Klik tombol \"Export ke Excel\"",
                  "File Excel akan export semua data siswa dan nilai",
                  "File Excel akan otomatis terdownload",
                  "Buka dengan Microsoft Excel atau Google Sheets",
                  "Gunakan untuk analisis lebih lanjut",
                ].map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 flex items-center justify-center text-xs font-semibold">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
