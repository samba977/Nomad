import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import Mainlayout from '../layouts/Mainlayout';
import { FaHandPointRight } from 'react-icons/fa'; // 👈 hand icon
import './LandingPage.css';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventImages, setEventImages] = useState([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Set page title
  useEffect(() => {
    document.title = 'Nomad – Your Travel Companion';
  }, []);

  // Fetch event images from backend
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/event-images/all');
        const urls = data.map((img) => img.url);
        setEventImages(urls);
      } catch (err) {
        console.error('Failed to fetch event images:', err);
      }
    };
    fetchImages();
  }, []);

  // Autoplay slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEventIndex((prev) =>
        eventImages.length > 0 ? (prev + 1) % eventImages.length : 0
      );
    }, 6000);
    return () => clearInterval(interval);
  }, [eventImages]);

  // Auth check with toast + redirect
  const redirectWithToast = (e, message, route = '/signup') => {
    if (!user) {
      e.preventDefault();
      toast.info(message);
      setTimeout(() => {
        navigate(route);
      }, 800);
    }
  };

  const prevEvent = () => {
    setCurrentEventIndex((prev) => (prev - 1 + eventImages.length) % eventImages.length);
  };

  const nextEvent = () => {
    setCurrentEventIndex((prev) => (prev + 1) % eventImages.length);
  };

  return (
    <Mainlayout>
      <div className="landing-container">
        <section className="hero center-content">
          <div className="hero-left centered-text-block">
            <h1 className="main-heading">
              Thrilling Adventure<br />for Every Traveller
            </h1>
            <p className="sub-heading">
              Connect with like-minded explorers<br />
              and make every trip unforgettable.
            </p>

            {/* CTA with hand icon on the LEFT */}
            <div className="cta-wrapper">
              <a
                href="/companions"
                className="cta"
                onClick={(e) =>
                  redirectWithToast(
                    e,
                    '🔒 Please sign in to find a travel companion.',
                    '/signup'
                  )
                }
              >
                <span>
                  <FaHandPointRight className="cta-icon" />
                  Find Your Travel Companion
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Read Blogs */}
        <div className="read-blogs">
          <a
            href="/all-blogs"
            onClick={(e) =>
              redirectWithToast(e, '🔒 Please sign in to read travel blogs.', '/signup')
            }
          >
            Read Travel Blogs
          </a>
        </div>

        {/* Events Section */}
        <section className="events-section">
          <h2>Join Local Events</h2>
          {eventImages.length > 0 && (
            <>
              <div className="event-slider">
                <img
                  id="eventImage"
                  src={eventImages[currentEventIndex]}
                  alt={`event-${currentEventIndex}`}
                />
              </div>

              <div className="event-dots">
                <span
                  className="event-dot"
                  onClick={prevEvent}
                  aria-label="Previous event"
                />
                <span className="event-dot active" aria-label="Current event" />
                <span className="event-dot" onClick={nextEvent} aria-label="Next event" />
              </div>
            </>
          )}
        </section>
      </div>
    </Mainlayout>
  );
}
