"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { OTPInput } from "@/components/ui/otp-input";
import { api, useAuth } from "@/context/AuthContent";

// Step 1: Registration details schema
const registrationSchema = z.object({
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
  const { register } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState<RegistrationFormValues | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Step 1: Send OTP
  const onSubmitDetails = async (values: RegistrationFormValues) => {
    setIsLoading(true);
    try {
      // Send OTP to email address
      const response = await api.post('/otp/send', {
        email: values.email,
        type: 'registration'
      });

      if (response.data.success) {
        setFormData(values);
        setStep(2);
        toast.success("OTP Sent", {
          description: "We've sent a verification code to your email address.",
        });

        // Start countdown for resend
        startResendCountdown();
      }
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      const errorMessage = error.response?.data?.msg || "Failed to send OTP. Please try again.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Complete Registration
  const onSubmitOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Invalid OTP", {
        description: "Please enter the complete 6-digit code.",
      });
      return;
    }

    if (!formData) return;

    setIsLoading(true);
    try {
      // First verify OTP
      const otpResponse = await api.post('/otp/verify', {
        email: formData.email,
        otp,
        type: 'registration'
      });

      if (otpResponse.data.success) {
        // OTP verified, now register the user
        await register(formData.email, formData.password);

        toast.success("Account Created", {
          description: "Your account has been created successfully!",
        });

        // Redirect to home page
        router.push('/');
      }
    } catch (error: any) {
      console.error("Verification failed:", error);
      const errorMessage = error.response?.data?.msg || "Verification failed. Please try again.";
      toast.error("Verification Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!formData || !canResend) return;

    setIsLoading(true);
    try {
      const response = await api.post('/otp/send', {
        email: formData.email,
        type: 'registration'
      });

      if (response.data.success) {
        toast.success("OTP Resent", {
          description: "We've sent a new verification code to your email.",
        });
        setOtp(""); // Clear current OTP
        startResendCountdown();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.msg || "Failed to resend OTP.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Countdown timer for resend
  const startResendCountdown = () => {
    setCanResend(false);
    setCountdown(60);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-shop_dark_green">Create Account</h2>
        <p className="text-sm text-muted-foreground">
          {step === 1
            ? "Enter your details to get started"
            : "Enter the verification code sent to your email"}
        </p>
      </div>

      {step === 1 ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitDetails)} className="space-y-4">
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
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white" disabled={isLoading}>
              {isLoading ? "Sending OTP..." : "Continue"}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Code sent to {formData?.email}
              </p>
              <OTPInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={isLoading}
              />
            </div>

            <Button
              onClick={onSubmitOTP}
              className="w-full bg-shop_dark_green hover:bg-shop_light_green text-white"
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? "Verifying..." : "Verify & Create Account"}
            </Button>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isLoading}
                className="text-sm text-shop_dark_green hover:text-shop_light_green hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
              >
                {canResend ? "Resend Code" : `Resend in ${countdown}s`}
              </button>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Change email address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-shop_dark_green hover:text-shop_light_green hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}
