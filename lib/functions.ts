import { Habit } from "@/app/types";


/**
 * Determines the start of the current week
 */
export function getStartOfWeek() : Date {
    const date = new Date()
    const day = date.getDay()

    if ( day !== 0) {
        date.setHours(0,0,0,0)
        date.setDate(date.getDate() - day);
    }
    return date
}


/**
 * Determines the end of the current week
 */
export function getEndOfWeek() : Date {
    const date = new Date()
    const day = date.getDay()
    if ( day < 7) {
        date.setHours(23,59,0,0)
        date.setDate(date.getDate() + (7-day));
    }
    return date
}



/**
 * Returns a rolling window of the past 7 days as strings
 * e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
 */
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


/**
 * Checks if a habit was completed before it's due date.
 *  
 * @param habit Represents a user's habit
 * @returns true or false
 */
export function isHabitCompletedOnTime(habit: Habit) : boolean {

    if (!habit.completed_date) {
        return false
    }

    if (habit.is_complete) {

        const completedDate = new Date(habit.completed_date)
        const dueDate = new Date(habit.due_date)
        // const dueDate = new Date(habit.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));

        console.log(`----isHabitComplete(${habit.title})----`)
        console.log(`UTC completed date for habit ${habit.title} is: ${completedDate.toISOString()}`)
        console.log(`UTC due date for habit ${habit.title} is: ${dueDate.toISOString()}`)
        console.log('-----------------end----------------------')
    }

    if (!habit.completed_date) {
        return false;
    }
    if (habit.completed_date < habit.due_date) {
        return true;
    }
    return false
}

/**
 * Checks if a habit is late. This is true if the habit was not 
 * marked as completed after its due date passed.
 * @param habit Represents a user's habit
 * @returns true or false
 */
export function isHabitLate(habit: Habit) : boolean {

    const now = new Date()
    const dueDate = new Date(habit.due_date)
    
    // const dueDate = new Date(habit.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));
    console.log(habit.due_date)

    console.log("----------<")
    console.log(`Getting now date for ${habit.title}: ${now.toISOString()}`)
    console.log(`habit ${habit.title} raw due date:  ${habit.due_date}`)
    console.log(`UTC dueDate for habit ${habit.title} is: ${dueDate.toISOString()}`)
    console.log(`----------<`)
    
    return !habit.is_complete && (now > dueDate);
}


export function convertToLocaleString(date: string) : string {
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    }).replace("at", "")
}
