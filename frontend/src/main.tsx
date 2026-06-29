import { Box, CircularProgress } from '@mui/material';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router";
import { Provider } from 'react-redux';
import { PersistGate } from "redux-persist/integration/react";
import { SnackbarProvider } from "./components/snackbar";
import { persistor, store } from './store';
import { ThemedApp } from "./theme";
import App from './App';
import './index.css';
import z from 'zod';



function PersistGateSpinner() {
  return (
  <Box
    sx={{
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    }}
    data-testid="persist-gate-spinner"
  >
    <CircularProgress />
  </Box>
  );
}


z.config(z.locales.ru());

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");


createRoot(rootElement).render(
  <BrowserRouter>
    <Provider store={store}>
      <PersistGate loading={<PersistGateSpinner />} persistor={persistor}>
        <SnackbarProvider>
          <ThemedApp>
            <App />  
          </ThemedApp>
        </SnackbarProvider>
      </PersistGate>
    </Provider>
  </BrowserRouter>
);
