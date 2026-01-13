import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Login from './components/Login'
import { useDispatch } from 'react-redux';
import { clearChatState } from './store/chatSlice';
import { Toaster } from 'sonner'

function Layout() {

   const dispatch = useDispatch();

    useEffect(() => {
        // Clear chat state on app start (optional)
        // dispatch(clearChatState());
        
        // Or clear on page refresh
        const handleBeforeUnload = () => {
          dispatch(clearChatState());
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };

  }, [dispatch]);

  return (
    <div className="app-background">
      <Toaster position="top-center" />
      {/* <Login /> */}
      <Outlet /> {/* or your router component */}
    </div>
  )
}

export default Layout