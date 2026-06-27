"use client";

import Image from "next/image";
import { useEffect } from "react";

/* ── Scroll-fade observer hook ─────────────────────────────────── */
function useFadeIn() {
  useEffect(() => {
    const els = document.querySelectorAll(".fade-in");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── SVG Icons ─────────────────────────────────────────────────── */
const CloudIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
    <path d="M12 8l-1 1.5" stroke="#F26F21" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M10.5 11.5 Q12 9 13.5 11.5" stroke="#F26F21" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.38A9.959 9.959 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.69 0-3.27-.5-4.6-1.36l-.33-.2-3.01.82.82-3.01-.2-.33C3.5 15.27 3 13.69 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />
  </svg>
);

const BikeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.67a8.18 8.18 0 0 0 4.77 1.52V6.74a4.85 4.85 0 0 1-1-.05z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 10a16 16 0 0 0 6.09 6.09l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 17.92z" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ width: 20, height: 20 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Page Component ─────────────────────────────────────────────── */
export default function Home() {
  useFadeIn();

  return (
    <>
      {/* ── Announcement Bar ───────────────────────────────────── */}
      <div className="announce-bar" role="banner">
        <span className="announce-dot" aria-hidden="true" />
        🎉 Grand Launching on June 2nd! Get Ready for Bold Flavors.
        <span className="announce-dot" aria-hidden="true" />
      </div>

      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero" aria-label="Hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content">
            {/* Brand logo */}
            <div className="brand-logo fade-in">
              <Image
                src="/logo.png"
                alt="t-cloud eats logo"
                width={80}
                height={80}
                priority
                style={{ borderRadius: "50%" }}
              />
              <div>
                <span className="brand-name">t&#8209;<span>cloud</span>&nbsp;eats</span>
              </div>
            </div>

            <h1 className="hero-headline fade-in fade-in-delay-1">
              Bold Flavors.{" "}
              <em>Street&#8209;Style</em>{" "}
              Favorites. Delivered Fast.
            </h1>
            <p className="hero-sub fade-in fade-in-delay-2">
              A modern cloud kitchen bringing hygienically prepared, richly
              flavored meals right to your door. Always boldly flavored, and
              always satisfying.
            </p>
            <div className="fade-in fade-in-delay-3">
              <span className="slogan">Eat. Enjoy. Repeat.</span>
            </div>
            <div className="fade-in fade-in-delay-4">
              <a
                id="hero-cta-whatsapp"
                href="https://wa.me/94706288109"
                className="cta-wa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Order Now on WhatsApp"
              >
                <WhatsAppIcon />
                Order Now on WhatsApp
              </a>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator" aria-hidden="true">
            <span>Scroll</span>
            <ChevronDownIcon />
          </div>
        </section>

        {/* ── Why Choose Us ────────────────────────────────────── */}
        <section className="features-section" aria-label="Why choose t-cloud eats">
          <div className="features-inner">
            <div className="features-header">
              <span className="section-label fade-in">Why choose us</span>
              <h2 className="section-title fade-in fade-in-delay-1">
                Three Reasons to Love Us
              </h2>
              <p className="section-sub fade-in fade-in-delay-2" style={{ margin: "0 auto" }}>
                We set the bar high — from the kitchen to your door, every detail matters.
              </p>
            </div>

            <div className="feature-cards" role="list">
              {/* Card 1 */}
              <article className="feature-card fade-in fade-in-delay-1" role="listitem">
                <div className="feature-icon" aria-hidden="true">
                  <ShieldIcon />
                </div>
                <div className="feature-body">
                  <h3 className="feature-title">Hygienically Prepared</h3>
                  <p className="feature-desc">
                    Strict food safety and hygiene standards maintained at every
                    step. Your peace of mind is our top priority — we never
                    cut corners when it comes to cleanliness.
                  </p>
                </div>
              </article>

              {/* Card 2 */}
              <article className="feature-card fade-in fade-in-delay-2" role="listitem">
                <div className="feature-icon" aria-hidden="true">
                  <FlameIcon />
                </div>
                <div className="feature-body">
                  <h3 className="feature-title">Rich &amp; Bold Flavors</h3>
                  <p className="feature-desc">
                    Authentic, mouth-watering street-style taste crafted with
                    the finest spices and ingredients. Every bite is a bold
                    flavor explosion you'll crave again and again.
                  </p>
                </div>
              </article>

              {/* Card 3 */}
              <article className="feature-card fade-in fade-in-delay-3" role="listitem">
                <div className="feature-icon" aria-hidden="true">
                  <BikeIcon />
                </div>
                <div className="feature-body">
                  <h3 className="feature-title">Fast Delivery</h3>
                  <p className="feature-desc">
                    Straight from our kitchen to your hands — hot, fresh, and
                    on time. We know you're hungry, so we make speed our
                    second nature.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── Community & Social ───────────────────────────────── */}
        <section className="community-section" aria-label="Community and social media">
          <div className="community-inner">
            <span className="section-label fade-in">Follow &amp; Connect</span>
            <h2 className="section-title fade-in fade-in-delay-1">
              Join the t&#8209;cloud eats Community
            </h2>
            <p className="section-sub fade-in fade-in-delay-2" style={{ margin: "0 auto" }}>
              Follow us for daily specials, behind-the-scenes content, and to
              be the first to know about new drops.
            </p>

            <nav className="social-grid fade-in fade-in-delay-3" aria-label="Social media links">
              <a
                id="social-instagram"
                href="https://www.instagram.com/tcloudeats/"
                className="social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="t-cloud eats on Instagram"
              >
                <InstagramIcon />
                <span className="social-label">Instagram</span>
              </a>
              <a
                id="social-tiktok"
                href="https://www.tiktok.com/@tcloudeats"
                className="social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="t-cloud eats on TikTok"
              >
                <TikTokIcon />
                <span className="social-label">TikTok</span>
              </a>
              <a
                id="social-facebook"
                href="https://www.facebook.com/tcloudeats"
                className="social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="t-cloud eats on Facebook"
              >
                <FacebookIcon />
                <span className="social-label">Facebook</span>
              </a>
              <a
                id="social-youtube"
                href="https://www.youtube.com/"
                className="social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="t-cloud eats on YouTube"
              >
                <YouTubeIcon />
                <span className="social-label">YouTube</span>
              </a>
            </nav>
          </div>
        </section>
      </main>

      {/* ── Find Us / Map Section ──────────────────────────────── */}
      <section className="map-section" aria-label="Find us">
        <div className="map-inner">
          {/* Info card */}
          <div className="map-info fade-in">
            <span className="section-label">Our Location</span>
            <h2 className="section-title" style={{ marginBottom: 20 }}>
              Find t&#8209;cloud eats
            </h2>

            <div className="map-detail">
              <div className="map-detail-icon" aria-hidden="true">
                <MapIcon />
              </div>
              <div>
                <p className="map-detail-label">Address</p>
                <p className="map-detail-value">
                  557/3/5 Godella Rd,<br />Mulleriyawa 10620,<br />Sri Lanka
                </p>
              </div>
            </div>

            <div className="map-detail">
              <div className="map-detail-icon" aria-hidden="true">
                <PhoneIcon />
              </div>
              <div>
                <p className="map-detail-label">Phone</p>
                <a href="tel:+94706288109" className="map-detail-value map-detail-link">
                  070 628 8109
                </a>
              </div>
            </div>

            <div className="map-detail">
              <div className="map-detail-icon" aria-hidden="true">
                <WhatsAppIcon />
              </div>
              <div>
                <p className="map-detail-label">WhatsApp Order</p>
                <a
                  href="https://wa.me/94706288109"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-detail-value map-detail-link"
                >
                  +94 70 628 8109
                </a>
              </div>
            </div>

            <a
              href="https://maps.app.goo.gl/K5SmeWHuuSF41U7VA"
              target="_blank"
              rel="noopener noreferrer"
              className="map-directions-btn"
              aria-label="Get directions to t-cloud eats on Google Maps"
            >
              <MapIcon />
              Get Directions
            </a>
          </div>

          {/* Embedded map */}
          <div className="map-embed-wrapper fade-in fade-in-delay-2">
            <iframe
              title="t-cloud eats location on Google Maps"
              src="https://maps.google.com/maps?q=557%2F3%2F5+Godella+Rd%2C+Mulleriyawa+10620%2C+Sri+Lanka&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer aria-label="Footer">
        <div className="footer-inner">
          {/* Brand */}
          <div className="footer-brand fade-in">
            <Image
              src="/logo.png"
              alt="t-cloud eats logo"
              width={52}
              height={52}
              style={{ borderRadius: "50%" }}
            />
            <span className="footer-brand-name">t&#8209;<span>cloud</span>&nbsp;eats</span>
          </div>
          <p className="footer-slogan fade-in">Eat. Enjoy. Repeat.</p>

          {/* Grid */}
          <div className="footer-grid">
            {/* Contact */}
            <div className="footer-col fade-in">
              <p className="footer-col-title">Contact</p>
              <a
                href="tel:+94706288109"
                aria-label="Call t-cloud eats"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <PhoneIcon />
                070 628 8109
              </a>
              <a
                href="https://wa.me/94706288109"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp t-cloud eats"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <WhatsAppIcon />
                Order on WhatsApp
              </a>
              <a
                href="mailto:tcloudeats@gmail.com"
                aria-label="Email t-cloud eats"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <EmailIcon />
                tcloudeats@gmail.com
              </a>
            </div>

            {/* Address & Links */}
            <div className="footer-col fade-in fade-in-delay-1">
              <p className="footer-col-title">Find Us</p>
              <a
                href="https://maps.app.goo.gl/K5SmeWHuuSF41U7VA"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View t-cloud eats on Google Maps"
                style={{ display: "flex", alignItems: "flex-start", gap: 6 }}
              >
                <MapIcon />
                557/3/5 Godella Rd,<br />Mulleriyawa 10620
              </a>

            </div>
          </div>

          <div className="footer-divider" />

          <div className="footer-bottom fade-in">
            <a
              id="footer-cta-whatsapp"
              href="https://wa.me/94706288109"
              className="footer-wa"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Order Now on WhatsApp"
            >
              <WhatsAppIcon />
              Order Now on WhatsApp
            </a>
            <p className="footer-copy">
              © 2026 t&#8209;cloud eats. Eat. Enjoy. Repeat.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
