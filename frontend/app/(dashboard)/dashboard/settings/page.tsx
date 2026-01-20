// In frontend/app/(dashboard)/dashboard/settings/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api, useAuth } from "@/context/AuthContent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// 1. Define the form schema
const formSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
});

export default function SettingsPage() {
  const router = useRouter();
  // We need 'login' to refresh the user state
  const { user, isAuthenticated, loading, refreshUser, login } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "", // We'll set this in useEffect
    },
  });

  // 3. Protect page and pre-fill form
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        login();
      } else if (!user?.isSeller) {
        router.push("/become-a-seller");
      } else {
        // Pre-fill the form with user's current business name
        form.reset({
          businessName: user.sellerDetails?.businessName || "",
        });
      }
    }
  }, [isAuthenticated, user, loading, router, form]);


  // 4. Define the submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // Call our new PUT route
      const response = await api.put("/seller/profile", values);

      // Refresh the user data in our context
      await refreshUser();   

      toast(
        "Success!",{
        description: "Your business profile has been updated.",
      });

    } catch (error: any) {
      console.error("Profile update failed:", error);
      let errorMessage = "Update failed. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      toast(
        "Error",{
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5. Loading State
  if (loading || !user) {
    return <div className="container py-8"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-8">Seller Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            This is your public information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business or Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Zim Electronics" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the name customers will see.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
