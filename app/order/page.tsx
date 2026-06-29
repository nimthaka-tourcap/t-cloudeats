"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.07-1.38A9.959 9.959 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.69 0-3.27-.5-4.6-1.36l-.33-.2-3.01.82.82-3.01-.2-.33C3.5 15.27 3 13.69 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9z" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

/* ── Menu Data ──────────────────────────────────────────────────── */
const ORDER_MENU = [
  // Fried Rice Selection
  { id: 1, title: "Egg Fried Rice", price: "Rs 750.00", category: "Fried Rice", description: "Basmati Rice, Egg, Carrot, Leek, Aromatic serve with Sunny Side Up, Onion Pickles, Homemade Chili paste", portion: "Full Portion" },
  { id: 2, title: "Classic Chicken Fried Rice", price: "Rs 1,000.00", category: "Fried Rice", description: "Basmati Rice, Fried Chicken Strip, Vegetable Sere with Sunny side up, Onion Pickles, Homemade Chili Paste", portion: "Full Portion" },
  { id: 3, title: "Prawns Fried Rice", price: "Rs 1,100.00", category: "Fried Rice", description: "Stir Fried Prawns, Basmati rice, Vegetable, serve with Sunny side up, Onion Pickle, Homemade Chili paste", portion: "Full Portion" },
  { id: 4, title: "Beef Fried Rice", price: "Rs 1,200.00", category: "Fried Rice", description: "Stir Fried Beef, Basmati rice, Vegetable, serve with Sunny side up, Onion Pickle, Homemade Chili paste", portion: "Full Portion" },
  { id: 5, title: "Seafood Fried Rice", price: "Rs 1,300.00", category: "Fried Rice", description: "Stir Fried Prawn, Fish, Cuttlefish, Beef, Basmati Rice, Vegetable, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 6, title: "Surf & Turf Fried Rice", price: "Rs 1,400.00", category: "Fried Rice", description: "Chicken, Beef, Pork, Fish, Prawns, And Cuttlefish, Vegetables, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 7, title: "Nasi Goreng", price: "Rs 1,300.00", category: "Fried Rice", description: "Tender Chicken, Prawns, Beef, Basmati Rice, Vegetable Served With Fried Egg And Served With Crispy Crackers", portion: "Full Portion" },

  // Chopsuey Selection
  { id: 8, title: "Chicken Chopsuey Rice", price: "Rs 1,250.00", category: "Chopsuey", description: "Aromatic Fried Rice And Colorful Stir-Fried Vegetables With Tender Chicken Finished In A Rich Savory Sauce", portion: "Full Portion" },
  { id: 9, title: "Prawn Chopsuey Rice", price: "Rs 1,350.00", category: "Chopsuey", description: "Succulent Prawns, Aromatic Fried Rice and Colorful Stir-Fried Vegetables Finished In A Rich Savory Sauce", portion: "Full Portion" },
  { id: 10, title: "Seafood Chopsuey Rice", price: "Rs 1,450.00", category: "Chopsuey", description: "Prawns, Cuttlefish & Fish, Fresh Vegetables, Savory Gravy And Served With Aromatic Rice.", portion: "Full Portion" },
  { id: 11, title: "Surf & Turf Chopsuey Rice", price: "Rs 1,600.00", category: "Chopsuey", description: "Wok-Fried Rice Served With Chicken, Beef, Pork, Fish, Prawns, And Cuttlefish In A Savory Chinese-Style Vegetable Gravy.", portion: "Full Portion" },

  // Noodles Selection
  { id: 12, title: "Egg Fried Noodles", price: "Rs 750.00", category: "Noodles", description: "Wok-Fried Noodles, Egg, Carrot, Leek, Aromatic Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 13, title: "Chicken Fried Noodles", price: "Rs 1,000.00", category: "Noodles", description: "Fried Chicken Strip, Noodles, Vegetable, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 14, title: "Prawn Fried Noodles", price: "Rs 1,100.00", category: "Noodles", description: "Stir Fried Prawns, Noodles, Vegetable, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 15, title: "Beef Fried Noodles", price: "Rs 1,200.00", category: "Noodles", description: "Stir Fried Beef, Noodles, Vegetable, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 16, title: "Seafood Fried Noodles", price: "Rs 1,300.00", category: "Noodles", description: "Stir Fried Prawns, Fish, Cuttlefish Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 17, title: "Surf & Turf Fried Noodles", price: "Rs 1,400.00", category: "Noodles", description: "Wok-Fried Noodles Chicken, Beef, Pork, Fish, Prawns & Cuttlefish Served With Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },

  // Kottu Selection
  { id: 18, title: "Egg Kottu", price: "Rs 750.00", category: "Kottu", description: "Roti, Egg, Carrot, Leek, Aromatic Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 19, title: "Chicken Kottu", price: "Rs 1,000.00", category: "Kottu", description: "Black Chicken Curry, Chopped Roti, Vegetables, Aromatic Spices, Serve with Sunny Side Up, Onion Pickle, Homemade Chili Paste", portion: "Full Portion" },
  { id: 20, title: "Beef Kottu", price: "Rs 1,200.00", category: "Kottu", description: "Spicy Beef Curry, Chopped Roti, Vegetables, Aromatic Spices, Serve with Sunny Side Up, Onion Pickle, Homemade Chili", portion: "Full Portion" },
  { id: 21, title: "Seafood Kottu", price: "Rs 1,300.00", category: "Kottu", description: "Chopped Roti, Prawns, Cuttlefish, Fish, Vegetables, Aromatic Spices, Serve With Sunny Side Up, Onion Pickle, Spicy Gravy", portion: "Full Portion" },
  { id: 22, title: "Surf & Turf Kottu", price: "Rs 1,400.00", category: "Kottu", description: "Kottu Loaded with Chicken, Beef, Pork, Fish, Prawns, Cuttlefish, Vegetables, with Sunny Side Up, Onion Pickle, Spicy Gravy", portion: "Full Portion" },
  { id: 23, title: "Fried Chicken Cheese Kottu", price: "Rs 1,500.00", category: "Kottu", description: "Street Food Favorite Fried Chicken, Cheese, Milk With Sunny Side Up, Onion Pickle, Spicy Gravy", portion: "Full Portion" },

  // Ultimate Bites
  { id: 24, title: "Sri Lankan Chicken Devilled", price: "Rs 1,000.00", category: "Ultimate Bites", description: "250g boneless chicken cooked in traditional spicy Sri Lankan devilled style.", portion: "250g" },
  { id: 25, title: "Sri Lankan Fish Devilled", price: "Rs 1,100.00", category: "Ultimate Bites", description: "250g of Kelawalla fish tossed with banana peppers, onions, and spicy sauce.", portion: "250g" },
  { id: 26, title: "Sri Lankan Prawn Devilled", price: "Rs 1,100.00", category: "Ultimate Bites", description: "250g of fresh prawns tossed with spices, peppers, and onions.", portion: "250g" },
  { id: 27, title: "Sri Lankan Beef Devilled", price: "Rs 1,400.00", category: "Ultimate Bites", description: "250g boneless beef stir-fried in a rich, spicy devilled gravy.", portion: "250g" },
  { id: 28, title: "Sri Lankan Pork Devilled", price: "Rs 1,300.00", category: "Ultimate Bites", description: "250g of boneless pork tossed with capsicum, onions, and chili.", portion: "250g" },
  { id: 29, title: "Garlic Buttered Vegetable", price: "Rs 900.00", category: "Ultimate Bites", description: "Fresh boiled vegetables tossed in aromatic garlic butter.", portion: "Regular" },
  { id: 30, title: "French Fries", price: "Rs 800.00", category: "Ultimate Bites", description: "Crispy golden potato fries served hot with seasoning.", portion: "Regular" },
  { id: 31, title: "Kochi Bite", price: "Rs 800.00", category: "Ultimate Bites", description: "10 pieces of crispy Kochi bites packed with flavor.", portion: "10 Pcs" },
  { id: 32, title: "Hot Butter Cuttlefish", price: "Rs 900.00", category: "Ultimate Bites", description: "Crispy-fried cuttlefish tossed in butter, spring onions, and dry chilies.", portion: "Regular" },

  // Beverages
  { id: 33, title: "Ice Milo", price: "Rs 250.00", category: "Beverages", description: "Creamy and refreshing iced Milo chocolate malt drink.", portion: "Regular" },
  { id: 34, title: "Milk Shake", price: "Rs 350.00", category: "Beverages", description: "Delicious milkshake. Choose your flavor: Strawberry, Vanilla, or Chocolate.", portion: "Regular" },
  { id: 35, title: "Ice Coffee", price: "Rs 250.00", category: "Beverages", description: "Chilled, sweet, and aromatic house-blend iced coffee.", portion: "Regular" },
  { id: 36, title: "Mineral Water", price: "Rs 100.00", category: "Beverages", description: "1 Liter bottle of clean, refreshing mineral water.", portion: "1 Liter" }
];

const CATEGORIES = ["All", "Fried Rice", "Chopsuey", "Noodles", "Kottu", "Ultimate Bites", "Beverages"];

export default function OrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = ORDER_MENU.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#070e1e] text-[#FAF3E0] font-sans pb-16">
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(13, 27, 53, 0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(242, 111, 33, 0.15)",
        padding: "16px 24px"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <Image
              src="/Classic Logo.png"
              alt="t-cloud eats logo"
              width={42}
              height={42}
            />
            <span style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 900,
              fontSize: "1.3rem",
              color: "#FAF3E0",
              letterSpacing: "-0.01em"
            }}>
              t&#8209;<span style={{ color: "#F26F21" }}>cloud</span>&nbsp;eats
            </span>
          </Link>
          <Link href="/" style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "rgba(250, 243, 224, 0.7)",
            textDecoration: "none",
            transition: "color 0.2s"
          }}>
            <HomeIcon />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: "linear-gradient(180deg, #0D1B35 0%, #070e1e 100%)",
        padding: "64px 24px",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 20px" }}>
          <span style={{
            display: "inline-block",
            fontSize: "0.72rem",
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#F26F21",
            background: "rgba(242, 111, 33, 0.1)",
            padding: "5px 16px",
            borderRadius: "999px",
            marginBottom: "18px"
          }}>
            Digital Menu
          </span>
          <h1 style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            color: "#FAF3E0",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 16px"
          }}>
            Place Your Order
          </h1>
          <p style={{
            fontSize: "1.05rem",
            color: "rgba(250, 243, 224, 0.65)",
            maxWidth: "520px",
            margin: "0 auto",
            lineHeight: 1.6
          }}>
            Browse our full selection of street-style favorites. Click any item to instantly order via WhatsApp.
          </p>
        </div>
      </section>

      {/* Main Content Container with max-width and horizontal padding to fix bleeding */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 20px"
      }}>
        
        {/* Search Bar - Separate horizontal row with vertical spacing */}
        <div className="menu-search-wrapper" style={{ marginBottom: "28px" }}>
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Search for your favorite dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="menu-search-input"
            />
            <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="menu-search-clear" aria-label="Clear search">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs - Separate horizontal row with vertical spacing */}
        <div className="category-tabs-container" style={{ marginBottom: "36px" }}>
          <div className="category-tabs" style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-tab ${selectedCategory === category ? "active" : ""}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length > 0 ? (
          <div className="menu-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className="menu-card" style={{ padding: "24px" }}>
                <div className="menu-card-header">
                  <h3 className="menu-card-title">{item.title}</h3>
                  <span className="menu-card-price">{item.price}</span>
                </div>
                <div className="menu-card-meta">
                  <span className="menu-card-portion">{item.portion}</span>
                  <div className="menu-card-tags">
                    <span className="menu-tag popular">{item.category}</span>
                  </div>
                </div>
                <p className="menu-card-desc">{item.description}</p>
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
            ))}
          </div>
        ) : (
          <div className="menu-no-results">
            <p>No dishes found matching "{searchQuery}"</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="menu-reset-btn"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
