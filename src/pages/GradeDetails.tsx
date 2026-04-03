import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { studentsAPI, subjectsAPI, gradesAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader2, BookOpen, FileText, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  nama_mapel: string;
}

interface Student {
  id: string;
  nama: string;
  nis: string;
  kelas: string;
  jenis_kelamin: string;
}

export default function GradeDetails() {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [selectedMapel, setSelectedMapel] = useState<string>("");
  const [openStudent, setOpenStudent] = useState(false);
  const [openMapel, setOpenMapel] = useState(false);

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["students"],
    queryFn: studentsAPI.getAll,
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsAPI.getAll,
  });

  const { data: gradeDetail, isLoading: gradeDetailLoading } = useQuery({
    queryKey: ["grade-detail", selectedStudent, selectedSemester, selectedMapel],
    queryFn: () => gradesAPI.getDetail(selectedStudent, selectedSemester, selectedMapel || undefined),
    enabled: !!selectedStudent && !!selectedSemester,
  });

  const assignments = gradeDetail?.assignments || [];
  const midterms = gradeDetail?.midterms || [];
  const finals = gradeDetail?.finals || [];

  const assignmentsWithSubject = useMemo(() => {
    if (!assignments || !subjects) return [];
    return assignments.map((a: any) => ({
      ...a,
      subject: subjects.find((s: Subject) => s.id === a.mapel_id),
    }));
  }, [assignments, subjects]);

  const midtermsWithSubject = useMemo(() => {
    if (!midterms || !subjects) return [];
    return midterms.map((m: any) => ({
      ...m,
      subject: subjects.find((s: Subject) => s.id === m.mapel_id),
    }));
  }, [midterms, subjects]);

  const finalsWithSubject = useMemo(() => {
    if (!finals || !subjects) return [];
    return finals.map((f: any) => ({
      ...f,
      subject: subjects.find((s: Subject) => s.id === f.mapel_id),
    }));
  }, [finals, subjects]);

  const calculateWeightedAverage = () => {
    if (!assignments || assignments.length === 0 || !midterms || midterms.length === 0 || !finals || finals.length === 0) return null;
    
    const avgAssignment = assignments.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / assignments.length;
    const midtermScore = Number((midterms[0] as any)?.nilai || 0);
    const finalScore = Number((finals[0] as any)?.nilai || 0);
    
    return (avgAssignment * 0.4) + (midtermScore * 0.3) + (finalScore * 0.3);
  };

  const avgAssignment = assignments && assignments.length > 0
    ? assignments.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / assignments.length
    : 0;

  const weightedAverage = calculateWeightedAverage();
  const selectedStudentData = students?.find((s: Student) => s.id === selectedStudent);
  const selectedMapelData = subjects?.find((s: Subject) => s.id === selectedMapel);
  const isLoading = gradeDetailLoading;

  const getGradeBadge = (score: number): "default" | "secondary" | "outline" | "destructive" => {
    if (score >= 90) return "default";
    if (score >= 80) return "secondary";
    if (score >= 70) return "outline";
    return "destructive";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Detail Nilai Siswa</h2>
        <p className="text-sm md:text-base text-muted-foreground">Lihat detail nilai dan perhitungan weighted average per mata pelajaran</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Data</CardTitle>
          <CardDescription>Pilih siswa, semester, dan mata pelajaran untuk melihat detail nilai</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cari Siswa</Label>
              <Popover open={openStudent} onOpenChange={setOpenStudent}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openStudent}
                    className="w-full justify-between"
                  >
                    {selectedStudent
                      ? students?.find((student: Student) => student.id === selectedStudent)?.nama
                      : "Ketik untuk mencari siswa..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama siswa..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada siswa ditemukan.</CommandEmpty>
                      <CommandGroup>
                        {studentsLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          students?.map((student: Student) => (
                            <CommandItem
                              key={student.id}
                              value={student.nama}
                              onSelect={() => {
                                setSelectedStudent(student.id);
                                setOpenStudent(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStudent === student.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {student.nama} - {student.kelas}
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Pilih Semester</Label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
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
            <div className="space-y-2">
              <Label>Mata Pelajaran (Opsional)</Label>
              <Popover open={openMapel} onOpenChange={setOpenMapel}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openMapel}
                    className="w-full justify-between"
                  >
                    {selectedMapel
                      ? subjects?.find((s: Subject) => s.id === selectedMapel)?.nama_mapel
                      : "Semua mata pelajaran"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 z-50 bg-popover" align="start">
                  <Command>
                    <CommandInput placeholder="Cari mata pelajaran..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada mata pelajaran ditemukan.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setSelectedMapel("");
                            setOpenMapel(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMapel === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Semua mata pelajaran
                        </CommandItem>
                        {subjects?.map((subject: Subject) => (
                          <CommandItem
                            key={subject.id}
                            value={subject.nama_mapel}
                            onSelect={() => {
                              setSelectedMapel(subject.id);
                              setOpenMapel(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMapel === subject.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {subject.nama_mapel}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStudent && selectedSemester && (
        <>
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat data...</span>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Siswa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">NIS</p>
                      <p className="font-medium">{selectedStudentData?.nis}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nama</p>
                      <p className="font-medium">{selectedStudentData?.nama}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kelas</p>
                      <p className="font-medium">{selectedStudentData?.kelas}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Semester</p>
                      <p className="font-medium">{selectedSemester}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mata Pelajaran</p>
                      <p className="font-medium">{selectedMapelData?.nama_mapel || "Semua"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabel Nilai Tugas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Tabel Nilai Tugas
                  </CardTitle>
                  <CardDescription>Bobot 40% • Total {assignments?.length || 0} tugas</CardDescription>
                </CardHeader>
                <CardContent>
                  {assignmentsWithSubject.length > 0 ? (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10 md:w-12 text-xs md:text-sm">No</TableHead>
                            <TableHead className="text-xs md:text-sm">Mata Pelajaran</TableHead>
                            <TableHead className="text-xs md:text-sm hidden sm:table-cell">Keterangan</TableHead>
                            <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignmentsWithSubject.map((assignment: any, idx: number) => (
                            <TableRow key={assignment.id}>
                              <TableCell className="font-medium text-xs md:text-sm">{idx + 1}</TableCell>
                              <TableCell className="text-xs md:text-sm">{assignment.subject?.nama_mapel || assignment.nama_mapel || "-"}</TableCell>
                              <TableCell className="text-xs md:text-sm hidden sm:table-cell">{assignment.keterangan || `Tugas ${idx + 1}`}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={getGradeBadge(Number(assignment.nilai))} className="font-semibold text-xs md:text-sm">
                                  {Number(assignment.nilai).toFixed(0)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <span className="font-semibold">Rata-rata Tugas:</span>
                        <Badge className="text-lg px-4 py-1">
                          {avgAssignment.toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Belum ada nilai tugas</p>
                  )}
                </CardContent>
              </Card>

              {/* Tabel Nilai UTS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    Tabel Nilai UTS (Ujian Tengah Semester)
                  </CardTitle>
                  <CardDescription>Bobot 30% • Total {midterms?.length || 0} nilai UTS</CardDescription>
                </CardHeader>
                <CardContent>
                  {midtermsWithSubject.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 md:w-12 text-xs md:text-sm">No</TableHead>
                          <TableHead className="text-xs md:text-sm">Mata Pelajaran</TableHead>
                          <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {midtermsWithSubject.map((midterm: any, idx: number) => (
                          <TableRow key={midterm.id}>
                            <TableCell className="font-medium text-xs md:text-sm">{idx + 1}</TableCell>
                            <TableCell className="text-xs md:text-sm">{midterm.subject?.nama_mapel || midterm.nama_mapel || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getGradeBadge(Number(midterm.nilai))} className="font-semibold text-xs md:text-sm">
                                {Number(midterm.nilai).toFixed(0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Belum ada nilai UTS</p>
                  )}
                </CardContent>
              </Card>

              {/* Tabel Nilai UAS */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-green-500" />
                    Tabel Nilai UAS (Ujian Akhir Semester)
                  </CardTitle>
                  <CardDescription>Bobot 30% • Total {finals?.length || 0} nilai UAS</CardDescription>
                </CardHeader>
                <CardContent>
                  {finalsWithSubject.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10 md:w-12 text-xs md:text-sm">No</TableHead>
                          <TableHead className="text-xs md:text-sm">Mata Pelajaran</TableHead>
                          <TableHead className="text-right text-xs md:text-sm">Nilai</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {finalsWithSubject.map((final: any, idx: number) => (
                          <TableRow key={final.id}>
                            <TableCell className="font-medium text-xs md:text-sm">{idx + 1}</TableCell>
                            <TableCell className="text-xs md:text-sm">{final.subject?.nama_mapel || final.nama_mapel || "-"}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={getGradeBadge(Number(final.nilai))} className="font-semibold text-xs md:text-sm">
                                {Number(final.nilai).toFixed(0)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Belum ada nilai UAS</p>
                  )}
                </CardContent>
              </Card>

              {/* Weighted Average */}
              {weightedAverage !== null && (
                <Card className="bg-gradient-to-r from-primary/10 to-accent/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <GraduationCap className="h-4 w-4 md:h-5 md:w-5" />
                      Nilai Akhir (Weighted Average)
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Rumus: (Rata-rata Tugas × 40%) + (UTS × 30%) + (UAS × 30%)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Nilai Akhir</p>
                        <p className="text-3xl md:text-4xl font-bold text-primary">{weightedAverage.toFixed(2)}</p>
                      </div>
                      <Badge 
                        className="text-base md:text-lg px-4 md:px-6 py-1.5 md:py-2"
                        variant={weightedAverage >= 75 ? "default" : "destructive"}
                      >
                        {weightedAverage >= 75 ? "LULUS" : "TIDAK LULUS"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
