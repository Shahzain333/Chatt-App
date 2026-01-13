import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { selectUser } from '../store/authSlice'
import SideBar from '../components/SideBar'
import ChatList from '../components/Chatlist/ChatList'
import ChatBox from '../components/Chatbox' 
import { clearChatState, setSelectedUser, setMessages } from '../store/chatSlice'

function Dashboard() {
  
  const [mobileView, setMobileView] = useState('chatlist')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  const dispatch = useDispatch();
  
  // Get user and SelectedUser from Redux only
  const user = useSelector(selectUser)
  const selectedUser = useSelector(state => state.chat.selectedUser)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      
      if (mobile) {
        setMobileView(selectedUser ? 'chatbox' : 'chatlist')
      } else {
        setMobileView('both')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [selectedUser])

  const handleBackToChats = () => {
    //dispatch(clearChatState())
    dispatch(setSelectedUser(null))
    dispatch(setMessages([]))

    if (isMobile) {
      setMobileView('chatlist')
    }
  
  }

  // const handleSelectUser = (user) => {
  //   dispatch(setSelectedUser(user))
  //   if (isMobile) {
  //     setMobileView('chatbox')
  //   }
  // }

  return (
    <div className='flex h-screen app-background overflow-hidden'>
      
      <div className={`${!isMobile || mobileView === 'chatlist' ? 'flex' : 'hidden'}`}>
        <SideBar />
      </div>

      <div className='flex-1 flex flex-col lg:flex-row relative'>
        
        <div className={`${!isMobile || mobileView === 'chatlist' ? 'flex' : 'hidden'} lg:flex 
          lg:w-[400px] xl:w-[500px] w-full absolute lg:relative inset-0 z-20 bg-white 
          transition-transform duration-300 ${isMobile && mobileView === 'chatbox' ? 
          '-translate-x-full' : 'translate-x-0'}`}>
          <ChatList />
        </div>

        <div className={`${!isMobile || mobileView === 'chatbox' ? 'flex' : 'hidden'} w-full absolute 
        lg:relative inset-0 z-30 bg-white transition-transform duration-300 ${
          isMobile && mobileView === 'chatlist' ? 'translate-x-full' : 'translate-x-0'}`}>
          {selectedUser ? (
            <ChatBox onBack={handleBackToChats} />
          ) : (
            <div className='flex items-center justify-center w-full app-background'>
              <div className='text-center p-8'>
                <h2 className='text-xl font-semibold text-gray-600 mb-2'>Select a conversation</h2>
                <p className='text-gray-500'>Choose a chat from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard