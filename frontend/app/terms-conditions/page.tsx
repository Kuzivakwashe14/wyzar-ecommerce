import Container from "@/components/Container";

export default function TermsConditionsPage() {
  return (
    <div className="bg-cream min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 sm:p-12 border border-line" style={{ borderRadius: '20px' }}>
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Legal</span>
            <h1 className="text-3xl font-bold text-brown mt-1 mb-2">Terms and Conditions</h1>
            <p className="text-sm text-brown-light mb-8">Last Updated: January 2026</p>

            <div className="prose max-w-none text-brown-light">
              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">1. Introduction</h2>
              <p>
                Welcome to Wyzar Marketplace! These terms and conditions outline the rules and regulations for the use of Wyzar&apos;s Website. By accessing this website we assume you accept these terms and conditions. Do not continue to use Wyzar if you do not agree to take all of the terms and conditions stated on this page.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">2. Buying and Payments</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-brown">Currency:</strong> All prices are listed in United States Dollars (USD). Payments in ZiG (Zimbabwe Gold) are accepted at the prevailing bank rate effectively on the day of transaction.</li>
                <li><strong className="text-brown">Payment Methods:</strong> We accept EcoCash, Innbucks, and ZIPIT/RTGS Bank Transfers. Proof of payment may be required for manual transfers.</li>
                <li><strong className="text-brown">Order Confirmation:</strong> Orders are confirmed only after payment verification by our team or the seller.</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">3. Shipping and Delivery</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-brown">Delivery Zones:</strong> We currently facilitate delivery within Harare, Bulawayo, Mutare, and Gweru. Remote areas may incur extra charges.</li>
                <li><strong className="text-brown">Timelines:</strong> Standard delivery takes 24-72 hours. Delays caused by fuel shortages or other local logistic challenges are communicated promptly.</li>
                <li><strong className="text-brown">Risk of Loss:</strong> All items purchased from Wyzar are made pursuant to a shipment contract. This means that the risk of loss and title for such items pass to you upon our delivery to the carrier.</li>
              </ul>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">4. Returns and Refunds</h2>
              <p>
                Please review our <a href="/returns" className="text-terracotta hover:underline">Returns &amp; Refunds Policy</a> separately. Generally, you have 7 days to report a defect.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">5. Seller Obligations</h2>
              <p>
                Sellers must be verified Zimbabwean residents or registered entities. Selling illegal, counterfeit, or prohibited items (as defined by Zimbabwean law) is strictly forbidden.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">6. Jurisdiction</h2>
              <p>
                These terms shall generally be governed by and construed in accordance with the laws of the <strong className="text-brown">Republic of Zimbabwe</strong>. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of Zimbabwe.
              </p>

              <h2 className="text-xl font-bold mt-8 mb-4 text-brown">7. Contact Information</h2>
              <p>
                If you have any queries regarding any of our terms, please contact us at{" "}
                <a href="mailto:legal@wyzar.co.zw" className="text-terracotta hover:underline">legal@wyzar.co.zw</a>.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
