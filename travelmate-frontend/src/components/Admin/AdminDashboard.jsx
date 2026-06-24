// src/components/Admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './AdminDashboard.css';

const API_BASE = 'http://localhost:5000';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    blogs: 0,
    reports: 0,        // chat reports
    userReports: 0,    // ✅ user reports
    destinations: 0,
    eventImages: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers = { Authorization: `Bearer ${user?.token}` };

        const [u, b, r, ur, d, e] = await Promise.all([
          axios.get(`${API_BASE}/api/users/admin/users`, { headers }),
          axios.get(`${API_BASE}/api/blogs/admin/all`, { headers }),
          axios.get(`${API_BASE}/api/reports/admin/chat`, { headers }),  // existing chat reports
          axios.get(`${API_BASE}/api/user-reports`, { headers }),        // ✅ new: user reports
          axios.get(`${API_BASE}/api/destinations`),
          axios.get(`${API_BASE}/api/event-images/all`),
        ]);

        setStats({
          users: Array.isArray(u.data) ? u.data.length : 0,
          blogs: Array.isArray(b.data) ? b.data.length : 0,
          reports: Array.isArray(r.data) ? r.data.length : 0,
          userReports: Array.isArray(ur.data) ? ur.data.length : 0, // ✅
          destinations: Array.isArray(d.data) ? d.data.length : 0,
          eventImages: Array.isArray(e.data) ? e.data.length : 0,
        });
      } catch (err) {
        console.log('Failed to fetch dashboard stats', err?.message || '');
      }
    };

    fetchStats();
  }, [user?.token]);

  const cards = [
    { title: 'Manage Users', path: '/admin/users', count: stats.users },
    { title: 'Manage Blogs', path: '/admin/blogs', count: stats.blogs },
    { title: 'Chat Reports', path: '/admin/reports', count: stats.reports },           // chat reports
    { title: 'User Reports', path: '/admin/user-reports', count: stats.userReports },  // ✅ new card
    { title: 'Manage Destinations', path: '/admin/destinations', count: stats.destinations },
    { title: 'Manage Event Images', path: '/admin/event-image', count: stats.eventImages },
  ];

  return (
    <Mainlayout>
      <div className="admin-dashboard">
        <h1 className="admin-title">Admin Dashboard</h1>

        <div className="dashboard-cards">
          {cards.map((card) => (
            <div
              key={card.title}
              className="dashboard-card"
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' ? navigate(card.path) : null)}
            >
              <h3>{card.title}</h3>
              {card.count !== null && <p>{card.count}</p>}
            </div>
          ))}
        </div>
      </div>
    </Mainlayout>
  );
};

export default AdminDashboard;
