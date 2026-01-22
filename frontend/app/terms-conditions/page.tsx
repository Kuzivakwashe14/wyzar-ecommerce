export default function TermsConditionsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl bg-white rounded-lg shadow-sm p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: January 2026</p>

        <div className="prose prose-green max-w-none text-gray-700">
          <h2 className="text-xl font-bold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to Wyzar Marketplace! These terms and conditions outline the rules and regulations for the use of Wyzar's Website. By accessing this website we assume you accept these terms and conditions. Do not continue to use Wyzar if you do not agree to take all of the terms and conditions stated on this page.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">2. Buying and Payments</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Currency:</strong> All prices are listed in United States Dollars (USD). Payments in ZiG (Zimbabwe Gold) are accepted at the prevailing bank rate effectively on the day of transaction.</li>
            <li><strong>Payment Methods:</strong> We accept EcoCash, Innbucks, and ZIPIT/RTGS Bank Transfers. Proof of payment may be required for manual transfers.</li>
            <li><strong>Order Confirmation:</strong> Orders are confirmed only after payment verification by our team or the seller.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">3. Shipping and Delivery</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Delivery Zones:</strong> We currently facilitate delivery within Harare, Bulawayo, Mutare, and Gweru. Remote areas may incur extra charges.</li>
            <li><strong>Timelines:</strong> Standard delivery takes 24-72 hours. Delays caused by fuel shortages or other local logistic challenges are communicated promptly.</li>
            <li><strong>Risk of Loss:</strong> All items purchased from Wyzar are made pursuant to a shipment contract. This means that the risk of lossand title for such items pass to you upon our delivery to the carrier.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4">4. Returns and Refunds</h2>
          <p>
            Please review our <a href="/returns-refunds" className="text-shop_dark_green hover:underline">Returns & Refunds Policy</a> separately. Generally, you have 7 days to report a defect.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">5. Seller Obligations</h2>
          <p>
            Sellers must be verified Zimbabwean residents or registered entities. Selling illegal, counterfeit, or prohibited items (as defined by Zimbabwean law) is strictly forbidden.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">6. Jurisdiction</h2>
          <p>
            These terms generally be governed by and construed in accordance with the laws of the <strong>Republic of Zimbabwe</strong>. Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of Zimbabwe.
          </p>

          <h2 className="text-xl font-bold mt-8 mb-4">7. Contact Information</h2>
          <p>
            If you have any queries regarding any of our terms, please contact us at <a href="mailto:legal@wyzar.co.zw" className="text-shop_dark_green hover:underline">legal@wyzar.co.zw</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
