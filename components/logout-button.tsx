"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return <p onClick={logout} className="text-sm text-primary">Logout</p>
  // return <LogOut onClick={logout} className="bg-muted p-1 text-primary w-6 h-6 p-1 rounded-md border-b border-b-foreground/10 hover:cursor-pointer"   />;
}
