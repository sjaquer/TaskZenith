'use server';

import { generateTasks, type GenerateTasksInput } from '@/ai/flows/generate-tasks';
import { organizeTasks, type OrganizeTasksInput, type OrganizeTasksOutput } from '@/ai/flows/organize-tasks';
import { processVoiceCommand, type ProcessVoiceCommandInput, type ProcessVoiceCommandOutput } from '@/ai/flows/process-voice-command';
import { generateDailyPlan, type GenerateDailyPlanInput, type GenerateDailyPlanOutput } from '@/ai/flows/generate-daily-plan';
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

export async function generateDailyPlanAction(input: GenerateDailyPlanInput): Promise<GenerateDailyPlanOutput | { error: string }> {
    try {
      const result = await generateDailyPlan(input);
      return result;
    } catch (error) {
      console.error(error);
      return { error: 'Error al generar el plan diario.' };
    }
}