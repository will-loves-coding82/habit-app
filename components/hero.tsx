
export function Hero() {
  return (
    <div className="flex flex-col gap-4 lg:gap-8 items-center">
     <p className="text-darkBlue text-xl mb-[-12px]">Habit</p>
      <h1 className="text-4xl px-24 md:text-6xl font-semibold max-w-[700px] text-center">The AI Habit Tracker</h1>
      <p className="text-muted-foreground text-base lg:text-lg max-w-[600px] text-center  px-12">
        Build habits that stick with Habit, the AI-powered habit tracker that
        helps you stay on track and achieve your goals.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
