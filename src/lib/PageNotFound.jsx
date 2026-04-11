import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';


export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-heading font-light text-muted-foreground/30">404</h1>
                        <div className="h-0.5 w-16 gradient-primary mx-auto"></div>
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="text-2xl font-heading font-medium text-foreground">
                            Página não encontrada
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            A página <span className="font-medium text-foreground">"{pageName}"</span> não foi encontrada.
                        </p>
                    </div>
                    
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 glass-card rounded-lg">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-foreground">Nota Admin</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Esta página ainda não foi implementada.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="pt-6">
                        <button 
                            onClick={() => window.location.href = '/'} 
                            className="inline-flex items-center px-6 py-3 text-sm font-heading font-semibold text-white gradient-primary rounded-xl glow-primary transition-all duration-200 hover:opacity-90 active:scale-95"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}