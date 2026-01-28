import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, useNavigate } from 'react-router-dom'
import { login, logout, setLoading, setError, clearError, selectUser, 
    selectLoading, selectError } from '../store/authSlice'
import DashboardPage from '../pages/Dashboard/DashboardPage.jsx'
import firebaseService from '../services/firebaseServices'
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useAuthError } from '../hooks/useAuthError.js'

function Login() {
    
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    //const [openSnackbar, setOpenSnackbar] = useState(false)

    const user = useSelector(selectUser)
    const loading = useSelector(selectLoading)
    const error = useSelector(selectError)
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const authError = useAuthError()

    const validateEmail = (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email)
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        if(error) dispatch(clearError())
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        if(error) dispatch(clearError())
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
    
        dispatch(setLoading(true))
        dispatch(clearError())

        if(!email || !password){
            dispatch(setError('Please enter both email and password'))
            dispatch(setLoading(false))
            return
        }

        if(!validateEmail(email)){
            dispatch(setError('Please enter a valid email address'))
            dispatch(setLoading(false))
            return
        }

        try {
            await firebaseService.signIn(email, password)
            navigate('/dashboard')
        } catch (error) {
            const errorMessage = authError.getAuthErrorMessage(error)
            dispatch(setError(errorMessage))
            authError.setOpenSnackbar(true)
        } finally {
            dispatch(setLoading(false))
        }
    }

    const handleSocialLogin = async (provider) => {
        dispatch(setLoading(true))
        dispatch(clearError())
        
        try {
            
            if (provider === 'google') {
                await firebaseService.signInWithGoogle()
            } else if (provider === 'github') {
                await firebaseService.signInWithGithub()
            }
            
            // Wait a moment for Firestore to create user data
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Don't navigate immediately - let the authStateChange handle it
            // The navigation will happen automatically via the useEffect
            navigate('/dashboard')

        } catch (error) {
            const errorMessage = authError.getAuthErrorMessage(error)
            dispatch(setError(errorMessage))
            authError.setOpenSnackbar(true)
        } finally {
            dispatch(setLoading(false))
        }
    }

    // useEffect(() => {

    //     const unsubscribe = firebaseService.onAuthStateChange(async (authUser) => {

    //         if (authUser) {
    //             try {
    //                 // AWAIT the user data properly
    //                 const userData = await firebaseService.getUser(authUser.id);
                    
    //                 if (userData) {
    //                     dispatch(login({
    //                         uid: userData.uid,
    //                         email: userData.email,
    //                         username: userData.username || '',
    //                         fullName: userData.fullname || '',
    //                         image: userData.image || ""
    //                     }));
    //                 } else {
    //                     // Fallback with proper values
    //                     dispatch(login({
    //                         uid: authUser.id,
    //                         email: authUser.email,
    //                         username: authUser.email?.split('@')[0] || '',
    //                         fullName: authUser.fullname || authUser.user_metadata?.full_name || '',
    //                         image: authUser.user_metadata?.avatar_url || authUser.photoURL || ""
    //                     }));
    //                 }
                    
    //             } catch (error) {
    //                 console.error("Error fetching user data:", error);
    //                 dispatch(setError('Failed to load user profile'));
    //             }
            
    //         } else {
    //             dispatch(logout());
    //         }
        
    //     });

    // return () => unsubscribe();
    
    // }, [dispatch])

    return (
        <div>
            {user ? <DashboardPage/> : (
                <div className="flex items-center justify-center px-4 py-14">
                    
                    <Snackbar 
                        open={authError.openSnackbar} 
                        autoHideDuration={6000} 
                        onClose={authError.handleCloseSnackbar}
                        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <Alert 
                            severity="error"
                            action={
                                <IconButton onClick={authError.handleCloseSnackbar}>
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            }
                        >
                            {error}
                        </Alert>
                    </Snackbar>
                        
                    <div className="max-w-md w-full  rounded-2xl bg-white shadow-lg p-8">
                            
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-green-800 mb-2">
                                Sign in to your account
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium 
                                text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input 
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                                    focus:ring-2 focus:ring-green-500 focus:border-green-500 
                                    outline-none bg-[#01aa851d]"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium 
                                text-gray-700 mb-2">
                                    Password
                                </label>
                                <input 
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="w-full px-3 py-2 bg-[#01aa851d] border border-gray-300 rounded-lg 
                                    focus:ring-2 focus:ring-green-500 focus:border-green-500 
                                    outline-none"
                                    required
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={loading || !email || !password}
                                className="w-full bg-green-600 hover:bg-green-700 
                                disabled:bg-green-400 text-white font-semibold py-3 px-4 
                                rounded-lg transition-all duration-200 hover:scale-[1.02] 
                                focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                                disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>

                        </form>

                        <div className="my-6 flex items-center">
                            <div className="flex-1 border-t border-green-300"></div>
                            <span className="px-4 text-gray-500 text-sm">Or continue with</span>
                            <div className="flex-1 border-t border-green-300"></div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleSocialLogin('google')}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 border 
                                border-green-300 rounded-lg py-3 px-4 hover:bg-green-300 
                                transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span className="text-gray-700 font-medium">Google</span>
                            </button>
                            
                            <button 
                                onClick={() => handleSocialLogin('github')}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 border 
                                border-green-300 rounded-lg py-3 px-4 hover:bg-green-300 
                                transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                                <span className="text-gray-700 font-medium">GitHub</span>
                            </button>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-gray-600">
                                Don't have an account?{' '}
                                <NavLink to="/signup" className="text-green-600 hover:text-green-500 font-semibold">
                                    Sign up
                                </NavLink>
                            </p>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}

export default Login