"use client";

import { Tab, Tabs } from "@heroui/tabs";
import { Skeleton } from "@heroui/skeleton";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import React, { useEffect, useRef, useState } from "react";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { Avatar } from "@heroui/avatar";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
import { addToast } from "@heroui/toast";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Progress } from "@heroui/progress";
import { cn } from "@heroui/theme";
import { ChatMessage, Habit } from "../types";
import HabitCard from "@/components/habit-card";
import { BarChart, BotMessageSquare, Dumbbell, Loader, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import Link from 'next/link';
import { CompletionHistoryLineChart } from '@/components/completion-history';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useForm } from '@tanstack/react-form'
import { Form } from "@heroui/form";
import userQueries from "../query/user";
import habitQueries from "../query/data";
import { useQuery } from "@tanstack/react-query";
import { Divider } from "@heroui/divider";

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
  const {data: user, isFetching: isLoadingUser} = useQuery(userQueries.getUser())
  const {data: completionHistory, isFetching: isLoadingCompletionHistory} = useQuery(habitQueries.getCompletionHistory())
  const {data: completionRates, isFetching: isLoadingCompletionRates} = useQuery(habitQueries.getCompletionRates())
  const {data: todayHabits} = useQuery(habitQueries.getTodayHabits())
  const {data: upcomingHabits} = useQuery(habitQueries.getUpcomingHabits())
  const {mutate: mutateAddHabit, isPending: addHabitIsPending} = habitQueries.addHabit()

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
      await mutateAddHabit(value)
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
        radius="md" isDismissable={true}
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

              <div className="flex justify-end w-full my-4">
                <Button variant="ghost" type="reset" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="secondary" type="submit" size="sm" className="ml-2 text-white">
                  {addHabitIsPending ? "Adding..." : "Add Habit"}
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
              <section className="flex flex-col gap-8 pb-16">
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

                  <CompletionHistoryLineChart completionHistory={completionHistory} todayHabits={todayHabits} upcomingHabits={upcomingHabits} />
                </div>

                <div className="h-44 sm:block sm:h-auto bg-card rounded-md p-4 col-span-1 row-span-2 col-start-1">
                   <span className="flex gap-4 items-start">
                  <Dumbbell size={46} className="text-blue-500 bg-blue-600/20 p-3 rounded-xl"/>
                  <header>
                    <h3 className="text-lg font-medium">Completion Rate</h3>
                    <p className="text-sm text-muted-foreground">Total averages</p>
                  </header>
                </span>

                   <span className="flex justify-between mt-6">
                    <div className="w-full">
                      <span>
                        <p className="text-2xl font-medium mt-2">{completionRates.total > 0 ? (completionRates.onTime / completionRates.total * 100).toFixed(0) : 0}%</p>
                        <p className="text-muted-foreground">On time</p>
                      </span>
                    </div>
                  
                    <Divider orientation="vertical" className="border-2"/>
                    <div className="w-full">
                      <p className="text-2xl font-medium mt-2">{completionRates.total > 0 ? (completionRates.early / completionRates.total * 100).toFixed(0) : 0}%</p>
                      <p className="text-muted-foreground">Completed early</p>
                    </div>
                  </span> 
                </div>
              </section>
              
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      }

      {
        isChatOpen &&
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
            <section className="flex flex-col sm:grid sm:grid-flow-cols sm:grid-cols-2 sm:grid-rows-2 gap-4 sm:max-h-[320px]">
              <div className="flex flex-col row-span-1 col-span-2 bg-card border-2 rounded-xl p-6">
                <h3 className="text-lg font-medium">Today's Progress</h3>
                <p className="text-muted-foreground text-sm">Stay on top of your game!</p>
                <Progress
                  aria-label="progress"
                  size="md"
                  color="success"
                  classNames={{
                    track: "rounded-xl bg-accent",
                    value: "text-xl font-semibold text-muted-foreground w-full text-right align-end",
                    indicator: "rounded-sm"
                  }}
                  showValueLabel={true}
                  value={calculateProgressForToday()}
                />
              </div>

              <div className="hidden h-48 sm:flex sm:flex-col justify-between bg-card border-2 rounded-xl p-6 row-start-2 col-span-1 col-start-2">
                <article>
                  <h3 className="text-lg font-medium">Completion History</h3>
                  <p className="text-muted-foreground text-sm">Past 7 days</p>
                </article>

                {
                  isLoadingCompletionHistory ? 
                  <Skeleton className="rounded-lg w-full">
                    <div className="h-8 w-full bg-accent" />
                  </Skeleton> 
                  : 
                  <CompletionHistoryLineChart completionHistory={completionHistory} todayHabits={todayHabits} upcomingHabits={upcomingHabits} />
                }
              </div>

              <div className="hidden h-48 sm:block bg-card border-2 rounded-xl p-6 col-span-1 row-span-2 col-start-1">
                <span className="flex gap-4 items-start">
                  <Dumbbell size={46} className="text-blue-500 bg-blue-600/20 p-3 rounded-xl"/>
                  <header>
                    <h3 className="text-lg font-medium">Completion Rate</h3>
                    <p className="text-sm text-muted-foreground">Total averages</p>
                  </header>
                </span>

                <span className="flex justify-between mt-6">
                  <div className="w-full">
                    <span>
                      <p className="text-2xl font-medium mt-2">{completionRates.total > 0 ? (completionRates.onTime / completionRates.total * 100).toFixed(0) : 0}%</p>
                      <p className="text-muted-foreground">On time</p>
                    </span>
                  </div>
                 
                  <Divider orientation="vertical" className="border-2"/>
                  <div className="w-full">
                    <p className="text-2xl font-medium mt-2">{completionRates.total > 0 ? (completionRates.early / completionRates.total * 100).toFixed(0) : 0}%</p>
                    <p className="text-muted-foreground">Completed early</p>
                  </div>
                </span> 
              </div>

            </section>
          </section>

          <section className="flex items-center gap-3 justify-between mt-24">
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
              <Tab key="Upcoming" title="Upcoming" className="w-fit" />
            </Tabs>

            <span className="flex w-fit justify-between gap-4">
              {/* <Button className="bg-secondary hover:bg-secondary text-white">Ask AI</Button> */}
              <Button variant="secondary" className="text-white" onClick={() => setIsAddModalOpen(true)}>
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
                  />
                )}
              </ul>

              :

              <section className="flex flex-col gap-6 mt-8">
                {/* Spread the map into an array <day,habits>[] pairs and render habits for each day */}
                {[...upcomingHabits.entries()].map(([month, habits], index) =>

                  <div key={index}>
                    <span className="flex w-full justify-between">
                      <div className="flex gap-2 items-center">
                        <h2 className="font-medium">{month}</h2>
                      </div>
                      <p className="text-muted-foreground text-sm">{habits.length} {habits.length !== 1 ? "habits" : "habit"}</p>
                    </span>
                    <section className="flex flex-col gap-4 mt-4">
                      {habits?.map((habit: Habit) => (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          type="this_week"
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




