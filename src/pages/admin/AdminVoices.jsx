import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Play, Pause, Mic, Edit2, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import GradientButton from "../../components/GradientButton";

const emptyForm = { name: "", voice_id: "", preview_url: "", gender: "feminina", style: "", description: "", language: "pt-BR", is_active: true, sort_order: 0 };

export default function AdminVoices() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.ElevenLabsVoice.list("sort_order");
    setVoices(data);
    setLoading(false);
  }

  async function save() {
    if (editId) {
      await base44.entities.ElevenLabsVoice.update(editId, form);
    } else {
      await base44.entities.ElevenLabsVoice.create(form);
    }
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    load();
  }

  async function remove(id) {
    if (!confirm("Remover esta voz?")) return;
    await base44.entities.ElevenLabsVoice.delete(id);
    load();
  }

  function startEdit(voice) {
    setForm({ name: voice.name, voice_id: voice.voice_id, preview_url: voice.preview_url || "", gender: voice.gender || "feminina", style: voice.style || "", description: voice.description || "", language: voice.language || "pt-BR", is_active: voice.is_active ?? true, sort_order: voice.sort_order || 0 });
    setEditId(voice.id);
    setShowForm(true);
  }

  function togglePlay(voice) {
    if (playingId === voice.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(voice.preview_url);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingId(null);
      setPlayingId(voice.id);
    }
  }

  const genderLabels = { masculina: "♂ Masculina", feminina: "♀ Feminina", neutro: "⊙ Neutro" };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vozes ElevenLabs</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie as vozes disponíveis na plataforma</p>
        </div>
        <GradientButton onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2 inline" /> Nova Voz
        </GradientButton>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-lg">{editId ? "Editar Voz" : "Nova Voz"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "name", label: "Nome da Voz", placeholder: "Ex: Sofia - Feminina Suave" },
                { key: "voice_id", label: "Voice ID (ElevenLabs)", placeholder: "Ex: EXAVITQu4vr4xnSDxMaL" },
                { key: "preview_url", label: "URL de Preview", placeholder: "https://..." },
                { key: "style", label: "Estilo", placeholder: "Ex: Comercial, Narrativo, Podcast..." },
                { key: "description", label: "Descrição", placeholder: "Breve descrição da voz" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Gênero</label>
                  <select value={form.gender} onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="feminina">Feminina</option>
                    <option value="masculina">Masculina</option>
                    <option value="neutro">Neutro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Ordem</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(prev => ({ ...prev, sort_order: Number(e.target.value) }))} className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm">Voz ativa</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <GradientButton onClick={save} className="flex-1"><Check className="w-4 h-4 mr-1 inline" /> Salvar</GradientButton>
              <GradientButton variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancelar</GradientButton>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : voices.length === 0 ? (
        <div className="text-center py-16">
          <Mic className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma voz cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1">Adicione vozes do ElevenLabs para os usuários escolherem</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {voices.map(voice => (
            <div key={voice.id} className={cn("glass-card rounded-2xl p-4 flex items-center gap-4", !voice.is_active && "opacity-50")}>
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-sm">{voice.name}</p>
                  {!voice.is_active && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inativa</span>}
                </div>
                <p className="text-xs text-muted-foreground">{genderLabels[voice.gender]} • {voice.style || "—"}</p>
                <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5 truncate">ID: {voice.voice_id}</p>
              </div>
              <div className="flex items-center gap-2">
                {voice.preview_url && (
                  <button onClick={() => togglePlay(voice)} className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-all", playingId === voice.id ? "bg-secondary/20 text-secondary" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {playingId === voice.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
                <button onClick={() => startEdit(voice)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(voice.id)} className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}