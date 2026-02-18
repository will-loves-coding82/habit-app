import { Habit } from "@/app/types";


/**
 * Determines the start of the current week in UTC time.
 * @returns A Date object
 */
export function getStartOfWeek(): Date {
    const date = new Date()
    const day = date.getDay()

    if (day !== 0) {
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - day);
    }

    const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return start
}


/**
 * Determines the end date of the current week in UTC time.
 * @returns A Date object
 */
export function getEndOfWeek(): Date {
    const date = new Date()
    const day = date.getDay()
    if (day < 7) {
        date.setHours(23, 59, 0, 0)
        date.setDate(date.getDate() + (7 - day));
    }

    const end = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()));
    return end
}

/**
 * Determines the date from 7 days ago in UTC time.
 * @returns A Date object
 */
export function getLastWeek(): Date {

    const date = new Date()
    const day = date.getDay()

    if (day !== 0) {
        date.setHours(0, 0, 0, 0)
        date.setDate(date.getDate() - 6);
    }

    const start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return start
}




/**
 * Returns a rolling window of the past 7 days as local date strings.
 * e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
 * @returns An array of strings
 */
export function calculateBaseWeekDays(): string[] {

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


/**
 * Checks if a habit was completed before it's due date.
 *  
 * @param habit Represents a user's habit
 * @returns true or false
 */
export function isHabitCompletedOnTime(habit: Habit): boolean {

    if (!habit.completed_date) {
        return false;
    }

    const completedDate = new Date(habit.completed_date)
    const dueDate = new Date(habit.due_date)
    const difference = Math.abs(dueDate.getDate() - completedDate.getDate())

    return habit.is_complete && (completedDate < dueDate && difference < 1)
}


/**
 * Determines if a habit was completed early.
 *
 * This function checks whether a habit has been marked as complete and if it was completed
 * at least one day before its due date.
 *
 * @param habit - The habit object containing information about its completion and due dates.
 * @returns `true` if the habit is complete and was completed at least one day before the due date, otherwise `false`.
 */
export function isHabitCompletedEarly(habit: Habit): boolean {

    if (!habit.completed_date) {
        return false;
    }

    const completedDate = new Date(habit.completed_date)
    const dueDate = new Date(habit.due_date)
    const difference = Math.abs(dueDate.getDate() - completedDate.getDate())

    return habit.is_complete && (difference >= 1)
}

/**
 * Checks if a habit is late. This is true if the habit was not 
 * marked as completed after its due date passed.
 * 
 * @param habit Represents a user's habit
 * @returns true or false
 */
export function isHabitLate(habit: Habit): boolean {

    const now = new Date().toISOString();

    // Strip the timezone metadata to compare with local time
    // const dueDate = new Date(habit.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));
    const dueDate = new Date(habit.due_date).toISOString();

    return !habit.is_complete && (now > dueDate);
}

