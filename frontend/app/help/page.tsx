import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Mail, MessageSquare, FileQuestion, Store, Package } from "lucide-react";
import Link from "next/link";
import Container from "@/components/Container";

export default function HelpPage() {
  return (
    <div className="bg-cream min-h-screen pb-20">
      {/* Hero Search Section */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #3d2c1e 0%, #5e4a3a 100%)' }}>
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta-light text-xl">Support Center</span>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 text-cream mt-2">How can we help you?</h1>
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-brown-light" />
              <Input 
                type="text" 
                placeholder="Search for answers..." 
                className="pl-12 h-12 bg-white text-brown border-none rounded-full focus:ring-terracotta"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <Container>
        <section className="max-w-6xl mx-auto px-6 -mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FileQuestion, title: "Buying on WyZar", desc: "Learn how to find products, place orders, and pay securely.", link: "/faq", label: "View Guide" },
              { icon: Store, title: "Selling on WyZar", desc: "Everything you need to know about setting up your shop.", link: "/become-a-seller", label: "Seller Guide" },
              { icon: Package, title: "Orders & Shipping", desc: "Track your package, returns, and shipping policies.", link: "/shipping", label: "Shipping Info" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 text-center border border-line hover:shadow-md transition-all duration-300" style={{ borderRadius: '20px' }}>
                <div className="mx-auto bg-terracotta/10 p-3 rounded-2xl w-12 h-12 flex items-center justify-center mb-4">
                  <item.icon className="h-6 w-6 text-terracotta" />
                </div>
                <h3 className="font-bold text-brown mb-2">{item.title}</h3>
                <p className="text-brown-light mb-4 text-sm">{item.desc}</p>
                <Link href={item.link} className="text-terracotta font-medium hover:underline text-sm">{item.label} &rarr;</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Common Questions */}
        <section className="max-w-4xl mx-auto px-6 mt-16">
          <h2 className="text-2xl font-bold mb-8 text-brown">Common Questions</h2>
          <div className="space-y-3">
            {[
              "How do I track my order?",
              "What payment methods do you accept?",
              "How do I return an item?",
              "Is it safe to buy on WyZar?"
            ].map((q, i) => (
              <Link key={i} href="/faq" className="block p-4 bg-white border border-line rounded-2xl hover:border-terracotta/30 hover:shadow-sm transition-all group" style={{ borderRadius: '20px' }}>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-brown group-hover:text-terracotta">{q}</span>
                  <span className="text-brown-light group-hover:text-terracotta">&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Options */}
        <section className="max-w-4xl mx-auto px-6 mt-20 text-center">
          <h2 className="text-2xl font-bold mb-4 text-brown">Still need help?</h2>
          <p className="text-brown-light mb-8">Our support team is available Mon-Fri, 8am-5pm.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact-us">
              <Button variant="outline" className="gap-2 h-12 px-6 border-terracotta text-terracotta hover:bg-terracotta hover:text-white rounded-full">
                <MessageSquare className="h-4 w-4" />
                Contact Support
              </Button>
            </Link>
            <a href="mailto:support@wyzar.com">
              <Button variant="outline" className="gap-2 h-12 px-6 border-brown text-brown hover:bg-brown hover:text-cream rounded-full">
                <Mail className="h-4 w-4" />
                Email Us
              </Button>
            </a>
          </div>
        </section>
      </Container>
    </div>
  );
}
