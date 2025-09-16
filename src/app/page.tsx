'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageWrapper } from "@/components/layout/page-wrapper";
import Image from "next/image";

export default function WelcomePage() {
    return (
        <PageWrapper>
            <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gradient-to-b from-background to-blue-950/20">
                <div className="mb-8 flex items-center gap-4">
                    <Image src="/logo.png" alt="TaskZenith Logo" width={80} height={80} className="animate-pulse" />
                    <h1 className="text-5xl md:text-7xl font-bold text-primary">TaskZenith</h1>
                </div>
                <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl">
                    Alcanza la calma y la productividad, una tarea a la vez. Tu asistente inteligente para organizar tu vida.
                </p>
                <div className="flex gap-4">
                    <Button asChild size="lg">
                        <Link href="/login">Iniciar Sesión</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg">
                        <Link href="/signup">Crear Cuenta</Link>
                    </Button>
                </div>
                <p className="mt-12 text-sm text-muted-foreground">
                    Impulsado por IA para una gestión de tareas más inteligente.
                </p>
            </div>
        </PageWrapper>
    );
}
