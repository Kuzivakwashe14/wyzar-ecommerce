import Container from "@/components/Container";

export default function ShippingPage() {
  return (
    <div className="bg-white min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg text-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-shop_dark_green mb-8 text-center">Shipping Information</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Areas</h2>
              <p>
                WyZar currently ships to all major cities and towns in Zimbabwe. We partner with reliable local courier services to ensure your orders reach you safely and on time. Key delivery areas include Harare, Bulawayo, Gweru, Mutare, and Masvingo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Delivery Times</h2>
              <p>
                Delivery times vary depending on the seller's location and your destination.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Harare & Bulawayo:</strong> 1-3 business days</li>
                <li><strong>Other Major Towns:</strong> 3-5 business days</li>
                <li><strong>Remote Areas:</strong> 5-7 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Shipping Costs</h2>
              <p>
                Shipping costs are calculated based on the weight of your order and the delivery distance. You can view the exact shipping cost at checkout before making a payment. Some sellers may offer free shipping on orders above a certain value.
              </p>
            </section>

             <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Order Tracking</h2>
              <p>
                Once your order has been dispatched, you will receive an email and SMS notification with a tracking number. You can also track the status of your order in real-time from your account dashboard.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
