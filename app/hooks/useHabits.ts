"use client";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { calculateBaseWeekDays, getEndOfWeek, getLastWeek, getStartOfWeek } from "@/lib/functions";
import { useMutation, UseMutationResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { Habit } from "../types";
import { AddHabitFormData } from "../dashboard/page";
import { parseDateTime, toZoned } from "@internationalized/date";

export enum Day {
	Mon = "mon",
	Tue = "tue",
	Wed = "wed",
	Thu = "thu",
	Fri = "fri",
	Sat = "sat",
	Sun = "sun"
}

export type CompletionHistory = Array<{ day: string, count: number }>

export interface EditHabitDetailsProps {
	targetHabit: Habit,
	title: string,
	description: string,
};

export interface ToggleCompleteHabitProps  {
	targetHabit: Habit,
	isComplete: boolean,
};

export type WeekHabits = Map<string, Habit[]>
export type toggleCompleteHabitMutationResult = UseMutationResult<null, Error, ToggleCompleteHabitProps, unknown>
export type updateHabitMutationResult = UseMutationResult<null, Error, EditHabitDetailsProps, unknown>
export type deleteHabitMutationResult = UseMutationResult<null, Error, Habit, unknown>
export type addHabitMutationResult = UseMutationResult<Habit, Error, Habit, unknown>

// export type HabitContextProps = {
// 	todayHabits: Habit[] | undefined;
// 	weekHabits: Map<string, Habit[]> | undefined;
// 	completionHistory: CompletionHistory | undefined;
// 	completeHabit: completeHabitMutationResult,
// 	updateHabit: updateHabitMutationResult,
// 	deleteHabit: deleteHabitMutationResult,
// }

/**
 * Reusable custom hook that manages habit logic.
 */
export function useHabits() {
	const queryClient = useQueryClient()
	const supabase = createClient();

	const {data: user} = useQuery<User | null, Error>({
		queryKey: ["user"],
		queryFn: async() => {
			const { data: supabaseData, error } = await supabase.auth.getUser();
			if (error) throw error;
			return supabaseData.user ?? null;
		},
		retry: true,
	})

	const userId = user?.id

	/**
	 * Fetches habits that fall between 12:00 AM and 11:59PM of the current day.
	 */
	const { data: todayHabits } = useQuery<Habit[], Error>({
		queryKey: ["today_habits"],
		enabled: !!user,
		queryFn: async () => {
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const tomorrow = new Date(today);
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("user_uid", user?.id)
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
			else {
				return data ?? []
			}
		},
	})

	/**
	 * Fetches habits that fall between the monday and sunday of this week.
	 */
	const { data: weekHabits } = useQuery<WeekHabits, Error>({
		queryKey: ["week_habits"],
		enabled: !!userId,
		queryFn: async () => {
			const weekStart = getStartOfWeek().toISOString();
			const weekEnd = getEndOfWeek().toISOString();

			const { data, error } = await supabase
				.from("habits")
				.select("*")
				.eq("user_uid", user?.id)
				.gte("due_date", weekStart)
				.lte("due_date", weekEnd)
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
					const day = date.toLocaleString("en-US", {
						weekday: "long",
					});

					if (!habitsMap.has(day)) {
						habitsMap.set(day, [])
					}
					habitsMap.get(day).push(habit);
				})

				return habitsMap;
			}
		}
	})

	/**
	 * Fetches habits from a rolling window of 7 days, and calculates how 
	 * many were completed for each day.
	 */
	const { data: completionHistory } = useQuery<CompletionHistory>({
		queryKey: ["completion_history"],
		enabled: !!userId,
		queryFn: async () => {
			const lastWeek = getLastWeek();
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

			const tomorrow = new Date(today);
			tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

			const { data, error } = await supabase
				.from("habits")
				.select("due_date, is_complete")
				.eq("user_uid", user?.id)
				.gte("due_date", lastWeek.toISOString())
				.lt("due_date", tomorrow.toISOString())
				.order("due_date", { ascending: true })

			if (error) {
				console.log("error getting habits over past week: ", error)
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
					const dueDate = new Date(row.due_date);
					const day = dueDate.toLocaleString("en-US", {
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


	const addHabit = useMutation({
		mutationFn: async(habit: AddHabitFormData) => {
			console.log("adding habit: " + habit)
			const localDateTime = parseDateTime(String(habit.due_date))
			const zonedDateTime = toZoned(localDateTime, habit.user_timezone)
			const dueDate = zonedDateTime.toDate().toISOString()

			const { error } = await supabase.from("habits").insert({
				title: habit.title,
				description: habit.description,
				due_date: dueDate
			})

			if (error) {
				throw error
			}
			return habit
		},
		onSuccess: (habit) => {

			// queryClient.setQueryData(["today_habits"], (prev: Habit[]) => {
			// prev = [...prev, habit ]
			// 	const index = prev.findIndex((h) => h.due_date <= habit.due_date)
			// 	return prev.splice(index, 0, habit)
			// })

			// TODO: Optimize with granular ui update
			queryClient.invalidateQueries({
				queryKey: ["today_habits", "week_habits"]
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

	/**
	 * Updates a habit's title and descriptioon.
	 * @params habit The habit object
	 * @params newTitle The new title to update
	 * @params newDescription The new description to update
	 */
	const editHabit= useMutation({
		mutationFn: async ({ ...props }: EditHabitDetailsProps) => {
			console.log(`Updating habit with title ${props.title} and description ${props.description}`)
			const { error } = await supabase
				.from("habits")
				.update({ title: props.title, description: props.description })
				.eq("id", props.targetHabit.id)
				.eq("user_uid", user?.id)
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

			const habitDueDate = new Date(props.targetHabit.due_date);
			let habitDueDateLong = habitDueDate.toLocaleString("en-US", {
				weekday: "long"
			})
			
			queryClient.setQueryData(["week_habits"], (prev: WeekHabits) => {
				if (prev.has(habitDueDateLong)) {
					const filtered = prev.get(habitDueDateLong)!.map((h) => h.id === props.targetHabit.id ? { ...props.targetHabit, title: props.title, description: props.description } : h)
					prev.set(habitDueDateLong, filtered);
				}
				return prev;
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

	/**
	 * Callback function that updates a habit's completed_date. 
	 */
	const toggleCompleteHabit = useMutation({
		mutationFn: async ({ ...props }: ToggleCompleteHabitProps) => {
			const todayUTC = new Date().toISOString()
			const { error } = await supabase
				.from("habits")
				.update({ is_complete: props.isComplete, completed_date: props.isComplete ? todayUTC : null })
				.eq("id", props.targetHabit.id.toString())

			if (error) {
				throw error;
			}

			return null;
		},
		onSuccess: (_, { ...props }) => {
			const todayNumber = Number(new Date(0, 0, 0, 0).getDay())
			const todayUTC = new Date().toISOString()

			const habitDueDate = new Date(props.targetHabit.due_date);
			let habitDueDateLong = habitDueDate.toLocaleString("en-US", {
				weekday: "long"
			})

			queryClient.setQueryData(["today_habits"], (prev: Habit[]) => {
				console.log("updating today habits query data")
				return prev.map((h) =>
					h.id === props.targetHabit.id ? { ...props.targetHabit, is_complete: props.isComplete, completed_date: todayUTC } : h
				)
			})

			queryClient.setQueryData(["week_habits"], (prev: WeekHabits) => {
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

			addToast({
				title: "Habit Completed",
				description: "Successfully marked habit!",
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


	const deleteHabit = useMutation({
		mutationFn: async (habit: Habit) => {
			const { error } = await supabase.rpc("delete_habit", { id: habit.id });
			if (error) {
				throw error;
			}
			return habit;
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
				return prev.filter((h) =>
					h.id !== habit.id
				)
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

	return {
		todayHabits,
		weekHabits,
		completionHistory,
		addHabit,
		toggleCompleteHabit,
		editHabit,
		deleteHabit
	};
}
