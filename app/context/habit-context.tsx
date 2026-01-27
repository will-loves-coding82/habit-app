"use client";

import { createContext, useContext } from "react";
import { useHabits } from "../hooks/useHabits";
import { HabitContextProps } from "../types";
import { useUserContext } from "./user-context";

export const HabitContext = createContext<HabitContextProps | null>(null);

/**
 * HabitProvider is a custom context provider that manages the user's habits.
 * Children have acess to accessible hooks to update or retrieve their data.
 */
export default function HabitProvider({ children }: { children: React.ReactNode }) {

	const { ...userProps } = useUserContext();
	const { ...habitHook } = useHabits(userProps.user!!);

	return (
		<HabitContext.Provider value={habitHook}>
			{children}
		</HabitContext.Provider>
	);
}

// Shared method that child components can invoke to access the context values
export const useHabitContext = () => {
	const context = useContext(HabitContext);
	if (!context) {
		throw new Error("useHabitContext must be used within a HabitProvider")
	}
	return context;
}
