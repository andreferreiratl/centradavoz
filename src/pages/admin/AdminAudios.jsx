import { useState, useEffect } from "react";
import { Search, Trash2, AudioLines } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../../components/StatusBadge";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function AdminAudios() {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadAudios(); }, []);

  async function loadAudios() {
    const data = await base44.entities.AudioRecord.list("-created_date");
    setAudios(data);
    setLoading(false);
  }

  const deleteAudio = async (id) => {
    if (!confirm("Excluir este áudio?")) return;
    await base44.entities.AudioRecord.delete(id);
    setAudios(prev => prev.filter(a => a.id !== id));
  };

  const filtered = audios.filter(a =>
    a.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    a.text?.toLowerCase().includes(search.toLowerCase())
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
        <h1 className="font-heading text-2xl font-bold">Áudios</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuário..." className="pl-9 bg-muted border-border w-48" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AudioLines className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum áudio encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((audio) => (
            <div key={audio.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-2">{audio.text}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground">{audio.user_email}</span>
                    <span className="text-[10px] text-muted-foreground">{audio.character_count} chars</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{audio.voice_gender}</span>
                    <span className="text-[10px] text-muted-foreground">{moment(audio.created_date).format("DD/MM/YY HH:mm")}</span>
                    <StatusBadge status={audio.status} />
                  </div>
                </div>
                <button onClick={() => deleteAudio(audio.id)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}