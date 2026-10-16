import { hopscotchProject } from '../../projects';

const sampleFolders = {
  'Shared Documents': {
    name: 'Shared Documents',
    parent: 'My Computer',
    items: [
      {
        name: 'Projects',
        type: 'folder',
        location: 'Shared Documents/Projects',
      },
      {
        name: 'Sample Folder',
        type: 'folder',
        location: 'Shared Documents/Sample Folder',
      },
      {
        name: 'Readme.txt',
        type: 'text',
        content:
          'Welcome to Shared Documents!\n\nThese are sample files for exploring this Windows XP desktop.\n\nDouble-click a text file to open it in Notepad. Open Sample Folder to try the nested folder navigation.\n',
      },
      {
        name: 'Notes.txt',
        type: 'text',
        content:
          'Sample notes\n============\n\nThis is a dummy text document.\n\nA few things to remember:\n- Keep an idea notebook.\n- Take a break and stretch.\n- Save something worth coming back to.\n',
      },
      {
        name: 'Todo.txt',
        type: 'text',
        content:
          'Things to do\n============\n\n[ ] Explore the desktop\n[ ] Open a folder\n[ ] Read a text file\n[ ] Play a round of Minesweeper\n\nThis is a sample checklist.\n',
      },
    ],
  },
  'Shared Documents/Projects': {
    name: 'Projects',
    parent: 'Shared Documents',
    items: [hopscotchProject],
  },
  'Shared Documents/Sample Folder': {
    name: 'Sample Folder',
    parent: 'Shared Documents',
    items: [
      {
        name: 'Example.txt',
        type: 'text',
        content:
          'You found the nested folder!\n\nThis is another dummy text file.\n\nUse the Up button to return to Shared Documents, or Back and Forward to retrace your steps.\n',
      },
      {
        name: 'More Notes.txt',
        type: 'text',
        content:
          'More sample notes\n=================\n\nFolders help keep related documents together.\n\nThis file is just here to make the sample folder feel a little more lived in.\n',
      },
    ],
  },
};

export default sampleFolders;
