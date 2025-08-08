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
    .describe('A description of the activity for which tasks should be generated.'),
  numberOfTasks: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe('The number of tasks to generate.'),
});
export type GenerateTasksInput = z.infer<typeof GenerateTasksInputSchema>;

const GenerateTasksOutputSchema = z.object({
  tasks: z.array(
    z.string().describe('A task generated based on the activity description.')
  ).describe('The generated list of tasks.')
});
export type GenerateTasksOutput = z.infer<typeof GenerateTasksOutputSchema>;

export async function generateTasks(input: GenerateTasksInput): Promise<GenerateTasksOutput> {
  return generateTasksFlow(input);
}

const generateTasksPrompt = ai.definePrompt({
  name: 'generateTasksPrompt',
  input: {schema: GenerateTasksInputSchema},
  output: {schema: GenerateTasksOutputSchema},
  prompt: `You are a helpful task generator. Given an activity description, you will generate a list of tasks required to complete the activity.

Activity Description: {{{activityDescription}}}

Please generate {{{numberOfTasks}}} tasks related to the activity.  Return the tasks as a JSON array of strings. Do not include any extra text.`, 
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
