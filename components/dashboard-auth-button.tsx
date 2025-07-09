import { createClient } from "@/lib/supabase/server";
import { Button } from "./ui/button";
import Link from "next/link";
import { LogoutButton } from "./logout-button";


export async function DashboardAuthButton() {
    const supabase = await createClient();
    const {
        data: {user}
    } = await supabase.auth.getUser();  

    return  (
        <div className="flex items-center gap-4">
            {/* <p>Hey, {user!.user_metadata.username}!</p> */}
            <LogoutButton/>
        </div>
    )
    
}