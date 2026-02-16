export default function Design4() {
  return (
    <div className="design4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');

        .design4 {
          --terracotta: #c4654a;
          --terracotta-light: #d98068;
          --sage: #7a9e7e;
          --sage-light: #a3c4a7;
          --sand: #f5efe6;
          --sand-warm: #ede5d8;
          --cream: #faf7f2;
          --brown: #3d2c1e;
          --brown-mid: #5e4a3a;
          --brown-light: #8a7564;
          --white: #ffffff;
          --line: #e0d8cc;
          font-family: 'Nunito', sans-serif;
          background: var(--cream);
          color: var(--brown);
          overflow-x: hidden;
        }
        .design4 * { box-sizing: border-box; margin: 0; padding: 0; }

        .d4-handwritten {
          font-family: 'Caveat', cursive;
        }

        /* NAV */
        .d4-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1rem 3rem;
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(250, 247, 242, 0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--line);
        }
        .d4-logo {
          font-family: 'Caveat', cursive;
          font-size: 2.2rem; font-weight: 700;
          color: var(--terracotta);
        }
        .d4-nav-links { display: flex; gap: 2rem; align-items: center; }
        .d4-nav-links a {
          color: var(--brown-light); text-decoration: none;
          font-size: 0.9rem; font-weight: 600; transition: color 0.3s;
        }
        .d4-nav-links a:hover { color: var(--terracotta); }
        .d4-nav-cta {
          background: var(--terracotta); color: white;
          padding: 0.6rem 1.5rem; border-radius: 50px;
          font-weight: 700; font-size: 0.85rem; border: none;
          cursor: pointer; transition: all 0.3s; font-family: inherit;
        }
        .d4-nav-cta:hover { background: var(--brown); transform: scale(1.05); }

        /* HERO */
        .d4-hero {
          min-height: 100vh; display: flex; align-items: center;
          padding: 7rem 3rem 4rem;
          background: 
            radial-gradient(ellipse at 20% 80%, rgba(196, 101, 74, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 30%, rgba(122, 158, 126, 0.06) 0%, transparent 50%),
            var(--cream);
        }
        .d4-hero-inner {
          max-width: 1200px; margin: 0 auto; width: 100%;
          text-align: center;
        }
        .d4-hero-wave {
          font-family: 'Caveat', cursive;
          font-size: 1.5rem; color: var(--sage);
          margin-bottom: 1rem;
          animation: d4-wave 0.6s ease;
        }
        .d4-hero h1 {
          font-size: clamp(2.5rem, 5vw, 3.8rem);
          font-weight: 800; line-height: 1.2;
          max-width: 750px; margin: 0 auto 1.5rem;
          animation: d4-rise 0.7s ease;
        }
        .d4-hero h1 .d4-highlight {
          font-family: 'Caveat', cursive;
          color: var(--terracotta);
          font-size: 1.15em;
          display: inline-block;
          transform: rotate(-2deg);
        }
        .d4-hero-sub {
          font-size: 1.1rem; color: var(--brown-light);
          max-width: 550px; margin: 0 auto 2.5rem;
          line-height: 1.8; font-weight: 400;
          animation: d4-rise 0.7s ease 0.1s both;
        }
        .d4-hero-btns {
          display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;
          animation: d4-rise 0.7s ease 0.2s both;
        }
        .d4-btn-warm {
          background: var(--terracotta); color: white;
          padding: 0.9rem 2.5rem; border-radius: 50px;
          font-weight: 700; font-size: 0.95rem; border: none;
          cursor: pointer; transition: all 0.3s; font-family: inherit;
        }
        .d4-btn-warm:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(196, 101, 74, 0.25); }
        .d4-btn-outlined {
          background: transparent; color: var(--brown);
          padding: 0.9rem 2.5rem; border-radius: 50px;
          font-weight: 700; font-size: 0.95rem;
          border: 2px solid var(--line);
          cursor: pointer; transition: all 0.3s; font-family: inherit;
        }
        .d4-btn-outlined:hover { border-color: var(--sage); color: var(--sage); }

        /* Community Stats */
        .d4-community-stats {
          max-width: 800px; margin: 4rem auto 0;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;
          animation: d4-rise 0.7s ease 0.3s both;
        }
        .d4-comm-stat {
          text-align: center;
          padding: 1.5rem;
          background: var(--white);
          border-radius: 20px;
          border: 1px solid var(--line);
        }
        .d4-comm-stat-num {
          font-family: 'Caveat', cursive;
          font-size: 2.5rem; font-weight: 700;
          color: var(--terracotta);
        }
        .d4-comm-stat-label {
          font-size: 0.8rem; color: var(--brown-light);
          font-weight: 600;
        }

        /* Testimonials */
        .d4-testimonials {
          padding: 6rem 3rem;
          background: var(--sand);
        }
        .d4-section-header {
          text-align: center; max-width: 600px; margin: 0 auto 4rem;
        }
        .d4-section-tag {
          font-family: 'Caveat', cursive;
          font-size: 1.3rem; color: var(--sage);
          margin-bottom: 0.5rem; display: block;
        }
        .d4-section-header h2 {
          font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 800;
          margin-bottom: 0.75rem;
        }
        .d4-section-header p { color: var(--brown-light); font-size: 1rem; line-height: 1.7; }

        .d4-testimonial-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
        }
        .d4-testimonial {
          background: var(--white);
          border-radius: 20px; padding: 2rem;
          border: 1px solid var(--line);
          transition: all 0.3s;
        }
        .d4-testimonial:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(61, 44, 30, 0.06); }
        .d4-testimonial-quote {
          font-size: 0.95rem; line-height: 1.7;
          color: var(--brown-mid); margin-bottom: 1.5rem;
          font-style: italic;
          position: relative;
          padding-left: 1.5rem;
        }
        .d4-testimonial-quote::before {
          content: '"'; position: absolute; left: 0; top: -0.25rem;
          font-family: 'Caveat', cursive;
          font-size: 2.5rem; color: var(--terracotta); opacity: 0.4;
          line-height: 1;
        }
        .d4-testimonial-author {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .d4-avatar {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Caveat', cursive; font-size: 1.2rem;
          font-weight: 700; color: white;
        }
        .d4-testimonial:nth-child(1) .d4-avatar { background: var(--terracotta); }
        .d4-testimonial:nth-child(2) .d4-avatar { background: var(--sage); }
        .d4-testimonial:nth-child(3) .d4-avatar { background: var(--brown-light); }
        .d4-author-name { font-weight: 700; font-size: 0.9rem; }
        .d4-author-role { font-size: 0.75rem; color: var(--brown-light); }
        .d4-stars {
          color: var(--terracotta); font-size: 0.85rem;
          margin-bottom: 0.75rem; letter-spacing: 2px;
        }

        /* Features */
        .d4-features {
          padding: 6rem 3rem;
          background: var(--cream);
        }
        .d4-feat-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
        }
        .d4-feat-card {
          background: var(--white);
          border: 1px solid var(--line);
          border-radius: 20px; padding: 2rem;
          transition: all 0.3s; text-align: center;
        }
        .d4-feat-card:hover { border-color: var(--sage); transform: translateY(-4px); }
        .d4-feat-emoji {
          font-size: 2.5rem; margin-bottom: 1rem;
          display: block;
        }
        .d4-feat-card h3 {
          font-size: 1.1rem; font-weight: 700; margin-bottom: 0.5rem;
        }
        .d4-feat-card p { color: var(--brown-light); font-size: 0.88rem; line-height: 1.7; }

        /* Seller Stories */
        .d4-stories {
          padding: 6rem 3rem;
          background: var(--sand);
        }
        .d4-stories-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
        }
        .d4-story-card {
          background: var(--white);
          border-radius: 20px; overflow: hidden;
          border: 1px solid var(--line);
          transition: all 0.3s;
        }
        .d4-story-card:hover { box-shadow: 0 10px 30px rgba(61, 44, 30, 0.08); }
        .d4-story-banner {
          height: 160px; display: flex; align-items: center;
          justify-content: center;
        }
        .d4-story-card:nth-child(1) .d4-story-banner { background: linear-gradient(135deg, rgba(196,101,74,0.1), rgba(196,101,74,0.05)); }
        .d4-story-card:nth-child(2) .d4-story-banner { background: linear-gradient(135deg, rgba(122,158,126,0.1), rgba(122,158,126,0.05)); }
        .d4-story-banner-icon {
          width: 70px; height: 70px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Caveat', cursive; font-size: 1.5rem;
          font-weight: 700; color: white;
        }
        .d4-story-card:nth-child(1) .d4-story-banner-icon { background: var(--terracotta); }
        .d4-story-card:nth-child(2) .d4-story-banner-icon { background: var(--sage); }
        .d4-story-body { padding: 2rem; }
        .d4-story-body h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .d4-story-body .d4-story-role {
          font-family: 'Caveat', cursive;
          font-size: 1rem; color: var(--sage); margin-bottom: 1rem;
        }
        .d4-story-body p { color: var(--brown-mid); font-size: 0.9rem; line-height: 1.7; }
        .d4-story-stat {
          display: flex; gap: 2rem; margin-top: 1.5rem;
          padding-top: 1rem; border-top: 1px solid var(--line);
        }
        .d4-story-stat div span:first-child {
          font-weight: 800; font-size: 1.1rem;
          color: var(--terracotta); display: block;
        }
        .d4-story-stat div span:last-child {
          font-size: 0.75rem; color: var(--brown-light);
        }

        /* How It Works */
        .d4-how {
          padding: 6rem 3rem;
          background: var(--brown);
          color: var(--sand);
        }
        .d4-how .d4-section-tag { color: var(--terracotta-light); }
        .d4-how .d4-section-header p { color: rgba(245, 239, 230, 0.6); }
        .d4-how-steps {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem;
          text-align: center;
        }
        .d4-how-step-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: rgba(196, 101, 74, 0.15);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          font-family: 'Caveat', cursive;
          font-size: 1.5rem; color: var(--terracotta-light); font-weight: 700;
        }
        .d4-how-step h4 {
          font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem;
        }
        .d4-how-step p {
          font-size: 0.82rem; line-height: 1.6;
          color: rgba(245, 239, 230, 0.5);
        }

        /* CTA */
        .d4-cta {
          padding: 7rem 3rem;
          text-align: center;
          background: var(--cream);
        }
        .d4-cta h2 {
          font-size: clamp(2rem, 4vw, 3rem); font-weight: 800;
          margin-bottom: 0.75rem;
        }
        .d4-cta h2 .d4-highlight {
          font-family: 'Caveat', cursive;
          color: var(--terracotta); font-size: 1.15em;
        }
        .d4-cta p {
          color: var(--brown-light); font-size: 1rem;
          max-width: 450px; margin: 0 auto 2.5rem; line-height: 1.7;
        }
        .d4-cta-note {
          font-family: 'Caveat', cursive;
          font-size: 1.1rem; color: var(--sage);
          margin-top: 1.5rem;
        }

        /* Footer */
        .d4-footer {
          padding: 3rem;
          background: var(--sand);
          border-top: 1px solid var(--line);
        }
        .d4-footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 2.5rem;
          margin-bottom: 2.5rem;
        }
        .d4-footer-brand {
          font-family: 'Caveat', cursive;
          font-size: 1.8rem; font-weight: 700;
          color: var(--terracotta); margin-bottom: 0.75rem;
        }
        .d4-footer p { color: var(--brown-light); font-size: 0.85rem; line-height: 1.7; }
        .d4-footer h4 { font-size: 0.8rem; font-weight: 700; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
        .d4-footer ul { list-style: none; }
        .d4-footer li { margin-bottom: 0.5rem; }
        .d4-footer a { color: var(--brown-light); text-decoration: none; font-size: 0.85rem; transition: color 0.3s; }
        .d4-footer a:hover { color: var(--terracotta); }
        .d4-footer-bottom {
          max-width: 1200px; margin: 0 auto;
          padding-top: 1.5rem;
          border-top: 1px solid var(--line);
          display: flex; justify-content: space-between;
          font-size: 0.8rem; color: var(--brown-light);
        }

        @keyframes d4-wave { from { opacity: 0; transform: translateY(10px) rotate(-3deg); } to { opacity: 1; transform: translateY(0) rotate(0); } }
        @keyframes d4-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) {
          .d4-testimonial-grid { grid-template-columns: 1fr 1fr; }
          .d4-feat-grid { grid-template-columns: 1fr 1fr; }
          .d4-stories-grid { grid-template-columns: 1fr; }
          .d4-how-steps { grid-template-columns: repeat(2, 1fr); }
          .d4-footer-inner { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .d4-nav { padding: 1rem 1.5rem; }
          .d4-nav-links { display: none; }
          .d4-hero { padding: 6rem 1.5rem 3rem; }
          .d4-community-stats { grid-template-columns: 1fr; max-width: 300px; }
          .d4-testimonials, .d4-features, .d4-stories, .d4-how, .d4-cta { padding: 4rem 1.5rem; }
          .d4-testimonial-grid { grid-template-columns: 1fr; }
          .d4-feat-grid { grid-template-columns: 1fr; }
          .d4-how-steps { grid-template-columns: 1fr; }
          .d4-footer { padding: 2rem 1.5rem; }
          .d4-footer-inner { grid-template-columns: 1fr; }
          .d4-hero-btns { flex-direction: column; align-items: center; }
        }
      `}</style>

      {/* Nav */}
      <nav className="d4-nav">
        <div className="d4-logo">WyZar</div>
        <div className="d4-nav-links">
          <a href="#community">Community</a>
          <a href="#features">Features</a>
          <a href="#stories">Stories</a>
          <a href="#how">How it Works</a>
        </div>
        <button className="d4-nav-cta">Join Our Community</button>
      </nav>

      {/* Hero */}
      <section className="d4-hero">
        <div className="d4-hero-inner">
          <div className="d4-hero-wave">👋 Mhoro! Welcome to WyZar</div>
          <h1>
            Where Zimbabwe's <span className="d4-highlight">community</span> comes to shop & sell together
          </h1>
          <p className="d4-hero-sub">
            Built by Zimbabweans, for Zimbabweans. A marketplace where every seller has a story, every buyer has a voice, and everyone shops with trust.
          </p>
          <div className="d4-hero-btns">
            <button className="d4-btn-warm">Join the Community</button>
            <button className="d4-btn-outlined">Share Your Story</button>
          </div>
          <div className="d4-community-stats">
            <div className="d4-comm-stat">
              <div className="d4-comm-stat-num">50K+</div>
              <div className="d4-comm-stat-label">Community Members</div>
            </div>
            <div className="d4-comm-stat">
              <div className="d4-comm-stat-num">15K+</div>
              <div className="d4-comm-stat-label">Active Sellers</div>
            </div>
            <div className="d4-comm-stat">
              <div className="d4-comm-stat-num">4.9★</div>
              <div className="d4-comm-stat-label">Community Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="d4-testimonials" id="community">
        <div className="d4-section-header">
          <span className="d4-section-tag">Real people, real stories</span>
          <h2>Hear From Our Community</h2>
          <p>Thousands of buyers and sellers trust WyZar every day. Here's what they say.</p>
        </div>
        <div className="d4-testimonial-grid">
          {[
            { quote: "I found a beautiful handmade basket from a seller in Bulawayo. The quality was incredible and the seller was so friendly through the chat!", name: "Tendai M.", role: "Buyer from Harare", stars: "★★★★★", initials: "TM" },
            { quote: "WyZar helped me take my clothing business online. Within two months, my sales tripled and I now have regular customers across the country.", name: "Grace C.", role: "Fashion Seller", stars: "★★★★★", initials: "GC" },
            { quote: "I love the EcoCash integration — it makes buying so easy. And the order tracking through WhatsApp is brilliant. Best platform in Zim!", name: "Kuda P.", role: "Regular Shopper", stars: "★★★★★", initials: "KP" },
          ].map((t, i) => (
            <div className="d4-testimonial" key={i}>
              <div className="d4-stars">{t.stars}</div>
              <div className="d4-testimonial-quote">{t.quote}</div>
              <div className="d4-testimonial-author">
                <div className="d4-avatar">{t.initials}</div>
                <div>
                  <div className="d4-author-name">{t.name}</div>
                  <div className="d4-author-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="d4-features" id="features">
        <div className="d4-section-header">
          <span className="d4-section-tag">Built for our community</span>
          <h2>Everything You Love, All in One Place</h2>
          <p>Tools and features designed with input from our amazing community of buyers and sellers.</p>
        </div>
        <div className="d4-feat-grid">
          {[
            { emoji: '🛡️', title: 'Verified Sellers', desc: "Every seller is verified, so you always shop with confidence from real people." },
            { emoji: '💳', title: 'Pay Your Way', desc: "EcoCash, OneMoney, Telecash, Paynow, bank cards, and even Cash on Delivery." },
            { emoji: '📦', title: 'Track Orders Live', desc: "SMS, email, and WhatsApp updates so you always know where your order is." },
            { emoji: '⭐', title: 'Honest Reviews', desc: "Real reviews from real buyers help the community make better decisions together." },
            { emoji: '💬', title: 'Chat With Sellers', desc: "Ask questions, negotiate, and build relationships through in-app messaging." },
            { emoji: '🔍', title: 'Smart Search', desc: "Find what you need quickly with filters for price, location, and delivery time." },
          ].map((f, i) => (
            <div className="d4-feat-card" key={i}>
              <span className="d4-feat-emoji">{f.emoji}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Seller Stories */}
      <section className="d4-stories" id="stories">
        <div className="d4-section-header">
          <span className="d4-section-tag">Seller spotlight ✨</span>
          <h2>Meet the People Behind the Products</h2>
          <p>Our sellers aren't just businesses — they're your neighbours, artisans, and entrepreneurs.</p>
        </div>
        <div className="d4-stories-grid">
          <div className="d4-story-card">
            <div className="d4-story-banner">
              <div className="d4-story-banner-icon">RN</div>
            </div>
            <div className="d4-story-body">
              <h3>Rudo Nyamupinga</h3>
              <div className="d4-story-role">Handcrafted Jewellery · Harare</div>
              <p>"I started making jewellery in my kitchen. WyZar gave me a platform to share my creations with the world. Now I have customers in every province and three employees!"</p>
              <div className="d4-story-stat">
                <div><span>1,200+</span><span>Products Sold</span></div>
                <div><span>4.9★</span><span>Rating</span></div>
                <div><span>2 Years</span><span>On WyZar</span></div>
              </div>
            </div>
          </div>
          <div className="d4-story-card">
            <div className="d4-story-banner">
              <div className="d4-story-banner-icon">TM</div>
            </div>
            <div className="d4-story-body">
              <h3>Tapiwa Moyo</h3>
              <div className="d4-story-role">Electronics Imports · Bulawayo</div>
              <p>"With WyZar's bulk upload and multi-currency support, I can source from China and sell locally in USD or ZWG. The analytics help me know exactly what's trending."</p>
              <div className="d4-story-stat">
                <div><span>5,000+</span><span>Products Sold</span></div>
                <div><span>4.8★</span><span>Rating</span></div>
                <div><span>1.5 Years</span><span>On WyZar</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="d4-how" id="how">
        <div className="d4-section-header">
          <span className="d4-section-tag">Simple as 1-2-3-4</span>
          <h2>How It Works</h2>
          <p>Join our community and start shopping or selling in minutes.</p>
        </div>
        <div className="d4-how-steps">
          {[
            { num: '1', title: 'Sign Up Free', desc: 'Create your free account and join our growing community.' },
            { num: '2', title: 'Discover & Connect', desc: 'Browse products and connect with sellers through chat.' },
            { num: '3', title: 'Pay Securely', desc: 'Use EcoCash, bank transfer, cards, or Cash on Delivery.' },
            { num: '4', title: 'Review & Share', desc: 'Leave a review and help the community grow stronger together.' },
          ].map((s, i) => (
            <div className="d4-how-step" key={i}>
              <div className="d4-how-step-icon">{s.num}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="d4-cta">
        <h2>Be Part of Something <span className="d4-highlight">Special</span></h2>
        <p>Join 50,000+ Zimbabweans who are buying, selling, and growing together on WyZar.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="d4-btn-warm">Join the Community</button>
          <button className="d4-btn-outlined">Become a Seller</button>
        </div>
        <div className="d4-cta-note">Free to join · No setup fees · Start selling today 🎉</div>
      </section>

      {/* Footer */}
      <footer className="d4-footer">
        <div className="d4-footer-inner">
          <div>
            <div className="d4-footer-brand">WyZar</div>
            <p>A community marketplace built by Zimbabweans, for Zimbabweans. Shop local, support each other, grow together.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul><li><a href="#">All Products</a></li><li><a href="#">Categories</a></li><li><a href="#">Deals</a></li><li><a href="#">New Arrivals</a></li></ul>
          </div>
          <div>
            <h4>Community</h4>
            <ul><li><a href="#">Seller Stories</a></li><li><a href="#">Reviews</a></li><li><a href="#">Blog</a></li><li><a href="#">Events</a></li></ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul><li><a href="#">Support</a></li><li><a href="#">FAQ</a></li><li><a href="#">Contact</a></li><li><a href="#">Safety</a></li></ul>
          </div>
        </div>
        <div className="d4-footer-bottom">
          <span>© 2026 WyZar Community</span>
          <span>Made with ❤️ in Zimbabwe</span>
        </div>
      </footer>
    </div>
  );
}
