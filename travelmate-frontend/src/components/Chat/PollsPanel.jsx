import React, { useEffect, useState } from 'react';
import axios from 'axios';

const chipStyle = (status) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
  background: status === 'OPEN' ? '#00a8a8' :
              status === 'PASSED' ? '#2e7d32' :
              status === 'FAILED' ? '#c62828' : '#6d6d6d'
});

const PollsPanel = ({ token, group, socket, isAdmin }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPolls = async () => {
    if (!group?._id) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`http://localhost:5000/api/groups/${group._id}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPolls(data);
    } catch {
      setPolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?._id]);

  useEffect(() => {
    if (!socket || !group?._id) return;
    const gid = String(group._id);

    const onCreated = ({ groupId }) => { if (groupId === gid) loadPolls(); };
    const onVoted   = ({ groupId }) => { if (groupId === gid) loadPolls(); };
    const onPassed  = ({ groupId }) => { if (groupId === gid) loadPolls(); };
    const onClosed  = ({ groupId }) => { if (groupId === gid) loadPolls(); };

    socket.on('poll:created', onCreated);
    socket.on('poll:voted', onVoted);
    socket.on('poll:passed', onPassed);
    socket.on('poll:closed', onClosed);

    return () => {
      socket.off('poll:created', onCreated);
      socket.off('poll:voted', onVoted);
      socket.off('poll:passed', onPassed);
      socket.off('poll:closed', onClosed);
    };
  }, [socket, group?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const vote = async (pollId, choice) => {
    try {
      await axios.post(
        `http://localhost:5000/api/groups/${group._id}/polls/${pollId}/vote`,
        { choice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // refresh comes from socket
    } catch (e) {
      alert(e?.response?.data?.message || 'Vote failed');
    }
  };

  const close = async (pollId, status) => {
    try {
      await axios.post(
        `http://localhost:5000/api/groups/${group._id}/polls/${pollId}/close`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to close poll');
    }
  };

  if (loading) return <div style={{ color: '#000' }}>Loading polls…</div>;

  const open = polls.filter(p => p.status === 'OPEN');
  const history = polls.filter(p => p.status !== 'OPEN');

  return (
    <div className="polls-panel" style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {open.map(p => (
        <div key={p._id} className="poll-card" style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontWeight: 700, color: '#00a8a8' }}>
              {p.currency} {p.total} split among {p.participants.length} → {p.currency} {p.perPerson} each
            </div>
            <span style={chipStyle(p.status)}>{p.status}</span>
          </div>
          {p.notes && <div style={{ color:'#444', fontSize:13 }}>{p.notes}</div>}
          <div style={{ fontSize:12, color:'#666' }}>
            Agree: {p.tally?.agree || 0} | Not now: {p.tally?.reject || 0}
          </div>
          <div className="poll-actions" style={{ display:'flex', gap:8 }}>
            <button onClick={() => vote(p._id, 'agree')} style={btnPrimary}>Agree</button>
            <button onClick={() => vote(p._id, 'reject')} style={btnLight}>Not now</button>
            {isAdmin && (
              <>
                <button onClick={() => close(p._id, 'FAILED')} style={btnWarn}>Close as Failed</button>
                <button onClick={() => close(p._id, 'EXPIRED')} style={btnGray}>Expire</button>
              </>
            )}
          </div>
        </div>
      ))}

      {history.length > 0 && <div style={{ marginTop: 6, fontWeight: 700, color:'#000' }}>History</div>}
      {history.map(p => (
        <div key={p._id} className="poll-card" style={cardStyle}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontWeight: 700, color: '#00a8a8' }}>
              {p.currency} {p.total} • {p.participants.length} participants • {p.currency} {p.perPerson}/person
            </div>
            <span style={chipStyle(p.status)}>{p.status}</span>
          </div>
          {p.notes && <div style={{ color:'#444', fontSize:13 }}>{p.notes}</div>}
          <div style={{ fontSize:12, color:'#666' }}>
            Agree: {p.tally?.agree || 0} | Not now: {p.tally?.reject || 0}
          </div>
        </div>
      ))}
    </div>
  );
};

const cardStyle = {
  background: '#fff',
  color: '#000',
  borderRadius: 16,
  padding: 14,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  border: '1px solid #eee'
};

const btnPrimary = { background:'#00a8a8', color:'#fff', border:'none', borderRadius:10, padding:'8px 14px', fontWeight:700, cursor:'pointer' };
const btnLight   = { background:'#f0f0f0', color:'#000', border:'none', borderRadius:10, padding:'8px 14px', fontWeight:700, cursor:'pointer' };
const btnWarn    = { background:'#ffe6e6', color:'#b71c1c', border:'1px solid #f3c4c4', borderRadius:10, padding:'8px 14px', fontWeight:700, cursor:'pointer' };
const btnGray    = { background:'#eee', color:'#444', border:'none', borderRadius:10, padding:'8px 14px', fontWeight:700, cursor:'pointer' };

export default PollsPanel;
