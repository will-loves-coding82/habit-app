"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useHabits } from "../hooks/useHabits";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { HabitContextProps, HabitContextProviderProps } from "../types";
import { User } from "@supabase/supabase-js";


export const HabitContext = createContext<HabitContextProps | null>(null);

export const HabitProvider  = ({ children }: HabitContextProviderProps) => {

    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
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

export const useHabitContext = () => {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error("useHabitContext must be used within a HabitProvider")
    }
    return context
}