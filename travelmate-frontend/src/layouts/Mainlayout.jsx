import React, { useEffect, useMemo, useState } from 'react';
import './Mainlayout.css';
import './Navbar.css';
import './Footer.css';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Logo from '../assets/Logo.png';
import {
  FaSignOutAlt, FaFacebookF, FaInstagram, FaYoutube, FaTwitter,
  FaHome, FaInfoCircle, FaEnvelope, FaQuestionCircle, FaLock, FaUser
} from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'http://localhost:5000';

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/all-blogs', label: 'BLOGS' },
  { to: '/destinations', label: 'DESTINATIONS' },
  { to: '/chat', label: 'CHAT', badge: true },
];

const SOCIALS = [
  { icon: <FaFacebookF />, label: 'Facebook', url: 'https://www.facebook.com' },
  { icon: <FaInstagram />, label: 'Instagram', url: 'https://www.instagram.com' },
  { icon: <FaYoutube />, label: 'YouTube', url: 'https://www.youtube.com' },
  { icon: <FaTwitter />, label: 'Twitter', url: 'https://www.twitter.com' },
];

const Mainlayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = location.pathname === '/map';
  const isGlassPage = useMemo(
    () => ['/', '/all-blogs', '/destinations', '/chat'].includes(location.pathname),
    [location.pathname]
  );

  // Glass nav on scroll
  useEffect(() => {
    if (!isGlassPage) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isGlassPage]);

  // Unread chat badge
  useEffect(() => {
    let alive = true;

    const fetchUnread = async () => {
      if (!user) {
        if (alive) setUnreadCount(0);
        return;
      }
      try {
        const id = user._id || user.id;
        const res = await fetch(`${API_BASE}/api/chat/companions/${id}`);
        const companions = await res.json();
        const count = Array.isArray(companions)
          ? companions.filter(c => Number(c?.unreadMessages) > 0).length
          : 0;
        if (alive) setUnreadCount(count);
      } catch {
        if (alive) setUnreadCount(0);
      }
    };

    fetchUnread();
    const t = setInterval(fetchUnread, 20000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user]);

  // Toast live notifications
  useEffect(() => {
    if (!socket || !user) return;
    const me = user._id || user.id;

    const notify = (msg) => {
      if (msg?.senderId && msg.senderId !== me) {
        toast.info(
          `${msg.senderName || 'Someone'}: ${msg.text || 'sent a message'}`,
          { position: 'top-center', autoClose: 4000 }
        );
      }
    };

    socket.on('receiveMessage', notify);
    socket.on('receiveGroupMessage', notify);

    return () => {
      socket.off('receiveMessage', notify);
      socket.off('receiveGroupMessage', notify);
    };
  }, [socket, user]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setMenuOpen(false);
    navigate('/');
  };

  const renderNavLinks = () =>
    NAV_LINKS.map(link => (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={() => setMenuOpen(false)}
        className={({ isActive }) =>
          `nav-link group relative inline-block px-3 py-1 font-semibold tracking-wide transition-colors duration-200 ${isActive ? 'active' : ''}`
        }
      >
        {link.label}
        <span className="nav-underline" />
        {link.badge && unreadCount > 0 && (
          <span className="chat-badge" aria-label={`${unreadCount} unread chats`}>
            {unreadCount}
          </span>
        )}
      </NavLink>
    ));

  return (
    <div className={`travel-page-container ${isMapPage ? 'map-wrapper' : ''}`}>
      <div className={`landing-container ${isMapPage ? 'map-page' : ''}`}>
        <ToastContainer position="top-center" autoClose={3000} pauseOnHover theme="light" />

        {/* NAVBAR */}
        <nav className={`navbar ${scrolled && isGlassPage ? 'scrolled' : ''}`}>
          <div className="logo-with-profile">
            <img src={Logo} alt="Nomad logo" className="navbar-logo" />

            {/* MOBILE: show avatar next to logo */}
            {user && (
              <div
                className="mobile-avatar"
                role="button"
                tabIndex={0}
                aria-label={user?.isAdmin ? 'Admin dashboard' : 'Open profile'}
                onClick={() => navigate(user?.isAdmin ? '/admin' : '/profile')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(user?.isAdmin ? '/admin' : '/profile')}
              >
                {user?.isAdmin ? (
                  <div className="admin-avatar admin-avatar--mobile"><span>ADMIN</span></div>
                ) : user?.profileImageUrl ? (
                  <img
                    src={`${API_BASE}${user.profileImageUrl}`}
                    alt="Profile"
                    className="nav-profile-image nav-profile-image--mobile"
                  />
                ) : (
                  <div className="admin-avatar admin-avatar--mobile"><span>USER</span></div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
          >
            <div /><div /><div />
          </button>

          {/* Mobile drawer */}
          <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
            {renderNavLinks()}
            <NavLink
              to="/map"
              className="location-icon"
              aria-label="Location"
              onClick={() => setMenuOpen(false)}
            >
              <FiMapPin size={20} />
            </NavLink>

            {!user ? (
              <NavLink
                to="/signup"
                className="navbar-logout-btn"
                onClick={() => setMenuOpen(false)}
              >
                SIGN UP
              </NavLink>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="navbar-logout-btn"
              >
                <FaSignOutAlt style={{ marginRight: 6 }} />
                LOG OUT
              </button>
            )}
          </div>

          {/* Desktop links */}
          <div className="nav-links">{renderNavLinks()}</div>

          {/* DESKTOP RIGHT: map icon + avatar dropdown */}
          <div className="nav-actions">
            <NavLink to="/map" className="location-icon" aria-label="Location">
              <FiMapPin size={20} />
            </NavLink>

            {!user ? (
              <NavLink to="/signup" className="navbar-logout-btn">SIGN UP</NavLink>
            ) : (
              <div className="profile-dropdown" tabIndex={0}>
                <button
                  type="button"
                  className="avatar-trigger"
                  aria-haspopup="true"
                  aria-expanded="false"
                  title="Open profile menu"
                >
                  {user?.isAdmin ? (
                    <div
                      className="admin-avatar"
                      onClick={() => navigate('/admin')}
                      aria-label="Admin dashboard"
                    >
                      <span>ADMIN</span>
                    </div>
                  ) : user?.profileImageUrl ? (
                    <img
                      src={`${API_BASE}${user.profileImageUrl}`}
                      alt="Profile"
                      className="nav-profile-image"
                      onClick={() => navigate('/profile')}
                    />
                  ) : (
                    <div className="admin-avatar"><span>USER</span></div>
                  )}
                </button>

                <div className="profile-menu" role="menu">
                  <button
                    type="button"
                    className="menu-item"
                    onClick={() => navigate(user?.isAdmin ? '/admin' : '/profile')}
                    role="menuitem"
                  >
                    <FaUser style={{ marginRight: 8 }} />
                    Profile
                  </button>
                  <button
                    type="button"
                    className="menu-item"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <FaSignOutAlt style={{ marginRight: 8 }} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* PAGE CONTENT */}
        <main
          style={
            isMapPage
              ? {
                  flex: 1,
                  padding: 0,
                  minHeight: 'calc(100vh - 80px)',
                  background: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }
              : { flex: 1 }
          }
        >
          {children}
        </main>

        {/* FOOTER */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-column brand">
              <h3>Nomad</h3>
              <p>
                Start finding your travel <br /> companion now, Sign In now!!
              </p>

              {!user ? (
                <NavLink to="/signup" className="signin-button">
                  <span className="signin-text">SIGN UP</span>
                  <span className="arrow-icon" aria-hidden="true">→</span>
                </NavLink>
              ) : (
                <button type="button" onClick={handleLogout} className="signin-button">
                  <span className="signin-text">LOG OUT</span>
                  <span className="arrow-icon"><FaSignOutAlt /></span>
                </button>
              )}
            </div>

            <div className="footer-columns-group">
              <div className="footer-column links">
                <NavLink to="/" className="footer-link">
                  <FaHome /><span>Home</span>
                </NavLink>
                <NavLink to="/about" className="footer-link">
                  <FaInfoCircle /><span>About</span>
                </NavLink>
              </div>

              <div className="footer-column links">
                <NavLink to="/contact" className="footer-link">
                  <FaEnvelope /><span>Contact</span>
                </NavLink>
                <NavLink to="/faq" className="footer-link">
                  <FaQuestionCircle /><span>FAQ</span>
                </NavLink>
                <NavLink to="/privacy-policy" className="footer-link">
                  <FaLock /><span>Privacy Policy</span>
                </NavLink>
              </div>

              <div className="footer-column links">
                {SOCIALS.map(({ icon, label, url }) => (
                  <a
                    key={label}
                    className="footer-link"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                  >
                    {icon}<span>{label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>©Nomad Inc. All Rights Reserved 2025</p>
            <NavLink to="/terms-and-conditions" className="footer-link">
              Terms & Conditions
            </NavLink>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Mainlayout;
