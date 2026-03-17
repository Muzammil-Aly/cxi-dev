// src/components/ShopifyOrderForm.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  useCreateOrderMutation,
  useGetProductsQuery,
  type ProductVariant,
  type ShopifyProduct,
  type ShopifyStore,
} from "../../redux/services/shopifyApi";
import {
  Autocomplete,
  CircularProgress,
  TextField,
} from "@mui/material";

interface VariantOption {
  label: string;
  variantId: string;
  product: ShopifyProduct;
  variant: ProductVariant;
}

interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  provinceCode: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

interface LineItem {
  variantId: string;
  quantity: number;
}

interface OrderFormState {
  email: string;
  lineItems: LineItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

const defaultAddress: Address = {
  firstName: "",
  lastName: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  provinceCode: "",
  countryCode: "",
  zip: "",
  phone: "",
};

const STORE_OPTIONS: { value: ShopifyStore; label: string }[] = [
  { value: "store1", label: "Testing" },
  { value: "store2", label: "MDB CO" },
  { value: "store3", label: "Store 3" },
];

interface StoreDropdownProps {
  value: ShopifyStore;
  onChange: (v: ShopifyStore) => void;
  options: { value: ShopifyStore; label: string }[];
}

const StoreDropdown: React.FC<StoreDropdownProps> = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: open ? "#6366f1" : "#e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          cursor: "pointer",
          background: "#fff",
          color: "#111827",
          transition: "border-color 0.15s",
        }}
      >
        <span>{selected?.label}</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            zIndex: 999,
            overflow: "hidden",
            padding: "6px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "#16a34a" : "#6b7280",
                  background: isSelected ? "#f0fdf4" : "transparent",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isSelected ? "#f0fdf4" : "transparent";
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface ShopifyOrderFormProps {
  onClose?: () => void;
}

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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  marginBottom: "6px",
};

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const ShopifyOrderForm: React.FC<ShopifyOrderFormProps> = ({ onClose }) => {
  const [selectedStore, setSelectedStore] = useState<ShopifyStore>("store1");
  const [createOrder, { isLoading, data, error }] = useCreateOrderMutation();
  const { data: products, isLoading: productsLoading } =
    useGetProductsQuery(selectedStore);

  const variantOptions = useMemo<VariantOption[]>(() => {
    if (!products) return [];
    return products.flatMap((product) =>
      product.variants.edges.map(({ node: variant }) => ({
        label: `${product.title} — ${variant.title}${variant.sku ? ` (${variant.sku})` : ""} · $${variant.price}`,
        variantId: variant.id,
        product,
        variant,
      })),
    );
  }, [products]);

  const [form, setForm] = useState<OrderFormState>({
    email: "",
    lineItems: [{ variantId: "", quantity: 1 }],
    shippingAddress: { ...defaultAddress },
    billingAddress: { ...defaultAddress },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (
    type: "shippingAddress" | "billingAddress",
    field: keyof Address,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const handleLineItemChange = <K extends keyof LineItem>(
    index: number,
    field: K,
    value: LineItem[K],
  ) => {
    const newLineItems = [...form.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setForm({ ...form, lineItems: newLineItems });
  };

  const addLineItem = () =>
    setForm({
      ...form,
      lineItems: [...form.lineItems, { variantId: "", quantity: 1 }],
    });

  const removeLineItem = (index: number) =>
    setForm({
      ...form,
      lineItems: form.lineItems.filter((_, i) => i !== index),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        store: selectedStore,
        email: form.email,
        lineItems: form.lineItems,
        shippingAddress: form.shippingAddress,
        inventoryBehaviour: "BYPASS",
        sendReceipt: false,
        sendFulfillmentReceipt: false,
      }).unwrap();
      alert("Order created successfully!");
    } catch (err) {
      console.error(err);
      alert("Error creating order");
    }
  };

  const addr = form.shippingAddress;

  return (
    <div
      style={{
        background: "#fff",
        width: "100%",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* Header */}
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
            {/* Shopping bag icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontSize: "22px",
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Create Order
            </div>
            <div
              style={{ color: "rgba(255,255,255,0.78)", fontSize: "13px", marginTop: "2px" }}
            >
              Fill in the details to create a new Shopify order
            </div>
          </div>
        </div>
        {onClose && (
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
        )}
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} style={{ padding: "28px" }}>

        {/* Row: Store + Email */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div style={fieldWrap}>
            <label style={labelStyle}>Store *</label>
            <StoreDropdown
              value={selectedStore}
              onChange={(v) => setSelectedStore(v)}
              options={STORE_OPTIONS}
            />
          </div>

          <div style={fieldWrap}>
            <label style={labelStyle}>Customer Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="e.g., customer@email.com"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Line Items Section */}
        <div style={{ marginBottom: "20px" }}>
          <label style={{ ...labelStyle, marginBottom: "10px" }}>
            Line Items *
          </label>
          {form.lineItems.map((item, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px auto",
                gap: "12px",
                marginBottom: "10px",
                alignItems: "center",
              }}
            >
              <Autocomplete
                options={variantOptions}
                loading={productsLoading}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(o, v) => o.variantId === v.variantId}
                value={
                  variantOptions.find((o) => o.variantId === item.variantId) ??
                  null
                }
                onChange={(_, selected) =>
                  handleLineItemChange(
                    index,
                    "variantId",
                    selected?.variantId ?? "",
                  )
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search product variant..."
                    required
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "14px",
                        "& fieldset": { borderColor: "#e5e7eb" },
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {productsLoading && (
                            <CircularProgress color="inherit" size={14} />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <input
                type="number"
                min={1}
                defaultValue={item.quantity}
                key={`qty-${index}`}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value, 10);
                  if (!isNaN(parsed) && parsed >= 1) {
                    handleLineItemChange(index, "quantity", parsed);
                  }
                }}
                required
                placeholder="Qty"
                style={inputStyle}
              />
              {form.lineItems.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  style={{
                    padding: "8px 14px",
                    border: "1.5px solid #fca5a5",
                    borderRadius: "8px",
                    background: "#fff",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Remove
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLineItem}
            style={{
              padding: "8px 16px",
              border: "1.5px dashed #a5b4fc",
              borderRadius: "8px",
              background: "#f5f3ff",
              color: "#4f46e5",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            + Add Line Item
          </button>
        </div>

        {/* Shipping Address */}
        <div
          style={{
            borderTop: "1px solid #f3f4f6",
            paddingTop: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "16px",
            }}
          >
            Shipping Address
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div style={fieldWrap}>
              <label style={labelStyle}>First Name *</label>
              <input
                style={inputStyle}
                placeholder="e.g., John"
                value={addr.firstName}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "firstName", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Last Name *</label>
              <input
                style={inputStyle}
                placeholder="e.g., Doe"
                value={addr.lastName}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "lastName", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Address Line 1 *</label>
              <input
                style={inputStyle}
                placeholder="e.g., 123 Main St"
                value={addr.address1}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "address1", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Address Line 2</label>
              <input
                style={inputStyle}
                placeholder="Apt, suite, etc."
                value={addr.address2}
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "address2", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>City *</label>
              <input
                style={inputStyle}
                placeholder="e.g., New York"
                value={addr.city}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "city", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>ZIP / Postal Code *</label>
              <input
                style={inputStyle}
                placeholder="e.g., 10001"
                value={addr.zip}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "zip", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Province / State Code *</label>
              <input
                style={inputStyle}
                placeholder="e.g., NY"
                value={addr.provinceCode}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "provinceCode", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Country Code *</label>
              <input
                style={inputStyle}
                placeholder="e.g., US"
                value={addr.countryCode}
                required
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "countryCode", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Company</label>
              <input
                style={inputStyle}
                placeholder="e.g., Acme Inc."
                value={addr.company}
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "company", e.target.value)
                }
              />
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Phone</label>
              <input
                style={inputStyle}
                placeholder="e.g., +1 555 000 0000"
                value={addr.phone}
                onChange={(e) =>
                  handleAddressChange("shippingAddress", "phone", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <pre
            style={{
              color: "#dc2626",
              background: "#fef2f2",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              marginBottom: "16px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(error, null, 2)}
          </pre>
        )}
        {data && (
          <pre
            style={{
              color: "#16a34a",
              background: "#f0fdf4",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              marginBottom: "16px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        {/* Footer Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #f3f4f6",
            paddingTop: "20px",
          }}
        >
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
            disabled={isLoading}
            style={{
              padding: "10px 28px",
              border: "none",
              borderRadius: "8px",
              background: isLoading
                ? "#a5b4fc"
                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#fff",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.01em",
            }}
          >
            {isLoading ? "Creating..." : "+ Create Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ShopifyOrderForm;
