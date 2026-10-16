const demo = document.querySelector('.workspace-demo');
const layoutButtons = [...document.querySelectorAll('[data-layout-button]')];
const panes = [...document.querySelectorAll('[data-window]')];
const tabs = [...document.querySelectorAll('[data-tab]')];
const tabList = document.querySelector('.demo-tabs');
const restore = document.querySelector('.restore-view');
const status = document.querySelector('#demo-status-text');
let layout = 'three';
let activeTab = 'notes';
let focusedWindow = null;

function renderWorkspace() {
  demo.dataset.layout = layout;
  if (focusedWindow) demo.dataset.focus = focusedWindow;
  else delete demo.dataset.focus;
  tabList.hidden = layout !== 'tabs';
  restore.hidden = !focusedWindow;
  layoutButtons.forEach(button =>
    button.setAttribute(
      'aria-pressed',
      String(button.dataset.layoutButton === layout),
    ),
  );
  tabs.forEach(button => {
    const selected = button.dataset.tab === activeTab;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  panes.forEach(pane => {
    const name = pane.dataset.window;
    pane.hidden = focusedWindow
      ? name !== focusedWindow
      : layout === 'tabs'
      ? name !== activeTab
      : layout === 'three' && name === 'mail';
    if (layout === 'tabs') {
      pane.setAttribute('role', 'tabpanel');
      if (name !== 'mail') pane.setAttribute('aria-labelledby', 'tab-' + name);
    } else {
      pane.removeAttribute('role');
      pane.removeAttribute('aria-labelledby');
    }
    const button = pane.querySelector('.demo-titlebar');
    button.setAttribute(
      'aria-label',
      focusedWindow === name
        ? 'Return to workspace overview'
        : 'Focus ' + button.querySelectorAll('span')[1].textContent + ' window',
    );
  });
  status.textContent = focusedWindow
    ? 'A little more focus. Everything else stays in place.'
    : layout === 'four'
    ? 'Four quadrants. Room for the whole project.'
    : layout === 'tabs'
    ? 'Different apps. One stack. Choose a tab above.'
    : 'Three windows. One shared workspace.';
}
layoutButtons.forEach(button =>
  button.addEventListener('click', () => {
    layout = button.dataset.layoutButton;
    focusedWindow = null;
    renderWorkspace();
  }),
);
panes.forEach(pane =>
  pane.querySelector('.demo-titlebar').addEventListener('click', () => {
    focusedWindow = focusedWindow ? null : pane.dataset.window;
    renderWorkspace();
  }),
);
restore.addEventListener('click', () => {
  const previous = focusedWindow;
  focusedWindow = null;
  renderWorkspace();
  panes
    .find(pane => pane.dataset.window === previous)
    ?.querySelector('button')
    .focus();
});
tabs.forEach((button, index) => {
  button.addEventListener('click', () => {
    activeTab = button.dataset.tab;
    focusedWindow = null;
    renderWorkspace();
  });
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft')
      next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    activeTab = tabs[next].dataset.tab;
    focusedWindow = null;
    renderWorkspace();
    tabs[next].focus();
  });
});
renderWorkspace();

const form = document.querySelector('.site-search');
const input = document.querySelector('#site-query');
const results = document.querySelector('.search-results');
const resultList = results.querySelector('ul');
const searchStatus = document.querySelector('.search-status');
const sections = [...document.querySelectorAll('[data-search-title]')];
form.addEventListener('submit', event => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }
  const words = query.toLowerCase().split(/\s+/);
  const matches = sections.filter(section =>
    words.every(word =>
      (section.dataset.searchTitle + ' ' + section.textContent)
        .toLowerCase()
        .includes(word),
    ),
  );
  resultList.replaceChildren();
  matches.forEach(section => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#' + section.id;
    link.textContent = section.dataset.searchTitle;
    item.append(link);
    resultList.append(item);
  });
  searchStatus.textContent = matches.length
    ? matches.length +
      (matches.length === 1 ? ' result' : ' results') +
      ' for “' +
      query +
      '”'
    : 'No results for “' +
      query +
      '”. Try layouts, tabs, shortcuts, or requirements.';
  results.hidden = false;
  results.scrollIntoView({ block: 'start' });
});
document.querySelector('.close-search').addEventListener('click', () => {
  results.hidden = true;
  input.focus();
});
