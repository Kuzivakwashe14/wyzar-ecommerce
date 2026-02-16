import Container from "@/components/Container";
import { CreditCard, Banknote, Smartphone, ShieldCheck } from "lucide-react";

export default function PaymentOptionsPage() {
  const methods = [
    {
      icon: Smartphone,
      title: "Mobile Money",
      desc: "Pay instantly using EcoCash or Innbucks.",
      features: ["Instant confirmation", "No hidden fees", "Secure transactions"],
      color: "bg-terracotta/10",
    },
    {
      icon: CreditCard,
      title: "Card Payments",
      desc: "We accept VISA and MasterCard (ZimSwitch enabled).",
      features: ["Global security standards", "Supports USD & ZiG cards", "Quick checkout"],
      color: "bg-sage/10",
    },
    {
      icon: Banknote,
      title: "Bank Transfer",
      desc: "Direct transfer to our CABS or Stanbic accounts.",
      features: ["Best for large orders", "Proof of payment required", "Processed within 24 hours"],
      color: "bg-terracotta-light/10",
    },
  ];

  return (
    <div className="bg-cream min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Secure Payments</span>
            <h1 className="text-3xl md:text-4xl font-bold text-brown mt-1 mb-4">Payment Options</h1>
            <p className="text-xl text-brown-light">
              Secure, fast, and convenient ways to pay on WyZar.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {methods.map((method, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-line hover:border-terracotta/30 hover:shadow-md transition-all text-center" style={{ borderRadius: '20px' }}>
                <div className={`${method.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <method.icon className="h-8 w-8 text-terracotta" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-brown">{method.title}</h3>
                <p className="text-brown-light mb-4">{method.desc}</p>
                <ul className="text-sm text-brown-light space-y-2">
                  {method.features.map((f, j) => (
                    <li key={j} className="flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-sand/50 rounded-2xl p-8 md:p-12 text-center" style={{ borderRadius: '20px' }}>
            <ShieldCheck className="h-12 w-12 text-sage mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-brown">Payment Security</h2>
            <p className="text-brown-light max-w-2xl mx-auto">
              WyZar uses SSL encryption to ensure that your payment details are 100% secure. We do not store your complete card details or mobile money PINs on our servers. All payments are processed through regulated payment gateways.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
