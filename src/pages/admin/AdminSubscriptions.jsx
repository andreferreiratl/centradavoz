import { useState, useEffect } from "react";
import { RefreshCw, XCircle, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../../components/StatusBadge";
import GradientButton from "../../components/GradientButton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import moment from "moment";

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadSubs(); }, []);

  async function loadSubs() {
    const data = await base44.entities.Subscription.list("-created_date");
    setSubs(data);
    setLoading(false);
  }

  const renewSub = async (sub) => {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    await base44.entities.Subscription.update(sub.id, {
      status: "active",
      expiration_date: newExpiry.toISOString(),
      characters_used: 0,
    });
    setLoading(true);
    await loadSubs();
  };

  const cancelSub = async (sub) => {
    await base44.entities.Subscription.update(sub.id, { status: "cancelled" });
    setLoading(true);
    await loadSubs();
  };

  const filtered = subs.filter(s =>
    s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const activeSubs = filtered.filter(s => s.status === "active");
  const inactiveSubs = filtered.filter(s => s.status !== "active");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const SubCard = ({ sub }) => (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm font-semibold">{sub.user_name || sub.user_email}</p>
          <p className="text-xs text-muted-foreground">{sub.user_email}</p>
        </div>
        <StatusBadge status={sub.status} />
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
        <span>Plano: {sub.plan_name || "—"}</span>
        <span>Limite: {sub.character_limit?.toLocaleString()}</span>
        <span>Usado: {(sub.characters_used || 0).toLocaleString()}</span>
        <span>Expira: {sub.expiration_date ? moment(sub.expiration_date).format("DD/MM/YYYY") : "—"}</span>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => renewSub(sub)} className="text-xs text-secondary hover:underline flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Renovar
        </button>
        {sub.status === "active" && (
          <button onClick={() => cancelSub(sub)} className="text-xs text-destructive hover:underline flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Cancelar
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-heading text-2xl font-bold">Assinaturas</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 bg-muted border-border w-48" />
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-muted mb-4">
          <TabsTrigger value="active">Ativas ({activeSubs.length})</TabsTrigger>
          <TabsTrigger value="inactive">Vencidas/Canceladas ({inactiveSubs.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="space-y-2">
            {activeSubs.map(sub => <SubCard key={sub.id} sub={sub} />)}
            {activeSubs.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma assinatura ativa</p>}
          </div>
        </TabsContent>
        <TabsContent value="inactive">
          <div className="space-y-2">
            {inactiveSubs.map(sub => <SubCard key={sub.id} sub={sub} />)}
            {inactiveSubs.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma assinatura inativa</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}