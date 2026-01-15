import { Task, UserRole } from './types';
import { differenceInHours, differenceInDays } from 'date-fns';

/**
 * Calculates a priority score (0-100) for a task based on various corporate factors.
 * This simulates an AI decision-making process using weighted heuristics.
 */
export function calculateAIPriorityScore(task: Task, userRole: UserRole): number {
    let score = 0;

    // 1. Base Priority Weight
    switch (task.priority) {
        case 'alta': score += 40; break;
        case 'media': score += 25; break;
        case 'baja': score += 10; break;
    }

    // 2. Deadline Pressure (Time Decay)
    if (task.dueDate) {
        const hoursUntilDue = differenceInHours(new Date(task.dueDate), new Date());
        
        if (hoursUntilDue < 0) {
            score += 50; // Overdue is critical!
        } else if (hoursUntilDue < 24) {
            score += 30; // Due today
        } else if (hoursUntilDue < 72) {
            score += 15; // Due in 3 days
        } else if (hoursUntilDue < 168) {
             score += 5; // Due this week
        }
    }

    // 3. Keyword Analysis (NLP-lite)
    const criticalKeywords = ['urgente', 'asap', 'crítico', 'producción', 'bug', 'error', 'cliente', 'pagos', 'seguridad'];
    const titleLower = task.title.toLowerCase();
    
    const hasCriticalKeyword = criticalKeywords.some(keyword => titleLower.includes(keyword));
    if (hasCriticalKeyword) {
        score += 20;
    }

    // 4. Role Hierarchy Weight
    // If an Admin created the task, it might carry more weight in some orgs, 
    // or if the algorithm is running FOR an admin, they see everything.
    // Here we assume if it was assigned specifically, it increases importance.
    if (task.assignedTo) {
        score += 10;
    }

    return Math.min(score, 100);
}

export function sortTasksByAIPriority(tasks: Task[], userRole: UserRole): Task[] {
    return [...tasks].sort((a, b) => {
        const scoreA = a.aiPriorityScore ?? calculateAIPriorityScore(a, userRole);
        const scoreB = b.aiPriorityScore ?? calculateAIPriorityScore(b, userRole);
        return scoreB - scoreA; // Descending order (Highest score first)
    });
}
