import { toggleCompleteHabitMutationResult, deleteHabitMutationResult, updateHabitMutationResult } from "./hooks/useHabits";

export enum Day {
	Mon = "mon",
	Tue = "tue",
	Wed = "wed",
	Thu = "thu",
	Fri = "fri",
	Sat = "sat",
	Sun = "sun"
}

export type Habit = {
    created_at: string;
    id: number;
    title: string;
    description: string;
    due_date: string;
    is_complete: boolean;
    completed_date?: string | null;
}

export type CompletionCountPerDay = {
    due_date: string;
    count_complete: number;
}

export type CompletionHistory = Array<{ day: string, count: number }>

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
    created_at: string;
    role: string;
    content: string;
    chat_id: number;
}

export type Error = {
    message: string;
}

export type HabitCardProps = {
    habit: Habit;
    type: string;
    toggleCompleteHabit: toggleCompleteHabitMutationResult,
    editHabit: updateHabitMutationResult,
    deleteHabit: deleteHabitMutationResult,
}