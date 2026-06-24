import React, { useEffect, useMemo, useState } from 'react';
import './Chat.css';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import profile1 from '../../assets/P1.png';

const GroupChatForm = ({ onGroupCreated }) => {
  const { user } = useAuth();

  // --- state ---
  const [companions, setCompanions] = useState([]); // [{id,name,img}]
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]); // array of user ids
  const [error, setError] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  // --- resolve current user id & token robustly ---
  const currentUserId = useMemo(() => {
    if (user?.id) return user.id;
    if (user?._id) return user._id;
    try {
      const raw = localStorage.getItem('travelmateUser');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.id || parsed?._id || null;
    } catch {
      return null;
    }
  }, [user]);

  const token = useMemo(() => {
    if (user?.token) return user.token;
    try {
      const raw = localStorage.getItem('travelmateUser');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    } catch {
      return null;
    }
  }, [user]);

  // --- fetch chat companions you can add to a group ---
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUserId || !token) return;
      setLoadingUsers(true);
      setError('');
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chat/companions/${currentUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const filtered = (res.data || [])
          .filter(u => u?._id && String(u._id) !== String(currentUserId))
          .map(u => ({
            id: u._id,
            name: u.fullName || 'Unnamed User',
            img: u.profileImageUrl ? `http://localhost:5000${u.profileImageUrl}` : profile1
          }));
        setCompanions(filtered);
      } catch (err) {
        setError('Could not load user list.');
        setCompanions([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [currentUserId, token]);

  // --- toggle selection ---
  const handleCheckbox = (id) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  // --- create group ---
  const handleSubmit = async () => {
    setError('');

    if (!currentUserId) return setError('User ID missing. Please log in again.');
    if (!token) return setError('Session expired. Please log in again.');
    if (!groupName.trim()) return setError('Group name is required.');
    if (selectedUsers.length < 1) return setError('Select at least one other member.');

    // ensure creator is in the members exactly once
    const members = Array.from(new Set([...selectedUsers, currentUserId]));

    const payload = {
      name: groupName.trim(),
      members,
      createdBy: currentUserId,
    };

    try {
      setCreating(true);
      const res = await axios.post('http://localhost:5000/api/groups/create', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // notify parent
      onGroupCreated && onGroupCreated(res.data);

      // reset form
      setGroupName('');
      setSelectedUsers([]);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Group creation failed.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="group-form">
      <h4>Create New Group</h4>

      <input
        type="text"
        placeholder="Enter group name"
        value={groupName}
        onChange={e => setGroupName(e.target.value)}
        disabled={creating}
      />

      <div className="group-user-list">
        {loadingUsers && (
          <p style={{ color: "#999", fontSize: 14 }}>Loading users…</p>
        )}
        {!loadingUsers && companions.length === 0 && (
          <p style={{ color: "#999", fontSize: 14 }}>
            No chat companions found. Start chatting to add people here.
          </p>
        )}
        {!loadingUsers && companions.map(u => (
          <label key={u.id} className="group-user-option">
            <input
              type="checkbox"
              checked={selectedUsers.includes(u.id)}
              onChange={() => handleCheckbox(u.id)}
              disabled={creating}
            />
            <img src={u.img} alt="avatar" />
            {u.name}
          </label>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}

      <button
        className="group-submit"
        onClick={handleSubmit}
        disabled={creating}
        title={creating ? 'Creating group…' : 'Create Group'}
      >
        {creating ? 'Creating…' : 'Create Group'}
      </button>
    </div>
  );
};

export default GroupChatForm;
