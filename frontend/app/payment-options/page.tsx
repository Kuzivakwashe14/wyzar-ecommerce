import Container from "@/components/Container";
import { CreditCard, Banknote, Smartphone } from "lucide-react";

export default function PaymentOptionsPage() {
  return (
    <div className="bg-white min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-shop_dark_green mb-6 text-center">Payment Options</h1>
          <p className="text-xl text-center text-gray-600 mb-12">
            Secure, fast, and convenient ways to pay on WyZar.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 border rounded-xl hover:border-shop_orange hover:shadow-lg transition-all text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-shop_dark_green" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mobile Money</h3>
              <p className="text-gray-600 mb-4">Pay instantly using Ecocash or Innbucks.</p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Instant confirmation</li>
                <li>• No hidden fees</li>
                <li>• Secure transactions</li>
              </ul>
            </div>

            <div className="p-8 border rounded-xl hover:border-shop_orange hover:shadow-lg transition-all text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Card Payments</h3>
              <p className="text-gray-600 mb-4">We accept VISA and MasterCard (ZimSwitch enabled).</p>
               <ul className="text-sm text-gray-500 space-y-2">
                <li>• Global security standards</li>
                <li>• Supports USD & ZiG cards</li>
                <li>• Quick checkout</li>
              </ul>
            </div>

            <div className="p-8 border rounded-xl hover:border-shop_orange hover:shadow-lg transition-all text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Banknote className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold mb-3">Bank Transfer</h3>
              <p className="text-gray-600 mb-4">Direct transfer to our CABS or Stanbic accounts.</p>
               <ul className="text-sm text-gray-500 space-y-2">
                <li>• Best for large orders</li>
                <li>• Proof of payment required</li>
                <li>• Processed within 24 hours</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Payment Security</h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">
              WyZar uses SSL encryption to ensure that your payment details are 100% secure. We do not store your complete card details or mobile money PINs on our servers. All payments are processed through regulated payment gateways.
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
