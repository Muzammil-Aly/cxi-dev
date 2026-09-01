"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@mui/material";
import { PartRequestDetail } from "@/redux/services/partRequestsApi";

// ─── Styles (mirrors ShopifyOrderForm.tsx's visual language) ─────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
  background: "#fff",
  color: "#111827",
  boxSizing: "border-box",
};

const cellInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  border: "1px solid #e5e7eb",
  borderRadius: "6px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
  color: "#111827",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "16px",
};

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const STORES = ["store1", "store2", "store3", "store4", "store5"];

interface DraftLineItem {
  key: string;
  title: string;
  sku: string;
  quantity: number;
  price: string;
}

function splitName(fullName: string | null | undefined): { firstName: string; lastName: string } {
  const trimmed = (fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function buildLineItems(request: PartRequestDetail): DraftLineItem[] {
  const rows: DraftLineItem[] = [];
  for (const item of request.items) {
    for (const part of item.parts) {
      rows.push({
        key: `${item.id}-${part.id}`,
        title: part.part_name || part.part_number || `Part #${part.part_no ?? ""}`,
        sku: part.part_sku || part.part_number || "",
        quantity: part.quantity ?? 1,
        price: "",
      });
    }
  }
  return rows;
}

export default function PartRequestDraftOrderForm({
  open,
  onClose,
  request,
}: {
  open: boolean;
  onClose: () => void;
  request: PartRequestDetail;
}) {
  const header = request.header;

  const [store, setStore] = useState("store1");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([]);

  useEffect(() => {
    if (!open) return;
    const { firstName: fn, lastName: ln } = splitName(header.customer_name);
    setStore("store1");
    setEmail(header.customer_email || "");
    setFirstName(fn);
    setLastName(ln);
    setAddress1((header.address1 as string) || "");
    setAddress2((header.address2 as string) || "");
    setCity((header.city as string) || "");
    setProvince((header.state as string) || "");
    setZip((header.zip as string) || "");
    setCountry((header.country as string) || "");
    setPhone(header.customer_phone || "");
    setNote(
      `Part Request ${header.order_no || ""}${header.zendesk_ticket_id ? ` (Zendesk #${header.zendesk_ticket_id})` : ""}`.trim()
    );
    setLineItems(buildLineItems(request));
  }, [open, request, header]);

  const updateLineItem = (key: string, field: keyof DraftLineItem, value: string | number) => {
    setLineItems((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const removeLineItem = (key: string) => {
    setLineItems((rows) => rows.filter((r) => r.key !== key));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Preview only — not wired to Shopify or any backend call yet.
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: "16px", overflow: "hidden", m: 0 } }}
    >
      <DialogContent
        sx={{
          p: 0,
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "5px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(99, 102, 241, 0.35)", borderRadius: "10px" },
          "&::-webkit-scrollbar-thumb:hover": { background: "rgba(99, 102, 241, 0.65)" },
        }}
      >
        <div style={{ background: "#fff", width: "100%", fontFamily: "Inter, sans-serif" }}>
          {/* ── Header ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  background: "rgba(255,255,255,0.18)",
                  borderRadius: "12px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: "22px", fontWeight: 700, lineHeight: 1.2 }}>
                  Create Draft Order
                </div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: "13px", marginTop: "2px" }}>
                  Prefilled from Part Request {header.order_no || header.id} — preview only, not yet submitted
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                fontSize: "22px",
                lineHeight: 1,
                padding: "4px",
                borderRadius: "6px",
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* ── Body ── */}
          <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
            {/* Store + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>Store *</label>
                <select style={inputStyle} value={store} onChange={(e) => setStore(e.target.value)}>
                  {STORES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Customer Email *</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="e.g., customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Names + phone */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>First Name *</label>
                <input style={inputStyle} placeholder="e.g., John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Last Name *</label>
                <input style={inputStyle} placeholder="e.g., Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="e.g., +1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            {/* Note */}
            <div style={{ ...fieldWrap, marginBottom: "20px" }}>
              <label style={labelStyle}>Note</label>
              <textarea
                style={{ ...inputStyle, minHeight: "56px", resize: "vertical", fontFamily: "inherit" }}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Line Items */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ ...labelStyle, marginBottom: "10px" }}>
                Line Items * ({lineItems.length})
              </label>
              <div style={{ border: "1.5px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb" }}>
                      {["Title", "SKU", "Qty", "Price", ""].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            padding: "10px 12px",
                            borderBottom: "1px solid #e5e7eb",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontSize: "13px" }}>
                          No line items
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((row) => (
                        <tr key={row.key} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td style={{ padding: "8px 12px" }}>
                            <input style={cellInputStyle} value={row.title} onChange={(e) => updateLineItem(row.key, "title", e.target.value)} />
                          </td>
                          <td style={{ padding: "8px 12px", width: "150px" }}>
                            <input style={cellInputStyle} value={row.sku} onChange={(e) => updateLineItem(row.key, "sku", e.target.value)} />
                          </td>
                          <td style={{ padding: "8px 12px", width: "70px" }}>
                            <input
                              type="number"
                              style={cellInputStyle}
                              value={row.quantity}
                              onChange={(e) => updateLineItem(row.key, "quantity", Number(e.target.value))}
                            />
                          </td>
                          <td style={{ padding: "8px 12px", width: "100px" }}>
                            <input
                              style={cellInputStyle}
                              placeholder="0.00"
                              value={row.price}
                              onChange={(e) => updateLineItem(row.key, "price", e.target.value)}
                            />
                          </td>
                          <td style={{ padding: "8px 12px", width: "40px", textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={() => removeLineItem(row.key)}
                              style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "16px", lineHeight: 1 }}
                              aria-label="Remove line item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "20px", marginBottom: "20px" }}>
              <div style={sectionHeaderStyle}>Shipping Address</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Address Line 1 *</label>
                  <input style={inputStyle} placeholder="e.g., 123 Main St" value={address1} onChange={(e) => setAddress1(e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Address Line 2</label>
                  <input style={inputStyle} placeholder="Apt, suite, etc." value={address2} onChange={(e) => setAddress2(e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>City *</label>
                  <input style={inputStyle} placeholder="e.g., New York" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>ZIP / Postal Code *</label>
                  <input style={inputStyle} placeholder="e.g., 10001" value={zip} onChange={(e) => setZip(e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Province / State Code *</label>
                  <input style={inputStyle} placeholder="e.g., NY" value={province} onChange={(e) => setProvince(e.target.value)} />
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Country Code *</label>
                  <input style={inputStyle} placeholder="e.g., US" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: "20px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 24px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#374151",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "10px 28px",
                  border: "none",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                Submit (Preview Only)
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
