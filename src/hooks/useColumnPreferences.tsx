import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { setActiveTab } from "@/redux/slices/tabSlice";
import {
  useGetUserPreferencesQuery,
  useUpsertUserPreferencesMutation,
} from "@/redux/services/profileApi";
import toast from "react-hot-toast";

interface UseColumnPreferencesProps {
  endpoint: string; // e.g., "customer_orders", "inventory_Availability"
  tabName: string; // e.g., "Orders", "Inventory"
  defaultColumns: any[]; // Array of default column definitions
  storageKey?: string; // Optional: custom localStorage key (defaults to `${tabName}-columnOrder`)
  disableTabManagement?: boolean; // Optional: disable automatic tab switching (for nested components)
  parentTabName?: string; // Optional: parent tab name for nested components (e.g., "Inventory" for Touchups inside Inventory)
}

interface UseColumnPreferencesReturn {
  filteredColumns: any[];
  handleColumnMoved: (event: any) => void;
  handleResetColumns: () => void;
  storageKey: string;
  isLoading: boolean;
}

/**
 * Custom hook for managing table column preferences with dual-layer persistence
 *
 * Features:
 * - localStorage for instant session caching
 * - API for cross-device synchronization
 * - Prevents stale data by clearing cache on tab switch
 * - Guards against unnecessary API calls on programmatic column changes
 *
 * @example
 * const { filteredColumns, handleColumnMoved, storageKey } = useColumnPreferences({
 *   endpoint: "customer_orders",
 *   tabName: "Orders",
 *   defaultColumns: orders,
 * });
 */
export const useColumnPreferences = ({
  endpoint,
  tabName,
  defaultColumns,
  storageKey: customStorageKey,
  disableTabManagement = false,
  parentTabName,
}: UseColumnPreferencesProps): UseColumnPreferencesReturn => {
  const dispatch = useDispatch();
  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId") || undefined
      : undefined;

  // Redux state
  const { activeTabName } = useSelector((state: RootState) => state.tab);

  // Fetch user preferences for column ordering
  const { data: userPreferences, refetch: refetchUserPreferences } =
    useGetUserPreferencesQuery(
      {
        user_id: userId,
        endpoint: endpoint,
      },
      {
        // Skip automatic refetch on focus/mount - we manually control refetch timing
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
      }
    );

  // Initialize mutation hook
  const [upsertUserPreferences, { isLoading: isUpsertLoading }] =
    useUpsertUserPreferencesMutation();

  // State management
  const [defaultPreferences, setDefaultPreferences] = useState<
    Map<string, any>
  >(new Map());
  const [currentColumnOrder, setCurrentColumnOrder] = useState<any[]>([]);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Refs for tracking state
  const isLoadingFromAPIRef = useRef(false);
  const lastProcessedSignatureRef = useRef<string>("");
  const lastSavedOrderRef = useRef<string>("");
  const columnMoveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Storage key for localStorage
  const storageKey = customStorageKey || `${tabName.toLowerCase()}-columnOrder`;

  // Sort columns based on user preferences
  const filteredColumns = useMemo(() => {
    // If we have a pending column order (from user drag), use that
    if (currentColumnOrder.length > 0) {
      console.log(`[${tabName}] Using current column order (user modified)`);
      return currentColumnOrder;
    }

    // Otherwise, use API data
    if (
      userPreferences &&
      (userPreferences as any)?.data &&
      (userPreferences as any).data.length > 0
    ) {
      console.log(`[${tabName}] Using API user preferences data`);

      const prefsData = (userPreferences as any).data;

      // Store default preferences on first load (only once)
      if (defaultPreferences.size === 0) {
        const defaultMap = new Map<string, any>(
          prefsData.map((pref: any) => [
            pref.preference,
            {
              default_preference: pref.default_preference,
              defualt_sort: pref.defualt_sort, // Keep original typo as is in backend
            },
          ])
        );
        setDefaultPreferences(defaultMap);
      }

      // Create a map of preference field to sort order
      const preferenceMap = new Map(
        prefsData.map((pref: any) => [pref.preference, pref.preference_sort])
      );

      // Filter columns that exist in preferences and sort by preference_sort
      const orderedColumns = defaultColumns
        .filter((col) => preferenceMap.has(col.field))
        .sort((a, b) => {
          const sortA = (preferenceMap.get(a.field) as number) || 999;
          const sortB = (preferenceMap.get(b.field) as number) || 999;
          return sortA - sortB;
        });

      return orderedColumns;
    }

    // If no API data, return all default columns
    console.log(`[${tabName}] No user preferences data, returning all columns`);
    return defaultColumns;
  }, [
    userPreferences,
    currentColumnOrder,
    defaultPreferences,
    defaultColumns,
    tabName,
  ]);

  // Handle column reorder event with debouncing
  const handleColumnMoved = useCallback(
    (event: any) => {
      // Only process when the drag is finished
      if (event.finished && event.api) {
        // CRITICAL: Skip if we're loading from API (programmatic change, not user action)
        if (isLoadingFromAPIRef.current) {
          console.log(
            `[${tabName}] ⏭️ Skipping - loading from API, not a user action`
          );
          return;
        }

        const columnState = event.api.getColumnState();

        // Create a signature of the current column order
        const columnOrderSignature = columnState
          .filter((col: any) => col.colId)
          .map((col: any) => col.colId)
          .join(",");

        // Check if we already processed this exact signature
        if (columnOrderSignature === lastProcessedSignatureRef.current) {
          console.log(
            `[${tabName}] ⏭️ Skipping - already processed this column order`
          );
          return;
        }

        // Check if this is the same as the last saved order
        if (columnOrderSignature === lastSavedOrderRef.current) {
          console.log(
            `[${tabName}] ⏭️ Skipping save - column order unchanged from last save`
          );
          return;
        }

        // Mark this signature as processed
        lastProcessedSignatureRef.current = columnOrderSignature;

        // Update the local column order immediately (optimistic update)
        const newColumnOrder = columnState
          .filter((col: any) => col.colId)
          .map((col: any) => {
            return defaultColumns.find((column) => column.field === col.colId);
          })
          .filter(Boolean);

        setCurrentColumnOrder(newColumnOrder);
        console.log(
          `[${tabName}] ✅ Column order updated locally (optimistic)`
        );

        // Clear any existing timer
        if (columnMoveTimerRef.current) {
          clearTimeout(columnMoveTimerRef.current);
        }

        // Debounce the API call by 500ms
        columnMoveTimerRef.current = setTimeout(async () => {
          // Map column state to the backend format
          const preferencesData = columnState
            .filter((col: any) => col.colId)
            .map((col: any, index: number) => {
              const defaults = defaultPreferences.get(col.colId);

              return {
                user_id: userId,
                endpoint: endpoint,
                preference: col.colId,
                preference_sort: index + 1,
                default_preference: defaults?.default_preference || col.colId,
                defualt_sort: defaults?.defualt_sort || index + 1,
              };
            });

          const apiPayload = { data: preferencesData };

          console.log(`[${tabName}] === Column Order Update Payload ===`);
          console.log(`[${tabName}] Endpoint:`, endpoint);
          console.log(
            `[${tabName}] Number of columns:`,
            preferencesData.length
          );

          setIsSavingPreferences(true);

          try {
            const toastId = toast.loading("Saving column preferences...");
            await upsertUserPreferences(apiPayload).unwrap();
            console.log(
              `[${tabName}] ✅ Preferences synced with API successfully`
            );
            lastSavedOrderRef.current = columnOrderSignature;
            toast.success("Column preferences saved successfully!", {
              id: toastId,
            });
          } catch (error) {
            console.error(`[${tabName}] ❌ Failed to sync with API:`, error);
            toast.error("Failed to save column preferences. Please try again.");
          } finally {
            setIsSavingPreferences(false);
          }
        }, 500);
      }
    },
    [
      defaultPreferences,
      userId,
      endpoint,
      upsertUserPreferences,
      defaultColumns,
      tabName,
    ]
  );

  // Set activeTabName when component mounts (skip for nested components)
  useEffect(() => {
    if (!disableTabManagement) {
      console.log(
        `[${tabName}] Component mounted - setting activeTabName to '${tabName}'`
      );
      dispatch(setActiveTab({ isActive: true, name: tabName }));

      return () => {
        dispatch(setActiveTab({ isActive: false, name: "" }));
        // Cleanup pending timer on unmount
        if (columnMoveTimerRef.current) {
          clearTimeout(columnMoveTimerRef.current);
          columnMoveTimerRef.current = null;
        }
      };
    }
  }, [dispatch, tabName, disableTabManagement]);

  // Refetch user preferences when switching to this tab (skip for nested components)
  useEffect(() => {
    if (!disableTabManagement && activeTabName === tabName) {
      console.log(
        `[${tabName}] Switching to ${tabName} tab - clearing state and refetching preferences...`
      );
      // Set flag to prevent upsert during API load
      isLoadingFromAPIRef.current = true;
      // Clear state
      setCurrentColumnOrder([]);
      setDefaultPreferences(new Map());
      // Reset refs to allow new column moves
      lastProcessedSignatureRef.current = "";
      lastSavedOrderRef.current = "";
      // Clear any pending timer
      if (columnMoveTimerRef.current) {
        clearTimeout(columnMoveTimerRef.current);
        columnMoveTimerRef.current = null;
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Force refetch from server
      refetchUserPreferences();
    }
  }, [
    activeTabName,
    refetchUserPreferences,
    tabName,
    storageKey,
    disableTabManagement,
  ]);

  // For nested components: fetch preferences when parent tab becomes active
  useEffect(() => {
    if (
      disableTabManagement &&
      parentTabName &&
      activeTabName === parentTabName
    ) {
      console.log(
        `[${tabName}] Parent tab '${parentTabName}' activated - fetching nested component preferences...`
      );
      // Set flag to prevent upsert during API load
      isLoadingFromAPIRef.current = true;
      // Clear state
      setCurrentColumnOrder([]);
      setDefaultPreferences(new Map());
      // Reset refs to allow new column moves
      lastProcessedSignatureRef.current = "";
      lastSavedOrderRef.current = "";
      // Clear any pending timer
      if (columnMoveTimerRef.current) {
        clearTimeout(columnMoveTimerRef.current);
        columnMoveTimerRef.current = null;
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Force refetch from server
      refetchUserPreferences();
    }
  }, [
    activeTabName,
    parentTabName,
    disableTabManagement,
    refetchUserPreferences,
    tabName,
    storageKey,
  ]);

  // Reset the loading flag after preferences have loaded
  useEffect(() => {
    if (isLoadingFromAPIRef.current && userPreferences) {
      const timer = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] ✅ API preferences loaded - re-enabling column save functionality`
        );
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [userPreferences, tabName]);

  // Handle reset to default column order
  const handleResetColumns = useCallback(() => {
    console.log(`[${tabName}] 🔄 Resetting columns to default order`);

    // CRITICAL: Set flag to prevent handleColumnMoved from triggering during reset
    isLoadingFromAPIRef.current = true;

    // Clear local state
    setCurrentColumnOrder([]);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }

    // Get preferences from API data and reset preference_sort to defualt_sort
    if (userPreferences && (userPreferences as any)?.data) {
      const prefsData = (userPreferences as any).data;

      // Map through the API data and set preference_sort = defualt_sort
      const defaultPreferencesData = prefsData.map((pref: any) => ({
        user_id: userId,
        endpoint: endpoint,
        preference: pref.preference,
        preference_sort: pref.defualt_sort, // Reset to default sort value
        default_preference: pref.default_preference,
        defualt_sort: pref.defualt_sort,
      }));

      console.log(
        `[${tabName}] 💾 Resetting preference_sort to defualt_sort:`,
        defaultPreferencesData
      );
      const newColumnOrder = defaultColumns
        .filter((col) =>
          defaultPreferencesData.find(
            (pref: any) => pref.preference === col.field
          )
        )
        .sort(
          (a, b) =>
            (defaultPreferencesData.find(
              (pref: any) => pref.preference === a.field
            )?.preference_sort || 0) -
            (defaultPreferencesData.find(
              (pref: any) => pref.preference === b.field
            )?.preference_sort || 0)
        );

      setCurrentColumnOrder(newColumnOrder);
      const toastId = toast.loading("Resetting columns to default...");
      upsertUserPreferences({ data: defaultPreferencesData })
        .unwrap()
        .then(() => {
          console.log(
            `[${tabName}] ✅ Columns reset to default order successfully`
          );
          toast.success("Columns reset to default successfully!", {
            id: toastId,
          });
          // Wait before re-enabling column move handler to prevent race conditions
          setTimeout(() => {
            isLoadingFromAPIRef.current = false;
            console.log(
              `[${tabName}] ✅ Re-enabled column move handler after reset`
            );
          }, 1000);
        })
        .catch((error) => {
          console.error(`[${tabName}] ❌ Failed to reset to default:`, error);
          toast.error("Failed to reset columns. Please try again.", {
            id: toastId,
          });
          // Re-enable on error
          isLoadingFromAPIRef.current = false;
        });
    } else {
      console.warn(
        `[${tabName}] ⚠️ No user preferences found to reset. Fetching from API first...`
      );
      // Re-enable flag if no data
      isLoadingFromAPIRef.current = false;
      // If no preferences loaded yet, refetch first
      refetchUserPreferences();
    }
  }, [
    tabName,
    storageKey,
    userPreferences,
    userId,
    endpoint,
    upsertUserPreferences,
    refetchUserPreferences,
  ]);

  return {
    filteredColumns,
    handleColumnMoved,
    handleResetColumns,
    storageKey,
    isLoading: isUpsertLoading,
  };
};
