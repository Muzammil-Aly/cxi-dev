// src/components/ShopifyOrderForm.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  useCreateOrderMutation,
  useCreateDraftOrderMutation,
  useCreateProductMutation,
  useUpdateOrderMutation,
  useUpdateDraftOrderMutation,
  useEditOrderMutation,
  useGetOrderLineItemsQuery,
  useGetDraftOrderLineItemsQuery,
  useGetProductsQuery,
  useGetShopifyOrdersQuery,
  useGetShopifyDraftOrdersQuery,
  useGetShopifyReturnReasonsQuery,
  useGetShopifyReturnReasonsCodeQuery,
  type ProductVariant,
  type ShopifyProduct,
  type ShopifyStore,
} from "../../redux/services/shopifyApi";
import { useGetShopifyLineItemsQuery } from "../../redux/services/shopifyApi";
import { useGetDistinctTouchupItemsQuery, useGetTouchupsQuery } from "../../redux/services/InventoryApi";
import { Autocomplete, CircularProgress, TextField } from "@mui/material";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  item_no?: string;
  lot_no?: string | null;
  unit_price?: number | null;
  description?: string | null;
  return_reason_code?: string;
  reason_code?: string;
  parts?: Array<{
    parts_item_no: string;
    parts_qty: number;
    parts_unit_price: number | null;
    variantId?: string;
    productId?: string;
    reason_code?: string;
  }>;
  isCustomProduct?: boolean;
  customTitle?: string;
  customPrice?: string;
  customSku?: string;
  customProductType?: string;
  customVendor?: string;
}

interface OrderFormState {
  email: string;
  lineItems: LineItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

interface CustomAttribute {
  key: string;
  value: string;
}

type FormMode = "create" | "editOrder" | "editDraft" | "createProduct";
type EditSubTab = "details" | "lineItems";
type DraftSubTab = "details" | "lineItems";
type OpType = "addVariant" | "setQuantity" | "addDiscount";

interface DraftVariantLineItem {
  key: string;
  variantId: string;
  title: string;
  quantity: number;
  pendingRemove: boolean;
}

interface DraftNewLineItem {
  key: string;
  variantId: string;
  title: string;
  quantity: number;
}

interface EditOperation {
  id: string;
  type: OpType;
  variantId: string;
  lineItemId: string;
  quantity: number;
  allowDuplicates: boolean;
  restock: boolean;
  discountType: "percent" | "fixed";
  discountValue: string;
  discountCurrencyCode: string;
  discountDescription: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STORE_OPTIONS: {
  value: ShopifyStore;
  label: string;
  tag: string;
  handle: string;
}[] = [
  // { value: "store1", label: "Testing", tag: "Testing", handle: "testoneabc" },
  { value: "store1", label: "MDB CO", tag: "Testing", handle: "mdbco-test" },

  {
    value: "store1",
    label: "CP02 -mdbco",
    tag: "CP02 -mdbco",
    handle: "mdbco-test",
  },
  {
    value: "store1",
    label: "CP03 -mdbco",
    tag: "CP03 -mdbco",
    handle: "mdbco-test",
  },
  {
    value: "store1",
    label: "CP05 -mdbco",
    tag: "CP05 -mdbco",
    handle: "mdbco-test",
  },
  {
    value: "store1",
    label: "CP010 -mdbco",
    tag: "CP010 -mdbco",
    handle: "mdbco-test",
  },
  {
    value: "store2",
    label: "CP55 -babyletto",
    tag: "CP55 -babyletto",
    handle: "mdbco-test",
  },
  {
    value: "store3",
    label: "CP66 - namesake",
    tag: "CP66 - namesake",
    handle: "xxx",
  },
  {
    value: "store4",
    label: "CP77 -davincibaby",
    tag: "CP77 -davincibaby",
    handle: "",
  },
  {
    value: "store5",
    label: "CP99 -  nurseryworks",
    tag: "CP99 -  nurseryworks",
    handle: "",
  },
  { value: "store3", label: "Store 3", tag: "Store 3", handle: "xxx" },
];

interface StoreOption {
  value: ShopifyStore;
  label: string;
  tag: string;
  handle: string;
}

// ─── StoreDropdown ────────────────────────────────────────────────────────────

interface StoreDropdownProps {
  selectedLabel: string;
  onChange: (opt: StoreOption) => void;
  options: StoreOption[];
}

const StoreDropdown: React.FC<StoreDropdownProps> = ({
  selectedLabel,
  onChange,
  options,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.label === selectedLabel);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
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
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
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
            const isSelected = opt.label === selectedLabel;
            return (
              <div
                key={opt.label}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
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
                  if (!isSelected)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    isSelected ? "#f0fdf4" : "transparent";
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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

// ─── CustomDropdown ───────────────────────────────────────────────────────────

interface CustomDropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
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
          color: selected ? "#111827" : "#9ca3af",
          transition: "border-color 0.15s",
        }}
      >
        <span>{selected?.label ?? placeholder ?? "— select —"}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
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
                key={opt.label}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
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
                  if (!isSelected)
                    (e.currentTarget as HTMLDivElement).style.background =
                      "#f9fafb";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    isSelected ? "#f0fdf4" : "transparent";
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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

// ─── SearchableDropdown ───────────────────────────────────────────────────────

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomDropdownOption[];
  placeholder?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options.slice(0, 5);

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
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
          color: selected ? "#111827" : "#9ca3af",
          transition: "border-color 0.15s",
        }}
      >
        <span>{selected?.label ?? placeholder ?? "— select —"}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
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
            padding: "6px",
          }}
        >
          <div style={{ padding: "4px 6px 6px" }}>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1.5px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                boxSizing: "border-box",
                color: "#111827",
              }}
            />
          </div>
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#9ca3af",
                }}
              >
                No results
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.label}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
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
                      if (!isSelected)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background =
                        isSelected ? "#f0fdf4" : "transparent";
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {!search && options.length > 5 && (
            <div
              style={{
                padding: "6px 14px 4px",
                fontSize: "12px",
                color: "#9ca3af",
                borderTop: "1px solid #f3f4f6",
              }}
            >
              Showing 5 of {options.length} — type to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── PartsSubSection ─────────────────────────────────────────────────────────

type PartRow = {
  parts_item_no: string;
  parts_qty: number;
  parts_unit_price: number | null;
  variantId?: string;
  productId?: string;
  reason_code?: string;
};

interface PartsSubSectionProps {
  item_no?: string;
  lot_no?: string | null;
  parts: PartRow[];
  onChange: (parts: PartRow[]) => void;
  unitPriceLocked?: boolean;
  reasonCodeOptions: { value: string; label: string }[];
}

const EMPTY_PART = (): PartRow => ({
  parts_item_no: "",
  parts_qty: 1,
  parts_unit_price: null,
});

const PartsSubSection: React.FC<PartsSubSectionProps> = ({
  item_no,
  lot_no,
  parts,
  onChange,
  unitPriceLocked,
  reasonCodeOptions,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [customAddEnabled, setCustomAddEnabled] = useState(false);
  const [customSkuTerm, setCustomSkuTerm] = useState("");
  const [debouncedSku, setDebouncedSku] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSku(customSkuTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [customSkuTerm]);

  const { data: customSkuData, isFetching: isCustomFetching } =
    useGetDistinctTouchupItemsQuery(
      { parts_item_no: `like:${debouncedSku}`, page_size: 50 },
      { skip: !customAddEnabled || debouncedSku.length < 2 },
    );

  const customOptions: {
    value: string;
    label: string;
    price: number | null;
  }[] = (customSkuData?.data ?? []).map((p: any) => ({
    value: p.parts_item_no,
    label: p.parts_item_no,
    price: p.unit_price != null ? Number(p.unit_price) : null,
  }));

  const handleCustomSelect = (val: string) => {
    const found = customSkuData?.data?.find(
      (p: any) => p.parts_item_no === val,
    );
    const price = found?.unit_price != null ? Number(found.unit_price) : null;
    onChange([
      ...parts,
      { parts_item_no: val, parts_qty: 1, parts_unit_price: price },
    ]);
    setCustomAddEnabled(false);
    setCustomSkuTerm("");
    setDebouncedSku("");
  };

  const { data: touchupData, isFetching } = useGetTouchupsQuery(
    {
      sku: item_no || undefined,
      lot_no: lot_no ?? undefined,
      isFromProps: true,
      page_size: 100,
    },
    { skip: !expanded || !item_no },
  );

  const partPriceMap = new Map<string, number | null>(
    (touchupData?.data ?? []).map((p: any) => [
      p.parts_item_no,
      p.unit_price != null ? Number(p.unit_price) : null,
    ]),
  );

  const partsOptions: CustomDropdownOption[] = (touchupData?.data ?? []).map(
    (p: any) => ({
      value: p.parts_item_no,
      label: p.parts_item_name
        ? `${p.parts_item_no} — ${p.parts_item_name}`
        : p.parts_item_no,
    }),
  );

  const updateRow = (i: number, patch: Partial<PartRow>) =>
    onChange(parts.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const selectPartForRow = (i: number, val: string) => {
    const price = partPriceMap.has(val) ? partPriceMap.get(val)! : null;
    updateRow(i, { parts_item_no: val, parts_unit_price: price });
  };

  const addRow = () => onChange([...parts, EMPTY_PART()]);
  const removeRow = (i: number) =>
    onChange(parts.filter((_, idx) => idx !== i));

  const fieldStyle: React.CSSProperties = {
    padding: "7px 10px",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    background: "#f9fafb",
    color: "#111827",
    width: "100%",
    boxSizing: "border-box",
  };

  if (unitPriceLocked) {
    return (
      <div
        style={{
          marginTop: "10px",
          borderTop: "1px dashed #e5e7eb",
          paddingTop: "10px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 600, color: "#9ca3af" }}>
          Parts Line Items — disabled (Wash Whole Unit selected)
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: "10px",
        borderTop: "1px dashed #e5e7eb",
        paddingTop: "10px",
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: "12px",
          fontWeight: 600,
          color: "#6366f1",
          marginBottom: expanded ? "10px" : 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        Parts Line Items{" "}
        {parts.length > 0 && (
          <span
            style={{
              marginLeft: "4px",
              fontSize: "11px",
              background: "#ede9fe",
              color: "#6366f1",
              borderRadius: "10px",
              padding: "1px 7px",
            }}
          >
            {parts.length}
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isFetching && (
            <div
              style={{ fontSize: "12px", color: "#9ca3af", padding: "4px 0" }}
            >
              Loading parts…
            </div>
          )}

          {parts.map((row, i) => {
            const lineAmount =
              row.parts_unit_price != null && row.parts_qty >= 1
                ? (Number(row.parts_unit_price) * row.parts_qty).toFixed(2)
                : null;
            return (
              <div
                key={i}
                style={{
                  background: "#f8f7ff",
                  border: "1px solid #ddd6fe",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Row header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#7c3aed",
                    }}
                  >
                    Part {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "16px",
                      lineHeight: 1,
                      padding: "0 2px",
                    }}
                    title="Remove part"
                  >
                    ×
                  </button>
                </div>

                {/* Part Item No */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Part Item No
                  </span>
                  {!isFetching &&
                  partsOptions.length === 0 &&
                  !row.parts_item_no ? (
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                      No parts found for this item.
                    </div>
                  ) : (
                    <SearchableDropdown
                      value={row.parts_item_no}
                      onChange={(val) => selectPartForRow(i, val)}
                      options={
                        row.parts_item_no &&
                        !partsOptions.find((o) => o.value === row.parts_item_no)
                          ? [
                              ...partsOptions,
                              {
                                value: row.parts_item_no,
                                label: row.parts_item_no,
                              },
                            ]
                          : partsOptions
                      }
                      placeholder="— select part —"
                    />
                  )}
                </div>

                {/* Qty / Unit Price / Line Amount */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Qty
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={row.parts_qty}
                      onKeyDown={(e) => {
                        if (/^[0-9]$/.test(e.key))
                          (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (isNaN(v)) return;
                        updateRow(i, {
                          parts_qty: Math.min(5, Math.max(1, v)),
                        });
                      }}
                      style={fieldStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Unit Price
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.parts_unit_price ?? ""}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateRow(i, { parts_unit_price: isNaN(v) ? null : v });
                      }}
                      placeholder="0.00"
                      style={fieldStyle}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Line Amount
                    </span>
                    <div
                      style={{
                        ...fieldStyle,
                        color: lineAmount != null ? "#047857" : "#9ca3af",
                        background: lineAmount != null ? "#f0fdf4" : "#f9fafb",
                        fontWeight: lineAmount != null ? 600 : 400,
                      }}
                    >
                      {lineAmount != null ? `$${lineAmount}` : "—"}
                    </div>
                  </div>
                </div>

                {/* Reason Code for Part */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#6b7280",
                    }}
                  >
                    Reason Code
                  </span>
                  <SearchableDropdown
                    value={row.reason_code ?? ""}
                    onChange={(val) =>
                      updateRow(i, { reason_code: val || undefined })
                    }
                    options={reasonCodeOptions}
                    placeholder="— select reason code —"
                  />
                </div>
              </div>
            );
          })}

          {/* Custom SKU search */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6366f1",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={customAddEnabled}
                onChange={(e) => {
                  setCustomAddEnabled(e.target.checked);
                  if (!e.target.checked) {
                    setCustomSkuTerm("");
                    setDebouncedSku("");
                  }
                }}
                style={{
                  accentColor: "#6366f1",
                  width: "14px",
                  height: "14px",
                }}
              />
              Search & add part by item no
            </label>

            {customAddEnabled && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "6px" }}
              >
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={customSkuTerm}
                    onChange={(e) => setCustomSkuTerm(e.target.value)}
                    placeholder="Type part item no to search…"
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      border: "1.5px solid #a5b4fc",
                      borderRadius: "8px",
                      fontSize: "13px",
                      background: "#fff",
                      color: "#111827",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  {isCustomFetching && (
                    <span
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "11px",
                        color: "#9ca3af",
                      }}
                    >
                      Searching…
                    </span>
                  )}
                </div>

                {debouncedSku.length >= 2 &&
                  !isCustomFetching &&
                  customOptions.length === 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#9ca3af",
                        paddingLeft: "4px",
                      }}
                    >
                      No parts found for "{debouncedSku}".
                    </div>
                  )}

                {customOptions.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #ddd6fe",
                      borderRadius: "8px",
                      background: "#fff",
                      overflow: "hidden",
                      maxHeight: "200px",
                      overflowY: "auto",
                    }}
                  >
                    {customOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleCustomSelect(opt.value)}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          padding: "8px 12px",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid #f3f4f6",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "#111827",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "#f5f3ff")
                        }
                        onMouseLeave={(e) =>
                          ((
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "none")
                        }
                      >
                        <span>{opt.label}</span>
                        {opt.price != null && (
                          <span
                            style={{
                              color: "#059669",
                              fontWeight: 600,
                              marginLeft: "8px",
                            }}
                          >
                            ${opt.price.toFixed(2)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={addRow}
            style={{
              padding: "6px 14px",
              border: "1.5px dashed #c4b5fd",
              borderRadius: "8px",
              background: "#f5f3ff",
              color: "#6366f1",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              alignSelf: "flex-start",
            }}
          >
            + Add Part
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newOperation(): EditOperation {
  return {
    id: Math.random().toString(36).slice(2),
    type: "addVariant",
    variantId: "",
    lineItemId: "",
    quantity: 1,
    allowDuplicates: false,
    restock: false,
    discountType: "percent",
    discountValue: "",
    discountCurrencyCode: "USD",
    discountDescription: "",
  };
}

// ─── ResultBox ────────────────────────────────────────────────────────────────

const ResultBox: React.FC<{
  data?: any;
  error?: any;
  successColor?: string;
  successBg?: string;
  adminUrl?: string;
}> = ({
  data,
  error,
  successColor = "#16a34a",
  successBg = "#f0fdf4",
  adminUrl,
}) => (
  <>
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
      <>
        {adminUrl && (
          <div style={{ marginBottom: "10px" }}>
            <a
              href={adminUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "13px",
                padding: "7px 14px",
                background: "#eff6ff",
                borderRadius: "8px",
                border: "1px solid #bfdbfe",
              }}
            >
              🔗 View in Shopify Admin
            </a>
          </div>
        )}
        <pre
          style={{
            color: successColor,
            background: successBg,
            borderRadius: "8px",
            padding: "12px",
            fontSize: "12px",
            marginBottom: "16px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </>
    )}
  </>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ShopifyOrderForm: React.FC<ShopifyOrderFormProps> = ({ onClose }) => {
  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<FormMode>("create");
  const [editSubTab, setEditSubTab] = useState<EditSubTab>("details");

  // ── Store (shared) ────────────────────────────────────────────────────────
  const [selectedStoreOption, setSelectedStoreOption] = useState<StoreOption>(
    STORE_OPTIONS[0],
  );
  const selectedStore = selectedStoreOption.value;
  const selectedTag = selectedStoreOption.tag;

  // ── Create mode: order search ─────────────────────────────────────────────
  const [orderSearchInput, setOrderSearchInput] = useState("");
  const [orderSearchFilter, setOrderSearchFilter] = useState<
    string | undefined
  >(undefined);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [availableLineItems, setAvailableLineItems] = useState<any[]>([]);
  const [lineItemProductIds, setLineItemProductIds] = useState<
    (string | null)[]
  >([null]);

  const orderSearchRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: orderSearchData, isFetching: isOrderSearching } =
    useGetShopifyLineItemsQuery(
      { order_id: orderSearchFilter! },
      { skip: !orderSearchFilter },
    );
  const orderSuggestions = useMemo(
    () => orderSearchData?.data || [],
    [orderSearchData],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        orderSearchRef.current &&
        !orderSearchRef.current.contains(e.target as Node)
      )
        setShowOrderDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Reason code ───────────────────────────────────────────────────────────
  const [selectedReasonCode, setSelectedReasonCode] = useState("");
  const [washWholeUnit, setWashWholeUnit] = useState(false);
  const { data: returnReasonsData } = useGetShopifyReturnReasonsCodeQuery();

  //  useGetShopifyReturnReasonsQuery();
  const reasonCodeOptions = (returnReasonsData?.data ?? []).map((r) => ({
    value: r.Code,
    label: `${r.Code} — ${r.Description}`,
  }));
  const { data: returnReasonsCodeData } = useGetShopifyReturnReasonsQuery();
  // useGetShopifyReturnReasonsCodeQuery();
  const lineReasonCodeOptions = (returnReasonsCodeData?.data ?? []).map(
    (r) => ({
      value: r.Code,
      label: `${r.Code} — ${r.Description}`,
    }),
  );

  // ── Create mode: mutations ────────────────────────────────────────────────
  const [, { isLoading, data, error }] = useCreateOrderMutation();
  const [
    createDraftOrder,
    { isLoading: isDraftLoading, data: draftData, error: draftError },
  ] = useCreateDraftOrderMutation();
  const [createProduct, { isLoading: isProductCreating }] =
    useCreateProductMutation();

  // ── Create Product: form state ────────────────────────────────────────────
  const [productForm, setProductForm] = useState({
    title: "",
    price: "",
    sku: "",
    product_type: "",
    vendor: "",
  });
  const {
    data: products,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery(selectedStore);

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

  const getProductVariants = (productId: string | null): ProductVariant[] => {
    if (!productId || !products) return [];
    const product = products.find((p) => p.id === productId);
    return product ? product.variants.edges.map((e) => e.node) : [];
  };

  const productHasVariantChoice = (productId: string | null): boolean => {
    const variants = getProductVariants(productId);
    return (
      variants.length > 1 ||
      (variants.length === 1 && variants[0].title !== "Default Title")
    );
  };

  // ── Create mode: form state ───────────────────────────────────────────────
  const [form, setForm] = useState<OrderFormState>({
    email: "",
    lineItems: [{ variantId: "", quantity: 1 }],
    shippingAddress: { ...defaultAddress },
    billingAddress: { ...defaultAddress },
  });

  // ── Edit mode: order search ───────────────────────────────────────────────
  const [editSearchInput, setEditSearchInput] = useState("");
  const [editSearchFilter, setEditSearchFilter] = useState<string | undefined>(
    undefined,
  );
  const editSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const buildShopifyQuery = (input: string): string | undefined => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    if (/^\d+$/.test(trimmed)) return `name:#${trimmed}`;
    if (trimmed.startsWith("#")) return `name:${trimmed}`;
    if (trimmed.includes("@")) return `email:${trimmed}`;
    return trimmed;
  };

  const { data: editShopifyOrdersData, isFetching: isEditOrderSearching } =
    useGetShopifyOrdersQuery(
      { store: selectedStore, limit: 50, query: editSearchFilter },
      { skip: mode !== "editOrder" },
    );
  const editOrderSuggestions = useMemo(
    () => editShopifyOrdersData?.data || [],
    [editShopifyOrdersData],
  );

  const handleSelectEditOrder = (order: any, isDraft = false) => {
    const numericId = order.id?.split("/").pop() || "";
    setOperations([newOperation()]);
    setRemovedLineItemIds(new Set());
    resetEditOrder();
    if (isDraft) {
      setEditDraftOrderId(numericId);
    } else {
      setEditOrderId(numericId);
      setLoadLineItemsOrderId(numericId);
    }
    if (order.email) setEditEmail(order.email);
    if (order.tags?.length) setEditTags(order.tags.join(", "));
    const addr = order.shippingAddress;
    if (addr) {
      setEditAddr((prev) => ({
        ...prev,
        firstName: addr.firstName || prev.firstName,
        lastName: addr.lastName || prev.lastName,
        company: addr.company || prev.company,
        address1: addr.address1 || prev.address1,
        address2: addr.address2 || prev.address2,
        city: addr.city || prev.city,
        zip: addr.zip || prev.zip,
        provinceCode: addr.provinceCode || prev.provinceCode,
        countryCode: addr.countryCode || prev.countryCode,
        phone: addr.phone || prev.phone,
      }));
    }
    setEditSearchInput(order.name || numericId);
  };

  // ── Edit draft mode: order search ────────────────────────────────────────
  const [draftSearchInput, setDraftSearchInput] = useState("");
  const [draftSearchFilter, setDraftSearchFilter] = useState<
    string | undefined
  >(undefined);
  const [draftSelectedOrder, setDraftSelectedOrder] = useState<any>(null);
  const draftSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { data: editDraftOrdersData, isFetching: isDraftOrderSearching } =
    useGetShopifyDraftOrdersQuery(
      { store: selectedStore, limit: 50, query: draftSearchFilter },
      { skip: mode !== "editDraft" },
    );
  const draftOrderSuggestions = useMemo(
    () => editDraftOrdersData?.data || [],
    [editDraftOrdersData],
  );

  const handleSelectDraftOrder = (order: any) => {
    const numericId = order.id?.split("/").pop() || "";
    setEditDraftOrderId(numericId);
    setLoadDraftLineItemsId(numericId);
    if (order.email) setEditEmail(order.email);
    setEditTags(order.tags?.length ? order.tags.join(", ") : "");
    resetUpdateDraft();
    const addr = order.shippingAddress;
    if (addr) {
      setEditAddr((prev) => ({
        ...prev,
        firstName: addr.firstName || prev.firstName,
        lastName: addr.lastName || prev.lastName,
        company: addr.company || prev.company,
        address1: addr.address1 || prev.address1,
        address2: addr.address2 || prev.address2,
        city: addr.city || prev.city,
        zip: addr.zip || prev.zip,
        provinceCode: addr.provinceCode || prev.provinceCode,
        countryCode: addr.countryCode || prev.countryCode,
        phone: addr.phone || prev.phone,
      }));
    }
    setDraftSearchInput(order.name || numericId);
  };

  // ── Edit mode: mutations ──────────────────────────────────────────────────
  const [
    updateOrder,
    { isLoading: isUpdating, data: updateData, error: updateError },
  ] = useUpdateOrderMutation();
  const [
    updateDraftOrder,
    {
      isLoading: isDraftUpdating,
      data: updateDraftData,
      error: updateDraftError,
      reset: resetUpdateDraft,
    },
  ] = useUpdateDraftOrderMutation();
  const [
    editOrderMutation,
    {
      isLoading: isEditing,
      data: editData,
      error: editError,
      reset: resetEditOrder,
    },
  ] = useEditOrderMutation();

  // Load existing line items for the order being edited
  const [loadLineItemsOrderId, setLoadLineItemsOrderId] = useState<string>("");
  const prevLoadLineItemsOrderIdRef = useRef<string>("");
  const {
    data: orderDetailData,
    isFetching: isLoadingLineItems,
    isError: _isLineItemsError,
    refetch: refetchLineItems,
  } = useGetOrderLineItemsQuery(
    { orderId: loadLineItemsOrderId, store: selectedStore },
    { skip: !loadLineItemsOrderId, refetchOnMountOrArgChange: true },
  );

  // Force refetch when the same order is re-selected (cache bypass)
  useEffect(() => {
    if (
      loadLineItemsOrderId &&
      loadLineItemsOrderId === prevLoadLineItemsOrderIdRef.current
    ) {
      refetchLineItems();
    }
    prevLoadLineItemsOrderIdRef.current = loadLineItemsOrderId;
  }, [loadLineItemsOrderId]);
  const existingLineItems = loadLineItemsOrderId
    ? (orderDetailData?.lineItems ?? [])
    : [];

  // ── Edit draft: line items state ──────────────────────────────────────────
  const [draftSubTab, setDraftSubTab] = useState<DraftSubTab>("details");
  const [loadDraftLineItemsId, setLoadDraftLineItemsId] = useState<string>("");
  const prevLoadDraftLineItemsIdRef = useRef<string>("");
  const [draftVariantItems, setDraftVariantItems] = useState<
    DraftVariantLineItem[]
  >([]);
  const [draftCustomItems, setDraftCustomItems] = useState<
    { title: string; quantity: number }[]
  >([]);
  const [draftNewItems, setDraftNewItems] = useState<DraftNewLineItem[]>([]);

  const {
    data: draftLineItemsData,
    isFetching: isLoadingDraftLineItems,
    refetch: refetchDraftLineItems,
  } = useGetDraftOrderLineItemsQuery(
    { draftOrderId: loadDraftLineItemsId, store: selectedStore },
    { skip: !loadDraftLineItemsId, refetchOnMountOrArgChange: true },
  );

  // Force refetch when the same draft order is re-selected (cache bypass)
  useEffect(() => {
    if (
      loadDraftLineItemsId &&
      loadDraftLineItemsId === prevLoadDraftLineItemsIdRef.current
    ) {
      refetchDraftLineItems();
    }
    prevLoadDraftLineItemsIdRef.current = loadDraftLineItemsId;
  }, [loadDraftLineItemsId]);

  // Populate variant/custom state when draft line items load
  useEffect(() => {
    if (!draftLineItemsData) return;
    setDraftVariantItems(
      draftLineItemsData.lineItems.map((li, i) => ({
        key: `${li.variantId!}_${i}`,
        variantId: li.variantId!,
        title: li.title,
        quantity: li.quantity,
        pendingRemove: false,
      })),
    );
    setDraftCustomItems(draftLineItemsData.customItems);
    setDraftNewItems([]);
  }, [draftLineItemsData]);

  // Sync email, tags, and full address from order detail response (always fresh)
  useEffect(() => {
    if (!orderDetailData) return;
    setEditEmail(orderDetailData.email ?? "");
    setEditTags(orderDetailData.tags?.join(", ") ?? "");
    const addr = orderDetailData.shippingAddress;
    setEditAddr({
      firstName: addr?.firstName ?? "",
      lastName: addr?.lastName ?? "",
      company: addr?.company ?? "",
      address1: addr?.address1 ?? "",
      address2: addr?.address2 ?? "",
      city: addr?.city ?? "",
      zip: addr?.zip ?? "",
      provinceCode: addr?.provinceCode ?? "",
      countryCode: addr?.countryCode ?? "",
      phone: addr?.phone ?? "",
    });
  }, [orderDetailData]);

  // ── Edit mode: state ──────────────────────────────────────────────────────
  const [editOrderId, setEditOrderId] = useState("");
  const [editDraftOrderId, setEditDraftOrderId] = useState("");
  const [editSelectedOrder, setEditSelectedOrder] = useState<any>(null);
  const [removedLineItemIds, setRemovedLineItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [editEmail, setEditEmail] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editAddr, setEditAddr] = useState({ ...defaultAddress });
  const [customAttrs, setCustomAttrs] = useState<CustomAttribute[]>([]);
  const [operations, setOperations] = useState<EditOperation[]>([
    newOperation(),
  ]);
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [staffNote, setStaffNote] = useState("");

  // Reset edit state when switching modes
  useEffect(() => {
    setEditEmail("");
    setEditTags("");
    setEditAddr({ ...defaultAddress });
    setCustomAttrs([]);
    setOperations([newOperation()]);
    setNotifyCustomer(false);
    setStaffNote("");
    setEditSubTab("details");
    setEditSelectedOrder(null);
    setEditSearchInput("");
    setEditSearchFilter(undefined);
    setDraftSelectedOrder(null);
    setDraftSearchInput("");
    setDraftSearchFilter(undefined);
    setRemovedLineItemIds(new Set());
    setDraftSubTab("details");
    setLoadDraftLineItemsId("");
    setDraftVariantItems([]);
    setDraftCustomItems([]);
    setDraftNewItems([]);
    resetEditOrder();
  }, [mode]); // Reset all form state when store changes
  useEffect(() => {
    // Reset line items for the new store, keep email/addresses and available items
    setForm((prev) => ({ ...prev, lineItems: [] }));
    setLineItemProductIds([]);
    // Edit mode
    setEditOrderId("");
    setEditDraftOrderId("");
    setEditSelectedOrder(null);
    setEditEmail("");
    setEditTags("");
    setEditAddr({ ...defaultAddress });
    setCustomAttrs([]);
    setOperations([newOperation()]);
    setNotifyCustomer(false);
    setStaffNote("");
    setEditSubTab("details");
    setEditSearchInput("");
    setEditSearchFilter(undefined);
    setDraftSelectedOrder(null);
    setDraftSearchInput("");
    setDraftSearchFilter(undefined);
    setRemovedLineItemIds(new Set());
    setLoadLineItemsOrderId("");
    setDraftSubTab("details");
    setLoadDraftLineItemsId("");
    setDraftVariantItems([]);
    setDraftCustomItems([]);
    setDraftNewItems([]);
    resetEditOrder();
  }, [selectedStoreOption]);

  // ── Create mode: handlers ─────────────────────────────────────────────────
  const handleOrderSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setOrderSearchInput(val);
    setShowOrderDropdown(true);
    if (!val.trim()) {
      setForm((prev) => ({
        ...prev,
        email: "",
        shippingAddress: { ...defaultAddress },
      }));
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setOrderSearchFilter(val.trim() || undefined);
    }, 400);
  };

  const handleSelectOrder = (order: any) => {
    const allRows: any[] = orderSuggestions.filter(
      (r: any) => r.order_id === order.order_id,
    );

    // Store rows for the dropdown — user picks which to add
    setAvailableLineItems(allRows);
    setLineItemProductIds([]);

    setForm((prev) => ({
      ...prev,
      email: order.customer_email || prev.email,
      lineItems: [],
      shippingAddress: {
        ...prev.shippingAddress,
        firstName: order.first_name || prev.shippingAddress.firstName,
        lastName: order.last_name || prev.shippingAddress.lastName,
        address1: order.address || "",
        company: order.company || "",
        city: order.city || "",
        zip: order.zip_code || "",
        provinceCode: order.state_code || "",
        countryCode: order.country_code || "",
        phone: order.phone_no || "",
      },
    }));
    setOrderSearchInput(order.order_id || "");
    setShowOrderDropdown(false);
  };

  const handleAddLineItemFromDropdown = (row: any) => {
    const description: string = (row.description || "").trim().toLowerCase();
    const matchedProduct =
      products?.find((p) => p.title.trim().toLowerCase() === description) ??
      null;

    let autoVariantId = "";
    if (matchedProduct) {
      const variants = matchedProduct.variants.edges;
      if (
        variants.length === 1 ||
        variants[0]?.node.title === "Default Title"
      ) {
        autoVariantId = variants[0]?.node.id ?? "";
      }
    }

    const isUnmatched = !matchedProduct && !!(row.description || row.item_no);
    const newItem: LineItem = {
      variantId: autoVariantId,
      quantity: row.quantity != null ? Number(row.quantity) : 1,
      item_no: row.item_no || undefined,
      lot_no: row.lot_no ?? undefined,
      unit_price: row.unit_price ?? null,
      description: row.description || null,
      // pre-populate custom fields for use in the confirm modal (not auto-ticked)
      ...(isUnmatched && {
        customTitle: row.description || row.item_no || "",
        customSku: row.item_no || "",
        customProductType: row.lot_no || "",
        customPrice: row.unit_price != null ? String(row.unit_price) : "",
        customVendor: selectedStoreOption.label,
      }),
    };

    setLineItemProductIds((prev) => [...prev, matchedProduct?.id ?? null]);
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  };

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
    setForm((prev) => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
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

  const addLineItem = () => {
    setLineItemProductIds((prev) => [...prev, null]);
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { variantId: "", quantity: 1 }],
    }));
  };

  const buildProperties = (
    item: LineItem,
  ): { name: string; value: string }[] => {
    const props: { name: string; value: string }[] = [];
    if (item.item_no) props.push({ name: "item_no", value: item.item_no });
    if (item.lot_no) props.push({ name: "lot_no", value: item.lot_no });
    if (item.unit_price != null)
      props.push({ name: "unit_price", value: String(item.unit_price) });
    if (item.return_reason_code)
      props.push({
        name: "return_reason_code",
        value: item.return_reason_code,
      });
    if (selectedReasonCode)
      props.push({ name: "reason_code", value: selectedReasonCode });
    if (item.reason_code)
      props.push({ name: "line_reason_code", value: item.reason_code });
    return props;
  };

  const buildLineItemsPayload = (items: LineItem[]) => {
    const result: any[] = [];
    for (const item of items) {
      const properties = buildProperties(item);
      const activeParts = !washWholeUnit
        ? (item.parts ?? []).filter((p) => p.parts_item_no)
        : [];

      if (activeParts.length > 0) {
        // Parts exist → each part is an inline custom product; Line 1 data + part reason code go as properties
        for (const part of activeParts) {
          const partProps = [...properties];
          if (part.reason_code)
            partProps.push({
              name: "part_reason_code",
              value: part.reason_code,
            });
          result.push({
            quantity: part.parts_qty,
            title: part.parts_item_no,
            price:
              part.parts_unit_price != null
                ? String(part.parts_unit_price)
                : "0.00",
            sku: part.parts_item_no,
            ...(partProps.length > 0 && { properties: partProps }),
          });
        }
      } else {
        // No parts → line item itself goes as an inline custom product
        result.push({
          quantity: item.quantity,
          title: item.description || item.item_no || "Custom Item",
          price: item.unit_price != null ? String(item.unit_price) : "0.00",
          sku: item.item_no || undefined,
          ...(properties.length > 0 && { properties }),
        });
      }
    }
    return result;
  };

  const allPricesZero = (items: LineItem[]) =>
    items.length > 0 &&
    items.every((item) => {
      const lineZero = item.unit_price == null || Number(item.unit_price) === 0;
      const partsZero =
        !item.parts ||
        item.parts.length === 0 ||
        item.parts.every(
          (p) => p.parts_unit_price == null || Number(p.parts_unit_price) === 0,
        );
      return lineZero && partsZero;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // const shouldCreateOrder = washWholeUnit || allPricesZero(form.lineItems);
    try {
      // if (shouldCreateOrder) {
      //   await createOrder({
      //     store: selectedStore,
      //     email: form.email,
      //     tags: [selectedTag],
      //     lineItems: buildLineItemsPayload(form.lineItems),
      //     shippingAddress: form.shippingAddress,
      //     inventoryBehaviour: "BYPASS",
      //     sendReceipt: false,
      //     sendFulfillmentReceipt: false,
      //   }).unwrap();
      //   toast.success("Order created successfully!");
      // } else {
      await createDraftOrder({
        store: selectedStore,
        email: form.email,
        tags: [selectedTag],
        lineItems: buildLineItemsPayload(form.lineItems),
        shippingAddress: form.shippingAddress,
      }).unwrap();
      toast.success("Draft order created successfully!");
      // }
    } catch (err) {
      console.error(err);
      toast.error("Error creating draft order");
    }
  };

  // ── Edit mode: handlers ───────────────────────────────────────────────────

  const addOperation = () => setOperations([...operations, newOperation()]);
  const removeOperation = (id: string) =>
    setOperations(operations.filter((o) => o.id !== id));
  const updateOperation = (id: string, updates: Partial<EditOperation>) =>
    setOperations(
      operations.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );

  const buildEditBody = () => {
    const body: any = {};
    if (editEmail.trim()) body.email = editEmail.trim();
    const parsedTags = editTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parsedTags.length) body.tags = parsedTags;
    const hasAddr = Object.values(editAddr).some((v) => v?.trim());
    if (hasAddr) {
      const filteredAddr: any = {};
      Object.entries(editAddr).forEach(([k, v]) => {
        if ((v as string)?.trim()) filteredAddr[k] = (v as string).trim();
      });
      body.shippingAddress = filteredAddr;
    }
    const validAttrs = customAttrs.filter((a) => a.key.trim());
    if (validAttrs.length) body.customAttributes = validAttrs;
    return body;
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrderId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }
    try {
      await updateOrder({
        orderId: editOrderId.trim(),
        store: selectedStore,
        ...buildEditBody(),
      }).unwrap();
      toast.success("Order updated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraftOrderId.trim()) {
      toast.error("Please enter a Draft Order ID");
      return;
    }
    try {
      await updateDraftOrder({
        draftOrderId: editDraftOrderId.trim(),
        store: selectedStore,
        ...buildEditBody(),
      }).unwrap();
      toast.success("Draft order updated successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDraftLineItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraftOrderId.trim()) {
      toast.error("Please select a draft order first.");
      return;
    }

    // Build the merged line items payload:
    // - Existing variant items (qty=0 tells backend to remove)
    // - New items added by user (qty>0 only)
    // - Custom items are intentionally omitted — backend keeps them unchanged
    const lineItems: Array<{ variantId?: string; quantity: number }> = [
      ...draftVariantItems.map((li) => ({
        variantId: li.variantId,
        quantity: li.pendingRemove ? 0 : li.quantity,
      })),
      ...draftNewItems
        .filter((li) => li.quantity > 0 && li.variantId)
        .map((li) => ({ variantId: li.variantId, quantity: li.quantity })),
    ];

    if (lineItems.length === 0) {
      toast.error("No line item changes to save.");
      return;
    }

    const result = await updateDraftOrder({
      draftOrderId: editDraftOrderId.trim(),
      store: selectedStore,
      lineItems,
    });

    if ("error" in result) {
      console.error("Failed to update draft line items:", result.error);
      toast.error("Failed to update line items. Check console for details.");
      return;
    }

    // Sync local state from the response so no re-fetch is needed
    const updatedEdges: any[] = result.data?.data?.lineItems?.edges ?? [];
    setDraftVariantItems(
      updatedEdges
        .filter((edge: any) => edge.node?.variant?.id)
        .map((edge: any, i: number) => ({
          key: `${edge.node.variant.id}_${i}`,
          variantId: edge.node.variant.id,
          title: edge.node.title ?? "",
          quantity: edge.node.quantity ?? 0,
          pendingRemove: false,
        })),
    );
    setDraftNewItems([]);
    toast.success("Draft order line items updated successfully!");
  };

  const handleEditLineItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrderId.trim()) {
      toast.error("Please enter an Order ID");
      return;
    }
    const filledOperations = operations.filter((op) => {
      if (op.type === "addVariant") return op.variantId.trim() !== "";
      if (op.type === "setQuantity") return op.lineItemId.trim() !== "";
      if (op.type === "addDiscount")
        return op.lineItemId.trim() !== "" && op.discountValue.trim() !== "";
      return false;
    });
    const ops = filledOperations.map((op) => {
      const base: any = { type: op.type };
      if (op.type === "addVariant") {
        base.variantId = op.variantId;
        base.quantity = op.quantity;
        if (op.allowDuplicates) base.allowDuplicates = true;
      } else if (op.type === "setQuantity") {
        base.lineItemId = op.lineItemId;
        base.quantity = op.quantity;
        if (op.restock) base.restock = true;
      } else if (op.type === "addDiscount") {
        base.lineItemId = op.lineItemId;
        const disc: any = {};
        if (op.discountDescription.trim())
          disc.description = op.discountDescription.trim();
        if (op.discountType === "percent") {
          disc.percentValue = parseFloat(op.discountValue);
        } else {
          disc.fixedValue = {
            amount: parseFloat(op.discountValue),
            currencyCode: op.discountCurrencyCode,
          };
        }
        base.discount = disc;
      }
      return base;
    });
    // Silently append setQuantity→0 for each item marked for removal
    const removalOps = Array.from(removedLineItemIds).map((lineItemId) => ({
      type: "setQuantity",
      lineItemId,
      quantity: 0,
    }));
    const allOps = [...ops, ...removalOps];
    if (allOps.length === 0) {
      toast.error("No operations to apply.");
      return;
    }
    try {
      await editOrderMutation({
        orderId: editOrderId.trim(),
        store: selectedStore,
        operations: allOps,
        notifyCustomer,
        staffNote: staffNote.trim() || undefined,
      }).unwrap();
      setRemovedLineItemIds(new Set());
      setOperations([newOperation()]);
      refetchLineItems();
      toast.success("Order edited successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // ── Shared address fields renderer ────────────────────────────────────────
  const addr = form.shippingAddress;

  const renderEditAddressFields = (
    addrState: typeof editAddr,
    onChange: (field: keyof Address, val: string) => void,
  ) => (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}
    >
      {(
        [
          {
            field: "firstName",
            label: "First Name",
            placeholder: "e.g., John",
          },
          { field: "lastName", label: "Last Name", placeholder: "e.g., Doe" },
          {
            field: "address1",
            label: "Address Line 1",
            placeholder: "e.g., 123 Main St",
          },
          {
            field: "address2",
            label: "Address Line 2",
            placeholder: "Apt, suite, etc.",
          },
          { field: "city", label: "City", placeholder: "e.g., New York" },
          {
            field: "zip",
            label: "ZIP / Postal Code",
            placeholder: "e.g., 10001",
          },
          {
            field: "provinceCode",
            label: "Province / State Code",
            placeholder: "e.g., NY",
          },
          {
            field: "countryCode",
            label: "Country Code",
            placeholder: "e.g., US",
          },
          {
            field: "company",
            label: "Company",
            placeholder: "e.g., Acme Inc.",
          },
          {
            field: "phone",
            label: "Phone",
            placeholder: "e.g., +1 555 000 0000",
          },
        ] as { field: keyof Address; label: string; placeholder: string }[]
      ).map(({ field, label, placeholder }) => (
        <div key={field} style={fieldWrap}>
          <label style={labelStyle}>{label}</label>
          <input
            style={inputStyle}
            placeholder={placeholder}
            value={(addrState as any)[field] ?? ""}
            onChange={(e) => onChange(field, e.target.value)}
          />
        </div>
      ))}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const modeConfig: Record<FormMode, { title: string; subtitle: string }> = {
    create: {
      title: "Create Order",
      subtitle: "Fill in the details to create a new Shopify order",
    },
    editOrder: {
      title: "Edit Order",
      subtitle: "Update details or edit line items on an existing order",
    },
    editDraft: {
      title: "Edit Draft Order",
      subtitle: "Update details on an existing draft order",
    },
    createProduct: {
      title: "Create Product",
      subtitle: "Create a new Shopify product with a variant",
    },
  };

  return (
    <div
      style={{
        background: "#fff",
        width: "100%",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          padding: "24px 28px 0",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
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
                {modeConfig[mode].title}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.78)",
                  fontSize: "13px",
                  marginTop: "2px",
                }}
              >
                {modeConfig[mode].subtitle}
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

        {/* Mode Tabs */}
        <div style={{ display: "flex", gap: "4px" }}>
          {(
            [
              { key: "create", label: "Create Order" },
              { key: "editOrder", label: "Edit Order" },
              { key: "editDraft", label: "Edit Draft" },
              // { key: "createProduct", label: "Create Product" },
            ] as { key: FormMode; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: "8px 18px",
                border: "none",
                borderRadius: "8px 8px 0 0",
                fontSize: "13px",
                fontWeight: mode === key ? 700 : 500,
                cursor: "pointer",
                background: mode === key ? "#fff" : "rgba(255,255,255,0.15)",
                color: mode === key ? "#4f46e5" : "rgba(255,255,255,0.85)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          CREATE ORDER MODE
      ════════════════════════════════════════════════ */}
      {mode === "create" && (
        <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
          {/* Order Search */}
          <div style={{ marginBottom: "24px" }} ref={orderSearchRef}>
            <label style={labelStyle}>Import from Existing Order</label>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={orderSearchInput}
                  onChange={handleOrderSearchChange}
                  onFocus={() => orderSearchInput && setShowOrderDropdown(true)}
                  placeholder="Search by Order ID to auto-fill fields..."
                  style={{
                    ...inputStyle,
                    paddingLeft: "40px",
                    borderColor: showOrderDropdown ? "#6366f1" : "#e5e7eb",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: "13px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                    display: "flex",
                  }}
                >
                  {isOrderSearching ? (
                    <CircularProgress size={16} />
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )}
                </span>
              </div>
              {showOrderDropdown && orderSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1.5px solid #e5e7eb",
                    borderRadius: "10px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    zIndex: 999,
                    maxHeight: "220px",
                    overflowY: "auto",
                    padding: "6px",
                  }}
                >
                  {/* Deduplicate by order_id — show one row per unique order */}
                  {Array.from(
                    new Map(
                      orderSuggestions.map((o: any) => [o.order_id, o]),
                    ).values(),
                  ).map((order: any) => (
                    <div
                      key={order.order_id}
                      onClick={() => handleSelectOrder(order)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#111827",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "#f5f3ff";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.background =
                          "transparent";
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#4f46e5" }}>
                        #{order.order_id}
                      </span>
                      {order.customer_email && (
                        <span style={{ marginLeft: "10px", color: "#6b7280" }}>
                          {order.customer_email}
                        </span>
                      )}
                      {order.phone_no && (
                        <span
                          style={{
                            marginLeft: "10px",
                            color: "#9ca3af",
                            fontSize: "12px",
                          }}
                        >
                          {order.phone_no}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {showOrderDropdown &&
                !isOrderSearching &&
                orderSearchFilter &&
                orderSuggestions.length === 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "10px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                      zIndex: 999,
                      padding: "14px 16px",
                      fontSize: "13px",
                      color: "#9ca3af",
                      textAlign: "center",
                    }}
                  >
                    No orders found
                  </div>
                )}
            </div>
          </div>

          {/* Store + Email */}
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
                selectedLabel={selectedStoreOption.label}
                onChange={(opt) => setSelectedStoreOption(opt)}
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

          {/* Reason Code + Wash Whole Unit */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "16px",
              alignItems: "end",
              marginBottom: "20px",
            }}
          >
            <div style={fieldWrap}>
              <label style={labelStyle}>Reason Code</label>
              <SearchableDropdown
                value={selectedReasonCode}
                onChange={setSelectedReasonCode}
                options={reasonCodeOptions}
                placeholder="— select reason code —"
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                paddingBottom: "2px",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => {
                setWashWholeUnit((p) => {
                  const next = !p;
                  if (next) {
                    setForm((prev) => ({
                      ...prev,
                      lineItems: prev.lineItems.map((item) => ({
                        ...item,
                        parts: [],
                      })),
                    }));
                  }
                  return next;
                });
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: `2px solid ${washWholeUnit ? "#6366f1" : "#d1d5db"}`,
                  background: washWholeUnit ? "#6366f1" : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {washWholeUnit && (
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                Wash Whole Unit
              </span>
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ ...labelStyle, marginBottom: "10px" }}>
              Line Items *
            </label>

            {/* Dropdown to pick a line item from the selected order */}
            {availableLineItems.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    if (!isNaN(idx)) {
                      handleAddLineItemFromDropdown(availableLineItems[idx]);
                      e.target.value = "";
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: "1.5px solid #a5b4fc",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "#374151",
                    background: "#f5f3ff",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled>
                    — select line item to add —
                  </option>
                  {availableLineItems.map((row, i) => (
                    <option key={i} value={i}>
                      {[row.item_no, row.lot_no].filter(Boolean).join(" / ")}
                      {row.description ? ` — ${row.description}` : ""}
                      {row.quantity != null ? ` — Qty: ${row.quantity}` : ""}
                      {row.unit_price != null ? ` — $${row.unit_price}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.lineItems.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1.5px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  marginBottom: "10px",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                }}
              >
                {/* Row header: line number badge + remove */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#6366f1",
                      background: "#ede9fe",
                      borderRadius: "4px",
                      padding: "2px 8px",
                    }}
                  >
                    Line {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLineItemProductIds((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                      setForm((prev) => ({
                        ...prev,
                        lineItems: prev.lineItems.filter((_, i) => i !== index),
                      }));
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ef4444",
                      fontSize: "18px",
                      lineHeight: 1,
                      padding: "0 2px",
                    }}
                    title="Remove line item"
                  >
                    ×
                  </button>
                </div>

                {/* Product + Variant selectors */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: productHasVariantChoice(
                      lineItemProductIds[index],
                    )
                      ? "1fr 1fr"
                      : "1fr",
                    gap: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Product
                    </span>
                    <select
                      value={lineItemProductIds[index] ?? ""}
                      onChange={(e) => {
                        const productId = e.target.value || null;
                        setLineItemProductIds((prev) => {
                          const next = [...prev];
                          next[index] = productId;
                          return next;
                        });
                        if (productId && products) {
                          const product = products.find(
                            (p) => p.id === productId,
                          );
                          if (product) {
                            const variants = product.variants.edges;
                            const autoVariant =
                              variants.length === 1 ||
                              variants[0]?.node.title === "Default Title"
                                ? (variants[0]?.node.id ?? "")
                                : "";
                            handleLineItemChange(
                              index,
                              "variantId",
                              autoVariant,
                            );
                          }
                        } else {
                          handleLineItemChange(index, "variantId", "");
                        }
                      }}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      <option value="">— select product —</option>
                      {(products ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {productHasVariantChoice(lineItemProductIds[index]) && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Variant
                      </span>
                      <select
                        value={item.variantId}
                        onChange={(e) =>
                          handleLineItemChange(
                            index,
                            "variantId",
                            e.target.value,
                          )
                        }
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        <option value="">— select variant —</option>
                        {getProductVariants(lineItemProductIds[index]).map(
                          (v) => (
                            <option key={v.id} value={v.id}>
                              {v.title}
                              {v.sku ? ` (${v.sku})` : ""} · ${v.price}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Description — full width */}
                {item.description && (
                  <div style={{ marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Description
                    </span>
                    <div
                      style={{
                        padding: "8px 12px",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: "#111827",
                        background: "#f9fafb",
                      }}
                    >
                      {item.description}
                    </div>
                  </div>
                )}

                {/* Info fields + Quantity: single row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr) 90px",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Item No
                    </span>
                    {item.item_no ? (
                      <div
                        style={{
                          padding: "8px 12px",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "#111827",
                          background: "#f9fafb",
                        }}
                      >
                        {item.item_no}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item.item_no ?? ""}
                        onChange={(e) =>
                          handleLineItemChange(
                            index,
                            "item_no",
                            e.target.value || undefined,
                          )
                        }
                        placeholder="Enter item no"
                        style={{
                          ...inputStyle,
                          fontSize: "13px",
                          padding: "8px 12px",
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Lot No
                    </span>
                    <input
                      type="text"
                      value={item.lot_no ?? ""}
                      onChange={(e) =>
                        handleLineItemChange(
                          index,
                          "lot_no",
                          e.target.value || null,
                        )
                      }
                      placeholder="Enter lot no"
                      style={{
                        ...inputStyle,
                        fontSize: "13px",
                        padding: "8px 12px",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Unit Price
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unit_price ?? ""}
                      disabled={washWholeUnit}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        handleLineItemChange(
                          index,
                          "unit_price",
                          isNaN(v) ? null : v,
                        );
                      }}
                      placeholder="0.00"
                      style={{
                        ...inputStyle,
                        fontSize: "13px",
                        padding: "8px 12px",
                        ...(washWholeUnit
                          ? { background: "#f3f4f6", color: "#9ca3af", cursor: "not-allowed" }
                          : item.unit_price == null || Number(item.unit_price) === 0
                          ? { borderColor: "#f59e0b", background: "#fffbeb" }
                          : {}),
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Line Amount
                    </span>
                    <div
                      style={{
                        padding: "8px 12px",
                        border: "1.5px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "13px",
                        color: item.unit_price != null ? "#047857" : "#9ca3af",
                        background:
                          item.unit_price != null ? "#f0fdf4" : "#f9fafb",
                        fontWeight: item.unit_price != null ? 600 : 400,
                      }}
                    >
                      {item.unit_price != null
                        ? `$${(Number(item.unit_price) * item.quantity).toFixed(2)}`
                        : "—"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                      }}
                    >
                      Qty
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={item.quantity}
                      disabled={washWholeUnit}
                      onKeyDown={(e) => {
                        if (/^[0-9]$/.test(e.key))
                          (e.target as HTMLInputElement).select();
                      }}
                      onChange={(e) => {
                        const parsed = parseInt(e.target.value, 10);
                        if (isNaN(parsed)) return;
                        const clamped = Math.min(5, Math.max(1, parsed));
                        handleLineItemChange(index, "quantity", clamped);
                      }}
                      required
                      placeholder="Qty"
                      style={{
                        ...inputStyle,
                        ...(washWholeUnit
                          ? {
                              background: "#f3f4f6",
                              color: "#9ca3af",
                              cursor: "not-allowed",
                            }
                          : {}),
                      }}
                    />
                  </div>
                </div>

                {/* Reason Code — only on line item when it has no parts */}
                {(!item.parts || item.parts.length === 0) && (
                  <div style={{ marginTop: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#6b7280",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      Reason Code
                    </span>
                    <SearchableDropdown
                      value={item.reason_code ?? ""}
                      onChange={(val) =>
                        handleLineItemChange(
                          index,
                          "reason_code",
                          val || undefined,
                        )
                      }
                      options={lineReasonCodeOptions}
                      placeholder="— select reason code —"
                    />
                  </div>
                )}

                <PartsSubSection
                  item_no={item.item_no}
                  lot_no={item.lot_no}
                  parts={item.parts ?? []}
                  onChange={(parts) =>
                    handleLineItemChange(index, "parts", parts)
                  }
                  unitPriceLocked={washWholeUnit}
                  reasonCodeOptions={lineReasonCodeOptions}
                />
              </div>
            ))}
            {availableLineItems.length === 0 && (
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
            )}
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
                    handleAddressChange(
                      "shippingAddress",
                      "firstName",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "lastName",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "address1",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "address2",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "city",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "zip",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "provinceCode",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "countryCode",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "company",
                      e.target.value,
                    )
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
                    handleAddressChange(
                      "shippingAddress",
                      "phone",
                      e.target.value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <ResultBox
            data={data}
            error={error}
            adminUrl={
              data?.data?.id && selectedStoreOption.handle
                ? `https://admin.shopify.com/store/${selectedStoreOption.handle}/orders/${data.data.id.split("/").pop()}`
                : undefined
            }
          />
          <ResultBox
            data={draftData}
            error={draftError}
            successColor="#0369a1"
            successBg="#f0f9ff"
            adminUrl={
              draftData?.data?.id && selectedStoreOption.handle
                ? `https://admin.shopify.com/store/${selectedStoreOption.handle}/draft_orders/${draftData.data.id.split("/").pop()}`
                : undefined
            }
          />

          {/* Footer */}
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
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={isLoading || isDraftLoading}
                style={{
                  padding: "10px 28px",
                  border: "none",
                  borderRadius: "8px",
                  background:
                    isLoading || isDraftLoading
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#fff",
                  cursor:
                    isLoading || isDraftLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                {isLoading || isDraftLoading
                  ? "Submitting..."
                  : "+ Create Draft Order"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════════════
          EDIT ORDER MODE
      ════════════════════════════════════════════════ */}
      {mode === "editOrder" && (
        <div style={{ padding: "28px" }}>
          {/* Order ID + Store */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={fieldWrap}>
              <label style={labelStyle}>Order ID *</label>
              <Autocomplete
                options={editOrderSuggestions}
                loading={isEditOrderSearching}
                getOptionLabel={(o: any) =>
                  o.name || o.id?.split("/").pop() || ""
                }
                isOptionEqualToValue={(o: any, v: any) => o.id === v.id}
                filterOptions={(x) => x}
                value={editSelectedOrder}
                inputValue={editSearchInput}
                onInputChange={(_, val, reason) => {
                  if (reason === "input") {
                    setEditSearchInput(val);
                    if (editSearchDebounceRef.current)
                      clearTimeout(editSearchDebounceRef.current);
                    editSearchDebounceRef.current = setTimeout(() => {
                      setEditSearchFilter(buildShopifyQuery(val));
                    }, 400);
                  }
                }}
                onChange={(_, selected) => {
                  setEditSelectedOrder(selected);
                  if (selected) {
                    handleSelectEditOrder(selected, false);
                  } else {
                    setEditOrderId("");
                    setLoadLineItemsOrderId("");
                    setEditSearchInput("");
                    setEditSearchFilter(undefined);
                    setEditEmail("");
                    setEditTags("");
                    setEditAddr({ ...defaultAddress });
                    setRemovedLineItemIds(new Set());
                    setOperations([newOperation()]);
                    resetEditOrder();
                  }
                }}
                renderOption={(props, option: any) => {
                  const { key, ...liProps } = props as any;
                  const numericId = option.id?.split("/").pop() || "";
                  return (
                    <li key={key} {...liProps} style={{ padding: "6px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#4f46e5",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {option.name}
                        </span>
                        <span
                          style={{
                            color: "#9ca3af",
                            fontSize: "11px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          #{numericId}
                        </span>
                        {option.email && (
                          <span
                            style={{
                              color: "#6b7280",
                              fontSize: "11px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {option.email}
                          </span>
                        )}
                        {option.shippingAddress?.firstName && (
                          <span
                            style={{
                              color: "#9ca3af",
                              fontSize: "11px",
                              whiteSpace: "nowrap",
                              marginLeft: "auto",
                            }}
                          >
                            {option.shippingAddress.firstName}{" "}
                            {option.shippingAddress.lastName}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by order # or email…"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "14px",
                        "& fieldset": {
                          borderColor: editOrderId ? "#6366f1" : "#e5e7eb",
                        },
                      },
                    }}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isEditOrderSearching && (
                              <CircularProgress color="inherit" size={14} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
              <span
                style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}
              >
                Type order # (e.g. 1001) or email to search
              </span>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Store *</label>
              <StoreDropdown
                selectedLabel={selectedStoreOption.label}
                onChange={(opt) => setSelectedStoreOption(opt)}
                options={STORE_OPTIONS}
              />
            </div>
          </div>

          {/* Sub-tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              borderBottom: "2px solid #f3f4f6",
              marginBottom: "24px",
            }}
          >
            {(
              [
                { key: "details", label: "Update Details" },
                { key: "lineItems", label: "Edit Line Items" },
              ] as { key: EditSubTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setEditSubTab(key)}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderBottom:
                    editSubTab === key
                      ? "2px solid #4f46e5"
                      : "2px solid transparent",
                  marginBottom: "-2px",
                  background: "none",
                  fontSize: "13px",
                  fontWeight: editSubTab === key ? 700 : 500,
                  color: editSubTab === key ? "#4f46e5" : "#6b7280",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Update Details sub-tab ── */}
          {editSubTab === "details" && (
            <form onSubmit={handleUpdateOrder}>
              <div style={{ ...fieldWrap, marginBottom: "20px" }}>
                <label style={labelStyle}>
                  Email{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="New email address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div style={{ ...fieldWrap, marginBottom: "20px" }}>
                <label style={labelStyle}>
                  Tags{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional, comma-separated)
                  </span>
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="e.g. wholesale, priority, vip"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>

              {/* Custom Attributes */}
              {/* <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <label style={labelStyle}>
                    Custom Attributes{" "}
                    <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={addCustomAttr}
                    style={{
                      padding: "5px 12px",
                      border: "1.5px dashed #a5b4fc",
                      borderRadius: "6px",
                      background: "#f5f3ff",
                      color: "#4f46e5",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    + Add
                  </button>
                </div>
                {customAttrs.length === 0 && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#9ca3af",
                      padding: "10px 0",
                    }}
                  >
                    No attributes added yet.
                  </div>
                )}
                {customAttrs.map((attr, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr auto",
                      gap: "10px",
                      marginBottom: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      style={inputStyle}
                      placeholder="Key"
                      value={attr.key}
                      onChange={(e) =>
                        updateCustomAttr(i, "key", e.target.value)
                      }
                    />
                    <input
                      style={inputStyle}
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) =>
                        updateCustomAttr(i, "value", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomAttr(i)}
                      style={{
                        padding: "8px 12px",
                        border: "1.5px solid #fca5a5",
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#dc2626",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div> */}

              {/* Shipping Address */}
              <div
                style={{
                  // borderTop: "1px solid #f3f4f6",
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
                  Shipping Address{" "}
                  <span
                    style={{
                      textTransform: "none",
                      fontWeight: 400,
                      color: "#9ca3af",
                    }}
                  >
                    (fill only fields to change)
                  </span>
                </div>
                {renderEditAddressFields(editAddr, (field, val) =>
                  setEditAddr((p) => ({ ...p, [field]: val })),
                )}
              </div>

              <ResultBox
                data={updateData}
                error={updateError}
                adminUrl={
                  updateData?.data?.id && selectedStoreOption.handle
                    ? `https://admin.shopify.com/store/${selectedStoreOption.handle}/orders/${updateData.data.id.split("/").pop()}`
                    : undefined
                }
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={isUpdating}
                  style={{
                    padding: "10px 28px",
                    border: "none",
                    borderRadius: "8px",
                    background: isUpdating
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#fff",
                    cursor: isUpdating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}

          {/* ── Edit Line Items sub-tab ── */}
          {editSubTab === "lineItems" && (
            <form onSubmit={handleEditLineItems}>
              {/* Line items auto-load when order is selected */}
              {isLoadingLineItems && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    color: "#9ca3af",
                    fontSize: "13px",
                  }}
                >
                  <CircularProgress size={14} />
                  Loading line items…
                </div>
              )}
              {!editOrderId.trim() &&
                !isLoadingLineItems &&
                existingLineItems.length === 0 && (
                  <div
                    style={{
                      marginBottom: "16px",
                      fontSize: "13px",
                      color: "#9ca3af",
                    }}
                  >
                    Select an order above to load its line items.
                  </div>
                )}

              {existingLineItems.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "10px",
                    }}
                  >
                    Loaded Line Items — click × to remove
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {existingLineItems.map((item) => {
                      const pendingRemove = removedLineItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "7px 10px 7px 12px",
                            borderRadius: "8px",
                            border: `1.5px solid ${pendingRemove ? "#fca5a5" : "#e5e7eb"}`,
                            background: pendingRemove ? "#fff7f7" : "#fafafa",
                            fontSize: "13px",
                            opacity: pendingRemove ? 0.7 : 1,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: pendingRemove ? "#dc2626" : "#111827",
                                textDecoration: pendingRemove
                                  ? "line-through"
                                  : "none",
                              }}
                            >
                              {item.title}
                            </span>
                            {item.sku && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  color: "#9ca3af",
                                  fontSize: "11px",
                                }}
                              >
                                SKU: {item.sku}
                              </span>
                            )}
                            <span
                              style={{
                                marginLeft: "8px",
                                color: "#6b7280",
                                fontSize: "12px",
                              }}
                            >
                              × {item.quantity}
                            </span>
                          </div>
                          <button
                            type="button"
                            title={
                              pendingRemove ? "Undo removal" : "Remove item"
                            }
                            onClick={() => {
                              setRemovedLineItemIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                              });
                            }}
                            style={{
                              width: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${pendingRemove ? "#fca5a5" : "#d1d5db"}`,
                              borderRadius: "50%",
                              background: pendingRemove ? "#fee2e2" : "#f3f4f6",
                              color: pendingRemove ? "#dc2626" : "#6b7280",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 700,
                              lineHeight: 1,
                              flexShrink: 0,
                            }}
                          >
                            {pendingRemove ? "↩" : "×"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <label style={labelStyle}>Operations</label>
                  <button
                    type="button"
                    onClick={addOperation}
                    style={{
                      padding: "5px 12px",
                      border: "1.5px dashed #a5b4fc",
                      borderRadius: "6px",
                      background: "#f5f3ff",
                      color: "#4f46e5",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    + Add Operation
                  </button>
                </div>

                {operations.map((op, idx) => (
                  <div
                    key={op.id}
                    style={{
                      border: "1.5px solid #e5e7eb",
                      borderRadius: "10px",
                      padding: "16px",
                      marginBottom: "12px",
                      background: "#fafafa",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "14px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Operation #{idx + 1}
                      </span>
                      {operations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOperation(op.id)}
                          style={{
                            padding: "4px 10px",
                            border: "1.5px solid #fca5a5",
                            borderRadius: "6px",
                            background: "#fff",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Type selector */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "180px 1fr",
                        gap: "12px",
                        alignItems: "start",
                      }}
                    >
                      <div style={fieldWrap}>
                        <label style={labelStyle}>Type</label>
                        <CustomDropdown
                          value={op.type}
                          onChange={(v) =>
                            updateOperation(op.id, { type: v as OpType })
                          }
                          options={[
                            { value: "addVariant", label: "Add Variant" },
                            { value: "setQuantity", label: "Set Quantity" },
                            { value: "addDiscount", label: "Add Discount" },
                          ]}
                        />
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(180px, 1fr))",
                          gap: "12px",
                        }}
                      >
                        {/* addVariant fields */}
                        {op.type === "addVariant" && (
                          <>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Variant *</label>
                              <Autocomplete
                                options={variantOptions}
                                loading={productsLoading}
                                getOptionKey={(o) => o.variantId}
                                getOptionLabel={(o) => o.label}
                                isOptionEqualToValue={(o, v) =>
                                  o.variantId === v.variantId
                                }
                                value={
                                  variantOptions.find(
                                    (o) => o.variantId === op.variantId,
                                  ) ?? null
                                }
                                onChange={(_, sel) =>
                                  updateOperation(op.id, {
                                    variantId: sel?.variantId ?? "",
                                  })
                                }
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Search variant..."
                                    size="small"
                                    sx={{
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        "& fieldset": {
                                          borderColor: "#e5e7eb",
                                        },
                                      },
                                    }}
                                    slotProps={{
                                      input: {
                                        ...params.InputProps,
                                        endAdornment: (
                                          <>
                                            {productsLoading && (
                                              <CircularProgress
                                                color="inherit"
                                                size={14}
                                              />
                                            )}
                                            {params.InputProps.endAdornment}
                                          </>
                                        ),
                                      },
                                    }}
                                  />
                                )}
                              />
                            </div>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Quantity *</label>
                              <input
                                type="number"
                                min={1}
                                value={op.quantity}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    quantity: parseInt(e.target.value, 10) || 1,
                                  })
                                }
                                style={inputStyle}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                paddingTop: "22px",
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`dup-${op.id}`}
                                checked={op.allowDuplicates}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    allowDuplicates: e.target.checked,
                                  })
                                }
                              />
                              <label
                                htmlFor={`dup-${op.id}`}
                                style={{ fontSize: "13px", color: "#374151" }}
                              >
                                Allow duplicates
                              </label>
                            </div>
                          </>
                        )}

                        {/* setQuantity fields */}
                        {op.type === "setQuantity" && (
                          <>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Line Item *</label>
                              {existingLineItems.length > 0 ? (
                                <CustomDropdown
                                  value={op.lineItemId}
                                  onChange={(v) =>
                                    updateOperation(op.id, { lineItemId: v })
                                  }
                                  placeholder="— select line item —"
                                  options={existingLineItems.map((li) => ({
                                    value: li.id,
                                    label: `${li.title}${li.sku ? ` (${li.sku})` : ""} · qty ${li.quantity}`,
                                  }))}
                                />
                              ) : (
                                <input
                                  style={inputStyle}
                                  placeholder="Load order first or paste LineItem ID"
                                  value={op.lineItemId}
                                  onChange={(e) =>
                                    updateOperation(op.id, {
                                      lineItemId: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>
                                New Quantity *{" "}
                                <span
                                  style={{ color: "#9ca3af", fontWeight: 400 }}
                                >
                                  (0 = remove)
                                </span>
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={op.quantity}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    quantity: parseInt(e.target.value, 10) || 0,
                                  })
                                }
                                style={inputStyle}
                              />
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                paddingTop: "22px",
                              }}
                            >
                              <input
                                type="checkbox"
                                id={`restock-${op.id}`}
                                checked={op.restock}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    restock: e.target.checked,
                                  })
                                }
                              />
                              <label
                                htmlFor={`restock-${op.id}`}
                                style={{ fontSize: "13px", color: "#374151" }}
                              >
                                Restock inventory
                              </label>
                            </div>
                          </>
                        )}

                        {/* addDiscount fields */}
                        {op.type === "addDiscount" && (
                          <>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Line Item *</label>
                              {existingLineItems.length > 0 ? (
                                <CustomDropdown
                                  value={op.lineItemId}
                                  onChange={(v) =>
                                    updateOperation(op.id, { lineItemId: v })
                                  }
                                  placeholder="— select line item —"
                                  options={existingLineItems.map((li) => ({
                                    value: li.id,
                                    label: `${li.title}${li.sku ? ` (${li.sku})` : ""} · qty ${li.quantity}`,
                                  }))}
                                />
                              ) : (
                                <input
                                  style={inputStyle}
                                  placeholder="Load order first or paste LineItem ID"
                                  value={op.lineItemId}
                                  onChange={(e) =>
                                    updateOperation(op.id, {
                                      lineItemId: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Discount Type</label>
                              <CustomDropdown
                                value={op.discountType}
                                onChange={(v) =>
                                  updateOperation(op.id, {
                                    discountType: v as "percent" | "fixed",
                                  })
                                }
                                options={[
                                  { value: "percent", label: "Percentage" },
                                  { value: "fixed", label: "Fixed Amount" },
                                ]}
                              />
                            </div>
                            <div style={fieldWrap}>
                              <label style={labelStyle}>
                                {op.discountType === "percent"
                                  ? "Percent (0–100)"
                                  : "Amount"}{" "}
                                *
                              </label>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={op.discountValue}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    discountValue: e.target.value,
                                  })
                                }
                                style={inputStyle}
                                placeholder={
                                  op.discountType === "percent"
                                    ? "e.g., 10"
                                    : "e.g., 5.00"
                                }
                              />
                            </div>
                            {op.discountType === "fixed" && (
                              <div style={fieldWrap}>
                                <label style={labelStyle}>Currency Code</label>
                                <input
                                  style={inputStyle}
                                  placeholder="USD"
                                  value={op.discountCurrencyCode}
                                  onChange={(e) =>
                                    updateOperation(op.id, {
                                      discountCurrencyCode: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            )}
                            <div style={fieldWrap}>
                              <label style={labelStyle}>Description</label>
                              <input
                                style={inputStyle}
                                placeholder="e.g., 10% off"
                                value={op.discountDescription}
                                onChange={(e) =>
                                  updateOperation(op.id, {
                                    discountDescription: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commit options */}
              {/* <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr",
                  gap: "20px",
                  alignItems: "start",
                  marginBottom: "20px",
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    id="notify"
                    checked={notifyCustomer}
                    onChange={(e) => setNotifyCustomer(e.target.checked)}
                  />
                  <label
                    htmlFor="notify"
                    style={{
                      fontSize: "13px",
                      color: "#374151",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Notify customer
                  </label>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>
                    Staff Note{" "}
                    <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="Internal note for this edit..."
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                  />
                </div>
              </div> */}

              {/* <ResultBox data={editData} error={editError} /> */}
              {editError && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px",
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fca5a5",
                    borderRadius: "10px",
                    color: "#dc2626",
                    fontSize: "14px",
                  }}
                >
                  <strong>❌ Error editing order:</strong>
                  <br />
                  {typeof editError === "string"
                    ? editError
                    : JSON.stringify(editError, null, 2)}
                </div>
              )}

              {editData && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "16px 20px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: "10px",
                    color: "#166534",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: "12px",
                    }}
                  >
                    ✅ Order edited and committed successfully!
                  </div>

                  {editData.order?.id && (
                    <a
                      href={`https://admin.shopify.com/store/${selectedStoreOption.handle}/orders/${editData.order.id.split("/").pop()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#2563eb",
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "14px",
                        padding: "8px 16px",
                        background: "#eff6ff",
                        borderRadius: "8px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      🔗 View Order in Shopify Admin
                      <span style={{ fontSize: "13px" }}>
                        #
                        {editData.order.name ||
                          editData.order.id.split("/").pop()}
                      </span>
                    </a>
                  )}

                  {editData.operations_applied &&
                    editData.operations_applied.length > 0 && (
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "13px",
                          color: "#15803d",
                        }}
                      >
                        Operations applied: {editData.operations_applied.length}
                      </div>
                    )}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={isEditing}
                  style={{
                    padding: "10px 28px",
                    border: "none",
                    borderRadius: "8px",
                    background: isEditing
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#fff",
                    cursor: isEditing ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {isEditing ? "Applying..." : "Apply Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          EDIT DRAFT MODE
      ════════════════════════════════════════════════ */}
      {mode === "editDraft" && (
        <div style={{ padding: "28px" }}>
          {/* Draft Order ID + Store */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div style={fieldWrap}>
              <label style={labelStyle}>Draft Order ID *</label>
              <Autocomplete
                options={draftOrderSuggestions}
                loading={isDraftOrderSearching}
                getOptionLabel={(o: any) =>
                  o.name || o.id?.split("/").pop() || ""
                }
                isOptionEqualToValue={(o: any, v: any) => o.id === v.id}
                filterOptions={(x) => x}
                value={draftSelectedOrder}
                inputValue={draftSearchInput}
                onInputChange={(_, val, reason) => {
                  if (reason === "input") {
                    setDraftSearchInput(val);
                    if (draftSearchDebounceRef.current)
                      clearTimeout(draftSearchDebounceRef.current);
                    draftSearchDebounceRef.current = setTimeout(() => {
                      setDraftSearchFilter(buildShopifyQuery(val));
                    }, 400);
                  }
                }}
                onChange={(_, selected) => {
                  setDraftSelectedOrder(selected);
                  if (selected) {
                    handleSelectDraftOrder(selected);
                  } else {
                    setEditDraftOrderId("");
                    setDraftSearchInput("");
                    setDraftSearchFilter(undefined);
                    setEditEmail("");
                    setEditAddr({ ...defaultAddress });
                    setLoadDraftLineItemsId("");
                    setDraftVariantItems([]);
                    setDraftCustomItems([]);
                    setDraftNewItems([]);
                    resetUpdateDraft();
                  }
                }}
                renderOption={(props, option: any) => {
                  const { key, ...liProps } = props as any;
                  const numericId = option.id?.split("/").pop() || "";
                  return (
                    <li key={key} {...liProps}>
                      <span style={{ fontWeight: 600, color: "#4f46e5" }}>
                        {option.name}
                      </span>
                      <span
                        style={{
                          marginLeft: "8px",
                          color: "#9ca3af",
                          fontSize: "12px",
                        }}
                      >
                        #{numericId}
                      </span>
                      {option.email && (
                        <span
                          style={{
                            marginLeft: "10px",
                            color: "#6b7280",
                            fontSize: "12px",
                          }}
                        >
                          {option.email}
                        </span>
                      )}
                      {option.shippingAddress?.firstName && (
                        <span
                          style={{
                            marginLeft: "10px",
                            color: "#9ca3af",
                            fontSize: "12px",
                          }}
                        >
                          {option.shippingAddress.firstName}{" "}
                          {option.shippingAddress.lastName}
                        </span>
                      )}
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by draft order # or email…"
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        fontSize: "14px",
                        "& fieldset": {
                          borderColor: editDraftOrderId ? "#6366f1" : "#e5e7eb",
                        },
                      },
                    }}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {isDraftOrderSearching && (
                              <CircularProgress color="inherit" size={14} />
                            )}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
              <span
                style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}
              >
                Type draft order # (e.g. D1) or email to search
              </span>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Store *</label>
              <StoreDropdown
                selectedLabel={selectedStoreOption.label}
                onChange={(opt) => setSelectedStoreOption(opt)}
                options={STORE_OPTIONS}
              />
            </div>
          </div>

          {/* ── Sub-tabs ── */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              borderBottom: "2px solid #f3f4f6",
              marginBottom: "24px",
            }}
          >
            {(
              [
                { key: "details", label: "Update Details" },
                { key: "lineItems", label: "Edit Line Items" },
              ] as { key: DraftSubTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDraftSubTab(key)}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderBottom:
                    draftSubTab === key
                      ? "2px solid #4f46e5"
                      : "2px solid transparent",
                  marginBottom: "-2px",
                  background: "none",
                  fontSize: "13px",
                  fontWeight: draftSubTab === key ? 700 : 500,
                  color: draftSubTab === key ? "#4f46e5" : "#6b7280",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Update Details sub-tab ── */}
          {draftSubTab === "details" && (
            <form onSubmit={handleUpdateDraft}>
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>
                  Email{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="New email address"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>
                  Tags{" "}
                  <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                    (optional, comma-separated)
                  </span>
                </label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="e.g. wholesale, priority, vip"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
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
                  Shipping Address{" "}
                  <span
                    style={{
                      textTransform: "none",
                      fontWeight: 400,
                      color: "#9ca3af",
                    }}
                  >
                    (fill only fields to change)
                  </span>
                </div>
                {renderEditAddressFields(editAddr, (field, val) =>
                  setEditAddr((p) => ({ ...p, [field]: val })),
                )}
              </div>

              <ResultBox
                data={updateDraftData}
                error={updateDraftError}
                successColor="#0369a1"
                successBg="#f0f9ff"
                adminUrl={
                  updateDraftData?.data?.id && selectedStoreOption.handle
                    ? `https://admin.shopify.com/store/${selectedStoreOption.handle}/draft_orders/${updateDraftData.data.id.split("/").pop()}`
                    : undefined
                }
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={isDraftUpdating}
                  style={{
                    padding: "10px 28px",
                    border: "none",
                    borderRadius: "8px",
                    background: isDraftUpdating
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#fff",
                    cursor: isDraftUpdating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {isDraftUpdating ? "Saving..." : "Save Draft Changes"}
                </button>
              </div>
            </form>
          )}

          {/* ── Edit Line Items sub-tab ── */}
          {draftSubTab === "lineItems" && (
            <form onSubmit={handleUpdateDraftLineItems}>
              {/* Loading state */}
              {isLoadingDraftLineItems && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    color: "#9ca3af",
                    fontSize: "13px",
                  }}
                >
                  <CircularProgress size={14} />
                  Loading line items…
                </div>
              )}

              {/* Prompt to select order */}
              {!editDraftOrderId.trim() && !isLoadingDraftLineItems && (
                <div
                  style={{
                    marginBottom: "16px",
                    fontSize: "13px",
                    color: "#9ca3af",
                  }}
                >
                  Select a draft order above to load its line items.
                </div>
              )}

              {/* ── Existing variant-based line items ── */}
              {draftVariantItems.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "10px",
                    }}
                  >
                    Existing Items — edit qty or remove
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {draftVariantItems.map((item) => (
                      <div
                        key={item.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 120px auto",
                          gap: "12px",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: `1.5px solid ${item.pendingRemove ? "#fca5a5" : "#e5e7eb"}`,
                          background: item.pendingRemove
                            ? "#fff7f7"
                            : "#fafafa",
                          opacity: item.pendingRemove ? 0.75 : 1,
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: "13px",
                              color: item.pendingRemove ? "#dc2626" : "#111827",
                              textDecoration: item.pendingRemove
                                ? "line-through"
                                : "none",
                            }}
                          >
                            {item.title}
                          </span>
                          <span
                            style={{
                              marginLeft: "8px",
                              fontSize: "11px",
                              color: "#9ca3af",
                            }}
                          >
                            {item.variantId.split("/").pop()}
                          </span>
                        </div>
                        <input
                          type="number"
                          min={1}
                          value={item.pendingRemove ? 0 : item.quantity}
                          disabled={item.pendingRemove}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10);
                            if (!isNaN(qty) && qty >= 1) {
                              setDraftVariantItems((prev) =>
                                prev.map((li) =>
                                  li.key === item.key
                                    ? { ...li, quantity: qty }
                                    : li,
                                ),
                              );
                            }
                          }}
                          style={{
                            ...inputStyle,
                            opacity: item.pendingRemove ? 0.5 : 1,
                          }}
                        />
                        <button
                          type="button"
                          title={
                            item.pendingRemove ? "Undo removal" : "Remove item"
                          }
                          onClick={() =>
                            setDraftVariantItems((prev) =>
                              prev.map((li) =>
                                li.key === item.key
                                  ? { ...li, pendingRemove: !li.pendingRemove }
                                  : li,
                              ),
                            )
                          }
                          style={{
                            padding: "7px 12px",
                            border: `1.5px solid ${item.pendingRemove ? "#a5b4fc" : "#fca5a5"}`,
                            borderRadius: "8px",
                            background: "#fff",
                            color: item.pendingRemove ? "#4f46e5" : "#dc2626",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.pendingRemove ? "↩ Undo" : "✕ Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Custom items (read-only) ── */}
              {draftCustomItems.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "10px",
                    }}
                  >
                    Custom Items{" "}
                    <span
                      style={{
                        textTransform: "none",
                        fontWeight: 400,
                        color: "#9ca3af",
                      }}
                    >
                      (read-only — cannot be edited via this form)
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {draftCustomItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "7px 14px",
                          borderRadius: "8px",
                          border: "1.5px solid #e5e7eb",
                          background: "#f9fafb",
                          fontSize: "13px",
                          color: "#6b7280",
                        }}
                      >
                        {item.title}{" "}
                        <span style={{ color: "#9ca3af" }}>
                          × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── New items ── */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Add New Items
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftNewItems((prev) => [
                        ...prev,
                        {
                          key: Math.random().toString(36).slice(2),
                          variantId: "",
                          title: "",
                          quantity: 1,
                        },
                      ])
                    }
                    style={{
                      padding: "5px 12px",
                      border: "1.5px dashed #a5b4fc",
                      borderRadius: "6px",
                      background: "#f5f3ff",
                      color: "#4f46e5",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    + Add Item
                  </button>
                </div>

                {draftNewItems.length === 0 && (
                  <div style={{ fontSize: "13px", color: "#9ca3af" }}>
                    Click "+ Add Item" to add a new product variant.
                  </div>
                )}

                {draftNewItems.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 120px auto",
                      gap: "12px",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <Autocomplete
                      options={variantOptions}
                      loading={productsLoading}
                      getOptionKey={(o) => o.variantId}
                      getOptionLabel={(o) => o.label}
                      isOptionEqualToValue={(o, v) =>
                        o.variantId === v.variantId
                      }
                      value={
                        variantOptions.find(
                          (o) => o.variantId === item.variantId,
                        ) ?? null
                      }
                      onChange={(_, selected) =>
                        setDraftNewItems((prev) =>
                          prev.map((li) =>
                            li.key === item.key
                              ? {
                                  ...li,
                                  variantId: selected?.variantId ?? "",
                                  title: selected
                                    ? `${selected.product.title} — ${selected.variant.title}`
                                    : "",
                                }
                              : li,
                          ),
                        )
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Search product variant…"
                          size="small"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "8px",
                              fontSize: "14px",
                              "& fieldset": { borderColor: "#e5e7eb" },
                            },
                          }}
                          slotProps={{
                            input: {
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {productsLoading && (
                                    <CircularProgress
                                      color="inherit"
                                      size={14}
                                    />
                                  )}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            },
                          }}
                        />
                      )}
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10);
                        setDraftNewItems((prev) =>
                          prev.map((li) =>
                            li.key === item.key
                              ? { ...li, quantity: isNaN(qty) ? 1 : qty }
                              : li,
                          ),
                        );
                      }}
                      placeholder="Qty"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftNewItems((prev) =>
                          prev.filter((li) => li.key !== item.key),
                        )
                      }
                      style={{
                        padding: "7px 12px",
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
                      ✕ Remove
                    </button>
                  </div>
                ))}
              </div>

              <ResultBox
                data={updateDraftData}
                error={updateDraftError}
                successColor="#0369a1"
                successBg="#f0f9ff"
                adminUrl={
                  updateDraftData?.data?.id && selectedStoreOption.handle
                    ? `https://admin.shopify.com/store/${selectedStoreOption.handle}/draft_orders/${updateDraftData.data.id.split("/").pop()}`
                    : undefined
                }
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="submit"
                  disabled={isDraftUpdating}
                  style={{
                    padding: "10px 28px",
                    border: "none",
                    borderRadius: "8px",
                    background: isDraftUpdating
                      ? "#a5b4fc"
                      : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    color: "#fff",
                    cursor: isDraftUpdating ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {isDraftUpdating ? "Saving..." : "Save Line Items"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          CREATE PRODUCT MODE
      ════════════════════════════════════════════════ */}
      {mode === "createProduct" && (
        <form
          style={{ padding: "28px" }}
          onSubmit={async (e) => {
            e.preventDefault();
            const price = parseFloat(productForm.price);
            if (!productForm.title.trim()) {
              toast.error("Title is required");
              return;
            }
            if (isNaN(price) || price < 0) {
              toast.error("Enter a valid price");
              return;
            }
            try {
              await createProduct({
                store: selectedStore,
                title: productForm.title.trim(),
                price,
                sku: productForm.sku.trim() || undefined,
                product_type: productForm.product_type.trim() || undefined,
                vendor: productForm.vendor.trim() || undefined,
              }).unwrap();
              toast.success("Product created successfully");
              setProductForm({
                title: "",
                price: "",
                sku: "",
                product_type: "",
                vendor: "",
              });
              refetchProducts();
            } catch (err: any) {
              toast.error(err?.data?.message || "Failed to create product");
            }
          }}
        >
          {/* Store */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Store</label>
            <StoreDropdown
              selectedLabel={selectedStoreOption.label}
              onChange={setSelectedStoreOption}
              options={STORE_OPTIONS}
            />
          </div>

          {/* Title */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Crib"
              value={productForm.title}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>

          {/* Price */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Price *</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 25.00"
              value={productForm.price}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, price: e.target.value }))
              }
              required
            />
          </div>

          {/* SKU */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>
              SKU{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional — auto-generated if blank)
              </span>
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. MUG-25-4821"
              value={productForm.sku}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, sku: e.target.value }))
              }
            />
          </div>

          {/* Product Type */}
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>
              Product Type{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (default: Custom)
              </span>
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Cribs"
              value={productForm.product_type}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, product_type: e.target.value }))
              }
            />
          </div>

          {/* Vendor */}
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>
              Vendor{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (default: Custom Store)
              </span>
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. My Brand"
              value={productForm.vendor}
              onChange={(e) =>
                setProductForm((p) => ({ ...p, vendor: e.target.value }))
              }
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid #f3f4f6",
              paddingTop: "20px",
            }}
          >
            <button
              type="submit"
              disabled={isProductCreating}
              style={{
                padding: "10px 28px",
                border: "none",
                borderRadius: "8px",
                background: isProductCreating
                  ? "#a5b4fc"
                  : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                color: "#fff",
                cursor: isProductCreating ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              {isProductCreating ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ShopifyOrderForm;
