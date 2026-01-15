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
  parentTabName?: string | string[]; // Optional: parent tab name(s) for nested components (e.g., "Inventory" or ["Inventory", "Orders"])
  isVisible?: boolean; // Optional: track component visibility for refetching when component becomes visible
  refetchTrigger?: any; // Optional: any value that when changed should trigger a preferences refetch (e.g., lotNo, colorSlug)
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
  isVisible,
  refetchTrigger,
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
        // BUT enable refetch when cache is invalidated by mutations
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
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
  const [forceRefreshCounter, setForceRefreshCounter] = useState(0);

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
      console.log(`[${tabName}] Using API user preferences data (refresh: ${forceRefreshCounter})`);

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
    forceRefreshCounter,
  ]);

  // Handle column reorder event with debouncing
  const handleColumnMoved = useCallback(
    (event: any) => {
      // Only process when the drag is finished
      if (event.finished && event.api) {
        // CRITICAL: Skip if we're loading from API (programmatic change, not user action)
        if (isLoadingFromAPIRef.current) {
          console.log(
            `[${tabName}] Skipping - loading from API, not a user action`
          );
          return;
        }

        // Additional check: ensure this is a real user drag action
        // AG Grid provides source property that tells us what triggered the event
        const source = event.source;
        if (source && source !== "uiColumnDragged" && source !== "uiColumnMoved") {
          console.log(
            `[${tabName}] Skipping - event source is '${source}', not a user drag action`
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
            `[${tabName}]  Skipping - already processed this column order`
          );
          return;
        }

        // Check if this is the same as the last saved order
        if (columnOrderSignature === lastSavedOrderRef.current) {
          console.log(
            `[${tabName}]  Skipping save - column order unchanged from last save`
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
        console.log(`[${tabName}]  Column order updated locally (optimistic)`);

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

          // try {
          //   const toastId = toast.loading("Saving column preferences...");
          //   await upsertUserPreferences(apiPayload).unwrap();
          //   console.log(
          //     `[${tabName}]  Preferences synced with API successfully`
          //   );
          //   lastSavedOrderRef.current = columnOrderSignature;
          //   toast.success("Column preferences saved successfully!", {
          //     id: toastId,
          //   });
          // } catch (error) {
          //   console.error(`[${tabName}]  Failed to sync with API:`, error);
          //   toast.error("Failed to save column preferences. Please try again.");
          // } finally {
          //   setIsSavingPreferences(false);
          // }
          try {
            const toastId = toast.loading("Saving column preferences...");

            // --- 🔒 Add serialization lock here ---
            if ((window as any).__isSavingToDatabricks) {
              console.log(
                `[${tabName}] Waiting for previous save to finish...`
              );
              // Wait until previous write completes
              while ((window as any).__isSavingToDatabricks) {
                await new Promise((r) => setTimeout(r, 300));
              }
            }
            (window as any).__isSavingToDatabricks = true;
            // --------------------------------------

            // Actual write
            await upsertUserPreferences(apiPayload).unwrap();
            console.log(
              `[${tabName}] Preferences synced with API successfully`
            );
            lastSavedOrderRef.current = columnOrderSignature;
            lastSaveTimeRef.current = Date.now(); // Track when save happened

            // Refetch preferences to ensure all components get updated data
            // Wait a bit for the backend to process the upsert
            setTimeout(() => {
              refetchUserPreferences();
            }, 100);

            toast.success("Column preferences saved successfully!", {
              id: toastId,
            });
          } catch (error) {
            console.error(`[${tabName}] Failed to sync with API:`, error);
            toast.error("Failed to save column preferences. Please try again.");
          } finally {
            // --- 🔓 Release lock and cleanup ---
            (window as any).__isSavingToDatabricks = false;
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

  // Ref to track loading reset timer
  const loadingResetTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      // Clear any existing loading reset timer
      if (loadingResetTimerRef.current) {
        clearTimeout(loadingResetTimerRef.current);
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Force refetch from server
      refetchUserPreferences();

      // ALWAYS reset loading flag after a delay, regardless of whether userPreferences changes
      // This ensures the flag doesn't get stuck if RTK Query returns cached data
      loadingResetTimerRef.current = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] Loading timeout completed - re-enabling column save functionality`
        );
      }, 500);
    }

    return () => {
      if (loadingResetTimerRef.current) {
        clearTimeout(loadingResetTimerRef.current);
      }
    };
  }, [
    activeTabName,
    refetchUserPreferences,
    tabName,
    storageKey,
    disableTabManagement,
  ]);

  // For nested components: fetch preferences when parent tab becomes active
  // Track the last parent tab we loaded for (to detect switches between parent tabs)
  const lastLoadedParentTabRef = useRef<string>("");
  const previousActiveTabRef = useRef<string>("");

  useEffect(() => {
    // Check if activeTabName matches any of the parent tabs
    const isParentTabActive = parentTabName
      ? Array.isArray(parentTabName)
        ? parentTabName.includes(activeTabName)
        : activeTabName === parentTabName
      : false;

    // Determine if this is a meaningful tab switch that requires refetch
    const isTabSwitch = previousActiveTabRef.current !== activeTabName;
    const isSwitchBetweenParentTabs =
      isTabSwitch &&
      isParentTabActive &&
      lastLoadedParentTabRef.current !== "" &&
      lastLoadedParentTabRef.current !== activeTabName;

    // Check if this is the first load for any parent tab
    const isFirstLoadForParentTab = isParentTabActive && lastLoadedParentTabRef.current === "";

    const hasPendingColumnMove = columnMoveTimerRef.current !== null;

    // Only refetch if:
    // 1. We're in a nested component with parent tab management
    // 2. The parent tab is active
    // 3. Either: first time loading OR switching between different parent tabs (Inventory ↔ Orders)
    // 4. There's no pending column move operation (don't interrupt user actions)
    const shouldRefetch =
      disableTabManagement &&
      parentTabName &&
      isParentTabActive &&
      (isFirstLoadForParentTab || isSwitchBetweenParentTabs) &&
      !hasPendingColumnMove; // Don't refetch if user is actively moving columns

    if (shouldRefetch) {
      const parentTabNames = Array.isArray(parentTabName)
        ? parentTabName.join(", ")
        : parentTabName;
      console.log(
        `[${tabName}] Parent tab '${parentTabNames}' activated (current: ${activeTabName}, previous: ${previousActiveTabRef.current}, last loaded: ${lastLoadedParentTabRef.current}) - fetching nested component preferences...`
      );

      // Mark which parent tab we just loaded for
      lastLoadedParentTabRef.current = activeTabName;

      // Set flag to prevent upsert during API load
      isLoadingFromAPIRef.current = true;
      // Clear state
      setCurrentColumnOrder([]);
      setDefaultPreferences(new Map());
      // Reset refs to allow new column moves
      lastProcessedSignatureRef.current = "";
      lastSavedOrderRef.current = "";
      // Clear any pending timer (should not happen due to hasPendingColumnMove check)
      if (columnMoveTimerRef.current) {
        clearTimeout(columnMoveTimerRef.current);
        columnMoveTimerRef.current = null;
      }
      // Clear any existing loading reset timer
      if (loadingResetTimerRef.current) {
        clearTimeout(loadingResetTimerRef.current);
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Increment force refresh counter to trigger filteredColumns recalculation
      setForceRefreshCounter((prev) => prev + 1);
      // Force refetch from server
      refetchUserPreferences();

      // ALWAYS reset loading flag after a delay
      loadingResetTimerRef.current = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] Loading timeout completed (nested) - re-enabling column save functionality`
        );
      }, 500);
    }

    // Update previous tab reference
    previousActiveTabRef.current = activeTabName;

    // Reset the last loaded parent tab when switching away from all parent tabs
    if (!isParentTabActive) {
      lastLoadedParentTabRef.current = "";
    }
  }, [
    activeTabName,
    parentTabName,
    disableTabManagement,
    refetchUserPreferences,
    tabName,
    storageKey,
  ]);

  // Reset the loading flag after preferences have loaded and initialize lastSavedOrderRef
  useEffect(() => {
    if (isLoadingFromAPIRef.current && userPreferences) {
      // Initialize lastSavedOrderRef with the current API state IMMEDIATELY
      // This ensures we know what's already saved and can detect actual changes
      if ((userPreferences as any)?.data?.length > 0) {
        const prefsData = (userPreferences as any).data;
        // Sort by preference_sort and create signature
        const sortedPrefs = [...prefsData].sort(
          (a: any, b: any) => (a.preference_sort || 0) - (b.preference_sort || 0)
        );
        const apiSignature = sortedPrefs
          .map((pref: any) => pref.preference)
          .join(",");
        lastSavedOrderRef.current = apiSignature;
        console.log(
          `[${tabName}] Initialized lastSavedOrderRef with API state: ${apiSignature.substring(0, 50)}...`
        );
      }

      // Use a shorter delay - 300ms is enough for AG Grid to finish rendering
      // The 1000ms delay was causing user actions to be incorrectly skipped
      const timer = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] API preferences loaded - re-enabling column save functionality`
        );
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [userPreferences, tabName]);

  // Refetch preferences when component becomes visible (for nested components using display:none)
  const wasVisibleRef = useRef(isVisible ?? true);
  const lastRefetchTimeRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(0);

  useEffect(() => {
    // Only applies to nested components with visibility tracking
    if (isVisible === undefined || !disableTabManagement) {
      return;
    }

    console.log(
      `[${tabName}] Visibility check: wasVisible=${wasVisibleRef.current}, isVisible=${isVisible}, becameVisible=${!wasVisibleRef.current && isVisible}`
    );

    const becameVisible = !wasVisibleRef.current && isVisible;
    const hasPendingColumnMove = columnMoveTimerRef.current !== null;

    // ALWAYS refetch when becoming visible (to show latest preferences)
    // Only skip if there's a pending column move (user actively dragging)
    if (becameVisible && !hasPendingColumnMove) {
      console.log(
        `[${tabName}] Component became visible - refetching latest preferences...`
      );

      lastRefetchTimeRef.current = Date.now();

      // Set flag to prevent upsert during API load
      isLoadingFromAPIRef.current = true;
      // Clear state
      setCurrentColumnOrder([]);
      setDefaultPreferences(new Map());
      // Reset refs to allow new column moves
      lastProcessedSignatureRef.current = "";
      lastSavedOrderRef.current = "";
      // Clear any existing loading reset timer
      if (loadingResetTimerRef.current) {
        clearTimeout(loadingResetTimerRef.current);
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Increment force refresh counter to trigger filteredColumns recalculation
      setForceRefreshCounter((prev) => prev + 1);
      // Force refetch from server
      refetchUserPreferences();

      // ALWAYS reset loading flag after a delay
      loadingResetTimerRef.current = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] Loading timeout completed (visibility) - re-enabling column save functionality`
        );
      }, 500);
    }

    // Update visibility tracking
    wasVisibleRef.current = isVisible;
  }, [
    isVisible,
    disableTabManagement,
    refetchUserPreferences,
    tabName,
    storageKey,
  ]);

  // Refetch preferences when refetch trigger changes (e.g., lotNo or colorSlug changes)
  const previousRefetchTriggerRef = useRef(refetchTrigger);

  useEffect(() => {
    // Only applies when refetchTrigger is provided
    if (refetchTrigger === undefined || !disableTabManagement) {
      return;
    }

    const triggerChanged = previousRefetchTriggerRef.current !== refetchTrigger;
    const hasPendingColumnMove = columnMoveTimerRef.current !== null;
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
    const minRefetchInterval = 500; // Minimum 0.5 second between refetches

    // Refetch when trigger value changes (e.g., different lotNo selected)
    // ALSO refetch when going from null/undefined → value (reopening same item)
    const becameActive =
      (previousRefetchTriggerRef.current === null || previousRefetchTriggerRef.current === undefined) &&
      refetchTrigger !== null &&
      refetchTrigger !== undefined;

    const shouldRefetch =
      (triggerChanged || becameActive) &&
      !hasPendingColumnMove &&
      timeSinceLastRefetch > minRefetchInterval;

    if (shouldRefetch) {
      console.log(
        `[${tabName}] Refetch trigger changed (${previousRefetchTriggerRef.current} → ${refetchTrigger}) - refetching latest preferences...${becameActive ? ' (became active)' : ''}`
      );

      lastRefetchTimeRef.current = now;

      // Set flag to prevent upsert during API load
      isLoadingFromAPIRef.current = true;
      // Clear state
      setCurrentColumnOrder([]);
      setDefaultPreferences(new Map());
      // Reset refs to allow new column moves
      lastProcessedSignatureRef.current = "";
      lastSavedOrderRef.current = "";
      // Clear any existing loading reset timer
      if (loadingResetTimerRef.current) {
        clearTimeout(loadingResetTimerRef.current);
      }
      // Clear localStorage to ensure API data is authoritative
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
      // Increment force refresh counter to trigger filteredColumns recalculation
      setForceRefreshCounter((prev) => prev + 1);
      // Force refetch from server
      refetchUserPreferences();

      // ALWAYS reset loading flag after a delay
      loadingResetTimerRef.current = setTimeout(() => {
        isLoadingFromAPIRef.current = false;
        console.log(
          `[${tabName}] Loading timeout completed (trigger) - re-enabling column save functionality`
        );
      }, 500);
    }

    // Update trigger tracking
    previousRefetchTriggerRef.current = refetchTrigger;
  }, [
    refetchTrigger,
    disableTabManagement,
    refetchUserPreferences,
    tabName,
    storageKey,
  ]);

  // Handle reset to default column order
  const handleResetColumns = useCallback(() => {
    console.log(`[${tabName}] Resetting columns to default order`);

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
        `[${tabName}]  Resetting preference_sort to defualt_sort:`,
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
      // const toastId = toast.loading("Resetting columns to default...");
      // upsertUserPreferences({ data: defaultPreferencesData })
      //   .unwrap()
      //   .then(() => {
      //     console.log(
      //       `[${tabName}]  Columns reset to default order successfully`
      //     );
      //     toast.success("Columns reset to default successfully!", {
      //       id: toastId,
      //     });
      //     // Wait before re-enabling column move handler to prevent race conditions
      //     setTimeout(() => {
      //       isLoadingFromAPIRef.current = false;
      //       console.log(
      //         `[${tabName}]  Re-enabled column move handler after reset`
      //       );
      //     }, 1000);
      //   })
      //   .catch((error) => {
      //     console.error(`[${tabName}]  Failed to reset to default:`, error);
      //     toast.error("Failed to reset columns. Please try again.", {
      //       id: toastId,
      //     });
      //     // Re-enable on error
      //     isLoadingFromAPIRef.current = false;
      //   });
      const toastId = toast.loading("Resetting columns to default...");

      (async () => {
        try {
          // --- 🔒 Add same serialization lock here ---
          if ((window as any).__isSavingToDatabricks) {
            console.log(
              `[${tabName}] Waiting for previous save before reset...`
            );
            while ((window as any).__isSavingToDatabricks) {
              await new Promise((r) => setTimeout(r, 300));
            }
          }
          (window as any).__isSavingToDatabricks = true;
          // --------------------------------------------

          await upsertUserPreferences({
            data: defaultPreferencesData,
          }).unwrap();
          console.log(
            `[${tabName}] Columns reset to default order successfully`
          );

          // Refetch preferences to ensure all components get updated data
          setTimeout(() => {
            refetchUserPreferences();
          }, 100);

          toast.success("Columns reset to default successfully!", {
            id: toastId,
          });

          // Wait before re-enabling column move handler to prevent race conditions
          setTimeout(() => {
            isLoadingFromAPIRef.current = false;
            console.log(
              `[${tabName}] Re-enabled column move handler after reset`
            );
          }, 300);
        } catch (error) {
          console.error(`[${tabName}] Failed to reset to default:`, error);
          toast.error("Failed to reset columns. Please try again.", {
            id: toastId,
          });
          // Re-enable on error
          isLoadingFromAPIRef.current = false;
        } finally {
          // --- 🔓 Always release lock ---
          (window as any).__isSavingToDatabricks = false;
        }
      })();
    } else {
      console.warn(
        `[${tabName}]  No user preferences found to reset. Fetching from API first...`
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
