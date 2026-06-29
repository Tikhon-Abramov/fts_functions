import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ErrorState = {
  [key: number]: boolean;
}

const initialState: ErrorState = {
  404: false,
  403: false,
  401: false,
  429: false,
  500: false,
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    showError(state, action: PayloadAction<number>) {
      state[action.payload] = true;
    },
    resetError(state, action: PayloadAction<number>) {
      state[action.payload] = false;
    },
    resetAllErrors(state) {
      Object.keys(state).forEach((key) => {
        const errorCode = Number(key);
        state[errorCode] = false;
      });
    },
  },
});

export const { showError, resetError, resetAllErrors } = errorSlice.actions;

export default errorSlice.reducer;
