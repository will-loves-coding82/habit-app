import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Label } from "@radix-ui/react-dropdown-menu";
import { Input } from "postcss";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">

      <div className="flex-1 w-full flex flex-col gap-20 items-center">

        <nav className="w-full flex justify-center bg-background border-b border-b-foreground/10 h-12 fixed">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">

              <Link href={"/"} className="text-base font-medium">Stacked</Link>
              
              {/* <div className="mx-auto justify-start max-w-lg w-full">
                <Link href={"/"} className="text-base">How it works</Link>
              </div> */}
            <AuthButton />
          </div>
        </nav>


        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 mt-24">
          <Hero />

          <main className="flex-1 flex flex-col gap-6 px-4 h-full">
            <h2 className="font-medium text-2xl mb-4 text-center">How it Works</h2>
            {/* {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />} */}
          </main>

        </div>


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
