import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AudioLines, Calendar, Download, Mic } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatusBadge from "../components/StatusBadge";
import moment from "moment";

export default function Library() {
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const user = await base44.auth.me();
      const records = await base44.entities.AudioRecord.filter(
        { user_email: user.email },
        "-created_date"
      );
      setAudios(records);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-heading text-xl font-bold">Biblioteca</h1>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {audios.length} áudios
        </span>
      </div>

      {audios.length === 0 ? (
        <div className="text-center py-16">
          <AudioLines className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum áudio gerado ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Seus áudios aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {audios.map((audio) => (
            <div key={audio.id} className="glass-card rounded-2xl p-4 transition-all hover:border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 mb-1">{audio.text}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {moment(audio.created_date).format("DD/MM/YYYY HH:mm")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {audio.character_count} caracteres
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {audio.voice_gender}
                    </span>
                    <StatusBadge status={audio.status} />
                  </div>
                </div>
                {audio.audio_url && (
                  <a
                    href={audio.audio_url}
                    download
                    className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 text-secondary" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}