'use server';

import { generateTasks, type GenerateTasksInput } from '@/ai/flows/generate-tasks';
import { processVoiceCommand, type ProcessVoiceCommandInput } from '@/ai/flows/process-voice-command';
import { organizeTasks, type OrganizeTasksInput, type OrganizeTasksOutput } from '@/ai/flows/organize-tasks';
import { z } from 'zod';
import { auth } from './firebase';

// Helper to get the current user's ID
async function getUserId() {
    // This is a placeholder. In a real app, you would get the user from the session.
    // For server actions, this is complex. We will assume for now flows get the userId they need.
    // In a full implementation, you'd use a library like next-auth or manage sessions.
    return auth.currentUser?.uid;
}


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
  const userId = await getUserId();
  if (!userId) return { error: 'Debes iniciar sesión para usar esta función.' };

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

const processVoiceCommandSchema = z.object({
    command: z.string(),
    projectContext: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })),
});

export async function processVoiceCommandAction(input: ProcessVoiceCommandInput) {
    const userId = await getUserId();
    if (!userId) return { error: 'Debes iniciar sesión para usar esta función.' };

    const parsedInput = processVoiceCommandSchema.safeParse(input);
    if (!parsedInput.success) {
        console.error(parsedInput.error.flatten());
        return { error: 'Entrada de voz no válida.' };
    }

    try {
        const result = await processVoiceCommand(parsedInput.data);
        return { tasks: result.tasks };
    } catch (error) {
        console.error(error);
        return { error: 'Error al procesar el comando de voz.' };
    }
}

export async function organizeTasksAction(input: OrganizeTasksInput): Promise<OrganizeTasksOutput | { error: string }> {
  const userId = await getUserId();
  if (!userId) return { error: 'Debes iniciar sesión para usar esta función.' };
  
  try {
    const result = await organizeTasks(input);
    return result;
  } catch (error) {
    console.error(error);
    return { error: 'Error al organizar las tareas.' };
  }
}
