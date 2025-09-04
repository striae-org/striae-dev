export const INACTIVITY_CONFIG = {
  TIMEOUT_MINUTES: 10,  
  WARNING_MINUTES: 1, 
  TRACKED_ACTIVITIES: [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ] as const
};