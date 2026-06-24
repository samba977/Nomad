// src/components/Admin/AdminEventImage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import Mainlayout from '../../layouts/Mainlayout';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminEventImage.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const PAGE_SIZE = 12; // grid-friendly

const AdminEventImage = () => {
  const { user } = useAuth();

  // ==== State ====
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Resolve a token robustly
  const token = useMemo(() => {
    if (user?.token) return user.token;
    try {
      const raw = localStorage.getItem('travelmateUser');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.token || null;
    } catch {
      return null;
    }
  }, [user]);

  // Build absolute URL if backend returns a relative path
  const toImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // ==== API Calls ====
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/event-images/all`);
      const list = Array.isArray(data) ? data : [];
      // newest first if uploadedAt exists
      list.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
      setImages(list);
    } catch (err) {
      toast.error('Failed to fetch event images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // ==== Modal open/close ====
  const openForm = () => setShowForm(true);
  const closeForm = () => {
    setFile(null);
    setShowForm(false);
  };

  // Close modal on ESC
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e) => e.key === 'Escape' && closeForm();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  // ==== Upload ====
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');

    const formData = new FormData();
    formData.append('eventImage', file);

    setUploading(true);
    try {
      await axios.post(`${API_BASE}/api/event-images/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      toast.success('Image uploaded successfully');
      await fetchImages();
      closeForm();
      setPage(1); // show newly uploaded items first
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ==== Delete ====
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await axios.delete(`${API_BASE}/api/event-images/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setImages((prev) => {
        const updated = prev.filter((img) => img._id !== id);

        // keep pagination sane after deletion
        const q = search.toLowerCase().trim();
        const filteredLen = q
          ? updated.filter((img) => {
              const url = img.url || '';
              const when = img.uploadedAt ? new Date(img.uploadedAt).toLocaleString() : '';
              return url.toLowerCase().includes(q) || when.toLowerCase().includes(q);
            }).length
          : updated.length;

        const newTotalPages = Math.max(1, Math.ceil(filteredLen / PAGE_SIZE));
        setPage((p) => Math.min(p, newTotalPages));

        return updated;
      });
      toast.success('Image deleted');
    } catch (err) {
      toast.error('Failed to delete image');
    }
  };

  // ==== Derived: filtered + paginated ====
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return images;
    return images.filter((img) => {
      const url = img.url || '';
      const when = img.uploadedAt ? new Date(img.uploadedAt).toLocaleString() : '';
      return url.toLowerCase().includes(q) || when.toLowerCase().includes(q);
    });
  }, [images, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageSafe]);

  // reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Mainlayout>
      <div className="admin-event-image-page">
        {/* Title */}
        <h2>Manage Event Images</h2>

        {/* Toolbar (search + upload) — matches other admin pages */}
        <div className="destinations-toolbar add-destination-topbar">
          <input
            className="search-input"
            type="text"
            placeholder="Search by file path or date…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="add-destination-btn" onClick={openForm}>
            + Upload Image
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={closeForm}>
            <form
              className="destination-modal-form"
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleUpload}
            >
              <h3>Upload New Event Image</h3>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
              />

              <div className="modal-actions">
                <button type="submit" className="submit-btn" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button type="button" className="cancel-btn" onClick={closeForm} disabled={uploading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p style={{ textAlign: 'center' }}>Loading images…</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', marginTop: 20 }}>No event images yet.</p>
        ) : (
          <>
            <div className="destination-list">
              {pageSlice.map((img, index) => (
                <div className="destination-item" key={img._id}>
                  <img src={toImageUrl(img.url)} alt={`event-${index + 1}`} />
                  <div className="destination-meta">
                    <h4>Image {(pageSafe - 1) * PAGE_SIZE + index + 1}</h4>
                    {img?.uploadedAt && (
                      <p>Uploaded: {new Date(img.uploadedAt).toLocaleString()}</p>
                    )}
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(img._id)}>
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* pagination (Prev / 1.. / Next) */}
            <div className="pagination">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pageSafe === 1}>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={p === pageSafe ? 'active' : ''}
                >
                  {p}
                </button>
              ))}

              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </Mainlayout>
  );
};

export default AdminEventImage;
