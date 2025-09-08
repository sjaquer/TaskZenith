'use server';

import { generateTasks, type GenerateTasksInput } from '@/ai/flows/generate-tasks';
import { organizeTasks, type OrganizeTasksInput, type OrganizeTasksOutput } from '@/ai/flows/organize-tasks';
import { processVoiceCommand, type ProcessVoiceCommandInput, type ProcessVoiceCommandOutput } from '@/ai/flows/process-voice-command';
import { z } from 'zod';

const generateTasksSchema = z.object({
  activityDescription: z.string(),
  numberOfTasks: z.number().min(1).max(10),
  projectContext: z.object({
    name: z.string(),
    description: z.string().optional(),
    existingTasks: z.array(z.string()),
  }).optional(),
});

export async function generateAiTasksAction(input: GenerateTasksInput) {
  const parsedInput = generateTasksSchema.safeParse(input);
  if (!parsedInput.success) {
    console.error(parsedInput.error.flatten());
    return { error: 'Entrada no válida.' };
  }
  
  try {
    const result = await generateTasks(parsedInput.data);
    return { tasks: result.tasks };
  } catch (error) {
    console.error(error);
    return { error: 'Error al generar las tareas.' };
  }
}

export async function organizeTasksAction(input: OrganizeTasksInput): Promise<OrganizeTasksOutput | { error: string }> {
  try {
    const result = await organizeTasks(input);
    return result;
  } catch (error) {
    console.error(error);
    return { error: 'Error al organizar las tareas.' };
  }
}

export async function processVoiceCommandAction(input: ProcessVoiceCommandInput): Promise<ProcessVoiceCommandOutput | { error: string }> {
    try {
      const result = await processVoiceCommand(input);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Error al procesar el comando de voz.' };
    }
}

const TaskInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  priority: z.enum(['baja', 'media', 'alta']),
  category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']),
  status: z.enum(['Pendiente', 'En Progreso', 'Hecho', 'Finalizado', 'Cancelado']),
  createdAt: z.string().describe('The creation date of the task in ISO format.'),
  projectId: z.string().optional(),
});

export const GenerateDailyPlanInputSchema = z.object({
  tasks: z.array(TaskInputSchema).describe("The user's current list of pending tasks."),
  userName: z.string().optional().describe("The user's name for a personalized message."),
});
export type GenerateDailyPlanInput = z.infer<typeof GenerateDailyPlanInputSchema>;

export const GenerateDailyPlanOutputSchema = z.object({
  motivationalMessage: z.string().describe('A short, inspiring message for the user to start their day.'),
  suggestedTasks: z.array(z.object({
    id: z.string().describe('The ID of the suggested task.'),
    title: z.string().describe('The title of the suggested task.'),
    reason: z.string().describe('A brief, compelling reason why this task was chosen for today.'),
  })).describe('A curated list of 3 to 5 tasks to focus on for the day.'),
});
export type GenerateDailyPlanOutput = z.infer<typeof GenerateDailyPlanOutputSchema>;


export async function generateDailyPlanAction(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput | { error: string }> {
    try {
      // Import the flow dynamically inside the action to avoid circular dependencies
      const { generateDailyPlan } = await import('@/ai/flows/generate-daily-plan');
      const result = await generateDailyPlan(input);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Error al generar el plan diario.' };
    }
}
