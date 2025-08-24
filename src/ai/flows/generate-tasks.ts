'use server';
/**
 * @fileOverview Generates tasks based on a given activity description.
 *
 * - generateTasks - A function that generates a list of tasks based on an activity description.
 * - GenerateTasksInput - The input type for the generateTasks function.
 * - GenerateTasksOutput - The return type for the generateTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTasksInputSchema = z.object({
  activityDescription: z
    .string()
    .describe('Una descripción de la actividad para la cual se deben generar tareas.'),
  numberOfTasks: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('El número de tareas a generar.'),
  projectContext: z.object({
    name: z.string(),
    description: z.string().optional(),
    existingTasks: z.array(z.string()),
  }).optional().describe('El contexto del proyecto para el cual se generan las tareas.'),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;

const GenerateTasksOutputSchema = z.object({
  tasks: z.array(
    z.string().describe('Una tarea generada basada en la descripción de la actividad.')
  ).describe('La lista de tareas generada.')
});
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFlow(input);
}

const generateTasksPrompt = ai.definePrompt({
  name: 'generateTasksPrompt',
  input: {schema: GenerateTasksInputSchema},
  output: {schema: GenerateTasksOutputSchema},
  prompt: `Eres un útil generador de tareas. Dada una descripción de la actividad, generarás una lista de tareas necesarias para completar la actividad.

Descripción de la actividad: {{{activityDescription}}}
{{#if projectContext}}
Estás generando tareas para el proyecto: **{{projectContext.name}}**.
{{#if projectContext.description}}
Descripción del proyecto: {{projectContext.description}}
{{/if}}
{{#if projectContext.existingTasks.length}}
Tareas existentes en este proyecto que puedes usar como referencia de estilo y alcance (evita generar duplicados):
{{#each projectContext.existingTasks}}
- {{this}}
{{/each}}
{{/if}}
Por favor, asegúrate de que las nuevas tareas sean coherentes con este proyecto.
{{/if}}

Por favor, genera {{{numberOfTasks}}} tareas relacionadas con la actividad. Devuelve las tareas como un array JSON de strings. No incluyas ningún texto extra.`, 
});

const generateTasksFlow = ai.defineFlow(
  {
    name: 'generateTasksFlow',
    inputSchema: GenerateTasksInputSchema,
    outputSchema: GenerateTasksOutputSchema,
  },
  async input => {
    const {output} = await generateTasksPrompt(input);
    return output!;
  }
);
