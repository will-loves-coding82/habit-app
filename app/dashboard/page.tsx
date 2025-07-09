"use client";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tab, Tabs } from "@heroui/tabs";
import { Skeleton } from "@heroui/skeleton";
import { DatePicker } from "@heroui/date-picker";
import { Input, Textarea } from "@heroui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { Form } from "@heroui/form";
import { useActionState, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { DateValue } from "@internationalized/date";
import {Avatar, AvatarGroup, AvatarIcon} from "@heroui/avatar";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { addToast } from "@heroui/toast";
import { CircularProgress } from "@heroui/progress";
import { createHabitAction, CreateHabitFormState } from "./actions";
import { cn } from "@heroui/theme";
import { Habit } from "./types/schema-types";
import HabitCard from "@/components/habit-card";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { ArrowRight, BotMessageSquare, ChevronDown } from "lucide-react";
import { Dropdown, DropdownTrigger, DropdownItem } from "@heroui/dropdown";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { getEndOfWeek, getStartOfWeek } from "@/lib/functions";
import { create } from "domain";
import { AnimatePresence } from "framer-motion";

export default function DashboardPage() {

  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setisLoadingUser] = useState(true);
  const [selected, setSelected] = useState("Today");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  const [totalHabits, setTotalHabits] = useState(0);
  const [todayHabits, setTodayHabits] = useState<Habit[]>([]);
  const [weekHabits, setWeekHabits] = useState<Map<string, Habit[]>>(new Map());
  const [isDeletingHabit, setIsDeletingHabit] = useState(false);

  const [streak, setStreak] = useState(0);
  const [hasStreak, setHasStreak] = useState(true);



  // Provide an initial state object of type CreateHabitFormState instead of null
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



  const handleDueDateChange = (value: DateValue | null) => {
    if (value == null) {
      return
    }
    setFormData((prevData) => ({
      ...prevData,
      due_date: value,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const fetchTodayHabits = async () => {

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_uid", user?.id)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString())
      .order("due_date", { ascending: false });

    if (error) {
      addToast({
        title: "Error",
        description: formState.error || "An error occurred while fetching today's habits.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
    }
    else {
      setTodayHabits(data);
    }
  }

  const fetchHabitsThisWeek = async () => {

    const supabase = await createClient();

    const date = new Date();
    const start = getStartOfWeek(date).toISOString();
    const end = getEndOfWeek(date).toISOString();

    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_uid", user?.id)
      .gte("due_date", start)
      .lte("due_date", end)
      .order("due_date", { ascending: false})

    if (error) {
      addToast({
        title: "Error",
        description: formState.error || "An error occurred while updating this week's habit.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
    }
    
    else {
      console.log("habits this week: ", data)
      let habitsMap = new Map();
      
      // Organize habits by days in the week
      data.forEach((habit: Habit) => {
        let date = new Date(habit.due_date);
        let day = date.toLocaleString("en-US", {
          weekday: "long",
        });

        if (!habitsMap.has(day)) {
          habitsMap.set(day, [])
        }
        habitsMap.get(day).push(habit);
      })
      
      setWeekHabits(habitsMap);
    }
  }

  const fetchUserData = async () => {
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

  const fetchTotalHabits = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("count_distinct_habits")
    if (error) {
      console.log('Error getting total count of habits: ', error)
    }
    else {
      setTotalHabits(data)
    }
  }

  const fetchStreak = async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("streaks")
      .select("streak")
      .eq("user_id", user!!.id)
      .limit(1)

    if (error) {
      console.log("Error getting streaks: ", error)
      setHasStreak(false);
    }

    if (data && data.length > 0) {
      setStreak(data[0].streak);
      setHasStreak(true);
    }
    else {
      console.log("Streak for user doesnt exist in DB")
      setHasStreak(false);
    }
  }

  const initializeStreak = async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("streaks")
      .insert({ streak: 0, user_id: user!!.id })

    if (error) {
      console.log("error initializing streak: ", error);
    }
    else {
      await fetchStreak()
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


  const onCompleteHabit = async (habit: Habit, is_complete: boolean) => {
    const supabase = await createClient();
    const completed_date = is_complete ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("habits")
      .update({ is_complete: is_complete, completed_date: completed_date })
      .eq("id", habit.id.toString());

    if (!error) {

      setTodayHabits((prev) =>
        prev?.map((h) =>
          h.id === habit.id ? { ...habit, is_complete, completed_date } : h
        )
      );

      let day = new Date(habit.due_date)
      let dayOfWeek = day.toLocaleString("en-US", {
        weekday: "long"
      })

      let habitsForDay = weekHabits.get(dayOfWeek)
      let newMap = habitsForDay?.map((h) => (
        h.id === habit.id ? {...habit, is_complete, completed_date} : h
      ))

      setWeekHabits((prev) => {
        const updated = new Map(prev);
        updated.set(dayOfWeek, newMap || []);
        return updated;
      });

      if (is_complete) {
        addToast({
          title: "Habit Completed",
          description: "Successfully completed habit!",
          classNames: {
            base: cn(["mb-4 mr-4"])
          }
        });
      }

    } else {
      // Optionally show an error toast
      console.log("Error: ", error)
      addToast({
        title: "Error",
        description: formState.error || "An error occurred while updating your habit.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
    }
  }
  
  const onDeleteHabit = async (habit: Habit) => {
    setIsDeletingHabit(true);

    const supabase = await createClient();

    // Delete the parent habit to perform a cascade delete
    const parentId = (habit.parent_id == null) ? habit.id : habit.parent_id;
    const { error } = await supabase.rpc("delete_habit", {parent: parentId })

    if (error) {
      addToast({
        title: "Error",
        description: formState.error || "An error occurred while deleting your habit.",
        color: "danger",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });
    }

    else {
       addToast({
          title: "Habit Deleted",
          description: "Successfully deleted habit!",
          classNames: {
            base: cn(["mb-4 mr-4"])
          }
        });


        let day = new Date(habit.due_date)
        let dayOfWeek = day.toLocaleString("en-US", {
          weekday: "long"
        })

        let habitsForDay = weekHabits.get(dayOfWeek)
        let newMap = habitsForDay?.filter((h) => (
           h.id !== habit.id 
        ))

        setTodayHabits(todayHabits.filter((h) => h.id !== habit.id))
        setWeekHabits((prev) => {
          const updated = new Map(prev);
          updated.set(dayOfWeek, newMap || []);
          return updated;
        });

    

        // refreshData();
      }

      setIsDeletingHabit(false);
  }


  useEffect(()=> {
    fetchUserData();
  }, [])

  // Only fetch habits if user is set
  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user])
  

  // Handle form submission results
  // TODO: Use supabase postgres realtime changes to udpate stats when inserting or deleting habits
  useEffect(() => {
    setIsModalOpen(false);
    setIsAddingHabit(false);

    if (formState.success) {
      addToast({
        title: "Habit Created",
        description: formState.message || "Your habit has been created successfully!",
        classNames: {
          base: cn(["mb-4 mr-4"])
        }
      });

      // clearForm();
      // fetchTodayHabits(); // Refresh habits after creation
      // setTotalHabits(totalHabits + 1);
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
  }, [formState])




  function calculateProgressForToday(): number {

    if (todayHabits.length == 0) {
      return 0
    }

    let numCompeleted = todayHabits.filter((habit) => {
      return habit.is_complete
    }).length


    return Math.ceil((numCompeleted / todayHabits.length) * 100)
  }


  return (

    <>

    <nav className="w-full flex justify-center border-b border-b-foreground/10 bg-background h-fit" >
      <div className="w-full max-w-7xl flex justify-between items-center p-2 px-5 text-sm">
        <span className="flex gap-2 items-center">
          <Avatar src="https://i.pravatar.cc/150?u=a042581f4e29026024d" className="w-6 h-6"/>
          {isLoadingUser ?
            <Skeleton className="rounded-lg w-24">
              <div className="h-4 bg-accent" />
            </Skeleton>
            :
            <p className="text-sm font-muted-foreground">{ user?.user_metadata.username.toLowerCase()}</p>

          }
        </span>
        <BotMessageSquare  className="hover:cursor-pointer" size={20}/>
      </div>

    </nav>

    <div className="flex-1 w-full max-w-3xl px-5 mx-auto flex flex-col mt-20">

      <section className="flex flex-col gap-6" >
        <section className="mt-[-24px] flex">
          <h1 className="text-3xl font-semibold max-w-lg">Dashboard</h1>
          {/* <p className="text-muted-foreground max-w-sm mt-1 text-sm lg:text-base">Start tracking and completing your habits for the day to keep up your streaks!</p> */}
        </section>
        
        <section className="bg-card border border-accent border-3 p-4 rounded-lg mt-[-12px]">

          <div className="flex flex-col justify-center md:justify-between gap-8 md:justify-between md:flex-row">
            <div className="mx-auto">
              <h3 className="text-lg font-medium text-center md:text-left">Today's Progress</h3>
              <p className="text-muted-foreground text-sm text-center md:text-left">Stay on top of your game!</p>
              <CircularProgress
                className="mx-auto mt-2 md:mx-0 z-10"
                classNames={{
                  svg: "w-24 h-24 drop-shadow-md z-10",
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
        <Tabs key="tournament_type" aria-label="Options" variant="light" color="default" className="flex flex-col mx-0" classNames={{ cursor: "bg-accent rounded-md" }} selectedKey={selected} onSelectionChange={(key) => setSelected(key.toString())}>
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
                    id="title"
                    name="title"
                    type="text"
                    label="Title"
                    placeholder="Enter a title"
                    variant="bordered"
                    radius="sm"
                    required
                    onChange={handleInputChange}
                    value={formData.title}
                  />

                  <Textarea
                    id="description"
                    name="description"
                    type="text"
                    placeholder="Description"
                    variant="bordered"
                    radius="sm"
                    required
                    onChange={handleInputChange}
                    value={formData.description}
                  />

                  <div className="flex">
                    <DatePicker
                    isRequired
                    showMonthAndYearPickers
                    // minValue={today(getLocalTimeZone())}
                    label="Due Date"
                    name="due_date"
                    variant="bordered"
                    radius="sm"
                    granularity="minute"
                    onChange={handleDueDateChange}
                    value={formData.due_date}
                  />
                  </div>
                  

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
        { selected === "Today" ? 
          <section className="flex flex-col gap-4 mt-8">
            {todayHabits?.map((habit) =>
                <HabitCard key={habit.id} habit={habit} type="today" isDeleting={isDeletingHabit} onCompleteHabit={onCompleteHabit} onDeleteHabit={onDeleteHabit}/>
            )}
          </section>

          :

          <section className="flex flex-col gap-6 mt-8">
            { [...weekHabits.entries()].map(([day, habits], index) => (
              <div key={index}>
                <span className = "flex w-full justify-between">
                  <div className="flex gap-2 items-center">
                    <h2 className="font-medium">{day}</h2>
                    {day == new Date().toLocaleString("en-US", { weekday: "long" }) && <p className="bg-accent py-1 px-2 rounded-md text-sm">Today</p>}
                  </div>
                  <p className="text-muted-foreground text-sm">{habits.length} {habits.length > 1 ? "habits" : "habit"}</p>
                </span>
                <section className="flex flex-col gap-4 mt-2">
                  {habits?.map((habit) => (
                    <HabitCard key={habit.id} habit={habit}  isDeleting = {isDeletingHabit} type="this_week" onCompleteHabit={onCompleteHabit} onDeleteHabit={onDeleteHabit}/>
                  ))}
                </section>
              </div>
            ))}
          </section>
        }
      </AnimatePresence>
     
    
      
    </div>
    </>
  );
}





// -- Create a cron job that runs daily to update user streaks
// -- Increases streak when all habits are completed on time
// -- Resets streak when any habit is not completed on time

//   -- First, identify users who had habits due yesterday
//   WITH 
//     user_habit_status AS (
//       SELECT 
//         user_uid,
//         COUNT(*) AS total_habits,
//         SUM(CASE WHEN is_complete = true THEN 1 ELSE 0 END) AS completed_habits
//       FROM 
//         habits
//       WHERE 
//         due_date::date = (CURRENT_DATE - INTERVAL '1 day')::date
//         AND user_uid IS NOT NULL
//       GROUP BY 
//         user_uid
//       HAVING 
//         COUNT(*) > 0
//   ),
  
//   -- Identify users who completed all habits (streak increases)
//   completed_all_users AS (
//     SELECT user_uid
//     FROM user_habit_status
//     WHERE total_habits = completed_habits
//   ),
  
//   -- Identify users who missed at least one habit (streak resets)
//   missed_habit_users AS (
//     SELECT user_uid
//     FROM user_habit_status
//     WHERE total_habits > completed_habits
//   )
  
//   -- PART 1: For users who completed all habits, increase their streak count
//   UPDATE streaks s
//   SET streak = streak + 1
//   FROM habits h
//   WHERE 
//     h.user_uid IN (SELECT user_uid FROM completed_all_users)
//     AND h.due_date::date = (CURRENT_DATE - INTERVAL '1 day')::date
  
//   -- PART 2: For users who missed habits, reset their streak count to 0
//   UPDATE streaks s
//   SET streak = 0
//   FROM habits h
//   WHERE 
//     h.user_uid IN (SELECT user_uid FROM missed_habit_users)
//     AND h.due_date::date = (CURRENT_DATE - INTERVAL '1 day')::date;