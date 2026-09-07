import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';

/**
 * UserAvatarPlaceholder
 *
 * Clean circular white button matching admin theme with centered user outline icon
 * or user's custom avatar picture.
 */
export const UserAvatarPlaceholder = ({ user = null, size = 44, className = '', style = {} }) => {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = resolveImageUrl(user?.avatar);

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`user-avatar-placeholder ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          background: '#FFFFFF',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        <img
          src={avatarUrl}
          alt={user?.username || 'Admin'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`user-avatar-placeholder ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        cursor: 'pointer',
        ...style,
      }}
    >
      <svg
        width={Math.round(size * 0.52)}
        height={Math.round(size * 0.52)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6B7280"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
};

export default UserAvatarPlaceholder;
