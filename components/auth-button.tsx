import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      {/* Hey, {user.user_metadata.username}! */}
      <Button asChild variant="default">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      {/* <LogoutButton /> */}
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      
      <Button asChild variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
