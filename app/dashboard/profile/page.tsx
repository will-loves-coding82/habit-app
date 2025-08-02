"use client";

import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@heroui/avatar";
import { Key, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { useHabits } from "@/app/hooks/useHabits";
import { useHabitContext } from "@/app/context/context";
import { Habit } from "../types";
import { Skeleton } from "@heroui/skeleton";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Edit, Ellipsis, Pen } from "lucide-react";
import { CircularProgress } from "@heroui/progress";

export default function ProfilePage() {

    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [avatarURL, setAvatarURL] = useState(null);
    const [user, setUser] = useState<User | null>(null);

    const supabase = createClient();
    const { uniqueHabits, isLoadingUser, isLoadingUniqueHabits } = useHabitContext();


    const fetchUserData = async () => {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
            console.log(error)
        }
        else {
            setUser(data.user);
        }
    }


    useEffect(() => {
        fetchUserData();
    }, [])


    const columns = [
        {
            key: "title",
            label: "TITLE"
        },
        {
            key: "created_at",
            label: "CREATED DATE"
        },
        {
            key: "recurrence",
            label: "RECURRENCE"
        },
        {
            key: "actions",
            label: "ACTIONS"
        }
    ]

    const renderCell = useCallback((habit: Habit, columnKey: Key) => {
        switch (columnKey) {
            case "title":
                return (
                    <p>{habit.title}</p>
                )
            case "recurrence":
                return (
                    <p>{habit.recurrence_type}</p>
                )
            case "created_at":
                return (
                    <p>{new Date(habit.due_date).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                    }).replace("at", "")}
                    </p>
                )
            case "actions":
                return (
                     <div className="relative flex justify-start items-center gap-2">
                    <Dropdown className="bg-accent" backdrop="blur" radius="sm">
                        <DropdownTrigger>
                            <Ellipsis className="rounded-sm hover:cursor-pointer" />
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Static Actions">
                            <DropdownItem key="edit">Edit habit</DropdownItem>
                            <DropdownItem key="delete" className="text-danger" color="danger">
                                Delete habit
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                    </div>
                )

        }
    }, [])

    return (
        <section className="flex flex-col py-16 w-full max-w-3xl px-5 mx-auto flex flex-col justify-center gap-8 text-center">

            <div className="relative inline-flex mx-auto">
                <Avatar size="lg" className="text-2xl w-24 h-24 mx-auto" classNames={{ icon: "text-primary w-16 h-16", base: "bg-accent mx-auto" }} />
                <button className="z-100 absolute top-0 end-0 p-2 rounded-full bg-accent border-background border-5 translate-x-1/2 ">
                    <Pen size={12}/>
                </button>
            </div>

            {isLoadingUser ?
                <Skeleton className="rounded-lg w-24">
                    <div className="h-4" />
                </Skeleton>
                :
                <header>
                    <h1 className="text-4xl font-semibold">{user?.user_metadata.username}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                </header>
            }

            <Table
                fullWidth={true}
                shadow="none"
                aria-label="Example table with dynamic content"
                classNames={{
                    table: "min-h-[180px]",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    isLoading={isLoadingUniqueHabits}
                    loadingContent={<CircularProgress />}
                    items={uniqueHabits}
                >
                    {(item: Habit) => (
                        <TableRow key={item.key}>

                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </section>
    )
}