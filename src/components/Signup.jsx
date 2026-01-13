import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { login, setLoading, setError, clearError, selectUser, selectLoading, 
    selectError } from '../store/authSlice'
import DashboardPage from '../pages/Dashboard/DashboardPage'
import firebaseService from '../services/firebaseServices'
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useAuthError } from '../hooks/useAuthError'
import { toast } from 'sonner'

function Signup() {
    
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        terms: false
    })

    //const [openSnackbar, setOpenSnackbar] = useState(false)

    const user = useSelector(selectUser)
    const loading = useSelector(selectLoading)
    const error = useSelector(selectError)
    
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const authError = useAuthError()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        })

        if (error) {
            dispatch(clearError())
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        dispatch(setLoading(true))
        dispatch(clearError())

        if (!formData.terms) {
            dispatch(setError('Please accept the terms and conditions'))
            authError.showSnackbar()
            dispatch(setLoading(false))
            return
        }

        if (formData.password !== formData.confirmPassword) {
            dispatch(setError('Passwords do not match!'))
            authError.showSnackbar()
            dispatch(setLoading(false))
            return
        }

        if (formData.password.length < 6) {
            dispatch(setError('Password should be at least 6 characters'))
            authError.showSnackbar()
            dispatch(setLoading(false))
            return
        }

        try {

            const userCredential = await firebaseService.signUp(
                formData?.email, 
                formData?.password, 
                formData?.username
            )

            // Wait for user data to be created in supabase
            await new Promise(resolve => setTimeout(resolve, 2000)) // small delay

            const userData = await firebaseService.getUser(userCredential.user.uid)

            // if (!userData) {
            //     toast.error('User data not found in database')
            // }

            dispatch(login({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                username: userCredential.user.email.split('@')[0],
                fullName: formData?.username,
                image: ""
            }))
            
            // Navigate after Redux state is updated
            navigate('/dashboard')
            
        } catch (error) {
            const errorMessage = authError.getAuthErrorMessage(error)
            dispatch(setError(errorMessage))
            authError.showSnackbar()
        } finally {
            dispatch(setLoading(false))
        }
    }

    return (
        <div>
            {user ? <DashboardPage/> : (
                <div className="flex items-center justify-center px-4 py-10">
                    
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
                    
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
                        
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-green-800 mb-2">
                                Create your account
                            </h1>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                        
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username
                                </label>
                                <input 
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Enter username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[#01aa851d] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input 
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="Enter email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border bg-[#01aa851d] border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input 
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Create a password (min. 6 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[#01aa851d] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input 
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border bg-[#01aa851d] border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    required
                                />
                            </div>
                            
                            <div className="flex items-center">
                                <input 
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    checked={formData.terms}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 
                                    border-green-300 rounded cursor-pointer bg-[#01aa851d]"
                                    required
                                />
                                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                                    I agree to the{' '}
                                    <Link to="#" className="text-green-600 hover:text-green-500 
                                    font-medium">
                                        Terms and Conditions
                                    </Link>
                                </label>
                            </div>

                            <button 
                                type="submit"
                                disabled={loading || !formData.terms || !formData.email || 
                                    !formData.password || !formData.confirmPassword}
                                className="w-full bg-green-600 hover:bg-green-700 
                                disabled:bg-green-400 text-white font-semibold py-3 px-4 
                                rounded-lg transition-all duration-200 hover:scale-[1.02] 
                                focus:ring-2 focus:ring-green-500 focus:ring-offset-2 
                                disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                        </form>

                        <div className="text-center mt-6">
                            <p className="text-gray-600">
                                Already have an account?{' '}
                                <NavLink to="/login" className="text-green-600 hover:text-green-500 
                                font-semibold cursor-pointer">
                                    Sign in
                                </NavLink>
                            </p>
                        </div>

                    </div>

                </div>

            )}

        </div>
    )
}

export default Signup