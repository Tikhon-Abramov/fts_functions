import { useDispatch, useSelector } from "react-redux";
import { configureStore, combineReducers, type Middleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { type PersistConfig, persistStore, persistReducer, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import { createNoopStorage } from "./createNoopStorage";
import { baseApi } from './baseApi';
import uiReducer from "./uiSlice";
import errorReducer from './errorSlice'
import toastReduсer from './toastSlice';
import authReducer from './authSlice';



const storage = createNoopStorage();

const rootReducer = combineReducers({
  ui: uiReducer,
  error: errorReducer,
  auth: authReducer,
  toastState: toastReduсer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: import.meta.env.VITE_REDUX_PERSIST_KEY,
  storage,
  whitelist: ['auth'],
  blacklist: [baseApi.reducerPath],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware as Middleware)
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
