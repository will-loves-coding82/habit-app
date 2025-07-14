

export interface Habit{
    created_date: string;
    id: number;
    parent_id: number | null;
    title: string;
    description: string;
    due_date: string;
    recurrence_type: "daily" | "weekly";
    is_complete: boolean;
    completed_date?: string | null;
}


export interface Streak {
    created_date: string;
    id: number;
    user_id: string;
    streak: number;
}


export interface habitAction {
    type: string;
    habit: Habit;
}


export interface ChatMessage {
    created_at: string,
    role: string,
    content: string,
    chat_id: number
}