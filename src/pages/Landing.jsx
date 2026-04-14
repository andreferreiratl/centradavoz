import { Link } from "react-router-dom";
import { Zap, ArrowRight, Mic, Clock } from "lucide-react";
import Logo from "../components/Logo";
import { motion } from "framer-motion";
import GradientButton from "../components/GradientButton";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo />
          <Link to="/dashboard">
            <GradientButton size="sm">Entrar</GradientButton>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div className="text-center max-w-2xl mx-auto" {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Mic className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Mais de 60 locutores</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-4 tracking-tight">
              Transforme textos em{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6C3BFF] to-[#00E0FF]">Locuções Profissionais

              </span>{" "}
              de alta qualidade
            </h1>
            
            <p className="text-muted-foreground text-lg md:text-xl mb-8 leading-relaxed">Crie narrações para vídeos e spots comerciais em segundos

            </p>
            
            <Link to="/dashboard">
              <GradientButton size="lg" className="group">
                Começar agora
                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </motion.div>

          <motion.div
            className="mt-12 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}>
            
            <img
              src="https://media.base44.com/images/public/69da50375cc9660ed0fab63a/4053f24be_generated_c4ce27f7.png"
              alt="VozPro AI - Visualização de áudio gerado por inteligência artificial"
              className="w-full rounded-2xl glow-primary" />
            
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>
            
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Por que Central da Voz?</h2>
            <p className="text-muted-foreground">Tecnologia de ponta para vozes realistas e profissionais</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
            {
              icon: Mic,
              title: "Vozes Profissionais",
              description: "Vozes naturais e profissionais, prontas para vídeos, anúncios e redes sociais"
            },
            {
              icon: Zap,
              title: "Personalização Total",
              description: "Defina o tom, ritmo e emoção da sua locução com facilidade antes de gerar o áudio"
            },
            {
              icon: Clock,
              title: "Rápido e Fácil",
              description: "Gere áudios profissionais em segundos. Sem necessidade de estúdio ou equipamentos"
            }].
            map((benefit, i) =>
            <motion.div
              key={i}
              className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}>
              
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>
            
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Como funciona</h2>
            <p className="text-muted-foreground">Três passos para áudios perfeitos</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
            { step: "01", title: "Defina o Estilo", desc: "Escolha o tom, ritmo e emoção da sua locução de forma simples" },
            { step: "02", title: "Escreva o Texto", desc: "Insira o texto que deseja transformar em áudio profissional" },
            { step: "03", title: "Gere e Baixe", desc: "Clique em gerar e faça download do áudio pronto para uso" }].
            map((item, i) =>
            <motion.div
              key={i}
              className="relative text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}>
              
                <div className="text-5xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6C3BFF] to-[#00E0FF] mb-3">
                  {item.step}
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <motion.div
          className="max-w-2xl mx-auto text-center glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}>
          
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative z-10">
            <Zap className="w-10 h-10 text-secondary mx-auto mb-4" />
            <h2 className="font-heading text-3xl font-bold mb-3">Pronto para começar?</h2>
            <p className="text-muted-foreground mb-6">Crie sua conta e comece a gerar áudios profissionais hoje</p>
            <Link to="/dashboard">
              <GradientButton size="lg">
                Criar minha conta
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </GradientButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-xs text-muted-foreground">© 2026 Central da Voz. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>);

}