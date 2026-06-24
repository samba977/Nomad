// src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

import Mainlayout from '../../layouts/Mainlayout';
import BadgeTab from './BadgeTab';
import GroupChatForm from './GroupChatForm';
import ChatList from './ChatList';
import MessageBubble from './MessageBubble';
import LocationShare from './LocationShare';
import PollsPanel from './PollsPanel';
import CreatePollModal from './CreatePollModal';

import profile1 from '../../assets/P1.png';
import { FiMoreVertical } from 'react-icons/fi';

import './Chat.css';

const getGroupInitials = (name) =>
  name?.split(' ').map(w => w[0]?.toUpperCase()).join('').slice(0, 2);

/* ---------- Robust unread extraction for groups ---------- */
const extractGroupUnread = (g, myId) => {
  if (!g) return 0;

  // simple fields
  if (Number.isFinite(Number(g.unreadCount)))    return Number(g.unreadCount);
  if (Number.isFinite(Number(g.unreadMessages))) return Number(g.unreadMessages);
  if (Number.isFinite(Number(g.unread)))         return Number(g.unread);

  // membersMeta: object map
  if (g.membersMeta && !Array.isArray(g.membersMeta) && typeof g.membersMeta === 'object') {
    const me = g.membersMeta[String(myId)];
    if (me && Number.isFinite(Number(me.unread))) return Number(me.unread);
  }
  // membersMeta: array
  if (Array.isArray(g.membersMeta)) {
    const me = g.membersMeta.find(m => String(m.userId) === String(myId));
    if (me && Number.isFinite(Number(me.unread))) return Number(me.unread);
  }

  // fallback with "last seen" heuristic
  try {
    const seenMap = JSON.parse(localStorage.getItem('groupLastSeen') || '{}'); // { [gid]: ISO }
    const lastSeen = seenMap[String(g._id)];
    const lastAt   = g.lastMessageAt || g.updatedAt || g.createdAt;
    const lastFrom = g.lastSenderId || g.lastMessageSenderId;
    if (lastAt && (!lastSeen || new Date(lastAt) > new Date(lastSeen))) {
      if (!lastFrom || String(lastFrom) !== String(myId)) return 1;
    }
  } catch {}
  return 0;
};

const touchGroupSeen = (groupId) => {
  try {
    const map = JSON.parse(localStorage.getItem('groupLastSeen') || '{}');
    map[String(groupId)] = new Date().toISOString();
    localStorage.setItem('groupLastSeen', JSON.stringify(map));
  } catch {}
};

const ChatWindow = () => {
  const [activeTab, setActiveTab] = useState('chats');

  // lists with per-item unread
  const [users, setUsers] = useState([]);   // [{id,name,img,unread}]
  const [groups, setGroups] = useState([]); // [{_id,name,...,unread}]

  const [selectedUser, setSelectedUser]   = useState(null);
  const [activeGroup,  setActiveGroup]    = useState(null);

  const [message,  setMessage]  = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // polls
  const [groupView, setGroupView] = useState('chat'); // 'chat' | 'polls'
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();

  const chatEndRef  = useRef(null);
  const isFirstLoad = useRef(true);

  const localUser =
    user?.id ||
    user?._id ||
    JSON.parse(localStorage.getItem('travelmateUser') || '{}').id;

  const token =
    user?.token ||
    JSON.parse(localStorage.getItem('travelmateUser') || '{}').token;

  const isAdmin = !!activeGroup && String(activeGroup.adminId) === String(user?._id || user?.id);

  const getMemberDisplay = useCallback(
    (mid) => users.find(u => u.id === mid)?.name || mid,
    [users]
  );

  /* ---------------- derived counts ---------------- */
  const dmUnreadCount    = () => users.filter(u => Number(u.unread) > 0).length;
  const groupUnreadCount = () => groups.filter(g => Number(g.unread) > 0).length;

  const setUserUnreadZero  = (uid) => setUsers(prev => prev.map(u => u.id  === uid ? { ...u, unread: 0 } : u));
  const setGroupUnreadZero = (gid) => setGroups(prev => prev.map(g => g._id === gid ? { ...g, unread: 0 } : g));

  /* ---------------- stable helpers ---------------- */
  const joinGroupRoom = useCallback((groupId) => {
    if (!socket || !groupId) return;
    socket.emit('group:join', { groupId });
  }, [socket]);

  /* ================== Load companions (DM) ================== */
  useEffect(() => {
    if (!localUser) return;
    axios.get(`http://localhost:5000/api/chat/companions/${localUser}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const formatted = res.data.map(u => ({
        id: u._id,
        name: u.fullName,
        img: u.profileImageUrl ? `http://localhost:5000${u.profileImageUrl}` : profile1,
        unread: Number(u?.unreadMessages || 0),
      }));
      const justChattedId = location.state?.selectedUserId;
      setUsers(justChattedId ? formatted.filter(u => u.id === justChattedId) : formatted);
      if (justChattedId) {
        const matched = formatted.find(u => u.id === justChattedId);
        if (matched) { setSelectedUser(matched); setActiveGroup(null); }
      }
    }).catch(() => setUsers([]));
  }, [localUser, location.state?.selectedUserId, token]);

  /* ================== Load groups (+prime unread) ================== */
  useEffect(() => {
    if (!localUser) return;
    axios.get(`http://localhost:5000/api/groups/${localUser}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      const arr = Array.isArray(res.data) ? res.data : [];
      const formatted = arr.map(g => ({ ...g, unread: extractGroupUnread(g, localUser) }));
      setGroups(formatted);
    }).catch(() => setGroups([]));
  }, [localUser, token]);

  /* ================== Socket listeners ================== */
  useEffect(() => {
    if (!socket) return;

    // DM messages
    const handleReceive = (msg) => {
      // Ignore my own echo for DM (we already append locally in handleSend)
      if (String(msg.senderId) === String(localUser)) return;

      if (selectedUser && (msg.senderId === selectedUser.id || msg.receiverId === selectedUser.id)) {
        setMessages(prev => [...prev, { ...msg, from: 'them' }]);
      } else {
        // bump unread for that user (only if I am not the sender)
        const otherId = msg.senderId;
        setUsers(prev => prev.map(u => u.id === otherId ? { ...u, unread: (Number(u.unread) || 0) + 1 } : u));
      }
    };

    // Group messages
    const handleReceiveGroup = (msg) => {
      const msgGroupId = String(msg.groupId || msg.receiverId || '');
      const openId     = activeGroup?._id && String(activeGroup._id);

      if (openId && msgGroupId === openId) {
        // For groups we rely ONLY on socket echo (no local append),
        // so append both others' and my own messages here.
        const from = String(msg.senderId) === String(localUser) ? 'me' : 'them';
        setMessages(prev => [...prev, { ...msg, from }]);
      } else {
        // not viewing this group: bump unread ONLY if sent by others
        if (String(msg.senderId) !== String(localUser)) {
          setGroups(prev => prev.map(g =>
            String(g._id) === msgGroupId ? { ...g, unread: (Number(g.unread) || 0) + 1 } : g
          ));
        }
      }
    };

    const handleTypingEvt = ({ from }) => {
      if (selectedUser && String(from) === String(selectedUser.id)) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    };

    socket.on('receiveMessage', handleReceive);
    socket.on('receiveGroupMessage', handleReceiveGroup);
    socket.on('typing', handleTypingEvt);

    return () => {
      socket.off('receiveMessage', handleReceive);
      socket.off('receiveGroupMessage', handleReceiveGroup);
      socket.off('typing', handleTypingEvt);
    };
  }, [socket, selectedUser, activeGroup, localUser]);

  /* ================== Load DM thread + mark read ================== */
  useEffect(() => {
    if (!selectedUser || !localUser) return;

    axios.get(`http://localhost:5000/api/chat/${localUser}/${selectedUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setMessages(res.data.map(m => ({
        ...m,
        from: String(m.senderId) === String(localUser) ? 'me' : 'them'
      })));
    });

    // backend mark-read + UI clear
    axios.put(
      `http://localhost:5000/api/chat/mark-read/${localUser}/${selectedUser.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ).catch(() => {});
    setUserUnreadZero(selectedUser.id);
  }, [selectedUser, localUser, token]);

  /* ================== Load group thread + clear ================== */
  useEffect(() => {
    if (!activeGroup || !localUser) return;
    const groupId = String(activeGroup._id || '');
    if (!groupId || groupId.length !== 24) { setMessages([]); return; }

    axios.get(`http://localhost:5000/api/chat/group/${groupId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => {
      setMessages(res.data.map(m => ({
        ...m,
        from: String(m.senderId) === String(localUser) ? 'me' : 'them'
      })));
    }).catch(() => setMessages([]));

    setGroupUnreadZero(groupId);
    touchGroupSeen(groupId);
    joinGroupRoom(groupId);
    // (optional) backend mark-read endpoint here
  }, [activeGroup, localUser, token, joinGroupRoom]);

  /* ================== small UI effects ================== */
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.group-menu-dropdown') && !e.target.closest('.menu-icon-btn')) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  /* ================== actions ================== */
  const handleRemoveUser = async (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (selectedUser?.id === userId) setSelectedUser(null);

    try {
      await axios.patch(
        `http://localhost:5000/api/chat/hide/${localUser}/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      // rollback: reload
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/companions/${localUser}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const formatted = res.data.map(u => ({
          id: u._id,
          name: u.fullName,
          img: u.profileImageUrl ? `http://localhost:5000${u.profileImageUrl}` : profile1,
          unread: Number(u?.unreadMessages || 0),
        }));
        setUsers(formatted);
      } catch {
        setUsers([]);
      }
    }
  };

  const handleKickUser = (memberId) => {
    axios.post(
      `http://localhost:5000/api/groups/${activeGroup._id}/remove-member/${memberId}`,
      { adminId: localUser },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      setActiveGroup(prev => ({ ...prev, members: prev.members.filter(id => id !== memberId) }));
    }).catch(() => alert('Failed to kick user'));
  };

  const handleDeleteGroup = () => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    axios.delete(
      `http://localhost:5000/api/groups/${activeGroup._id}`,
      { data: { adminId: localUser }, headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
      setActiveGroup(null);
      alert('Group deleted!');
    }).catch(() => alert('Failed to delete group'));
  };

  const handleSend = () => {
    if (!message.trim() || !socket || !localUser) return;

    // DM: append locally; ignore my echo in receive handler
    if (selectedUser && !activeGroup) {
      socket.emit('sendMessage', {
        senderId: localUser,
        receiverId: selectedUser.id,
        receiverModel: 'User',
        text: message
      });
      setMessages(prev => [...prev, { from: 'me', text: message }]);
    }

    // GROUP: DO NOT append locally; wait for socket echo (to avoid duplicates)
    if (!selectedUser && activeGroup) {
      socket.emit('sendGroupMessage', {
        senderId: localUser,
        groupId: activeGroup._id,
        text: message
      });
    }

    setMessage('');
  };

  const handleTyping = () => {
    if (socket && selectedUser) {
      socket.emit('typing', { from: localUser, to: selectedUser.id });
    }
  };

  const handleLocationShare = () => {
    if (!socket || !localUser) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const text = `📍 Shared location: https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
      if (selectedUser && !activeGroup) {
        socket.emit('sendMessage', { senderId: localUser, receiverId: selectedUser.id, receiverModel: 'User', text });
        setMessages(prev => [...prev, { from: 'me', text }]);
      } else if (!selectedUser && activeGroup) {
        socket.emit('sendGroupMessage', { senderId: localUser, groupId: activeGroup._id, text });
      }
    });
  };

  const handleGroupCreated = (newGroup) =>
    setGroups(prev => [...prev, { ...newGroup, unread: 0 }]);

  const handleLeaveGroup = () => {
    axios.post(
      `http://localhost:5000/api/groups/leave/${activeGroup._id}`,
      { userId: localUser },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => {
      setGroups(prev => prev.filter(g => g._id !== activeGroup._id));
      setActiveGroup(null);
    });
  };

  const handleReportMessage = async (messageId, reportedUserId, reason) => {
    try {
      await axios.post(
        'http://localhost:5000/api/reports/chat',
        { messageId, reportedUserId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Message reported successfully!');
    } catch {
      alert('Failed to report message.');
    }
  };

  return (
    <Mainlayout>
      <div className="chat-wrapper-center">
        <div className="chat-wrapper">
          {/* ---------- LEFT: Sidebar ---------- */}
          <div className="chat-sidebar">
            <div className="tab-buttons">
              <BadgeTab
                label="CHATS"
                active={activeTab === 'chats'}
                onClick={() => setActiveTab('chats')}
                count={dmUnreadCount()}
              />
              <BadgeTab
                label="GROUPS"
                active={activeTab === 'groups'}
                onClick={() => setActiveTab('groups')}
                count={groupUnreadCount()}
              />
            </div>

            {activeTab === 'chats' ? (
              <ChatList
                users={users}
                selectedUser={selectedUser}
                onSelect={(u) => {
                  setSelectedUser(u);
                  setActiveGroup(null);
                  setUserUnreadZero(u.id);
                }}
                onRemoveUser={handleRemoveUser}
              />
            ) : (
              <>
                <div className="chat-list">
                  {groups.map((g) => (
                    <div
                      key={g._id}
                      className={`chat-user ${activeGroup?._id === g._id ? 'selected' : ''}`}
                      onClick={() => {
                        setActiveGroup(g);
                        setSelectedUser(null);
                        setGroupView('chat');
                        setGroupUnreadZero(g._id);
                        touchGroupSeen(g._id);
                        joinGroupRoom(g._id);
                      }}
                    >
                      <div className="group-avatar">{getGroupInitials(g.name)}</div>
                      <span>{g.name}</span>
                      {Number(g.unread) > 0 && <span className="mini-unread-dot" title={`${g.unread} new`} />}
                    </div>
                  ))}
                </div>
                <GroupChatForm onGroupCreated={handleGroupCreated} />
              </>
            )}
          </div>

          {/* ---------- RIGHT: Main ---------- */}
          <div className="chat-main">
            {(selectedUser || activeGroup) ? (
              <>
                <div className="chat-header" style={{ position: 'relative' }}>
                  {selectedUser
                    ? <img src={selectedUser.img} alt="Avatar" />
                    : <div className="group-avatar">{getGroupInitials(activeGroup?.name)}</div>
                  }

                  <h3 style={{ marginRight: 'auto' }}>{selectedUser?.name || activeGroup?.name}</h3>

                  {/* group sub-tabs */}
                  {activeGroup && (
                    <div style={{ display: 'flex', gap: 8, marginRight: 12 }}>
                      <button
                        onClick={() => setGroupView('chat')}
                        className="group-subtab"
                        style={{
                          background: groupView === 'chat' ? '#00a8a8' : '#e0f7fa',
                          color: groupView === 'chat' ? '#fff' : '#00a8a8',
                          border: 'none', borderRadius: 16, padding: '6px 12px',
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >Chat</button>
                      <button
                        onClick={() => setGroupView('polls')}
                        className="group-subtab"
                        style={{
                          background: groupView === 'polls' ? '#00a8a8' : '#e0f7fa',
                          color: groupView === 'polls' ? '#fff' : '#00a8a8',
                          border: 'none', borderRadius: 16, padding: '6px 12px',
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >Polls</button>
                    </div>
                  )}

                  {activeGroup && (
                    <div style={{ position: 'relative' }}>
                      <button
                        className="menu-icon-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: '4px 8px', color: '#00a8a8' }}
                        onClick={() => setMenuOpen(true)}
                        aria-label="Group Menu"
                      >
                        <FiMoreVertical />
                      </button>

                      {menuOpen && (
                        <div
                          className="group-menu-dropdown"
                          style={{ position: 'absolute', right: 0, top: '36px', minWidth: '170px', background: '#fff', borderRadius: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.18)', zIndex: 9, padding: '12px 0' }}
                        >
                          {isAdmin && (
                            <button
                              className="group-menu-item"
                              onClick={() => { setMenuOpen(false); setShowCreatePoll(true); }}
                            >
                              Create Cost Poll
                            </button>
                          )}
                          <button
                            className="group-menu-item"
                            onClick={() => { setMenuOpen(false); handleLeaveGroup(); }}
                          >
                            Leave Group
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="group-menu-item"
                                style={{ color: '#e53935' }}
                                onClick={() => { setMenuOpen(false); handleDeleteGroup(); }}
                              >
                                Delete Group
                              </button>
                              <div style={{ fontWeight: 'bold', margin: '8px 0 4px 18px', fontSize: 12, color: '#888' }}>
                                Kick Member
                              </div>
                              <ul style={{ listStyle: 'none', margin: 0, padding: '0 0 0 8px' }}>
                                {activeGroup.members
                                  .filter(m => String(m) !== String(user?._id || user?.id))
                                  .map(m => (
                                    <li key={m}>
                                      <button
                                        className="group-menu-item"
                                        style={{ color: '#333' }}
                                        onClick={() => { setMenuOpen(false); handleKickUser(m); }}
                                      >
                                        {getMemberDisplay(m)}
                                      </button>
                                    </li>
                                  ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isTyping && <span style={{ color: '#999', marginLeft: 10 }}>typing...</span>}
                </div>

                {/* messages or polls */}
                {groupView === 'chat' || !activeGroup ? (
                  <div className="chat-messages">
                    {messages.map((msg, idx) => (
                      <MessageBubble
                        key={msg._id || idx}
                        text={msg.text}
                        from={msg.from}
                        messageId={msg._id}
                        senderId={msg.senderId}
                        onReport={handleReportMessage}
                      />
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                ) : (
                  <div className="chat-messages" style={{ padding: 6 }}>
                    <PollsPanel token={token} group={activeGroup} socket={socket} isAdmin={isAdmin} />
                  </div>
                )}

                {/* input (chat view only) */}
                {groupView === 'chat' && (
                  <div className="chat-input">
                    <input
                      value={message}
                      onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                      placeholder="Type your message..."
                    />
                    <button onClick={handleSend}>SEND</button>
                    <LocationShare onShare={handleLocationShare} />
                  </div>
                )}
              </>
            ) : (
              <p style={{ color: '#000' }}>Select a user or group to start chatting</p>
            )}
          </div>
        </div>
      </div>

      {/* Create Poll Modal */}
      {showCreatePoll && activeGroup && (
        <CreatePollModal
          token={token}
          group={activeGroup}
          currentUserId={localUser}
          onClose={() => setShowCreatePoll(false)}
          onCreated={() => {}}
        />
      )}
    </Mainlayout>
  );
};

export default ChatWindow;
