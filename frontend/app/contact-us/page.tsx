"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Container from "@/components/Container";

export default function ContactUsPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you shortly via WhatsApp or Email.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 1500);
  };

  const contactInfo = [
    { icon: Phone, title: "Call Us", detail: "Mon-Fri from 8am to 5pm", value: "+263 77 123 4567", href: "tel:+263771234567" },
    { icon: MessageCircle, title: "WhatsApp Support", detail: "Chat with us for quick responses.", value: "+263 77 123 4567", href: "https://wa.me/263771234567" },
    { icon: Mail, title: "Email Us", detail: "For general inquiries and partnerships.", value: "support@wyzar.co.zw", href: "mailto:support@wyzar.co.zw" },
    { icon: MapPin, title: "Visit Us", detail: "Wyzar HQ, Borrowdale, Harare, Zimbabwe", value: null, href: null },
  ];

  return (
    <div className="bg-cream min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Get in Touch</span>
            <h1 className="text-4xl font-bold text-brown mt-1 mb-4">Contact Us</h1>
            <p className="text-xl text-brown-light">
              We&apos;re here to help. Reach out to our local support team.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-4">
              {contactInfo.map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
                  <div className="flex items-start space-x-4">
                    <div className="bg-terracotta/10 p-3 rounded-2xl">
                      <item.icon className="w-6 h-6 text-terracotta" />
                    </div>
                    <div>
                      <h3 className="font-bold text-brown">{item.title}</h3>
                      <p className="text-brown-light text-sm mt-1">{item.detail}</p>
                      {item.href && item.value && (
                        <a href={item.href} target={item.href.startsWith("https") ? "_blank" : undefined} rel="noopener noreferrer" className="text-terracotta font-medium block mt-1 hover:underline">
                          {item.value}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 border border-line h-full" style={{ borderRadius: '20px' }}>
                <h2 className="text-2xl font-bold text-brown mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-brown">Full Name</label>
                      <Input id="name" placeholder="e.g. Tawanda Moyo" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="border-line focus:border-terracotta" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-brown">Phone Number (Optional)</label>
                      <Input id="phone" placeholder="e.g. +263 77..." value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="border-line focus:border-terracotta" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-brown">Email Address</label>
                    <Input id="email" type="email" placeholder="e.g. you@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required className="border-line focus:border-terracotta" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-brown">How can we help?</label>
                    <Textarea id="message" rows={6} placeholder="Type your message here..." className="resize-none border-line focus:border-terracotta" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} required />
                  </div>
                  <Button type="submit" size="lg" className="w-full bg-terracotta hover:bg-brown text-white rounded-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
