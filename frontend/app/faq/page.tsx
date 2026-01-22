import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Container from "@/components/Container";

export default function FAQPage() {
  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browsing for products is easy! Once you find what you need, click 'Add to Cart'. When you're ready, go to your cart and click 'Checkout'. Follow the prompts to enter your shipping details and payment method."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept a variety of payment methods including EcoCash, Innbucks, and Bank Transfers. We ensure all transactions are secure."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, you will receive a tracking number via email. You can also track your order status in your account dashboard under 'My Orders'."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 7-day return policy for most items. If you receive a defective or incorrect item, please contact us immediately. Refer to our Returns & Refunds page for more details."
    },
    {
      question: "How do I become a seller?",
      answer: "Click on 'Become a Seller' in the footer or top menu. Fill out the application form with your business details. Once approved, you can start listing products immediately!"
    },
    {
      question: "Is my personal information safe?",
      answer: "Yes, we take data security seriously. We use industry-standard encryption to protect your personal and payment information. Read our Privacy Policy for more information."
    }
  ];

  return (
    <div className="bg-white min-h-screen py-16">
      <Container>
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-shop_dark_green">Frequently Asked Questions</h1>
          <p className="text-center text-gray-600 mb-12">
            Find answers to common questions about buying, selling, and shipping on WyZar.
          </p>
          
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium text-gray-900 hover:text-shop_orange hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Container>
    </div>
  );
}
