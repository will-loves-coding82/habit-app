"use client";

import { AnimatePresence, motion} from "motion/react"
import { Habit, HabitCardProps } from "@/app/types";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Alert } from "@heroui/alert";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, Ellipsis } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useTheme } from "next-themes";
import { isHabitCompletedEarly, isHabitCompletedOnTime, isHabitLate } from "@/lib/functions";
import { Form } from "@heroui/form";
import { Input, Textarea } from "@heroui/input";
import { useForm } from "@tanstack/react-form";
import habitQueries from "../app/query/data";


export interface EditHabitFormData {
	targetHabit: Habit,
	title: string,
	description: string,
}

/**
 * Interactive card that displays a habit's information. Users can check off a habit by toggling 
 * the built-in checkbox form. Each card also comes with the ability to edit or delete its 
 * information in the database.
 */
export default function HabitCard({ habit, type }: HabitCardProps) {

	const { mutate: deleteHabit, isPending: isDeletingHabit } = habitQueries.deleteHabit()
	const { mutate: editHabit, isPending: isEditingHabit } = habitQueries.editHabit()
	const { mutate: toggleCompleteHabit } = habitQueries.toggleCompleteHabit()


	const { resolvedTheme } = useTheme();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const isCompletedEarly = isHabitCompletedEarly(habit)
	const isCompletedOnTime = isHabitCompletedOnTime(habit);
	const isLate = isHabitLate(habit);

	const defaultEditHabitData: EditHabitFormData = {
		targetHabit: habit,
		title: habit.title,
		description: habit.description,
	};

	const editHabitForm = useForm({
		defaultValues: defaultEditHabitData,
		onSubmit: async ({ value }) => {
			await editHabit(value)
			editHabitForm.reset()
			setIsEditModalOpen(false)
		},
	})

	// Polling to refresh the UI component every minute
	const [, setNow] = useState(Date.now());
	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 60000);
		return () => clearInterval(interval);
	}, []);


	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 50 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ scale: 0 }}
				layout
			>
				<Modal isOpen={isDeleteModalOpen && !isDeletingHabit} onClose={() => setIsDeleteModalOpen(false)} className="bg-accent" radius="sm" isDismissable={false} >
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
							<Button className="ml-2 bg-danger hover:bg-danger text-white" onClick={async () => deleteHabit({targetHabit: habit})}>
								{isDeletingHabit ? "Deleting..." : "Delete"}
							</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

				<Modal
					isOpen={isEditModalOpen}
					onClose={() => {
						editHabitForm.reset()
						setIsEditModalOpen(false)
					}}
					radius="sm" isDismissable={false}>
					<ModalContent>
						<ModalHeader>Update Habit Details</ModalHeader>
						<ModalBody className="flex flex-col gap-8 mt-[-24px]">

							<Form className="mt-8" onSubmit={(e) => {
								e.preventDefault();
								editHabitForm.handleSubmit()
							}}
							>
								<editHabitForm.Field name="title" children={(field) =>
									<Input
										className="flex flex-col gap-4 w-full"
										aria-label="title"
										label="Title"
										id="title"
										name="title"
										type="text"
										placeholder={habit.title}
										variant="bordered"
										radius="sm"
										required
										defaultValue={habit.title}
										value={field.state.value ?? habit.title}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								} />

								<editHabitForm.Field name="description" children={(field) =>
									<Textarea
										aria-label="description"
										label="Description"
										id="description"
										name="description"
										type="text"
										placeholder={habit.description}
										variant="bordered"
										radius="sm"
										required
										defaultValue={habit.description}
										value={field.state.value ?? habit.description} onChange={(e) => field.handleChange(e.target.value)}
									/>
								} />
							</Form>

							<div className="flex justify-end w-full mb-4">
								<Button type="submit" variant="secondary" size="sm" className="ml-2 text-white" onClick={editHabitForm.handleSubmit}>
									{isEditingHabit ? "Updating..." : "Submit"}
								</Button>
							</div>
						</ModalBody>
					</ModalContent>
				</Modal>

				<Card className="w-full rounded-xl bg-card px-3 z-0 border-2" shadow="none">
					<CardHeader>
						<span className="flex items-center justify-between w-full gap-8 text-muted-foreground text-sm mt-1">
							<div className="flex items-center">

								<Calendar className="w-4 h-4 text-xs mb-1 mr-2" />

								<p className="text-muted-foreground mr-4">
									{new Date(habit.due_date).toLocaleString("en-US", {
										month: "short",
										day: "numeric",
										hour: "numeric",
										minute: "2-digit",
										hour12: true,
									}).replace("at", "")}
								</p>

								<AnimatePresence >
									{habit.is_complete && isCompletedEarly && 
										<motion.p transition={{ease: "backOut"}} layoutId={`completed_early_${habit.id}`} key={`completed_early_${habit.id}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} layout className="text-blue-500 px-2 py-[2px] bg-blue-600/20 rounded-md">completed early</motion.p>
									}
									{habit.is_complete && !isCompletedEarly && isCompletedOnTime &&
										<motion.p transition={{ease: "backOut"}} layoutId={`completed_on_time_${habit.id}`} key={`completed_on_time_${habit.id}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} layout className="text-success px-2 py-[2px] bg-success/30 rounded-md">complete</motion.p>
									}
									{habit.is_complete && !isCompletedOnTime && !isCompletedEarly &&
										<motion.p transition={{ease: "backOut"}} layoutId={`completed_late_${habit.id}`} key={`completed_late_${habit.id}`}  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-warning px-2 py-[2px] bg-warning/25 text-warning rounded-md">completed late</motion.p>
									}
									{!habit.is_complete && isLate &&
										<motion.p transition={{ease: "backOut"}} layoutId={`late_${habit.id}`} key={`late_${habit.id}`} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-danger px-2 py-[2px] bg-danger/25 rounded-md">late</motion.p>
									}
								</AnimatePresence>

							</div>

							<Dropdown className="bg-accent" backdrop="blur" radius="sm">
								<DropdownTrigger>
									<Ellipsis className="rounded-sm hover:cursor-pointer" />
								</DropdownTrigger>
								<DropdownMenu aria-label="Static Actions" variant="faded" >
									<DropdownItem key="edit" onClick={() => setIsEditModalOpen(true)} >Edit habit</DropdownItem>
									<DropdownItem key="delete" className="text-danger" color="danger" onClick={() => setIsDeleteModalOpen(true)}>
										Delete habit
									</DropdownItem>
								</DropdownMenu>
							</Dropdown>
						</span>
					</CardHeader>

					<CardBody className="flex flex-row items-start mt-[-12px]">
						<Checkbox
							checked={habit.is_complete}
							onCheckedChange={async (checked) =>
								toggleCompleteHabit({ targetHabit: habit, isComplete: Boolean(checked) })
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
		</AnimatePresence>

	);
}

