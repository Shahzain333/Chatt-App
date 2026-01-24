import React, { useState, useEffect } from 'react'
import { RiSearchLine, RiLoader4Line } from 'react-icons/ri'
import { FaXmark } from 'react-icons/fa6'
import defaultAvatar from '../assets/default.jpg'
import firebaseService from '../services/firebaseServices'
import { toast } from 'sonner'

function SearchModal({ isOpen, onClose, onSearch }) {
  
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSearchTerm("")
      setUsers([])
    }
  }, [isOpen])

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.info("Please Enter a Search Term", { duration: 3000 })
      return
    }

    try {

      setIsLoading(true)
      const searchUser = await firebaseService.searchUsers(searchTerm)
      setUsers(searchUser)

      if (searchUser.length === 0) {
        toast.error("No users found", { duration: 3000 }) 
      }
    
    } catch (error) {
      console.log("Search error:", error)
      toast.error("An error occurred while searching. Please try again.", { duration: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectUser = (user) => {
    onSearch(user)
    onClose()
  }

  if (!isOpen) return null

  return (

    <div onClick={onClose} className='fixed inset-0 z-[100] flex justify-center items-center 
    bg-[#00170cb7]'>
    
      <div onClick={(e) => e.stopPropagation()} className='relative p-4 w-[100%] max-w-md max-h-full'>
    
        <div className='relative bg-[#01AA85] w-full rounded-md shadow-lg'>
    
          <div className='flex items-center justify-between p-4 md:p-5 border-b border-gray-300'>
            <h3 className='text-xl font-semibold text-white'>Search User</h3>
            <button 
              onClick={onClose} 
              className='text-white bg-transparent rounded-lg text-sm w-8 h-8 inline-flex 
              justify-center items-center cursor-pointer'
            >
              <FaXmark className='text-xl'/>
            </button>
          </div>

          <div className='p-2'>
            
            <div className='space-y-4'>
              <div className='flex gap-2 relative'>
                <input 
                  type='text'
                  className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg 
                  outline-none w-full p-2.5" 
                  placeholder="Search users" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if(e.key === 'Enter'){
                      handleSearch()
                    }
                  }}
                  autoFocus
                />
                <button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                  className='absolute right-0 top-1/2 transform -translate-y-1/2 text-[#00170cb7] 
                  px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50'
                >
                  {isLoading ? 
                      <RiLoader4Line className="animate-spin" size={20} /> 
                      : <RiSearchLine size={20} />}
                </button>
                
              </div>

            </div>

            <div className="mt-6 max-h-60 overflow-y-auto">
              {users.map((user, index) => (
                <div 
                  onClick={() => handleSelectUser(user)}
                  className='flex items-start gap-3 bg-[#15eabc34] p-2 mb-3 rounded-lg cursor-pointer border border-[#ffffff20] shadow-lg hover:bg-[#15eabc50] transition-colors'
                  key={user.uid || index}
                >
                  <img 
                    src={user?.image || defaultAvatar} 
                    className="h-[40px] w-[40px] rounded-full object-cover" 
                    alt={`${user?.fullName || 'User'}'s avatar`}
                  />
                  <span>
                    <h2 className="p-0 font-semibold text-white text-[18px]">{user?.fullname}</h2>
                    <p className="text-[13px] text-white">@{user?.username}</p>
                  </span>
                </div>
              ))}
      
            </div>
      
          </div>
      
        </div>
      
      </div>

    </div>
  )
}

export default SearchModal