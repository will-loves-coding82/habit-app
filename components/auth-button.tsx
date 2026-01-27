import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";

/**
 * Dynamic button component that shows different buttons depending on the user's auth status. 
 * If the user is not authenticated, then the function returns a "Sign in" and "Sign up" button.
 * Otherwise, it returns a "Dashboard" button.
 */
export async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      <Button asChild variant="default" size="sm" className="bg-darkBlue text-white hover:bg-darkBlue">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild variant={"outline"} size="sm">
        <Link href="/auth/login">Sign in</Link>
      </Button>

      <Button asChild variant={"default"} size="sm">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
