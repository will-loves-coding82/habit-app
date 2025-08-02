"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useHabits } from "../hooks/useHabits";
import { createClient } from "@/lib/supabase/client";

const HabitContext = createContext();

export const HabitProvider = ({ children }) => {

    const supabase = createClient();
    const [user, setUser] = useState(null);
    const { ...habitHook } = useHabits(user);


    const fetchUserData = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
            redirect("/auth/login");
        }
        else {
            setUser(data.user);
        }
    }

    useEffect(() => {
        fetchUserData();
    }, [])

    return (
        <HabitContext.Provider value={habitHook}>
            {children}
        </HabitContext.Provider>
    )
}

export const useHabitContext = () => useContext(HabitContext);