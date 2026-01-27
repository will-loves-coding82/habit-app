"use server";

import { createClient } from "@/lib/supabase/server";
import { toZoned, parseDateTime } from "@internationalized/date";

export interface CreateHabitFormState {
	error: string | null;
	success: boolean;
	message: string | null;
}

/**
 * createHabitAction is a custom server action that sends a POST request to supabase to 
 * insert a new habit with a custom title, description, due date, and recurrence.
 */
export async function createHabitAction(previousState: CreateHabitFormState, formData: FormData): Promise<CreateHabitFormState> {
	const supabase = await createClient();

	// DatePicker component uses React Aria which doesn't come with timezone data by default. 
	// Moreover, when this server action run in the Next.js production server, it uses
	// UTC timezone. So we need to extract the client-side timezone data from the form data
	// in order to store it correctly in postgres.
	const dueDateStr = formData.get("due_date") as string;
	const userTimezone = formData.get("user_timezone") as string;

	// Parse and convert using the user's timezone
	const localDateTime = parseDateTime(dueDateStr);
	const zonedDateTime = toZoned(localDateTime, userTimezone);
	const dueDate = zonedDateTime.toDate().toISOString();

	const { error } = await supabase.from("habits").insert({
		title: formData.get("title") as string,
		description: formData.get("description") as string,
		due_date: dueDate,
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
