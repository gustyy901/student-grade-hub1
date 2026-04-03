import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ClipboardList, TrendingUp, Award, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardAPI.getStats,
  });

  const students = stats?.students || [];
  const assignments = stats?.assignments || [];
  const midterms = stats?.midterms || [];
  const finals = stats?.finals || [];

  const avgAssignment = stats?.avgAssignments || 0;
  const avgMidterm = stats?.avgMidterms || 0;
  const avgFinal = stats?.avgFinals || 0;

  const chartData = [
    { name: "Tugas", nilai: Number(avgAssignment) || 0 },
    { name: "UTS", nilai: Number(avgMidterm) || 0 },
    { name: "UAS", nilai: Number(avgFinal) || 0 },
  ];

  // Grade distribution data (A, B, C, D)
  const gradeDistributionData = useMemo(() => {
    if (!students || !assignments || !midterms || !finals) return [];

    const gradeCount = { A: 0, B: 0, C: 0, D: 0 };

    students.forEach((student: any) => {
      const studentAssignments = assignments.filter((a: any) => a.student_id === student.id);
      const studentMidterms = midterms.filter((m: any) => m.student_id === student.id);
      const studentFinals = finals.filter((f: any) => f.student_id === student.id);

      const avgTugas = studentAssignments.length > 0
        ? studentAssignments.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / studentAssignments.length
        : 0;
      const avgUTS = studentMidterms.length > 0
        ? studentMidterms.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / studentMidterms.length
        : 0;
      const avgUAS = studentFinals.length > 0
        ? studentFinals.reduce((acc: number, curr: any) => acc + Number(curr.nilai), 0) / studentFinals.length
        : 0;

      const nilaiAkhir = (avgTugas * 0.4) + (avgUTS * 0.3) + (avgUAS * 0.3);

      if (nilaiAkhir >= 80) gradeCount.A++;
      else if (nilaiAkhir >= 70) gradeCount.B++;
      else if (nilaiAkhir >= 60) gradeCount.C++;
      else if (nilaiAkhir > 0) gradeCount.D++;
    });

    return [
      { grade: "A", jumlah: gradeCount.A, range: "80-100" },
      { grade: "B", jumlah: gradeCount.B, range: "70-79" },
      { grade: "C", jumlah: gradeCount.C, range: "60-69" },
      { grade: "D", jumlah: gradeCount.D, range: "<60" },
    ];
  }, [students, assignments, midterms, finals]);

  const statCards = [
    {
      title: "Total Siswa",
      value: stats?.totalStudents || 0,
      subtitle: "siswa terdaftar",
      icon: Users,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-500/10 to-blue-600/10",
    },
    {
      title: "Rata-rata Tugas",
      value: Number(avgAssignment).toFixed(1),
      subtitle: `dari ${assignments?.length || 0} nilai`,
      icon: ClipboardList,
      gradient: "from-emerald-500 to-emerald-600",
      bgGradient: "from-emerald-500/10 to-emerald-600/10",
    },
    {
      title: "Rata-rata UTS",
      value: Number(avgMidterm).toFixed(1),
      subtitle: `dari ${midterms?.length || 0} nilai`,
      icon: TrendingUp,
      gradient: "from-amber-500 to-orange-500",
      bgGradient: "from-amber-500/10 to-orange-500/10",
    },
    {
      title: "Rata-rata UAS",
      value: Number(avgFinal).toFixed(1),
      subtitle: `dari ${finals?.length || 0} nilai`,
      icon: Award,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="page-title">Dashboard</h2>
        </div>
        <p className="page-description">Ringkasan data dan analisis nilai siswa</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="group relative overflow-hidden rounded-2xl bg-card p-5 md:p-6 shadow-card border border-border/50 transition-all duration-500 hover:shadow-xl hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </div>

            {/* Decorative circle */}
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Grade Distribution Chart */}
        <Card className="chart-card border-0 shadow-card hover:shadow-xl transition-all duration-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/10">
                <Award className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-bold">Distribusi Nilai Akhir</CardTitle>
                <CardDescription className="text-sm">Jumlah siswa berdasarkan grade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {gradeDistributionData.some(d => d.jumlah > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gradeDistributionData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradeA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="gradeB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="gradeC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#eab308" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#ca8a04" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="gradeD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis 
                    dataKey="grade" 
                    tick={{ fontSize: 13, fontWeight: 600, fill: 'hsl(var(--foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} siswa`, "Jumlah"]} 
                    labelFormatter={(label) => `Grade ${label}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="jumlah" name="Jumlah Siswa" radius={[12, 12, 0, 0]}>
                    {gradeDistributionData.map((entry, index) => {
                      const gradients = ["url(#gradeA)", "url(#gradeB)", "url(#gradeC)", "url(#gradeD)"];
                      return <Cell key={`cell-${index}`} fill={gradients[index]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Award className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">Belum ada data nilai</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average per Category Chart */}
        <Card className="chart-card border-0 shadow-card hover:shadow-xl transition-all duration-500">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg md:text-xl font-bold">Rata-rata per Kategori</CardTitle>
                <CardDescription className="text-sm">Perbandingan nilai tugas, UTS, dan UAS</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="hsl(262 83% 58%)" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 13, fontWeight: 500, fill: 'hsl(var(--foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} 
                />
                <Bar 
                  dataKey="nilai" 
                  name="Nilai Rata-rata"
                  fill="url(#barGradient)" 
                  radius={[12, 12, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
