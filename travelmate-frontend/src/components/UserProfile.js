import React, { useState, useEffect } from 'react';
import './UserProfile.css';
import defaultPic from '../assets/default-profile.png';

const UserProfile = ({ user }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    profileImage: null
  });

  const [isEditing, setIsEditing] = useState(true);
  const [imagePreview, setImagePreview] = useState(defaultPic);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profileImage: user.profileImage || null,
      });
      setImagePreview(user.profileImage || defaultPic);
      setIsEditing(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profileImage') {
      const file = files[0];
      setFormData((prev) => ({ ...prev, profileImage: file }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit formData to backend using Axios or Fetch
    console.log('Submitted:', formData);
    setIsEditing(false);
  };

  return (
    <div className="profile-container">
      <h2>{isEditing ? 'Create / Edit Profile' : 'Your Profile'}</h2>
      <div className="profile-card">
        <img src={imagePreview} alt="Profile" className="profile-image" />
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Full Name:
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </label>
          <label>
            Phone:
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />
          </label>
          <label>
            Bio:
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing}
            ></textarea>
          </label>
          <label>
            Profile Image:
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
              disabled={!isEditing}
            />
          </label>
          {isEditing ? (
            <button type="submit">Save Profile</button>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
