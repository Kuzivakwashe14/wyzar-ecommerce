// In frontend/app/(dashboard)/checkout/page.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAuth } from "@/context/AuthContent";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { api } from "@/context/AuthContent";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import { Smartphone, Building2, Banknote } from "lucide-react";

// Get the backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// 1. Define the form schema for shipping
const shippingSchema = z.object({
  fullName: z.string().min(3, "Full name is required"),
  address: z.string().min(5, "A valid address is required"),
  city: z.string().min(2, "City is required"),
  phone: z.string().min(8, "A valid phone number is required"),
  paymentMethod: z.enum(["EcoCash", "BankTransfer", "CashOnDelivery"] as const, {
    message: "Please select a payment method",
  }),
});

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { cartItems, cartTotal, itemCount, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Protect the page
 useEffect(() => {
  if (!authLoading) {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout"); // Not logged in, redirect
    } else if (itemCount === 0) { // <-- ADD 'else' HERE
      router.push("/products"); // Logged in, but empty cart
    }
  }
}, [isAuthenticated, authLoading, itemCount, router]);

  // 3. Define the form
  const form = useForm<z.infer<typeof shippingSchema>>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      address: "",
      city: "",
      phone: "",
      paymentMethod: "EcoCash",
    },
  });

  // 4. Define the submit handler
 async function onSubmit(values: z.infer<typeof shippingSchema>) {
    setIsSubmitting(true);
    
    try {
      // Call our new backend route
      const response = await api.post('/orders/create', {
        shippingAddress: {
          fullName: values.fullName,
          address: values.address,
          city: values.city,
          phone: values.phone,
        },
        cartItems: cartItems,
        paymentMethod: values.paymentMethod,
      });

      const { paynowRedirectUrl, redirectUrl, message, paymentMethod } = response.data;

      // Clear the cart *after* order is created
      clearCart();

      // Show success message if in development mode
      if (message) {
        toast.success("Order Created", { description: message });
      }

      // Redirect to payment gateway (production) or success page (development)
      const finalRedirectUrl = paynowRedirectUrl || redirectUrl;
      if (finalRedirectUrl) {
        window.location.href = finalRedirectUrl;
      } else {
        // Fallback to order success page
        router.push('/order/success');
      }

    } catch (error: any) {
      console.error("Order creation failed:", error);
      let errorMessage = "Order failed. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = error.response.data.msg || errorMessage;
      }
      alert(`Error: ${errorMessage}`); // Use an alert for now
      setIsSubmitting(false);
    }
  }

  // 5. Show loading state
  if (authLoading || itemCount === 0) {
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
    <div className="container mx-auto max-w-4xl py-12">
      <h1 className="text-3xl font-bold text-center mb-8 text-shop_dark_green">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: Shipping Form */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-shop_dark_green">Shipping Details</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="e.Go., 123 Main St" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="e.g., Harare" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="For delivery updates" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method Selection */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-shop_dark_green font-medium">Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${field.value === 'EcoCash' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                          <RadioGroupItem value="EcoCash" id="ecocash" className="border-shop_dark_green text-shop_dark_green" />
                          <Label htmlFor="ecocash" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Smartphone className="h-5 w-5 text-shop_dark_green" />
                            <div>
                              <p className="font-medium">EcoCash</p>
                              <p className="text-sm text-gray-500">Pay via EcoCash mobile money</p>
                            </div>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${field.value === 'BankTransfer' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                          <RadioGroupItem value="BankTransfer" id="bank" className="border-shop_dark_green text-shop_dark_green" />
                          <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Building2 className="h-5 w-5 text-shop_dark_green" />
                            <div>
                              <p className="font-medium">Bank Transfer</p>
                              <p className="text-sm text-gray-500">Pay via bank deposit or transfer</p>
                            </div>
                          </Label>
                        </div>
                        <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${field.value === 'CashOnDelivery' ? 'border-shop_dark_green bg-shop_dark_green/5' : 'border-gray-200 hover:border-shop_light_green'}`}>
                          <RadioGroupItem value="CashOnDelivery" id="cod" className="border-shop_dark_green text-shop_dark_green" />
                          <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Banknote className="h-5 w-5 text-shop_light_green" />
                            <div>
                              <p className="font-medium">Cash on Delivery</p>
                              <p className="text-sm text-gray-500">Pay with cash when your order arrives</p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : form.watch("paymentMethod") === "CashOnDelivery" 
                    ? "Place Order (Pay on Delivery)" 
                    : "Place Order"
                }
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Side: Order Summary */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-shop_dark_green">Your Order</h2>
          <Card className="border-gray-200">
            <CardHeader className="bg-shop_dark_green/5 border-b border-gray-200">
              <CardTitle className="text-shop_dark_green">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                        <Image
                          src={`${API_BASE_URL}/${item.images[0].replace(/\\/g, '/')}`}
                          alt={item.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          unoptimized={true}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.cartQuantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-shop_dark_green">
                      ${(item.price * item.cartQuantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <p>Total</p>
                  <p className="text-shop_orange">${cartTotal.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
