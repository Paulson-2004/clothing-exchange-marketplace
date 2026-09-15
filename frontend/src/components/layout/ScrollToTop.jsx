// Forces the browser to scroll to the top of the page on route changes.
// WHY: React Router is a single-page application router, so by default it does
// not scroll up when you click a link to a new "page", which feels unnatural.
import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return null;
}
