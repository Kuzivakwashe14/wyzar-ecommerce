"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContent";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  User, 
  Bell, 
  CreditCard,
  ChevronRight,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login?redirect=/settings");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-shop_dark_green border-t-transparent"></div>
      </div>
    );
  }

  const settingsLinks = [
    {
      title: "Security",
      description: "Password, 2FA, and sign-in methods",
      icon: Shield,
      href: "/settings/security",
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Profile",
      description: "Your personal information",
      icon: User,
      href: "/profile",
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Notifications",
      description: "Email and push notification preferences",
      icon: Bell,
      href: "/settings/notifications",
      color: "bg-purple-100 text-purple-600",
      disabled: true
    },
    {
      title: "Payment Methods",
      description: "Manage your saved payment methods",
      icon: CreditCard,
      href: "/settings/payments",
      color: "bg-orange-100 text-orange-600",
      disabled: true
    },
  ];

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-shop_dark_green flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account preferences and security
        </p>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-shop_dark_green flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Links */}
      <div className="space-y-3">
        {settingsLinks.map((item) => (
          <Card 
            key={item.title} 
            className={`transition-shadow ${item.disabled ? 'opacity-60' : 'hover:shadow-md cursor-pointer'}`}
          >
            {item.disabled ? (
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${item.color} flex items-center justify-center`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                </div>
              </CardContent>
            ) : (
              <Link href={item.href}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Link>
            )}
          </Card>
        ))}
      </div>

      {/* Seller Settings Link (if seller) */}
      {user?.isSeller && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Seller Settings</CardTitle>
            <CardDescription>
              Manage your store and business profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-shop_dark_green hover:bg-shop_dark_green/90">
              <Link href="/dashboard/settings">
                Go to Seller Settings
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
