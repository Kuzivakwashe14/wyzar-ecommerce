// In frontend/app/(dashboard)/dashboard/products/edit/[id]/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { api, useAuth } from "@/context/AuthContent";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
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
import { Product } from "@/components/ProductCard"; // Reuse type

// 1. Define the form schema (it's for UPDATING, so all fields are optional)
// We don't validate images here, as that's a more complex update
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.string().min(1, "Price is required."),
  category: z.string().min(2, "Category is required."),
  quantity: z.string().min(1, "Quantity is required."),
  deliveryTime: z.string().optional(),
  countryOfOrigin: z.string().optional(),
});

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get product ID from URL
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // 3. Define the form
  const form = useForm({
    resolver: zodResolver(formSchema),
    // We'll set default values after we fetch the product
  });

  // 4. Fetch the product data to pre-fill the form
  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const productData = res.data;
        setProduct(productData);

        // Pre-fill the form with existing data (convert numbers to strings)
        form.reset({
          name: productData.name,
          description: productData.description,
          price: String(productData.price),
          category: productData.category,
          quantity: String(productData.quantity),
          deliveryTime: productData.deliveryTime,
          countryOfOrigin: productData.countryOfOrigin,
        });

      } catch (err) {
        toast("Error", { description: "Could not fetch product details." });
        router.push("/dashboard/products");
      }
    };
    fetchProduct();
  }, [id, form, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  // 5. Define the submit handler (to UPDATE)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("price", values.price);
      formData.append("category", values.category);
      formData.append("quantity", values.quantity);
      if (values.deliveryTime) formData.append("deliveryTime", values.deliveryTime);
      if (values.countryOfOrigin) formData.append("countryOfOrigin", values.countryOfOrigin);

      if (selectedFiles) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("productImages", selectedFiles[i]);
        }
      }

      // Use the PUT route with multipart/form-data
      await api.put(`/products/${product?._id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast(
        "Success!", {
        description: "Your product has been updated.",
      });
      router.push("/dashboard/products"); // Go back to products list

    } catch (error: any) {
      console.error("Product update failed:", error);
      let errorMessage = "Update failed. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      toast(
        "Error", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // 6. Loading State
  if (authLoading || !product) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading product...</p></div>;
  }

  // 7. Build the form
  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        &larr; Back to Products
      </Button>
      <h2 className="text-3xl font-bold text-center mb-8">Edit Product</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
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
                <FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload Section */}
          <div className="space-y-2">
            <FormLabel>Update Images (Optional)</FormLabel>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Uploading new images will replace the existing ones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="number" step="1" {...field} />
                  </FormControl>
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
                <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
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
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving Changes..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}