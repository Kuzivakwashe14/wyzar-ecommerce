import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Container from "@/components/Container";

export default function AboutUsPage() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #3d2c1e 0%, #5e4a3a 100%)' }}>
        <Container>
          <div className="max-w-5xl mx-auto text-center">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta-light text-xl">Our Story</span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-cream mt-2">
              Empowering Zimbabwean Commerce
            </h1>
            <p className="text-xl md:text-2xl text-sand-warm/60 max-w-3xl mx-auto mb-8">
              We are building the most trusted digital marketplace for Zimbabwe, connecting local buyers with verified sellers in a secure environment.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="bg-terracotta hover:bg-terracotta-light text-white rounded-full px-8">
                  Start Shopping
                </Button>
              </Link>
              <Link href="/become-a-seller">
                <Button size="lg" variant="outline" className="text-cream border-cream/30 hover:bg-cream/10 rounded-full px-8">
                  Become a Seller
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Our Story */}
      <section className="py-16 px-6">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg mx-auto text-brown-light">
              <h2 className="text-3xl font-bold text-brown text-center mb-8">Who We Are</h2>
              <p className="mb-6">
                Wyzar is proudly Zimbabwean. We understand the unique challenges and opportunities of our local market. From the hustle of Harare to the industry of Bulawayo, we identified a need for a reliable, centralized platform where quality meets convenience.
              </p>
              <p className="mb-6">
                In a landscape where trust can be hard to find online, Wyzar stands as a beacon of reliability. We vet our sellers, verify products, and ensure that every transaction—whether in USD or ZiG—is safe and transparent.
              </p>
              <p>
                We aren&apos;t just an online store; we are a community. We exist to help local entrepreneurs scale their businesses and to give Zimbabwean shoppers access to the products they love without the hassle of importing or navigating unreliable social media groups.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Values Grid */}
      <section className="py-16 px-6 bg-sand/50">
        <Container>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-brown mb-12">Why Choose Wyzar?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: ShieldCheck, title: "Trusted & Secure", desc: "We verify every seller and oversee payments tailored for Zim (EcoCash, Innbucks, Bank Transfer).", color: "bg-terracotta/10" },
                { icon: Users, title: "Community First", desc: "We champion local businesses. When you buy on Wyzar, you're supporting a fellow Zimbabwean's dream.", color: "bg-sage/10" },
                { icon: Zap, title: "Fast Delivery", desc: "Reliable delivery network across major cities. Get your goods delivered to your doorstep.", color: "bg-terracotta-light/10" },
                { icon: ShoppingBag, title: "Wide Selection", desc: "From tech gadgets to local fashion, find everything you need in one place.", color: "bg-brown-light/10" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 text-center border border-line hover:shadow-md transition-all duration-300" style={{ borderRadius: '20px' }}>
                  <div className={`${item.color} p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                    <item.icon className="w-8 h-8 text-terracotta" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-brown">{item.title}</h3>
                  <p className="text-brown-light">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6 text-brown">Join the Revolution</h2>
        <p className="text-xl text-brown-light mb-8 max-w-2xl mx-auto">
          Whether you&apos;re looking to buy or sell, there&apos;s a place for you at Wyzar.
        </p>
        <Link href="/auth">
          <Button size="lg" className="bg-terracotta hover:bg-brown text-white rounded-full px-8">
            Create Account
          </Button>
        </Link>
      </section>
    </div>
  );
}
