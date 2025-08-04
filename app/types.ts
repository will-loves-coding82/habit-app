import { User } from "@supabase/supabase-js";
import { Dispatch, SetStateAction } from "react";

export type Habit = {
    [x: string]: any;
    created_at: string;
    id: number;
    parent_id: number | null;
    title: string;
    description: string;
    due_date: string;
    recurrence_type: "daily" | "weekly";
    is_complete: boolean;
    completed_date?: string | null;
}

export type CompletionCountPerDay = {
    due_date: string;
    count_complete: number
}

export type CompletionHistory = Array<{day: string, count: number}>


export type Streak = {
    created_date: string;
    id: number;
    user_id: string;
    streak: number;
}


export type habitAction = {
    type: string;
    habit: Habit;
}


export type ChatMessage = {
    created_at: string,
    role: string,
    content: string,
    chat_id: number,
}


export type Error = {
    message: string
}



export interface UserContextProps {
    user: User,
    isLoadingUser: boolean
}


export interface HabitContextProps {
    isAddingHabit: boolean,
    isDeletingHabit: boolean,
    isUpdatingHabit: boolean,
    isLoadingUniqueHabits: boolean,
    todayHabits: Habit[],
    weekHabits:  Map<string, Habit[]>,
    uniqueHabits: Habit[],
    completionHistory: CompletionHistory,
    refreshHabits: () => void,
    setTodayHabits: Dispatch<SetStateAction<Habit[]>>,
    setWeekHabits: Dispatch<SetStateAction<Map<string, Habit[]>>>,
    setIsAddingHabit: Dispatch<SetStateAction<boolean>>,
    setIsDeletingHabit: Dispatch<SetStateAction<boolean>>,
    fetchUniqueHabits: () => Promise<void>,
    fetchHabitsThisWeek:  () => Promise<void>,
    fetchTodayHabits:  () => Promise<void>,
    onCompleteHabit:  (habit: Habit, completed: boolean) => void,
    onUpdateHabit: (habit: Habit | null, new_title: string | null, new_description: string | null) => Promise<void>,
    onDeleteHabit: (habit: Habit) => Promise<void>,
    onDeleteUniqueHabit: (habit: Habit) => Promise<void>
}

export type HabitCardProps = {
    habit: Habit, 
    type: string, 
    isDeleting: boolean, 
    isUpdating: boolean,
    onComplete: (habit: Habit, completed: boolean) => void, 
    onDelete: (habit: Habit) => void,
    onUpdate: (habit: Habit | null, new_title: string | null, new_description: string | null) => Promise<void>
}