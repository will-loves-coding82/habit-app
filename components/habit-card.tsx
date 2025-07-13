import { AnimatePresence, motion } from "motion/react"
import { Habit } from "@/app/dashboard/types";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import {Alert} from "@heroui/alert";
import {  Dropdown,  DropdownTrigger,  DropdownMenu,  DropdownSection,  DropdownItem} from "@heroui/dropdown";
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useTheme } from "next-themes";
import { isHabitCompletedOnTime, isHabitLate } from "@/lib/functions";


export default function HabitCard(
    { habit, type, isDeleting, onCompleteHabit, onDeleteHabit } : 
    { habit: Habit, type: string,  isDeleting: boolean, onCompleteHabit: (habit: Habit, completed: boolean) => void, onDeleteHabit: (habit: Habit) => void }
) {

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { resolvedTheme } = useTheme();

    const isCompletedOnTime = isHabitCompletedOnTime(habit);
    const isLate = isHabitLate(habit);


    // Refresh the UI component every minute
    const [, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);


    return (

        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y:0 }}
            exit={{ opacity: 0 }}
        >
            <Modal isOpen={isDeleteModalOpen && !isDeleting} onClose={() => setIsDeleteModalOpen(false)} className="bg-accent" radius="sm" isDismissable={false} >
                <ModalContent>
                    <ModalHeader>Delete this habit?</ModalHeader>
                    
                    <ModalBody className="flex flex-col gap-6 mt-[-24px]">
                        <div className="flex items-center justify-center w-full mt-2">
                            <Alert 
                                color={"danger"} 
                                variant={resolvedTheme === "dark" ? "faded" : "bordered"}
                                hideIcon
                                title="This will delete all repeating ocurrences"
                                description="You cannot undo this action."
                            />
                        </div>

                        <div>
                           <h2 className="text-lg font-medium">{habit.title}</h2>
                            <p className="text-muted-foreground text-sm">{habit.description}</p>
                        </div>
                       
                    </ModalBody>

                      <ModalFooter>
                        <Button variant="outline" type="reset" onClick={() => setIsDeleteModalOpen(false)} className="bg-accent">
                            Cancel
                        </Button>
                        <Button className="ml-2 bg-danger hover:bg-danger text-white" onClick={() => onDeleteHabit(habit)}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
 
              
            </Modal>

        <Card className="w-full rounded-md bg-accent px-3 z-0" shadow="none">
            <CardHeader>
                <span className="flex items-center justify-between w-full gap-8 text-muted-foreground text-sm mt-1">
                    <div className="flex items-center">

                        <Calendar className="w-4 h-4 text-xs mb-1 mr-2"/>

                        <p className="text-muted-foreground mr-4">
                            {new Date(habit.due_date).toLocaleString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                            }).replace("at", "")}
                        </p>

                        { habit.is_complete && isCompletedOnTime && !isLate && (<p className="text-success px-2 py-[2px] bg-success/20 rounded-md">complete</p>)}
                        { habit.is_complete && !isCompletedOnTime && (<p className="text-warning px-2 py-[2px] bg-warning/25 rounded-md">completed late</p>)}
                        {isLate && <p className="text-danger px-2 py-[2px] bg-danger/25 rounded-md">late</p>}

                    </div>

                    <Dropdown className="bg-accent" backdrop="blur" radius="sm">
                        <DropdownTrigger>
                            <Ellipsis className="rounded-sm hover:cursor-pointer"/>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions" variant="faded">
                            <DropdownItem key="edit">Edit habit</DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => setIsDeleteModalOpen(true)}>
                                Delete habit
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>



                </span>

            </CardHeader>

            <CardBody className="flex flex-row items-start mt-[-12px]">
                <Checkbox
                    disabled = {type == "this_week" }
                    checked={habit.is_complete}
                    onCheckedChange={(checked) =>
                        onCompleteHabit(habit, Boolean(checked))
                    }
                    className="mt-1 mr-2"
                />                    
                
                <div>
                    <h2 className="text-lg md:text-2xl">{habit.title}</h2>
                    <p className="text-muted-foreground mt-0 mb-2 text-xs md:text-sm">{habit.description}</p>    
                </div>
                
            </CardBody>
        </Card>
        </motion.div>
    );

}

