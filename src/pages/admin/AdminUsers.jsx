import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, RotateCcw, Shield, UserCheck, UserX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../../components/StatusBadge";
import GradientButton from "../../components/GradientButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [u, s, p] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.Subscription.list("-created_date"),
      base44.entities.Plan.list(),
    ]);
    setUsers(u);
    setSubscriptions(s);
    setPlans(p);
    setLoading(false);
  }

  const getUserSub = (email) => subscriptions.find(s => s.user_email === email && s.status === "active");

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user) => {
    const sub = getUserSub(user.email);
    setEditForm({
      user_email: user.email,
      user_name: user.full_name,
      plan_id: sub?.plan_id || "",
      status: sub?.status || "expired",
      character_limit: sub?.character_limit || 0,
      characters_used: sub?.characters_used || 0,
      expiration_date: sub?.expiration_date?.split("T")[0] || "",
      sub_id: sub?.id || null,
    });
    setEditDialog(user);
  };

  const saveUser = async () => {
    const selectedPlan = plans.find(p => p.id === editForm.plan_id);
    
    if (editForm.sub_id) {
      await base44.entities.Subscription.update(editForm.sub_id, {
        plan_id: editForm.plan_id,
        plan_name: selectedPlan?.name || "",
        status: editForm.status,
        character_limit: Number(editForm.character_limit),
        characters_used: Number(editForm.characters_used),
        expiration_date: editForm.expiration_date ? new Date(editForm.expiration_date).toISOString() : undefined,
      });
    } else if (editForm.plan_id) {
      await base44.entities.Subscription.create({
        user_email: editForm.user_email,
        user_name: editForm.user_name,
        plan_id: editForm.plan_id,
        plan_name: selectedPlan?.name || "",
        status: editForm.status,
        character_limit: Number(editForm.character_limit) || selectedPlan?.character_limit || 0,
        characters_used: 0,
        start_date: new Date().toISOString(),
        expiration_date: editForm.expiration_date ? new Date(editForm.expiration_date).toISOString() : undefined,
        price_paid: selectedPlan?.price || 0,
      });
    }

    await base44.entities.ActivityLog.create({
      user_email: "admin",
      action: "user_updated",
      details: `Atualizou dados de ${editForm.user_email}`,
      entity_type: "User",
    });

    setEditDialog(null);
    setLoading(true);
    await loadData();
  };

  const resetUsage = async (email) => {
    const sub = getUserSub(email);
    if (sub) {
      await base44.entities.Subscription.update(sub.id, { characters_used: 0 });
      setLoading(true);
      await loadData();
    }
  };

  const toggleBlock = async (email) => {
    const sub = subscriptions.find(s => s.user_email === email);
    if (sub) {
      const newStatus = sub.status === "blocked" ? "active" : "blocked";
      await base44.entities.Subscription.update(sub.id, { status: newStatus });
      setLoading(true);
      await loadData();
    }
  };

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
        <h1 className="font-heading text-2xl font-bold">Usuários</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 bg-muted border-border w-48"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filteredUsers.map((user) => {
          const sub = getUserSub(user.email);
          const anySub = subscriptions.find(s => s.user_email === user.email);
          return (
            <div key={user.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(user.full_name || "U")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{user.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={anySub?.status || "expired"} />
                  <span className="text-xs text-muted-foreground">{sub?.plan_name || "Sem plano"}</span>
                </div>
              </div>
              {anySub && (
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Limite: {anySub.character_limit?.toLocaleString()}</span>
                  <span>Usado: {(anySub.characters_used || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <button onClick={() => openEdit(user)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Edit className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => resetUsage(user.email)} className="text-xs text-secondary hover:underline flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" /> Resetar uso
                </button>
                <button onClick={() => toggleBlock(user.email)} className="text-xs text-yellow-400 hover:underline flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {anySub?.status === "blocked" ? "Desbloquear" : "Bloquear"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Plano</Label>
              <Select value={editForm.plan_id} onValueChange={(v) => {
                const plan = plans.find(p => p.id === v);
                setEditForm(f => ({ ...f, plan_id: v, character_limit: plan?.character_limit || f.character_limit }));
              }}>
                <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Selecione um plano" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Vencido</SelectItem>
                  <SelectItem value="blocked">Bloqueado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Limite de Caracteres</Label>
              <Input type="number" value={editForm.character_limit} onChange={(e) => setEditForm(f => ({ ...f, character_limit: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs">Caracteres Utilizados</Label>
              <Input type="number" value={editForm.characters_used} onChange={(e) => setEditForm(f => ({ ...f, characters_used: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs">Data de Expiração</Label>
              <Input type="date" value={editForm.expiration_date} onChange={(e) => setEditForm(f => ({ ...f, expiration_date: e.target.value }))} className="bg-muted border-border" />
            </div>
            <GradientButton onClick={saveUser} className="w-full">Salvar</GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}