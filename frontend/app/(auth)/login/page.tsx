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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContent";

// Login schema - supports email
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithFacebook, verifyTwoFactorLogin, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await signIn(values.email, values.password);

      if (result.error) {
        toast.error("Login Failed", {
          description: result.error,
        });
        return;
      }

      // Check if 2FA is required
      if (result.twoFactorRequired) {
        setShow2FADialog(true);
        return;
      }

      toast.success("Welcome Back!", {
        description: "You have successfully logged in.",
      });

      // Redirect based on user role
      if (user?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }

    } catch (error: unknown) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      toast.error("Login Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsVerifying2FA(true);
    try {
      // Pass trustDevice to skip 2FA on future logins from this device
      const result = await verifyTwoFactorLogin(twoFactorCode, trustDevice);

      if (result.error) {
        toast.error("Verification Failed", {
          description: result.error,
        });
        return;
      }

      setShow2FADialog(false);
      setTwoFactorCode("");
      setTrustDevice(false);
      
      toast.success("Welcome Back!", {
        description: trustDevice 
          ? "You have successfully logged in. This device is now trusted."
          : "You have successfully logged in.",
      });

      // Redirect
      router.push('/');
    } catch (error) {
      toast.error("Verification Failed", {
        description: "Invalid code. Please try again.",
      });
    } finally {
      setIsVerifying2FA(false);
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
        <h2 className="text-3xl font-bold tracking-tight text-shop_dark_green">Welcome Back</h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your WyZar account
        </p>
      </div>

      {/* Social Sign-In Buttons */}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
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
                    placeholder="Enter your password"
                    disabled={isLoading || !!socialLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white" 
            disabled={isLoading || !!socialLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-shop_dark_green hover:text-shop_light_green hover:underline font-medium">
          Create account
        </Link>
      </div>

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your authenticator app to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="2fa-code">Verification Code</Label>
              <Input
                id="2fa-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
            </div>
            
            {/* Trust this device checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="trust-device"
                checked={trustDevice}
                onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
              />
              <label
                htmlFor="trust-device"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Trust this device for 30 days
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, you won&apos;t need to enter a code on this device for the next 30 days.
            </p>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShow2FADialog(false);
                  setTwoFactorCode("");
                  setTrustDevice(false);
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-shop_dark_green hover:bg-shop_light_green"
                onClick={handleVerify2FA}
                disabled={isVerifying2FA || twoFactorCode.length !== 6}
              >
                {isVerifying2FA ? "Verifying..." : "Verify"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

