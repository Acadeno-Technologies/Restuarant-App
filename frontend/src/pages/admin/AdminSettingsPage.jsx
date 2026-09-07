import React, { useState, useEffect, useRef } from 'react';
import { Search, Upload, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/authApi';
import { UserAvatarPlaceholder } from '../../components/common/UserAvatarPlaceholder';
import { AdminProfileModal } from '../../components/admin/AdminProfileModal';

export const AdminSettingsPage = () => {
  const { user, openProfile } = useAuth();

  // Active Tab: 'profile' | 'bill'
  const [activeTab, setActiveTab] = useState('profile');

  // Search State for header
  const [searchQuery, setSearchQuery] = useState('');

  // Admin Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Settings State matching database & reference fields
  const [formData, setFormData] = useState({
    // Profile settings
    name: 'T CLOCK RESTO CAFE',
    gstin: '32ABCDE1234F1Z5',
    tagline: 'Time for Tea, Time for Taste',
    phone: '+91 98765 43210',
    address: 'Main Road, Calicut, Kerala',
    footer: 'Thank you for visiting T Clock Resto Cafe! 🌴',
    logo: null,

    // Bill tab settings
    currencySymbol: '₹',
    invoicePrefix: 'TC-',
    taxRate: 5,
    serviceCharge: 0,
    packingCharge: 0,
    footerGreeting: 'Thank you for dining with us! Please visit again.',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [fetchError, setFetchError] = useState('');

  const fileInputRef = useRef(null);

  // Load existing settings dynamically from Django Backend API
  const fetchSettings = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await authApi.getSettings();
      if (data) {
        setFormData({
          name: data.name ?? '',
          gstin: data.gstin ?? '',
          tagline: data.tagline ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          footer: data.footer ?? '',
          currencySymbol: data.currency_symbol ?? '₹',
          invoicePrefix: data.invoice_prefix ?? 'TC-',
          taxRate: data.tax_rate != null ? Number(data.tax_rate) : 0,
          serviceCharge: data.service_charge != null ? Number(data.service_charge) : 0,
          packingCharge: data.packing_charge != null ? Number(data.packing_charge) : 0,
          footerGreeting: data.footer_greeting || data.footer || '',
          logo: null,
        });
        if (data.logo) {
          setLogoPreview(data.logo);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings from backend:', err);
      setFetchError('Failed to load settings from the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg({ type: 'error', text: 'File size must be under 5MB.' });
      return;
    }

    setFormData((prev) => ({ ...prev, logo: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const payload = {
        name: formData.name,
        gstin: formData.gstin,
        tagline: formData.tagline,
        phone: formData.phone,
        address: formData.address,
        footer: formData.footer || formData.footerGreeting,
        currency_symbol: formData.currencySymbol,
        invoice_prefix: formData.invoicePrefix,
        tax_rate: formData.taxRate,
        service_charge: formData.serviceCharge,
        packing_charge: formData.packingCharge,
        footer_greeting: formData.footerGreeting,
      };

      const res = await authApi.updateSettings(payload);
      if (res) {
        setFormData((prev) => ({
          ...prev,
          name: res.name ?? prev.name,
          gstin: res.gstin ?? prev.gstin,
          tagline: res.tagline ?? prev.tagline,
          phone: res.phone ?? prev.phone,
          address: res.address ?? prev.address,
          footer: res.footer ?? prev.footer,
          currencySymbol: res.currency_symbol ?? prev.currencySymbol,
          invoicePrefix: res.invoice_prefix ?? prev.invoicePrefix,
          taxRate: res.tax_rate != null ? Number(res.tax_rate) : prev.taxRate,
          serviceCharge: res.service_charge != null ? Number(res.service_charge) : prev.serviceCharge,
          packingCharge: res.packing_charge != null ? Number(res.packing_charge) : prev.packingCharge,
          footerGreeting: res.footer_greeting ?? prev.footerGreeting,
        }));
      }
      
      const successText = activeTab === 'bill' 
        ? 'Bill settings updated successfully.' 
        : 'Profile settings updated successfully.';
      setStatusMsg({ type: 'success', text: successText });
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      const errDetail = err?.response?.data?.error || err?.response?.data?.detail || 'Failed to save settings. Please try again.';
      setStatusMsg({ type: 'error', text: errDetail });
    } finally {
      setSaving(false);
    }
  };

  // Calculations for Receipt Preview
  const subtotal = 800.0;
  const taxAmount = (subtotal * (parseFloat(formData.taxRate) || 0)) / 100;
  const serviceChargeAmount = (subtotal * (parseFloat(formData.serviceCharge) || 0)) / 100;
  const packingChargeAmount = (subtotal * (parseFloat(formData.packingCharge) || 0)) / 100;
  const grandTotal = subtotal + taxAmount + serviceChargeAmount + packingChargeAmount;

  return (
    <div className="admin-settings-page-root">
      {/* ═══════════════════════════════════════════════════════════════
          TOP HEADER ROW: Search Pill + Bell + Avatar
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-menu-top-header">
        <div className="admin-search-pill" style={{ flex: 1 }}>
          <input
            type="text"
            placeholder="Search......"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          onClick={openProfile || (() => setIsProfileModalOpen(true))}
          title="Admin Profile"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <UserAvatarPlaceholder user={user} size={46} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN WHITE CONTENT CONTAINER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="admin-settings-main-card">
        {/* Title & Subtitle */}
        <div className="admin-settings-header-box">
          <h1 className="admin-settings-title">Manage Settings</h1>
          <p className="admin-settings-subtitle">Configure your restaurant and system settings.</p>
        </div>

        {/* Status Alerts */}
        {statusMsg.text && (
          <div className={`admin-settings-alert ${statusMsg.type}`}>
            {statusMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Fetch Error Alert with Retry */}
        {fetchError && (
          <div className="admin-settings-alert error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{fetchError}</span>
            </div>
            <button
              type="button"
              onClick={fetchSettings}
              style={{ background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 4px', color: '#78716C', fontSize: '13.5px' }}>
            <div style={{ width: '18px', height: '18px', border: '2.5px solid #E5DFD5', borderTopColor: '#230704', borderRadius: '50%', animation: 'adminSpin 0.75s linear infinite' }} />
            <span>Loading bill settings from server...</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-settings-tabs-row">
          <button
            type="button"
            className={`admin-settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Settings
          </button>
          <button
            type="button"
            className={`admin-settings-tab-btn ${activeTab === 'bill' ? 'active' : ''}`}
            onClick={() => setActiveTab('bill')}
          >
            Bill Settings
          </button>
        </div>

        {/* Settings Inner Content Row */}
        <div className="admin-settings-split-layout">
          {/* Settings Inner Form Card */}
          <div className="admin-settings-form-wrapper" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
            <form onSubmit={handleSave} className="admin-settings-form">
              {activeTab === 'profile' ? (
                <>
                  {/* Row 1: Restaurant Name & GSTIN */}
                  <div className="admin-settings-grid-2">
                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Restaurant Name</label>
                      <input
                        type="text"
                        className="admin-settings-input"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="e.g. T CLOCK RESTO CAFE"
                        required
                      />
                    </div>

                    <div className="admin-settings-field">
                      <label className="admin-settings-label">GSTIN Number</label>
                      <input
                        type="text"
                        className="admin-settings-input"
                        value={formData.gstin}
                        onChange={(e) => handleChange('gstin', e.target.value)}
                        placeholder="e.g. 32ABCDE1234F1Z5"
                      />
                    </div>
                  </div>

                  {/* Row 2: Tagline / Subtitle & Contact Number */}
                  <div className="admin-settings-grid-2">
                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Tagline / Subtitle</label>
                      <input
                        type="text"
                        className="admin-settings-input"
                        value={formData.tagline}
                        onChange={(e) => handleChange('tagline', e.target.value)}
                        placeholder="e.g. Time for Tea, Time for Taste"
                      />
                    </div>

                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Contact Number</label>
                      <input
                        type="text"
                        className="admin-settings-input"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                  </div>

                  {/* Row 3: Address / Location (Full Width) */}
                  <div className="admin-settings-field">
                    <label className="admin-settings-label">Address / Location</label>
                    <input
                      type="text"
                      className="admin-settings-input"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="e.g. Main Road, Calicut, Kerala"
                    />
                  </div>

                  {/* Row 4: Logo Upload Container */}
                  <div className="admin-settings-field">
                    <label className="admin-settings-label">Logo Image (Upload File from System)</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                    <div
                      className="admin-settings-upload-box"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="admin-settings-upload-icon-circle">
                        <Upload size={16} color="#4A443F" strokeWidth={2} />
                      </div>
                      <div className="admin-settings-upload-text">
                        <span className="admin-settings-upload-title">
                          {formData.logo ? (formData.logo.name || 'Logo selected') : 'Upload Photo'}
                        </span>
                        <span className="admin-settings-upload-sub">Max: 5MB</span>
                      </div>
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="admin-settings-logo-preview"
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Bill Settings Tab Content (Exact Reference Replica) */}
                  {/* Row 1: Invoice Number Prefix & Service Charge (%) */}
                  <div className="admin-settings-grid-2">
                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Invoice Number Prefix</label>
                      <input
                        type="text"
                        className="admin-settings-input"
                        value={formData.invoicePrefix}
                        onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                        placeholder="TC-"
                      />
                    </div>

                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Service Charge (%)</label>
                      <input
                        type="number"
                        className="admin-settings-input"
                        value={formData.serviceCharge}
                        onChange={(e) => handleChange('serviceCharge', e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Row 2: GST / Tax Rate (%) & Packing Charge (%) */}
                  <div className="admin-settings-grid-2">
                    <div className="admin-settings-field">
                      <label className="admin-settings-label">GST / Tax Rate (%)</label>
                      <input
                        type="number"
                        className="admin-settings-input"
                        value={formData.taxRate}
                        onChange={(e) => handleChange('taxRate', e.target.value)}
                        placeholder="5"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                      />
                    </div>

                    <div className="admin-settings-field">
                      <label className="admin-settings-label">Packing Charge (%)</label>
                      <input
                        type="number"
                        className="admin-settings-input"
                        value={formData.packingCharge}
                        onChange={(e) => handleChange('packingCharge', e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  {/* Row 3: Thermal Receipt Footer Greeting */}
                  <div className="admin-settings-field">
                    <label className="admin-settings-label">Thermal Receipt Footer Greeting</label>
                    <textarea
                      className="admin-settings-textarea"
                      value={formData.footerGreeting}
                      onChange={(e) => handleChange('footerGreeting', e.target.value)}
                      placeholder="Thank you for dining with us! Please visit again."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* Save Button */}
              <button
                type="submit"
                className="admin-settings-save-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>

          {/* Live Thermal Receipt Preview Card (Shown in Bill Settings) */}
          {activeTab === 'bill' && (
            <div className="admin-receipt-preview-card">
              {/* Receipt Header */}
              <div className="admin-receipt-header">
                <h3 className="admin-receipt-title">{formData.name || 'T CLOCK RESTO CAFE'}</h3>
                <p className="admin-receipt-tagline">{formData.tagline || 'Time for Tea, Time for Taste'}</p>
                <p className="admin-receipt-subtext">{formData.address || 'Main Road, Calicut, Kerala'}</p>
                <p className="admin-receipt-subtext">
                  Ph: {formData.phone || '+91 98765 43210'} · GSTIN:
                </p>
                <p className="admin-receipt-subtext">{formData.gstin || '32ABCDE1234F1Z5'}</p>
              </div>

              <div className="admin-receipt-divider" />

              {/* Meta Table */}
              <div className="admin-receipt-meta-row">
                <span>Date</span>
                <span>19/08/2026</span>
              </div>
              <div className="admin-receipt-meta-row">
                <span>Type / Table</span>
                <span>Table 3</span>
              </div>
              <div className="admin-receipt-meta-row">
                <span>Order #</span>
                <span>{formData.invoicePrefix ? `${formData.invoicePrefix}16` : '16'}</span>
              </div>

              <div className="admin-receipt-divider" />

              {/* Items */}
              <div className="admin-receipt-items">
                <div className="admin-receipt-item-row">
                  <span>2× Chocolate Milkshake</span>
                </div>
              </div>

              <div className="admin-receipt-divider" />

              {/* Summary Calculations */}
              <div className="admin-receipt-summary">
                <div className="admin-receipt-summary-row">
                  <span>Subtotal</span>
                  <span>{formData.currencySymbol || '₹'}{subtotal.toFixed(2)}</span>
                </div>
                <div className="admin-receipt-summary-row">
                  <span>GST ({formData.taxRate || 0}%)</span>
                  <span>{formData.currencySymbol || '₹'}{taxAmount.toFixed(2)}</span>
                </div>
                {parseFloat(formData.serviceCharge) > 0 && (
                  <div className="admin-receipt-summary-row">
                    <span>Service Charge ({formData.serviceCharge}%)</span>
                    <span>{formData.currencySymbol || '₹'}{serviceChargeAmount.toFixed(2)}</span>
                  </div>
                )}
                {parseFloat(formData.packingCharge) > 0 && (
                  <div className="admin-receipt-summary-row">
                    <span>Packing Charge ({formData.packingCharge}%)</span>
                    <span>{formData.currencySymbol || '₹'}{packingChargeAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="admin-receipt-total-row">
                <span>TOTAL</span>
                <span>{formData.currencySymbol || '₹'}{grandTotal.toFixed(2)}</span>
              </div>

              {/* Footer Greeting */}
              <div className="admin-receipt-footer">
                {formData.footerGreeting || 'Thank you for visiting T Clock Resto Cafe! 🌴'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Profile Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default AdminSettingsPage;
