"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Skeleton } from "@heroui/skeleton";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
// import { Form } from "@heroui/form";
import React, { useEffect, useRef, useState } from "react";
import { DateValue, getLocalTimeZone, now, today, ZonedDateTime } from "@internationalized/date";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { addToast } from "@heroui/toast";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Progress } from "@heroui/progress";
import { cn } from "@heroui/theme";
import { ChatMessage, Habit } from "../types";
import HabitCard from "@/components/habit-card";
import { BarChart, BotMessageSquare, Flame, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useStreaks } from "../hooks/useStreaks";
import { useHabitContext } from '../context/habit-context';
import Link from 'next/link';
import { CompletionHistoryLineChart } from '@/components/completion-history';
import { useUserContext } from '../context/user-context';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { formOptions, useForm } from '@tanstack/react-form'
import { useQueryClient } from "@tanstack/react-query";
import { Form } from "@heroui/form";


export interface AddHabitFormData {
    title: string,
    description: string,
    due_date: DateValue | null,
    user_timezone: string,
}


/**
 * DashboardPage defines the interace to view and update a user's habits. Comes 
 * with statistics such as total habits, streaks, completion history, 
 * and progress percentage. Users can also interact with a LLM 
 * chatbot on this page as well.
 */
export default function DashboardPage() {

  const supabase = createClient();
  const { user, isLoadingUser } = useUserContext();

  const {
    todayHabits,
    weekHabits,
    completionHistory,
    addHabit,
    toggleCompleteHabit,
    editHabit,
    deleteHabit
  } = useHabitContext();

  const {
    streak,
    hasStreak,
    initializeStreak
  } = useStreaks(user);

  const [avatarURL, setAvatarURL] = useState<string | null>(null);
  const [donwloadingAvatar, setDownloadingAvatar] = useState(false);
  const [selected, setSelected] = useState("Today");
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const defaultAddHabitData: AddHabitFormData = {
      title: "",
      description: "",
      due_date: null,
      user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  const addHabitForm = useForm({
    defaultValues: defaultAddHabitData,
    onSubmit: async ({ value }) => {
      await addHabit.mutateAsync(value)
      addHabitForm.reset()
      setIsAddModalOpen(false)
    },
  })

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottomOfChat()
    }
  }, [isChatOpen, chatMessages])

  useEffect(() => {
    async function downloadImage() {
      try {
        setDownloadingAvatar(true);

        const { data, error } = await supabase.storage
          .from('avatars')
          .download(`${user?.id}/profile.jpg`)

        if (error) {
          console.log('Error downloading avatar image: ', error);
          return;
        }

        const url = URL.createObjectURL(data);
        setAvatarURL(url);

      } catch (error: any) {
        console.log('Error downloading avatar image: ', error);
      }
      finally {
        setDownloadingAvatar(false);
      }
    }

    if (user) downloadImage();

  }, [user])

  /**
   * handleChatInputChange trims the user's message and triggers a form action 
   * to submit the data. It invokes a Supabase edge function with the content 
   * and saves the response in the component state for rendering in the UI.
   */
  const handleChatSubmitAndDisplayResponse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (chatInput.length > 0) {

      const trimmedInput = chatInput.trim();
      const userMessage: ChatMessage = {
        created_at: new Date().toLocaleString(),
        role: "user",
        content: trimmedInput,
        chat_id: chatId!!,
      }

      setChatMessages(prev => [...prev, userMessage])
      setChatInput("");

      // Wait for response from LLM
      // TODO: A loading status would be helpful to show the request is processing
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

      const { data, error } = await supabase.functions.invoke("generate-ai-answer", {
        body: JSON.stringify({
          userPrompt: chatInput,
          chatId: chatId,
          userId: user?.id,
          todayDate: today.toISOString(),
          tomorrowDate: tomorrow.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }),
        method: 'POST'
      });

      if (error != null) {
        addToast({
          title: "Error generating AI response",
          description: error,
          color: "danger",
          classNames: {
            base: cn(["mb-4 mr-4"])
          }
        });
      }
      else {
        const aiMessage: ChatMessage = {
          created_at: new Date().toLocaleString(),
          role: "assistant",
          content: data.body.finalResponse,
          chat_id: chatId!!,
        };

        setChatMessages(prev => [...prev, aiMessage])
      }
    }
  }

  /**
  * handleChatInputChange handles changes in the user's 
  * message content when communicating to the LLM chatbot.
  */
  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setChatInput(value);
  };

  /**
   * fetchChat retrieves all of a user's and chatbot's messages
   * for a particular chat id.
   */
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

  /**
  * openChat opens a chat and its messagges. If it doesn't exist,
  * the method will provision a new chat for the user to begin
  * convserations with the LLM chatbot.
  */
  const openOrCreateChat = async () => {
    if (chatMessages.length > 0 || chatId != null) {
      return;
    }

    const chat = await fetchChat();

    // Create a new chat if it doesn't exist already
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
        // TODO: Create an edge function that will 
        // return the created chat id to avoid refetching
        console.log("successfully created new chat")
        const chat = await fetchChat();
        setChatId(chat);
      }

    } else {

      // Otherwise, grab the data for the exisiting chat
      setChatId(chat);

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chat)
        .eq("user_uid", user?.id)

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

  const scrollToBottomOfChat = () => {
    if (messagesEndRef) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  /**
   * calculateProgressForToday keeps track of the proportion of completed habits 
   * to the total habits for the current day.
  */
  function calculateProgressForToday(): number {
    if (!todayHabits || todayHabits?.length == 0) {
      return 0;
    }

    let numCompeleted = todayHabits.filter((habit: Habit) => {
      return habit.is_complete
    }).length

    return Math.ceil((numCompeleted / todayHabits.length) * 100);
  }

  return (
    <>
      {/* Add new habit modal */}
      <Modal 
        className="bg-accent" radius="sm" isDismissable={true}
        isOpen={isAddModalOpen} 
        onClose={() => {
          addHabitForm.reset()
          setIsAddModalOpen(false)}
        } 
      >
        <ModalContent>
          <ModalHeader>Add a habit</ModalHeader>
          <ModalBody className="flex flex-col gap-8 mt-[-24px]">
            <p className="text-muted-foreground text-sm">Habits repeat daily by default. Change this setting to weekly down below.</p>

            <Form className="mt-[-12px]" onSubmit={(e) => {
              e.preventDefault();
              addHabitForm.handleSubmit()
            }}
            >
              <div className="flex flex-col gap-4 w-full">
                <addHabitForm.Field name="user_timezone" children={() =>
                  <Input
                    aria-label="user_timezone"
                    type="hidden"
                    name="user_timezone"
                    value={Intl.DateTimeFormat().resolvedOptions().timeZone}
                  />
                }/>

                <addHabitForm.Field name="title" children={(field) =>
                  <Input
                    value={field.state.value}
                    aria-label="title"
                    id="title"
                    name="title"
                    type="text"
                    label="Title"
                    placeholder="Enter a title"
                    variant="bordered"
                    radius="sm"
                    required
                    onChange={(e)=> field.handleChange(e.target.value)}
                  />
                }/>

                <addHabitForm.Field name="description" children={(field) =>
                  <Textarea
                    value={field.state.value}
                    aria-label="description"
                    label="description"
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Description"
                    variant="bordered"
                    radius="sm"
                    required
                    onChange={(e)=> field.handleChange(e.target.value)}
                  />
                }/>

                <addHabitForm.Field name="due_date" children={(field) =>
                  <DatePicker
                    value={field.state.value}
                    aria-label="due_date"
                    disableAnimation
                    isRequired
                    showMonthAndYearPickers
                    minValue={today(getLocalTimeZone())}
                    label="due date"
                    name="due_date"
                    variant="bordered"
                    radius="sm"
                    granularity="minute"
                    onChange={(date)=> {
                      console.log("Date changed:", date) // Debug
                      field.handleChange(date as DateValue | null)
                    }}
                  />
                }/>
              </div>

              <div className="flex justify-end w-full mb-4">
                <Button variant="outline" type="reset" size="sm" onClick={() => setIsAddModalOpen(false)} className="bg-accent">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="ml-2">
                  {addHabit.isPending ? "Adding..." : "Add Habit"}
                </Button>
              </div>
            </Form>
          </ModalBody>
        </ModalContent>
      </Modal>
      {
        isStatsOpen &&
        <Drawer
          size="3xl"
          isOpen={isStatsOpen}
          onClose={() => setIsStatsOpen(false)}
          radius="none"
          isDismissable={false}
          hideCloseButton
          shouldBlockScroll={true}
          className="border-l border-l-foreground/10 bg-background z-[9999]"
        >
          <DrawerContent>
            <DrawerHeader className="flex justify-between mr-2 items-center">
              <h2>Statistics</h2>
              <X size={16} onClick={() => setIsStatsOpen(false)} className="hover:cursor-pointer" />
            </DrawerHeader>

            <DrawerBody>
              <section className="flex flex-col sm:grid sm:grid-flow-cols sm:grid-cols-3 sm:grid-rows-2 gap-4 sm:max-h-[320px] pb-16">

                <div className="flex flex-col col-span-2 bg-card rounded-md p-4">
                  <h3 className="text-lg font-medium">Today's Progress</h3>
                  <p className="text-muted-foreground text-sm">Stay on top of your game!</p>
                  <Progress
                    size="lg"
                    radius="none"
                    color="success"
                    classNames={{
                      track: "rounded-xs rounded-sm bg-accent",
                      value: "text-xl font-semibold text-muted-foreground w-full text-right align-end",
                      indicator: "rounded-sm"
                    }}
                    showValueLabel={true}
                    value={calculateProgressForToday()}
                  />
                </div>

                <div className="h-48 sm:flex sm:flex-col justify-between sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-3 col-start-3">
                  <article>
                    <h3 className="text-lg font-medium">Completion History</h3>
                    <p className="text-muted-foreground text-sm">Past 7 days</p>
                  </article>

                  <CompletionHistoryLineChart completionHistory={completionHistory} todayHabits={todayHabits} weekHabits={weekHabits} />
                </div>

                <div className="h-32 sm:block sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-2 col-start-1">
                  <span className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Total Habits</h3>

                    <Link href={"/dashboard/profile"} className="text-sm px-2 py-1 bg-accent items-center text-muted-foreground rounded-md">
                      manage
                    </Link>
                  </span>
                  <p className="font-semibold text-6xl mt-4">0</p>
                </div>

                <div className="h-32 sm:block sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-2 col-start-2">
                  <span className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Streak</h3>
                    <div className="p-2 bg-warning/25 rounded-full items-center">
                      <Flame size={20} className="text-warning" />
                    </div>
                  </span>
                  {hasStreak ? <p className="font-semibold text-6xl mt-4">{streak}</p> : <Button className="mt-4" onClick={async () => { await initializeStreak() }}>start streak</Button>}
                </div>
              </section>
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      }

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

                  <div className="flex flex-row" key={idx} ref={(idx == chatMessages.length - 1) ? messagesEndRef : null}>
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
                onSubmit={(e) => { handleChatSubmitAndDisplayResponse(e) }}
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

      <nav className="w-full flex justify-center border-b border-b-foreground/10 bg-background h-fit py-1 " >
        <div className="w-full max-w-7xl flex justify-between bg-background items-center p-2 px-5 text-sm">
          <span className="flex gap-2 items-center">
            {avatarURL && <Avatar src={avatarURL} size="lg" className="w-6 h-6" classNames={{ icon: "text-primary w-16 h-16", base: "bg-accent mx-auto" }} />}
            {!avatarURL && <Avatar size="sm" className="w-6 h-6" classNames={{ icon: "text-primary w-4 h-4", base: "bg-accent mx-auto" }} />}

            {isLoadingUser ?
              <Skeleton className="rounded-lg w-24">
                <div className="h-4 bg-accent" />
              </Skeleton>
              :
              <p className="text-sm font-muted-foreground">{user?.user_metadata.username.toLowerCase()}</p>
            }
          </span>

          <span className="flex items-center gap-8">

            <BarChart className={`hover:cursor-pointer sm:hidden  ${user ? "text-primary" : "text-muted-foreground"}`} size={20} onClick={async () => setIsStatsOpen(true)} />
            <BotMessageSquare className={`hover:cursor-pointer  ${user ? "text-primary" : "text-muted-foreground"}`} size={20} onClick={async () => {
              if (user) {
                await openOrCreateChat()
                setIsChatOpen(!isChatOpen);
              }
            }}
            />
          </span>
        </div>
      </nav>


      <section className="flex w-full justify-evenly">
        <div className="flex-1 w-full max-w-3xl px-5 mx-auto flex flex-col pt-16 pb-20">
          <section className="flex flex-col gap-6" >
            <section className="mt-[-24px] flex">
              <h1 className="text-3xl font-semibold max-w-lg">Dashboard</h1>
            </section>

            {/* Desktop Dashboard Statistics  */}
            <section className="flex flex-col sm:grid sm:grid-flow-cols sm:grid-cols-3 sm:grid-rows-2 gap-4 sm:max-h-[320px]">

              <div className="flex flex-col col-span-2 bg-card rounded-md p-4">
                <h3 className="text-lg font-medium">Today's Progress</h3>
                <p className="text-muted-foreground text-sm">Stay on top of your game!</p>
                <Progress
                  aria-label="progress"
                  size="lg"
                  radius="none"
                  color="success"
                  classNames={{
                    track: "rounded-xs rounded-sm bg-accent",
                    value: "text-xl font-semibold text-muted-foreground w-full text-right align-end",
                    indicator: "rounded-sm"
                  }}
                  showValueLabel={true}
                  value={calculateProgressForToday()}
                />
              </div>

              <div className="hidden h-32 sm:flex sm:flex-col justify-between sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-3 col-start-3">
                <article>
                  <h3 className="text-lg font-medium">Completion History</h3>
                  <p className="text-muted-foreground text-sm">Past 7 days</p>
                </article>

                <CompletionHistoryLineChart completionHistory={completionHistory} todayHabits={todayHabits} weekHabits={weekHabits} />
              </div>

              <div className="hidden h-32 sm:block sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-2 col-start-1">
                <span className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Total Habits</h3>

                  <Link href={"/dashboard/profile"} className="text-sm px-2 py-1 bg-accent items-center text-muted-foreground rounded-md">
                    manage
                  </Link>
                </span>
                <p className="font-semibold text-6xl mt-4">0</p>
              </div>

              <div className="hidden h-32 sm:block sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-2 col-start-2">
                <span className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Streak</h3>
                  <div className="p-2 bg-warning/25 rounded-full items-center">
                    <Flame size={20} className="text-warning" />
                  </div>
                </span>
                {hasStreak ? <p className="font-semibold text-6xl mt-4">{streak}</p> : <Button className="mt-4" onClick={async () => { await initializeStreak() }}>start streak</Button>}
              </div>
            </section>
          </section>

          <section className="flex items-center gap-3 justify-between mt-12">
            <Tabs
              key="tournament_type"
              aria-label="Options"
              color="default"
              className="flex flex-col mx-0 z-0"
              classNames={{ cursor: "rounded-md z-0", tabList: "rounded-lg bg-accent" }}
              selectedKey={selected}
              onSelectionChange={(key) => setSelected(key.toString())}
            >
              <Tab key="Today" title="Today" className="w-fit" />
              <Tab key="This Week" title="This Week" className="w-fit" />
            </Tabs>

            <span className="flex w-fit justify-between gap-4">
              {/* <Button className="bg-secondary hover:bg-secondary text-white">Ask AI</Button> */}
              <Button variant="default" size="sm" onClick={() => setIsAddModalOpen(true)}>
                Add Habit
              </Button>
            </span>
          </section>

          <AnimatePresence>
            {selected === "Today" ?
              <ul className="flex flex-col gap-4 mt-8">
                {todayHabits?.map((habit: Habit) =>
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    type="today"
                    toggleCompleteHabit={toggleCompleteHabit}
                    editHabit={editHabit}
                    deleteHabit={deleteHabit}
                  />
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
                      {habits?.map((habit: Habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          type="this_week"
                          toggleCompleteHabit={toggleCompleteHabit}
                          editHabit={editHabit}
                          deleteHabit={deleteHabit}
                        />
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




