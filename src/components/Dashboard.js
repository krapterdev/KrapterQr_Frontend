import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQr, setEditingQr] = useState(null);
  const [formData, setFormData] = useState({ type: 'url', content: '', color: '#000000' });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      window.location.href = '/';
      return;
    }
    fetchQrCodes();
  }, [token]);

  const fetchQrCodes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/qrcodes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodes(res.data);
    } catch (err) {
      setError('Failed to fetch QR codes');
    } finally {
      setLoading(false);
    }
  };

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startEdit = qr => {
    setEditingQr(qr);
    setFormData({
      type: qr.type,
      content: qr.content,
      color: qr.customization.color || '#000000'
    });
    setQrCodeDataUrl('');
  };

  const cancelEdit = () => {
    setEditingQr(null);
    setFormData({ type: 'url', content: '', color: '#000000' });
  };

  // Save edited QR code
  const saveEdit = async e => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/qrcodes/${editingQr._id}`,
        {
          type: formData.type,
          content: formData.content,
          customization: { color: formData.color }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cancelEdit();
      fetchQrCodes();
    } catch {
      setError('Failed to update QR code');
    }
  };

  // Delete QR code
  const deleteQr = async id => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/qrcodes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchQrCodes();
    } catch {
      setError('Failed to delete QR code');
    }
  };

  // Generate new QR code (optional implementation)
  const generateQrCode = async e => {
    e.preventDefault();
    setError('');
    setQrCodeDataUrl('');
    try {
      const res = await axios.post(
        'http://localhost:5000/api/qrcodes',
        {
          type: formData.type,
          content: formData.content,
          customization: { color: formData.color }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setQrCodeDataUrl(res.data.qrCodeUrl);
      fetchQrCodes();
      setFormData({ type: 'url', content: '', color: '#000000' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating QR code');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 700 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Dashboard</h2>
        <button onClick={logout} className="btn btn-danger btn-sm">
          Logout
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <p>Loading QR codes...</p>
      ) : (
        <>
          <h5>Your QR Codes</h5>
          {qrCodes.length === 0 && <p>No QR codes found.</p>}
          <ul className="list-group mb-4">
            {qrCodes.map(qr => (
              <li key={qr._id} className="list-group-item d-flex justify-content-between align-items-center">
                <span>{qr.type.toUpperCase()}: {qr.content}</span>
                <div>
                  <button className="btn btn-sm btn-primary me-2" onClick={() => startEdit(qr)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteQr(qr._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Form for create or edit */}
      <div>
        <h5>{editingQr ? 'Edit QR Code' : 'Generate New QR Code'}</h5>
        <form onSubmit={editingQr ? saveEdit : generateQrCode}>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select
              className="form-select"
              name="type"
              value={formData.type}
              onChange={onChange}
              disabled={!!editingQr} // Disable type change on edit
            >
              <option value="url">URL</option>
              <option value="text">Text</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Content</label>
            <input
              type="text"
              className="form-control"
              name="content"
              value={formData.content}
              onChange={onChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              name="color"
              value={formData.color}
              onChange={onChange}
              title="Choose color"
            />
          </div>
          {editingQr ? (
            <>
              <button type="submit" className="btn btn-success me-2">Save</button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
            </>
          ) : (
            <button type="submit" className="btn btn-primary">Generate QR Code</button>
          )}
        </form>
      </div>

      {qrCodeDataUrl && (
        <div className="text-center mt-4">
          <h5>Generated QR Code:</h5>
          <img src={qrCodeDataUrl} alt="Generated QR Code" style={{ width: '250px', height: '250px' }} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
