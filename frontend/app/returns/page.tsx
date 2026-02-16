import Container from "@/components/Container";

export default function ReturnsPage() {
  return (
    <div className="bg-cream min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Our Promise</span>
            <h1 className="text-3xl md:text-4xl font-bold text-brown mt-1">Returns &amp; Refunds</h1>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">Return Policy</h2>
              <p className="text-brown-light leading-relaxed">
                We want you to be completely satisfied with your purchase. If you are not happy with your order, you may be eligible to return it for a refund or exchange, subject to the terms below.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">Eligibility for Returns</h2>
              <ul className="list-disc pl-5 space-y-2 text-brown-light">
                <li>Items must be returned within <strong className="text-brown">7 days</strong> of delivery.</li>
                <li>Items must be unused, in their original packaging, and with all tags attached.</li>
                <li>Proof of purchase (order number or receipt) is required.</li>
                <li>Perishable goods, personalized items, and personal hygiene products are <strong className="text-brown">not eligible</strong> for return.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">How to Initiate a Return</h2>
              <ol className="list-decimal pl-5 space-y-2 text-brown-light">
                <li>Log in to your WyZar account and go to <strong className="text-brown">My Orders</strong>.</li>
                <li>Select the order containing the item you wish to return.</li>
                <li>Click on &quot;Request Return&quot; and follow the instructions to provide a reason and photos if necessary.</li>
                <li>Our support team will review your request and provide further instructions on where to send the item.</li>
              </ol>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">Refund Process</h2>
              <p className="text-brown-light leading-relaxed">
                Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to your original method of payment or as store credit within 5-7 business days.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
