
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Brain, Calendar, ChartLine } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Home() {


  return (
    <main className="min-h-screen flex flex-col items-center overflow-y-auto">

      <div className="w-full flex flex-col gap-20 items-center">

        <nav className="w-full flex justify-center bg-background/90 backdrop-blur-xl border-b border-b-foreground/10  h-14 fixed">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <span className="flex gap-2 items-center">
              {/* <Image src="/logo.png" alt="stacked logo" width={24} height={24} /> */}
              <Link href={"/"} className="text-base font-medium">Stacked</Link>
            </span>
            <AuthButton />
          </div>
        </nav>


        <main className="flex flex-col gap-20 p-0 mt-24 w-full">

      
          {/* Feature Overview */}
          <section className="px-5">
            <div className="w-full max-w-5xl p-8 mx-auto mt-12 mb-20 h-fit rounded-lg lg:px-0">
              <h2 className="font-medium text-4xl md:text-6xl max-w-xl">Stacked makes habits simple.</h2>
  
              <div className="flex flex-col justify-between mt-8 gap-4 lg:flex-row md:mt-16 gap-12" >

                <div className="flex flex-col gap-4 p-8 rounded-lg border-2 light:border-accent dark:border-0 dark:shadow-md dark:shadow-accent">
                  <span className="p-2 rounded-lg border-accent border-2 w-fit"><ChartLine className="text-muted-foreground"  size={24}/></span>
                  <span>
                    <p className="text-xl font-semibold line-height-0">Streamlined dashboard</p>
                    <p className="text-muted-foreground mt-2 text-sm">View your statistics and habits in one location.</p>
                  </span>
                </div>

                <div className="flex flex-col gap-4 p-8 rounded-lg border-2 light:border-accent dark:border-0 dark:shadow-md dark:shadow-accent">
                    <span className="p-2 rounded-lg border-accent border-2 w-fit"><Calendar className="text-muted-foreground" size={24}/></span>
                    <span>
                      <p className="text-xl font-semibold bg-z">Stay consistent</p>
                      <p className="text-muted-foreground mt-2 text-sm">Complete your habits on time each day to raise your streaks.</p>
                    </span>
                </div>

                  <div className="flex flex-col gap-4 bg-accent p-8 rounded-lg ">
                    <span className="p-2 rounded-lg w-fit"><Brain className="text-muted-foreground"  size={24}/></span>
                    <span>
                      <p className="text-xl font-semibold">Interactive AI</p>
                      <p className="text-muted-foreground mt-2 text-sm">Stacked is powered by ChatGPT to help you gather deeper insight into your habits.</p>
                    </span>
                </div>

              </div>
{/* 
                      <div className="px-8 shadow-slate-200 w-full mt-12 lg:px-0">
                      <Image
                        src={"/dashboard-light.png"}
                        alt="dashboard image"
                        objectFit="contain"
                        width={800}
                        height={800}
                        className="rounded-md shadow-lg w-full border-2"
                      />
                    </div> */}
            </div>
            
          </section>

          

          <section className="w-full bg-accent h-fit py-20 mt-20 mb-20 text-center">
            <h2 className="font-medium px-5 text-center text-4xl md:text-6xl">How it works</h2>
            <p className="max-w-lg mx-auto md:mt-6 p-5 text-muted-foreground">
              Stacked operates on top of a serverless architecture using Supabase, driving automated workflows that 
              become the habits you see appear each day and week. We also bring the power of ChatGPT at your doorstep so you 
              can ask AI about your data.
            </p>

            <Image src="/chat-messages.png" alt="chat messages" width={700} height={400} className="mx-auto mt-12 px-8" />

          </section>


          <section className="w-full text-center mt-20">
            <h2 className="text-center text-6xl font-medium">Get motivated!</h2>
            <p className="text-muted-foreground">Start tracking your habits today</p>
            <div className="flex mx-auto w-fit mt-8">
              <AuthButton />
            </div>


          </section>


        </main>


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
    </main>
  );
}



