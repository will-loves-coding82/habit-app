"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export async function DashboardAuthButton() {
	const router = useRouter();
	const logout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
	};

	return (
		<Button onClick={logout} className="text-sm text-muted">Logout</Button>
	)
}