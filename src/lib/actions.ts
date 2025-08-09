'use server';

import { generateTasks, type GenerateTasksInput } from '@/ai/flows/generate-tasks';
import { processVoiceCommand, type ProcessVoiceCommandInput } from '@/ai/flows/process-voice-command';
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

const processVoiceCommandSchema = z.object({
    command: z.string(),
    projectContext: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })),
});

export async function processVoiceCommandAction(input: ProcessVoiceCommandInput) {
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
