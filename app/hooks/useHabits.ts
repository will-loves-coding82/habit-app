"use client";

import { use, useCallback, useEffect, useState } from "react";
import { CompletionHistory, Habit } from "../types";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { calculateBaseWeekDays, getEndOfWeek, getStartOfWeek } from "@/lib/functions";
import { redirect } from "next/navigation";


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
        if (user) {fetchHabitData()}
    }, [user]);


    const refreshHabits =  async() => {
        console.log("refreshing habit data. User is: ", user)
        fetchCompletionHistory();
        fetchTodayHabits();
        fetchHabitsThisWeek();
        fetchUniqueHabits();
    }


    // Rolling window of habits from past 7 days
    const fetchCompletionHistory= async() => {

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today.getDate() + 1)
        const lastWeek = new Date(today);
        lastWeek.setDate(today.getDate() - 6);


        const {data, error} = await supabase
            .from("habits")
            .select("due_date, is_complete")
            .eq("user_uid", user?.id)
            .gte("due_date", lastWeek.toISOString())
            .order("due_date", { ascending: true })

        if (error) {
            console.log("error getting habits over past week: ", error)
        }

        else {
            console.log("raw completion data: ", data)

            const mapOfCounts = new Map<string, number>();

            data.forEach(row => {
                const dueDate = new Date(row.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));
                const day = dueDate.toLocaleString("en-US", {
                    weekday: "short"
                })
                const count = mapOfCounts.get(day)
                if (!count && row.is_complete) {
                    mapOfCounts.set(day, 1)
                }
                else if (count) {
                    mapOfCounts.set(day, count + 1)
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
            console.log("base week days: ", baseWeekDays)           
            const listOfCounts = baseWeekDays.map(day => ({
                day: day,
                count: mapOfCounts.get(day) || 0,
            }));

            console.log("completion history: ", listOfCounts)    
            setCompletionHistory(listOfCounts)
        }
    }


    const fetchUniqueHabits = useCallback(async() => {
        setIsLoadingUniqueHabits(true)

        const { data, error } =  await supabase
            .from("habits")
            .select("*")
            .eq("user_uid", user?.id)
            .eq("is_parent", true)
            .order("created_at", {ascending: false})

        if (error) {
            console.log("Error fetching all unique habits: ", error)
        }
        else {
            console.log("unique habits: ", data)
            setUniqueHabits(data)
        }

        setIsLoadingUniqueHabits(false)
        
    }, [user])

    const fetchTodayHabits = useCallback(async () => {

        const now = new Date()
        const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
        
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

        const weekStart = getStartOfWeek().toISOString();
        const weekEnd = getEndOfWeek().toISOString();

        console.log(`fetching this week habits. Start: ${weekStart}\n End: ${weekEnd}`)

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
                // let date = new Date(habit.due_date);
                const date = new Date(habit.due_date.replace(/([+-]\d{2}:\d{2}|Z)$/, ''));

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


    const onUpdateHabit = useCallback(async(habit: Habit | null, new_title: string | null, new_description: string | null) => {
        setIsUpdatingHabit(true)
        
        const parentId = (habit?.parent_id == null) ? habit?.id : habit.parent_id;
        console.log(`Updating habit with title ${new_title} and description ${new_description}`)

        const { data, error } = await supabase
            .from("habits")
            .update({title: new_title, description: new_description})
            .eq("id", parentId)
            .eq("is_parent", true)
            .eq("user_uid", user?.id)
            .select()

        if (error) {
            console.log("Error updating habit")
            addToast({
                title: "Error",
                description: "An error occurred while updating your habit.",
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

    const onCompleteHabit = useCallback(async (habit: Habit, is_complete: boolean) => {

        const todayNumber = Number(new Date(0,0,0,0).getDay())
        const now = new Date();
        const localUTC = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const localISO = localUTC.toISOString()

        if (is_complete) {
            console.log(`setting habit ${habit.title} completed date to: ${localUTC.toISOString()}`)
        }
        const { error } = await supabase
            .from("habits")
            .update({ is_complete: is_complete, completed_date: is_complete ? localISO : null })
            .eq("id", habit.id.toString())
            
        if (!error) {

            // Update the completion history graph for today
            setCompletionHistory(prev => {
                return prev.map((item, index) => 
                    index === (6-todayNumber) ? { ...item, count: (is_complete ? item.count + 1  : (item.count >= 1 ? item.count - 1 : 0))} : item
                );
            });
            
            setTodayHabits((prev) =>
                prev?.map((h) =>
                    h.id === habit.id ? { ...habit, is_complete: is_complete, completed_date: localISO  } : h
                )
            );

            let day = new Date(habit.due_date)
            let dayOfWeek = day.toLocaleString("en-US", {
                weekday: "long"
            })
          
            setWeekHabits((prev) => {
                if (prev.has(dayOfWeek)) {
                    const filtered = prev.get(dayOfWeek)!.map((h) =>   h.id === habit.id ? { ...habit, is_complete: is_complete, completed_date: localISO } : h)
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

    const onDeleteUniqueHabit = useCallback(async (habit: Habit) => {
        setIsDeletingHabit(true);

        const { error } = await supabase.rpc("delete_habit", { parent: habit.id })
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

    },[user])

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


