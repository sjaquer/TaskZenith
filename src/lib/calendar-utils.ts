import { Task } from "./types";

export function generateGoogleCalendarUrl(task: Task): string {
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(`Prioridad: ${task.priority}\nCategoría: ${task.category}`);
    
    // Default to 1 hour event if no end time logic, or use estimatedTime
    let start = new Date();
    if (task.dueDate) {
        start = new Date(task.dueDate);
    }
    
    // Format dates as YYYYMMDDTHHMMSSZ
    // Simple ISO string replacement for now, assuming UTC/Local handling needs to be robust but start simple
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const startDate = formatDate(start);
    const endDate = formatDate(new Date(start.getTime() + (task.estimatedTime || 60) * 60000)); // Default 60 mins
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${startDate}/${endDate}`;
}

export function generateOutlookCalendarUrl(task: Task): string {
    const title = encodeURIComponent(task.title);
    const details = encodeURIComponent(`Prioridad: ${task.priority}\nCategoría: ${task.category}`);
    
    let start = new Date();
    if (task.dueDate) {
        start = new Date(task.dueDate);
    }
    
    const startStr = start.toISOString();
    const endStr = new Date(start.getTime() + (task.estimatedTime || 60) * 60000).toISOString();
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${details}&startdt=${startStr}&enddt=${endStr}`;
}
