
"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Avatar, Popover } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  menuItems: SidebarItem[];
  activeMenu: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  activeMenu,
  onLogout,
}) => {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Popover state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const storedName = localStorage.getItem("userName");
      const storedEmail = localStorage.getItem("userEmail");
      setUserName(storedName);
      setUserEmail(storedEmail);
    };

    loadUser();
    const timer = setTimeout(loadUser, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleUserClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <Box
      sx={{
        position: "fixed",
        width: 200,
        height: "100vh",
        borderRight: "1px solid #ddd",
        bgcolor: "#131C55",
        transition: "width 0.3s ease",
        overflow: "hidden",
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            borderRadius: "16px",
          }}
        >
          <Box
            sx={{
              width: 256,
              height: 64,
              padding: 1.25, // 10px
              backgroundColor: " #0E1B6B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 900,
                fontStyle: "normal",
                fontSize: "24px",
                lineHeight: "100%",
                letterSpacing: 0,
                color: "#ffff",
              }}
            >
              CXi
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      {menuItems.map((item) => (
        <Box
          key={item.key}
          onClick={() => router.push(item.path)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 1.5,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: activeMenu === item.key ? "bold" : "normal",
            color: activeMenu === item.key ? "#FFFFFF" : "#8E92AD",
            borderRadius: "10px",
            justifyContent: "flex-start",
            "&:hover": { color: "#F3F4F6" }, // only color changes
          }}
        >
          {item.icon}
          {item.label}
        </Box>
      ))}

      {/* User Box */}
      <Box
        sx={{
          mt: "auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          onClick={handleUserClick} // opens popover
          sx={{
            padding: "10px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            maxWidth: 300,
            cursor: "pointer",
            "&:hover": {}, // nothing changes on hover
          }}
        >
          <Avatar
            alt="Tim Cook"
            src="https://www.example.com/tim-cook.jpg"
            sx={{
              marginRight: "10px",
              width: 40,
              height: 40,
            }}
          />
          <Box sx={{ color: "#fff" }}>
            <Typography
              sx={{ fontWeight: 700, fontSize: "16px", color: "#fff" }}
            >
              {userName || "Guest User"}
            </Typography>
            <Typography sx={{ fontSize: "10px", color: "#fff", mt: "-9px" }}>
              {userEmail || "No email found"}
            </Typography>
          </Box>
        </Box>

        {/* Logout Popover */}
        {/* <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          transformOrigin={{ vertical: "bottom", horizontal: "center" }}
          PaperProps={{
            sx: {
              p: 1,
              borderRadius: "12px", // slightly more rounded for glass look
              bgcolor: "rgba(255, 255, 255, 0.1)", // semi-transparent
              backdropFilter: "blur(10px)", // blur effect
              border: "1px solid rgba(255, 255, 255, 0.2)", // subtle border
              boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)", // subtle shadow
            },
          }}
        >
          <Button
            fullWidth
            onClick={() => {
              handleClose();
              onLogout();
            }}
            startIcon={<LogoutIcon />}
            variant="text"
            disableRipple
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#fff",
              justifyContent: "flex-start",
              padding: "8px 16px",
              minHeight: "40px",
              lineHeight: "1.2",
              "&:hover": {
                backgroundColor: "transparent",
                transform: "none",
                padding: "8px 16px",
              },
              "&:focus": {
                backgroundColor: "transparent",
                transform: "none",
              },
              "&:active": {
                backgroundColor: "transparent",
                transform: "none",
              },
            }}
          >
            Logout
          </Button>
        </Popover> */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
          PaperProps={{
            sx: {
              mt: -1,
              ml: -1,
              bgcolor: "#1E2A78",
              color: "#fff",
              borderRadius: "12px",
              p: 1.5,
              minWidth: 180,
            },
          }}
        >
          <Typography
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#fff",
              mb: 1,
              textAlign: "center",
            }}
          >
            {userName || "Guest User"}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={() => {
              handleClose();
              onLogout();
            }}
            startIcon={<LogoutIcon />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              bgcolor: "#0e1b6b",
              "&:hover": { bgcolor: "#5767c1" },
            }}
          >
            Logout
          </Button>
        </Popover>
      </Box>
    </Box>
  );
};

export default Sidebar;
