import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AddStaffModal } from '../../components/admin/AddStaffModal';
import { EditStaffModal } from '../../components/admin/EditStaffModal';
import '../../styles/admin.css';

// Palette of background colors for initials avatar matching reference design
const AVATAR_COLORS = [
  '#3B6B88', // Dark Blue / Slate (SM)
  '#B8624D', // Terracotta (SP)
  '#8B6F47', // Olive / Brown (AV)
  '#7A4F7D', // Purple / Plum (PK)
  '#BA5436', // Rust / Red-Orange (RK)
  '#3B728F', // Slate Blue (PN)
  '#C06838', // Amber Brown (JD)
  '#6B4D78', // Purple (AM)
];

export const AdminStaffsPage = () => {
  const { user, openProfile } = useAuth();

  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const loadStaffs = async () => {
    setLoading(true);
    try {
      const res = await authApi.getStaffUsers();
      const list = res.results || res;
      if (Array.isArray(list)) {
        setStaffs(list);
      }
    } catch (err) {
      console.error('Failed to load staffs:', err);
      setStaffs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffs();
  }, []);

  const handleRemoveStaff = async (staffId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name || 'this staff member'}?`)) {
      return;
    }
    try {
      await authApi.deleteStaff(staffId);
      loadStaffs();
    } catch (err) {
      console.error('Failed to remove staff:', err);
      alert('Failed to remove staff member');
    }
  };

  // Filter staff by search query
  const filteredStaffs = staffs.filter((st) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const nameMatch = (st.first_name || '').toLowerCase().includes(q) || (st.last_name || '').toLowerCase().includes(q);
    const usernameMatch = (st.username || '').toLowerCase().includes(q);
    const emailMatch = (st.email || '').toLowerCase().includes(q);
    const phoneMatch = (st.phone || '').includes(q);
    const roleMatch = (st.role || '').toLowerCase().includes(q) || (st.custom_role_data?.name || '').toLowerCase().includes(q);
    return nameMatch || usernameMatch || emailMatch || phoneMatch || roleMatch;
  });

  // Format joined date (e.g. "19 Aug 2026")
  const formatJoinedDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  // Get 2-letter Initials
  const getInitials = (st) => {
    if (st.first_name && st.last_name) {
      return `${st.first_name[0]}${st.last_name[0]}`.toUpperCase();
    }
    if (st.first_name && st.first_name.length >= 2) {
      return st.first_name.slice(0, 2).toUpperCase();
    }
    if (st.username && st.username.length >= 2) {
      return st.username.slice(0, 2).toUpperCase();
    }
    return (st.username?.[0] || 'ST').toUpperCase();
  };

  // Format Role Title directly from database
  const getRoleTitle = (st) => {
    if (st.custom_role_data?.name) return st.custom_role_data.name;
    const role = (st.role || '').toLowerCase();
    if (role === 'admin') return 'Admin';
    if (role === 'kitchen') return 'Chef';
    if (role === 'manager') return 'Manager';
    if (role === 'cashier') return 'Cashier';
    if (role === 'staff') return 'Staff';
    return st.role || 'Staff';
  };

  return (
    <div className="admin-staff-page-root">
      {/* ═══════════════════════════════════════════════════════════════
          TOP HEADER ROW: Search Pill + Bell + Avatar
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-menu-top-header">
        <div className="admin-search-pill" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search......"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="admin-search-icon-btn" title="Search">
            <Search size={20} color="#FFFFFF" strokeWidth={2.5} />
          </button>
        </div>

        {/* Notification Bell */}
        <div className="admin-bell-circle" title="Notifications">
          <img src="/Bell.svg" alt="Notifications" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
        </div>

        {/* Admin Profile Avatar */}
        <div
          className="admin-profile-circle-btn"
          onClick={openProfile}
          title="Admin Profile"
        >
          <UserAvatarPlaceholder user={user} size={46} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN STAFF OVERVIEW CARD (Exact Reference Style Match)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-staff-overview-card">
        <div className="admin-staff-header">
          <div>
            <h2 className="admin-staff-title">Staff Management</h2>
            <p className="admin-staff-desc">
              Manage your team, roles, and daily activity
            </p>
          </div>
          {filteredStaffs.length > 0 && (
            <button
              type="button"
              className="admin-staff-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Staff
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#78716C' }}>
            <p>Loading staff members...</p>
          </div>
        ) : filteredStaffs.length === 0 ? (
          /* Empty State Matching Screenshot */
          <div className="admin-staff-empty-state">
            <div className="admin-staff-empty-icon-wrap">
              <img 
                src="/staff.svg" 
                alt="Staff" 
                style={{ width: '22px', height: '22px', objectFit: 'contain' }} 
              />
            </div>
            <h3 className="admin-staff-empty-title">No staff members</h3>
            <p className="admin-staff-empty-desc">
              Begin building your team by adding your first staff member.
            </p>
            <button
              type="button"
              className="admin-staff-empty-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              + Add Staff
            </button>
          </div>
        ) : (
          <div className="admin-staff-table-wrapper">
            <table className="admin-staff-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>USERNAME</th>
                  <th>ROLE TITLE</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>JOINED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffs.map((st, idx) => {
                  const initials = getInitials(st);
                  const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const displayName = st.first_name 
                    ? `${st.first_name} ${st.last_name || ''}`.trim() 
                    : st.username;
                  const roleTitle = getRoleTitle(st);
                  const email = st.email || '—';
                  const phone = st.phone || '—';
                  const joinedDate = formatJoinedDate(st.date_joined);

                  return (
                    <tr key={st.id}>
                      {/* Name with initials avatar */}
                      <td>
                        <div className="admin-staff-name-cell">
                          <div
                            className="admin-staff-avatar"
                            style={{ backgroundColor: avatarBg }}
                          >
                            {initials}
                          </div>
                          <span className="admin-staff-name-text">
                            {displayName}
                          </span>
                        </div>
                      </td>

                      {/* Username */}
                      <td>
                        <span className="admin-staff-username-text">
                          {st.username}
                        </span>
                      </td>

                      {/* Role Title */}
                      <td>
                        <span className="admin-staff-role-badge">
                          {roleTitle}
                        </span>
                      </td>

                      {/* Email */}
                      <td>
                        <span className="admin-staff-secondary-text">
                          {email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        <span className="admin-staff-secondary-text">
                          {phone}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td>
                        <span className="admin-staff-secondary-text">
                          {joinedDate}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="admin-staff-actions">
                          <button
                            type="button"
                            className="admin-staff-action-btn edit"
                            onClick={() => setEditingStaff(st)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-staff-action-btn remove"
                            onClick={() => handleRemoveStaff(st.id, displayName)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onStaffCreated={() => {
            setShowAddModal(false);
            loadStaffs();
          }}
        />
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <EditStaffModal
          isOpen={!!editingStaff}
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onStaffUpdated={() => {
            setEditingStaff(null);
            loadStaffs();
          }}
        />
      )}
    </div>
  );
};

export default AdminStaffsPage;
