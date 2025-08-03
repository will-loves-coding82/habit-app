"use client";

import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@heroui/avatar";
import { Key, useActionState, useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
import { useHabitContext } from "@/app/context/context";
import { Habit } from "../types";
import { Skeleton } from "@heroui/skeleton";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Ellipsis, Pen, Upload } from "lucide-react";
import { CircularProgress } from "@heroui/progress";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@/components/ui/button";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { Input, Textarea } from "@heroui/input";
import { Form } from "@heroui/form";
import { describe } from "node:test";
import { title } from "process";

export default function ProfilePage() {

    const supabase = createClient();
    const [avatarURL, setAvatarURL] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [downloadingAvatar, setDownloadingAvatar] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

    // const [newTitle, setNewTitle] = useState<string>("");
    // const [newDescription, setNewDescription] = useState<string>( "");

    const [formData, setFormData] = useState<{
        title: string | null,
        description: string | null,
    }>({
        title: null,
        description: null
    });


    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { uniqueHabits, isLoadingUser, isLoadingUniqueHabits } = useHabitContext();

    const {
        isDeletingHabit,
        isUpdatingHabit,
        onDeleteHabit,
        onUpdateHabit
    } = useHabitContext();

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

    useEffect(() => {
        async function downloadImage() {
            setDownloadingAvatar(true)

            try {
                const { data, error } = await supabase.storage
                    .from('avatars')
                    .download(`${user?.id}/profile.jpg`)

                if (error) { throw error }
                const url = URL.createObjectURL(data)
                setAvatarURL(url)
            } catch (error) {
                console.log('Error downloading image: ', error)
            }
            
            setDownloadingAvatar(false)
        
        }
        if (user) { downloadImage() }
    }, [user])


    const handleUpdateModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const resetForm = () => {
        setFormData({
            title: selectedHabit?.title ?? null,
            description: selectedHabit?.description ?? null
        })
    }


    // https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs?queryGroups=database-method&database-method=dashboard&queryGroups=language&language=ts#create-an-upload-widget
    const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
        try {
            setUploadingAvatar(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload")
            }

            const file = event.target.files[0]
            const fileExtension = file.name.split('.').pop()
            const filePath = `${user?.id}/profile.${fileExtension}`

            if (avatarURL !== null) {
                const { error: replaceError } = await supabase.storage
                    .from('avatars')
                    .update(filePath, file, {
                        cacheControl: "3600",
                        upsert: true
                    })
                if (replaceError) {
                    console.log(replaceError.message)
                    throw replaceError
                }
                else {
                    addToast({
                        title: "Image Successfully Uploaded",
                        description: "It might take a few minutes for the changes to update.",
                        classNames: {
                            base: cn(["mb-4 mr-4"])
                        }
                    });
                }
            }
            else {
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file)

                if (uploadError) {
                    throw uploadError
                }
                else {
                    addToast({
                        title: "Image Successfully Uploaded",
                        description: "It might take a few minutes for the changes to update.",
                        classNames: {
                            base: cn(["mb-4 mr-4"])
                        }
                    });
                }
            }
        }
        catch (error) {    
            console.log(error)        
            addToast({
                color: "danger",
                title: "Error Uploading Avatar",
                description: "Please try again",
                classNames: {
                    base: cn(["mb-4 mr-4"])
                }
            });
        }
        finally {
            setUploadingAvatar(false)
        }
    }

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
                    <>
                    <div className="relative flex justify-start items-center gap-2">
                        <Dropdown className="bg-accent" backdrop="blur" radius="sm">
                            <DropdownTrigger onClick={() => setSelectedHabit(habit)}>
                                <Ellipsis className="rounded-sm hover:cursor-pointer" />
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Static Actions">
                                <DropdownItem 
                                    key="edit" 
                                    onClick={() =>  {
                                        setIsEditModalOpen(true)
                                        setFormData({
                                            title: habit.title,
                                            description:  habit.description
                                        })
                                    }}>
                                    Edit habit
                                </DropdownItem>
                                <DropdownItem key="delete" className="text-danger" color="danger" onClick={() =>  onDeleteHabit(habit)}>
                                    Delete habit
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                    </>
                )

        }
    }, [])

    return (
        <section className="flex flex-col py-16 w-full max-w-3xl px-5 mx-auto flex flex-col justify-center gap-8 text-center">
            <div className="relative inline-flex mx-auto">

                {avatarURL ?
                    <Avatar src={avatarURL} size="lg" className="text-2xl w-24 h-24 mx-auto" classNames={{ icon: "text-primary w-16 h-16", base: "bg-accent mx-auto" }} />
                    :
                    <Avatar size="lg" className="text-2xl w-24 h-24 mx-auto" classNames={{ icon: "text-primary w-16 h-16", base: "bg-accent mx-auto" }} />
                }
                <button
                    disabled={downloadingAvatar}
                    className="z-100 absolute top-0 end-0 p-2 rounded-full bg-accent border-background border-5 translate-x-1/2"
                    onClick={() => setIsAvatarModalOpen(true)}
                >
                    <Pen size={12} />
                </button>

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
                                        id="title"
                                        name="title"
                                        type="text"
                                        label="Title"
                                        placeholder="Enter a title"
                                        variant="bordered"
                                        radius="sm"
                                        required
                                        onChange={handleUpdateModalInputChange}
                                        value={formData.title ?? selectedHabit?.title}
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
                                        onChange={handleUpdateModalInputChange}
                                        value={formData.description ?? selectedHabit?.description}
                                        />
                                    </div>
                                </Form>

                                <div className="flex justify-end w-full mb-4">
                                    <Button type="submit" size="sm" className="ml-2" onClick={() => onUpdateHabit(selectedHabit, formData.title, formData.description)}>
                                        {isUpdatingHabit ? "Updating..." : "Submit"}
                                    </Button>
                                </div>
                                
                            </ModalBody>
                        </ModalContent>
                    </Modal>

                <Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} className="bg-accent" radius="sm" isDismissable={false} >
                    <ModalContent>
                        <ModalHeader>Upload a Photo</ModalHeader>
                        <ModalBody className="flex flex-col gap-8 mt-[-24px]">
                            <p className="text-muted-foreground text-sm">Once an image is provided, it might take a few minutes to update.</p>

                            <label htmlFor="dropzone-file" className="hover:cursor-pointer hover:bg-background/25 flex flex-col gap-2 border-dashed border-2 border-muted-foreground rounded-md w-full p-8 flex justify-center items-center">
                                <p className="text-muted-foreground text-sm">Click to upload a .jpg image</p>
                                { uploadingAvatar ?  <CircularProgress /> : <Upload size={24} />}
                                <input accept=".jpg" id="dropzone-file" type="file" className="hidden mx-auto" onChange={uploadAvatar} />
                            </label>

                            <div className="flex justify-end w-full mb-4">
                                <Button variant="default" type="reset" size="sm" onClick={() => setIsEditModalOpen(false)}>
                                    Cancel
                                </Button>
                            </div>

                        </ModalBody>
                    </ModalContent>
                </Modal>
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

                            {(columnKey) => 
                                <>
                                <TableCell>{renderCell(item, columnKey)}</TableCell>                
                                </>
                            }
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </section>
    )
}