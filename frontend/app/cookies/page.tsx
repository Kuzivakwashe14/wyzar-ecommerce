import Container from "@/components/Container";

export default function CookiePolicyPage() {
  return (
    <div className="bg-white min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto prose prose-lg text-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-shop_dark_green mb-8 text-center">Cookie Policy</h1>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device (computer or mobile phone) when you visit a website. They help the website remember your actions and preferences (such as login, language, font size, and other display preferences) over a period of time, so you don't have to keep re-entering them whenever you come back to the site or browse from one page to another.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">How We Use Cookies</h2>
              <p>
                WyZar uses cookies to improve your browsing experience and to help us understand how people use our website. We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Essential Cookies:</strong> These are necessary for the website to function properly. They enable core features like security, network management, and accessibility.</li>
                <li><strong>Performance Cookies:</strong> These help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the performance of our site.</li>
                <li><strong>Functionality Cookies:</strong> These allow the website to remember choices you make (such as your user name, language, or the region you are in) and provide enhanced, more personal features.</li>
                <li><strong>Advertising Cookies:</strong> These are used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of the advertising campaign.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Managing Cookies</h2>
              <p>
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </div>
  );
}
