"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RotateCw, AlertTriangle, Printer, Phone, Globe, Mail, Heart, Check, Upload, MapPin, Star, X, CreditCard, Landmark, DollarSign, Copy, FileText, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface OrderItem {
  quantity: number;
  menuItem: {
    title: string;
    price: number;
  };
  comment?: string;
  addonPrice?: number;
}

interface Order {
  id: string;
  timestamp: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  type: string;
  customer?: {
    name: string;
    phone: string;
    address: string;
    payment_method?: string;
    payment_receipt?: string;
    payment_receipt_filename?: string;
    rating?: number;
    review?: string;
    rated_at?: string;
    discount_type?: "percentage" | "fixed";
    discount_value?: number;
    discount_amount?: number;
  };
}

function getBillHash(invoiceId: string): string {
  let hash = 0;
  for (let i = 0; i < invoiceId.length; i++) {
    hash = (hash << 5) - hash + invoiceId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash % 4096).toString(16).padStart(3, "0");
}

export default function BillPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Interactive Panel States
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [copiedName, setCopiedName] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = async (text: string, label: string, removeSpaces = false) => {
    try {
      const cleanText = removeSpaces ? text.replace(/\s+/g, "") : text;
      await navigator.clipboard.writeText(cleanText);
      showToast(`${label} copied to clipboard!`, "success");
      if (label === "Account Name") {
        setCopiedName(true);
        setTimeout(() => setCopiedName(false), 2000);
      } else if (label === "Account Number") {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      }
    } catch (err) {
      showToast("Failed to copy.", "error");
    }
  };

  const updateOrderInDb = async (updatedCustomer: any) => {
    const originalCustomer = order?.customer;
    // Optimistically update the state immediately for zero-latency visual updates
    setOrder(prev => prev ? { ...prev, customer: updatedCustomer } : null);

    try {
      const { error } = await supabase
        .from("orders")
        .update({ customer: updatedCustomer })
        .eq("id", order?.id);

      if (error) {
        console.error("Error updating order:", error);
        showToast("Failed to update payment information.", "error");
        // Revert on failure
        setOrder(prev => prev ? { ...prev, customer: originalCustomer } : null);
      }
    } catch (err) {
      console.error("Failed to sync payment info:", err);
      showToast("Failed to connect to database.", "error");
      // Revert on failure
      setOrder(prev => prev ? { ...prev, customer: originalCustomer } : null);
    }
  };

  const handlePaymentMethodChange = async (method: string) => {
    if (!order) return;
    const updatedCustomer = {
      ...order.customer,
      payment_method: method
    };
    if (method !== "Bank transfer") {
      delete updatedCustomer.payment_receipt;
      delete updatedCustomer.payment_receipt_filename;
    }
    showToast(`Payment method updated to ${method}`, "success");
    await updateOrderInDb(updatedCustomer);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size too large. Maximum size is 5MB.", "error");
      return;
    }

    setIsUploadingReceipt(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      const updatedCustomer = {
        ...order.customer,
        payment_method: "Bank transfer",
        payment_receipt: base64String,
        payment_receipt_filename: file.name
      };
      
      showToast("Uploading receipt...", "info");
      await updateOrderInDb(updatedCustomer);
      showToast("Receipt uploaded successfully!", "success");
      setIsUploadingReceipt(false);
    };
    reader.onerror = () => {
      showToast("Failed to read receipt file.", "error");
      setIsUploadingReceipt(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = async () => {
    if (!order) return;
    const updatedCustomer = {
      ...order.customer
    };
    delete updatedCustomer.payment_receipt;
    delete updatedCustomer.payment_receipt_filename;

    showToast("Removing receipt...", "info");
    await updateOrderInDb(updatedCustomer);
    showToast("Receipt removed.", "success");
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      showToast("Please select at least 1 star to rate us.", "error");
      return;
    }
    if (!order) return;
    setSubmittingRating(true);
    const updatedCustomer = {
      ...order.customer,
      rating,
      review: reviewComment,
      rated_at: new Date().toISOString()
    };
    
    await updateOrderInDb(updatedCustomer);
    setSubmittingRating(false);
    setRatingSubmitted(true);
    showToast("Thank you for your rating & review!", "success");
    setTimeout(() => {
      setShowRatingModal(false);
      setRatingSubmitted(false);
    }, 2000);
  };

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;

      if (id.length < 4) {
        setErrorMsg("Invalid invoice link structure");
        setLoading(false);
        return;
      }

      const hashPart = id.slice(-3);
      const invoiceId = id.slice(0, -3);
      const expectedHash = getBillHash(invoiceId);

      if (hashPart !== expectedHash) {
        setErrorMsg("Security check failed. This invoice link is invalid.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", invoiceId)
          .single();

        if (error || !data) {
          setErrorMsg("Order not found in our database");
        } else if (data.status === "Ignored") {
          setErrorMsg("This order has been ignored. Invoice is not generated.");
        } else {
          const parsedCustomer = typeof data.customer === "string" ? JSON.parse(data.customer) : data.customer;
          let latestCustomer = parsedCustomer;
          
          if (parsedCustomer && parsedCustomer.phone) {
            try {
              const { data: customerDb } = await supabase
                .from("customers")
                .select("*")
                .eq("phone", parsedCustomer.phone)
                .maybeSingle();
              
              if (customerDb) {
                latestCustomer = {
                  ...parsedCustomer,
                  name: customerDb.name || parsedCustomer.name,
                  address: customerDb.address || parsedCustomer.address,
                  address_label: customerDb.address_label || parsedCustomer.address_label
                };
              }
            } catch (err) {
              console.error("Failed to fetch latest customer details for bill:", err);
            }
          }

          setOrder({
            ...data,
            items: typeof data.items === "string" ? JSON.parse(data.items) : data.items,
            customer: latestCustomer,
            subtotal: Number(data.subtotal),
            tax: Number(data.tax),
            total: Number(data.total)
          });
        }
      } catch (e) {
        setErrorMsg("Failed to query the cloud database");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [id]);

  // Poll order status every second for live tracking
  useEffect(() => {
    if (!id || !order) return;

    const interval = setInterval(async () => {
      try {
        const hashPart = id.slice(-3);
        const invoiceId = id.slice(0, -3);
        
        const { data, error } = await supabase
          .from("orders")
          .select("status, customer")
          .eq("id", invoiceId)
          .single();

        if (data && !error) {
          setOrder(prev => {
            if (!prev) return null;
            if (prev.status !== data.status || JSON.stringify(prev.customer) !== JSON.stringify(data.customer)) {
              const parsedCustomer = typeof data.customer === "string" ? JSON.parse(data.customer) : data.customer;
              return {
                ...prev,
                status: data.status,
                customer: parsedCustomer
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error polling order status:", err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [id, order?.id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#060B18] text-white flex flex-col items-center justify-center gap-4">
        <RotateCw className="animate-spin text-[#FF6B35]" size={36} />
        <p className="text-xs uppercase tracking-widest text-slate-400">Loading your E-Bill...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="min-h-screen w-screen bg-[#060B18] text-white flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertTriangle className="text-red-400" size={28} />
        </div>
        <h2 className="font-black tracking-wider uppercase text-slate-200">Access Denied</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{errorMsg || "Invalid E-Bill reference"}</p>
        <a href="https://t-cloudeats.com" className="text-[10px] font-bold text-[#FF6B35] tracking-widest hover:underline mt-2">
          Back to t-cloud eats
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1C] py-8 px-4 flex flex-col items-center justify-start relative select-none">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#FF6B35]/5 blur-[120px] pointer-events-none" />
      {/* Back Button */}
      <div className="no-print w-full max-w-[400px] flex justify-start mb-3.5 z-10">
        <button
          onClick={() => {
            const isCashier = localStorage.getItem("t-cloud-eats-user") === "cashier@t-cloudeats.com";
            window.location.href = isCashier ? "/cashier" : "/";
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-slate-500/20 text-slate-300 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          <ArrowLeft size={10} className="text-[#FF6B35]" />
          <span>Back</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="no-print w-full max-w-[400px] flex justify-between gap-1.5 mb-6 z-10">
        <button 
          onClick={() => {
            setShowPaymentSection(true);
            setTimeout(() => {
              const paySection = document.getElementById("payment-section");
              paySection?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
          className={`flex-1 px-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
            showPaymentSection 
              ? "bg-[#FF6B35] text-white shadow-lg shadow-orange-500/10 border border-[#FF6B35]" 
              : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-slate-500/20 text-slate-300"
          }`}
        >
          <CreditCard size={12} className={showPaymentSection ? "text-white" : "text-[#FF6B35]"} />
          <span>Make payment</span>
        </button>
        {!(order.type === "POS" || order.type === "Take Away") && (
          <button
            onClick={() => setShowTrackingModal(true)}
            className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-slate-500/20 text-slate-300 px-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <MapPin size={12} className="text-[#FF6B35]" />
            <span>Track order</span>
          </button>
        )}
        <button
          onClick={() => window.open("https://g.page/r/CcHhV6EC-0olEAI/review", "_blank")}
          className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-slate-500/20 text-slate-300 px-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Star size={12} className="text-amber-400" />
          <span>Rate us</span>
        </button>
        <button
          onClick={handlePrint}
          className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-slate-500/20 text-slate-300 px-2 py-3 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <Printer size={12} className="text-emerald-400" />
          <span>Receipt</span>
        </button>
      </div>

      {/* Interactive Customer Panel */}
      {showPaymentSection && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div id="payment-section" className="relative w-full max-w-[400px] bg-[#0E1628]/95 border border-[#1E2D4E] p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-5 text-white max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <button 
              onClick={() => setShowPaymentSection(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none outline-none"
              aria-label="Close payment options"
            >
              <X size={18} />
            </button>
            
            {/* Title */}
            <div className="border-b border-[#1E2D4E] pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">Payment &amp; Order Options</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Please finalize your payment and actions below.</p>
            </div>

            {/* Payment Selection */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider">Select Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Cash on delivery (COD)", label: "COD", desc: "Cash on Delivery", icon: DollarSign },
                  { id: "Bank transfer", label: "Bank", desc: "Bank Transfer", icon: Landmark }
                ].map((method) => {
                  const Icon = method.icon;
                  const isSelected = order.customer?.payment_method === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handlePaymentMethodChange(method.id)}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer w-full gap-2 ${
                        isSelected 
                          ? "border-[#FF6B35] bg-[#FF6B35]/10 shadow-[0_0_15px_rgba(255,107,53,0.15)]" 
                          : "border-[#1E2D4E] bg-white/5 hover:border-slate-500/30 hover:bg-white/10"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-[#FF6B35] text-white" : "bg-white/5 text-slate-400"}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? "text-white" : "text-slate-200"}`}>{method.label}</p>
                        <p className="text-[8px] text-slate-400 mt-0.5 leading-tight">{method.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[#FF6B35] flex items-center justify-center text-white shrink-0">
                          <Check size={8} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bank Transfer Details & Receipt Upload */}
            {order.customer?.payment_method === "Bank transfer" && (
              <div className="border border-[#1E2D4E] bg-white/[0.02] p-4 rounded-xl space-y-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-[#FF6B35] tracking-wider">NDB Bank Details</p>
                  <div className="bg-[#090D1A] border border-[#1E2D4E] p-3 rounded-lg text-xs space-y-1.5 font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-bold text-white text-right">National Development Bank (NDB)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branch Name:</span>
                      <span className="font-bold text-white text-right">Nawam Mawatha</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Account Name:</span>
                      <span className="font-bold text-white text-right flex items-center gap-1">
                        <button 
                          onClick={() => copyToClipboard("W M T I Thilakarathna", "Account Name")}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer flex items-center"
                          title="Copy Account Name"
                        >
                          {copiedName ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <span>W M T I Thilakarathna</span>
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Account No:</span>
                      <span className="font-bold text-[#FF6B35] text-right text-sm flex items-center gap-1">
                        <button 
                          onClick={() => copyToClipboard("1060 0229 3137", "Account Number", true)}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-[#FF6B35] transition-colors border-none bg-transparent cursor-pointer flex items-center"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                        <span>1060 0229 3137</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Branch Code:</span>
                      <span className="font-bold text-white text-right">1</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Upload Button */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Upload Transfer Invoice / Slip</p>
                  
                  <label className="flex items-center justify-center gap-2 w-full bg-[#FF6B35]/10 border border-dashed border-[#FF6B35]/30 hover:border-[#FF6B35] hover:bg-[#FF6B35]/15 py-3 px-4 rounded-xl text-xs font-bold text-slate-200 cursor-pointer transition-all duration-200">
                    <Upload size={14} className="text-[#FF6B35]" />
                    <span>Upload Invoice Slip</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf,.heic,.heif" 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>

                  {/* Upload Status / Preview */}
                  {isUploadingReceipt ? (
                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl mt-2">
                      <RotateCw className="animate-spin text-[#FF6B35]" size={16} />
                      <span className="text-[10px] text-slate-400">Uploading receipt invoice slip...</span>
                    </div>
                  ) : order.customer?.payment_receipt ? (
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl mt-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                        <Check size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-emerald-400">Invoice uploaded successfully</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">
                          {order.customer?.payment_receipt_filename || "Receipt invoice file"}
                        </p>
                      </div>
                      {/* Preview / Download Box */}
                      <div className="relative w-10 h-10 rounded border border-white/10 overflow-hidden shrink-0 flex items-center justify-center bg-white/5">
                        {order.customer.payment_receipt.startsWith("data:image/") && !order.customer.payment_receipt.includes("image/heic") && !order.customer.payment_receipt.includes("image/heif") ? (
                          <img 
                            src={order.customer.payment_receipt} 
                            alt="Receipt preview" 
                            className="object-cover w-full h-full cursor-zoom-in"
                            onClick={() => {
                              const w = window.open();
                              w?.document.write(`<img src="${order.customer?.payment_receipt}" style="max-width: 100%; height: auto;" />`);
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const w = window.open();
                              if (order.customer?.payment_receipt?.startsWith("data:application/pdf")) {
                                w?.document.write(`<embed src="${order.customer?.payment_receipt || ''}" type="application/pdf" width="100%" height="100%" />`);
                              } else {
                                w?.document.write(`
                                  <html>
                                    <body style="margin: 0; background: #060B18; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; color: white; font-family: sans-serif;">
                                      <p style="font-size: 14px; font-weight: bold; margin-bottom: 20px;">Download/View File: ${order.customer?.payment_receipt_filename || 'Receipt'}</p>
                                      <a href="${order.customer?.payment_receipt || ''}" download="${order.customer?.payment_receipt_filename || 'receipt'}" style="padding: 10px 20px; background: #FF6B35; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Download Attachment</a>
                                    </body>
                                  </html>
                                `);
                              }
                            }}
                            className="w-full h-full flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                          >
                            <FileText size={16} />
                          </button>
                        )}
                      </div>
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={handleRemoveReceipt}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors border-none bg-transparent cursor-pointer shrink-0"
                        title="Remove Receipt"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Bill Print Card Container */}
      <div className="print-area w-full max-w-[400px] bg-white text-black p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 flex flex-col z-10">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-dashed border-slate-200">
          <div className="relative w-20 h-20 mb-2 rounded-full overflow-hidden border border-slate-100 bg-white">
            <Image 
              src="/Round Logo.png"
              alt="t-cloud eats logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-base font-black tracking-widest">t-cloud eats</h1>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">Premium Cloud Kitchen POS Terminal</p>
        </div>

        {/* Invoice Info */}
        <div className="py-4 border-b border-dashed border-slate-200 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Invoice No:</span>
            <span className="font-bold text-slate-900">{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Date &amp; Time:</span>
            <span className="font-mono text-slate-700">
              {new Date(order.timestamp).toLocaleString("en-US", {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Order Type:</span>
            <span className="font-bold text-[#FF6B35] uppercase">
              {order.type === "POS" ? "POS Order" : order.type === "Direct" ? "Direct Order (Website)" : order.type === "3rd Party" ? "3rd Party (Uber & PickMe)" : order.type}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-500">Order Status:</span>
            <span className="flex items-center gap-1.5 font-bold uppercase text-emerald-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{order.status}</span>
            </span>
          </div>
        </div>

        {/* Customer Info */}
        {order.customer && (
          <div className="py-4 border-b border-dashed border-slate-200 space-y-1 text-xs">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Customer Profile</p>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-900">{order.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Phone Code:</span>
              <span className="font-mono text-slate-700">{order.customer.phone}</span>
            </div>
            {order.customer.address && (
              <div className="flex flex-col mt-1">
                <span className="font-semibold text-slate-500 mb-0.5">Delivery Address:</span>
                <span className="font-medium text-slate-700 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">{order.customer.address}</span>
              </div>
            )}
          </div>
        )}

        {/* Purchase Items List */}
        <div className="py-4 border-b border-dashed border-slate-200 space-y-2.5">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Bought Items List</p>
          <div className="space-y-2">
            {order.items.map((item, idx) => {
              const itemTitle = item.menuItem ? item.menuItem.title : (item as any).title;
              const basePrice = item.menuItem ? item.menuItem.price : (item as any).price || 0;
              const addonPrice = item.addonPrice || 0;
              const finalItemPrice = basePrice + addonPrice;
              return (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-tight">{itemTitle}</p>
                      {item.comment && (
                        <p className="text-[10px] text-amber-600 italic mt-0.5">💬 {item.comment}</p>
                      )}
                      {addonPrice !== 0 && (
                        <p className="text-[9px] text-amber-600 font-bold mt-0.5">
                          {addonPrice > 0 ? "+ " : "- "}Addon Price: LKR {Math.abs(addonPrice).toLocaleString()}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {item.quantity} x LKR {finalItemPrice.toLocaleString()}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-slate-950 whitespace-nowrap">
                      LKR {(finalItemPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Totals */}
        <div className="py-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Subtotal:</span>
            <span className="font-mono font-bold text-slate-800">LKR {order.subtotal.toLocaleString()}</span>
          </div>
          {order.customer?.discount_amount ? (
            <div className="flex justify-between text-red-600 font-medium">
              <span>
                Discount ({order.customer.discount_type === "percentage" ? `${order.customer.discount_value}%` : "LKR"}):
              </span>
              <span className="font-mono">- LKR {order.customer.discount_amount.toLocaleString()}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Taxes &amp; Service Charges:</span>
            <span className="font-mono font-medium text-slate-500">LKR 0</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
            <span className="font-black text-sm uppercase">Total Amount:</span>
            <span className="font-mono text-base font-black text-[#FF6B35]">
              LKR {order.total.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Thank You Note */}
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center space-y-2 flex flex-col items-center">
          <div className="text-red-500">
            <Heart size={16} fill="currentColor" />
          </div>
          <p className="text-[10px] font-bold text-slate-800 leading-relaxed max-w-[280px] mx-auto">
            Thank you for ordering with t-cloud eats! We love preparing your delicious meals. Hope to serve you again soon!
          </p>
        </div>

        {/* Real Contact & Location Details */}
        <div className="mt-4 bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2.5 text-[9px] text-slate-500 text-center">
          {/* Address */}
          <div className="space-y-0.5">
            <p className="font-extrabold text-slate-700 tracking-wider">t-cloud eats</p>
            <p className="font-medium text-slate-500">557/3/5 Godella Rd,</p>
            <p className="font-medium text-slate-500">Mulleriyawa 10620, Sri Lanka</p>
          </div>

          {/* Delivery Zones */}
          <div className="pt-1.5 border-t border-slate-200/60">
            <p className="font-extrabold text-[8px] text-[#FF6B35] uppercase tracking-widest mb-0.5">Delivery Zones (Within 3km)</p>
            <p className="font-medium text-slate-500 leading-normal">Mulleriyawa, Angoda, Kotikawatta, Kelanimulla, IDH &amp; surrounding areas.</p>
          </div>

          {/* Contact Details */}
          <div className="pt-1.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-black text-[7px] text-slate-400 uppercase tracking-wider">Phone</span>
              <a href="tel:0706288109" className="flex items-center gap-1 font-bold text-slate-700 justify-center hover:text-[#FF6B35] hover:underline transition-all">
                <Phone size={8} className="text-[#FF6B35]" />
                <span>070 628 8109</span>
              </a>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="font-black text-[7px] text-slate-400 uppercase tracking-wider">WhatsApp Order</span>
              <a href="https://wa.me/94706288109" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-bold text-slate-700 justify-center hover:text-[#FF6B35] hover:underline transition-all">
                <Globe size={8} className="text-[#FF6B35]" />
                <span>+94 70 628 8109</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-[#0E1628] border border-[#1E2D4E] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-6 relative text-left text-white">
            <button 
              onClick={() => setShowTrackingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-1 pb-2 border-b border-[#1E2D4E]">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Live Order Status</h3>
              <p className="text-[9px] text-slate-400">Real-time sync with our POS terminal</p>
            </div>

            {/* Stepper Container */}
            <div className="space-y-5 relative pl-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#1E2D4E]">
              {[
                { 
                  title: "Preparing", 
                  desc: "Our kitchen is cooking your delicious meal", 
                  statusKeys: ["Accepted", "Preparing", "Pending"],
                  stepNumber: 1
                },
                { 
                  title: "Ready", 
                  desc: "Your meal is packed & waiting for pickup", 
                  statusKeys: ["Ready"],
                  stepNumber: 2
                },
                { 
                  title: "Dispatched", 
                  desc: "Out for delivery with our rider", 
                  statusKeys: ["Dispatched"],
                  stepNumber: 3
                },
                { 
                  title: "Delivered", 
                  desc: "Enjoy your fresh meal!", 
                  statusKeys: ["Completed"],
                  stepNumber: 4
                }
              ].map((step, idx) => {
                const currentStatus = order.status;
                const statusOrder = ["Pending", "Accepted", "Preparing", "Ready", "Dispatched", "Completed"];
                
                let isCompleted = false;
                let isActive = false;

                const currentIdxInWorkflow = statusOrder.indexOf(currentStatus);
                
                if (step.title === "Preparing") {
                  isCompleted = currentIdxInWorkflow > statusOrder.indexOf("Preparing");
                  isActive = currentStatus === "Preparing" || currentStatus === "Accepted" || currentStatus === "Pending";
                } else if (step.title === "Ready") {
                  isCompleted = currentIdxInWorkflow > statusOrder.indexOf("Ready");
                  isActive = currentStatus === "Ready";
                } else if (step.title === "Dispatched") {
                  isCompleted = currentIdxInWorkflow > statusOrder.indexOf("Dispatched");
                  isActive = currentStatus === "Dispatched";
                } else if (step.title === "Delivered") {
                  isCompleted = currentStatus === "Completed";
                  isActive = currentStatus === "Completed";
                }

                return (
                  <div key={idx} className="relative flex flex-col items-start gap-0.5">
                    {/* Circle Node */}
                    <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-black transition-all duration-300 z-10 ${
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                        : isActive 
                          ? "bg-[#FF6B35] border-[#FF6B35] text-white shadow-[0_0_10px_rgba(255,107,53,0.3)]" 
                          : "bg-[#0E1628] border-[#1E2D4E] text-slate-500"
                    }`}>
                      {isCompleted ? <Check size={11} strokeWidth={4} /> : step.stepNumber}
                    </div>

                    {/* Step Info */}
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-wider ${
                        isActive 
                          ? "text-[#FF6B35] animate-pulse" 
                          : isCompleted 
                            ? "text-emerald-400" 
                            : "text-slate-400"
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-[8.5px] text-slate-400 mt-0.5 leading-normal">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowTrackingModal(false)}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 no-print animate-in fade-in duration-200">
          <div className="bg-[#0E1628] border border-[#1E2D4E] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5 relative text-left text-white">
            <button 
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Rate Your Order</h3>
              <p className="text-[10px] text-slate-400">Let us know how we did. We value your feedback!</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2.5 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(star)}
                  className="text-slate-400 hover:scale-110 active:scale-95 transition-all cursor-pointer bg-transparent border-none outline-none"
                >
                  <Star 
                    size={28} 
                    fill={star <= (hoverRating || rating) ? "#FF6B35" : "none"}
                    stroke={star <= (hoverRating || rating) ? "#FF6B35" : "currentColor"}
                    className={star <= (hoverRating || rating) ? "drop-shadow-[0_0_8px_rgba(255,107,53,0.5)]" : ""}
                  />
                </button>
              ))}
            </div>

            {/* Feedback Comment */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Write a Review (Optional)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Delicious Kottu! Highly recommended..."
                className="w-full bg-[#090D1A] border border-[#1E2D4E] rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#FF6B35]/60 min-h-[80px] resize-none"
              />
            </div>

            <button
              onClick={handleRatingSubmit}
              disabled={submittingRating || ratingSubmitted}
              className="w-full bg-[#FF6B35] hover:bg-[#E0531F] disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingRating ? (
                <>
                  <RotateCw className="animate-spin" size={12} />
                  <span>Submitting...</span>
                </>
              ) : ratingSubmitted ? (
                <>
                  <Check size={12} strokeWidth={3} />
                  <span>Submitted!</span>
                </>
              ) : (
                <span>Submit Rating</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 no-print animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold shadow-2xl text-white ${
            toast.type === "success" 
              ? "bg-[#0E1628] border-emerald-500/30 text-emerald-400" 
              : toast.type === "error" 
                ? "bg-[#0E1628] border-red-500/30 text-[#FF6B35]"
                : "bg-[#0E1628] border-blue-500/30 text-blue-400"
          }`}>
            {toast.type === "success" && <Check size={14} className="text-emerald-400" />}
            {toast.type === "error" && <AlertTriangle size={14} className="text-red-400" />}
            {toast.type === "info" && <RotateCw size={14} className="text-blue-400 animate-spin" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}
