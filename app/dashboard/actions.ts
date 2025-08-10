"use server";

import { createClient } from "@/lib/supabase/server";
import { DateValue } from "@internationalized/date";

export interface CreateHabitFormState {
    error: string | null;
    success: boolean;
    message: string | null;
}

export async function createHabitAction(previousState: CreateHabitFormState, formData: FormData) : Promise<CreateHabitFormState> {
    const supabase = await createClient();
    
    const {error} = await supabase.from("habits").insert({
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        due_date:  new Date(formData.get("due_date") as string).toISOString(), //todo: store in utc time
        recurrence_type: formData.get("is_weekly") === "true" ? "weekly" : "daily",
        is_parent: true
    })

    if (error) {
        return Promise.reject({
            error: error.message,
            success: false,
            message: "An error occurred while creating your habit."
        });
    }

    return Promise.resolve({
        error: null,
        success: true,
        message: "Habit created successfully!"
    });

}

