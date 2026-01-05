"use client";
import React, { useState } from "react";
import {
  Button,
  Typography,
  Link,
  Box,
  Container,
  Alert,
  Stack,
  CircularProgress,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CustomTextField from "@/components/Common/CustomTextField";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";
import Cookies from "js-cookie";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<
    "error" | "success" | "info" | "warning"
  >("info");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // const dummyUser = {
  //   email: "drivera@mdbmail.com",
  //   password: "drivera123",
  // };

  // const allowedUsers = [
  //   { email: "drivera@mdbmail.com", password: "drivera123" },
  //   { email: "Shipping@mdbmail.com", password: "Shipping123" },
  //   { email: "Cs@mdbmail.com", password: "Csmdb123" },
  //   { email: "jbedanova@mdbmail.com", password: "jbedanova123" },
  //   { email: "AChaleekul@mdbmail.com", password: "AChaleekul123" },
  //   { email: "ruth@mdbmail.com", password: "ruth123" },
  //   { email: "ddigamo@mdbmail.com", password: "ddigamo123" },
  //   { email: "kledesma@mdbmail.com", password: "kledesma123" },
  //   { email: "aabelgas@mdbmail.com", password: "aabelgas123" },
  //   { email: "rmanzanare@mdbmail.com", password: "rmanzanare123" },
  //   { email: "rpandaog@mdbmail.com", password: "rpandaog123" },
  //   { email: "mperez@mdbmail.com", password: "mperez123" },
  //   { email: "jgascon@mdbmail.com", password: "jgascon123" },
  //   { email: "jlucero@mdbmail.com", password: "jlucero123" },
  //   { email: "jsabaldana@mdbmail.com", password: "jsabaldana123" },
  //   { email: "dgebretensai@mdbmail.com", password: "dgebretensai123" },
  //   { email: "sjoya@mdbmail.com", password: "sjoya123" },
  //   { email: "s.welke@mdbmail.com", password: "s.welke123" },
  // ];

  const allowedUsers = [
    { name: "Drivera ", email: "drivera@mdbmail.com", password: "drivera123" },
    {
      name: "Shipping Team",
      email: "Shipping@mdbmail.com",
      password: "Shipping123",
    },
    { name: "CS Team", email: "Cs@mdbmail.com", password: "Csmdb123" },
    {
      name: "J. Bedanova",
      email: "jbedanova@mdbmail.com",
      password: "jbedanova123",
    },
    {
      name: "Amy Chaleekul",
      email: "AChaleekul@mdbmail.com",
      password: "@AChaleekul3",
    },
    { name: "Ruth Sutton", email: "ruth@mdbmail.com", password: "@ruth_541" },
    {
      name: "Dana Digamo",
      email: "ddigamo@mdbmail.com",
      password: "ddigamo@56",
    },
    {
      name: "Kristine Ledesma",
      email: "kledesma@mdbmail.com",
      password: "Kledesma!2",
    },
    {
      name: "Allan R. Abelgas",
      email: "aabelgas@mdbmail.com",
      password: "@aabelgas9",
    },
    {
      name: "Ryan Manzanare",
      email: "rmanzanare@mdbmail.com",
      password: "rmanzanare@78",
    },
    {
      name: "Ronnie Pandaog",
      email: "rpandaog@mdbmail.com",
      password: "@rpandaog67!",
    },
    { name: "Mae Perez", email: "mperez@mdbmail.com", password: "mperez@56" },
    {
      name: "Jaynard Gascon",
      email: "jgascon@mdbmail.com",
      password: "jgascon@98",
    },
    {
      name: "Jessa Lucero",
      email: "jlucero@mdbmail.com",
      password: "jlucero@51",
    },
    {
      name: "Jay A. Sabaldana",
      email: "jsabaldana@mdbmail.com",
      password: "@jsabaldana1",
    },
    {
      name: "Daniel Gebretensai",
      email: "dgebretensai@mdbmail.com",
      password: "dgebretensai@18!",
    },
    { name: "Sandra Joya", email: "sjoya@mdbmail.com", password: "sjoya_19!" },
    {
      name: "Stephanie Welke",
      email: "s.welke@mdbmail.com",
      password: "welke1s_09",
    },
  ];

  const router = useRouter();

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (loading) return;
  //   setLoading(true);
  //   setMessage("");

  //   setTimeout(() => {
  //     if (email === dummyUser.email && password === dummyUser.password) {
  //       setSeverity("success");
  //       setMessage("Signed in successfully!");
  //       localStorage.setItem("loggedIn", "true");

  //       setTimeout(() => {
  //         router.push("/customer-profile");
  //       }, 500);
  //     } else {
  //       setSeverity("error");
  //       setMessage("Invalid email or password");
  //     }
  //     setLoading(false);
  //   }, 1000);
  // };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;
    setLoading(true);
    setMessage("");

    setTimeout(() => {
      // Check if the entered credentials match any allowed user
      const user = allowedUsers.find(
        (u) => u.email === email && u.password === password
      );

      if (user) {
        setSeverity("success");
        setMessage("Signed in successfully!");
        // Set cookie for server-side middleware (Vercel)
        Cookies.set("loggedIn", "true", { expires: 7, path: "/" });
        Cookies.set("userEmail", user.email, { expires: 7, path: "/" });
        Cookies.set("userName", user.email.split("@")[0], {
          expires: 7,
          path: "/",
        });
        // Set localStorage for client-side checks
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("userEmail", user.email);
        // localStorage.setItem("userName", user.email.split("@")[0]);
        localStorage.setItem("userName", user.name);

        // Use window.location.href for full page reload to ensure cookie is sent to server
        setTimeout(() => {
          window.location.href = "/profile";
        }, 500);
      } else {
        setSeverity("error");
        setMessage("Invalid email or password");
      }

      setLoading(false);
    }, 1000);
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        paddingBlock: 12,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          padding: 4,
          backgroundColor: "white",
          borderRadius: 3,
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 2 }}>
          Sign in
        </Typography>

        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 3, color: "gray" }}
        >
          Stay updated on your professional world
        </Typography>

        <Stack gap={2}>
          <CustomTextField
            label="Email or Phone"
            fullWidth
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="Email address "
          />
          {/* <CustomTextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder=" password"
          /> */}
          <CustomTextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="Password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ py: 1.5, mt: 2, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </Stack>

        {message && (
          <Alert severity={severity} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}

        {/* <Typography variant="body2" align="center" mt={4}>
          <Link href="forgot-password" variant="body2">
            Forgot password?
          </Link>
        </Typography> */}
      </Box>
    </Container>
  );
}
