"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
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

/* ── Menu Data ──────────────────────────────────────────────────── */
const TOP_10_MENU = [
  {
    id: 1,
    title: "Classic Chicken Fried Rice",
    price: "LKR 1,100",
    portion: "Full Portion",
    tags: ["Popular"],
    description: "Basmati Rice, Fried Chicken Strip, Vegetable serve with Sunny side up, Onion Pickles, Homemade Chili Paste.",
    category: "Fried Rice",
    sku: "FR-02",
    image: "/Product Images/FR-02.avif"
  },
  {
    id: 2,
    title: "Nasi Goreng",
    price: "LKR 1,400",
    portion: "Full Portion",
    tags: ["Popular", "Spicy"],
    description: "Tender Chicken, Prawns, Beef, Basmati Rice, Vegetable Served With Fried Egg And Served With Crispy Crackers.",
    category: "Fried Rice",
    sku: "FR-07",
    image: "/Product Images/FR-07.avif"
  },
  {
    id: 3,
    title: "Prawns Fried Rice",
    price: "LKR 1,200",
    portion: "Full Portion",
    tags: [],
    description: "Stir Fried Prawns, Basmati rice, Vegetable, serve with Sunny side up, Onion Pickle, Homemade Chili paste.",
    category: "Fried Rice",
    sku: "FR-03"
  },
  {
    id: 4,
    title: "Chicken Chopsuey Rice",
    price: "LKR 1,400",
    portion: "Full Portion",
    tags: ["Chef Special"],
    description: "Aromatic Fried Rice And Colorful Stir-Fried Vegetables With Tender Chicken Finished In A Rich Savory Sauce.",
    category: "Chopsuey",
    sku: "CS-01"
  },
  {
    id: 5,
    title: "Coca Cola",
    price: "LKR 300",
    portion: "1050ml",
    tags: [],
    description: "Refreshing cold Coca Cola bottle.",
    category: "Beverages",
    sku: "BV-03"
  },
  {
    id: 6,
    title: "Chicken Kottu",
    price: "LKR 1,100",
    portion: "Full Portion",
    tags: ["Popular"],
    description: "Black Chicken Curry, Chopped Roti, Vegetables, Aromatic Spices, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste.",
    category: "Kottu",
    sku: "KT-02",
    image: "/Product Images/KT-02.avif"
  },
  {
    id: 7,
    title: "Fried Chicken Cheese Kottu",
    price: "LKR 1,600",
    portion: "Full Portion",
    tags: ["Popular", "Cheesy"],
    description: "Street Food Favorite Fried Chicken, Cheese, Milk With Sunny Side Up, Onion Pickle, Spicy Gravy.",
    category: "Kottu"
  },
  {
    id: 8,
    title: "Sri Lankan Chicken Devilled",
    price: "LKR 1,200",
    portion: "250g",
    tags: ["Spicy"],
    description: "250g boneless chicken cooked in traditional spicy Sri Lankan devilled style.",
    category: "Ultimate Bites"
  },
  {
    id: 9,
    title: "Fried Fish",
    price: "LKR 1,500",
    portion: "250g",
    tags: ["Popular"],
    description: "Crispy fried devilled fish prepared Sri Lankan style.",
    category: "Ultimate Bites"
  },
  {
    id: 10,
    title: "Milk Shake",
    price: "LKR 700",
    portion: "Regular",
    tags: ["Refreshing"],
    description: "Delicious milkshake. Choose your flavor: Strawberry, Vanilla, or Chocolate.",
    category: "Beverages"
  }
];

const CATEGORIES = ["All", "Fried Rice", "Chopsuey", "Kottu", "Ultimate Bites", "Beverages"];

function getFallbackDescription(title: string, category: string): string {
  if (category === "Beverages") {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cola")) {
      return "Chilled Coca-Cola bottle from the Coca-Cola Company.";
    }
    if (lowerTitle.includes("sprite")) {
      return "Chilled Sprite bottle from the Coca-Cola Company.";
    }
    if (lowerTitle.includes("fanta")) {
      return "Chilled Fanta bottle from the Coca-Cola Company.";
    }
    if (lowerTitle.includes("egb")) {
      return "Elephant House Ginger Beer (EGB) bottle.";
    }
    if (lowerTitle.includes("water")) {
      return "Pure chilled mineral water bottle.";
    }
    if (lowerTitle.includes("shake")) {
      return "Chilled, creamy milkshake.";
    }
    return `Chilled and refreshing beverage.`;
  }
  return `Delicious ${title} prepared fresh in our kitchen with premium ingredients.`;
}

/* ── Page Component ─────────────────────────────────────────────── */
export default function Home() {
  useFadeIn();

  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/menu");
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        }
      } catch (error) {
        console.error("Failed to load menu on homepage:", error);
      }
    }
    loadMenu();
  }, []);

  useEffect(() => {
    // Grand Launch: July 2nd, 2026 at 00:00:00 (Sri Lanka Time: UTC+05:30)
    const launchDate = new Date("2026-07-02T00:00:00+05:30");
    
    const calculateTime = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days > 0 ? days : 0);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <main>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="hero" aria-label="Hero">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />

          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            {/* Brand logo */}
            <div className="brand-logo fade-in" style={{ marginBottom: 0 }}>
              <Image
                src="/Round Logo.png"
                alt="t-cloud eats logo"
                width={80}
                height={80}
                priority
              />
              <div>
                <span className="brand-name" style={{ color: "#F26F21" }}>t&#8209;cloud eats</span>
              </div>
            </div>

            {/* Slogan directly under the logo */}
            <div className="fade-in" style={{ marginTop: "4px", marginBottom: "16px" }}>
              <span className="slogan" style={{ fontSize: "0.85rem", letterSpacing: "0.15em", color: "rgba(250, 243, 224, 0.6)" }}>
                Eat. Enjoy. Repeat.
              </span>
            </div>

            {/* Hero Section Countdown */}
            {daysRemaining !== null && (
              <h2 className="fade-in" style={{
                color: '#F26F21',
                fontFamily: 'var(--font-heading)',
                fontWeight: 'bold',
                fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
                marginBottom: '16px',
                textAlign: 'center',
                textShadow: '0 0 20px rgba(242, 111, 33, 0.3)'
              }}>
                {daysRemaining} DAYS LEFT
              </h2>
            )}

            {/* Grand Launching Subheading */}
            <div className="fade-in fade-in-delay-1" style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(0.95rem, 2vw, 1.2rem)",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#ff9e67",
              marginBottom: "12px"
            }}>
              GRAND LAUNCHING JULY 2ND
            </div>

            <h1 className="hero-headline fade-in fade-in-delay-1" style={{ marginBottom: "16px" }}>
              Bold Flavors.{" "}
              <em>Street&#8209;Style</em>{" "}
              Favorites. Delivered Fast.
            </h1>
            
            <p className="hero-sub fade-in fade-in-delay-2" style={{ maxWidth: "640px", margin: "0 auto 32px" }}>
              Hygienically prepared, richly flavored street-food favorites are just days away
              from your door. Get ready for the ultimate satisfying taste experience.
            </p>
            
            <div className="fade-in fade-in-delay-3">
              <a
                id="hero-cta-whatsapp"
                href="https://wa.me/94706288109"
                className="cta-wa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Stay Updated via WhatsApp"
              >
                <WhatsAppIcon />
                Stay Updated via WhatsApp
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
                We set the bar high. From the kitchen to your door, every detail matters.
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
                    step. Your peace of mind is our top priority. We never
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
                    Straight from our kitchen to your hands, hot, fresh, and
                    on time. We know you're hungry, so we make speed our
                    second nature.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── Menu Section ────────────────────────────────────────── */}
        <section id="menu" className="menu-section relative overflow-hidden" style={{ padding: '96px 0' }}>
          {/* Background glow */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'700px', background:'radial-gradient(circle at center, rgba(242,111,33,0.05) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

          <div className="menu-inner" style={{ padding: '0 40px', position: 'relative', zIndex: 1 }}>
            {/* Section Header */}
            <div className="menu-header">
              <span style={{ display:'inline-block', fontSize:'0.72rem', fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', color:'#F26F21', background:'rgba(242,111,33,0.1)', padding:'5px 16px', borderRadius:'999px', marginBottom:'18px' }}>
                Our Menu
              </span>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(2.2rem,5vw,3.2rem)', fontWeight:900, color:'#FAF3E0', lineHeight:1.05, letterSpacing:'-0.02em', margin:'0 0 16px' }}>
                Explore Aromatic Flavors
              </h2>
              <p style={{ fontSize:'1.05rem', color:'rgba(250,243,224,0.65)', maxWidth:'480px', margin:'0 auto', lineHeight:1.6 }}>
                Freshly prepared street-style favorites made with premium ingredients. Custom orders welcome.
              </p>
            </div>

            {/* Menu Grid - Curated Dynamic Cards */}
            <div className="menu-grid">
              {(menuItems.length > 0 ? menuItems.slice(0, 6) : TOP_10_MENU.slice(0, 6)).map((item) => {
                const priceText = typeof item.price === "string" ? item.price : `Rs ${Number(item.price).toLocaleString()}`;
                const descriptionText = item.description || getFallbackDescription(item.title, item.category);
                const tags = item.tags || [item.category];
                return (
                  <div key={item.id} className="menu-card" data-category={item.category}>
                    {item.image && (
                      <div className="menu-card-image-wrapper">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="menu-card-image"
                        />
                      </div>
                    )}
                    <div className="menu-card-header">
                      <h3 className="menu-card-title">{item.title}</h3>
                      <span className="menu-card-price">{priceText}</span>
                    </div>
                    <div className="menu-card-meta">
                      <span className="menu-card-portion">{item.portion}</span>
                      <div className="menu-card-tags">
                        {tags.map((tag: string) => (
                          <span key={tag} className={`menu-tag ${tag.toLowerCase().replace(" & ", "-").replace(" ", "-")}`}>
                            {tag}
                          </span>
                        ))}
                        {item.sku && (
                          <span className="menu-tag chef-special">
                            {item.sku}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="menu-card-desc">{descriptionText}</p>
                    <div className="menu-card-actions">
                      <a
                        href={`https://wa.me/94706288109?text=Hi%20t-cloud%20eats!%20I%20would%20like%20to%20order%20the%20${encodeURIComponent(item.title)}%20(${encodeURIComponent(item.portion)}).`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="menu-order-btn"
                      >
                        <WhatsAppIcon />
                        Order on WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View Full Menu Button */}
            <div style={{ textAlign: 'center', marginTop: '48px', position: 'relative', zIndex: 2 }}>
              <Link
                href="/order"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                  padding: '14px 36px',
                  borderRadius: '100px',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  background: '#0D1B35',
                  border: '2.5px solid #F26F21',
                  color: '#F26F21',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#F26F21';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 6px 20px rgba(242, 111, 33, 0.4)';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.background = '#0D1B35';
                  (e.currentTarget as HTMLAnchorElement).style.color = '#F26F21';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                }}
              >
                View Full Menu
              </Link>
            </div>
          </div>
        </section>

        {/* ── Reviews Section ───────────────────────────────────── */}
        <section id="reviews" aria-label="Customer Reviews" className="bg-[#0D1B35] relative overflow-hidden" style={{ padding: '96px 0' }}>
          {/* Background glow */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'700px', background:'radial-gradient(circle at center, rgba(242,111,33,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }} />

          <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 40px', position:'relative', zIndex:1 }}>

            {/* ── Header ── */}
            <div style={{ textAlign:'center', marginBottom:'64px' }}>
              <span style={{ display:'inline-block', fontSize:'0.72rem', fontWeight:900, letterSpacing:'0.18em', textTransform:'uppercase', color:'#F26F21', background:'rgba(242,111,33,0.1)', padding:'5px 16px', borderRadius:'999px', marginBottom:'18px' }}>
                Testimonials
              </span>
              <h2 style={{ fontFamily:'var(--font-heading)', fontSize:'clamp(2rem,5vw,3.2rem)', fontWeight:900, color:'#FAF3E0', lineHeight:1.05, letterSpacing:'-0.02em', margin:'0 0 16px' }}>
                Loved by Our Community
              </h2>
              <p style={{ fontSize:'1rem', color:'rgba(250,243,224,0.65)', maxWidth:'480px', margin:'0 auto', lineHeight:1.6 }}>
                Real reviews from our Google Business Profile. We take pride in every bite we serve.
              </p>
            </div>

            {/* ── Two-column layout ── */}
            <div className="reviews-grid" style={{ alignItems:'stretch' }}>

              {/* Left: Google Rating Card — justify-content:space-between distributes items evenly */}
              <div
                style={{ background:'linear-gradient(160deg, #1b2a4e 0%, #0f1a35 100%)', border:'2px solid rgba(242,111,33,0.35)', borderRadius:'28px', padding:'44px 36px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', justifyContent:'space-between', transition:'transform 0.3s, box-shadow 0.3s', cursor:'default' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 24px 60px rgba(242,111,33,0.2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}
              >
                {/* Google logo */}
                <div style={{ width:'56px', height:'56px', background:'rgba(255,255,255,0.07)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.1)' }}>
                  <svg viewBox="0 0 24 24" width="30" height="30">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                </div>

                {/* Center content group */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:'5rem', fontWeight:900, color:'#FAF3E0', lineHeight:1, letterSpacing:'-0.03em' }}>5.0</div>
                  <div style={{ display:'flex', gap:'6px' }}>
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="22" height="22" viewBox="0 0 20 20" style={{ fill:'#FBBF24', filter:'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }}>
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(250,243,224,0.4)', margin:0 }}>Based on Google Reviews</p>
                </div>

                {/* Bottom group containing divider and CTA to prevent awkward spacing */}
                <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'20px' }}>
                  {/* Divider */}
                  <div style={{ width:'100%', height:'1px', background:'rgba(255,255,255,0.07)' }} />

                  {/* CTA */}
                  <a
                    href="https://maps.app.goo.gl/ZDJLkduPmxjPQf8X6"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display:'block', width:'100%', background:'linear-gradient(135deg, #F26F21, #ff843a)', color:'#fff', fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'0.95rem', padding:'14px 0', borderRadius:'999px', textDecoration:'none', textAlign:'center', transition:'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform='scale(1.03)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow='0 8px 28px rgba(242,111,33,0.45)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform='scale(1)'; (e.currentTarget as HTMLAnchorElement).style.boxShadow='none'; }}
                  >
                    Write a Review
                  </a>
                </div>
              </div>

              {/* Right: Review Cards stacked — flex:1 makes each card fill equal vertical space */}
              <div className="reviews-carousel-wrapper" style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {[
                  { initial:'T', name:'Thanuja Welagedara', text:'"Highly recommended for excellent food quality, taste, and service!"', href:'https://maps.app.goo.gl/L9bkZQkbxQrdRhZe9' },
                  { initial:'M', name:'madusanka bandara', text:'"Absolutely delicious street-style food and extremely fast service!"', href:'https://maps.app.goo.gl/CqrB5p4k61Tofjcq6' },
                ].map((review, idx) => (
                  <div
                    key={idx}
                    className="review-card"
                    style={{ background:'linear-gradient(160deg, #162447 0%, #0f1a35 100%)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'24px', padding:'28px 28px 24px', display:'flex', flexDirection:'column', gap:'14px', position:'relative', overflow:'hidden', transition:'transform 0.3s, border-color 0.3s, box-shadow 0.3s', cursor:'default', flex:1 }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform='translateY(-4px)'; el.style.borderColor='rgba(242,111,33,0.35)'; el.style.boxShadow='0 16px 40px rgba(0,0,0,0.35)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform='translateY(0)'; el.style.borderColor='rgba(255,255,255,0.08)'; el.style.boxShadow='none'; }}
                  >
                    {/* Quote mark — positioned below the stars at top-right to prevent overlapping */}
                    <span style={{ position:'absolute', right:'24px', top:'45px', fontFamily:'var(--font-heading)', fontSize:'7rem', fontWeight:900, color:'rgba(242,111,33,0.06)', lineHeight:1, pointerEvents:'none', userSelect:'none', zIndex:0 }}>"</span>

                    {/* Reviewer row */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ padding:'2.5px', background:'linear-gradient(135deg, #F26F21, #ff9e67)', borderRadius:'50%', flexShrink:0 }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#162447', color:'#FAF3E0', fontFamily:'var(--font-heading)', fontWeight:900, fontSize:'1.1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {review.initial}
                          </div>
                        </div>
                        <div>
                          <p style={{ fontFamily:'var(--font-heading)', fontWeight:800, fontSize:'0.95rem', color:'#FAF3E0', margin:0, lineHeight:1.2 }}>{review.name}</p>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'0.7rem', fontWeight:700, color:'#F26F21', background:'rgba(242,111,33,0.1)', padding:'3px 10px', borderRadius:'999px', marginTop:'5px' }}>
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#F26F21" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                            Verified Review
                          </span>
                        </div>
                      </div>
                      {/* Stars */}
                      <div style={{ display:'flex', gap:'3px', flexShrink:0 }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="14" height="14" viewBox="0 0 20 20" style={{ fill:'#FBBF24', filter:'drop-shadow(0 0 5px rgba(251,191,36,0.45))' }}>
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p style={{ fontSize:'0.93rem', color:'rgba(250,243,224,0.85)', lineHeight:1.65, fontStyle:'italic', margin:0, zIndex:1 }}>
                      {review.text}
                    </p>

                    {/* Footer link — marginTop:auto pushes it to the bottom */}
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'12px', marginTop:'auto', zIndex:1 }}>
                      <a
                        href={review.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontFamily:'var(--font-heading)', fontWeight:700, fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'rgba(250,243,224,0.4)', textDecoration:'none', transition:'color 0.2s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color='#F26F21'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color='rgba(250,243,224,0.4)'}
                      >
                        View on Google Maps
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"/>
                          <polyline points="7 7 17 7 17 17"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
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
                <TruckIcon />
              </div>
              <div>
                <p className="map-detail-label">Delivery Zones (Within 3km)</p>
                <p className="map-detail-value">
                  Mulleriyawa, Angoda, Kotikawatta, Kelanimulla, IDH &amp; surrounding areas.
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
          <div className="map-embed-wrapper fade-in fade-in-delay-2" style={{ padding: 0, margin: 0, overflow: 'hidden' }}>
            <iframe
              title="t-cloud eats location on Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d990.161254038916!2d79.92902197881799!3d6.932962699999993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae257fcc5fb0da5%3A0x254afb02a157e1c1!2st-cloud%20eats!5e0!3m2!1sen!2sus!4v1782627430513!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ width: '100%', height: '100%', minHeight: '250px', border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
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
              src="/Round Logo.png"
              alt="t-cloud eats logo"
              width={52}
              height={52}
            />
            <span className="footer-brand-name" style={{ color: "#F26F21" }}>t&#8209;cloud eats</span>
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
                className="footer-link-row"
              >
                <span className="footer-icon-container">
                  <PhoneIcon />
                </span>
                <span className="footer-text-container">
                  070 628 8109
                </span>
              </a>
              <a
                href="https://wa.me/94706288109"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp t-cloud eats"
                className="footer-link-row"
              >
                <span className="footer-icon-container">
                  <WhatsAppIcon />
                </span>
                <span className="footer-text-container">
                  Order on WhatsApp
                </span>
              </a>
              <a
                href="mailto:tcloudeats@gmail.com"
                aria-label="Email t-cloud eats"
                className="footer-link-row"
              >
                <span className="footer-icon-container">
                  <EmailIcon />
                </span>
                <span className="footer-text-container">
                  tcloudeats@gmail.com
                </span>
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
                className="footer-link-row"
              >
                <span className="footer-icon-container">
                  <MapIcon />
                </span>
                <span className="footer-text-container">
                  557/3/5 Godella Rd,<br />Mulleriyawa 10620
                </span>
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
