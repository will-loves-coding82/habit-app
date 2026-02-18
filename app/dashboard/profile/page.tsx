"use client";

import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@heroui/avatar";
import { useEffect, useState } from "react";
import { Calendar, Pen, Upload } from "lucide-react";
import { CircularProgress } from "@heroui/progress";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@/components/ui/button";
import { addToast } from "@heroui/toast";
import { cn } from "@heroui/theme";
import { useQuery } from "@tanstack/react-query";
import userQueries from "../../query/user";
import { Card } from "@heroui/card";
import { useRouter } from "next/navigation";


/**
 * ProfilePage defines the interace to view and
 * update a user's profile picture and habits.
 * 
 * @returns React JSX
 */
export default function ProfilePage() {

	const supabase = createClient();
	const router = useRouter();
	const logout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/");
	};

  	const {data: user, isFetching: isLoadingUser} = useQuery(userQueries.getUser())

	const [avatarURL, setAvatarURL] = useState<string | null>(null);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [downloadingAvatar, setDownloadingAvatar] = useState(false);
	const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

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

				<Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} className="bg-accent" radius="sm" isDismissable={false} >
					<ModalContent>
						<ModalHeader>Upload a Photo</ModalHeader>
						<ModalBody className="flex flex-col gap-8 mt-[-24px]">
							<p className="text-muted-foreground text-sm">Once an image is provided, it might take a few minutes to update.</p>

							<label htmlFor="dropzone-file" className="hover:cursor-pointer hover:bg-background/25 flex flex-col gap-2 border-dashed border-2 border-muted-foreground rounded-md w-full p-8 flex justify-center items-center">
								<p className="text-muted-foreground text-sm">Click to upload a .jpg image</p>
								{uploadingAvatar ? <CircularProgress /> : <Upload size={24} />}
								<input accept=".jpg" id="dropzone-file" type="file" className="hidden mx-auto" onChange={uploadAvatar} />
							</label>

							<div className="flex justify-end w-full mb-4">
								<Button variant="default" type="reset" size="sm" onClick={() => setIsAvatarModalOpen(false)}>
									Cancel
								</Button>
							</div>

						</ModalBody>
					</ModalContent>
				</Modal>
			</div>

			<header>
				<h1 className="text-4xl font-semibold">{user?.user_metadata.username}</h1>
				<p className="text-muted-foreground">{user?.email}</p>
			</header>

			<Card radius="lg" shadow="none" className="p-4 w-full max-w-lg mx-auto mt-12 bg-card text-muted-foreground">
				<span className="inline-flex justify-between items-center">
					<div className="inline-flex items-center gap-4 w-fit">
						<Calendar size={24}/>
						<p className="mt-1 font-medium">Joined</p>
					</div>
					<p className="mt-1">
						{ user &&
							new Date(user.created_at).toLocaleString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
								hour12: true,
							}).replace("at", "")
						}
					</p>
				</span>
			</Card>

			<Button onClick={logout} className="bg-primary w-full max-w-lg text-muted rounded-xl py-3 px-4 mx-auto hover:cursor-pointer">Logout</Button>

		</section>
	)
}