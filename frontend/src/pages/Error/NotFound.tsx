import { ErrorOutlineOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";



export default function NotFound() {
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
        variant="outlined"
        sx={(theme) => ({
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderColor: theme.custom.borderMain,
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <ErrorOutlineOutlined color="error" fontSize="large" />
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            {"404 — страница не найдена"}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {"Проверьте адрес или вернитесь на главную."}
        </Typography>
      </Paper>
    </Box>
  );
}
