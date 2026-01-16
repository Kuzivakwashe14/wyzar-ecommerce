"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, ShieldOff, ExternalLink, Key, Mail } from "lucide-react";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  // Check authentication
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !user) {
    return (
      <div className="container mx-auto max-w-2xl py-12">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const kindeAccountUrl = process.env.NEXT_PUBLIC_KINDE_ISSUER_URL || "https://wyzar.kinde.com";

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account by requiring a code from your authenticator app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldOff className="h-6 w-6 text-amber-500" />
              <div>
                <p className="font-medium">2FA is disabled</p>
                <p className="text-sm text-gray-500">Enable 2FA to add an extra layer of security</p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-shop_dark_green hover:bg-shop_dark_green/90"
            >
              <a href={`${kindeAccountUrl}/account`} target="_blank" rel="noopener noreferrer">
                Enable 2FA
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>

          {/* Info Section */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Supported authentication methods:</p>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-sm text-gray-500">Google Authenticator, Authy, Microsoft Authenticator</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Email Verification</p>
                  <p className="text-sm text-gray-500">Receive verification codes via email</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Management */}
      <Card className="mt-6">
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
            password, add social logins, or manage your sign-in methods from your account settings.
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

      {/* Account Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Authentication</span>
              <span className="font-medium text-green-600">Secured by Kinde</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
