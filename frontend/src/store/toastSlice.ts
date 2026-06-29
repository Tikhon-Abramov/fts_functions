import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export enum ToastDuration {
  Short = 'SHORT',
  Long = 'LONG',
  Indefinite = 'INDEFINITE',
}

export const ToastDurationToMillis: Record<ToastDuration, number> = {
  [ToastDuration.Short]: 4_000,
  [ToastDuration.Long]: 10_000,
  [ToastDuration.Indefinite]: 2_147_483_647,
};

export type ToastData = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration: ToastDuration;
  action?: {
    label: string;
    actionId: string;
  } | undefined;
};

export type ServiceToastData = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration: ToastDuration;
  action?: {
    label: string;
    actionId: string;
  } | undefined;
};

type ToastState = {
  queue: ToastData[];
  currentToast?: ToastData | undefined;
  serviceToast?: ServiceToastData | undefined;
} 

const initialState: ToastState = {
  queue: [],
  currentToast: undefined,
  serviceToast: undefined,
};

let toastId = 0;

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<{
      type: "success" | "error" | "warning" | "info";
      message: string;
      duration?: ToastDuration | undefined;
      toastAction?: { label: string; actionId: string } | undefined;
    }>) => {
      const { type, message, duration = ToastDuration.Short, toastAction } = action.payload;
      const toast: ToastData = {
        id: String(++toastId),
        type,
        message,
        duration,
        action: toastAction,
      };
      state.queue.push(toast);
      if (!state.currentToast && !state.serviceToast) {
        state.currentToast = state.queue.shift();
      }
    },

    showServiceToast: (state, action: PayloadAction<{
      type: "success" | "error" | "warning" | "info";
      message: string;
      duration?: ToastDuration | undefined;
    }>) => {
      const {
        type,
        message,
        duration = ToastDuration.Indefinite,
      } = action.payload;
      if (state.currentToast && !state.serviceToast) {
        state.queue.unshift(state.currentToast);
        state.currentToast = undefined;
      }

      state.serviceToast = {
        type,
        message,
        duration,
      };
    },

    updateServiceToast: (state, action: PayloadAction<{
      message: string;
      duration?: ToastDuration | undefined;
    }>) => {
      if (state.serviceToast) {
        state.serviceToast.message = action.payload.message;
        if (action.payload.duration) {
          state.serviceToast.duration = action.payload.duration;
        }
      }
    },

    finishServiceToast: (state) => {
      state.serviceToast = undefined;
      if (!state.currentToast && state.queue.length > 0) {
        state.currentToast = state.queue.shift();
      }
    },

    updateCurrentToast: (state, action: PayloadAction<{
      message: string;
      duration?: ToastDuration;
    }>) => {
      if (state.currentToast) {
        state.currentToast.message = action.payload.message;
        if (action.payload.duration) {
          state.currentToast.duration = action.payload.duration;
        }
      }
    },

    showNextToast: (state) => {
      if (!state.currentToast && !state.serviceToast && state.queue.length > 0) {
        state.currentToast = state.queue.shift();
      }
    },

    finishCurrentToast: (state) => {
      state.currentToast = undefined;
    },

    clearToasts: (state) => {
      state.queue = [];
      state.currentToast = undefined;
      state.serviceToast = undefined;
    },
  },
});

export const {
  showToast,
  showServiceToast,
  updateServiceToast,
  finishServiceToast,
  updateCurrentToast,
  showNextToast,
  finishCurrentToast,
  clearToasts,
} = toastSlice.actions;

export const showSuccessToast = (message: string, duration?: ToastDuration) =>
  showToast({ type: 'success', message, duration });

export const showErrorToast = (message: string, duration?: ToastDuration) =>
  showToast({ type: 'error', message, duration });

export const showWarningToast = (message: string, duration?: ToastDuration) =>
  showToast({ type: 'warning', message, duration });

export const showInfoToast = (message: string, duration?: ToastDuration) =>
  showToast({ type: 'info', message, duration });

export const showToastWithAction = (payload: {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: ToastDuration;
  action?: { label: string; actionId: string };
}) => showToast({
  type: payload.type,
  message: payload.message,
  duration: payload.duration,
  toastAction: payload.action
});

export const showServiceWarningToast = (message: string, duration?: ToastDuration) =>
  showServiceToast({ type: 'warning', message, duration });

export const showServiceErrorToast = (message: string, duration?: ToastDuration) =>
  showServiceToast({ type: 'error', message, duration });

export const showServiceSuccessToast = (message: string, duration?: ToastDuration) =>
  showServiceToast({ type: 'success', message, duration });

export const showServiceInfoToast = (message: string, duration?: ToastDuration) =>
  showServiceToast({ type: 'info', message, duration });

export default toastSlice.reducer;
