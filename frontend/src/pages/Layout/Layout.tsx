import { useCallback } from "react";
import { Outlet } from "react-router";
import { Box, IconButton, Paper, Typography, useTheme } from "@mui/material";
import { DarkMode, Download, Layers, LightMode, Logout } from "@mui/icons-material";
import { useExportFtsFunctionsMutation } from "../../store/baseApi";
import { handleLogout as logout } from '../../store/baseQueryWithInterceptor';
import { useAppDispatch, useAppSelector } from "../../store";
import { selectThemeMode, ThemeMode, toggleTheme } from "../../store/uiSlice";



export function Layout() {
  const dispatch = useAppDispatch();

  const mode = useAppSelector(selectThemeMode);

  const theme = useTheme();
  const c = theme.custom;

  const  [downloadReport, { isLoading: isExportUsersLoading }] = useExportFtsFunctionsMutation();

  const handleToggleTheme = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const handleDownload = useCallback(async () => {
    try {
      await downloadReport().unwrap();
      // showMessage("Файл успешно скачан", SnackbarSeverity.SUCCESS);
    } catch (error) {
      console.error('Export failed:', error);
      // showMessage("Ошибка при скачивании файла", SnackbarSeverity.ERROR);
    }   
  }, [downloadReport, dispatch]);

  const handleLogout = useCallback(() => {
    logout(dispatch)
  }, [dispatch, logout])

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: c.bgDeep,
        color: c.textBody,
        px: { xs: 1.5, md: 3 },
        py: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1600,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            bgcolor: c.bgPaper,
            border: `1px solid ${c.borderMain}`,
            borderRadius: 2,
            px: 2.5,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: c.hoverOverlay,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.accentBlue,
              }}
            >
              <Layers sx={{ fontSize: 20 }} />
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  color: c.textPrimary,
                  fontWeight: 700,
                  lineHeight: 1.15,
                }}
              >
                {"Реестр функций"}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: c.textSecondary, fontSize: "0.74rem" }}
              >
                {"Функциональный анализ · Управление функциями и детализация"}
              </Typography>
            </Box>
          </Box>


          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={handleDownload}
              disabled={isExportUsersLoading}
              size="small"
              sx={{
                color: c.textSecondary,
                border: `1px solid ${c.borderMain}`,
                "&:hover": { bgcolor: c.hoverOverlay },
              }}
            >
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onClick={handleToggleTheme}
              size="small"
              sx={{
                color: c.textSecondary,
                border: `1px solid ${c.borderMain}`,
                "&:hover": { bgcolor: c.hoverOverlay },
              }}
            >
              {mode === ThemeMode.DARK ? (
                <LightMode sx={{ fontSize: 18 }} />
              ) : (
                <DarkMode sx={{ fontSize: 18 }} />
              )}
            </IconButton>
            <IconButton
              onClick={handleLogout}
              size="small"
              sx={{
                color: c.textSecondary,
                border: `1px solid ${c.borderMain}`,
                "&:hover": { bgcolor: c.hoverOverlay },
              }}
            >
              <Logout sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Paper>

        <Outlet />
      </Box>
    </Box>
  );
}