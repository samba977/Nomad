import React, { useEffect, useState, useRef } from 'react';
import { FiMoreVertical } from 'react-icons/fi';
import './Chat.css';

const ChatList = ({ users, selectedUser, onSelect, onRemoveUser }) => {
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    console.log('✅ ChatList loaded with users:', users);
  }, [users]);

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuUserId(null);
      }
    };
    if (openMenuUserId !== null) {
      window.addEventListener('mousedown', handleClickOutside);
    }
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuUserId]);

  if (!users || users.length === 0) {
    return <div className="chat-list"><p>No users available.</p></div>;
  }

  return (
    <div className="chat-list">
      {users.map((user, index) => (
        <div
          key={user.id || index}
          className={`chat-user ${selectedUser?.id === user.id ? 'selected' : ''}`}
          onClick={() => onSelect(user)}
          style={{ position: 'relative' }}
        >
          <img src={user.img} alt={user.name || 'Avatar'} />
          <span>{user.name || 'Unnamed User'}</span>

          {/* 3 dots icon */}
          <button
            className="menu-icon-btn"
            onClick={e => {
              e.stopPropagation(); // prevent triggering onSelect
              setOpenMenuUserId(openMenuUserId === user.id ? null : user.id);
            }}
            aria-label="Open user menu"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: '#555',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <FiMoreVertical />
          </button>

          {/* Dropdown menu */}
          {openMenuUserId === user.id && (
            <div
              ref={menuRef}
              className="user-menu-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 4,
                background: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                borderRadius: 6,
                padding: '8px 0',
                minWidth: 130,
                zIndex: 20,
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                className="user-menu-item"
                onClick={() => {
                  onRemoveUser(user.id);
                  setOpenMenuUserId(null);
                }}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#e53935',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                Remove Chat
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChatList;
