'use server';
/**
 * @fileOverview Generates a daily plan of tasks for the user.
 *
 * - generateDailyPlan - A function that creates a focused task plan for the day.
 * - GenerateDailyPlanInput - The input type for the generateDailyPlan function.
 * - GenerateDailyPlanOutput - The return type for the generateDailyPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateDailyPlanInput, GenerateDailyPlanOutput } from '@/lib/actions';
import { GenerateDailyPlanInputSchema, GenerateDailyPlanOutputSchema } from '@/lib/actions';

export async function generateDailyPlan(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput> {
  return generateDailyPlanFlow(input);
}

const generateDailyPlanPrompt = ai.definePrompt({
  name: 'generateDailyPlanPrompt',
  input: {schema: GenerateDailyPlanInputSchema},
  output: {schema: GenerateDailyPlanOutputSchema},
  prompt: `Eres un coach de productividad personal, positivo y motivador. Tu objetivo es ayudar al usuario a enfocarse y tener un día productivo.
Analiza la lista de tareas pendientes del usuario y crea un plan enfocado para hoy.

Nombre del usuario: {{#if userName}}{{userName}}{{else}}Campeón(a){{/if}}

Lista de tareas pendientes:
{{#each tasks}}
- ID: {{this.id}}, Título: "{{this.title}}", Prioridad: {{this.priority}}, Estado: {{this.status}}, Creada: {{this.createdAt}}{{#if this.projectId}}, ProyectoID: {{this.projectId}}{{/if}}
{{/each}}

Reglas para crear el plan:
1.  **Mensaje Motivador:** Comienza con un mensaje corto, enérgico y personalizado para {{userName_or_default}}. Anímale a tener un gran día.
2.  **Selección de Tareas (3 a 5):** Elige entre 3 y 5 tareas para el plan de hoy. No más. El objetivo es el enfoque, no el agobio.
3.  **Criterios de Selección:** Basa tu elección en una combinación de estos factores, en orden de importancia:
    a.  **Prioridad Alta:** Las tareas de prioridad 'alta' casi siempre deben ser incluidas.
    b.  **Tareas "En Progreso":** Impulsa al usuario a terminar lo que ya empezó. Estas tienen alta precedencia.
    c.  **Antigüedad (Congeladas):** Presta atención a tareas importantes (prioridad media o alta) que han estado 'Pendientes' por mucho tiempo. Ayuda a desatascarlas.
    d.  **Equilibrio:** Intenta ofrecer una mezcla de tareas (si es posible), quizás una tarea grande y un par más pequeñas para generar sensación de logro.
4.  **Justificación Clara:** Para cada tarea sugerida, proporciona una razón breve y convincente de por qué es una buena elección para hoy. (Ej: "Empecemos con esta, es de alta prioridad y te dará un gran impulso.").
5.  **Formato de Salida:** Devuelve el resultado exclusivamente en el formato JSON especificado. No incluyas texto adicional fuera del JSON.
`,
});

const generateDailyPlanFlow = ai.defineFlow(
  {
    name: 'generateDailyPlanFlow',
    inputSchema: GenerateDailyPlanInputSchema,
    outputSchema: GenerateDailyPlanOutputSchema,
  },
  async input => {
    const {output} = await generateDailyPlanPrompt(input);
    return output!;
  }
);
