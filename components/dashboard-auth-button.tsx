import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function DashboardAuthButton() {
	const supabase = await createClient();
	const {
		data: { user }
	} = await supabase.auth.getUser();

	return (
		<div className="flex items-center gap-4 hover:cursor-pointer">
			<LogoutButton />
		</div>
	)
}