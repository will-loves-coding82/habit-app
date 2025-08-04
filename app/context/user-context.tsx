"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useHabits } from "../hooks/useHabits";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { HabitContextProps, UserContextProps } from "../types";
import { User } from "@supabase/supabase-js";


export const UserContext = createContext<UserContextProps | null>(null);

export default function UserProvider ({ children }:   {children: any}) {

    const [user, setUser] = useState< User | null>(null);
    const [isLoadingUser, setisLoadingUser] = useState(true);
    
    const supabase = createClient();

    const fetchUserData = async () => {
        setisLoadingUser(true)

        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
            redirect("/auth/login");
        }
        else {
            setUser(data.user);
            console.log("setting user:", data.user)
        }
        setisLoadingUser(false)
    }

    useEffect(() => {
        fetchUserData()
    }, [])


    return (
        <UserContext.Provider value={{user: user!!, isLoadingUser: isLoadingUser}}>
            {children}
        </UserContext.Provider>
    )
}

export const useUserContext = () => {
    const context = useContext(UserContext);
    // if (!context) {
    //     throw new Error("useUserContext must be used within a UserProvider")
    // }
    return context
}