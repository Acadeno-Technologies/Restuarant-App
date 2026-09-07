import React, { useState } from 'react';
import { resolveImageUrl } from '../../utils/imageUrl';

/**
 * UserAvatarPlaceholder
 *
 * Clean circular white button matching admin theme with centered user outline icon
 * or user's custom avatar picture.
 */
export const UserAvatarPlaceholder = ({ user = null, size = 46, className = '', style = {} }) => {
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
          maxWidth: size,
          maxHeight: size,
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.03)',
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
        maxWidth: size,
        maxHeight: size,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(0, 0, 0, 0.03)',
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
      <img
        src="/profile.svg"
        alt="Profile"
        style={{
          width: `${Math.round(size * 0.50)}px`,
          height: `${Math.round(size * 0.50)}px`,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
};

export default UserAvatarPlaceholder;
