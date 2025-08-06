"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserContextProps } from "../types";
import { User } from "@supabase/supabase-js";


export const UserContext = createContext<UserContextProps | null>(null);

export default function UserProvider ({ children }: {children: React.ReactNode}) {

    const [user, setUser] = useState< User | null>(null);
    const [isLoadingUser, setisLoadingUser] = useState(true);
    
    const supabase = createClient();

    const fetchUserData = async () => {
        setisLoadingUser(true)

        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) { throw error }
            else {
                setUser(data.user);
                console.log("setting user:", data.user)
            }
        }
        catch (error) {
            console.log("Error fetching user: ", error)
        }
        finally {
            setisLoadingUser(false)
        }
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
    if (!context) {
        throw new Error("useHabitContext must be used within a UserProvider")
    }
    return context
}