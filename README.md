# Windows XP desktop

A direct fork of [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP), based on commit `856bb554b3667f62078010b4cee10cc2645761e1`.

The original Windows XP interface, images, Minesweeper, Internet Explorer, My Computer, Notepad, and JS Paint are preserved. The original author’s profile links, website link, star widget, and promotional content have been removed from the interface. Winamp has also been removed from startup, the desktop, and the Start menu.

## Development

Use Yarn Classic 1.22.22 with the included lockfile.

```sh
yarn install --frozen-lockfile
yarn start
```

`yarn build` produces `build/`.

## License and credits

The upstream MIT license and copyright notice are retained in `LICENSE`.
Windows XP names, artwork, and trademarks belong to Microsoft. This recreation is not affiliated with Microsoft.

Paint is [JS Paint](https://github.com/1j01/jspaint). Its original interface and capabilities are retained.

## Portfolio interactions

Internet Explorer omits the smiley profile avatar and Taiwan footer label on both the home and search views. In My Computer, double-click Shared Documents (or use its sidebar link) to open a native XP folder window. The folder is currently empty. Other documents, drives, and unsupported actions display XP error dialogs.
