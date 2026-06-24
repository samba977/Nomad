import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BlogPage.css'; // Reuse styles
import { useAuth } from '../context/AuthContext';
import Mainlayout from '../layouts/Mainlayout';

const AllBlogsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    axios.get('http://localhost:5000/api/blogs/all')
      .then(res => setBlogs(res.data))
      .catch(err => console.error('Error fetching blogs:', err));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Mainlayout>
      <div className="blog-wrapper">
        <div className="user-blogs-section">
          {blogs.map(blog => (
            <div key={blog._id} className="profile-blog-card">
              <div className="blog-text-content">
                <h3 className="blog-label">{blog.title}</h3>
                <p>{blog.content.slice(0, 200)}...</p>
                <div className="blog-buttons">
                  <button
                    onClick={() => navigate(`/blogs/${blog._id}`)}
                    className="read-more-btn"
                  >
                    READ MORE
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
      </div>
    </Mainlayout>
  );
};

export default AllBlogsPage;
