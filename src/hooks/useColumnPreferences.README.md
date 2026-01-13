# useColumnPreferences Hook

A reusable custom hook for managing table column preferences with dual-layer persistence (localStorage + API).

## Features

- ✅ **localStorage** for instant session caching
- ✅ **API** for cross-device synchronization
- ✅ **Prevents stale data** by clearing cache on tab switch
- ✅ **Guards against unnecessary API calls** on programmatic column changes
- ✅ **Drag & drop column reordering** with debounced saves
- ✅ **Reset to defaults** functionality

---

## Installation

The hook is already created at:
```
src/hooks/useColumnPreferences.tsx
```

---

## Usage

### 1. Import the hook

```typescript
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
```

### 2. Import your default column definitions

```typescript
import { orders } from "@/constants/Grid-Table/ColDefs";
```

### 3. Use the hook in your component

```typescript
const YourTableComponent = () => {
  // Use column preferences hook
  const { filteredColumns, handleColumnMoved, storageKey } = useColumnPreferences({
    endpoint: "customer_orders",  // API endpoint identifier
    tabName: "Orders",             // Tab/page name (must match route)
    defaultColumns: orders,        // Your default column definitions
  });

  // Apply your custom column formatting (if you have one)
  const formattedColumns = useYourColumnHook(filteredColumns);

  return (
    <ResponsiveDashboard
      rowData={rowData}
      userCol={formattedColumns}
      onColumnMoved={handleColumnMoved}  // Pass the handler
      currentMenu="orders"               // Must match your tabName
      // ... other props
    />
  );
};
```

---

## Complete Example: Inventory Table

```typescript
// src/views/Profile/Inventory.tsx

import React from "react";
import { useColumnPreferences } from "@/hooks/useColumnPreferences";
import { inventory_columns } from "@/constants/Grid-Table/ColDefs";
import useInventoryColumn from "@/hooks/Ag-Grid/useInventoryColumn";
import ResponsiveDashboard from "./TabsContent/ResponsiveDashboard";

const Inventory = () => {
  // 1. Use the column preferences hook
  const { filteredColumns, handleColumnMoved, storageKey } = useColumnPreferences({
    endpoint: "inventory_Availability",  // Must match backend endpoint
    tabName: "Inventory",                // Must match route/page name
    defaultColumns: inventory_columns,   // Your default columns
  });

  // 2. Apply column customization (optional)
  const inventoryCol = useInventoryColumn(filteredColumns);

  // 3. Your other component logic...
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch data...
  const { data, isLoading } = useGetInventoryQuery({ page, page_size: pageSize });

  return (
    <ResponsiveDashboard
      rowData={data?.data || []}
      userCol={inventoryCol}
      onColumnMoved={handleColumnMoved}  // ✅ Pass the handler
      currentMenu="inventory"             // ✅ Must match tabName
      enablePagination
      currentPage={page}
      totalPages={data?.total_pages || 1}
      onPageChange={setPage}
      paginationPageSize={pageSize}
    />
  );
};

export default Inventory;
```

---

## Parameters

### `useColumnPreferences(props)`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `endpoint` | `string` | ✅ Yes | The backend API endpoint identifier (e.g., `"customer_orders"`, `"inventory_Availability"`) |
| `tabName` | `string` | ✅ Yes | The tab/page name (e.g., `"Orders"`, `"Inventory"`). Must match the route. |
| `defaultColumns` | `any[]` | ✅ Yes | Array of default column definitions from `ColDefs.tsx` |
| `storageKey` | `string` | ❌ No | Optional custom localStorage key. Defaults to `${tabName}-columnOrder` |

---

## Return Values

### `useColumnPreferences` returns:

| Property | Type | Description |
|----------|------|-------------|
| `filteredColumns` | `any[]` | Sorted and filtered columns based on user preferences |
| `handleColumnMoved` | `(event: any) => void` | Callback for AG Grid's `onColumnMoved` event |
| `storageKey` | `string` | The localStorage key (pass to `AgGridTable`) |
| `isLoading` | `boolean` | True when saving preferences to API |

---

## How to Apply to Other Tables

### Step 1: Identify Your Table

Find your table component (e.g., `SupportTickets.tsx`, `MarketingEvents.tsx`, etc.)

### Step 2: Find Your Column Definitions

Check `src/constants/Grid-Table/ColDefs.tsx`:

```typescript
export const support_tickets = [...];
export const marketing_events = [...];
export const touchups_columns = [...];
// etc.
```

### Step 3: Find Your Endpoint Name

Check your API query to find the `endpoint` parameter:

```typescript
// In customerApi.ts
useGetUserPreferencesQuery({
  endpoint: "support_tickets",  // ← This is your endpoint
  user_id: userId,
});
```

### Step 4: Replace Old Code

**Before:**
```typescript
// ❌ Old way - lots of boilerplate
const [userPreferences, setUserPreferences] = useState(...);
const [currentColumnOrder, setCurrentColumnOrder] = useState(...);
const [defaultPreferences, setDefaultPreferences] = useState(...);

const filteredColumns = useMemo(() => {
  // 100+ lines of logic...
}, [...]);

const handleColumnMoved = useCallback((event) => {
  // 150+ lines of logic...
}, [...]);
```

**After:**
```typescript
// ✅ New way - one line!
const { filteredColumns, handleColumnMoved, storageKey } = useColumnPreferences({
  endpoint: "support_tickets",
  tabName: "SupportTickets",
  defaultColumns: support_tickets,
});
```

---

## Mapping Table: Endpoints and Tab Names

| Table | Endpoint | Tab Name | Column Definition |
|-------|----------|----------|-------------------|
| Orders | `customer_orders` | `Orders` | `orders` |
| Inventory | `inventory_Availability` | `Inventory` | `inventory_columns` |
| Support Tickets | `support_tickets` | `SupportTickets` | `support_tickets` |
| Marketing Events | `marketing_events` | `MarketingEvents` | `marketing_events` |
| Touchups | `touchups` | `Touchups` | `touchups_columns` |
| Touchup Pens | `touchup_pens` | `TouchupPens` | `touchups_pens` |
| Refunds | `refunds` | `Refunds` | `Refunds` |
| Returns | `returns` | `Returns` | `Returns` |
| Location Item Lot | `location_item_lot` | `LocationItemLot` | `location_item_lot` |

---

## Checklist for Implementation

When adding this hook to a new table:

- [ ] Import `useColumnPreferences` hook
- [ ] Import default columns from `ColDefs.tsx`
- [ ] Call the hook with correct `endpoint` and `tabName`
- [ ] Pass `handleColumnMoved` to `ResponsiveDashboard` or `AgGridTable`
- [ ] Ensure `currentMenu` prop matches `tabName`
- [ ] Pass `storageKey` to `AgGridTable` (if using directly)
- [ ] Remove old preference logic (state, refs, useEffects, handleColumnMoved)
- [ ] Test tab switching (should refetch from API)
- [ ] Test column dragging (should save to localStorage + API)
- [ ] Test reset button (should appear in grid header)

---

## Common Issues

### Issue 1: Upsert API called on every tab switch

**Cause:** Old `handleColumnMoved` logic still exists in component
**Solution:** Remove duplicate `handleColumnMoved` function and use hook's version

### Issue 2: Preferences not loading on tab switch

**Cause:** `tabName` doesn't match Redux `activeTabName`
**Solution:** Ensure `tabName` prop matches the name used in routes

### Issue 3: localStorage not working

**Cause:** `storageKey` not passed to `AgGridTable`
**Solution:** Pass `storageKey` from hook to `ResponsiveDashboard` or `AgGridTable`

### Issue 4: Reset button not appearing

**Cause:** `storageKey` prop missing from `AgGridTable`
**Solution:** Ensure `ResponsiveDashboard` passes `storageKey` to `AgGridTable`

---

## Architecture Overview

```
User Interaction (Drag Column)
         ↓
┌────────────────────────┐
│   AG Grid Component    │
│   onColumnMoved event  │
└────────┬───────────────┘
         ↓
┌────────────────────────┐
│  useColumnPreferences  │
│  handleColumnMoved     │
└────────┬───────────────┘
         ↓
    ┌────────┴────────┐
    │                 │
    ↓                 ↓
localStorage      API PATCH
(instant)     (500ms debounce)
    │                 │
    └────────┬────────┘
             ↓
    Column order saved!
```

### On Tab Switch:

```
User switches tab
         ↓
useColumnPreferences
  - Sets loading flag
  - Clears localStorage
  - Refetches from API
         ↓
Fresh data from server
         ↓
Grid renders with latest
         ↓
Loading flag reset
Column saves re-enabled
```

---

## FAQ

**Q: Do I need to modify the API?**
A: No, the hook uses existing `/user_prefernce_view` and `/preferences/upsert` endpoints.

**Q: Can I use this with non-AG Grid tables?**
A: Yes, but you'll need to adapt the `handleColumnMoved` logic for your table library.

**Q: Will this work offline?**
A: Yes, localStorage works offline. API sync happens when connection returns.

**Q: Can I customize the debounce time?**
A: Currently set to 500ms. You can modify this in the hook if needed.

**Q: What if I don't want localStorage caching?**
A: Don't pass `storageKey` to AgGridTable. The hook will still handle API persistence.

---

## Support

For issues or questions:
1. Check the console logs (hook adds `[TabName]` prefixes)
2. Verify your `endpoint` and `tabName` are correct
3. Ensure `currentMenu` matches `tabName`
4. Check that old preference logic has been removed

---

## Example Console Output

When working correctly, you should see:

```
[Orders] Component mounted - setting activeTabName to 'Orders'
[Orders] Switching to Orders tab - clearing state and refetching preferences...
[Orders] Using API user preferences data
[Orders] ✅ API preferences loaded - re-enabling column save functionality

// After user drags a column:
[Orders] ✅ Column order updated locally (optimistic)
[Orders] === Column Order Update Payload ===
[Orders] ✅ Preferences synced with API successfully
```
