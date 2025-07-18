"use client";
import Image from "next/image";
import { useTheme } from "next-themes";

export function Hero() {

  const theme = useTheme();
  return (

    <section className="w-full px-5 max-w-5xl mx-auto flex flex-col md:p-5 justify-between text-left items-center mt-4 lg:mt-12" >

        <div className="flex flex-col gap-4 max-w-lg text-center">
        <p className="text-darkBlue text-xl mb-[-12px] font-medium">Stacked</p>
        <h1 className="text-4xl md:text-6xl line-height-0 font-medium">Your personal AI habit tracker.</h1>
        <p className="text-muted-foreground text-base max-w-md lg:text-lg max-w-[600px] mx-auto">
          Stay motivated and organized with a personal LLM assistant to track and crush your goals.
        </p>
      </div>


      <div className="px-8 shadow-slate-200 w-full mt-12 lg:px-0 max-w-4xl">
        <Image
          src={theme.resolvedTheme == "dark" ? "/dashboard-light.png" : "/dashboard-light.png"}
          alt="dashboard image"
          objectFit="contain"
          width={800}
          height={800}
          className="rounded-md shadow-lg w-full border-2"
        />
      </div>
      
      {/* <div className="flex flex-col gap-4 max-w-sm text-center lg:text-left">
        <p className="text-darkBlue text-xl mb-[-12px] font-medium">Stacked</p>
        <h1 className="text-7xl line-height-0 font-semibold max-w-md">Your personal AI habit tracker.</h1>
        <p className="text-muted-foreground text-base max-w-md lg:text-lg max-w-[600px]">
          Stay motivated and organized with a personal LLM assistant to track and crush your goals.
        </p>
      </div>


      <div className="px-8 shadow-slate-200 w-full mt-12 rounded-lg px-10 border border-accent border-2 lg:w-[480px] lg:mt-0 lg:px-0">
        <Image
          src={theme.resolvedTheme == "dark" ? "/dashboard-dark.png" : "/dashboard-light.png"}
          alt="dashboard image"
          layout="responsive"
          objectFit="fill"
          width={400}
          height={400}
          className="rounded-lg shadow-lg"
        />
      </div> */}

    </section>



  );
}
