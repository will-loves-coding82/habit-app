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

    // console.log("Due Date: ", habit.due_date)
    // console.log("Completed Date: ", habit.completed_date)
    if (!habit.completed_date) {
        return false
    }

    const dueDate = new Date(habit.due_date)
    const localDueDate = new Date(dueDate.getTime())

    const completedDate = new Date(habit.completed_date)
    const localCompletedDate = new Date(completedDate.getTime() + completedDate.getTimezoneOffset())

    if (habit.title === "new local") {

        console.log(`UTC due date for habit ${habit.title} is: ${localDueDate}`)
        console.log(`UTC completed date for habit ${habit.title} is: ${localCompletedDate}`)
    }
    if (!completedDate) {
        return false;
    }
    if (completedDate < localDueDate) {
        return true;
    }
    return false

    // const dueDate = new Date(habit.due_date);
    // const completedDate = habit.completed_date ? new Date(habit.completed_date) : null;
    
    // if (!completedDate) {
    //     return false;
    // }
    
    // // Convert both to local time for comparison
    // const localDueDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset());
    // const localCompletedDate = new Date(completedDate.getTime() - completedDate.getTimezoneOffset());
    
    // return localCompletedDate < localDueDate;
}

export function isHabitLate(habit: Habit) : boolean {

    const date = new Date()
    const now = new Date(date.getTime() - date.getTimezoneOffset())

    const dueDate = new Date(habit.due_date)
    const localDueDate = new Date(dueDate.getTime())

    if (habit.title === "new local") {
    console.log("----------b")
    console.log(`Getting now date for ${habit.title}: ${now}}`)
    console.log(`UTC dueDate for habit ${habit.title} is: ${localDueDate}`)
    console.log(`----------^`)
    }

    return !habit.is_complete && (date > localDueDate);
}
