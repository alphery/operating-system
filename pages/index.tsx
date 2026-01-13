import { useEffect } from 'react';
import Ubuntu from "../components/ubuntu";
import ReactGA from 'react-ga';
import Meta from "../components/SEO/Meta";

function App() {
  useEffect(() => {
    // Initialize Google Analytics only on client-side
    const TRACKING_ID = process.env.NEXT_PUBLIC_TRACKING_ID;
    if (typeof window !== 'undefined') {
      try {
        // Initialize with tracking ID or a dummy ID to prevent errors
        ReactGA.initialize(TRACKING_ID || 'UA-000000000-0', {
          testMode: !TRACKING_ID, // Test mode if no tracking ID
          gaOptions: {
            siteSpeedSampleRate: 100
          }
        });
        if (TRACKING_ID) {
          ReactGA.pageview(window.location.pathname + window.location.search);
        }
      } catch (error) {
        // Silently ignore GA errors
        console.log('Analytics not loaded');
      }
    }
  }, []);

  return (
    <>
      <Meta />
      <Ubuntu />
    </>
  )
}

export default App;
