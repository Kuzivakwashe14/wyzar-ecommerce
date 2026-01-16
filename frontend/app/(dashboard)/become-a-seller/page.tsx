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
  // Payment details
  ecocashNumber: z.string().min(9, "Please enter a valid EcoCash number").optional().or(z.literal("")),
  ecocashName: z.string().optional().or(z.literal("")),
  bankName: z.string().optional().or(z.literal("")),
  bankAccountName: z.string().optional().or(z.literal("")),
  bankAccountNumber: z.string().optional().or(z.literal("")),
  whatsappNumber: z.string().min(9, "Please enter a valid WhatsApp number").optional().or(z.literal("")),
  whatsappNumber2: z.string().optional().or(z.literal("")),
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
  const { user, isAuthenticated, loading, login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Define the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      ecocashNumber: "",
      ecocashName: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      whatsappNumber: "",
      whatsappNumber2: "",
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
    formData.append("verificationDocument", values.verificationDocument[0]);
    // Payment details
    if (values.ecocashNumber) formData.append("ecocashNumber", values.ecocashNumber);
    if (values.ecocashName) formData.append("ecocashName", values.ecocashName);
    if (values.bankName) formData.append("bankName", values.bankName);
    if (values.bankAccountName) formData.append("bankAccountName", values.bankAccountName);
    if (values.bankAccountNumber) formData.append("bankAccountNumber", values.bankAccountNumber);
    if (values.whatsappNumber) formData.append("whatsappNumber", values.whatsappNumber);
    if (values.whatsappNumber2) formData.append("whatsappNumber2", values.whatsappNumber2);

    try {
      // We must use 'api.post' from our context to send the auth token
      const response = await api.post("/seller/apply", formData, {
        headers: {
          // This header is crucial for file uploads with FormData
          "Content-Type": "multipart/form-data",
        },
      });

      // Update the user in our AuthContext
      // We're doing a "soft" login to refresh the user data
      await login(localStorage.getItem('token')!); 

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

          {/* Payment Details Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-shop_dark_green">Payment Details</h3>
            <p className="text-sm text-gray-600">
              Enter your payment details so customers can pay you directly.
            </p>
            
            {/* EcoCash Section */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700">EcoCash</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="ecocashNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EcoCash Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 0772123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ecocashName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bank Transfer Section */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700">Bank Transfer (Optional)</h4>
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CBZ Bank" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="bankAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* WhatsApp Section */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700">WhatsApp Contact</h4>
              <p className="text-xs text-gray-500">Customers can confirm payment via WhatsApp</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +263772123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappNumber2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary WhatsApp (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., +263772654321" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

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
