import React, { useState } from "react";
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

interface ColumnVisibility {
  field: string;
  headerName: string;
  visible: boolean;
}

interface ColumnVisibilitySettingsProps {
  columns: ColumnVisibility[];
  onToggleColumn: (field: string) => void;
  onUpdateMultiple: (updates: { field: string; visible: boolean }[]) => void;
  isLoading?: boolean;
}

const ColumnVisibilitySettings: React.FC<ColumnVisibilitySettingsProps> = ({
  columns,
  onToggleColumn,
  onUpdateMultiple,
  isLoading = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleShowAll = () => {
    const hiddenColumns = columns.filter((col) => !col.visible);
    if (hiddenColumns.length > 0) {
      onUpdateMultiple(
        hiddenColumns.map((col) => ({ field: col.field, visible: true })),
      );
    }
  };

  const open = Boolean(anchorEl);
  const id = open ? "column-visibility-popover" : undefined;

  const visibleCount = columns?.filter((col) => col.visible).length || 0;
  const hasColumns = columns && columns.length > 0;
  const allVisible = hasColumns && visibleCount === columns.length;

  return (
    <>
      <Tooltip title="Column visibility settings" placement="left">
        <IconButton
          aria-describedby={id}
          onClick={handleClick}
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            "&:hover": {
              backgroundColor: "#fff",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
            },
          }}
        >
          <ViewColumnIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            minWidth: 280,
            maxWidth: 320,
            maxHeight: 450,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        {/* Show All Button */}
        <Box sx={{ p: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<VisibilityIcon />}
            onClick={handleShowAll}
            disabled={!hasColumns || isLoading || allVisible}
            sx={{
              backgroundColor: "#0e1b6b",
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 6,
              py: 1,
              "&:hover": {
                backgroundColor: "#1A2CA3",
              },
              "&:disabled": {
                backgroundColor: "#e0e0e0",
                color: "#9e9e9e",
              },
            }}
          >
            Show All Columns
          </Button>
        </Box>

        {/* Column List */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 1.5,
            pb: 1.5,
          }}
        >
          {hasColumns ? (
            columns.map((column) => {
              const isVisible = column.visible;
              const isLastVisible = isVisible && visibleCount <= 1;

              return (
                <Box
                  key={column.field}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    py: 1,
                    px: 0.5,
                    borderRadius: 1,
                    cursor:
                      isLoading || isLastVisible ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                  onClick={() => {
                    if (!isLoading && !isLastVisible) {
                      onToggleColumn(column.field);
                    }
                  }}
                >
                  {/* Eye Icon */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isVisible ? "#0e1b6b" : "#9e9e9e",
                    }}
                  >
                    {isVisible ? (
                      <VisibilityIcon sx={{ fontSize: 20 }} />
                    ) : (
                      <VisibilityOffIcon sx={{ fontSize: 20 }} />
                    )}
                  </Box>

                  {/* Column Name */}
                  <Typography
                    variant="body2"
                    sx={{
                      flex: 1,
                      fontWeight: 500,
                      color: isVisible ? "#333" : "#9e9e9e",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      letterSpacing: "0.5px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column.headerName}
                  </Typography>

                  {/* Drag Handle */}
                  {/* <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#bdbdbd",
                    }}
                  >
                    <DragIndicatorIcon sx={{ fontSize: 20 }} />
                  </Box> */}
                </Box>
              );
            })
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 2, textAlign: "center" }}
            >
              Loading columns...
            </Typography>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default ColumnVisibilitySettings;
