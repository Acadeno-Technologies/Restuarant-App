import { useEffect } from 'react';

// Keep track of how many modals are currently requesting scroll lock
let lockCount = 0;
let originalBodyOverflow = '';
let originalHtmlOverflow = '';
let originalBodyTouchAction = '';

/**
 * useLockBodyScroll
 *
 * Prevents background page scrolling when a modal, drawer, or popup is open.
 * Supports multiple nested modals cleanly via a reference counter.
 */
export const useLockBodyScroll = (isLocked = true) => {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalBodyOverflow = document.body.style.overflow;
      originalHtmlOverflow = document.documentElement.style.overflow;
      originalBodyTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.touchAction = originalBodyTouchAction;
      }
    };
  }, [isLocked]);
};

export default useLockBodyScroll;
