'use client';
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakCard() {
    const { streak } = useAuth();
    
    const streakMessages: {[key: number]: string} = {
        0: "¡Completa una tarea hoy para empezar!",
        1: "¡Racha de 1 día! ¡Sigue así!",
        3: "¡3 días seguidos! Esto se pone serio.",
        7: "¡Una semana completa! Eres imparable.",
        14: "¡Dos semanas! La constancia es tu superpoder.",
        30: "¡Un mes de racha! Eres una leyenda."
    }

    const getStreakMessage = () => {
        if (streak > 0 && streakMessages[streak]) {
            return streakMessages[streak];
        }
        if (streak > 0) {
            return `¡Racha de ${streak} días! Sigue así.`;
        }
        return streakMessages[0];
    }
    
    return (
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">RACHA ACTUAL</CardTitle>
                <Flame className={cn("w-5 h-5", streak > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold text-accent">{streak} <span className="text-2xl text-muted-foreground">día(s)</span></div>
                <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
            </CardContent>
        </Card>
    )
}
