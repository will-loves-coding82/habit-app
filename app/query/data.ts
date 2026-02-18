"use client";
import { createClient } from "@/lib/supabase/client";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { calculateBaseWeekDays, getLastWeek, isHabitCompletedEarly, isHabitCompletedOnTime } from "@/lib/functions";
import { useMutation, useQueryClient, queryOptions, useQuery } from "@tanstack/react-query";
import { Habit } from "../types";
import { AddHabitFormData } from "../dashboard/page";
import { parseDateTime, toZoned } from "@internationalized/date";
import userQueries from "../query/user";

export enum Day {
	Mon = "mon",
	Tue = "tue",
	Wed = "wed",
	Thu = "thu",
	Fri = "fri",
	Sat = "sat",
	Sun = "sun"
}

export type UpcomingHabits = Map<string, Habit[]>
export type CompletionHistory = Array<{ day: string, count: number }>
export interface CompletionRates { onTime: number, early: number, total: number }

export interface EditHabitDetailsProps {
	targetHabit: Habit,
	title: string,
	description: string,
};

export interface ToggleCompleteHabitProps {
	targetHabit: Habit,
	isComplete: boolean,
};

export interface DeleteHabitProps {
	targetHabit: Habit,
};

const supabase = createClient();


/**
 * Fetches the average completion rate for the user.
 * Habits that are completed ahead of time can count.
 */
export function getCompletionRates() {
	const {data: user} = useQuery(userQueries.getUser());

	return queryOptions<CompletionRates>({
		enabled: !!user,
		initialData: { onTime: 0, early: 0, total: 0 },
		queryKey: ["completion_rates"],
		queryFn: async () => {
			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("user_uid", user!!.id)

			if (error) {
				addToast({
					title: "Error fetching total habit count",
					description: error.message,
					color: "danger",
					classNames: {
						base: cn(["mb-4 mr-4"])
					}
				});

				throw error;
			}

			const completionRates: CompletionRates = { onTime: 0, early: 0, total: 0 }
			const rows = data ?? []
			rows.forEach((habit: Habit) => {
				if (isHabitCompletedOnTime(habit)) {
					completionRates.onTime += 1
				} else if (isHabitCompletedEarly(habit)) {
					completionRates.early += 1
				}
			})
			completionRates.total = rows.length;
			return completionRates
		}
	})
}



/**
 * Fetches habits that fall between 12:00 AM and 11:59PM of the current day.
 */
export function getTodayHabits() {
	const {data: user} = useQuery(userQueries.getUser());

	return queryOptions<Habit[]>({
		enabled: !!user,
		initialData: [],
		queryKey: ["today_habits"],
		queryFn: async () => {
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const tomorrow = new Date(today);
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("user_uid", user!!.id)
				.gte("due_date", today.toISOString())
				.lt("due_date", tomorrow.toISOString())
				.order("due_date", { ascending: false });

			if (error) {
				addToast({
					title: "Error fetching today's habits",
					description: error.message,
					color: "danger",
					classNames: {
						base: cn(["mb-4 mr-4"])
					}
				});
				throw error;
			}
			return data ?? []
		},
	})
}

/**
 * Fetches all upcoming habits
 */
export function getUpcomingHabits() {
	const {data: user} = useQuery(userQueries.getUser());

	return queryOptions<UpcomingHabits>({
		enabled: !!user,
		initialData: new Map(),
		queryKey: ["upcoming_habits"],
		queryFn: async () => {
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("user_uid", user!!.id)
				.gte("due_date", today.toISOString())
				.order("due_date", { ascending: false })

			if (error) {
				addToast({
					title: "Error fetching this week's habit",
					description: error.message,
					color: "danger",
					classNames: {
						base: cn(["mb-4 mr-4"])
					}
				});
				throw error;
			}
			else {
				let habitsMap = new Map();

				// Organize habits by days in the week
				data.forEach((habit: Habit) => {
					const date = new Date(habit.due_date);
					const month = date.toLocaleString("en-US", {
						month: "long"
					});

					if (!habitsMap.has(month)) {
						habitsMap.set(month, [])
					}
					habitsMap.get(month).push(habit);
				})

				return habitsMap;
			}
		}
	})
}

/**
 * Fetches habits from a rolling window of 7 days, and calculates how 
 * many were completed for each day.
 */
export function getCompletionHistory() {
	const {data: user} = useQuery(userQueries.getUser());

	return queryOptions<CompletionHistory>({
		initialData: new Array<{ day: string, count: number }>,
		queryKey: ["completion_history"],
		queryFn: async () => {
			const lastWeek = getLastWeek();
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			const tomorrow = new Date(today);
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

			const { data, error } = await supabase
				.from("habits")
				.select("due_date, completed_date, is_complete")
				.eq("user_uid", user!!.id)
				.gte("completed_date", lastWeek.toISOString())
				.lte("completed_date", tomorrow.toISOString())
				.order("completed_date", { ascending: true })

			if (error) {
				console.log("error getting completed habits over past week: ", error)
				addToast({
					title: "Error fetching last week's habits",
					description: error.message,
					color: "danger",
					classNames: {
						base: cn(["mb-4 mr-4"])
					}
				});
				throw error;
			}
			else {
				const mapOfCounts = new Map<string, number>();
				data.forEach(row => {
					const completedDate = new Date(row.completed_date);
					const day = completedDate.toLocaleString("en-US", {
						weekday: "short"
					})
					if (row.is_complete) {
						const count = mapOfCounts.get(day) || 0;
						mapOfCounts.set(day, count + 1);
					}
				})

				// Add placeholder values for missing days
				const baseWeekDays = calculateBaseWeekDays();
				baseWeekDays.forEach(day => {
					if (!mapOfCounts.has(day)) {
						mapOfCounts.set(day, 0);
					}
				});

				// Format the list in ascending order of days 
				const listOfCounts = baseWeekDays.map(day => ({
					day: day,
					count: mapOfCounts.get(day) || 0,
				}));

				return listOfCounts
			}
		}
	})
}

/**
 * Creates a mutation hook for adding a new habit. The user id is included automatically
 * in the request so habits are associated with the current user.
 * 
 * @returns {UseMutationResult<AddHabitFormData, Error, AddHabitFormData>} A mutation object with the following behavior:
 * - Parses and converts the habit's due date to the user's timezone
 * - Inserts the habit into the Supabase "habits" table
 * - On success: invalidates "today_habits" and "upcoming_habits" queries and shows a success toast
 * - On error: displays an error toast with the error message and logs the error to console
 * 
 * @throws {Error} If the Supabase insert operation fails
 * 
 * @example
 * const addHabitMutation = addHabit();
 * addHabitMutation.mutate({ title: "Exercise", description: "30 min run", due_date: "2024-01-15", user_timezone: "America/New_York" });
 */
export function addHabit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (habit: AddHabitFormData) => {
			console.log("adding habit: " + habit)
			const localDateTime = parseDateTime(String(habit.due_date))
			const zonedDateTime = toZoned(localDateTime, habit.user_timezone)
			const dueDate = zonedDateTime.toDate().toISOString()

			const { error } = await supabase.from("habits").insert({
				title: habit.title,
				description: habit.description,
				due_date: dueDate
			})
			if (error) { throw error }
			return habit
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["today_habits"]
			})
			queryClient.invalidateQueries({
				queryKey: ["upcoming_habits"]
			})

			addToast({
				title: "Successfully added habit",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		},
		onError: (error) => {
			alert(error.message)
			console.log("Error adding habit: ", error)

			addToast({
				title: "Error adding your habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
	})
}

/**
 * Updates a habit's title and descriptioon.
 * @params habit The habit object
 * @params newTitle The new title to update
 * @params newDescription The new description to update
 */
export function editHabit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ ...props }: EditHabitDetailsProps) => {
			console.log(`Updating habit with title ${props.title} and description ${props.description}`)
			const { error } = await supabase
				.from("habits")
				.update({ title: props.title, description: props.description })
				.eq("id", props.targetHabit.id)
				.select()

			if (error) throw error
			return props
		},
		onSuccess: (props) => {
			addToast({
				title: "Habit Updated",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});

			queryClient.setQueryData(["today_habits"], (prev: Habit[]) => {
				return prev.map((h) =>
					h.id === props.targetHabit.id ? { ...props.targetHabit, title: props.title, description: props.description } : h
				)
			})
			
			queryClient.setQueryData(["upcoming_habits"], (prev: UpcomingHabits) => {
				if (!prev) return new Map();
				const updatedUpcomingHabits: UpcomingHabits = new Map();
				for (const [month, habits] of prev.entries()) {
					updatedUpcomingHabits.set(month, habits.map((h) =>
					h.id === props.targetHabit.id ? { ...props.targetHabit, title: props.title, description: props.description } : h
				));
				}
				return updatedUpcomingHabits;
			})
		},
		onError: (error) => {
			console.log("Error updating habit")
			addToast({
				title: "Error updating your habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
	})
}

/**
 * Callback export function that updates a habit's completed_date. 
 */
export function toggleCompleteHabit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ ...props }: ToggleCompleteHabitProps) => {
			const todayUTC = new Date().toISOString()
			const { error } = await supabase
				.from("habits")
				.update({ is_complete: props.isComplete, completed_date: props.isComplete ? todayUTC : null })
				.eq("id", props.targetHabit.id.toString())
			if (error) { throw error }
			return null;
		},
		onSuccess: (_, { ...props }) => {
			const todayNumber = Number(new Date(0, 0, 0, 0).getDay())
			const todayUTC = new Date().toISOString()

			const habitDueDate = new Date(props.targetHabit.due_date);
			let habitDueDateLong = habitDueDate.toLocaleString("en-US", {
				month: "long"
			})

			queryClient.invalidateQueries({
				queryKey: ["completion_rates"]
			})

			queryClient.setQueryData(["today_habits"], (prev: Habit[]) => {
				console.log("updating today habits query data")
				return prev.map((h) =>
					h.id === props.targetHabit.id ? { ...props.targetHabit, is_complete: props.isComplete, completed_date: todayUTC } : h
				)
			})

			queryClient.setQueryData(["upcoming_habits"], (prev: UpcomingHabits) => {
				if (prev.has(habitDueDateLong)) {
					const filtered = prev.get(habitDueDateLong)!.map((h) => h.id === props.targetHabit.id ? { ...props.targetHabit, is_complete: props.isComplete, completed_date: todayUTC } : h)
					prev.set(habitDueDateLong, filtered);
				}
				return prev;
			})

			queryClient.setQueryData(["completion_history"], (prev: CompletionHistory) => {
				return prev.map((item, index) =>
					index === (6 - todayNumber) ? { ...item, count: (props.isComplete ? item.count + 1 : (item.count >= 1 ? item.count - 1 : 0)) } : item
				);
			})

			const successTitle = `Habit ${props.isComplete ? "checked" : "unchecked"}`
			const successDescription = `Successfully marked habit as ${props.isComplete ? "complete" : "incomplete"}`

			addToast({
				title: successTitle,
				description: successDescription,
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		},
		onError: (error) => {
			console.log("Error: ", error)
			addToast({
				title: "Error marking your habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
	})
}

export function deleteHabit() {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({...props} : DeleteHabitProps) => {
			const { error } = await supabase.rpc("delete_habit", { id: props.targetHabit.id });
			if (error) {
				throw error;
			}
			return props.targetHabit;
		},
		onSuccess: (habit) => {
			addToast({
				title: "Habit Deleted",
				description: "Successfully deleted habit!",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
			queryClient.setQueryData(["today_habits"], (prev: Habit[]) => {
				return (prev ?? []).filter((h) => h.id !== habit.id)
			})

			queryClient.setQueryData(["upcoming_habits"], (prev: UpcomingHabits) => {
				if (!prev) return new Map();
				const updatedUpcomingHabits: UpcomingHabits = new Map();
				for (const [month, habits] of prev.entries()) {
					updatedUpcomingHabits.set(month, habits.filter((h) => h.id !== habit.id));
				}
				return updatedUpcomingHabits;
			})
		},
		onError: (error) => {
			addToast({
				title: "Error",
				description: "An error occurred while deleting your habit: " + error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
	})
}

export default {
	getCompletionRates,
	getCompletionHistory,
	getTodayHabits,
	getUpcomingHabits,
	addHabit,
	editHabit,
	toggleCompleteHabit,
	deleteHabit
};