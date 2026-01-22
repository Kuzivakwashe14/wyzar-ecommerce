import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Mail, Phone, MessageSquare, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function HelpUnknownPage() { // Renamed to avoid conflicts if any, though "HelpPage" is standard
  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Search Section */}
      <section className="bg-shop_dark_green text-white py-16 px-6">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">How can we help you?</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <Input 
              type="text" 
              placeholder="Search for answers..." 
              className="pl-12 h-12 bg-white text-gray-900 border-none shadow-lg focus-visible:ring-shop_orange"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto max-w-6xl px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <FileQuestion className="h-6 w-6 text-shop_dark_green" />
              </div>
              <CardTitle>Buying on WyZar</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4 text-sm">Learn how to find products, place orders, and pay securely.</p>
              <Link href="/faq" className="text-shop_dark_green font-medium hover:underline text-sm">View Guide &rarr;</Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-blue-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <UserPlusIcon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Selling on WyZar</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4 text-sm">Everything you need to know about setting up your shop.</p>
              <Link href="/become-a-seller" className="text-shop_dark_green font-medium hover:underline text-sm">Seller Guide &rarr;</Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-orange-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <BoxIcon className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Orders & Shipping</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4 text-sm">Track your package, returns, and shipping policies.</p>
              <Link href="/shipping" className="text-shop_dark_green font-medium hover:underline text-sm">Shipping Info &rarr;</Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Common Questions */}
      <section className="container mx-auto max-w-4xl px-6 mt-16">
        <h2 className="text-2xl font-bold mb-8 text-gray-900">Frequently Asked Questions</h2>
        <div className="space-y-4">
           {[
            "How do I track my order?",
            "What payment methods do you accept?",
            "How do I return an item?",
            "Is it safe to buy on WyZar?"
           ].map((q, i) => (
             <Link key={i} href="/faq" className="block p-4 border rounded-lg hover:border-shop_orange hover:bg-orange-50 transition-colors group">
               <div className="flex justify-between items-center">
                 <span className="font-medium text-gray-700 group-hover:text-shop_dark_green">{q}</span>
                 <span className="text-gray-400 group-hover:text-shop_orange">&rarr;</span>
               </div>
             </Link>
           ))}
        </div>
      </section>

      {/* Contact Options */}
      <section className="container mx-auto max-w-4xl px-6 mt-20 text-center">
         <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
         <p className="text-gray-600 mb-8">我们的 support team is available Mon-Fri, 8am-5pm.</p>
         
         <div className="flex flex-col sm:flex-row justify-center gap-6">
           <Link href="/contact-us">
            <Button variant="outline" className="gap-2 h-12 px-6">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Button>
           </Link>
           <a href="mailto:support@wyzar.com">
            <Button variant="outline" className="gap-2 h-12 px-6">
              <Mail className="h-4 w-4" />
              Email Us
            </Button>
           </a>
         </div>
      </section>
    </div>
  );
}

// Simple icons for this file
function UserPlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  )
}

function BoxIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 8.7 12 13.73 20.71 8.7" />
      <line x1="12" y1="22" x2="12" y2="13.73" />
    </svg>
  )
}
