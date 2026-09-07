import React, { useState, useEffect } from 'react';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AddStaffModal } from '../../components/admin/AddStaffModal';
import { EditStaffModal } from '../../components/admin/EditStaffModal';
import { AdminDeleteModal } from '../../components/admin/AdminDeleteModal';
import '../../styles/admin.css';

// Palette of background colors for initials avatar matching reference design
const AVATAR_COLORS = [
  '#355C7D', // Slate Navy Blue (SM)
  '#A8553A', // Terracotta Rust (AS)
  '#8D623C', // Warm Olive/Bronze (AB)
  '#5C4D6B', // Muted Plum Purple (AN)
  '#BF6B30', // Ochre / Bronze Amber (AR)
  '#3B729E', // Teal / Slate Blue (MN)
  '#C05844', // Brick Red (MD)
  '#785888', // Violet Purple (SJ)
];

export const AdminStaffsPage = () => {
  const { user, openProfile } = useAuth();

  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deletingStaff, setDeletingStaff] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmRemoveStaff = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    try {
      await authApi.deleteStaff(deletingStaff.id);
      setDeletingStaff(null);
      loadStaffs();
    } catch (err) {
      console.error('Failed to remove staff:', err);
      alert('Failed to remove staff member');
    } finally {
      setIsDeleting(false);
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
    const name = (st.first_name || st.username || 'ST').trim();
    if (name.length >= 2) {
      return name.slice(0, 2).toUpperCase();
    }
    return (name[0] || 'S').toUpperCase();
  };

  // Format Role Title directly from database
  const getRoleTitle = (st) => {
    if (st.custom_role_data?.name) return st.custom_role_data.name;
    const role = (st.role || '').toLowerCase();
    if (role === 'admin') return 'Admin';
    if (role === 'kitchen') return 'Chef';
    if (role === 'manager') return 'Manager';
    if (role === 'cashier') return 'Cashier';
    if (role === 'staff_1' || role === 'staff1') return 'Staff 1';
    if (role === 'staff_2' || role === 'staff2') return 'Staff 2';
    if (role === 'staff') return 'Staff 1';
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
                  <th>ACTION</th>
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
                            onClick={() => setDeletingStaff({ id: st.id, name: displayName })}
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

      {/* Delete Staff Confirmation Modal */}
      <AdminDeleteModal
        isOpen={!!deletingStaff}
        onClose={() => !isDeleting && setDeletingStaff(null)}
        onConfirm={handleConfirmRemoveStaff}
        title="Remove Staff Member"
        description={
          <>
            Are you sure you want to remove <strong>{deletingStaff?.name || 'this staff member'}</strong>?<br />
            This will immediately revoke their access to the system.
          </>
        }
        confirmText="Remove Staff"
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminStaffsPage;
