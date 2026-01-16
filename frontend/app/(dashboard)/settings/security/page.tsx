"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Smartphone, 
  Key, 
  Mail, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Lock,
  UserCog
} from "lucide-react";
import Link from "next/link";

export default function SecuritySettingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login?redirect=/settings/security");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent"></div>
      </div>
    );
  }

  const kindeAccountUrl = process.env.NEXT_PUBLIC_KINDE_ISSUER_URL || "https://wyzar.kinde.com";

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-shop_dark_green flex items-center gap-3">
          <Shield className="h-8 w-8" />
          Security Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account security and authentication preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>
              Your current account security status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-sm text-gray-500">{user?.email || "Not set"}</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Authentication Method</p>
                  <p className="text-sm text-gray-500">Secured by Kinde</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Protected
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication (2FA)
            </CardTitle>
            <CardDescription>
              Add an extra layer of security to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Enhance Your Security</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Two-factor authentication adds an extra layer of security by requiring 
                    a code from your phone in addition to your password.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-gray-500">Use Google Authenticator, Authy, or similar</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-gray-500">Receive codes via email</p>
                </div>
              </div>
            </div>

            <Button asChild className="w-full bg-shop_dark_green hover:bg-shop_dark_green/90">
              <a href={`${kindeAccountUrl}/account`} target="_blank" rel="noopener noreferrer">
                Manage 2FA Settings
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Password & Sign-in */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password & Sign-in
            </CardTitle>
            <CardDescription>
              Manage your password and sign-in methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Your sign-in credentials are securely managed by Kinde. You can update your 
              password, add social logins, or manage your sign-in methods from your Kinde account.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1">
                <a href={`${kindeAccountUrl}/account`} target="_blank" rel="noopener noreferrer">
                  Change Password
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={`${kindeAccountUrl}/account`} target="_blank" rel="noopener noreferrer">
                  Manage Sign-in Methods
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Use a strong, unique password</p>
                  <p className="text-sm text-gray-500">
                    Combine letters, numbers, and symbols. Don&apos;t reuse passwords.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Enable two-factor authentication</p>
                  <p className="text-sm text-gray-500">
                    Protect your account even if your password is compromised.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Review your account regularly</p>
                  <p className="text-sm text-gray-500">
                    Check for any suspicious activity or unauthorized access.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Keep your email secure</p>
                  <p className="text-sm text-gray-500">
                    Your email is used for account recovery. Keep it protected.
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Back to Settings */}
        <div className="flex justify-center pt-4">
          <Button asChild variant="ghost">
            <Link href="/settings">
              ← Back to Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
