
export function Hero() {
  return (
    <div className="flex flex-col gap-4 lg:gap-8 items-center mt-12">
     {/* <p className="text-darkBlue text-xl mb-[-12px]">Hello</p> */}
      <h1 className="text-4xl px-24 md:text-6xl font-semibold max-w-[700px] text-center">Habit Tracking Simplified</h1>
      <p className="text-muted-foreground text-base lg:text-lg max-w-[600px] text-center  px-12">
        Stay motivated and organized with Habit. Track your progress, crush your goals, and leverage an RAG assistant to find and learn more about your habits.</p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
