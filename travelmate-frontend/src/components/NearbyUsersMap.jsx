import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Mainlayout from "../layouts/Mainlayout";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { isTokenExpired } from "../utils/checkTokenExpired";
import { getDistance } from "geolib";
import "./NearbyUsersMap.css";

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function RadarScan() {
  return (
    <div className="radar-scan">
      <div className="radar-echo" style={{ animationDelay: "0s" }} />
      <div className="radar-echo" style={{ animationDelay: "1.2s" }} />
      <div className="pulse" />
      <div className="sweep" />
    </div>
  );
}

const DEFAULT_CENTER = [27.7, 85.3];

const NearbyUsersMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userCoords, setUserCoords] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const params = new URLSearchParams(location.search);
  const latParam = params.get("lat");
  const lngParam = params.get("lng");
  const linkCoords =
    latParam && lngParam ? [parseFloat(latParam), parseFloat(lngParam)] : null;

  useEffect(() => {
    document.title = "Nearby Users – Nomad";
    if (!user) return;

    if (isTokenExpired(user.token)) {
      alert("Session expired. Please login again.");
      localStorage.removeItem("travelmateUser");
      navigate("/login");
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCoords([latitude, longitude]);
          try {
            await axios.put(
              `http://localhost:5000/api/users/location/${user._id}`,
              {
                location: {
                  type: "Point",
                  coordinates: [longitude, latitude],
                },
              },
              {
                headers: { Authorization: `Bearer ${user.token}` },
              }
            );
          } catch (err) {
            console.warn("Location update failed:", err.message);
          }
        },
        () => setUserCoords(null)
      );
    }
  }, [user, navigate]);

  const fetchNearbyUsers = async () => {
    const centerCoords = linkCoords || userCoords;
    if (!centerCoords) {
      alert("Location not available.");
      return;
    }
    setLoading(true);
    try {
      const [lat, lng] = centerCoords;
      const res = await fetch(
        `http://localhost:5000/api/users/nearby?lat=${lat}&lng=${lng}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const data = await res.json();
      setNearbyUsers(Array.isArray(data) ? data : []);
    } catch {
      setNearbyUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchNearby = async () => {
    setIsScanning(true);
    setNearbyUsers([]);
    setTimeout(async () => {
      setIsScanning(false);
      await fetchNearbyUsers();
    }, 2400);
  };

  const calculateDistance = (userLat, userLng) => {
    if (!userCoords) return null;
    return getDistance(
      { latitude: userCoords[0], longitude: userCoords[1] },
      { latitude: userLat, longitude: userLng }
    );
  };

  return (
    <Mainlayout>
      <div className="map-overlay-mode">
        <div className="map-controls">
          <button onClick={handleSearchNearby} className="search-button" disabled={isScanning}>
            {loading || isScanning ? "Searching..." : "Search Nearby Travellers"}
          </button>
        </div>

        <section className="map-section" style={{ position: "relative" }}>
          {isScanning && <RadarScan />}

          <MapContainer
            center={linkCoords || userCoords || DEFAULT_CENTER}
            zoom={linkCoords ? 13 : 10}
            className="map-leaflet"
            style={{ height: "60vh", width: "100%", borderRadius: "1rem" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors & CARTO'
            />

            {userCoords && (
              <Marker position={userCoords}>
                <Popup>
                  <strong>You</strong>
                  <br />
                  This is your current location.
                </Popup>
              </Marker>
            )}

            {/* Draw one distance circle for each nearby user */}
            {!isScanning &&
              userCoords &&
              nearbyUsers.map((u) => {
                if (!u.location?.coordinates) return null;
                const [lng, lat] = u.location.coordinates;
                const distance = calculateDistance(lat, lng); // in meters

                return (
                  <Circle
                    key={u._id}
                    center={userCoords}
                    radius={distance}
                    pathOptions={{
                      color: "#00cfcf",
                      fillColor: "#00e5ff",
                      fillOpacity: 0.2,
                      dashArray: "4",
                    }}
                  >
                    <Popup>{(distance / 1000).toFixed(2)} km from you</Popup>
                  </Circle>
                );
              })}
          </MapContainer>
        </section>

        {!isScanning && nearbyUsers.length > 0 && (
          <div className="nearby-user-list">
            <h3>Nearby Travellers</h3>
            {nearbyUsers.map((u) => {
              const [lng, lat] = u.location?.coordinates || [];
              const dist = calculateDistance(lat, lng);
              const km = (dist / 1000).toFixed(1);

              return (
                <div
                  key={u._id}
                  className="user-card"
                  onClick={() => navigate(`/public-profile/${u._id}`)}
                >
                  <img
                    src={`http://localhost:5000${u.profileImageUrl}`}
                    alt={u.fullName}
                  />
                  <div>
                    <h4>{u.fullName}</h4>
                    <p>{km} km from you</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Mainlayout>
  );
};

export default NearbyUsersMap;
