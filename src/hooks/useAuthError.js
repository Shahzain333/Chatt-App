import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { clearError } from '../store/authSlice'

export const useAuthError = () => {
    
    const dispatch = useDispatch();
    const [openSnackbar, setOpenSnackbar] = useState(false);

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
        dispatch(clearError());
    };

    const showSnackbar = () => {
        setOpenSnackbar(true);
    };

    const getAuthErrorMessage = (error) => {
        switch(error?.code){
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-not-found':
                return 'No account found with this email address.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/invalid-credential':
                return 'Invalid email or password.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            case 'auth/popup-closed-by-user':
                return 'Login cancelled. Please try again.';
            case 'auth/popup-blocked':
                return 'Popup was blocked. Please allow popups for this site.';
            case 'auth/account-exists-with-different-credential':
                return 'Account exists with different sign-in method.';
            case 'auth/email-already-in-use':
                return 'Email already exists. Please try another email.';
            case 'auth/operation-not-allowed':
                return 'Sign-up is temporarily disabled. Please try again later.';
            case 'auth/weak-password':
                return 'Password is too weak. Please use a stronger password.';
            case 'auth/internal-error':
                return 'Service temporarily unavailable. Please try again.';
            default:
                return error?.message || 'An unexpected error occurred. Please try again.';
        }
    };

    return { openSnackbar, setOpenSnackbar, handleCloseSnackbar, showSnackbar, getAuthErrorMessage };

};











