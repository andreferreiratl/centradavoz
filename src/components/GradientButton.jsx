import { cn } from "@/lib/utils";

export default function GradientButton({ children, className, disabled, onClick, size = "default", variant = "primary", ...props }) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    default: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantClasses = {
    primary: "gradient-primary hover:gradient-primary-hover text-white glow-primary",
    secondary: "bg-muted hover:bg-muted/80 text-foreground border border-border",
    ghost: "bg-transparent hover:bg-muted text-foreground",
  };

  return (
    <button
      className={cn(
        "font-heading font-semibold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}