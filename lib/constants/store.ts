export const STORE_CONFIG = {
  name: "t-cloud eats",
  tagline: "eat. enjoy. repeat.",
  phone: "070 628 8109",
  whatsappPhone: "94706288109",
  whatsappFormattedPhone: "+94 70 628 8109",
  address: "No. 450, Mulleriyawa New Town, Mulleriyawa, Sri Lanka",
  deliveryRadiusKm: 3,
  deliveryZones: ["Mulleriyawa", "Angoda", "Kotikawatta", "IDH"],
  googleReviewsRating: "5.0",
  uberEatsUrl: "https://www.ubereats.com/store/t-cloud-eats-mulleriyawa/xPLzS9QwXiKq9YB07U5yEQ",
  currency: "Rs",
  currencyCode: "LKR",
  acceptedPayments: ["Cash on Delivery", "HelaPOS Card Payment", "PickMe Pay"],
  // Bank Transfer Payment Slip & Invoice Upload Configuration
  paymentSlips: {
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB limit
    maxSizeDisplay: "10 MB",
    allowedFormats: [
      { ext: ".pdf", mime: "application/pdf", label: "PDF Document (E-Banking Statement / Receipt)" },
      { ext: ".png", mime: "image/png", label: "PNG (Mobile Banking App Screenshot)" },
      { ext: ".jpg, .jpeg", mime: "image/jpeg", label: "JPG / JPEG (ATM Slip or Camera Photo)" },
      { ext: ".webp", mime: "image/webp", label: "WEBP (Optimized Web Image)" },
      { ext: ".heic, .heif", mime: "image/heic, image/heif", label: "HEIC / HEIF (Apple iPhone Photo)" },
    ],
    acceptString: "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.pdf,.heic,.heif",
  },
  openingHours: {
    openHour: 11,
    closeHour: 24,
    display: "11:00 AM – 12:00 AM Daily",
    formattedOpen: "11:00 AM",
    formattedClose: "12:00 AM (Midnight)",
  },
};
