import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";


/**
 * Reusable custom hook that manages streak logic.
 */
export function useStreaks(user: User | null) {

    const supabase = createClient();
    const [streak, setStreak] = useState(0);
    const [hasStreak, setHasStreak] = useState(true);


    useEffect(() =>{
        if (user) {
            fetchStreak();
        }
    }, [user])

     /**
     * Fetches the user's current streak.
     */
    const fetchStreak = async () => {

        const { data, error } = await supabase
            .from("streaks")
            .select("streak")
            .eq("user_uid", user!!.id)
            .limit(1)

        if (error) {
            console.log("Error getting streaks: ", error)
            setHasStreak(false);
        }

        if (data && data.length > 0) {
            setStreak(data[0].streak);
            setHasStreak(true);
        }
        else {
            console.log("Streak for user doesnt exist in DB")
            setHasStreak(false);
        }
    }

     /**
     * Initializes a streak to 0 for a user. This is helpful when a user is 
     * provisioned but their streak wasn't properly created in the beginning.
     */
    const initializeStreak = async () => {
        const supabase = await createClient();
        const { error } = await supabase
            .from("streaks")
            .insert({ streak: 0, user_uid: user!!.id })

        if (error) {
            console.log("error initializing streak: ", error);
        }
        else {
            await fetchStreak()
        }
    }


    return { streak, hasStreak, setStreak, setHasStreak, fetchStreak, initializeStreak }



}