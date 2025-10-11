import { useEffect } from "react";

export default function usePullToRefresh(targetRef: React.RefObject<HTMLElement>, onRefresh: () => void, opts?: { threshold?: number }) {
  useEffect(() => {
    const el = targetRef.current ?? document.documentElement;
    if (!el) return;
    let startY = 0;
    let pulling = false;
    const threshold = opts?.threshold ?? 70;

    const onTouchStart = (e: TouchEvent) => {
      if ((window.scrollY || el.scrollTop) > 0) return;
      startY = e.touches[0].clientY;
      pulling = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pulling) return;
      const delta = e.touches[0].clientY - startY;
      if (delta > threshold) {
        pulling = false;
        onRefresh();
      }
    };
    const onTouchEnd = () => {
      pulling = false;
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart as any);
      window.removeEventListener('touchmove', onTouchMove as any);
      window.removeEventListener('touchend', onTouchEnd as any);
    };
  }, [targetRef, onRefresh, opts?.threshold]);
}


