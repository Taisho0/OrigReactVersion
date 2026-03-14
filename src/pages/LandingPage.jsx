import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import { useHashScroll } from '../components/useHashScroll.js'

export default function LandingPage() {
  useHashScroll()

  return (
    <div className="app-container">
      <SiteHeader />

      <main>
        <section id="home" className="hero">
          <div className="hero-content">
            <h1>Your Vision, Our Passion, Unforgettable Prints.</h1>
            <p>
              We are a modern printing company that brings your ideas to life.
              From custom apparel to promotional products, we&apos;ve got you covered.
            </p>
            <a href="#" className="cta-button" onClick={(e) => e.preventDefault()}>
              Get a Quote
            </a>
          </div>
        </section>

        <section id="getting-started" className="getting-started">
          <h2>Getting Started is Easy</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-icon">🎨</div>
              <h3>1. Choose a Product</h3>
              <p>
                Explore our wide range of customizable products, from t-shirts and hoodies
                to mugs and phone cases.
              </p>
            </div>

            <div className="step">
              <div className="step-icon">✏️</div>
              <h3>2. Customize Your Design</h3>
              <p>
                Upload your own artwork or use our design tools to create a unique design
                that reflects your brand or personality.
              </p>
            </div>

            <div className="step">
              <div className="step-icon">🚀</div>
              <h3>3. Place Your Order</h3>
              <p>
                Once you&apos;re happy with your design, simply place your order and we&apos;ll take care
                of the rest. Fast, reliable shipping guaranteed.
              </p>
            </div>
          </div>
        </section>

        <section id="why-choose-us" className="why-choose-us">
          <div className="why-choose-us-content">
            <div className="image-container">
              <img src="/logo.png" alt="ORIGINALS Printing Co." />
            </div>
            <div className="text-container">
              <h2>Why Choose ORIGINALS?</h2>
              <ul>
                <li><strong>Unmatched Quality:</strong> We use only the finest materials and printing techniques to ensure your products look amazing.</li>
                <li><strong>Endless Customization:</strong> From custom logos to full-color prints, we offer a wide range of options to bring your vision to life.</li>
                <li><strong>Fast &amp; Reliable:</strong> We pride ourselves on our quick turnaround times and reliable shipping.</li>
                <li><strong>Eco-Friendly:</strong> We are committed to sustainability and use eco-friendly inks and materials whenever possible.</li>
              </ul>
            </div>
          </div>
        </section>

        <h1 className="visually-hidden">ORIGINALS Printing Co.</h1>
      </main>

      <SiteFooter />
    </div>
  )
}