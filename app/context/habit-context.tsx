"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useHabits } from "../hooks/useHabits";
import { HabitContextProps } from "../types";
import { useUserContext } from "./user-context";


export const HabitContext = createContext<HabitContextProps | null>(null);

export default function HabitProvider ({ children }: {children: React.ReactNode}) {

    const { ...userProps} = useUserContext();
    const { ...habitHook } = useHabits(userProps.user!!);

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