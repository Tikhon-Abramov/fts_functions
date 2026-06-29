import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { LoginResponseDto } from './ftsFunctionRegistry'



export type AuthState = {
  user: LoginResponseDto['user'] | null
}

const initialState: AuthState = {
  user: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<LoginResponseDto['user'] | null>) => {
      state.user = action.payload
    },
    logout: (state) => {
      state.user = null
    },
  },
})

export const { setUser, logout } = authSlice.actions

export default authSlice.reducer