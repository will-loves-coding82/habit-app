"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tab, Tabs } from "@heroui/tabs";
import { Skeleton } from "@heroui/skeleton";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@heroui/form";
import { useActionState, useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { DateValue, getLocalTimeZone, now } from "@internationalized/date";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { addToast } from "@heroui/toast";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { CircularProgress } from "@heroui/progress";
import { createHabitAction, CreateHabitFormState } from "./actions";
import { cn } from "@heroui/theme";
import { ChatMessage } from "./types";
import HabitCard from "@/components/habit-card";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { ArrowRight, BotMessageSquare, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useHabits } from "../hooks/useHabits";
import { useStreaks } from "../hooks/useStreaks";

export default function DashboardPage() {

  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setisLoadingUser] = useState(true);
  const [selected, setSelected] = useState("Today");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    isAddingHabit,
    isDeletingHabit,
    totalHabits,
    todayHabits,
    weekHabits,
    setIsAddingHabit,
    setIsDeletingHabit,
    fetchTotalHabits,
    fetchHabitsThisWeek,
    fetchTodayHabits,
    onCompleteHabit,
    onDeleteHabit
  } = useHabits(user);

  const {
    streak,
    hasStreak,
    setStreak,
    setHasStreak,
    fetchStreak,
    initializeStreak
  } = useStreaks(user);

  const [formState, formAction] = useActionState(createHabitAction, {} as CreateHabitFormState);
  const [formData, setFormData] = useState<{
    title: string,
    description: string,
    due_date: DateValue | null,
    is_weekly: boolean
  }>({
    title: "",
    description: "",
    due_date: null,
    is_weekly: false,
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (chatInput && chatInput.trim() !== "") {

      const trimmedInput = chatInput.trim();
      const userMessage: ChatMessage = {
        created_at: new Date().toLocaleString(),
        role: "user",
        content: trimmedInput,
        chat_id: chatId!!
      }


      setChatMessages(prev => [...prev, userMessage])
      setChatInput("");

      const { data, error } = await supabase.functions.invoke("generate-ai-answer", {
        body: JSON.stringify({
          userPrompt: chatInput,
          chatId: chatId,
          userId: user!!.id,
          timezone: getLocalTimeZone()
        }),
        method: 'POST'
      });


      if (error) {
        console.log("Error generating ai response: ", error)
      }
      else {
        const aiMessage: ChatMessage = {
          created_at: new Date().toLocaleString(),
          role: "assistant",
          content: data.body.finalResponse, // or data.body.finalResponse.content if it's nested
          chat_id: chatId!!
        };

        console.log(data.body.finalResponse)
        setChatMessages(prev => [...prev, aiMessage])
      }
    }

  }


  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setChatInput(value);
  };

  const handleDueDateChange = (value: DateValue | null) => {
    if (value == null) {
      return
    }
    setFormData((prevData) => ({
      ...prevData,
      due_date: value,
    }));
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const fetchUserData = async () => {

    setisLoadingUser(true);
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      redirect("/auth/login");
    }
    else {
      setUser(data.user);
    }
    setisLoadingUser(false);
  }

  async function fetchChat(): Promise<number | null> {

    const { data, error } = await supabase
      .from("chats")
      .select("id")
      .eq("user_uid", user!!.id)
      .maybeSingle()

    if (error) {
      addToast({
        title: "Error",
        description: "An error occurred while fetching chats.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });

      return null;
    }

    console.log("User belongs to chatId: ", data?.id)
    return data?.id ?? null;
  }

  const openChat = async () => {

    if (chatMessages.length > 0 || chatId != null) {
      return;
    }

    // check if user has a chat
    const chat =  await fetchChat();

    if (chat == null) {
      const { error } = await supabase.from("chats")
        .insert({
          user_uid: user!!.id
        })
      if (error) {
        addToast({
          title: "An error occured creating your chat",
          description: error.message,
          color: "danger",
          classNames: {
            base: cn(["mb-4 mr-4"])
          }
        });
      }
      else {
        // TODO: Create an edge function that will return the created chat id to avoid refetching
        console.log("successfully created new chat")
        const chat = await fetchChat();
        setChatId(chat);
      }

    } else {

      setChatId(chat);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat)

      if (error) {
        addToast({
          title: "An error occured fetching messages",
          description: error.message,
          color: "danger",
          classNames: {
            base: cn(["mb-4 mr-4"])
          }
        });
      }

      else {
        console.log("Chat messages: ", data)
        setChatMessages(data)
      }
    }
  }


  const refreshData = () => {
    clearForm();
    fetchTodayHabits();
    fetchHabitsThisWeek();
    fetchTotalHabits();
    fetchStreak();
  }

  const clearForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: null,
      is_weekly: false,
    });
  }

  const scrollToBottomOfChat = () => {
    if (messagesEndRef) {
      messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }
  }

  useEffect(() => {
    fetchUserData();
  }, [])

  
  useEffect(()=> {
    if (isChatOpen) {
      scrollToBottomOfChat()
    }
  }, [isChatOpen, chatMessages])


  // Handle form submission results
  useEffect(() => {
    setIsModalOpen(false);

    if (formState.success) {
      addToast({
        title: "Habit Created",
        description: formState.message || "Your habit has been created successfully!",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
      refreshData();
    }
    if (!formState.success && formState.error) {
      addToast({
        title: "Error",
        description: formState.error || "An error occurred while creating your habit.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
    }

    setIsAddingHabit(false);
  }, [formState])


  function calculateProgressForToday(): number {

    if (!todayHabits || todayHabits?.length == 0) {
      return 0
    }

    let numCompeleted = todayHabits.filter((habit) => {
      return habit.is_complete
    }).length


    return Math.ceil((numCompeleted / todayHabits.length) * 100)
  }


  return (

    <>
      {isChatOpen &&

        <Drawer
          size="xl"
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          radius="none"
          isDismissable={false}
          hideCloseButton
          shouldBlockScroll={true}
          className="border-l border-l-foreground/10 bg-background z-[9999]"
        >
          <DrawerContent>
            <DrawerHeader className="flex justify-between mr-2 items-center">
              <h2>Chat with AI</h2>
              <X size={16} onClick={() => setIsChatOpen(false)} className="hover:cursor-pointer" />
            </DrawerHeader>

            <DrawerBody>
              <ScrollShadow hideScrollBar className="overflow-y-scroll flex flex-col gap-8 h-full">
                {chatMessages.map((message, idx) => (

                  <div className="flex flex-row" key={idx} ref={(idx == chatMessages.length -1) ? messagesEndRef : null}>
                    {message.role == "assistant" && <BotMessageSquare className={`hover:cursor-pointer text-primary mr-2 bg-muted h-9 w-9 p-2 rounded-full`} />}
                    <div className={`max-w-sm w-fit rounded-lg ${message.role == "assistant" ? "mr-auto bg-accent flex flex-start" : "ml-auto bg-secondary text-white flex flex-end text-right"}`}>
                      <p className="mx-4 my-2">{message.content}</p>
                    </div>
                  </div>
                ))}
              </ScrollShadow>
            </DrawerBody>


            <DrawerFooter>
              <Form
                onSubmit={(e) => { handleChatSubmit(e) }}
                className="flex flex-row items-center w-screen gap-4">
                <Input
                  aria-label="search"
                  className="w-full"
                  id="prompt"
                  name="prompt"
                  type="text"
                  placeholder="Type something"
                  variant="bordered"
                  radius="sm"
                  required
                  onChange={handleChatInputChange}
                  value={chatInput}
                />

                <Button type="submit" className="w-fit">Send</Button>
              </Form>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

      }


      <nav className="w-full flex justify-center border-b border-b-foreground/10 bg-background h-fit " >

        <div className="w-full max-w-7xl flex justify-between bg-background items-center p-2 px-5 text-sm">
          <span className="flex gap-2 items-center">
            <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="w-6 h-6" />
            {isLoadingUser ?
              <Skeleton className="rounded-lg w-24">
                <div className="h-4 bg-accent" />
              </Skeleton>
              :
              <p className="text-sm font-muted-foreground">{user?.user_metadata.username.toLowerCase()}</p>

            }
          </span>
          <BotMessageSquare className={`hover:cursor-pointer  ${user ? "text-primary" : "text-muted-foreground" }`} size={20} onClick={ async() => {
            if (user) {
              await openChat()
              setIsChatOpen(!isChatOpen);
            }
          }}
          />
        </div>

      </nav>

      <section className="flex w-full justify-evenly">

        <div className="flex-1 w-full max-w-3xl px-5 mx-auto flex flex-col pt-16 pb-20">

          <section className="flex flex-col gap-6" >
            <section className="mt-[-24px] flex">
              <h1 className="text-3xl font-semibold max-w-lg">Dashboard</h1>
            </section>

            <section className="bg-card border border-accent border-3 p-4 rounded-lg mt-[-12px]">

              <div className="flex flex-col justify-center md:justify-between gap-8 md:justify-between md:flex-row">
                <div className="mx-auto">
                  <h3 className="text-lg font-medium text-center md:text-left">Today's Progress</h3>
                  <p className="text-muted-foreground text-sm text-center md:text-left">Stay on top of your game!</p>
                  <CircularProgress
                    className="mx-auto mt-2 md:mx-0 z-0"
                    classNames={{
                      svg: "w-24 h-24 drop-shadow-md z-0",
                      indicator: "stroke-darkBlue",
                      value: "text-xl font-semibold text-muted-foreground ml-1",
                    }}
                    showValueLabel={true}
                    strokeWidth={2}
                    value={calculateProgressForToday()}
                  />
                </div>

                <div className="mx-auto">
                  <h3 className="text-lg font-medium text-center md:text-left">Total Habits</h3>
                  <p className="text-muted-foreground text-sm text-center md:text-left">Unique habits you've created.</p>
                  <div className="flex gap-2 items-center mx-auto md:mx-0 w-fit">
                    <Link href={"/dashboard"} className="text-darkBlue">
                      Manage
                    </Link>
                    <ArrowRight size={12} />
                  </div>

                  <p className="font-semibold text-6xl text-center mt-4 md:text-left">{totalHabits}</p>
                </div>


                <div className="mx-auto">
                  <h3 className="text-lg font-medium text-center md:text-left">Current Streak</h3>
                  <p className="text-muted-foreground text-sm text-center md:text-left max-w-[180px]">Complete your habits on time each day to raise your streak.</p>
                  {hasStreak ? <p className="font-semibold text-6xl text-center mt-4 md:text-left">{streak}</p> : <Button className="mt-4" onClick={async () => { await initializeStreak() }}>start streak</Button>}

                </div>

              </div>
            </section>
          </section>

          <section className="flex items-center gap-3 justify-between mt-12">

            <Tabs
              key="tournament_type"
              aria-label="Options"
              variant="light"
              color="default"
              className="flex flex-col mx-0 z-0"
              classNames={{ cursor: "bg-accent rounded-md z-0", base: "z-0", tab: "z-0", tabContent: "z-0" }}
              selectedKey={selected}
              onSelectionChange={(key) => setSelected(key.toString())}
            >
              <Tab key="Today" title="Today" className="w-fit" />
              <Tab key="This Week" title="This Week" className="w-fit" />
            </Tabs>


            <span className="flex w-fit justify-between gap-4">
              {/* <Button className="bg-secondary hover:bg-secondary text-white">Ask AI</Button> */}
              <Button variant="default" size="default" onClick={() => setIsModalOpen(true)}>
                Add Habit
              </Button>
            </span>


            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="bg-accent" radius="sm" isDismissable={false} >
              <ModalContent>
                <ModalHeader>Add a habit</ModalHeader>
                <ModalBody className="flex flex-col gap-8 mt-[-24px]">
                  <p className="text-muted-foreground text-sm">Habits repeat daily by default. Change this setting to weekly down below.</p>


                  <Form action={formAction} onSubmit={() => { setIsAddingHabit(true) }} className="mt-[-12px]">
                    <div className="flex flex-col gap-4 w-full">
                      <Input
                        aria-label="title"
                        id="title"
                        name="title"
                        type="text"
                        label="Title"
                        placeholder="Enter a title"
                        variant="bordered"
                        radius="sm"
                        required
                        onChange={handleModalInputChange}
                        value={formData.title}
                      />

                      <Textarea
                        aria-label="description"
                        id="description"
                        name="description"
                        type="text"
                        placeholder="Description"
                        variant="bordered"
                        radius="sm"
                        required
                        onChange={handleModalInputChange}
                        value={formData.description}
                      />

                      <DatePicker
                        aria-label="due date"
                        disableAnimation
                        isRequired
                        showMonthAndYearPickers
                        // minValue={today(getLocalTimeZone())}
                        label="due date"
                        name="due_date"
                        variant="bordered"
                        radius="sm"
                        granularity="minute"
                        onChange={handleDueDateChange}
                        value={formData.due_date}
                      />


                      {/* <Checkbox className="text-white" radius="sm">Repeats Weekly</Checkbox> */}
                      <div className="flex gap-3 ml-[2px]">
                        <Checkbox id="weekly" className="border-muted-foreground" checked={formData.is_weekly} onCheckedChange={(checked) => {
                          setFormData((prevData) => ({
                            ...prevData,
                            is_weekly: Boolean(checked.valueOf),
                          }));
                        }} />
                        <Label htmlFor="weekly" className="text-muted-foreground text-sm">Repeats Weekly</Label>
                      </div>
                    </div>

                    <div className="flex justify-end w-full mb-4">
                      <Button variant="outline" type="reset" onClick={() => setIsModalOpen(false)} className="bg-accent">
                        Cancel
                      </Button>
                      <Button type="submit" className="ml-2">
                        {isAddingHabit ? "Adding..." : "Add Habit"}
                      </Button>
                    </div>
                  </Form>
                </ModalBody>


              </ModalContent>
            </Modal>
          </section>

          <AnimatePresence>
            {selected === "Today" ?
              <ul className="flex flex-col gap-4 mt-8">
                {todayHabits?.map((habit) =>
                  <HabitCard key={habit.id} habit={habit} type="today" isDeleting={isDeletingHabit} onCompleteHabit={onCompleteHabit} onDeleteHabit={onDeleteHabit} />
                )}
              </ul>

              :

              <section className="flex flex-col gap-6 mt-8">
                {/* Spread the map into an array <day,habits>[] pairs and render habits for each day */}
                {[...weekHabits.entries()].map(([day, habits], index) =>

                  <div key={index}>
                    <span className="flex w-full justify-between">
                      <div className="flex gap-2 items-center">
                        <h2 className="font-medium">{day}</h2>
                      </div>
                      <p className="text-muted-foreground text-sm">{habits.length} {habits.length !== 1 ? "habits" : "habit"}</p>
                    </span>
                    <section className="flex flex-col gap-4 mt-4">
                      {habits?.map((habit) => (
                        <HabitCard key={habit.id} habit={habit} isDeleting={isDeletingHabit} type="this_week" onCompleteHabit={onCompleteHabit} onDeleteHabit={onDeleteHabit} />
                      ))}
                    </section>
                  </div>

                )}
              </section>
            }
          </AnimatePresence>

        </div>





      </section>

    </>
  );
}

