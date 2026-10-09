import { useEffect } from 'react';
import { authService, triggerAuthLogout } from '../services/auth';

export function useIdleLogout(minutes = 30) {
  useEffect(() => {
    if (!authService.isAuthenticated()) return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        authService.clear();
        triggerAuthLogout();
      }, minutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [minutes]);
}