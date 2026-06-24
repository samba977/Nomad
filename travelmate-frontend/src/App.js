// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import TravelCompanion from './components/TravelCompanion';
import UserProfileCreationPage from './components/UserProfileCreationPage';
import UserProfilePage from './components/UserProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import BlogPage from './components/BlogPage';
import BlogDetailPage from './components/BlogDetailPage';
import AllBlogsPage from './components/AllBlogsPage';
import EditBlogPage from './components/EditBlogPage';
import PublicUserProfile from './components/PublicUserProfile';
import NearbyUsersMap from './components/NearbyUsersMap';
import ChatWindow from './components/Chat/ChatWindow';
import DestinationPage from './components/Destination/DestinationPage';

// Admin pages
import AdminDashboard from './components/Admin/AdminDashboard';
import ManageUsers from './components/Admin/ManageUsers';
import ManageBlogs from './components/Admin/ManageBlogs';
import ViewReports from './components/Admin/ViewReports';
import ManageDestinations from './components/Admin/ManageDestinations';
import AdminEventImage from './components/Admin/AdminEventImage';
import AdminUserReports from './components/Admin/AdminUserReports'; // ✅ NEW

// Footer pages (public)
import AboutPage from './components/footerpages/AboutPage';
import ContactPage from './components/footerpages/ContactPage';
import FaqPage from './components/footerpages/FaqPage';
import PrivacyPolicyPage from './components/footerpages/PrivacyPolicyPage';
import TermsPage from './components/footerpages/TermsPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/blogs/:id" element={<BlogDetailPage />} />
          <Route path="/public-profile/:id" element={<PublicUserProfile />} />
          <Route path="/destinations" element={<DestinationPage />} />

          {/* Footer */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />

          {/* Protected */}
          <Route
            path="/companions"
            element={
              <ProtectedRoute>
                <TravelCompanion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-profile"
            element={
              <ProtectedRoute>
                <UserProfileCreationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-blog/:id"
            element={
              <ProtectedRoute>
                <EditBlogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <NearbyUsersMap />
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-blogs"
            element={
              <ProtectedRoute>
                <AllBlogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blogs"
            element={
              <ProtectedRoute>
                <ManageBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute>
                <ViewReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-reports"           // ✅ NEW: User Reports admin page
            element={
              <ProtectedRoute>
                <AdminUserReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/destinations"
            element={
              <ProtectedRoute>
                <ManageDestinations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/event-image"
            element={
              <ProtectedRoute>
                <AdminEventImage />
              </ProtectedRoute>
            }
          />

          {/* 404 -> Landing */}
          <Route path="*" element={<LandingPage />} />
        </Routes>

        <ToastContainer position="top-center" autoClose={3000} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
