import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon, HamburgerIcon } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    
    <div className="flex-1 w-full flex flex-col gap-12">

      <div className="w-full max-w-5xl p-5 mx-auto">

        <section>
          <h1 className="text-4xl font-semibold">Welcome, {data.user.user_metadata.username}</h1>
          <p className="text-muted-foreground max-w-sm mt-4">Start tracking and completing your habits for the day to keep up your streaks!</p>

        </section>

        <section className="my-8 bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </section>


      </div>
      
    </div>
  );
}



  // return (
  //   <div className="flex-1 w-full flex flex-col gap-12">
  //     <div className="w-full">
  //       <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
  //         <InfoIcon size="16" strokeWidth={2} />
  //         This is a protected page that you can only see as an authenticated
  //         user
  //       </div>
  //     </div>
  //     <div className="flex flex-col gap-2 items-start">
  //       <h2 className="font-bold text-2xl mb-4">Your user details</h2>
  //       <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
  //         {JSON.stringify(data.user, null, 2)}
  //       </pre>
  //     </div>
  //     <div>
  //       <h2 className="font-bold text-2xl mb-4">Next steps</h2>
  //       <FetchDataSteps />
  //     </div>
  //   </div>
  // );