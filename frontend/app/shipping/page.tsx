import Container from "@/components/Container";

export default function ShippingPage() {
  return (
    <div className="bg-cream min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Delivery Info</span>
            <h1 className="text-3xl md:text-4xl font-bold text-brown mt-1">Shipping Information</h1>
          </div>
          
          <div className="space-y-6">
            {[
              { title: "Delivery Areas", content: "WyZar currently ships to all major cities and towns in Zimbabwe. We partner with reliable local courier services to ensure your orders reach you safely and on time. Key delivery areas include Harare, Bulawayo, Gweru, Mutare, and Masvingo." },
              { title: "Delivery Times", content: null, list: ["Harare & Bulawayo: 1-3 business days", "Other Major Towns: 3-5 business days", "Remote Areas: 5-7 business days"] },
              { title: "Shipping Costs", content: "Shipping costs are calculated based on the weight of your order and the delivery distance. You can view the exact shipping cost at checkout before making a payment. Some sellers may offer free shipping on orders above a certain value." },
              { title: "Order Tracking", content: "Once your order has been dispatched, you will receive an email and SMS notification with a tracking number. You can also track the status of your order in real-time from your account dashboard." },
            ].map((section, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
                <h2 className="text-xl font-bold text-brown mb-3">{section.title}</h2>
                {section.content && <p className="text-brown-light leading-relaxed">{section.content}</p>}
                {section.list && (
                  <ul className="list-disc pl-5 space-y-2 text-brown-light mt-2">
                    {section.list.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
