import { ErrorOutlineOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
// import { NavLink } from "react-router";



export default function InternalServerError() {
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
            {"Что-то пошло не так на стороне сервера. Мы уже работаем над решением проблемы. Попробуйте позже."}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {"Данные авторизации устарели или недействительны. Пожалуйста, войдите снова."}
        </Typography>
        {/* <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <NavLink to="/login">
                Войти
            </NavLink>
        </Box> */}
      </Paper>
    </Box>
  );
}
