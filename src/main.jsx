import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route } from 'react-router-dom'
import './index.css'
import { Provider } from 'react-redux'
import { store } from './store/store.js' 
import App from './App.jsx'
import { AuthProvider } from './components/AuthProvider.jsx' 
// Import pages
import Layout from './Layout.jsx'
import SignupPage from './pages/Login&Signup/SignUpPage.jsx'
import LoginPage from './pages/Login&Signup/LoginPage.jsx'
import DashboardPage from '../src/pages/Dashboard/DashboardPage.jsx'


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<Layout />}>
      <Route index element={<LoginPage />} /> {/* Default route shows login */}
      <Route path='/login' element={<LoginPage />} />
      <Route path='/signup' element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage /> } 
      />
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <AuthProvider>
       <RouterProvider router={router} />
    </AuthProvider>
  </Provider>,
)
