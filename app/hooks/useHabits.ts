import { useCallback, useEffect, useState } from "react";
import { Habit } from "../dashboard/types";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { getEndOfWeek, getStartOfWeek } from "@/lib/functions";


export function useHabits(user: User | null) {

    const supabase = createClient();
    const [isAddingHabit, setIsAddingHabit] = useState(false);
    const [isDeletingHabit, setIsDeletingHabit] = useState(false);
    const [totalHabits, setTotalHabits] = useState(0);
    const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
    const [weekHabits, setWeekHabits] = useState<Map<string, Habit[]>>(new Map());




    useEffect(() => {

        const fetchData = () => {
            if (user) {
                fetchTotalHabits();
                fetchTodayHabits();
                fetchHabitsThisWeek();
            }
        }
        fetchData();
    }, [user]);


    const fetchTotalHabits = useCallback(async () => {
        const { data, error } = await supabase.rpc("count_distinct_habits")
        if (error) {
            console.log('Error getting total count of habits: ', error)
        }
        else {
            setTotalHabits(data)
        }
    }, [user])


    const fetchTodayHabits = useCallback(async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to the beginning of today

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const { data, error } = await supabase
            .from("habits")
            .select("*")
            .eq("user_uid", user?.id)
            .gte("due_date", today.toISOString())
            .lt("due_date", tomorrow.toISOString())
            .order("due_date", { ascending: false });

        if (error) {
            addToast({
                title: "Error",
                description: "An error occurred while fetching today's habits.",
                color: "danger",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });
        }

        else {
            console.log("Today habits: ", data)
            setTodayHabits(data);
        }
    }, [user])


    const fetchHabitsThisWeek = useCallback(async () => {
        const date = new Date();
        const weekStart = getStartOfWeek(date).toISOString();
        const weekEnd = getEndOfWeek(date).toISOString();

        const { data, error } = await supabase
            .from("habits")
            .select("*")
            .eq("user_uid", user?.id)
            .gte("due_date", weekStart)
            .lte("due_date", weekEnd)
            .order("due_date", { ascending: false })

        if (error) {
            addToast({
                title: "Error",
                description: "An error occurred while updating this week's habit.",
                color: "danger",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });
        }

        else {
            console.log("habits this week: ", data)
            let habitsMap = new Map();

            // Organize habits by days in the week
            data.forEach((habit: Habit) => {
                let date = new Date(habit.due_date);
                let day = date.toLocaleString("en-US", {
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


    const onCompleteHabit = useCallback(async (habit: Habit, is_complete: boolean) => {

        const completed_date = is_complete ? new Date().toISOString() : null;

        const { error } = await supabase
            .from("habits")
            .update({ is_complete: is_complete, completed_date: completed_date })
            .eq("id", habit.id.toString());

        if (!error) {

            
            setTodayHabits((prev) =>
                prev?.map((h) =>
                    h.id === habit.id ? { ...habit, is_complete, completed_date } : h
                )
            );

            let day = new Date(habit.due_date)
            let dayOfWeek = day.toLocaleString("en-US", {
                weekday: "long"
            })
          
            setWeekHabits((prev) => {
                if (prev.has(dayOfWeek)) {
                    const filtered = prev.get(dayOfWeek)!.map((h) =>   h.id === habit.id ? { ...habit, is_complete, completed_date } : h)
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
                title: "Error",
                description: "An error occurred while updating your habit.",
                color: "danger",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });
        }
    }, [])


    const onDeleteHabit = useCallback(async (habit: Habit) => {
        setIsDeletingHabit(true);

        // Delete the parent habit to perform a cascade delete
        const parentId = (habit.parent_id == null) ? habit.id : habit.parent_id;
        const { error } = await supabase.rpc("delete_habit", { parent: parentId })

        if (error) {
            addToast({
                title: "Error",
                description: "An error occurred while deleting your habit.",
                color: "danger",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });
        }

        else {
            addToast({
                title: "Habit Deleted",
                description: "Successfully deleted habit!",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });

            let day = new Date(habit.due_date)
            let dayOfWeek = day.toLocaleString("en-US", {
                weekday: "long"
            })

            setWeekHabits((prev) => {
                if (prev.has(dayOfWeek)) {
                    const filtered = prev.get(dayOfWeek)!.filter(h => (h.id != habit.id) || (h.parent_id != habit.parent_id));
                    if (filtered.length == 0) {
                        prev.delete(dayOfWeek);
                    }
                    prev.set(dayOfWeek, filtered);
                }
                
                return prev;
            });

            setTodayHabits(prev => prev.filter((h) => (h.id !== habit.id) || (h.parent_id != habit.parent_id)))

        }

        setIsDeletingHabit(false);
    }, []);




    return {
        isAddingHabit,
        isDeletingHabit,
        totalHabits,
        todayHabits,
        weekHabits,
        setTodayHabits,
        setWeekHabits,
        setIsAddingHabit,
        setIsDeletingHabit,
        fetchTotalHabits,
        fetchHabitsThisWeek,
        fetchTodayHabits,
        onCompleteHabit,
        onDeleteHabit
    };


}