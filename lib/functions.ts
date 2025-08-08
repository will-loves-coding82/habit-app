import { Habit } from "@/app/types";

export function getStartOfWeek() : Date {
    const date = new Date()
    const day = date.getDay()

    if ( day !== 0) {
        date.setHours(0,0,0,0)
        date.setDate(date.getDate() - day);
    }
    return date
}


export function getEndOfWeek() : Date {
    const date = new Date()
    const day = date.getDay()
    if ( day < 7) {
        date.setHours(23,59,0,0)
        date.setDate(date.getDate() + (7-day));
    }
    return date
}


export function calculateBaseWeekDays() : string[] {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 6);

        let list = []

        for (let i = 0; i < 7; i++) {
            let lastWeekName = lastWeek.toLocaleString("en-US", {
                weekday: "short"
            })

            list.push(lastWeekName)
            lastWeek.setDate(lastWeek.getDate() + 1)
        }

        return list
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
