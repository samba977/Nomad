import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './LandingPage.css';
import './UserProfilePage.css';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Mainlayout from '../layouts/Mainlayout';

const UserProfilePage = () => {
  const { user, login } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());
  const [userBlogs, setUserBlogs] = useState([]);
  const [travelPlans, setTravelPlans] = useState([]);
  const [editPlanId, setEditPlanId] = useState(null);
  const navigate = useNavigate();

  const userInterests = Array.isArray(user?.interests)
    ? user.interests
    : user?.interests
      ? JSON.parse(user.interests)
      : [];

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/blogs/user/${user._id || user.id}`)
        .then(res => setUserBlogs(res.data))
        .catch(err => console.error('Error loading blogs:', err));

      axios.get(`http://localhost:5000/api/travel-plans/user/${user._id || user.id}`)
        .then(res => setTravelPlans(res.data))
        .catch(err => console.error('Error loading plans:', err));
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('bio', bio);
    if (profileImage) formData.append('profileImage', profileImage);
    formData.append('userId', user.id);

    try {
      const res = await axios.post('http://localhost:5000/api/users/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      });

      login(res.data);
      setImgTimestamp(Date.now());
      setProfileImage(null);
      console.log('Profile updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const handleAddTravelPlan = async () => {
    if (!title || !destination || !description) {
      console.warn('Please fill all fields');
      return;
    }

    try {
      if (editPlanId) {
        await axios.put(`http://localhost:5000/api/travel-plans/${editPlanId}`, {
          title,
          destination,
          description,
          date: new Date()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log('Plan updated!');
      } else {
        await axios.post('http://localhost:5000/api/travel-plans', {
          userId: user._id || user.id,
          title,
          destination,
          description,
          date: new Date()
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        console.log('Travel plan added!');
      }

      setTitle('');
      setDestination('');
      setDescription('');
      setEditPlanId(null);

      const res = await axios.get(`http://localhost:5000/api/travel-plans/user/${user._id || user.id}`);
      setTravelPlans(res.data);
    } catch (error) {
      console.error('Plan error:', error);
    }
  };

  return (
    <Mainlayout>
      <div className="landing-container flex flex-col min-h-screen">
        <main className="profile-main no-bg">
          <div className="profile-layout">
            <div className="left-column">
              <img
                src={
                  profileImage
                    ? URL.createObjectURL(profileImage)
                    : user?.profileImageUrl
                      ? `http://localhost:5000${user.profileImageUrl}?t=${imgTimestamp}`
                      : '/default-avatar.png'
                }
                alt="Profile"
                className="profile-image-circle"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              <label className="update-label">UPDATE PROFILE IMAGE:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files[0])}
                className="profile-image-input"
              />
            </div>

            <div className="right-column">
              <h2 className="user-label">USER</h2>
              <h1 className="user-name">{user.fullName?.toUpperCase()}</h1>
              <p><strong>EMAIL:</strong> {user.email}</p>

              {userInterests.length > 0 && (
                <div className="profile-interests-section">
                  <label style={{ fontWeight: 600, marginBottom: 5, display: 'block' }}>INTERESTS:</label>
                  <div className="profile-interests-list">
                    {userInterests.map((interest, idx) => (
                      <span key={idx} className="profile-interest-bubble">{interest}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="bio-paragraph">{bio || 'No bio yet'}</p>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Update your bio"
                className="bio-textarea"
              />

              <input
                type="text"
                placeholder="Travel Plan Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bio-textarea"
              />
              <input
                type="text"
                placeholder="Destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="bio-textarea"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bio-textarea"
              />
              <button onClick={handleAddTravelPlan} className="btn-update">
                {editPlanId ? 'UPDATE PLAN' : 'ADD TRAVEL PLAN'}
              </button>

              <button onClick={handleUpdate} className="btn-update">UPDATE PROFILE</button>
              <button type="button" className="btn-blog" onClick={() => navigate('/blogs')}>
                CREATE YOUR TRAVEL BLOG
              </button>
            </div>
          </div>

          {travelPlans.length > 0 && (
            <div className="user-travel-plans">
              <h3 className="blog-label">YOUR TRAVEL PLANS</h3>
              {travelPlans.map(plan => (
                <div key={plan._id} className="profile-blog-card">
                  <div className="blog-text-content">
                    <h4>{plan.title} — {plan.destination}</h4>
                    <p>{plan.description}</p>
                    <p><strong>Date:</strong> {new Date(plan.date).toLocaleDateString()}</p>
                    <div className="blog-buttons">
                      <button
                        onClick={() => {
                          setTitle(plan.title);
                          setDestination(plan.destination);
                          setDescription(plan.description);
                          setEditPlanId(plan._id);
                        }}
                        className="read-more-btn"
                      >
                        <FaEdit style={{ marginRight: 6 }} /> EDIT
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this plan?')) {
                            try {
                              await axios.delete(`http://localhost:5000/api/travel-plans/${plan._id}`);
                              setTravelPlans(prev => prev.filter(p => p._id !== plan._id));
                              console.log('Plan deleted!');
                            } catch (err) {
                              console.error('Delete plan error:', err);
                            }
                          }
                        }}
                        className="read-more-btn"
                      >
                        <FaTrash style={{ marginRight: 6 }} /> DELETE
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {userBlogs.length > 0 && (
            <div className="user-blogs-section">
              <h3 className="blog-label">YOUR BLOG</h3>
              {userBlogs.map(blog => (
                <div key={blog._id} className="profile-blog-card">
                  <div className="blog-text-content">
                    <h4 className="blog-title-heading">{blog.title}</h4>
                    <p>{blog.content.slice(0, 200)}...</p>
                    <div className="blog-buttons">
                      <button className="read-more-btn" onClick={() => navigate(`/blogs/${blog._id}`)}>
                        READ MORE
                      </button>
                      <button className="read-more-btn" onClick={() => navigate(`/edit-blog/${blog._id}`)}>
                        <FaEdit style={{ marginRight: 6 }} /> EDIT
                      </button>
                      <button
                        className="read-more-btn"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete this blog?')) {
                            try {
                              await axios.delete(`http://localhost:5000/api/blogs/${blog._id}`);
                              setUserBlogs(prev => prev.filter(b => b._id !== blog._id));
                              console.log('Blog deleted!');
                            } catch (err) {
                              console.error('Delete error:', err);
                            }
                          }
                        }}
                      >
                        <FaTrash style={{ marginRight: 6 }} /> DELETE
                      </button>
                    </div>
                  </div>
                  {blog.imageUrls?.[0] && (
                    <img
                      src={`http://localhost:5000${blog.imageUrls[0]}`}
                      alt="Blog"
                      className="blog-thumbnail"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </Mainlayout>
  );
};

export default UserProfilePage;
