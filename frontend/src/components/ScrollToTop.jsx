import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 *
 * Ensures the browser window scrolls directly to the top (0, 0)
 * whenever the route pathname changes.
 *
 * Disables browser automatic scroll restoration and performs
 * multi-frame scroll resets to prevent late layout/content rendering
 * (such as images or async data loading) from preserving or restoring
 * a previous scroll offset.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Disable browser's automatic history scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Also enforce manual scroll restoration on route changes
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    };

    // 1. Immediate synchronous scroll reset
    scrollToTop();

    // 2. Next animation frame (after initial React commit & paint)
    const rafId1 = requestAnimationFrame(() => {
      scrollToTop();
      // 3. Second animation frame for double-buffered layout cycles
      requestAnimationFrame(() => {
        scrollToTop();
      });
    });

    // 4. Short post-render fallbacks to lock scroll at top when
    // async product details or images finish populating
    const timer50 = setTimeout(scrollToTop, 50);
    const timer150 = setTimeout(scrollToTop, 150);

    return () => {
      cancelAnimationFrame(rafId1);
      clearTimeout(timer50);
      clearTimeout(timer150);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
