"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaGoogle, FaFacebook } from "react-icons/fa";

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
import { useAuth } from "@/context/AuthContent";

// Registration schema
const registrationSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegistrationFormValues) => {
    setIsLoading(true);
    try {
      const result = await signUp(values.email, values.password, values.name);

      if (result.error) {
        toast.error("Registration Failed", {
          description: result.error,
        });
        return;
      }

      toast.success("Account Created!", {
        description: "Please check your email to verify your account.",
      });

      // Redirect to home page
      router.push('/');

    } catch (error: unknown) {
      console.error("Registration failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed. Please try again.";
      toast.error("Registration Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed:", error);
      toast.error("Google Sign-In Failed", {
        description: "Could not sign in with Google. Please try again.",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleFacebookSignIn = async () => {
    setSocialLoading('facebook');
    try {
      await signInWithFacebook();
    } catch (error) {
      console.error("Facebook sign-in failed:", error);
      toast.error("Facebook Sign-In Failed", {
        description: "Could not sign in with Facebook. Please try again.",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-shop_dark_green">Create Account</h2>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      {/* Social Sign-Up Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          disabled={!!socialLoading || isLoading}
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          <FaGoogle className="mr-2 h-4 w-4" />
          {socialLoading === 'google' ? "..." : "Google"}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={!!socialLoading || isLoading}
          onClick={handleFacebookSignIn}
          className="w-full"
        >
          <FaFacebook className="mr-2 h-4 w-4" />
          {socialLoading === 'facebook' ? "..." : "Facebook"}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    disabled={isLoading || !!socialLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    type="email"
                    disabled={isLoading || !!socialLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Min. 6 characters"
                    disabled={isLoading || !!socialLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Re-enter your password"
                    disabled={isLoading || !!socialLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white" 
            disabled={isLoading || !!socialLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </Form>

      <p className="text-xs text-center text-muted-foreground">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-shop_dark_green hover:underline">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-shop_dark_green hover:underline">Privacy Policy</Link>
      </p>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-shop_dark_green hover:text-shop_light_green hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}

