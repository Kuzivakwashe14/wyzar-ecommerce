'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Platform settings and configuration</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="p-4 bg-purple-500/10 rounded-full w-fit mx-auto mb-6">
          <Settings className="w-16 h-16 text-purple-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Platform Settings</h2>
        <p className="text-gray-600 mb-4">
          Platform configuration and settings coming soon
        </p>
        <p className="text-sm text-gray-500">
          Commission rates, payment settings, email configuration, and more...
        </p>
      </div>
    </div>
  );
}

