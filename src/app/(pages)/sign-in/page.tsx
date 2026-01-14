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
import { useLoginMutation } from "@/redux/services/authApi";
import { setAuthTokens, setUserInfo } from "@/utils/auth";
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<
    "error" | "success" | "info" | "warning"
  >("info");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    setMessage("");

    try {
      // Call the login API
      const response = await login({ email, password }).unwrap();

      if (response.status === 200 && response.data) {
        // Store authentication tokens
        setAuthTokens({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          token_type: response.data.token_type,
        });

        // Store user information
        setUserInfo({
          user_id: response.data.user_id,
          user_name: response.data.user_name,
          email: response.data.email,
        });

        setSeverity("success");
        setMessage("Signed in successfully!");

        // Use window.location.href for full page reload to ensure cookie is sent to server
        setTimeout(() => {
          window.location.href = "/profile";
        }, 500);
      } else {
        setSeverity("error");
        setMessage(response.message || "Login failed");
      }
    } catch (error: any) {
      setSeverity("error");
      setMessage(
        error?.data?.message ||
        error?.data?.system_error_message ||
        "Invalid email or password"
      );
    }
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
            disabled={isLoading}
          >
            {isLoading ? (
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
