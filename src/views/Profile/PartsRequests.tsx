"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetPartRequestsQuery,
  useGetPartRequestDetailQuery,
  PartRequestTab,
  PartRequestHeader,
} from "@/redux/services/partRequestsApi";
import Loader from "@/components/Common/Loader";
import PartRequestDraftOrderForm from "./PartRequestDraftOrderForm";

const TABS: { key: PartRequestTab; label: string }[] = [
  { key: "needs_review", label: "Needs Review" },
  { key: "submitted", label: "Submitted to Shopify" },
];

function fmtDate(val: string | null) {
  if (!val) return "—";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleString();
}

function customerTypeColor(type: string | null) {
  switch (type) {
    case "RETAILER":
      return "#4658AC";
    case "GIFT":
      return "#9c27b0";
    default:
      return "#2e7d32"; // DTC
  }
}

// ─── List table ──────────────────────────────────────────────────────────────

function RequestsTable({
  rows,
  tab,
  onRowClick,
}: {
  rows: PartRequestHeader[];
  tab: PartRequestTab;
  onRowClick: (id: string) => void;
}) {
  return (
    <TableContainer sx={{ maxHeight: 600, overflowY: "auto", border: "1px solid #ddd" }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {["Submitted", "Customer", "Email", "Type", "Order No", "Status", "Zendesk", tab === "submitted" ? "Shopify Draft Order" : "Picked Up"].map((h) => (
              <TableCell
                key={h}
                sx={{ bgcolor: "#f5f5f5", color: "#111", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", borderBottom: "2px solid #ddd" }}
              >
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4, color: "#999" }}>
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                hover
                onClick={() => onRowClick(row.id)}
                sx={{ cursor: "pointer", "&:nth-of-type(even)": { bgcolor: "#fafafa" } }}
              >
                <TableCell sx={{ fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(row.submitted_at)}</TableCell>
                <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{row.customer_name || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>{row.customer_email || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>
                  {row.customer_type && (
                    <Chip
                      label={row.customer_type}
                      size="small"
                      sx={{ bgcolor: customerTypeColor(row.customer_type), color: "#fff", fontSize: 10, fontWeight: 700, height: 20 }}
                    />
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: 12 }}>{row.order_no || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>
                  <Chip label={row.status || "unknown"} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                </TableCell>
                <TableCell sx={{ fontSize: 12 }}>{row.zendesk_ticket_id || "—"}</TableCell>
                <TableCell sx={{ fontSize: 12 }}>
                  {tab === "submitted" ? row.shopify_draft_order_id || "—" : row.cxi_picked_up_at ? fmtDate(row.cxi_picked_up_at) : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ─── Detail panel ────────────────────────────────────────────────────────────

function DetailPanel({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data, isFetching, isError } = useGetPartRequestDetailQuery(requestId);
  const header = data?.header;
  const [draftOrderOpen, setDraftOrderOpen] = useState(false);

  return (
    <>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1200 }}
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: "55vw",
          backgroundColor: "#f9fafb",
          borderLeft: "1px solid #e0e0e0",
          boxShadow: "-6px 0 18px rgba(0,0,0,0.1)",
          zIndex: 1300,
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: "20px",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2, backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb" }}>
          <Typography variant="h6" fontWeight={700}>Part Request Detail</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {data && (
              <Box
                component="button"
                onClick={() => setDraftOrderOpen(true)}
                sx={{ px: 2, py: 0.75, border: "none", borderRadius: 1, bgcolor: "#111", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Create Draft Order
              </Box>
            )}
            <IconButton onClick={onClose} sx={{ border: "1px solid #e0e0e0", width: 36, height: 36, borderRadius: "10px" }}>
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
        {data && (
          <PartRequestDraftOrderForm
            open={draftOrderOpen}
            onClose={() => setDraftOrderOpen(false)}
            request={data}
          />
        )}

        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
          {isFetching ? (
            <Loader title="Loading request..." />
          ) : isError || !data ? (
            <Alert severity="error">Failed to load request detail.</Alert>
          ) : (
            <>
              {/* Header info */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#fff", borderRadius: 2, border: "1px solid #eee" }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {header?.customer_name || "—"}
                  {header?.customer_type && (
                    <Chip label={header.customer_type} size="small" sx={{ ml: 1, bgcolor: customerTypeColor(header.customer_type), color: "#fff", fontSize: 10 }} />
                  )}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, fontSize: 13 }}>
                  <div><b>Email:</b> {header?.customer_email || "—"}</div>
                  <div><b>Phone:</b> {header?.customer_phone || "—"}</div>
                  <div><b>Order No:</b> {header?.order_no || "—"}</div>
                  <div><b>Status:</b> {header?.status || "—"}</div>
                  <div><b>Review Type:</b> {header?.review_type || "—"}</div>
                  <div><b>Retailer:</b> {header?.retailer_name || "—"}</div>
                  <div><b>Submitted:</b> {fmtDate(header?.submitted_at ?? null)}</div>
                  <div><b>Picked Up:</b> {header?.cxi_picked_up_at ? fmtDate(header.cxi_picked_up_at) : "Not yet"}</div>
                  <div>
                    <b>Zendesk:</b>{" "}
                    {header?.zendesk_ticket_id ? (
                      <span>#{header.zendesk_ticket_id}</span>
                    ) : "—"}
                  </div>
                  <div><b>Shopify Draft Order:</b> {header?.shopify_draft_order_id || "Not submitted"}</div>
                </Box>
                {(header?.address1 as string) && (
                  <Box sx={{ mt: 1.5, fontSize: 13 }}>
                    <b>Ship to:</b> {header?.address1 as string}{header?.address2 ? `, ${header.address2}` : ""}, {header?.city as string}, {header?.state as string} {header?.zip as string}, {header?.country as string}
                  </Box>
                )}
              </Box>

              {/* Items + parts */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Items ({data.items.length})
              </Typography>
              {data.items.map((item) => (
                <Box key={item.id} sx={{ mb: 2, p: 2, bgcolor: "#fff", borderRadius: 2, border: "1px solid #eee" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{item.product_name || item.sku || `Item #${item.item_no}`}</Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>SKU: {item.sku || "—"} · Lot: {item.lot_number || "—"}</Typography>
                    </Box>
                    {item.item_price != null && (
                      <Chip label={`$${item.item_price}`} size="small" variant="outlined" />
                    )}
                  </Box>
                  {item.reason && <Typography variant="body2" sx={{ mb: 0.5 }}><b>Reason:</b> {item.reason}</Typography>}
                  {item.description && <Typography variant="body2" sx={{ mb: 1, color: "#555" }}>{item.description}</Typography>}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                      {item.image_urls.map((url, i) => (
                        <MuiLink key={i} href={url} target="_blank" rel="noopener noreferrer" sx={{ fontSize: 11 }}>
                          Photo {i + 1}
                        </MuiLink>
                      ))}
                    </Box>
                  )}

                  {item.parts.length > 0 && (
                    <TableContainer sx={{ border: "1px solid #eee", borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            {["Part #", "Part Name", "SKU", "Qty", "Refund Cat", "Refund %", "Refund Max"].map((h) => (
                              <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, bgcolor: "#f8f8f8" }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {item.parts.map((part) => (
                            <TableRow key={part.id}>
                              <TableCell sx={{ fontSize: 12 }}>{part.part_number || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.part_name || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.part_sku || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.quantity ?? "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.refund_cat || "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.refund_percent != null ? `${part.refund_percent}%` : "—"}</TableCell>
                              <TableCell sx={{ fontSize: 12 }}>{part.refund_max != null ? `$${part.refund_max}` : "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              ))}
            </>
          )}
        </Box>
      </motion.div>
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function PartsRequests() {
  const [tab, setTab] = useState<PartRequestTab>("needs_review");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data, isFetching, isError } = useGetPartRequestsQuery({ tab, q: query, page, page_size: 50 });

  const rows = useMemo(() => data?.data ?? [], [data]);

  const handleTabClick = (key: PartRequestTab) => {
    setTab(key);
    setPage(1);
  };

  const handleSearch = () => {
    setQuery(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQuery("");
    setPage(1);
  };

  return (
    <Box sx={{ pt: 2, pr: 2, pb: 2, pl: "80px", height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {/* Filter tabs */}
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          {TABS.map((t) => {
            const isActive = t.key === tab;
            return (
              <Box
                key={t.key}
                component="button"
                onClick={() => handleTabClick(t.key)}
                sx={{
                  px: 2,
                  py: 0.75,
                  border: "1px solid",
                  borderColor: isActive ? "#111" : "#ccc",
                  bgcolor: isActive ? "#111" : "#f0f0f0",
                  color: isActive ? "#fff" : "#333",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": { bgcolor: isActive ? "#000" : "#e0e0e0" },
                }}
              >
                {t.label}
              </Box>
            );
          })}
        </Box>

        {/* Search bar */}
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search by customer name, email, or order number..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            sx={{ width: 400 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "#999" }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
          <Box
            component="button"
            onClick={handleSearch}
            sx={{ px: 2, py: "7px", bgcolor: "#111", color: "#fff", border: "none", borderRadius: 1, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >
            Search
          </Box>
          {data && !isFetching && (
            <Typography variant="caption" sx={{ color: "#999", ml: 1 }}>
              {data.total_records} request{data.total_records !== 1 ? "s" : ""}
            </Typography>
          )}
        </Box>

        {/* Table */}
        {isFetching ? (
          <Loader />
        ) : isError ? (
          <Alert severity="error">Failed to load part requests.</Alert>
        ) : (
          <RequestsTable rows={rows} tab={tab} onRowClick={setSelectedRequestId} />
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 2 }}>
            <Box
              component="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              sx={{ px: 2, py: 0.5, border: "1px solid #ccc", borderRadius: 1, bgcolor: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}
            >
              Prev
            </Box>
            <Typography variant="caption" sx={{ alignSelf: "center" }}>
              Page {data.current_page} of {data.total_pages}
            </Typography>
            <Box
              component="button"
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
              sx={{ px: 2, py: 0.5, border: "1px solid #ccc", borderRadius: 1, bgcolor: "#fff", cursor: page >= data.total_pages ? "not-allowed" : "pointer", opacity: page >= data.total_pages ? 0.5 : 1 }}
            >
              Next
            </Box>
          </Box>
        )}
      </Box>

      <AnimatePresence>
        {selectedRequestId && (
          <DetailPanel requestId={selectedRequestId} onClose={() => setSelectedRequestId(null)} />
        )}
      </AnimatePresence>
    </Box>
  );
}
