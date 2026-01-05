# AG Grid Column Order Persistence - Usage Example

## How to use

To enable column order persistence, simply pass a unique `storageKey` prop to your `AgGridTable` component:

```tsx
import AgGridTable from "./components/ag-grid";
import { useRef } from "react";

function MyComponent() {
  const gridRef = useRef();

  const columnDefs = [
    { field: "name", headerName: "Name" },
    { field: "age", headerName: "Age" },
    { field: "email", headerName: "Email" },
  ];

  const rowData = [
    { name: "John", age: 25, email: "john@example.com" },
    { name: "Jane", age: 30, email: "jane@example.com" },
  ];

  return (
    <AgGridTable
      gridRef={gridRef}
      columnDefs={columnDefs}
      rowData={rowData}
      storageKey="myGrid-columnOrder" // Add this unique key
    />
  );
}
```

## How it works

1. When users drag and drop columns to reorder them, the new column order is automatically saved to localStorage
2. The next time the user visits the page, the columns will appear in the order they last arranged them
3. Each grid should have a unique `storageKey` to avoid conflicts between different grids

## Important Notes

- The `storageKey` should be unique for each different grid in your application
- If you don't provide a `storageKey`, the column persistence feature will not be enabled
- The saved state includes column order, width, and visibility
