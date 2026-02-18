
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import Image from "next/image";
import { Hero } from "@/components/hero";

export default function Home() {
  return (
    <section className="min-h-screen flex flex-col items-center overflow-y-auto">

      <div className="w-full flex flex-col gap-20 items-center">

        <nav className="w-full flex justify-center bg-background/90 backdrop-blur-xl border-b border-b-foreground/10  h-14 fixed">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <span className="flex gap-2 items-center">
              <Link href={"/"} className="text-base font-medium">Stacked</Link>
            </span>
            <AuthButton />
          </div>
        </nav>

        <section className="flex flex-col gap-20 p-0 mt-24 w-full">

          <Hero />

          <section className="flex flex-col gap-8 items-center md:max-w-lg lg:max-w-5xl mx-auto my-16 px-5 md:px-16 lg:grid lg:grid-cols-2 lg:gap-12">
            <div className="max-w-[500px] mt-12">
              <Image
                src={"/timeline-dark.png"}
                alt="timeline image"
                objectFit="contain"
                width={800}
                height={800}
                className="rounded-xl"
              />
            </div>

            <article className="text-left w-full pl-2 lg:mx-auto" >
              <h3 className="text-2xl font-semibold">How do habits work?</h3>
              <p className="text-muted-foreground mt-4 max-w-sm">
                Complete your habits each day to raise your streaks. <br /> <br />
                Be careful not to wait too long or else your habits will be marked as late!
              </p>
            </article>
          </section>

          <section className="flex flex-col gap-8 items-center md:max-w-lg lg:max-w-5xl mx-auto my-16 px-5 md:px-16 lg:grid lg:grid-cols-2 lg:gap-12">
            <article className="text-left w-full">
              <p className="text-darkBlue">AI Chatbot</p>
              <h2 className="max-w-sm text-4xl font-semibold md:text-6xl">Your personal <br /> LLM <br /> assistant.</h2>
              <p className="text-muted-foreground max-w-sm mt-8">
                Built with ChatGPT 4.1 mini to provide helpful insights about your habit data.
              </p>
            </article>

            <div className="max-w-[500px]" >
              <Image
                src={"/chat-snippet-dark.png"}
                alt="chat snippet"
                objectFit="contain"
                width={800}
                height={800}
                className="rounded-md"
              />
            </div>
          </section>

          <section className="flex flex-col gap-8 items-center md:max-w-lg lg:max-w-5xl mx-auto my-16 px-5 md:px-16">
            <article className="text-center mx-atuo">
              <h3 className="text-2xl font-semibold">Simple Statistics</h3>
              <p className="text-muted-foreground max-w-sm mt-4">
                Focus on the essentials with a dashboard that
                keeps up with your progress.
              </p>
            </article>

            <div className="max-w-[700px]">
              <Image
                src={"/dashboard-stats-dark.png"}
                alt="dashboard stats"
                objectFit="contain"
                width={800}
                height={800}
                className="rounded-xl"
              />
            </div>
          </section>
        </section>

        <footer className="w-full flex items-center justify-center border-t mx-auto mt-20 text-center text-xs gap-8 py-16">
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
    </section>
  );
}
