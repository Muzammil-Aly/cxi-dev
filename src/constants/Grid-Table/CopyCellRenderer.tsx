// import React, { useState } from "react";
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import { Tooltip, IconButton } from "@mui/material";
// import toast from "react-hot-toast";
// import { ICellRendererParams } from "ag-grid-community";
// import "./ResponsiveDashbord.css";

// const CopyCellRenderer: React.FC<ICellRendererParams> = (props) => {
//   const [hover, setHover] = useState(false);
//   const { value, colDef } = props;

//   const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.stopPropagation();
//     e.preventDefault();
//     e.nativeEvent.stopImmediatePropagation();

//     if (value !== undefined && value !== null) {
//       navigator.clipboard.writeText(String(value)).then(() => {
//         toast.success("Copied to clipboard!");
//       });
//     }
//   };

//   const handleOpenLink = (e: React.MouseEvent<HTMLSpanElement>) => {
//     e.stopPropagation(); // stop grid row click
//     e.nativeEvent.stopImmediatePropagation();
//     if (value) {
//       window.open(String(value), "_blank", "noopener,noreferrer");
//     }
//   };

//   const isOrderUrl = (colDef?.field === "order_url" || colDef?.field === "url") && value && value !== "N/A";

//   return (
//     <div
//       style={{ display: "flex", alignItems: "center" }}
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//       onClick={(e) => e.stopPropagation()} // prevent row click
//     >
//       {isOrderUrl ? (
//         <span
//           onClick={handleOpenLink}
//           style={{
//             color: "#3B82F6",
//             cursor: "pointer",
//           }}
//           onMouseEnter={(e) =>
//             (e.currentTarget.style.textDecoration = "underline")
//           }
//           onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
//           className="order-link"
//         >
//           {String(value)}
//         </span>
//       ) : (
//         <span>{value ?? "N/A"}</span>
//       )}

//       {hover && value !== null && value !== undefined && value !== "N/A" && (
//         <Tooltip title="Copy to clipboard">
//           <IconButton
//             size="small"
//             onClick={handleCopy}
//             style={{ marginLeft: 4 }}
//             className="no-drag"
//           >
//             <ContentCopyIcon fontSize="inherit" />
//           </IconButton>
//         </Tooltip>
//       )}
//     </div>
//   );
// };

// export default CopyCellRenderer;
import React, { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Tooltip, IconButton } from "@mui/material";
import toast from "react-hot-toast";
import { ICellRendererParams } from "ag-grid-community";
import "./ResponsiveDashbord.css";

const CopyCellRenderer: React.FC<ICellRendererParams> = (props) => {
  const [hover, setHover] = useState(false);
  const { value, colDef } = props;

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    if (value !== undefined && value !== null) {
      navigator.clipboard.writeText(String(value)).then(() => {
        toast.success("Copied to clipboard!");
      });
    }
  };

  const handleOpenLink = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (value) {
      window.open(String(value), "_blank", "noopener,noreferrer");
    }
  };

  const isOrderUrl = (colDef?.field === "order_url" || colDef?.field === "url") && value && value !== "N/A";

  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "start" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => e.stopPropagation()} // prevent row click
    >
      {/* Copy icon always rendered, just hidden when not hovering */}
      {value !== null && value !== undefined && value !== "N/A" && (
        <Tooltip title="Copy to clipboard">
          <IconButton
            size="small"
            onClick={handleCopy}
            style={{
              marginLeft: -25,
              visibility: hover ? "visible" : "hidden",
            }}
            className="no-drag"
          >
            <ContentCopyIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}

      {isOrderUrl ? (
        <span
          onClick={handleOpenLink}
          style={{
            color: "#3B82F6",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.textDecoration = "underline")
          }
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          className="order-link"
        >
          {String(value)}
        </span>
      ) : (
        <span>{value ?? "N/A"}</span>
      )}
    </div>
  );
};

export default CopyCellRenderer;
