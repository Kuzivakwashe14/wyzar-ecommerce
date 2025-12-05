// In frontend/app/(dashboard)/become-a-seller/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api, useAuth } from "@/context/AuthContent";
import { toast } from "sonner"
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

// 1. Define the form schema
// Note: We use z.any() for the file input
const formSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  sellerType: z.enum(["individual", "business", "international"]).refine((val) => val !== undefined, {
    message: "You need to select a seller type.",
  }),
  verificationDocument: z.any()
    .refine((files) => files?.length === 1, "Verification document is required.")
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => ["image/jpeg", "image/png", "application/pdf"].includes(files?.[0]?.type),
      "Only .jpg, .png, or .pdf files are accepted."
    ),
});

export default function BecomeASellerPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, refreshSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
    },
  });
  
  // We need to register the file input manually
  const fileRef = form.register("verificationDocument");

  // 3. Protect the page
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push("/login"); // Not logged in, go to login
      }
      if (isAuthenticated && user?.isSeller) {
        router.push("/dashboard"); // Already a seller, go to dashboard
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // 4. Define the submit handler (using FormData)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    // We MUST use FormData to send files
    const formData = new FormData();
    formData.append("businessName", values.businessName);
    formData.append("sellerType", values.sellerType);
    formData.append("verificationDocument", values.verificationDocument[0]); // Append the file

    try {
      // We must use 'api.post' from our context to send the auth token
      const response = await api.post("/seller/apply", formData, {
        headers: {
          // This header is crucial for file uploads with FormData
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the user in our AuthContext
      // Refresh the session to get updated user data
      await refreshSession(); 

      toast(
        "Success!",{
        description: "Your seller application has been submitted.",
      });
      
      // Send them to their new (but pending) dashboard
      router.push("/dashboard"); 

    } catch (error: any) {
      console.error("Application failed:", error);
      let errorMessage = "Application failed. Please try again.";
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

  // 5. Show loading spinner while checking auth
  if (loading || (!loading && (!isAuthenticated || user?.isSeller))) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 6. Build the form component
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-shop_dark_green">Become a Seller</h2>
      <p className="text-center text-gray-600 mb-8">
        Apply to sell on WyZar by filling out the form below. 
        Your application will be reviewed within 3-5 business days.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          
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

          <FormField
            control={form.control}
            name="sellerType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel className="text-shop_dark_green font-medium">Seller Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <FormItem className={`flex items-center space-x-3 space-y-0 p-4 rounded-lg border-2 transition-all cursor-pointer ${field.value === 'individual' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                      <FormControl>
                        <RadioGroupItem value="individual" className="border-shop_dark_green text-shop_dark_green" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Individual / Informal Trader
                      </FormLabel>
                    </FormItem>
                    <FormItem className={`flex items-center space-x-3 space-y-0 p-4 rounded-lg border-2 transition-all cursor-pointer ${field.value === 'business' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                      <FormControl>
                        <RadioGroupItem value="business" className="border-shop_dark_green text-shop_dark_green" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Registered Local Business (Pvt Ltd)
                      </FormLabel>
                    </FormItem>
                    <FormItem className={`flex items-center space-x-3 space-y-0 p-4 rounded-lg border-2 transition-all cursor-pointer ${field.value === 'international' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                      <FormControl>
                        <RadioGroupItem value="international" className="border-shop_dark_green text-shop_dark_green" />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        International Seller
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="verificationDocument"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Document</FormLabel>
                <FormControl>
                  {/* We use our manual 'fileRef' here */}
                  <Input type="file" {...fileRef} />
                </FormControl>
                <FormDescription>
                  Upload your National ID (for individuals) or Company Certificate (for businesses). PDF, JPG, or PNG. (Max 5MB)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
