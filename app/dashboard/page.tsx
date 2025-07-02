"use client";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { InfoIcon, HamburgerIcon } from "lucide-react";
import { Tab, Tabs } from "@heroui/tabs";
import {Skeleton} from "@heroui/skeleton";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/modal";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";

export default function DashboardPage() {

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setisLoadingUser] = useState(true);
  const [selected, setSelected] = useState("Today");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // form states
  const [title, setTitle] = useState("");


  const fetchData = async () => {
    setisLoadingUser(true); 
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();  
    
    if (error || !data?.user) {
      redirect("/auth/login");
    }
    else {
      setUser(data.user);
    }
    setisLoadingUser(false);
  }
 
  useEffect(() => {
    const fetch = async () => {
      await fetchData();
    };
    fetch();
  }, []);


  const handleSubmit = (e: React.FormEvent) => {

  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">

  
      <div className="w-full max-w-5xl px-5 mx-auto">
        <section>
          {isLoadingUser ? 
            <Skeleton className="rounded-lg w-80">
              <div className="h-12 bg-accent"/>
            </Skeleton>
            :
            <h1 className="text-4xl font-semibold">Welcome, {user?.user_metadata.username}</h1>
          }
          <p className="text-muted-foreground max-w-sm mt-4">Start tracking and completing your habits for the day to keep up your streaks!</p>

        </section>

        <section className="my-8 bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated user
        </section>

        <section className="flex items-center gap-3 justify-between">
          <Tabs key="tournament_type" aria-label="Options" variant="light" color="default" className="flex flex-col mx-0" classNames={{cursor: "bg-accent"}} selectedKey={selected} onSelectionChange={(key)=>setSelected(key.toString())}>
            <Tab key="Today" title="Today" className="w-fit"/>
            <Tab key="This Week" title="This Week" className="w-fit"/>
          </Tabs>


          <Modal isOpen={isModalOpen} className="bg-card" onClose={() => setIsModalOpen(false)}>
            <ModalContent>
              <ModalHeader className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add a habit</h2>
  
              </ModalHeader>
              <ModalBody>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        className="bg-muted-foreground text-foreground"
                        id="title"
                        type="text"
                        placeholder="title"
                        value={""}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      </div>
                  </div>
                </form>
              </ModalBody>
              <ModalFooter>
                <Button variant="destructive" onClick={() => setIsModalOpen(false)}>Close</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>


          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
            Add Habit
          </Button>

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