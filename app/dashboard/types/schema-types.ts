

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