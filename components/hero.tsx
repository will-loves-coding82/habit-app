"use client";
import Image from "next/image";
import { useTheme } from "next-themes";

export function Hero() {

  const theme = useTheme();
  return (

    <section className="px-5 w-full max-w-5xl p-8 mx-auto mt-12 md:h-[75vh] rounded-lg lg:px-0 text-center">
      <Image
        src={ theme.resolvedTheme == "dark" ? "/chips-dark.png" : "/chips-light.png"}
        alt="timeline image"
        objectFit="contain"
        width={800}
        height={800}
        className="max-w-xs mx-auto mb-12"
      />
      <h2 className="font-semibold text-4xl md:text-6xl max-w-md mx-auto">Stacked <br /> makes habits simple.</h2>
      <p className="text-muted-foreground text-base max-w-md lg:text-lg max-w-[600px] mt-2 mx-auto">
        Stay motivated and organized with a personal LLM assistant to track and crush your goals.
      </p>
    </section>


  );
}
