import { useMemo, useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { useTransactions } from "@/hooks/useTransactions";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
	first_name: z.string().min(1, "First name is required").max(100),
	last_name: z.string().min(1, "Last name is required").max(100),
	phone_number: z
		.string()
		.min(7, "Phone number seems short")
		.max(20, "Phone number seems long")
		.optional()
		.or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const Profile = () => {
	const { profile, refreshProfile } = useAuth();
	const { toast } = useToast();
	const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatar_url || "");
	const avatarInputRef = useRef<HTMLInputElement>(null);
	const { data: favorites = [] } = useFavorites(profile?.user_id || "");
	const { data: transactions = [] } = useTransactions(profile?.user_id || "");

	// Avatar upload handler
	const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file || !profile) return;
	const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
	const filePath = `avatars/${profile.user_id}_${Date.now()}_${safeName}`;
		const { data, error } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
		if (error) {
			toast({ title: "Avatar upload failed", description: error.message, variant: "destructive" });
			return;
		}
		const { publicUrl } = supabase.storage.from("avatars").getPublicUrl(filePath).data;
		setAvatarUrl(publicUrl);
		// Save avatar URL to profile
		// @ts-expect-error
		const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("user_id", profile.user_id);
		if (updateError) {
			toast({ title: "Avatar DB update failed", description: updateError.message, variant: "destructive" });
			return;
		}
		await refreshProfile();
		toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
	};

	useEffect(() => {
		setAvatarUrl(profile?.avatar_url || "");
	}, [profile]);

	const defaultValues = useMemo(
		() => ({
			first_name: profile?.first_name || "",
			last_name: profile?.last_name || "",
			phone_number: profile?.phone_number || "",
		}),
		[profile]
	);

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const onSubmit = async (values: FormValues) => {
		try {
			if (!profile) throw new Error("No profile loaded");

			const { error } = await (supabase as any)
				.from("users")
				.update({
					first_name: values.first_name,
					last_name: values.last_name,
					phone_number: values.phone_number || null,
				})
				.eq("user_id", profile.user_id);

			if (error) throw error;

			await refreshProfile();

			toast({
				title: "Profile updated",
				description: "Your personal details have been saved.",
			});
		} catch (err: any) {
			toast({
				title: "Update failed",
				description: err.message || String(err),
				variant: "destructive",
			});
		}
	};

	return (
			<DashboardLayout role={(profile?.role?.toLowerCase() as any) || "tenant"}>
				<div className="max-w-2xl mx-auto space-y-8">
					<Card>
						<CardHeader className="flex flex-col items-center gap-2">
							<div className="flex flex-col items-center gap-2">
								<Avatar>
									<AvatarImage src={avatarUrl} alt={profile?.first_name} />
									<AvatarFallback>{profile?.first_name?.[0] || "U"}</AvatarFallback>
								</Avatar>
								<input
									type="file"
									accept="image/*"
									ref={avatarInputRef}
									onChange={handleAvatarUpload}
									className="mt-2"
								/>
								<Badge variant="secondary" className="mt-2">{profile?.role}</Badge>
							</div>
							<CardTitle>Edit Profile</CardTitle>
							<CardDescription>Update your personal details</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="first_name">First name</Label>
										<Input id="first_name" {...register("first_name")} />
										{errors.first_name && (
											<p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
										)}
									</div>
									<div>
										<Label htmlFor="last_name">Last name</Label>
										<Input id="last_name" {...register("last_name")} />
										{errors.last_name && (
											<p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
										)}
									</div>
								</div>

								<div>
									<Label htmlFor="phone_number">Phone number</Label>
									<Input id="phone_number" {...register("phone_number")} />
									{errors.phone_number && (
										<p className="text-sm text-destructive mt-1">{errors.phone_number.message}</p>
									)}
								</div>

								<div className="flex justify-end gap-2">
									<Button type="button" variant="ghost" onClick={() => reset(defaultValues)} disabled={isSubmitting}>
										Reset
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting ? "Saving..." : "Save changes"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Favorites Section */}
					<Card>
						<CardHeader>
							<CardTitle>Favorite Properties</CardTitle>
							<CardDescription>Properties you have marked as favorite</CardDescription>
						</CardHeader>
						<CardContent>
							{favorites.length === 0 ? (
								<p className="text-muted-foreground">No favorites yet.</p>
							) : (
								<ul className="space-y-2">
									{favorites.map((fav: any) => (
										<li key={fav.id} className="border rounded p-2 flex justify-between items-center">
											<span>{fav.property?.address || fav.property?.address_line_1} ({fav.property?.city})</span>
											<Button size="sm" variant="outline" asChild>
												<a href={`/property/${fav.property_id}`}>View</a>
											</Button>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</div>
			</DashboardLayout>
	);
};

export default Profile;
