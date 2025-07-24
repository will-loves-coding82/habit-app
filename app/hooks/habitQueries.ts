

// export function useHabits(user: User | null, queryClient: QueryClient) {


//     const supabase = createClient();
//     const [isAddingHabit, setIsAddingHabit] = useState(false);
//     const [isDeletingHabit, setIsDeletingHabit] = useState(false);

//     function calculateBaseWeekDays() : string[] {

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const lastWeek = new Date(today);
//         lastWeek.setDate(today.getDate() - 6);

//         let list = []

//         for (let i = 0; i < 7; i++) {
//             let lastWeekName = lastWeek.toLocaleString("en-US", {
//                 weekday: "short"
//             })

//             console.log("setting base week day: ", lastWeekName)
//             list.push(lastWeekName)
//             lastWeek.setDate(lastWeek.getDate() + 1)
//         }

//         return list
//     }

//     const fetchTotalHabits = useCallback(async () => {
//         const { data, error } = await supabase.rpc("count_distinct_habits")
//         if (error) {
//             console.log('Error getting total count of habits: ', error)
//             Promise.reject({error: error})
//         }
//         return data
//     }, [user])


//     async function fetchTodayHabits() {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0); // Set time to the beginning of today

//         const tomorrow = new Date(today);
//         tomorrow.setDate(tomorrow.getDate() + 1);

//         const { data, error } = await supabase
//             .from("habits")
//             .select("*")
//             .eq("user_uid", user?.id)
//             .gte("due_date", today.toISOString())
//             .lt("due_date", tomorrow.toISOString())
//             .order("due_date", { ascending: false });

//         if (error) {
//             addToast({
//                 title: "Error",
//                 description: "An error occurred while fetching today's habits.",
//                 color: "danger",
//                 classNames: {
//                     base: cn(["mb-4 mr-4"])
//                 }
//             });

//             Promise.reject({message: error})
//         }

//         console.log("Today habits: ", data)
//         return data
        
//     }


//     async function fetchHabitsThisWeek() {
//         const date = new Date();
//         const weekStart = getStartOfWeek(date).toISOString();
//         const weekEnd = getEndOfWeek(date).toISOString();

//         const { data, error } = await supabase
//             .from("habits")
//             .select("*")
//             .eq("user_uid", user?.id)
//             .gte("due_date", weekStart)
//             .lte("due_date", weekEnd)
//             .order("due_date", { ascending: false })

//         if (error) {
//             addToast({
//                 title: "Error",
//                 description: "An error occurred while updating this week's habit.",
//                 color: "danger",
//                 classNames: {
//                     base: cn(["mb-4 mr-4"])
//                 }
//             });

//             Promise.reject( error)
//         }


//         console.log("habits this week: ", data)
//         let habitsMap = new Map();

//         // Organize habits by days in the week
//         data!!.forEach((habit: Habit) => {
//             let date = new Date(habit.due_date);
//             let day = date.toLocaleString("en-US", {
//                 weekday: "long",
//             });

//             if (!habitsMap.has(day)) {
//                 habitsMap.set(day, [])
//             }
//             habitsMap.get(day).push(habit);
//         })

//         return habitsMap
    

    
//     }

//     const fetchCompletionHistory = async() => {

//         const today = new Date();
//         today.setHours(0, 0, 0, 0);

//         const tomorrow = new Date(today.getDay() + 1)

//         const lastWeek = new Date(today);
//         lastWeek.setDate(today.getDate() - 6);


//         const {data, error} = await supabase
//             .from("habits")
//             .select("due_date, is_complete")
//             .eq("user_uid", user?.id)
//             .gte("due_date", lastWeek.toISOString())
//             .lt("due_date", tomorrow.toISOString())
//             .order("due_date", { ascending: true })

//         if (error) {
//             console.log("error getting habits over past week: ", error)
//             Promise.reject({message: error })
//         }

//         else {
//             console.log("raw completion data: ", data)

//             const mapOfCounts = new Map<string, number>();

//             data.forEach(row => {
//                 const day = new Date(row.due_date).toLocaleString("en-US", {
//                     weekday: "short"
//                 })
//                 console.log("setting date: ", day)
//                 const count = mapOfCounts.get(day)
//                 if (!count && row.is_complete) {
//                     mapOfCounts.set(day, 1)
//                 }
//                 else if (count) {
//                     mapOfCounts.set(day, count + 1)
//                 }
//             })


//             // Add placeholder values for missing days
//             const baseWeekDays = calculateBaseWeekDays();

//             baseWeekDays.forEach(day => {
//             if (!mapOfCounts.has(day)) {
//                 mapOfCounts.set(day, 0);
//             }
//             });

//             // Format the list in ascending order of days 
//             console.log("base week days: ", baseWeekDays)           
//             const listOfCounts = baseWeekDays.map(day => ({
//                 day: day,
//                 count: mapOfCounts.get(day) || 0,
//             }));

//             console.log("completion history: ", listOfCounts)   
//             return listOfCounts 
//         }
//     }

    
//     const onCompleteHabit = async ({habit, is_complete}:{habit: Habit, is_complete: boolean}) => {

//         const completed_date = is_complete ? new Date().toISOString() : null;
//         const todayNumber = Number(new Date(0,0,0,0).getDay())
        
//         console.log("todayNumber", todayNumber)

//         const { error } = await supabase
//             .from("habits")
//             .update({ is_complete: is_complete, completed_date: completed_date })
//             .eq("id", habit.id.toString());

//         if (error) {

//             Promise.reject({error: error})
//             addToast({
//                 title: "Error",
//                 description: "An error occurred while updating your habit.",
//                 color: "danger",
//                 classNames: {
//                     base: cn(["mb-4 mr-4"])
//                 }
//             });
//         }

//         Promise.resolve()
//     }


//      const onDeleteHabit = async (habit: Habit) => {

//         // Delete the parent habit to perform a cascade delete
//         const parentId = (habit.parent_id == null) ? habit.id : habit.parent_id;
//         const { error } = await supabase.rpc("delete_habit", { parent: parentId })

//         if (error) {
//             addToast({
//                 title: "Error",
//                 description: "An error occurred while deleting your habit.",
//                 color: "danger",
//                 classNames: {
//                     base: cn(["mb-4 mr-4"])
//                 }
//             });

//             Promise.reject({error: error})
//         }

//         Promise.resolve()
//     }



//     function refreshHabits() {
//         queryClient.invalidateQueries({queryKey: ["today-habits", 'this-week-habits']})
//     }


//     const totalHabitsQuery = useQuery({
//         queryKey: ["totalHabits"],
//         queryFn: fetchTotalHabits, 
//         enabled: user != null
//     })

//     const completionHistoryQuery = useQuery({
//         queryKey: ["completionHistory"],
//         queryFn: fetchCompletionHistory, 
//         enabled: user != null
//     })

//     const todayHabitsQuery = useQuery({
//         queryKey: ["todayHabits"],
//         queryFn: fetchTodayHabits, 
//         enabled: user != null
//     })

//     const weekHabitsQuery = useQuery({
//         queryKey: ["thisWeekHabits"],
//         queryFn: fetchHabitsThisWeek, 
//         enabled: user != null
//     })


//     queryClient.setMutationDefaults(['deleteHabit'], {
//         mutationFn: onDeleteHabit,
//         onMutate: async(variables) => {

//             await queryClient.cancelQueries({ queryKey: ['todayHabits', 'thisWeekHabits']})
//             let habit = variables

//             // Perform an optimisitc update of the UI
//             let day = new Date(habit.due_date)
//             let dayOfWeek = day.toLocaleString("en-US", {
//                 weekday: "long"
//             })

//             queryClient.setQueryData(['this-week-habits'], (prev: Map<string, Habit[]>) => {
//                 if (prev.has(dayOfWeek)) {
//                     const filtered = prev.get(dayOfWeek)!.filter(h => (h.id != habit.id) || (h.parent_id != habit.parent_id));
//                     if (filtered.length == 0) {
//                         prev.delete(dayOfWeek);
//                     }
//                     prev.set(dayOfWeek, filtered);
//                 }
//             })

//             queryClient.setQueryData(['today-habits'], (prev: Habit[]) => {
//                 prev.filter((h) => (h.id !== habit.id) || (h.parent_id != habit.parent_id))
//             })

//             return;

//         },
//         onSuccess:  (_result, variables, _) => {
//             let habit = variables.habit;

//             // Perform an optimisitc update of the UI
//             let day = new Date(habit.due_date)
//             let dayOfWeek = day.toLocaleString("en-US", {
//                 weekday: "long"
//             })
//               queryClient.setQueryData(['this-week-habits'], (prev: Map<string, Habit[]>) => {
//                 if (prev.has(dayOfWeek)) {
//                     const filtered = prev.get(dayOfWeek)!.filter(h => (h.id != habit.id) || (h.parent_id != habit.parent_id));
//                     if (filtered.length == 0) {
//                         prev.delete(dayOfWeek);
//                     }
//                     prev.set(dayOfWeek, filtered);
//                 }
//             })

//             queryClient.setQueryData(['today-habits'], (prev: Habit[]) => {
//                 prev.filter((h) => (h.id !== habit.id) || (h.parent_id != habit.parent_id))
//             })
//         }
//     })



//     const deleteHabitMutation = useMutation({
//         mutationKey: ['deleteHabit'],
//     })

//     const completeHabitMutation = useMutation({
//         mutationKey: ['completeHabit'],
//         mutationFn: ({ habit, is_complete }: { habit: Habit; is_complete: boolean }) => {
//            return onCompleteHabit({habit, is_complete})
//         },

//         onMutate:  async(variables) => {
//             let habit = variables.habit;
//             let is_complete = variables.is_complete;

//             const completed_date = is_complete ? new Date().toISOString() : null;
//             const todayNumber = Number(new Date(0,0,0,0).getDay())
        
//             let day = new Date(habit.due_date)
//             let dayOfWeek = day.toLocaleString("en-US", {
//                 weekday: "long"
//             })

//             queryClient.setQueryData(['today-habits'], (prev: Habit[]) => {
//                 prev?.map((h) =>
//                     h.id === habit.id ? { ...habit, is_complete, completed_date } : h
//                 )            })
        
//             queryClient.setQueryData(['thisWeekHabits'], (prev: Map<string, Habit[]>) => {
//                 if (prev.has(dayOfWeek)) {
//                     const filtered = prev.get(dayOfWeek)!.map((h) =>   h.id === habit.id ? { ...habit, is_complete, completed_date } : h)
//                     prev.set(dayOfWeek, filtered);
//                 }
//                 return prev;
//             })


//             queryClient.setQueryData(['completionHistory'], (prev: any[]) => {
//                 return prev.map((item, index) => 
//                     index === (6 - todayNumber) ? { ...item, count: (is_complete ? item.count + 1  : (item.count >= 1 ? item.count - 1 : 0))} : item
//                 );
//             })

//             // if (is_complete) {
//             //     addToast({
//             //         title: "Habit Completed",
//             //         description: "Successfully completed habit!",
//             //         classNames: {
//             //             base: cn(["mb-4 mr-4"])
//             //         }
//             //     });
//             // }
//         },
//         onSuccess: (_result, variables, _ ) => {

//             let habit = variables.habit;
//             let is_complete = variables.is_complete;

//             const completed_date = is_complete ? new Date().toISOString() : null;
//             const todayNumber = Number(new Date(0,0,0,0).getDay())
        
//             let day = new Date(habit.due_date)
//             let dayOfWeek = day.toLocaleString("en-US", {
//                 weekday: "long"
//             })

//             queryClient.setQueryData(['today-habits'], (prev: Habit[]) => {
//                 prev?.map((h) =>
//                     h.id === habit.id ? { ...habit, is_complete, completed_date } : h
//                 )            })
        
//             queryClient.setQueryData(['thisWeekHabits'], (prev: Map<string, Habit[]>) => {
//                 if (prev.has(dayOfWeek)) {
//                     const filtered = prev.get(dayOfWeek)!.map((h) =>   h.id === habit.id ? { ...habit, is_complete, completed_date } : h)
//                     prev.set(dayOfWeek, filtered);
//                 }
//                 return prev;
//             })


//             queryClient.setQueryData(['completionHistory'], (prev: any[]) => {
//                 return prev.map((item, index) => 
//                     index === (6 - todayNumber) ? { ...item, count: (is_complete ? item.count + 1  : (item.count >= 1 ? item.count - 1 : 0))} : item
//                 );
//             })

//             // if (is_complete) {
//             //     addToast({
//             //         title: "Habit Completed",
//             //         description: "Successfully completed habit!",
//             //         classNames: {
//             //             base: cn(["mb-4 mr-4"])
//             //         }
//             //     });
//             // }

//         }
//     })

//     return {
//         completionHistoryQuery,
//         totalHabitsQuery,
//         todayHabitsQuery,
//         weekHabitsQuery,
//         deleteHabitMutation,
//         completeHabitMutation,
//         isDeletingHabit,
//         isAddingHabit,
//         setIsDeletingHabit,
//         setIsAddingHabit,
//         refreshHabits
//     }


// }