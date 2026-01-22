export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl bg-white rounded-lg shadow-sm p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: January 2026</p>

        <div className="prose prose-green max-w-none text-gray-700">
          <p>
            At Wyzar Marketplace ("we", "us", "our"), accessible from wyzar.co.zw, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Wyzar and how we use it.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">1. Data Protection Act (Zimbabwe)</h2>
          <p>
            We are committed to protecting your personal data in accordance with the <strong>Cyber and Data Protection Act [Chapter 12:07]</strong> of Zimbabwe. We ensure that your data is processed lawfully, fairly, and transparently.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Information We Collect</h2>
          <p>
            The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Account Information:</strong> Name, email address, phone number (for EcoCash/Innbucks verification).</li>
            <li><strong>Transaction Data:</strong> Details of payments made via EcoCash, Bank Transfer, or Cash on Delivery. <em>Note: We do not store your full banking PINs or passwords.</em></li>
            <li><strong>Delivery Information:</strong> Physical address and contact details for shipping partners.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide, operate, and maintain our marketplace.</li>
            <li>Process your transactions and manage orders.</li>
            <li>Communicate with you via Email or WhatsApp regarding updates and customer support.</li>
            <li>Prevent fraud and ensure platform security.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Sharing Your Information</h2>
          <p>
            We may share your name, phone number, and delivery address with:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sellers:</strong> To fulfill your order.</li>
            <li><strong>Logistics Partners:</strong> Local courier services or runners to deliver your goods.</li>
            <li><strong>Payment Processors:</strong> To facilitate secure transactions.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Security</h2>
          <p>
            We take reasonable measures to protect your information from unauthorized access, loss, theft, or misuse. However, please be aware that no internet transmission is 100% secure.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Contact Us</h2>
          <p>
            If you have any questions about our Privacy Policy, please contact us at <a href="mailto:privacy@wyzar.co.zw" className="text-shop_dark_green hover:underline">privacy@wyzar.co.zw</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
