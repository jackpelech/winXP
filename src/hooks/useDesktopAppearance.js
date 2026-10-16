import { useLayoutEffect } from 'react';

export default function useDesktopAppearance(appCoversDesktop) {
  useLayoutEffect(() => {
    const page = document.documentElement;
    let theme = document.querySelector('meta[name="theme-color"]');
    page.dataset.desktopSurface = appCoversDesktop ? 'app' : 'wallpaper';
    if (appCoversDesktop) {
      if (!theme) {
        theme = document.createElement('meta');
        theme.name = 'theme-color';
        document.head.appendChild(theme);
      }
      theme.content = '#245edc';
    } else if (theme) {
      theme.remove();
    }
    return () => {
      delete page.dataset.desktopSurface;
      if (theme) theme.remove();
    };
  }, [appCoversDesktop]);
}
