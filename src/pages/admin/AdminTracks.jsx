import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Play, Pause, Upload, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import GradientButton from "../../components/GradientButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const CATEGORIES = ["Corporativo", "Dramático", "Alegre", "Relaxante", "Épico", "Tecnologia", "Outros"];

export default function AdminTracks() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "", category: "Corporativo", audio_url: "", description: "", duration_seconds: "", is_active: true, sort_order: 0
  });

  useEffect(() => { loadTracks(); }, []);

  async function loadTracks() {
    const data = await base44.entities.BackgroundTrack.list("sort_order");
    setTracks(data);
    setLoading(false);
  }

  const openNew = () => {
    setEditingTrack(null);
    setForm({ name: "", category: "Corporativo", audio_url: "", description: "", duration_seconds: "", is_active: true, sort_order: 0 });
    setDialog(true);
  };

  const openEdit = (track) => {
    setEditingTrack(track);
    setForm({
      name: track.name,
      category: track.category || "Corporativo",
      audio_url: track.audio_url || "",
      description: track.description || "",
      duration_seconds: track.duration_seconds || "",
      is_active: track.is_active !== false,
      sort_order: track.sort_order || 0,
    });
    setDialog(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, audio_url: file_url }));
    setUploading(false);
  };

  const saveTrack = async () => {
    const data = {
      name: form.name,
      category: form.category,
      audio_url: form.audio_url,
      description: form.description,
      duration_seconds: form.duration_seconds ? Number(form.duration_seconds) : undefined,
      is_active: form.is_active,
      sort_order: Number(form.sort_order),
    };
    if (editingTrack) {
      await base44.entities.BackgroundTrack.update(editingTrack.id, data);
    } else {
      await base44.entities.BackgroundTrack.create(data);
    }
    setDialog(false);
    setLoading(true);
    await loadTracks();
  };

  const deleteTrack = async (id) => {
    if (!confirm("Excluir esta trilha?")) return;
    await base44.entities.BackgroundTrack.delete(id);
    await loadTracks();
  };

  const togglePlay = (track) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(track.audio_url);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">Trilhas de Fundo</h1>
        <GradientButton size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1 inline" /> Nova Trilha
        </GradientButton>
      </div>

      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlay(track)}
                  className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0"
                >
                  {playingId === track.id
                    ? <Pause className="w-4 h-4 text-white" />
                    : <Play className="w-4 h-4 text-white" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{track.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{track.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${track.is_active !== false ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {track.is_active !== false ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  {track.description && <p className="text-xs text-muted-foreground mt-0.5">{track.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(track)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                  <Edit className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => deleteTrack(track.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {tracks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma trilha cadastrada ainda.</div>
        )}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingTrack ? "Editar Trilha" : "Nova Trilha"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Arquivo de Áudio</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={form.audio_url}
                  onChange={(e) => setForm(f => ({ ...f, audio_url: e.target.value }))}
                  placeholder="URL do áudio ou faça upload"
                  className="bg-muted border-border text-xs"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-semibold whitespace-nowrap"
                >
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploading ? "..." : "Upload"}
                </button>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Input value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="bg-muted border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Duração (seg)</Label>
                <Input type="number" value={form.duration_seconds} onChange={(e) => setForm(f => ({ ...f, duration_seconds: e.target.value }))} className="bg-muted border-border" />
              </div>
              <div>
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: e.target.value }))} className="bg-muted border-border" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Trilha ativa</Label>
            </div>
            <GradientButton onClick={saveTrack} disabled={!form.name || !form.audio_url} className="w-full">Salvar</GradientButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}