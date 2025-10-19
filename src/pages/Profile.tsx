import { useMemo, useEffect } from "react";
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
import type { TablesUpdate } from "@/integrations/supabase/types";

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

  // Reset form when profile changes
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!profile) throw new Error("No profile loaded");

      const payload: TablesUpdate<'users'> = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone_number: values.phone_number || null,
      };

      const { error } = await (supabase as any)
        .from("users")
        .update(payload)
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
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
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
      </div>
    </DashboardLayout>
  );
};

export default Profile;
