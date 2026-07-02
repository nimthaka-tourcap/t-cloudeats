"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { RotateCw, AlertTriangle, Printer, Phone, Globe, Mail, Heart } from "lucide-react";
import Image from "next/image";

interface OrderItem {
  quantity: number;
  menuItem: {
    title: string;
    price: number;
  };
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
        } else {
          setOrder({
            ...data,
            items: typeof data.items === "string" ? JSON.parse(data.items) : data.items,
            customer: typeof data.customer === "string" ? JSON.parse(data.customer) : data.customer,
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
        <a href="https://t-cloudeats.com" className="text-[10px] uppercase font-bold text-[#FF6B35] tracking-widest hover:underline mt-2">
          Back to T-Cloud Eats
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1C] py-8 px-4 flex flex-col items-center justify-start relative select-none">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#FF6B35]/5 blur-[120px] pointer-events-none" />

      {/* Action Buttons */}
      <div className="no-print w-full max-w-[400px] flex justify-between gap-3 mb-6 z-10">
        <a 
          href="https://t-cloudeats.com"
          className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center transition-colors"
        >
          Close View
        </a>
        <button
          onClick={handlePrint}
          className="flex-1 bg-[#FF6B35] hover:bg-[#E0531F] text-white px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          <Printer size={13} />
          Save as PDF
        </button>
      </div>

      {/* Bill Print Card Container */}
      <div className="print-area w-full max-w-[400px] bg-white text-black p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-100 flex flex-col z-10">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-dashed border-slate-200">
          <div className="relative w-20 h-20 mb-2 rounded-full overflow-hidden border border-slate-100 bg-white">
            <Image 
              src="/Round Logo.png"
              alt="T-Cloud Eats Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-base font-black tracking-widest uppercase">T-Cloud Eats</h1>
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
            <span className="font-bold text-[#FF6B35] uppercase">{order.type}</span>
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
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                <div className="flex-1">
                  <p className="font-bold text-slate-900 leading-tight">{item.menuItem.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {item.quantity} x LKR {item.menuItem.price.toLocaleString()}
                  </p>
                </div>
                <span className="font-mono font-bold text-slate-950 whitespace-nowrap">
                  LKR {(item.menuItem.price * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="py-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-500">Subtotal:</span>
            <span className="font-mono font-bold text-slate-800">LKR {order.subtotal.toLocaleString()}</span>
          </div>
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
        <div className="mt-4 pt-4 border-t border-dashed border-slate-200 text-center space-y-2">
          <div className="flex justify-center text-red-500">
            <Heart size={16} fill="currentColor" />
          </div>
          <p className="text-[10px] font-bold text-slate-800 leading-relaxed max-w-[280px] mx-auto">
            Thank you for ordering with T-Cloud Eats! We love preparing your delicious meals. Hope to serve you again soon!
          </p>
        </div>

        {/* Kitchen Contact & Web Link */}
        <div className="mt-4 bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5 text-[9px] text-slate-500 text-center">
          <div className="flex items-center justify-center gap-1.5 font-medium">
            <Phone size={10} className="text-[#FF6B35]" />
            <span>+94 77 123 4567 / +94 11 234 5678</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-medium">
            <Mail size={10} className="text-[#FF6B35]" />
            <span>kitchen@t-cloudeats.com</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 font-bold pt-1 border-t border-slate-200 text-[#FF6B35] hover:underline">
            <Globe size={10} />
            <a href="https://t-cloudeats.com" target="_blank" rel="noopener noreferrer">https://t-cloudeats.com</a>
          </div>
        </div>

      </div>

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
