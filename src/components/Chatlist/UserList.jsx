import React from "react";
import UserListItem from "./UserListItem";

const UserList = ({ 
  users, 
  selectedUser, 
  activeDropdown, 
  onSelectUser, 
  onDeleteUserChat, 
  onToggleDropdown 
}) => (
  <main className="flex-1 overflow-y-auto">
    {users.length > 0 ? (
      users.map((user) => (
        <UserListItem 
          key={user.uid}
          user={user}
          isActive={selectedUser?.uid === user.uid}
          showDropdown={activeDropdown === user.uid}
          onSelect={onSelectUser}
          onToggleDropdown={onToggleDropdown}
          onDelete={onDeleteUserChat}
        />
      ))
    ) : (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
        <p className="text-sm">No users found</p>
        <p className="text-xs mt-1">
          Start by inviting others to chat!
        </p>
      </div>
    )}
  </main>
);

export default UserList;