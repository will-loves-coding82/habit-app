import { Habit } from "@/app/types";
import { useCallback } from "react";

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



export const isHabitCompletedOnTime = useCallback(function(habit: Habit) : boolean {

    if (!habit.completed_date) {
        return false
    }
    const dueDate = convertToLocaleString(habit.due_date)
    const completedDate = convertToLocaleString(habit.completed_date)

    if (habit.is_complete) {
    console.log(`----isHabitComplete(${habit.title})----`)
    console.log(`UTC completed date for habit ${habit.title} is: ${completedDate}`)
    console.log(`UTC due date for habit ${habit.title} is: ${dueDate}`)
    console.log('-----------------end----------------------')
    }

    if (!habit.completed_date) {
        return false;
    }
    if (habit.completed_date < habit.due_date) {
        return true;
    }
    return false
},[])

export const isHabitLate = useCallback(function (habit: Habit) : boolean {

    const now = new Date()
    const dueDate = new Date(habit.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));

    console.log("----------<")
    console.log(`Getting now date for ${habit.title}: ${now}}`)
    console.log(`UTC dueDate for habit ${habit.title} is: ${dueDate}`)
    console.log(`----------<`)
    

    return !habit.is_complete && (now > dueDate);
},[])


export const convertToLocaleString = useCallback(function(date: string) : string {
    return new Date(date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    }).replace("at", "")
},[])
