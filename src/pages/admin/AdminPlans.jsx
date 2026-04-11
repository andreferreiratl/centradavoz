import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GradientButton from "../../components/GradientButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form, setForm] = useState({
    name: "", price: "", character_limit: "", duration_days: "30",
    duration_label: "mensal", benefits: "", is_active: true, sort_order: 0,
  });

  useEffect(() => { loadPlans(); }, []);

  async function loadPlans() {
    const data = await base44.entities.Plan.list("sort_order");
    setPlans(data);
    setLoading(false);
  }

  const openNew = () => {
    setEditingPlan(null);
    setForm({ name: "", price: "", character_limit: "", duration_days: "30", duration_label: "mensal", benefits: "", is_active: true, sort_order: 0 });
    setDialog(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      price: plan.price,
      character_limit: plan.character_limit,
      duration_days: plan.duration_days,
      duration_label: plan.duration_label || "mensal",
      benefits: (plan.benefits || []).join("\n"),
      is_active: plan.is_active !== false,
      sort_order: plan.sort_order || 0,
    });
    setDialog(true);
  };

  const savePlan = async () => {
    const data = {
      name: form.name,
      price: Number(form.price),
      character_limit: Number(form.character_limit),
      duration_days: Number(form.duration_days),
      duration_label: form.duration_label,
      benefits: form.benefits.split("\n").filter(b => b.trim()),
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };

    if (editingPlan) {
      await base44.entities.Plan.update(editingPlan.id, data);
    } else {
      await base44.entities.Plan.create(data);
    }

    setDialog(false);
    setLoading(true);
    await loadPlans();
  };

  const deletePlan = async (id) => {
    if (!confirm("Excluir este plano?")) return;
    await base44.entities.Plan.delete(id);
    setLoading(true);
    await loadPlans();
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Planos</h1>
        <GradientButton size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1 inline" /> Novo Plano
        </GradientButton>
      </div>

      <div className="space-y-3">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-semibold">{plan.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${plan.is_active !== false ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {plan.is_active !== false ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                  <span>R${plan.price?.toFixed(2)}</span>
                  <span>{plan.character_limit?.toLocaleString()} chars</span>
                  <span>{plan.duration_days} dias</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(plan)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Edit className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => deletePlan(plan.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
            {plan.benefits?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {plan.benefits.map((b, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{b}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Preço (R$)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs">Limite Caracteres</Label>
                <Input type="number" value={form.character_limit} onChange={(e) => setForm(f => ({ ...f, character_limit: e.target.value }))} className="bg-muted border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Duração (dias)</Label>
                <Input type="number" value={form.duration_days} onChange={(e) => setForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs">Rótulo</Label>
                <Select value={form.duration_label} onValueChange={(v) => setForm(f => ({ ...f, duration_label: v }))}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Benefícios (um por linha)</Label>
              <textarea
                value={form.benefits}
                onChange={(e) => setForm(f => ({ ...f, benefits: e.target.value }))}
                className="w-full bg-muted border border-border rounded-lg p-2 text-sm min-h-[80px] outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Plano ativo</Label>
            </div>
            <div>
              <Label className="text-xs">Ordem</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))} className="bg-muted border-border" />
            </div>
            <GradientButton onClick={savePlan} className="w-full">Salvar</GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}