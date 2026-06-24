import React, { useEffect, useMemo, useState } from 'react';
import Mainlayout from '../../layouts/Mainlayout';
import './DestinationPage.css';
import DestinationCard from './DestinationCard';
import axios from 'axios';

import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Autoplay,
  Navigation,
  Pagination,
  Keyboard,
  Mousewheel,
  EffectCoverflow,
} from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const DestinationPage = () => {
  const [filter, setFilter] = useState('All');
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Beach', 'Adventure', 'Historical', 'Mountain', 'Other'];

  useEffect(() => {
    let mounted = true;
    axios
      .get('http://localhost:5000/api/destinations')
      .then((res) => mounted && setDestinations(Array.isArray(res.data) ? res.data : []))
      .catch(() => mounted && setDestinations([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'All') return destinations;
    return destinations.filter((d) => d.category === filter);
  }, [destinations, filter]);

  // ✅ needs backticks for a template string
  const swiperKey = `swiper-3d-${filter}-${filtered.length}`;

  return (
    <Mainlayout>
      <div className="destination-page">
        <h1 className="destination-heading">Explore Destinations</h1>

        <div className="destination-filters">
          {categories.map((category) => (
            <button
              key={category}
              // ✅ use backticks for className template
              className={`filter-btn ${filter === category ? 'active' : ''}`}
              onClick={() => setFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="loading-text">Loading destinations...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-text">No destinations found.</p>
        ) : (
          <div className="destination-swiper-wrap three-d">
            <Swiper
              key={swiperKey}
              modules={[Autoplay, Navigation, Pagination, Keyboard, Mousewheel, EffectCoverflow]}
              className="destination-swiper destination-swiper-3d"
              effect="coverflow"
              coverflowEffect={{
                rotate: 24,
                stretch: -6,
                depth: 160,
                modifier: 1.1,
                slideShadows: false, // softer look
              }}
              centeredSlides
              slidesPerView="auto"
              spaceBetween={0}
              loop
              speed={900}
              autoplay={{
                delay: 1600, // “tank tires” continuous feel
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              mousewheel={{ forceToAxis: true }}
              keyboard={{ enabled: true }}
              pagination={{ clickable: true }}
              navigation
            >
              {filtered.map((dest) => (
                <SwiperSlide key={dest._id} className="destination-slide three-d-slide">
                  <DestinationCard destination={dest} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default DestinationPage;
