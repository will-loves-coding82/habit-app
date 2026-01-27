"use client";

import { use, useCallback, useEffect, useState } from "react";
import { CompletionHistory, Habit } from "../types";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { calculateBaseWeekDays, getEndOfWeek, getLastWeek, getStartOfWeek } from "@/lib/functions";
import { redirect } from "next/navigation";

/**
 * Reusable custom hook that manages habit logic.
 */
export function useHabits(user: User) {

	const supabase = createClient();
	const [isAddingHabit, setIsAddingHabit] = useState(false);
	const [isDeletingHabit, setIsDeletingHabit] = useState(false);
	const [isLoadingUniqueHabits, setIsLoadingUniqueHabits] = useState(false);
	const [isUpdatingHabit, setIsUpdatingHabit] = useState(false);

	const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
	const [weekHabits, setWeekHabits] = useState<Map<string, Habit[]>>(new Map());
	const [uniqueHabits, setUniqueHabits] = useState<Habit[]>([]);
	const [completionHistory, setCompletionHistory] = useState<CompletionHistory>([]);

	useEffect(() => {
		const fetchHabitData = () => {
			fetchTodayHabits();
			fetchHabitsThisWeek();
			fetchCompletionHistory();
			fetchUniqueHabits();
		}
		if (user) { fetchHabitData() }
	}, [user]);


	const refreshHabits = async () => {
		fetchCompletionHistory();
		fetchTodayHabits();
		fetchHabitsThisWeek();
		fetchUniqueHabits();
	}

	/**
	 * Fetches habits from a rolling window of 7 days, and calculates how 
	 * many were completed for each day.
	 */
	const fetchCompletionHistory = async () => {
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
				title: "Error fetching this week's habits",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
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

			setCompletionHistory(listOfCounts)
		}
	}

	/**
	 * Fetches all the habits that the user created.
	 */
	const fetchUniqueHabits = useCallback(async () => {
		setIsLoadingUniqueHabits(true)

		const { data, error } = await supabase
			.from("habits")
			.select("*")
			.eq("user_uid", user?.id)
			.eq("is_parent", true)
			.order("created_at", { ascending: false })

		if (error) {
			console.log("Error fetching all unique habits: ", error)
		}
		else {
			setUniqueHabits(data)
		}

		setIsLoadingUniqueHabits(false)
	}, [user])


	/**
	 * Fetches habits that fall between 12:00 AM and 11:59PM of the current day.
	 */
	const fetchTodayHabits = useCallback(async () => {

		// Convert to UTC dates to match Supabase date types
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
		}
		else {
			setTodayHabits(data);
		}
	}, [user])


	/**
	 * Fetches habits that fall between the monday and sunday of this week.
	 */
	const fetchHabitsThisWeek = useCallback(async () => {
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
				title: "Error updating this week's habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
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

			setWeekHabits(habitsMap);
		}
	}, [user])


	/**
	 * Callback function that updates a habit's title and descriptioon.
	 * @params habit The habit object
	 * @params new_title The new title to update
	 * @params new_description The new description to update
	 */
	const onUpdateHabit = useCallback(async (habit: Habit | null, new_title: string | null, new_description: string | null) => {
		setIsUpdatingHabit(true)

		const parentId = (habit?.parent_id == null) ? habit?.id : habit.parent_id;
		console.log(`Updating habit with title ${new_title} and description ${new_description}`)

		const { data, error } = await supabase
			.from("habits")
			.update({ title: new_title, description: new_description })
			.eq("id", parentId)
			.eq("is_parent", true)
			.eq("user_uid", user?.id)
			.select()

		if (error) {
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
		else {
			console.log("Updated row: ", data)
			addToast({
				title: "Habit Updated",
				description: "It might take a moment to see the changes reflected.",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
		setIsUpdatingHabit(false)

	}, [user])


	/**
	 * Callback function that updates a habit's completed_date. 
	 */
	const onCompleteHabit = useCallback(async (habit: Habit, is_complete: boolean) => {

		const todayUTC = new Date().toISOString()
		const { error } = await supabase
			.from("habits")
			.update({ is_complete: is_complete, completed_date: is_complete ? todayUTC : null })
			.eq("id", habit.id.toString())

		if (!error) {
			const day = new Date(habit.due_date);
			let dayOfWeek = day.toLocaleString("en-US", {
				weekday: "long"
			})

			// Update the completion history graph for today
			const todayNumber = Number(new Date(0, 0, 0, 0).getDay())
			setCompletionHistory(prev => {
				return prev.map((item, index) =>
					index === (6 - todayNumber) ? { ...item, count: (is_complete ? item.count + 1 : (item.count >= 1 ? item.count - 1 : 0)) } : item
				);
			});

			// Update the completed date of the habit in the UI. 
			// No need to do a whole page refresh
			setTodayHabits((prev) =>
				prev?.map((h) =>
					h.id === habit.id ? { ...habit, is_complete: is_complete, completed_date: todayUTC } : h
				)
			);
			setWeekHabits((prev) => {
				if (prev.has(dayOfWeek)) {
					const filtered = prev.get(dayOfWeek)!.map((h) => h.id === habit.id ? { ...habit, is_complete: is_complete, completed_date: todayUTC } : h)
					prev.set(dayOfWeek, filtered);
				}
				return prev;
			});

			if (is_complete) {
				addToast({
					title: "Habit Completed",
					description: "Successfully completed habit!",
					classNames: {
						base: cn(["mb-4 mr-4"])
					}
				});
			}
		} else {
			console.log("Error: ", error)
			addToast({
				title: "Error completing your habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
	}, [])

	/**
	 * Callback function that deletes a unique or parent habit. This effectively 
	 * performs a CASCADE delete on all other children habits that reference it.
	 * 
	 * @params habit The habit to delete
	 */
	const onDeleteUniqueHabit = useCallback(async (habit: Habit) => {
		setIsDeletingHabit(true);

		const { error } = await supabase.rpc("delete_habit", { parent: habit.id })
		if (error) {
			addToast({
				title: "Error deleting your habit",
				description: error.message,
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
		else {
			refreshHabits();

			addToast({
				title: "Habit Deleted",
				description: "Successfully deleted habit!",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}

		setIsDeletingHabit(false);
	}, [user])


	/**
	* Callback function that deletes a habit by deleting its parent habit to 
	* perform a CASCADE delete on all children that reference it.
	* 
	* @params habit The habit to delete
	*/
	const onDeleteHabit = useCallback(async (habit: Habit) => {
		setIsDeletingHabit(true);

		// Delete the parent habit to perform a cascade delete
		const parentId = (habit.parent_id == null) ? habit.id : habit.parent_id;
		const { error } = await supabase.rpc("delete_habit", { parent: parentId })

		if (error) {
			addToast({
				title: "Error d",
				description: "An error occurred while deleting your habit.",
				color: "danger",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}
		else {
			refreshHabits();
			addToast({
				title: "Habit Deleted",
				description: "Successfully deleted habit!",
				classNames: {
					base: cn(["mb-4 mr-4"])
				}
			});
		}

		setIsDeletingHabit(false);
	}, [user]);

	return {
		isAddingHabit,
		isDeletingHabit,
		isUpdatingHabit,
		isLoadingUniqueHabits,
		todayHabits,
		weekHabits,
		uniqueHabits,
		completionHistory,
		refreshHabits,
		setTodayHabits,
		setWeekHabits,
		setIsAddingHabit,
		setIsDeletingHabit,
		fetchUniqueHabits,
		fetchHabitsThisWeek,
		fetchTodayHabits,
		onCompleteHabit,
		onDeleteHabit,
		onDeleteUniqueHabit,
		onUpdateHabit
	};
}


