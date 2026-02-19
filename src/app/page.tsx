'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/page-wrapper";
import Image from "next/image";
import { LayoutGrid, Cloud, Palette, Lock, Zap, Users, Play, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useDemo } from "@/contexts/demo-context";
import { useToast } from "@/hooks/use-toast";

export default function WelcomePage() {
    const { enterDemoMode } = useAuth();
    const { enterDemo, startTour } = useDemo();
    const router = useRouter();
    const { toast } = useToast();
    const [isDemoLoading, setIsDemoLoading] = useState(false);

    function handleDemoMode() {
        setIsDemoLoading(true);
        try {
            enterDemoMode();
            enterDemo();
            toast({
                title: '🚀 Modo Demo activado',
                description: 'Explora todas las funcionalidades con datos de ejemplo.',
                className: 'bg-primary text-primary-foreground',
            });
            router.push('/dashboard');
            setTimeout(() => startTour(), 1500);
        } finally {
            setIsDemoLoading(false);
        }
    }
    const features = [
        {
            icon: LayoutGrid,
            title: "Dashboard Adaptativo",
            description: "Grid personalizable de 48 columnas que se adapta a tu pantalla"
        },
        {
            icon: Cloud,
            title: "Sincronización en la Nube",
            description: "Tu configuración guardada en Firestore, accesible desde cualquier dispositivo"
        },
        {
            icon: Palette,
            title: "8 Temas Personalizables",
            description: "Cambia la paleta de colores según tu preferencia"
        },
        {
            icon: Lock,
            title: "Roles y Seguridad",
            description: "Códigos de acceso diferenciados para Admin y Operadores"
        },
        {
            icon: Zap,
            title: "Drag & Drop Avanzado",
            description: "Mueve y redimensiona widgets libremente"
        },
        {
            icon: Users,
            title: "Gestión Colaborativa",
            description: "Ideal para equipos que trabajan juntos"
        }
    ];

    return (
        <PageWrapper>
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                {/* Hero Section */}
                <div className="max-w-6xl w-full text-center mb-16 mt-20">
                    <div className="mb-8 flex items-center justify-center gap-4">
                        <Image 
                            src="/logo.png" 
                            alt="TaskZenith Logo" 
                            width={100} 
                            height={100} 
                            className="animate-pulse" 
                        />
                        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            TaskZenith
                        </h1>
                    </div>
                    
                    <p className="text-xl md:text-3xl font-semibold mb-4">
                        Gestión Corporativa de Tareas
                    </p>
                    <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                        Dashboard personalizable con sincronización en la nube. 
                        Organiza tu equipo con vistas Kanban, calendarios y estadísticas en tiempo real.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Button asChild size="lg" className="text-lg px-8">
                            <Link href="/login">Iniciar Sesión</Link>
                        </Button>
                        <Button asChild variant="secondary" size="lg" className="text-lg px-8">
                            <Link href="/signup">Crear Cuenta</Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 gap-2 border-amber-500/40 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/60 transition-all"
                            onClick={handleDemoMode}
                            disabled={isDemoLoading}
                        >
                            {isDemoLoading ? (
                                <>
                                    <Sparkles className="w-5 h-5 animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Probar Demo
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                        Explora la app con datos de ejemplo y un tour guiado, sin necesidad de crear cuenta
                    </p>
                </div>

                {/* Features Grid */}
                <div className="max-w-6xl w-full mb-20">
                    <h2 className="text-3xl font-bold text-center mb-10">
                        Características Principales
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <Card key={idx} className="border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg">
                                <CardContent className="p-6">
                                    <feature.icon className="w-10 h-10 text-primary mb-4" />
                                    <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <div className="text-center max-w-2xl">
                    <p className="text-sm text-muted-foreground mb-2">
                        Desarrollado con Next.js 15, React 19, TypeScript y Firebase
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                        © 2026 TaskZenith - Gestión colaborativa para equipos productivos
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
}

