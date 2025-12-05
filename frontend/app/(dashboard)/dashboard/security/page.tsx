"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Shield, ShieldCheck, ShieldOff, Copy, Eye, EyeOff } from "lucide-react";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, enable2FA, verify2FA, disable2FA, refreshSession } = useAuth();
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<"password" | "qr" | "verify" | "backup">("password");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication and refresh session
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Refresh session on mount to get latest 2FA status
  useEffect(() => {
    if (!loading && isAuthenticated) {
      refreshSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated]);

  // Check if 2FA is already enabled (from user session)
  useEffect(() => {
    if (user) {
      // Check twoFactorEnabled from user object
      setIs2FAEnabled(!!user.twoFactorEnabled);
      console.log('User 2FA status:', user.twoFactorEnabled, user);
    }
  }, [user]);

  // Handle enabling 2FA - Step 1: Enter password
  const handleStartEnable = () => {
    setShowEnableDialog(true);
    setStep("password");
    setPassword("");
    setTotpURI(null);
    setBackupCodes([]);
    setVerificationCode("");
  };

  // Handle enabling 2FA - Step 2: Get QR code
  const handlePasswordSubmit = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await enable2FA(password);
      
      if (result.error) {
        toast.error("Failed to enable 2FA", { description: result.error });
        return;
      }

      if (result.totpURI) {
        setTotpURI(result.totpURI);
        setBackupCodes(result.backupCodes || []);
        setStep("qr");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle enabling 2FA - Step 3: Verify code
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verify2FA(verificationCode);
      
      if (result.error) {
        toast.error("Invalid code", { description: result.error });
        return;
      }

      setStep("backup");
      toast.success("2FA enabled successfully!");
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finish setup - show backup codes
  const handleFinishSetup = async () => {
    await refreshSession();
    setIs2FAEnabled(true);
    setShowEnableDialog(false);
    setStep("password");
    setPassword("");
    setTotpURI(null);
    setVerificationCode("");
  };

  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await disable2FA(password);
      
      if (result.error) {
        toast.error("Failed to disable 2FA", { description: result.error });
        return;
      }

      await refreshSession();
      setIs2FAEnabled(false);
      setShowDisableDialog(false);
      setPassword("");
      toast.success("2FA has been disabled");
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy backup codes to clipboard
  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  };

  if (loading || !user) {
    return (
      <div className="container py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-8">Security Settings</h1>

      {/* Two-Factor Authentication Card */}
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
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <>
                  <ShieldCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-600">2FA is enabled</p>
                    <p className="text-sm text-muted-foreground">
                      Your account is protected with two-factor authentication
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldOff className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-600">2FA is disabled</p>
                    <p className="text-sm text-muted-foreground">
                      Enable 2FA to add an extra layer of security
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {is2FAEnabled ? (
              <Button
                variant="destructive"
                onClick={() => {
                  setShowDisableDialog(true);
                  setPassword("");
                }}
              >
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleStartEnable} className="bg-shop_dark_green hover:bg-shop_dark_green/90">
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enable 2FA Dialog */}
      <Dialog open={showEnableDialog} onOpenChange={setShowEnableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "password" && "Enable Two-Factor Authentication"}
              {step === "qr" && "Scan QR Code"}
              {step === "verify" && "Verify Setup"}
              {step === "backup" && "Save Backup Codes"}
            </DialogTitle>
            <DialogDescription>
              {step === "password" && "Enter your password to continue"}
              {step === "qr" && "Scan this QR code with your authenticator app"}
              {step === "verify" && "Enter the 6-digit code from your authenticator app"}
              {step === "backup" && "Save these backup codes in a safe place"}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Password */}
          {step === "password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEnableDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePasswordSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Loading..." : "Continue"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === "qr" && totpURI && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCode value={totpURI} size={200} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with Google Authenticator, Authy, or any other TOTP app
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("password")}>
                  Back
                </Button>
                <Button onClick={() => setStep("verify")}>
                  I&apos;ve scanned the code
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit code"
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("qr")}>
                  Back
                </Button>
                <Button onClick={handleVerifyCode} disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* Step 4: Backup Codes */}
          {step === "backup" && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code key={index} className="bg-white px-3 py-2 rounded text-center font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={copyBackupCodes}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Backup Codes
              </Button>
              <p className="text-sm text-yellow-600">
                ⚠️ Save these codes somewhere safe. You can use them to access your account if you lose your authenticator.
              </p>
              <DialogFooter>
                <Button onClick={handleFinishSetup} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to disable 2FA. This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <div className="relative">
                <Input
                  id="disable-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDisable2FA} disabled={isSubmitting}>
                {isSubmitting ? "Disabling..." : "Disable 2FA"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
