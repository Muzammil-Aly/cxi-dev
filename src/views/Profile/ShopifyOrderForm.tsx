// src/components/ShopifyOrderForm.tsx
import React, { useMemo, useState } from "react";
import {
  useCreateOrderMutation,
  useGetProductsQuery,
  type ProductVariant,
  type ShopifyProduct,
} from "../../redux/services/shopifyApi";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Typography,
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

const ShopifyOrderForm: React.FC = () => {
  const [createOrder, { isLoading, data, error }] = useCreateOrderMutation();
  const { data: products, isLoading: productsLoading } = useGetProductsQuery();

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

  const addressFields: (keyof Address)[] = [
    "firstName",
    "lastName",
    "company",
    "address1",
    "address2",
    "city",
    "provinceCode",
    "countryCode",
    "zip",
  ];
  const sectionStyle: React.CSSProperties = {
    padding: "16px",
    marginBottom: "24px",
  };
  const flexRow: React.CSSProperties = {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "12px",
  };
  const flexCol: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Customer Info */}
      <Paper elevation={2} style={sectionStyle}>
        <Typography variant="h6" gutterBottom>
          Customer Info
        </Typography>
        <div style={flexCol}>
          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            required
          />
        </div>
      </Paper>

      {/* Line Items */}
      <Paper elevation={2} style={sectionStyle}>
        <Typography variant="h6" gutterBottom>
          Line Items
        </Typography>
        {form.lineItems.map((item, index) => (
          <div key={index} style={flexRow}>
            <Autocomplete
              style={{ flex: 2 }}
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
                  label="Product Variant"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {productsLoading && (
                          <CircularProgress color="inherit" size={16} />
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={item.variantId || undefined}
                />
              )}
            />
            <TextField
              label="Quantity"
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleLineItemChange(index, "quantity", Number(e.target.value))
              }
              style={{ flex: 1 }}
              required
            />
            {form.lineItems.length > 1 && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => removeLineItem(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button variant="contained" onClick={addLineItem}>
          Add Line Item
        </Button>
      </Paper>

      {/* Shipping Address */}
      {/* Shipping Address */}
      <Paper elevation={2} style={sectionStyle}>
        <Typography variant="h6" gutterBottom>
          Shipping Address
        </Typography>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {/* First Name + Last Name */}
          <TextField
            label="First Name"
            value={form.shippingAddress.firstName}
            onChange={(e) =>
              handleAddressChange(
                "shippingAddress",
                "firstName",
                e.target.value,
              )
            }
            style={{ flex: 1 }}
            required
          />
          <TextField
            label="Last Name"
            value={form.shippingAddress.lastName}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "lastName", e.target.value)
            }
            style={{ flex: 1 }}
            required
          />
        </div>

        {/* Company */}
        <div style={{ marginTop: "12px" }}>
          <TextField
            label="Company"
            value={form.shippingAddress.company}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "company", e.target.value)
            }
            fullWidth
          />
        </div>

        {/* Address Lines */}
        <div style={{ marginTop: "12px" }}>
          <TextField
            label="Address 1"
            value={form.shippingAddress.address1}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "address1", e.target.value)
            }
            fullWidth
            required
          />
        </div>
        <div style={{ marginTop: "12px" }}>
          <TextField
            label="Address 2"
            value={form.shippingAddress.address2}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "address2", e.target.value)
            }
            fullWidth
          />
        </div>

        {/* City / Province / Zip */}
        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
          <TextField
            label="City"
            value={form.shippingAddress.city}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "city", e.target.value)
            }
            style={{ flex: 2 }}
            required
          />
          <TextField
            label="Province/State Code"
            value={form.shippingAddress.provinceCode}
            onChange={(e) =>
              handleAddressChange(
                "shippingAddress",
                "provinceCode",
                e.target.value,
              )
            }
            style={{ flex: 1 }}
            required
          />
          <TextField
            label="ZIP / Postal Code"
            value={form.shippingAddress.zip}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "zip", e.target.value)
            }
            style={{ flex: 1 }}
            required
          />
        </div>

        {/* Country */}
        <div style={{ marginTop: "12px" }}>
          <TextField
            label="Country Code"
            value={form.shippingAddress.countryCode}
            onChange={(e) =>
              handleAddressChange(
                "shippingAddress",
                "countryCode",
                e.target.value,
              )
            }
            fullWidth
            required
          />
        </div>

        {/* Phone */}
        <div style={{ marginTop: "12px" }}>
          <TextField
            label="Phone"
            value={form.shippingAddress.phone}
            onChange={(e) =>
              handleAddressChange("shippingAddress", "phone", e.target.value)
            }
            fullWidth
          />
        </div>
      </Paper>

      <div style={{ marginBottom: "24px" }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Order"}
        </Button>
      </div>

      {error && (
        <pre style={{ color: "red" }}>{JSON.stringify(error, null, 2)}</pre>
      )}
      {data && (
        <pre style={{ color: "green" }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </form>
  );
};

export default ShopifyOrderForm;
