import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
  const whatsappNumber = '14155238886';

  return (
    <div className="landing-container">
      <nav className="navbar">
        <div className="logo">
          Arewa <span>Market</span>
        </div>

        <a
          href={`https://wa.me/${whatsappNumber}?text=Hi`}
          className="nav-cta"
        >
          Start Selling
        </a>
      </nav>

      <header className="hero">
        <div className="hero-content">
          <h1>
            Your Shop, Now on <span>WhatsApp</span>
          </h1>

          <p>
            The easiest way to sell to your community. Create your digital
            store in minutes and manage orders directly through chat.
          </p>

          <div className="hero-btns">
            <a
              href={`https://wa.me/${whatsappNumber}?text=Hi`}
              className="btn-primary"
            >
              Get Started for Free
            </a>

            <a href="#how-it-works" className="btn-secondary">
              Learn More
            </a>
          </div>
        </div>
      </header>

      <section id="how-it-works" className="features">
        <h2>How It Works</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon">💬</div>
            <h3>Chat to Setup</h3>
            <p>
              No complex apps. Just send "Hi" to our WhatsApp number and follow
              the simple setup steps.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">📸</div>
            <h3>Upload Products</h3>
            <p>
              Snap a photo of your product, add a price, and it's instantly live
              on your personalized web store.
            </p>
          </div>

          <div className="feature-card">
            <div className="icon">🔗</div>
            <h3>Share Link</h3>
            <p>
              Get a unique link (e.g., arewa-market.com/store/your-shop) to share
              on social media or with customers.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to grow your business?</h2>
          <p>Join hundreds of traders selling more with ArewaMarket.</p>

          <a
            href={`https://wa.me/${whatsappNumber}?text=Hi`}
            className="btn-white"
          >
            Join the Community Now
          </a>
        </div>
      </section>

      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} ArewaMarket. Built for the community.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;