'use server';
/**
 * @fileOverview Organizes a list of tasks using AI.
 *
 * - organizeTasks - A function that analyzes and optimizes a list of tasks.
 * - OrganizeTasksInput - The input type for the organizeTasks function.
 * - OrganizeTasksOutput - The return type for the organizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { OrganizedTasks } from '@/lib/types';


// Define input schemas here to ensure they are available for the 'use server' file.
const TaskInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  priority: z.enum(['baja', 'media', 'alta']),
  projectId: z.string().optional(),
});
const OrganizeTasksInputSchema = z.object({
  tasks: z.array(TaskInputSchema).describe("The user's current list of pending tasks."),
});
export type OrganizeTasksInput = z.infer<typeof OrganizeTasksInputSchema>;


const OrganizedTaskUpdateSchema = z.object({
  id: z.string().describe('The ID of the original task to update.'),
  title: z.string().optional().describe('The new, improved title for the task.'),
  priority: z.enum(['baja', 'media', 'alta']).optional().describe('The new, more appropriate priority.'),
});

const OrganizedTaskNewSchema = z.object({
  title: z.string().describe('The title for the new task, often a summary of merged tasks.'),
  priority: z.enum(['baja', 'media', 'alta']).describe('The priority for the new task.'),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']).describe('The category for the new task.'),
  projectId: z.string().optional().describe('The project ID if the new task belongs to one.'),
});

const OrganizeTasksOutputSchema = z.object({
  updatedTasks: z.array(OrganizedTaskUpdateSchema).describe('Tasks that have been modified (e.g., reworded or reprioritized).'),
  newTasks: z.array(OrganizedTaskNewSchema).describe('New tasks created by merging similar or related old tasks.'),
  deletedTaskIds: z.array(z.string()).describe('IDs of original tasks that were merged or deemed redundant and should be deleted.'),
});
export type OrganizeTasksOutput = z.infer<typeof OrganizeTasksOutputSchema>;


export async function organizeTasks(input: OrganizeTasksInput): Promise<OrganizeTasksOutput> {
  // We can validate inside the server action now.
  const parsedInput = OrganizeTasksInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error('Invalid input for organizeTasks: ' + parsedInput.error.message);
  }
  return organizeTasksFlow(parsedInput.data);
}


const organizeTasksPrompt = ai.definePrompt({
  name: 'organizeTasksPrompt',
  input: {schema: OrganizeTasksInputSchema},
  output: {schema: OrganizeTasksOutputSchema},
  prompt: `Eres un asistente de productividad experto. Tu objetivo es analizar la siguiente lista de tareas pendientes de un usuario y optimizarla.

Aquí está la lista de tareas actual:
{{#each tasks}}
- ID: {{this.id}}, Título: "{{this.title}}", Prioridad: {{this.priority}}, Categoría: {{this.category}}{{#if this.projectId}}, ProyectoID: {{this.projectId}}{{/if}}
{{/each}}

Sigue estas reglas para optimizar la lista:
1.  **Reescribir para Claridad:** Revisa cada título. Si un título es vago o poco claro, reescríbelo para que sea una acción específica. Por ejemplo, "Informe" debería ser "Redactar el primer borrador del informe trimestral". Si el título ya es bueno, no lo cambies.
2.  **Ajustar Prioridades:** Evalúa la prioridad de cada tarea basándote en palabras clave como "urgente", "importante", "cuanto antes" (alta), o "si hay tiempo", "luego" (baja). Si no hay indicación, usa tu juicio. Una tarea como "Pagar la factura de la luz" probablemente tiene una prioridad más alta que "Ver nueva serie".
3.  **Fusionar Tareas Similares:** Busca tareas que sean duplicadas o que puedan combinarse. Por ejemplo, "Comprar leche" y "Comprar pan" se pueden fusionar en "Hacer la compra (leche, pan)". Si fusionas tareas, crea una nueva tarea en 'newTasks' y añade los IDs de las tareas originales a 'deletedTaskIds'. La categoría de la nueva tarea debe ser la misma que la de las originales (si coinciden) o 'personal' si son de diferentes categorías.
4.  **Eliminar Redundancias:** Si una tarea es claramente un duplicado completo de otra o es irrelevante, añádela a 'deletedTaskIds'. No elimines tareas a menos que estés muy seguro.
5.  **Estructura de Salida:**
    - Para tareas que solo necesitan un cambio de título o prioridad, añádelas a 'updatedTasks' con su ID original.
    - Para tareas fusionadas, crea una nueva en 'newTasks' y lista los IDs originales en 'deletedTaskIds'.
    - Para tareas que simplemente se eliminan, solo añade su ID a 'deletedTaskIds'.

Analiza la lista y devuelve un objeto JSON con las optimizaciones. Si no hay nada que cambiar, devuelve un objeto vacío.`,
});

const organizeTasksFlow = ai.defineFlow(
  {
    name: 'organizeTasksFlow',
    inputSchema: OrganizeTasksInputSchema,
    outputSchema: OrganizeTasksOutputSchema,
  },
  async input => {
    const {output} = await organizeTasksPrompt(input);
    return output!;
  }
);
