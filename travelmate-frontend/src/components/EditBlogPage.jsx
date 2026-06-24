import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './BlogPage.css';
import './LandingPage.css';
import './UserProfilePage.css';
import Mainlayout from '../layouts/Mainlayout';


const EditBlogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/blogs/${id}`)
      .then(res => {
        setTitle(res.data.title);
        setContent(res.data.content);
      })
      .catch(err => toast.error('Failed to load blog'));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/blogs/${id}`, {
        title,
        content,
      });
      toast.success('Blog updated successfully');
      navigate('/profile');
    } catch (err) {
      toast.error('Failed to update blog');
    }
  };

  return (
    <Mainlayout>
      <div className="landing-container flex flex-col min-h-screen">
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

        <div className="blog-wrapper">
          <div className="blog-container">
            <h2>Edit Blog</h2>
            <form onSubmit={handleUpdate}>
              <input
                type="text"
                placeholder="Blog Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 mb-4 border rounded"
              />
              <textarea
                placeholder="Blog Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                required
                className="w-full p-2 mb-4 border rounded"
              />
              <button type="submit" className="btn-blog">Update Blog</button>
            </form>
          </div>
        </div>
      </div>
    </Mainlayout>
  );
};

export default EditBlogPage;
