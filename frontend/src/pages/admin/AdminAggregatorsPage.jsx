import React from 'react';


export const AdminAggregatorsPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <div className="admin-portal-card admin-top-card">
        <div className="admin-top-header">
          <div className="admin-top-greeting">
            <h1>Swiggy & Zomato Aggregator Portal</h1>
            <p>Monitor third-party delivery orders and online restaurant integration.</p>
          </div>
        </div>
      </div>

      <div className="admin-portal-card admin-overview-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
          {/* Swiggy Card */}
          <div style={{ border: '1px solid #EAE1D8', borderRadius: '18px', padding: '1.5rem', background: '#FFF8F4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#FC8019', fontSize: '1.25rem' }}>Swiggy Integration</h3>
              <span style={{ padding: '4px 10px', background: '#DCFCE7', color: '#16A34A', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                ● Connected
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#756B66', margin: '0.75rem 0 1.5rem 0' }}>
              Live outlet sync active. Orders are automatically routed to the kitchen.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Today's Swiggy Orders:</span>
              <span style={{ fontWeight: 800 }}>14 orders (₹ 3,420)</span>
            </div>
          </div>

          {/* Zomato Card */}
          <div style={{ border: '1px solid #EAE1D8', borderRadius: '18px', padding: '1.5rem', background: '#FFF5F5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#CB202D', fontSize: '1.25rem' }}>Zomato Integration</h3>
              <span style={{ padding: '4px 10px', background: '#DCFCE7', color: '#16A34A', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                ● Connected
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#756B66', margin: '0.75rem 0 1.5rem 0' }}>
              Live outlet sync active. Menu items pricing synchronized.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
              <span>Today's Zomato Orders:</span>
              <span style={{ fontWeight: 800 }}>19 orders (₹ 4,890)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAggregatorsPage;
