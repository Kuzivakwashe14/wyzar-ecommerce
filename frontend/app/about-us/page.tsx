import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Users, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutUsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-shop_dark_green text-white py-20 px-6">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Empowering Zimbabwean Commerce
          </h1>
          <p className="text-xl md:text-2xl text-shop_light_green max-w-3xl mx-auto mb-8 font-light">
            We are building the most trusted digital marketplace for Zimbabwe, connecting local buyers with verified sellers in a secure environment.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-shop_light_green text-shop_dark_green hover:bg-white font-bold">
                Start Shopping
              </Button>
            </Link>
            <Link href="/become-a-seller">
              <Button size="lg" variant="outline" className="text-shop_light_green border-shop_light_green hover:bg-shop_light_green hover:text-shop_dark_green font-bold">
                Become a Seller
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="prose prose-lg mx-auto text-gray-700">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Who We Are</h2>
            <p className="mb-6">
              Wyzar is proudly Zimbabwean. We understand the unique challenges and opportunities of our local market. From the hustle of Harare to the industry of Bulawayo, we identified a need for a reliable, centralized platform where quality meets convenience.
            </p>
            <p className="mb-6">
              In a landscape where trust can be hard to find online, Wyzar stands as a beacon of reliability. We vet our sellers, verify products, and ensure that every transaction—whether in USD or ZiG—is safe and transparent.
            </p>
            <p>
              We aren't just an online store; we are a community. We exist to help local entrepreneurs scale their businesses and to give Zimbabwean shoppers access to the products they love without the hassle of importing or navigating unreliable social media groups.
            </p>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Wyzar?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-shop_dark_green" />
                </div>
                <h3 className="text-xl font-bold mb-2">Trusted & Secure</h3>
                <p className="text-gray-600">
                  We verify every seller and oversee payments tailored for Zim (EcoCash, Innbucks, Bank Transfer).
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="bg-orange-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Community First</h3>
                <p className="text-gray-600">
                  We champion local businesses. When you buy on Wyzar, you're supporting a fellow Zimbabwean's dream.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Reliable delivery network across major cities. Get your goods delivered to your doorstep.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md hover:shadow-xl transition-shadow">
              <CardContent className="pt-6 text-center">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
                <p className="text-gray-600">
                  From tech gadets to local fashion, find everything you need in one place.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Join the Revolution</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Whether you're looking to buy or sell, there's a place for you at Wyzar.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth">
            <Button size="lg" className="bg-shop_dark_green hover:bg-green-800 w-full sm:w-auto">
              Create Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
