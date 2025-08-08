'use client';

import { useState, useMemo } from 'react';
import { useTasks } from '@/contexts/task-context';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiTaskGenerator } from './ai-task-generator';
import type { Category, Priority, Task } from '@/lib/types';

function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleToggle = () => {
    setIsCompleted(true);
    setTimeout(() => {
        onToggle(task.id);
    }, 500); // Duration of animation
  };

  const priorityColors = {
    low: 'border-l-4 border-green-500',
    medium: 'border-l-4 border-yellow-500',
    high: 'border-l-4 border-red-500',
  };

  return (
    <div
      className={`flex items-center space-x-4 p-4 bg-card rounded-lg shadow-sm transition-all ${
        priorityColors[task.priority]
      } ${isCompleted ? 'task-complete-animation' : ''}`}
    >
      <Checkbox
        id={`task-${task.id}`}
        onCheckedChange={handleToggle}
        aria-label={`Complete ${task.title}`}
      />
      <div className="flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className="font-medium leading-none cursor-pointer"
        >
          {task.title}
        </label>
      </div>
      <Badge variant="outline">{task.category}</Badge>
    </div>
  );
}


export function TodoList() {
  const { tasks, addTask, toggleTaskCompletion } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<Category>('personal');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask({ title: newTaskTitle, category: newTaskCategory, priority: newTaskPriority });
      setNewTaskTitle('');
    }
  };

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const filteredTasks = useMemo(() => tasks.filter(task => 
    !task.completed || (task.completedAt && task.completedAt > twentyFourHoursAgo)
  ), [tasks]);


  const groupedTasks = useMemo(() => {
    const all = filteredTasks.filter(t => !t.completed);
    return {
      all,
      study: all.filter(t => t.category === 'study'),
      work: all.filter(t => t.category === 'work'),
      personal: all.filter(t => t.category === 'personal'),
      projects: all.filter(t => t.category === 'projects'),
    };
  }, [filteredTasks]);

  const renderTaskList = (tasksToRender: Task[]) => {
    if (tasksToRender.length === 0) {
      return <p className="text-muted-foreground text-center py-8">No tasks in this category.</p>;
    }
    return (
      <div className="space-y-4">
        {tasksToRender.map(task => (
          <TaskItem key={task.id} task={task} onToggle={toggleTaskCompletion} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardContent className="p-4">
                <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-4">
                    <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-grow"
                    />
                    <div className="flex gap-2">
                        <Select value={newTaskCategory} onValueChange={(v) => setNewTaskCategory(v as Category)}>
                            <SelectTrigger className="w-full md:w-[120px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="personal">Personal</SelectItem>
                                <SelectItem value="work">Work</SelectItem>
                                <SelectItem value="study">Study</SelectItem>
                                <SelectItem value="projects">Projects</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={newTaskPriority} onValueChange={(v) => setNewTaskPriority(v as Priority)}>
                            <SelectTrigger className="w-full md:w-[120px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full md:w-auto">Add Task</Button>
                </form>
            </CardContent>
        </Card>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex justify-between items-center">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="study">Study</TabsTrigger>
                <TabsTrigger value="work">Work</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
            </TabsList>
            <AiTaskGenerator />
        </div>
        <TabsContent value="all">{renderTaskList(groupedTasks.all)}</TabsContent>
        <TabsContent value="study">{renderTaskList(groupedTasks.study)}</TabsContent>
        <TabsContent value="work">{renderTaskList(groupedTasks.work)}</TabsContent>
        <TabsContent value="personal">{renderTaskList(groupedTasks.personal)}</TabsContent>
        <TabsContent value="projects">{renderTaskList(groupedTasks.projects)}</TabsContent>
      </Tabs>
    </div>
  );
}
