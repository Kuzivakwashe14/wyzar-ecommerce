// In frontend/app/(dashboard)/dashboard/products/new/page.tsx
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. Define the categories
const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home & Living",
  "Mobile & Accessories",
  "Beauty & Health",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games"
];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.string().min(1, "Price is required."),
  category: z.string().min(1, "Category is required."),
  quantity: z.string().min(1, "Quantity is required."),
  deliveryTime: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  productImages: z.any()
    .refine((files) => files?.length >= 1, "At least one image is required.")
    .refine((files) => files?.length <= 5, "Maximum 5 images allowed.")
    .refine((files) =>
      Array.from(files).every((file: any) => file?.size <= MAX_FILE_SIZE),
      `Max file size is 5MB.`
    )
    .refine((files) =>
      Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file?.type)),
      "Only .jpg, .jpeg, and .png files are accepted."
    ),
});

export default function NewProductPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Protect page (same as dashboard)
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) router.push("/login");
      else if (!user?.isSeller) router.push("/become-a-seller");
    }
  }, [isAuthenticated, user, loading, router]);

  // 3. Define the form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      category: "",
      quantity: "",
      deliveryTime: "",
      countryOfOrigin: "",
    },
  });
  const fileRef = form.register("productImages");

  // 4. Define the submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // We MUST use FormData for file uploads
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("price", String(values.price));
    formData.append("category", values.category);
    formData.append("quantity", String(values.quantity));
    formData.append("deliveryTime", values.deliveryTime || "");
    formData.append("countryOfOrigin", values.countryOfOrigin || "");

    // Append all files
    Array.from(values.productImages).forEach((file: any) => {
      formData.append("productImages", file);
    });

    try {
      await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast(
        "Success!", {
        description: "Your product has been listed.",
      });
      
      form.reset();
      router.push("/dashboard"); // Go back to dashboard

    } catch (error: any) {
      console.error("Product creation failed:", error);
      let errorMessage = "Creation failed. Please try again.";
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
  if (loading || !user || !user.isSeller) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }

  // 6. Build the form
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        &larr; Back to Dashboard
      </Button>
      <h2 className="text-3xl font-bold text-center mb-8">List a New Product</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl><Input placeholder="e.g., Wireless Bluetooth Headphones" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Description</FormLabel>
                <FormControl><Textarea placeholder="Describe your product..." className="min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productImages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Images</FormLabel>
                <FormControl>
                  <Input type="file" {...fileRef} multiple />
                </FormControl>
                <FormDescription>Upload 1-5 images (JPG, PNG). Max 5MB each.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl><Input type="number" step="0.01" placeholder="e.g., 29.99" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
                  <FormControl><Input type="number" step="1" placeholder="e.g., 100" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Est. Delivery Time (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., 3-5 business days" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryOfOrigin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country of Origin (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., China, Zimbabwe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Listing Product..." : "List Product"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
