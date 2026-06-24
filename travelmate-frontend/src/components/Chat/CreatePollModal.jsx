// src/components/Chat/CreatePollModal.jsx
import React, { useMemo, useState } from 'react';
import axios from 'axios';

const CreatePollModal = ({ token, group, currentUserId, onClose, onCreated }) => {
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [notes, setNotes] = useState('');
  const [selected, setSelected] = useState(() => group?.members?.map(String) || []);
  const [loading, setLoading] = useState(false);

  const count = selected.length || 0;
  const perPerson = useMemo(() => {
    const t = parseFloat(total);
    if (!t || !count) return '0.00';
    return (Math.round((t / count) * 100) / 100).toFixed(2);
  }, [total, count]);

  const toggle = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!group?._id) return;
    const t = parseFloat(total);
    if (!(t > 0)) return alert('Enter a valid total amount');
    if (selected.length < 2) return alert('Pick at least 2 participants');

    try {
      setLoading(true);
      const { data } = await axios.post(
        `http://localhost:5000/api/groups/${group._id}/polls`,
        {
          total: t,
          currency,
          notes,
          participants: selected,
          adminId: currentUserId, // ensure backend sees requester id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreated?.(data);
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-mask" style={styles.mask}>
      <div className="modal-card" style={styles.card}>
        <h3 style={styles.title}>Create Cost Split Poll</h3>

        <label style={styles.label}>Total Cost</label>
        <input
          style={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={total}
          onChange={e => setTotal(e.target.value)}
          placeholder="e.g., 12000"
          disabled={loading}
        />

        <label style={styles.label}>Currency</label>
        <input
          style={styles.input}
          type="text"
          value={currency}
          onChange={e => setCurrency(e.target.value.toUpperCase())}
          disabled={loading}
        />

        <label style={styles.label}>Notes (optional)</label>
        <input
          style={styles.input}
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Hotel split, taxi, etc."
          disabled={loading}
        />

        <div style={{ margin: '10px 0', fontWeight: 600, color: '#00a8a8' }}>
          Participants ({count}): each ≈ {currency} {perPerson}
        </div>

        <div style={styles.list}>
          {(group?.members || []).map((m) => (
            <label key={m} style={styles.row}>
              <input
                type="checkbox"
                checked={selected.includes(String(m))}
                onChange={() => toggle(String(m))}
                disabled={loading}
              />
              <span style={{ marginLeft: 8 }}>{String(m)}</span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={handleCreate} disabled={loading} style={styles.primary}>
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button onClick={onClose} style={styles.secondary} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  mask: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  card: { background: '#fff', color: '#000', width: 420, borderRadius: 16, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  title: { margin: '0 0 12px', color: '#00a8a8' },
  label: { fontSize: 13, color: '#555', marginTop: 8 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 10, marginTop: 4 },
  list: { maxHeight: 160, overflowY: 'auto', border: '1px solid #eee', borderRadius: 10, padding: 10, marginTop: 8 },
  row: { display: 'flex', alignItems: 'center', padding: '6px 4px' },
  primary: { background: '#00a8a8', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' },
  secondary: { background: '#eee', color: '#333', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }
};

export default CreatePollModal;
