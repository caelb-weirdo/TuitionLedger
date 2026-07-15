const palette={
  dashboard:['#f4c2d1','#c98da4'],
  students:['#b9dce8','#7daabd'],
  classes:['#d2c7eb','#9e8cc4'],
  attendance:['#b9ded2','#7fae9f'],
  fees:['#ead8a9','#c5a960'],
  settings:['#c4d0e7','#8fa4c7']
};

const glyphs={
  dashboard:'<path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  students:'<circle cx="11" cy="9" r="2.4" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M6.5 17c.5-2.2 2-3.3 4.5-3.3s4 1.1 4.5 3.3M17 7.5a2 2 0 0 1 0 3.8M17.3 13.8c1.5.4 2.4 1.4 2.7 2.7" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>',
  classes:'<path d="M8 7.3h8M8 11.5h8M8 15.7h5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><path d="M6 4.5h11.5v15H6a2 2 0 0 1 0-4h11.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>',
  attendance:'<path d="m8 12 2.5 2.5 5.6-6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="1.4"/>',
  fees:'<rect x="6" y="7" width="12" height="10" rx="1.8" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M6 10h12M9 14h2.8" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>',
  settings:'<circle cx="12" cy="12" r="2.5" fill="none" stroke="#fff" stroke-width="1.6"/><path d="M12 5.2v2M12 16.8v2M5.2 12h2M16.8 12h2M7.2 7.2l1.4 1.4M15.4 15.4l1.4 1.4M16.8 7.2l-1.4 1.4M8.6 15.4l-1.4 1.4" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>'
};

function iconSvg(key){
  const [light,dark]=palette[key];
  return `<svg class="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="${key}-glass" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><rect x="5" y="3.5" width="15" height="15" rx="4" fill="#fff" opacity=".22" transform="rotate(8 12.5 11)"/><rect x="3" y="5.5" width="15" height="15" rx="4" fill="url(#${key}-glass)" opacity=".82"/><path d="M5 8c3-1.6 7.5-1.7 11.2-.4" fill="none" stroke="#fff" stroke-width=".9" opacity=".34" stroke-linecap="round"/>${glyphs[key]}</svg>`;
}

function addSidebarIcons(){document.querySelectorAll('.app-shell nav a').forEach(link=>{if(link.dataset.frostIcon)return;const key=link.getAttribute('href')?.slice(1);if(!palette[key])return;link.dataset.frostIcon='true';link.innerHTML=`${iconSvg(key)}<span>${link.textContent}</span>`})}
const app=document.querySelector('#app');if(app)new MutationObserver(addSidebarIcons).observe(app,{childList:true,subtree:true});addSidebarIcons();
