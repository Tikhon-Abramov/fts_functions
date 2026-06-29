import { useState } from "react";
import { Box, Button, IconButton, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { LockOutlined, PersonOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginDto } from "./schema";
import { useAuthControllerLoginV1Mutation } from "../../store/ftsFunctionRegistry";
import { setUser } from "../../store/authSlice";
import { useAppDispatch } from "../../store";
import type { ErrorResponse } from "../../store/errors";



function extractErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: ErrorResponse }).data;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(", ") : data.message;
    }
  }
  return "Не удалось выполнить вход. Попробуйте позже.";
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [login, { isLoading }] = useAuthControllerLoginV1Mutation();

  const handleLogin: SubmitHandler<LoginDto> = async (formData) => {
    setFormError(null);
    try {
      const response = await login({
        loginDto: {
          username: formData.username,
          password: formData.password,
        },
      }).unwrap();
      dispatch(setUser(response.user));
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  const { ref: usernameRef, ...usernameField } = register("username");
  const { ref: passwordRef, ...passwordField } = register("password");

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: theme.palette.background.default,
        p: 2,
      })}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit(handleLogin)}
        variant="outlined"
        sx={(theme) => ({
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderRadius: 2,
          borderColor: theme.custom.borderMain,
          bgcolor: theme.palette.background.paper,
        })}
      >
        {/* Заголовок */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            mb: 3,
          }}
        >
            <Box
                component="img"
                src="/logo.svg"
                alt=""
                sx={{ width: 70, height: 70 }}
            />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Вход
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Введите логин и пароль для входа в систему
          </Typography>
        </Box>

        {/* Поля */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Логин"
            fullWidth
            autoFocus
            autoComplete="username"
            disabled={isLoading}
            error={!!errors.username}
            helperText={errors.username?.message}
            inputRef={usernameRef}
            {...usernameField}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlined
                      fontSize="small"
                      sx={(theme) => ({ color: theme.custom.textMuted })}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Пароль"
            type={showPassword ? "text" : "password"}
            fullWidth
            autoComplete="current-password"
            disabled={isLoading}
            error={!!errors.password}
            helperText={errors.password?.message}
            inputRef={passwordRef}
            {...passwordField}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined
                      fontSize="small"
                      sx={(theme) => ({ color: theme.custom.textMuted })}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {/* Ошибка авторизации */}
        {formError && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {formError}
          </Typography>
        )}

        {/* Кнопка */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={isLoading}
          sx={(theme) => ({
            mt: 3,
            py: 1.1,
            fontWeight: 600,
            textTransform: "none",
            color: "#fff",
            backgroundImage: `linear-gradient(90deg, ${theme.custom.gradientFrom}, ${theme.custom.gradientTo})`,
            "&:hover": {
              backgroundImage: `linear-gradient(90deg, ${theme.custom.gradientFromHover}, ${theme.custom.gradientToHover})`,
            },
            "&.Mui-disabled": {
              backgroundImage: "none",
              bgcolor: theme.custom.borderMedium,
              color: theme.custom.textMuted,
            },
          })}
        >
          {isLoading ? "Вход…" : "Войти"}
        </Button>
      </Paper>
    </Box>
  );
}
