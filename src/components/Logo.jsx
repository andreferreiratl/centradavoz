import { AudioLines } from "lucide-react";
import { Link } from "react-router-dom";

export default function Logo({ size = "default" }) {
  const isSmall = size === "sm";
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <div className={`${isSmall ? "w-7 h-7" : "w-9 h-9"} rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 glow-primary`}>
        <AudioLines className={`${isSmall ? "w-3.5 h-3.5" : "w-5 h-5"} text-white`} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-heading font-bold ${isSmall ? "text-sm" : "text-base"}`}>
          Central da <span className="text-secondary">Voz</span>
        </span>
        <span className={`${isSmall ? "text-[8px]" : "text-[10px]"} text-muted-foreground font-medium tracking-wide uppercase`}>
          Plataforma de Locução Online
        </span>
      </div>
    </Link>
  );
}