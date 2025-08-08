'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bot, Plus, Sparkles } from 'lucide-react';
import { generateAiTasksAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { Category, Priority } from '@/lib/types';

const formSchema = z.object({
  activityDescription: z.string().min(10, 'Please describe the activity in at least 10 characters.'),
  category: z.enum(['study', 'work', 'personal', 'projects']),
  priority: z.enum(['low', 'medium', 'high']),
});

export function AiTaskGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [numberOfTasks, setNumberOfTasks] = useState(3);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { addAiTasks } = useTasks();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityDescription: '',
      category: 'personal',
      priority: 'medium',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true);
    setGeneratedTasks([]);
    const result = await generateAiTasksAction({ ...values, numberOfTasks });
    setIsGenerating(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.tasks) {
      setGeneratedTasks(result.tasks);
    }
  }

  function handleAddTasks() {
    const { category, priority } = form.getValues();
    addAiTasks(generatedTasks, category as Category, priority as Priority);
    toast({
      title: 'Success!',
      description: `${generatedTasks.length} tasks have been added to your list.`,
    });
    setGeneratedTasks([]);
    setIsOpen(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Bot className="mr-2 h-4 w-4" /> Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2">
            <Sparkles className="text-accent" /> AI Task Generator
          </DialogTitle>
          <DialogDescription>
            Describe an activity, and we'll break it down into manageable tasks for you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="activityDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Plan a surprise birthday party for a friend" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="study">Study</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-2">
                <Label>Number of tasks: {numberOfTasks}</Label>
                <Slider defaultValue={[3]} min={1} max={10} step={1} onValueChange={(value) => setNumberOfTasks(value[0])} />
            </div>

            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate Tasks'}
            </Button>
          </form>
        </Form>
        {generatedTasks.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Suggested Tasks:</h3>
            <div className="space-y-2 rounded-md border p-2">
              {generatedTasks.map((task, index) => (
                <p key={index} className="text-sm p-2 bg-primary/30 rounded-md">{task}</p>
              ))}
            </div>
            <Button onClick={handleAddTasks} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add to My List
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
