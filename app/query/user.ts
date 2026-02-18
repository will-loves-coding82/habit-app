"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { queryOptions, useQuery } from "@tanstack/react-query";

const supabase = createClient();

function getUser() {
	return queryOptions<User, Error>({
		queryKey: ["user"],
		queryFn: async () => {
			const { data: supabaseData, error } = await supabase.auth.getUser();
			if (error) throw error;
			return supabaseData.user ?? null;
		},
		retry: true,
	})
}

export default {
	getUser
}