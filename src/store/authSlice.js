import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentUser: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
  
    login: (state, action) => {
      state.currentUser = action.payload;
      state.loading = false;
      state.error = null;
    },
  
    logout: (state) => {
      state.currentUser = null;
      state.loading = false;
      state.error = null;
    },
  
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  
    clearError: (state) => {
      state.error = null;
    },
  
  },
});


export const selectUser = (state) => state.auth.currentUser;
export const selectAuth = (state) => state.auth;
export const selectLoading = (state) => state.auth.loading;
export const selectError = (state) => state.auth.error;

export const { login, logout, setLoading, setError, clearError, }  = authSlice.actions

export default authSlice.reducer;
