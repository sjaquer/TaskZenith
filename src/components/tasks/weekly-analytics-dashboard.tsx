'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';
import type { Category } from '@/lib/types';
import { Book, Briefcase, User, FolderKanban, Clock, PlayCircle, CheckCircle } from 'lucide-react';

const categoryConfig: Record<Category, { label: string; color: string, icon: React.ElementType }> = {
    estudio: { label: 'Estudio', color: 'hsl(var(--chart-1))', icon: Book },
    trabajo: { label: 'Trabajo', color: 'hsl(var(--chart-2))', icon: Briefcase },
    personal: { label: 'Personal', color: 'hsl(var(--chart-3))', icon: User },
    proyectos: { label: 'Proyectos', color: 'hsl(var(--chart-4))', icon: FolderKanban },
};


export function WeeklyAnalyticsDashboard() {
  const { tasks } = useTasks();

  const analyticsData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const tasksThisWeek = tasks.filter(task => {
        const completedAt = task.completedAt ? new Date(task.completedAt) : null;
        return completedAt && completedAt >= weekStart && completedAt <= weekEnd;
    });

    const weeklyCompletionData = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const tasksOnDay = tasksThisWeek.filter(task => format(new Date(task.completedAt!), 'yyyy-MM-dd') === dayStr);
        return {
            date: format(day, 'eee', { locale: es }),
            completed: tasksOnDay.length,
        };
    });

    const categoryDistribution = tasksThisWeek.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
    }, {} as Record<Category, number>);

    const categoryChartData = Object.entries(categoryDistribution).map(([name, value]) => ({
        name: categoryConfig[name as Category].label,
        value,
        fill: categoryConfig[name as Category].color,
    }));
    
    const tasksWithMetrics = tasks.filter(t => t.createdAt && t.completedAt);
    
    const avgTimeToStart = tasksWithMetrics
        .filter(t => t.startedAt)
        .reduce((acc, t) => acc + differenceInHours(new Date(t.startedAt!), new Date(t.createdAt!)), 0) 
        / (tasksWithMetrics.filter(t => t.startedAt).length || 1);

    const avgTimeToComplete = tasksWithMetrics
        .filter(t => t.startedAt)
        .reduce((acc, t) => acc + differenceInHours(new Date(t.completedAt!), new Date(t.startedAt!)), 0)
        / (tasksWithMetrics.filter(t => t.startedAt).length || 1);
        
    return { weeklyCompletionData, categoryChartData, avgTimeToStart, avgTimeToComplete, totalCompleted: tasksThisWeek.length };

  }, [tasks]);

  const barChartConfig = {
    completed: { label: 'Tareas Completadas', color: 'hsl(var(--primary))' },
  };

  const pieChartConfig = {
    ...Object.entries(categoryConfig).reduce((acc, [key, val]) => {
        acc[val.label] = { label: val.label, color: val.color };
        return acc;
    }, {} as any)
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-semibold uppercase tracking-wider">Tareas Completadas esta Semana</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={analyticsData.weeklyCompletionData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis allowDecimals={false}/>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">Tiempo Prom. de Inicio</CardTitle>
                <PlayCircle className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{analyticsData.avgTimeToStart.toFixed(1)} hrs</div>
                <p className="text-xs text-muted-foreground">Desde la creación hasta el inicio.</p>
            </CardContent>
        </Card>
        
        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">Tiempo Prom. de Finalización</CardTitle>
                <Clock className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{analyticsData.avgTimeToComplete.toFixed(1)} hrs</div>
                <p className="text-xs text-muted-foreground">Desde el inicio hasta la finalización.</p>
            </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase">Total Tareas Completadas</CardTitle>
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-bold">{analyticsData.totalCompleted}</div>
                <p className="text-xs text-muted-foreground">En la semana actual.</p>
            </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-card/80 backdrop-blur-sm border-primary/20 shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-semibold uppercase tracking-wider">Distribución por Categoría (Tareas de la Semana)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full flex justify-center">
                <ChartContainer config={pieChartConfig} className="mx-auto aspect-square max-h-[300px]">
                    <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie data={analyticsData.categoryChartData} dataKey="value" nameKey="name" innerRadius={60}>
                       {analyticsData.categoryChartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    </div>
  );
}
