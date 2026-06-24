import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BlogPage.css';
import './BlogDetailPage.css';
import { useAuth } from '../context/AuthContext';
import Mainlayout from '../layouts/Mainlayout';

const BlogDetailPage = () => {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/blogs/${id}`)
      .then(res => setBlog(res.data))
      .catch(err => console.error('Error fetching blog:', err));
  }, [id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!blog) return <Mainlayout><p className="loading-text">Loading blog...</p></Mainlayout>;

  return (
    <Mainlayout>
      <div className="blog-detail-wrapper">
        <div className="blog-detail">
          <h1 className="blog-title">{blog.title}</h1>
          <p className="blog-detail-date">
            {new Date(blog.createdAt).toLocaleDateString()}
          </p>
          <div className="blog-detail-content">
            {blog.content.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
          
          {blog.imageUrls?.length > 0 && (
            <div className="blog-detail-images">
              {blog.imageUrls.map((img, i) => (
                <img
                  key={i}
                  src={`http://localhost:5000${img}`}
                  alt={`Blog Image ${i + 1}`}
                  className="blog-img"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Mainlayout>
  );
};

export default BlogDetailPage;
