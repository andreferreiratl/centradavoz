import { useState, useEffect } from "react";
import { Shield, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const data = await base44.entities.ActivityLog.list("-created_date", 100);
      setLogs(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter(l =>
    l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.details?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold">Logs de Atividade</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 bg-muted border-border w-48" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <div key={log.id} className="glass-card rounded-xl p-3 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold">{log.action}</span>
                  <span className="text-[10px] text-muted-foreground">{log.user_email}</span>
                </div>
                {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                <span className="text-[10px] text-muted-foreground">{moment(log.created_date).format("DD/MM/YY HH:mm:ss")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}