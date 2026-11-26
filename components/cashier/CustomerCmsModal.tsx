"use client";

import React from "react";
import { X, Trash2, ArrowLeft } from "lucide-react";
import { CashierOrder } from "@/lib/cashier/types";
import { formatLKR2 } from "@/lib/utils/currency";

interface CustomerCmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: { phone: string; name: string; address: string; birthday?: string | null; address_label?: string | null }[];
  orderHistory: CashierOrder[];
  cmsSearchQuery: string;
  setCmsSearchQuery: (q: string) => void;
  editingCustomer: {
    phone: string;
    name: string;
    address: string;
    birthday?: string | null;
    originalPhone?: string;
  } | null;
  setEditingCustomer: React.Dispatch<
    React.SetStateAction<{
      phone: string;
      name: string;
      address: string;
      birthday?: string | null;
      originalPhone?: string;
    } | null>
  >;
  onSaveCustomerEdit: (e: React.FormEvent) => void;
  onDeleteCustomer: (phone: string) => void;
}

export default function CustomerCmsModal({
  isOpen,
  onClose,
  customers,
  orderHistory,
  cmsSearchQuery,
  setCmsSearchQuery,
  editingCustomer,
  setEditingCustomer,
  onSaveCustomerEdit,
  onDeleteCustomer,
}: CustomerCmsModalProps) {
  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(cmsSearchQuery.toLowerCase()) ||
      c.phone.includes(cmsSearchQuery) ||
      (c.address || "").toLowerCase().includes(cmsSearchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl h-[82vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {editingCustomer ? "Edit Customer Profile" : `Customer Directory (${customers.length})`}
            </h3>
            <p className="text-xs text-slate-500">
              {editingCustomer
                ? "Update contact details, birthday, or merge by phone"
                : "Manage profiles, credit balances, and order history"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              onClose();
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {!editingCustomer ? (
          <div className="flex-1 flex flex-col overflow-hidden p-6 gap-4">
            <input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={cmsSearchQuery}
              onChange={(e) => setCmsSearchQuery(e.target.value)}
              className="min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
            />

            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-xl bg-slate-50">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-500">
                  No customers match your search.
                </div>
              ) : (
                filtered.map((c) => {
                  const cleanPhone = c.phone.replace(/\D/g, "");
                  const custOrders = orderHistory.filter((o) => {
                    if (o.status === "Voided" || o.status === "Ignored" || !o.customer)
                      return false;
                    const oPhone = (o.customer.phone || "").replace(/\D/g, "");
                    return oPhone === cleanPhone || o.customer.phone === c.phone;
                  });
                  const unpaid = custOrders.filter(
                    (o) =>
                      o.payment_status === "Not Paid" ||
                      o.customer?.payment_status === "Not Paid"
                  );
                  const totalDue = unpaid.reduce((s, o) => s + o.total, 0);

                  return (
                    <div
                      key={c.phone}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <span className="text-xs font-mono text-sky-600">{c.phone}</span>
                          {c.birthday && (
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              🎂{" "}
                              {new Date(c.birthday).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {c.address || "No address saved"} • {custOrders.length} orders
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums font-medium ${
                            totalDue > 0
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          }`}
                        >
                          {totalDue > 0 ? `Due: ${formatLKR2(totalDue)}` : "Settled"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingCustomer({ ...c, originalPhone: c.phone })
                          }
                          className="min-h-[40px] px-3.5 rounded-xl bg-white border border-slate-200 hover:border-white/20 text-xs font-medium text-slate-900 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteCustomer(c.phone)}
                          className="min-h-[40px] px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-slate-900 cursor-pointer transition"
                          title="Delete Customer (PIN Required)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={onSaveCustomerEdit} className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-500">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.name}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-500">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.phone}
                  onChange={(e) =>
                    setEditingCustomer((prev) =>
                      prev ? { ...prev, phone: e.target.value } : null
                    )
                  }
                  className="min-h-[44px] w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 font-mono outline-none focus:border-[#F26F21]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500">Delivery Address</label>
              <textarea
                rows={3}
                value={editingCustomer.address}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, address: e.target.value } : null
                  )
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 outline-none focus:border-[#F26F21]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-slate-500">Birthday</label>
              <input
                type="date"
                value={editingCustomer.birthday ? editingCustomer.birthday.slice(0, 10) : ""}
                onChange={(e) =>
                  setEditingCustomer((prev) =>
                    prev ? { ...prev, birthday: e.target.value } : null
                  )
                }
                className="min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-sm text-slate-900 outline-none"
                
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => onDeleteCustomer(editingCustomer.phone)}
                className="min-h-[44px] px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-slate-900 text-xs font-medium cursor-pointer transition"
              >
                Delete Profile
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="min-h-[44px] px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 rounded-xl bg-sky-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
