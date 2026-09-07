import React, { useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { Settings, UserPlus, Trash2, Save, ShieldCheck } from 'lucide-react';

export const SettingsPage = () => {
  const [settings, setSettings] = useState({
    name: '',
    tagline: '',
    address: '',
    phone: '',
    gstin: '',
    footer: '',
  });
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New Staff Modal
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [newPhone, setNewPhone] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [settRes, staffRes] = await Promise.all([
        authApi.getSettings(),
        authApi.getStaffList(),
      ]);
      if (settRes) setSettings(settRes);
      setStaffList(staffRes.results || staffRes);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await authApi.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert('Failed to update restaurant settings');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      await authApi.createStaff({
        username: newUsername,
        password: newPassword,
        role: newRole,
        phone: newPhone,
      });
      const existing = JSON.parse(localStorage.getItem('created_staff_accounts') || '[]');
      const updated = [...existing.filter(s => s.username !== newUsername), { username: newUsername, password: newPassword, role: newRole, phone: newPhone }];
      localStorage.setItem('created_staff_accounts', JSON.stringify(updated));

      setShowStaffModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      loadData();
    } catch (err) {
      console.warn('Backend staff register API error, storing staff account locally:', err);
      const existing = JSON.parse(localStorage.getItem('created_staff_accounts') || '[]');
      const updated = [...existing.filter(s => s.username !== newUsername), { username: newUsername, password: newPassword, role: newRole, phone: newPhone }];
      localStorage.setItem('created_staff_accounts', JSON.stringify(updated));

      setShowStaffModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewPhone('');
      loadData();
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await authApi.deleteStaff(id);
        loadData();
      } catch (err) {
        alert('Failed to delete staff member');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Restaurant Settings & Staff Roles</h1>
          <p>Configure tax information, receipt layout, and manage staff user accounts</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="badge badge-green" style={{ width: '100%', padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Settings updated successfully!
        </div>
      )}

      <div className="grid-2">
        {/* General Restaurant Settings */}
        <div className="glass-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Settings size={20} color="var(--accent-amber)" />
            <span>Restaurant Profile & Receipt Layout</span>
          </h3>

          <form onSubmit={handleUpdateSettings}>
            <div className="form-group">
              <label>Restaurant Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                className="form-input"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>GSTIN Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.gstin}
                  onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Bill Footer Message</label>
              <input
                type="text"
                className="form-input"
                value={settings.footer}
                onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={16} /> Save Configuration
            </button>
          </form>
        </div>

        {/* Staff Management */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--accent-amber)" />
              <span>Staff Accounts & Roles</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowStaffModal(true)}>
              <UserPlus size={14} /> Add Staff
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {staffList.map((staff) => (
              <div
                key={staff.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{staff.username}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Phone: {staff.phone || 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`badge ${staff.role === 'admin' ? 'badge-purple' : staff.role === 'kitchen' ? 'badge-amber' : 'badge-blue'}`}>
                    {staff.role}
                  </span>
                  {staff.role !== 'admin' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStaff(staff.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Add Staff */}
      {showStaffModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Staff Account</h2>
              <button className="modal-close" onClick={() => setShowStaffModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateStaff}>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                    <option value="staff">Staff / Cashier</option>
                    <option value="kitchen">Kitchen Cook</option>
                    <option value="admin">Admin / Owner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Register Staff Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
