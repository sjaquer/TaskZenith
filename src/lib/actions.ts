'use server';

import { generateTasks, type GenerateTasksInput } from '@/ai/flows/generate-tasks';
import { z } from 'zod';

const actionSchema = z.object({
  activityDescription: z.string(),
  numberOfTasks: z.number().min(1).max(10),
  projectContext: z.object({
    name: z.string(),
    description: z.string().optional(),
    existingTasks: z.array(z.string()),
  }).optional(),
});

export async function generateAiTasksAction(input: GenerateTasksInput) {
  const parsedInput = actionSchema.safeParse(input);
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
