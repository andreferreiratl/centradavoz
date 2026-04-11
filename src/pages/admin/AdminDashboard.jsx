import { useState, useEffect } from "react";
import { Users, AudioLines, FileText, DollarSign, UserCheck, UserX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatCard from "../../components/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalAudios: 0,
    totalChars: 0,
    estimatedRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [users, subs, audios] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Subscription.list(),
        base44.entities.AudioRecord.list(),
      ]);

      const activeSubs = subs.filter(s => s.status === "active");
      const expiredSubs = subs.filter(s => s.status === "expired" || s.status === "cancelled");
      const totalChars = subs.reduce((sum, s) => sum + (s.characters_used || 0), 0);
      const revenue = subs.reduce((sum, s) => sum + (s.price_paid || 0), 0);

      setStats({
        totalUsers: users.length,
        activeUsers: activeSubs.length,
        expiredUsers: expiredSubs.length,
        totalAudios: audios.length,
        totalChars,
        estimatedRevenue: revenue,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  // Mock chart data
  const growthData = [
    { name: "Jan", users: 4 }, { name: "Fev", users: 8 }, { name: "Mar", users: 15 },
    { name: "Abr", users: 22 }, { name: "Mai", users: 30 }, { name: "Jun", users: 42 },
  ];
  const usageData = [
    { name: "Seg", audios: 12 }, { name: "Ter", audios: 19 }, { name: "Qua", audios: 8 },
    { name: "Qui", audios: 25 }, { name: "Sex", audios: 32 }, { name: "Sáb", audios: 14 }, { name: "Dom", audios: 9 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Users} label="Total Usuários" value={stats.totalUsers} />
        <StatCard icon={UserCheck} label="Ativos" value={stats.activeUsers} glowColor="secondary" />
        <StatCard icon={UserX} label="Vencidos" value={stats.expiredUsers} />
        <StatCard icon={AudioLines} label="Áudios Gerados" value={stats.totalAudios} glowColor="secondary" />
        <StatCard icon={FileText} label="Caracteres Usados" value={stats.totalChars.toLocaleString()} />
        <StatCard icon={DollarSign} label="Receita" value={`R$${stats.estimatedRevenue.toFixed(2)}`} glowColor="secondary" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-heading font-semibold text-sm mb-4">Crescimento de Usuários</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C3BFF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6C3BFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#A5A5C2', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#A5A5C2', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(108,59,255,0.2)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="users" stroke="#6C3BFF" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-heading font-semibold text-sm mb-4">Uso da Plataforma</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#A5A5C2', fontSize: 11 }} axisLine={false} />
              <YAxis tick={{ fill: '#A5A5C2', fontSize: 11 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(0,224,255,0.2)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="audios" fill="#00E0FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}