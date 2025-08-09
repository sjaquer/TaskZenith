'use server';
/**
 * @fileOverview Processes a voice command to create tasks.
 *
 * - processVoiceCommand - A function that processes a voice command to generate a list of tasks.
 * - ProcessVoiceCommandInput - The input type for the processVoiceCommand function.
 * - ProcessVoiceCommandOutput - The return type for the processVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Category, Priority } from '@/lib/types';


const ProcessVoiceCommandInputSchema = z.object({
  command: z.string().describe('The transcribed voice command from the user.'),
  projectContext: z.array(z.object({
    id: z.string(),
    name: z.string(),
  })).describe('A list of available projects to help with context.'),
});
export type ProcessVoiceCommandInput = z.infer<typeof ProcessVoiceCommandInputSchema>;

const TaskSchema = z.object({
    title: z.string().describe('The title of the task.'),
    category: z.enum(['estudio', 'trabajo', 'personal', 'proyectos']).describe('The inferred category for the task.'),
    priority: z.enum(['baja', 'media', 'alta']).describe('The inferred priority for the task.'),
    projectId: z.string().optional().describe('The ID of the project this task belongs to, if applicable.'),
});

const ProcessVoiceCommandOutputSchema = z.object({
  tasks: z.array(TaskSchema).describe('The list of tasks generated from the voice command.')
});
export type ProcessVoiceCommandOutput = z.infer<typeof ProcessVoiceCommandOutputSchema>;

export async function processVoiceCommand(input: ProcessVoiceCommandInput): Promise<ProcessVoiceCommandOutput> {
  return processVoiceCommandFlow(input);
}

const processVoiceCommandPrompt = ai.definePrompt({
  name: 'processVoiceCommandPrompt',
  input: {schema: ProcessVoiceCommandInputSchema},
  output: {schema: ProcessVoiceCommandOutputSchema},
  prompt: `You are an expert task creation assistant. Your job is to parse a user's transcribed voice command and convert it into one or more structured tasks.

Analyze the user's command: "{{{command}}}"

Here are the rules:
1.  Identify each distinct task the user wants to create.
2.  For each task, determine its title, category, and priority.
3.  The default category is 'personal' and default priority is 'media' unless specified otherwise.
4.  Keywords for categories: 'trabajo', 'laboral' -> 'trabajo'; 'estudio', 'universidad', 'colegio' -> 'estudio'; 'personal', 'casa' -> 'personal'; 'proyecto' -> 'proyectos'.
5.  Keywords for priority: 'urgente', 'importante', 'alta prioridad' -> 'alta'; 'baja prioridad', 'no es urgente' -> 'baja'.
6.  If the category is 'proyectos', you MUST try to match the project name from the user's command to the list of available projects below. If a match is found, set the 'projectId' field.
7.  If the user mentions a project by name, the category MUST be 'proyectos'.

Available projects for context:
{{#if projectContext}}
{{#each projectContext}}
- Project Name: "{{this.name}}", ID: "{{this.id}}"
{{/each}}
{{else}}
- No projects available.
{{/if}}

Based on the command, generate a list of tasks in the required JSON format.
`, 
});

const processVoiceCommandFlow = ai.defineFlow(
  {
    name: 'processVoiceCommandFlow',
    inputSchema: ProcessVoiceCommandInputSchema,
    outputSchema: ProcessVoiceCommandOutputSchema,
  },
  async input => {
    const {output} = await processVoiceCommandPrompt(input);
    return output!;
  }
);
