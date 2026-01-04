# ProfileApi Migration Notes

## Overview
The `profileApi.ts` has been split into domain-specific API files for better organization:
- `customerApi.ts` - Customer profile endpoints
- `orderApi.ts` - Order-related endpoints
- `supportApi.ts` - Support ticket endpoints
- `eventsApi.ts` - Marketing event endpoints
- `inventoryApi.ts` - Inventory-related endpoints

## Migration Mapping

### Files Using ProfileApi Hooks

The following files import hooks from `profileApi.ts` and need to be migrated:

#### Customer-Related Hooks
**Files to Update:**
- `src/views/Profile/TabsContent/customer-profile/CustomerProfile.tsx`
  - `useGetProfilesQuery` → `customerApi.useGetProfilesQuery`
  - `useGetFullNamesQuery` → `customerApi.useGetFullNamesQuery`
  - `useGetPhoneQuery` → `customerApi.useGetPhoneQuery`
  
- `src/views/Profile/TabsContent/profile-Information/ProfileInfo.tsx`
  - `useGetProfilesQuery` → `customerApi.useGetProfilesQuery`
  - `useGetFullNamesQuery` → `customerApi.useGetFullNamesQuery`
  - `useGetPhoneQuery` → `customerApi.useGetPhoneQuery`

- `src/views/Profile/CustomerSegmentCard.tsx`
  - `useGetCustomerSegmentQuery` → `customerApi.useGetCustomerSegmentQuery`

#### Order-Related Hooks
**Files to Update:**
- `src/views/Profile/Orders.tsx`
  - `useGetCustomerOrdersQuery` → `orderApi.useGetCustomerOrdersQuery`
  
- `src/views/Profile/TabsContent/OrderHistory.tsx`
  - `useGetCustomerOrdersQuery` → `orderApi.useGetCustomerOrdersQuery`

- `src/views/Profile/OrderItems.tsx`
  - `useGetOrderItemsQuery` → `orderApi.useGetOrderItemsQuery`

- `src/views/Profile/Return.tsx`
  - `useGetReturnsQuery` → `orderApi.useGetReturnsQuery`

- `src/views/Profile/Refund.tsx`
  - `useGetRefundsQuery` → `orderApi.useGetRefundsQuery`

#### Support-Related Hooks
**Files to Update:**
- `src/views/Profile/SupportTickets.tsx`
  - `useGetSupportTicketsQuery` → `supportApi.useGetSupportTicketsQuery`

- `src/views/Profile/SupportTicketComments.tsx`
  - `useGetSupportTicketsCommnetsQuery` → `supportApi.useGetSupportTicketsCommentsQuery`
  - **Note:** Also fix the typo "Commnets" → "Comments"

#### Events-Related Hooks
**Files to Update:**
- `src/views/Profile/MarketingEvents.tsx`
  - `useGetCustomerEventsQuery` → `eventsApi.useGetCustomerEventsQuery`

#### Inventory-Related Hooks
**Files to Update:**
- `src/views/Profile/TabsContent/inventory/Inventory.tsx`
  - `useGetInventoryQuery` → `inventoryApi.useGetInventoryQuery`
  - `useGetLifeCycleStatusQuery` → `inventoryApi.useGetLifeCycleStatusQuery`

- `src/views/Profile/LocationItemLot.tsx`
  - `useGetLocationItemLotQuery` → `inventoryApi.useGetLocationItemLotQuery`

- `src/views/Profile/Touchups.tsx`
  - `useGetTouchupsQuery` → `inventoryApi.useGetTouchupsQuery`

- `src/views/Profile/AllTouchups.tsx`
  - `useGetTouchupsQuery` → `inventoryApi.useGetTouchupsQuery`

- `src/views/Profile/TouchupsPens.tsx`
  - `useGetTouchupPensQuery` → `inventoryApi.useGetTouchupPensQuery`

- `src/views/Profile/AllTouchupsPens.tsx`
  - `useGetTouchupPensQuery` → `inventoryApi.useGetTouchupPensQuery`

## Migration Steps

For each file listed above:

1. **Update the import statement:**
   ```typescript
   // Old
   import { useGetProfilesQuery } from "@/redux/services/profileApi";
   
   // New
   import { useGetProfilesQuery } from "@/redux/services/customerApi";
   ```

2. **No changes needed to hook usage** - The hooks work exactly the same way

3. **Test the component** - Ensure data fetching still works correctly

## Already Migrated

The Redux store (`src/redux/store.ts`) has already been updated to include all new API modules:
- ✅ `customerApi`
- ✅ `orderApi`  
- ✅ `supportApi`
- ✅ `eventsApi`
- ✅ `inventoryApi`

Legacy APIs (`klaviyoApi`, `OrdersApi`, `supportTicketsApi`, `MarketingEventsApi`) are kept temporarily for backwards compatibility.

## Files Summary

**Total files requiring migration:** 18 component files

**By Category:**
- Customer-related: 3 files
- Order-related: 5 files
- Support-related: 2 files
- Events-related: 1 file
- Inventory-related: 7 files

## Next Steps

1. Systematically update import statements in each file
2. Test each updated component
3. Once all migrations are complete, remove `profileApi.ts.old`
4. Eventually deprecate and remove legacy API modules

## Backup

Original `profileApi.ts` has been renamed to `profileApi.ts.old` for reference.
