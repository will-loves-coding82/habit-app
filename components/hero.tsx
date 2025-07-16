
export function Hero() {
  return (
    <div className="flex flex-col gap-4 lg:gap-4 items-center mt-4 lg:mt-12">
     <p className="text-darkBlue text-xl mb-[-12px] font-medium">Stacked</p>
      <h1 className="text-6xl text-center line-height-0 font-semibold max-w-md">Your personal AI habit tracker</h1>
      <p className="text-muted-foreground text-base max-w-md lg:text-lg max-w-[600px] text-center px-12">
        Stay motivated and organized with a personal LLM assistant to track and crush your goals.</p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
