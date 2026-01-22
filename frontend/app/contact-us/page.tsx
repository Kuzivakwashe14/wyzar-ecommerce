"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate generic submission
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you shortly via WhatsApp or Email.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 1500);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-shop_dark_green mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We're here to help. Reach out to our local support team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-shop_dark_green" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Call Us</h3>
                  <p className="text-gray-600 text-sm mt-1">Mon-Fri from 8am to 5pm</p>
                  <a href="tel:+263771234567" className="text-shop_dark_green font-medium block mt-1 hover:underline">
                    +263 77 123 4567
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MessageCircle className="w-6 h-6 text-shop_dark_green" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">WhatsApp Support</h3>
                  <p className="text-gray-600 text-sm mt-1">Chat with us for quick responses.</p>
                  <a 
                    href="https://wa.me/263771234567" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-shop_dark_green font-medium block mt-1 hover:underline"
                  >
                    +263 77 123 4567
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-shop_dark_green" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Email Us</h3>
                  <p className="text-gray-600 text-sm mt-1">For general inquiries and partnerships.</p>
                  <a href="mailto:support@wyzar.co.zw" className="text-shop_dark_green font-medium block mt-1 hover:underline">
                    support@wyzar.co.zw
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-shop_dark_green" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Visit Us</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Wyzar HQ<br />
                    Borrowdale, Harare<br />
                    Zimbabwe
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
                      <Input 
                        id="name" 
                        placeholder="e.g. Tawanda Moyo" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                      <Input 
                        id="phone" 
                        placeholder="e.g. +263 77..." 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="e.g. you@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700">How can we help?</label>
                    <Textarea 
                      id="message" 
                      rows={6} 
                      placeholder="Type your message here..." 
                      className="resize-none"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-shop_dark_green hover:bg-green-800" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
