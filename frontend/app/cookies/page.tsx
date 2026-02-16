import Container from "@/components/Container";

export default function CookiePolicyPage() {
  return (
    <div className="bg-cream min-h-screen py-16">
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="font-[family-name:var(--font-caveat)] text-terracotta text-xl">Legal</span>
            <h1 className="text-3xl md:text-4xl font-bold text-brown mt-1">Cookie Policy</h1>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">What Are Cookies?</h2>
              <p className="text-brown-light leading-relaxed">
                Cookies are small text files that are stored on your device (computer or mobile phone) when you visit a website. They help the website remember your actions and preferences (such as login, language, font size, and other display preferences) over a period of time, so you don&apos;t have to keep re-entering them whenever you come back to the site or browse from one page to another.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">How We Use Cookies</h2>
              <p className="text-brown-light leading-relaxed mb-3">
                WyZar uses cookies to improve your browsing experience and to help us understand how people use our website. We use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-brown-light">
                <li><strong className="text-brown">Essential Cookies:</strong> These are necessary for the website to function properly. They enable core features like security, network management, and accessibility.</li>
                <li><strong className="text-brown">Performance Cookies:</strong> These help us understand how visitors interact with our website by collecting and reporting information anonymously.</li>
                <li><strong className="text-brown">Functionality Cookies:</strong> These allow the website to remember choices you make and provide enhanced, more personal features.</li>
                <li><strong className="text-brown">Advertising Cookies:</strong> These are used to deliver advertisements more relevant to you and your interests.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-line" style={{ borderRadius: '20px' }}>
              <h2 className="text-xl font-bold text-brown mb-3">Managing Cookies</h2>
              <p className="text-brown-light leading-relaxed">
                You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. If you do this, however, you may have to manually adjust some preferences every time you visit a site and some services and functionalities may not work.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
