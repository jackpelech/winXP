import hopscotchIcon from 'assets/projects/hopscotch-xp-48.png';
import hopscotchDesktopIcon from 'assets/projects/hopscotch-xp-32.png';
import hopscotchPanel from 'assets/projects/hopscotch-panel.png';
import framesIcon from 'assets/projects/frames.png';
import framesPanel from 'assets/projects/frames-panel.png';

export const hopscotchProject = {
  name: 'Hopscotch',
  type: 'application',
  icon: hopscotchIcon,
  desktopIcon: hopscotchDesktopIcon,
  imageRendering: 'pixelated',
  panelImage: hopscotchPanel,
  showPanelIcon: true,
};

export const framesProject = {
  name: 'Frames',
  type: 'application',
  icon: framesIcon,
  desktopIcon: framesIcon,
  panelImage: framesPanel,
  description:
    'Frames is an open-source window manager for macOS. Arrange your apps in nested layouts, group windows into tabs, and zoom from a single task to the full workspace.\n\nSave your favorite views, switch with keyboard shortcuts, and keep everything running locally on your Mac.',
  actions: [
    { label: 'View on GitHub' },
    {
      label: 'Learn More About Frames',
      browserPath: '/frames/',
      title: 'Frames',
    },
  ],
};
