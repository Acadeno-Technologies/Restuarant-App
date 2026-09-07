import React from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';

/**
 * MenuItemCard
 *
 * Props:
 *  - item            {object}   Menu item data from the API
 *  - currentPortion  {string}   Currently selected portion ('Full' | 'Half' | 'Quarter')
 *  - cartItem        {object|undefined}  Matching cart entry (if any)
 *  - onPortionSelect {fn}       (itemId, portion) => void
 *  - onAdd           {fn}       (item, portion) => void
 *  - onUpdateQty     {fn}       (itemId, portion, delta) => void
 *
 * Layout logic:
 *  - Single-price  → no variant pills shown
 *  - Multi-price   → Full / Half / Quarter pills shown above the Add button
 */
const MenuItemCard = ({
  item,
  currentPortion,
  cartItem,
  onPortionSelect,
  onAdd,
  onUpdateQty,
}) => {
  /* ─── Derived values ──────────────────────────────────────────────────── */
  const isMultiPrice = Boolean(item.half_price || item.quarter_price);

  const displayPrice = (() => {
    if (isMultiPrice) {
      if (currentPortion === 'Half' && item.half_price)
        return parseFloat(item.half_price).toFixed(2);
      if (currentPortion === 'Quarter' && item.quarter_price)
        return parseFloat(item.quarter_price).toFixed(2);
    }
    return parseFloat(item.price).toFixed(2);
  })();

  const FALLBACK_IMG =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80';

  /* ─── Variant pills (only for multi-price items) ──────────────────────── */
  const variantPills = isMultiPrice
    ? ['Full', 'Half', 'Quarter'].filter((p) => {
        if (p === 'Half') return Boolean(item.half_price);
        if (p === 'Quarter') return Boolean(item.quarter_price);
        return true; // Full always shown if multi-price
      })
    : [];

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div
      className="mic-card"
      style={{ opacity: item.is_available ? 1 : 0.65 }}
    >
      {/* ── Image ── */}
      <div style={{ position: 'relative' }}>
        <img
          src={item.image || FALLBACK_IMG}
          alt={item.name}
          className="mic-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_IMG;
          }}
        />
        {!item.is_available && (
          <span className="mic-oos-badge">Out of Stock</span>
        )}
      </div>

      {/* ── Info block ── */}
      <div className="mic-info">
        <h4 className="mic-name" title={item.name}>
          {item.name}
        </h4>
        <div className="mic-price">&#8377;{displayPrice}</div>

        {/* ── Variant pills (multi-price only) ── */}
        {isMultiPrice && (
          <div className="mic-pill-group">
            {variantPills.map((p) => (
              <button
                key={p}
                className={`mic-pill${currentPortion === p ? ' mic-pill--active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPortionSelect(item.id, p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Quantity control ── */}
      <div className="mic-footer">
        {cartItem ? (
          /* Quantity selector */
          <div className="mic-qty-bar">
            <button
              className="mic-qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(item.id, currentPortion, -1);
              }}
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <span className="mic-qty-num">{cartItem.quantity}</span>
            <button
              className="mic-qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateQty(item.id, currentPortion, 1);
              }}
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          /* Add button */
          <button
            className="mic-add-btn"
            disabled={!item.is_available}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item, currentPortion);
            }}
          >
            {item.is_available ? (
              <>
                <ShoppingCart size={15} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                <span>Add</span>
              </>
            ) : (
              <span>Out of Stock</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;
