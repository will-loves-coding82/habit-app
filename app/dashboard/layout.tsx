import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { DashboardAuthButton } from "@/components/dashboard-auth-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu } from "lucide-react";
import HabitProvider from "../context/habit-context";
import UserProvider from "../context/user-context";
import ToastProviders from "./toast-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <main>
      <div className="flex-1 w-full flex flex-col items-center">

        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-14">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">

            <span className="flex gap-2 items-center w-[180px]">
              <Link href={"/"} className="text-base font-medium">Stacked</Link>
            </span>

            <DropdownMenu >
              <DropdownMenuTrigger>
                <Menu size={24} className="bg-muted p-1 text-primary w-6 h-6 p-1 rounded-md border-b border-b-foreground/10" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href={"/dashboard"} className="text-sm">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/dashboard/profile"} className="text-sm">Profile</Link>
                </DropdownMenuItem>

                <DropdownMenuItem>
                  <DashboardAuthButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>

        <UserProvider>
          <HabitProvider>
            <ToastProviders>
              {children}
            </ToastProviders>
          </HabitProvider>
        </UserProvider>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>

      </div>
    </main>
  );
}
