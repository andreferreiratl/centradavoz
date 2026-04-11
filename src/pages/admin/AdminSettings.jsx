import { useState, useEffect } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GradientButton from "../../components/GradientButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminSettings() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConfigs(); }, []);

  async function loadConfigs() {
    const data = await base44.entities.SystemConfig.list();
    
    // Create defaults if none exist
    if (data.length === 0) {
      const defaults = [
        { key: "voice_api_url", value: "", description: "URL da API de voz (TTS)" },
        { key: "voice_api_key", value: "", description: "Chave da API de voz" },
        { key: "ai_api_url", value: "", description: "URL da API de IA" },
        { key: "ai_api_key", value: "", description: "Chave da API de IA" },
        { key: "whatsapp_number", value: "", description: "Número do WhatsApp para suporte" },
        { key: "system_message", value: "Bem-vindo ao VozPro AI!", description: "Mensagem do sistema" },
      ];
      const created = await base44.entities.SystemConfig.bulkCreate(defaults);
      setConfigs(created);
    } else {
      setConfigs(data);
    }
    setLoading(false);
  }

  const updateConfig = (id, field, value) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveAll = async () => {
    for (const config of configs) {
      await base44.entities.SystemConfig.update(config.id, {
        key: config.key,
        value: config.value,
        description: config.description,
      });
    }
    toast.success("Configurações salvas com sucesso!");
  };

  const addConfig = async () => {
    const newConfig = await base44.entities.SystemConfig.create({
      key: "nova_config",
      value: "",
      description: "Nova configuração",
    });
    setConfigs(prev => [...prev, newConfig]);
  };

  const deleteConfig = async (id) => {
    await base44.entities.SystemConfig.delete(id);
    setConfigs(prev => prev.filter(c => c.id !== id));
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
        <h1 className="font-heading text-2xl font-bold">Configurações</h1>
        <div className="flex gap-2">
          <GradientButton size="sm" variant="secondary" onClick={addConfig}>
            <Plus className="w-4 h-4 mr-1 inline" /> Adicionar
          </GradientButton>
          <GradientButton size="sm" onClick={saveAll}>
            <Save className="w-4 h-4 mr-1 inline" /> Salvar
          </GradientButton>
        </div>
      </div>

      <div className="space-y-3">
        {configs.map((config) => (
          <div key={config.id} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Chave</Label>
                    <Input
                      value={config.key}
                      onChange={(e) => updateConfig(config.id, "key", e.target.value)}
                      className="bg-muted border-border text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <Input
                      value={config.description || ""}
                      onChange={(e) => updateConfig(config.id, "description", e.target.value)}
                      className="bg-muted border-border text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Valor</Label>
                  <Input
                    value={config.value}
                    onChange={(e) => updateConfig(config.id, "value", e.target.value)}
                    className="bg-muted border-border text-sm"
                    type={config.key?.includes("key") || config.key?.includes("secret") ? "password" : "text"}
                  />
                </div>
              </div>
              <button onClick={() => deleteConfig(config.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors flex-shrink-0 mt-5">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}