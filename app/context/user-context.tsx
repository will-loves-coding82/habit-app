"use client";

import { createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";

export interface UserContextProps {
	user: User | null;
	isLoadingUser: boolean;
}

export const UserContext = createContext<UserContextProps | null>(null);
const supabase = createClient();

/**
 * UserProvider is a custom context provider that manages the user's data.
 * This acts as a global store for any React children that want to 
 * consume or read the information without prop drilling.
 */
export default function UserProvider({ children }: { children: React.ReactNode }) {

	const {data: user, isLoading: isLoadingUser} = useQuery<User | null, Error>({
		queryKey: ["user"],
		queryFn: async() => {
			const { data: supabaseData, error } = await supabase.auth.getUser();
			if (error) throw error;
			return supabaseData.user ?? null;
		},
		retry: true,
	})

	return (
		<UserContext.Provider value={{ user: user ?? null, isLoadingUser: isLoadingUser }}>
			{children}
		</UserContext.Provider>
	)
}

// Shared method that child components can invoke to access the context values
export const useUserContext = () => {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error("useUserContext must be used within a UserProvider")
	}
	return context;
}