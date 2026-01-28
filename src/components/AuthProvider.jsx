import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { login, logout } from '../store/authSlice';
import firebaseService from '../services/firebaseServices';

export function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    
    const unsubscribe = firebaseService.onAuthStateChange(async (authUser) => {
      
      if (authUser) {
        try {
          const userData = await firebaseService.getUser(authUser.id);
          
          if (userData) {
            dispatch(login({
              uid: userData.uid,
              email: userData.email,
              username: userData.username || '',
              fullName: userData.fullname || '',
              image: userData.image || ""
            }));
          } else {
            dispatch(login({
              uid: authUser.id,
              email: authUser.email,
              username: authUser.email?.split('@')[0] || '',
              fullName: authUser.user_metadata?.full_name || '',
              image: authUser.user_metadata?.avatar_url || ""
            }));
          }
          
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Still dispatch login with available data
          dispatch(login({
            uid: authUser.id,
            email: authUser.email,
            username: authUser.email?.split('@')[0] || '',
            fullName: authUser.user_metadata?.full_name || '',
            image: authUser.user_metadata?.avatar_url || ""
          }));
        }
      } else {
        dispatch(logout());
      }
    });

    return () => unsubscribe();
    
  }, [dispatch]);

  return <>{children}</>;

}