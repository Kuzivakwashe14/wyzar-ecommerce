"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { twoFactor } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Shield, Smartphone, Mail, Copy, CheckCircle } from 'lucide-react';
import { useBetterAuth } from '@/context/BetterAuthContext';

export default function TwoFactorSetup() {
  const { user } = useBetterAuth();
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{
    qrCode: string;
    secret: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Enable TOTP (Authenticator App)
  const handleEnableTOTP = async () => {
    setIsEnabling(true);
    try {
      const { data, error } = await twoFactor.enable({ type: 'totp' });
      
      if (error) throw new Error(error.message);
      
      setTotpSetup({
        qrCode: data.qrCode,
        secret: data.secret,
      });
      
      toast.success('Scan the QR code with your authenticator app');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to enable 2FA', {
        description: message,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Verify and complete TOTP setup
  const handleVerifyTOTP = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    try {
      const { data, error } = await twoFactor.verifyTotp({
        code: verificationCode,
      });

      if (error) throw new Error(error.message);

      setBackupCodes(data.backupCodes || []);
      toast.success('2FA enabled successfully!', {
        description: 'Save your backup codes in a safe place.',
      });
      setTotpSetup(null);
      setVerificationCode('');
    } catch (error: any) {
      toast.error('Verification failed', {
        description: error.message,
      });
    }
  };

  // Enable Email OTP
  const handleEnableEmailOTP = async () => {
    setIsEnabling(true);
    try {
      const { error } = await twoFactor.enable({ type: 'email' });
      
      if (error) throw new Error(error.message);
      
      toast.success('Email 2FA enabled', {
        description: 'You will receive codes via email when signing in.',
      });
    } catch (error: any) {
      toast.error('Failed to enable email 2FA', {
        description: error.message,
      });
    } finally {
      setIsEnabling(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    setIsDisabling(true);
    try {
      const { error } = await twoFactor.disable();
      
      if (error) throw new Error(error.message);
      
      toast.success('2FA disabled', {
        description: 'Two-factor authentication has been turned off.',
      });
      setTotpSetup(null);
      setBackupCodes([]);
    } catch (error: any) {
      toast.error('Failed to disable 2FA', {
        description: error.message,
      });
    } finally {
      setIsDisabling(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!totpSetup && backupCodes.length === 0 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                Authenticator App (Recommended)
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Use an authenticator app like Google Authenticator, Authy, or 1Password
                  to generate verification codes.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>More secure than SMS</li>
                  <li>Works offline</li>
                  <li>Faster verification</li>
                </ul>
              </div>

              <Button
                onClick={handleEnableTOTP}
                disabled={isEnabling}
                className="w-full"
              >
                {isEnabling ? 'Setting up...' : 'Enable Authenticator 2FA'}
              </Button>
            </div>

            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                Email 2FA
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Receive verification codes via email to {user?.email}
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Easy to use</li>
                  <li>No additional app required</li>
                  <li>Backup authentication method</li>
                </ul>
              </div>

              <Button
                onClick={handleEnableEmailOTP}
                disabled={isEnabling}
                className="w-full"
              >
                {isEnabling ? 'Enabling...' : 'Enable Email 2FA'}
              </Button>
            </div>
          </div>
        )}

        {/* TOTP Setup Flow */}
        {totpSetup && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Step 1: Scan QR Code</h3>
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={totpSetup.qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Scan this QR code with your authenticator app</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Step 2: Enter Verification Code</h3>
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Or manually enter this secret: <code className="bg-muted px-1 py-0.5 rounded">{totpSetup.secret}</code>
                </p>
              </div>
              <Button
                onClick={handleVerifyTOTP}
                disabled={verificationCode.length !== 6}
                className="w-full"
              >
                Verify and Enable
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => setTotpSetup(null)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Backup Codes */}
        {backupCodes.length > 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                Save Your Backup Codes
              </h3>
              <p className="text-sm text-yellow-800">
                Store these codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted rounded border"
                >
                  <code className="text-sm font-mono">{code}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(code)}
                    className="h-6 w-6 p-0"
                  >
                    {copiedCode === code ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setBackupCodes([])}
              className="w-full"
            >
              I&apos;ve Saved My Backup Codes
            </Button>
          </div>
        )}

        {/* Disable 2FA */}
        {!totpSetup && backupCodes.length === 0 && (
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={isDisabling}
              className="w-full"
            >
              {isDisabling ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
