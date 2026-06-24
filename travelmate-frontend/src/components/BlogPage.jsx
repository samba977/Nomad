import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BlogPage.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Mainlayout from '../layouts/Mainlayout';

const BlogPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [userBlogs, setUserBlogs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login");

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('authorId', user.id || user._id);
    images.forEach(img => formData.append('images', img));

    try {
      await axios.post('http://localhost:5000/api/blogs/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Blog posted!');
      setTitle('');
      setContent('');
      setImages([]);
      fetchUserBlogs();
    } catch (err) {
      console.error("Blog upload error:", err.response?.data || err.message);
      alert('Failed to post blog');
    }
  };

  const fetchUserBlogs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/blogs/user/${user._id || user.id}`);
      setUserBlogs(res.data);
    } catch (err) {
      console.error('Error loading blogs:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserBlogs();
    }
  }, [user]);

  return (
    <Mainlayout>
      <div className="blog-wrapper">
        {/* Blog Creation Form */}
        <div className="blog-container">
          <h2>Create a New Blog</h2>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <input
              type="text"
              placeholder="Blog Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Write your story..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
            <input
              type="file"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files))}
            />
            <button type="submit" className="btn-blog">Post Blog</button>
          </form>
        </div>

        {/* Display User Blogs */}
        {userBlogs.length > 0 && (
          <div className="user-blogs-section">
            <h3 className="blog-label">YOUR BLOGS</h3>
            {userBlogs.map(blog => (
              <div key={blog._id} className="profile-blog-card">
                <div className="blog-text-content">
                  <h4 className="blog-title-heading">{blog.title}</h4>
                  <p>{blog.content.slice(0, 100)}...</p>
                  <div className="blog-buttons">
                    <button
                      onClick={() => navigate(`/blogs/${blog._id}`)}
                      className="read-more-btn"
                    >
                      READ MORE
                    </button>
                    <button className="read-more-btn">EDIT</button>
                    <button className="read-more-btn">DELETE</button>
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
      </div>
    </Mainlayout>
  );
};

export default BlogPage;
