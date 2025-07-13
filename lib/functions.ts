import { Habit } from "@/app/dashboard/types";

export function getStartOfWeek(date: Date) : Date {

    const day = date.getDay()
    
    if ( day !== 0) {
        date.setHours(0,0,0,0)
        date.setDate(date.getDate() - day);
    }

    console.log("Start of week: ", date)
    return date
}


export function getEndOfWeek(date: Date) : Date {
    
    const day = date.getDay()
    
    if ( day !== 7) {
        date.setHours(23,59,0,0)
        date.setDate(date.getDate() +  (7 - day));
    }

    console.log("End of week: ", date)
    return date
}


export function isHabitCompletedOnTime(habit: Habit) : boolean {
    const dueDate = new Date(habit.due_date);
    const completedDate = habit.completed_date ? new Date(habit.completed_date) : null;

    if (!completedDate) {
        return false;
    }
    if (completedDate < dueDate) {
        return true;
    }
    return false
}

export function isHabitLate(habit: Habit) : boolean {
    return !habit.is_complete && new Date() > new Date(habit.due_date);
}
