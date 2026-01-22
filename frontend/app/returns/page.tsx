import Container from "@/components/Container";

export default function ReturnsPage() {
  return (
    <div className="bg-white min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg text-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-shop_dark_green mb-8 text-center">Returns & Refunds</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Return Policy</h2>
              <p>
                We want you to be completely satisfied with your purchase. If you are not happy with your order, you may be eligible to return it for a refund or exchange, subject to the terms below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Eligibility for Returns</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Items must be returned within <strong>7 days</strong> of delivery.</li>
                <li>Items must be unused, in their original packaging, and with all tags attached.</li>
                <li>Proof of purchase (order number or receipt) is required.</li>
                <li>Perishable goods, personalized items, and personal hygiene products are <strong>not eligible</strong> for return.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">How to Initiate a Return</h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Log in to your WyZar account and go to <strong>My Orders</strong>.</li>
                <li>Select the order containing the item you wish to return.</li>
                <li>Click on "Request Return" and follow the instructions to provide a reason and photos if necessary.</li>
                <li>Our support team will review your request and provide further instructions on where to send the item.</li>
              </ol>
            </section>

             <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Refund Process</h2>
              <p>
                Once your return is received and inspected, we will notify you of the approval or rejection of your refund. If approved, your refund will be processed to your original method of payment or as store credit within 5-7 business days.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
