import { useDispatch, useSelector } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { baseApi } from "src/shared/api/baseApi";
import { rtkErrorMiddleware } from "src/shared/api/rtkErrorMiddleware";

import authReducer from "./authSlice";
import uiReducer from "./uiSlice";

// ---------- redux-persist ----------
//
// Only the `ui` slice is persisted. We deliberately exclude:
//   - `auth`            — has its own access/refresh-token TTL handling
//                         in `authApi`; persisting tokens here would race
//                         with the `/v1/auth/me` rehydrate.
//   - `baseApi`         — the RTK Query cache would balloon localStorage
//                         and serve stale data on cold start.
//
// Within `ui`, transient bits (`deleteDialog`, `snackbar`, the not-yet-
// committed `functionForm` draft) are blacklisted so a reload never re-opens
// a confirm dialog mid-action or flashes an old toast.
const uiPersistConfig = {
  key: "ui",
  storage,
  whitelist: [
    "themeMode",
    "panelMode",
    "editingId",
    "panelExpanded",
    "filterModel",
    "sortModel",
    "searchInput",
    "modalFunctionId",
    "selectedRowId",
    "rightTab",
  ],
};

const persistedUiReducer = persistReducer(uiPersistConfig, uiReducer);

export const store = configureStore({
  reducer: {
    ui: persistedUiReducer,
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // redux-persist dispatches non-serialisable actions for its lifecycle
      // events (FLUSH/REHYDRATE/...). Tell the default `serializableCheck`
      // middleware to ignore them; everything we *write* to state stays
      // JSON-safe.
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware, rtkErrorMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
