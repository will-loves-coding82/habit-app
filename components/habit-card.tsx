import { motion } from "motion/react"
import { HabitCardProps } from "@/app/types";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Alert } from "@heroui/alert";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useTheme } from "next-themes";
import { isHabitCompletedOnTime, isHabitLate } from "@/lib/functions";
import { Form } from "@heroui/form";
import { Input, Textarea } from "@heroui/input";



export default function HabitCard({ habit, type, isDeleting, isUpdating, onUpdate, onComplete, onDelete} : HabitCardProps) {

    const { resolvedTheme } = useTheme();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [formData, setFormData] = useState<{
        title: string,
        description: string,
    }>({
        title: habit.title,
        description: habit.description
    });

    const isCompletedOnTime = isHabitCompletedOnTime(habit);
    const isLate = isHabitLate(habit);
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;


    const handleEditModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData({
            title: habit.title,
            description: habit.description
        })
    }

    // Refresh the UI component every minute
    const [, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);


    return (

        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            layout
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

                        <header>
                            <h2 className="text-lg font-medium">{habit.title}</h2>
                            <p className="text-muted-foreground text-sm">{habit.description}</p>
                        </header>

                    </ModalBody>

                    <ModalFooter>
                        <Button variant="outline" type="reset" onClick={() => setIsDeleteModalOpen(false)} className="bg-accent">
                            Cancel
                        </Button>
                        <Button className="ml-2 bg-danger hover:bg-danger text-white" onClick={() => onDelete(habit)}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false)
                        resetForm()
                    }}
                    className="bg-accent" radius="sm" isDismissable={false}>
                    <ModalContent>
                        <ModalHeader>Update Habit Details</ModalHeader>
                        <ModalBody className="flex flex-col gap-8 mt-[-24px]">
                            <p className="text-muted-foreground text-sm">
                                Once your changes are saved, it might take a few minutes to see the changes.
                            </p>
                            <Form className="mt-[-12px]">
                                <div className="flex flex-col gap-4 w-full">
                                    <Input
                                        aria-label="title"
                                        label="Title"
                                        id="title"
                                        name="title"
                                        type="text"
                                        placeholder="Enter a title"
                                        variant="bordered"
                                        radius="sm"
                                        required
                                        onChange={handleEditModalInputChange}
                                        value={formData.title ?? habit.title}
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
                                        onChange={handleEditModalInputChange}
                                        value={formData.description ?? habit.description}
                                    />
                                </div>
                            </Form>

                            <div className="flex justify-end w-full mb-4">
                                <Button type="submit" size="sm" className="ml-2" onClick={() => onUpdate(habit, formData.title, formData.description)}>
                                    {isUpdating ? "Updating..." : "Submit"}
                                </Button>
                            </div>

                        </ModalBody>
                    </ModalContent>
                </Modal>


            <Card className="w-full rounded-md bg-card px-3 z-0" shadow="none">
                <CardHeader>
                    <span className="flex items-center justify-between w-full gap-8 text-muted-foreground text-sm mt-1">
                        <div className="flex items-center">

                            <Calendar className="w-4 h-4 text-xs mb-1 mr-2" />

                            <p className="text-muted-foreground mr-4">
                                {new Date(habit.due_date).toLocaleString("en-US", {
                                    timeZone: "UTC", // compensate for time zone differences in Supabase DB
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                }).replace("at", "")}
                            </p>

                            {habit.is_complete && isCompletedOnTime && !isLate &&
                                <motion.p key="complete" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }} layout className="text-success px-2 py-[2px] bg-success/20 rounded-md">complete</motion.p>
                            }
                            {habit.is_complete && !isCompletedOnTime && 
                                <motion.p key="completed_late" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}  className="text-warning px-2 py-[2px] bg-warning/25 text-warning rounded-md">completed late</motion.p>
                            }
                            {isLate && 
                                <motion.p key="late" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0, opacity: 0 }}  className="text-danger px-2 py-[2px] bg-danger/25 rounded-md">late</motion.p>
                            }
                        </div>

                        <Dropdown className="bg-accent" backdrop="blur" radius="sm">
                            <DropdownTrigger>
                                <Ellipsis className="rounded-sm hover:cursor-pointer" />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Static Actions" variant="faded" >
                                <DropdownItem key="edit" onClick = {() => setIsEditModalOpen(true)} >Edit habit</DropdownItem>
                                <DropdownItem key="delete" className="text-danger" color="danger" onClick={() => setIsDeleteModalOpen(true)}>
                                    Delete habit
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </span>

                </CardHeader>

                <CardBody className="flex flex-row items-start mt-[-12px]">
                    <Checkbox
                        disabled={type == "this_week"}
                        checked={habit.is_complete}
                        onCheckedChange={(checked) =>
                            onComplete(habit, Boolean(checked))
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

