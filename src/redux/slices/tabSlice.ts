// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// interface TabState {
//   isActive: boolean;
//   activeTabName: string;
//   isActiveTouchUp: boolean;
// }

// const initialState: TabState = {
//   isActive: false,
//   activeTabName: "",
//   isActiveTouchUp: false,
// };

// const tabSlice = createSlice({
//   name: "tab",
//   initialState,
//   reducers: {
//     setActiveTab: (
//       state,
//       action: PayloadAction<{ isActive: boolean; name?: string }>
//     ) => {
//       state.isActive = action.payload.isActive;
//       state.activeTabName = action.payload.name || "";
//     },
//     setActiveTouchUp: (
//       state,
//       action: PayloadAction<{ isActiveTouchUp: boolean; name?: string }>
//     ) => {
//       state.isActiveTouchUp = action.payload.isActiveTouchUp;
//       state.activeTabName = action.payload.name || "";
//     },
//   },
// });

// export const { setActiveTab, setActiveTouchUp } = tabSlice.actions;
// export default tabSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TabState {
  isActive: boolean;
  activeTabName: string;

  // independent states
  isOrderItemsOpen: boolean;
  isTouchupsOpen: boolean;
  isTouchupPensOpen: boolean;
  isCustomerSegmentsOpen: boolean;
  isLocationItemLotOpen: boolean;
}

const initialState: TabState = {
  isActive: false,
  activeTabName: "",

  isOrderItemsOpen: false,
  isTouchupsOpen: false,
  isTouchupPensOpen: false,
  isCustomerSegmentsOpen: false,
  isLocationItemLotOpen: false,
};

const tabSlice = createSlice({
  name: "tab",
  initialState,
  reducers: {
    setActiveTab: (
      state,
      action: PayloadAction<{ isActive: boolean; name?: string }>
    ) => {
      state.isActive = action.payload.isActive;
      state.activeTabName = action.payload.name || "";
    },
    setOrderItemsOpen: (state, action: PayloadAction<boolean>) => {
      state.isOrderItemsOpen = action.payload;
    },
    setCustomerSegmentsOpen: (state, action: PayloadAction<boolean>) => {
      state.isCustomerSegmentsOpen = action.payload;
    },

    setTouchupsOpen: (state, action: PayloadAction<boolean>) => {
      state.isTouchupsOpen = action.payload;
    },

    setTouchupPensOpen: (state, action: PayloadAction<boolean>) => {
      state.isTouchupPensOpen = action.payload;
    },

    setLocationItemLotOpen: (state, action: PayloadAction<boolean>) => {
      state.isLocationItemLotOpen = action.payload;
    },

    resetAllTabs: (state) => {
      state.isOrderItemsOpen = false;
      state.isTouchupsOpen = false;
      state.isTouchupPensOpen = false;
      state.isCustomerSegmentsOpen = false;
      state.isLocationItemLotOpen = false;
    },
  },
});

export const {
  setActiveTab,
  setOrderItemsOpen,
  setTouchupsOpen,
  setTouchupPensOpen,
  setCustomerSegmentsOpen,
  setLocationItemLotOpen,
  resetAllTabs,
} = tabSlice.actions;

export default tabSlice.reducer;
