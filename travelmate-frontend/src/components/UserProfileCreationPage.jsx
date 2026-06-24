import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Mainlayout from '../layouts/Mainlayout';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './UserProfileCreationPage.css';

const SUGGESTED_INTERESTS = [
  "Travel", "Food", "Photography", "Music", "Hiking", "Movies", "Reading", "Dancing",
  "Adventure", "Cycling", "Yoga", "Coding", "Art", "Gaming", "Technology",
  "Fitness", "Fashion", "Cooking", "Animals", "Sports"
];

const UserProfileCreationPage = () => {
  const { user, login } = useAuth();
  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
      },
      (err) => {
        console.warn("Geolocation error:", err);
        toast.warn("Could not get your location.");
      }
    );
  }, []);

  const handleImageChange = (e) => {
    setProfileImage(e.target.files[0]);
  };

  // Add interest if valid, allow multiple
  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setInterestInput('');
    }
  };

  // Remove interest
  const removeInterest = (index) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  // Suggestion click: set to input, don't add directly
  const handleSuggestionClick = (suggestion) => {
    setInterestInput(suggestion);
    setShowSuggestions(false);
    setTimeout(() => {
      document.getElementById('interest-input').focus();
    }, 0);
  };

  // Add interest on Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  // Hide suggestions when input loses focus (unless to suggestions)
  const handleBlur = () => {
    setTimeout(() => {
      if (
        suggestionsRef.current &&
        suggestionsRef.current.contains(document.activeElement)
      ) {
        return;
      }
      setShowSuggestions(false);
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Safety: check user loaded and has id
    if (!user || !user.id) {
      toast.error('User not logged in. Please login again.');
      return;
    }
    if (interests.length === 0) {
      toast.error('Please add at least one interest.');
      return;
    }

    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('interests', JSON.stringify(interests));
    formData.append('profileImage', profileImage);
    formData.append('userId', user.id);
    formData.append('lat', location.lat);
    formData.append('lng', location.lng);

    try {
      const res = await axios.post('http://localhost:5000/api/users/create-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      login({ ...user, ...res.data });
      toast.success('Profile saved successfully!');
      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      console.error('Create profile error:', error);
      toast.error('Error saving profile');
    }
  };

  if (user === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <Mainlayout>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      <main className="profile-creation-container">
        <form
          onSubmit={handleSubmit}
          className="profile-creation-form"
          encType="multipart/form-data"
        >
          <h2>Create Your Profile</h2>

          <label>Bio:</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          />

          <label>Interest:</label>
          <div className="interest-input-wrapper">
            <input
              id="interest-input"
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="Type or select interest, press Enter or Add"
              autoComplete="off"
            />
            <button type="button" onClick={addInterest}>Add</button>
          </div>

          {/* Suggestions appear only when input is focused */}
          {showSuggestions && (
            <div className="suggested-interests-wrapper" ref={suggestionsRef}>
              {SUGGESTED_INTERESTS.filter(
                (item) =>
                  !interests.includes(item) &&
                  (interestInput.length === 0 ||
                    item.toLowerCase().includes(interestInput.toLowerCase()))
              ).map((suggestion) => (
                <span
                  key={suggestion}
                  className="interest-suggestion-bubble"
                  tabIndex={0}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseDown={e => e.preventDefault()}
                  style={{ margin: "4px", cursor: "pointer" }}
                >
                  {suggestion}
                </span>
              ))}
            </div>
          )}

          {/* Bubbles for all added interests */}
          <div className="interests-container">
            {interests.map((interest, index) => (
              <div key={index} className="interest-box">
                {interest}
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeInterest(index)}
                  aria-label={`Remove interest ${interest}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <label>Profile Picture:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            required
          />

          {profileImage && (
            <img
              src={URL.createObjectURL(profileImage)}
              alt="Preview"
              style={{ width: 100, height: 100, borderRadius: '50%', marginTop: 10 }}
            />
          )}

          <button type="submit">Save Profile</button>
        </form>
      </main>
    </Mainlayout>
  );
};

export default UserProfileCreationPage;
