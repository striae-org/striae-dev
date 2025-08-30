import { useEffect, useState } from 'react';
import keys from './keys.json';

declare global {
  interface Window {

  turnstile: {
    render: (selector: string | HTMLElement, options: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'compact' | 'flexible';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
  };
}
}

type TurnstileTheme = 'light' | 'dark' | 'auto';

interface TurnstileProps extends React.HTMLAttributes<HTMLDivElement> {  
  className?: string;
  onWidgetId?: (id: string) => void;
  success?: boolean;
  theme?: TurnstileTheme;
}

export const Turnstile = ({ className, onWidgetId, success, theme, ...rest }: TurnstileProps) => {
  const [widgetId, setWidgetId] = useState<string>();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.defer = true;
    script.async = true;
    script.onload = () => {
      const id = window.turnstile.render('#cf-turnstile', {
        sitekey: `${keys.CFT_PUBLIC_KEY}`,
        theme: theme
      });
       setWidgetId(id);
      if (onWidgetId) onWidgetId(id);
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [onWidgetId, theme]);

  useEffect(() => {
    if (success && widgetId && window.turnstile) {
      window.turnstile.reset(widgetId);
    }
  }, [success, widgetId]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); 
  
  return (
    <div
    id="cf-turnstile"
     className={className}
     data-size={isMobile ? "compact" : "normal"}     
      {...rest}      
    />
  );
};