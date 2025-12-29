const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { local:[], tech:[], finance:[], international:[], sports:[], fashion:[], entertainment:[], trending:[], drafts:[], all:[] };
let currentCategory = 'all';
const categories = ['all', 'trending', 'local', 'tech', 'finance', 'international', 'sports', 'fashion', 'entertainment'];

window.onload = () => {
    initNavs();
    loadSharedNews();
    setupTheme();
    setupContactForm();
    setupAdminLogin();
};

function setupAdminLogin() {
    const adminPassInput = document.getElementById('admin-pass');
    if (adminPassInput) {
        adminPassInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyAdmin();
        });
    }
}

function initNavs() {
    const horizontalNav = document.getElementById('horizontal-nav');
    const drawerNav = document.getElementById('drawer-nav-list');
    
    horizontalNav.innerHTML = categories.map(cat => 
        `<a href="#" class="nav-item ${cat === currentCategory ? 'active-page' : ''}" 
            onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('');
    
    drawerNav.innerHTML = categories.map(cat => 
        `<a href="#" class="drawer-item" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('') + `
    <div class="theme-switch-wrapper">
        <span class="theme-switch-label">Dark Mode</span>
        <label class="theme-switch"><input type="checkbox" id="theme-checkbox"><span class="slider"></span></label>
    </div>`;
}

function selectCategory(cat) {
    currentCategory = cat;
    initNavs();
    handleSearch();
    toggleMenu(false); 
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function toggleMenu(state) { 
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    if (state === false || (state !== true && sideMenu.classList.contains('open'))) {
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sideMenu.classList.add('open');
        overlay.classList.add('active');
    }
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) clearBtn.style.display = q.length > 0 ? 'block' : 'none';

    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    renderFeed(filtered);
}

function clearSearch() { document.getElementById('main-search').value = ''; handleSearch(); }

async function loadSharedNews() {
    const localData = localStorage.getItem('budd_news');
    if (localData) newsData = JSON.parse(localData);
    try {
        const response = await fetch('BUDD-HUB-Backup.json?t=' + new Date().getTime());
        if (response.ok) {
            const shared = await response.json();
            if (!localData) newsData = shared.news;
        }
    } catch (e) { console.warn("Local sync used."); }
    refreshData();
}

function refreshData() {
    const cats = ['trending', 'local', 'tech', 'finance', 'international', 'sports', 'fashion', 'entertainment'];
    let combined = [];
    cats.forEach(c => { combined = combined.concat(newsData[c] || []); });
    const unique = Array.from(new Set(combined.map(a => a.date))).map(date => combined.find(a => a.date === date));
    newsData.all = unique.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateTicker();
    handleSearch();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 10);
    ticker.innerHTML = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `<span class="ticker-item">PBUDD-HUB: Premium Hub</span>`;
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => {
        const storyId = encodeURIComponent(s.title.substring(0, 20)).replace(/%20/g, '-');
        return `
        <article class="news-article" id="${storyId}">
            <div class="article-header-row">
                <span class="article-date">${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn-themed" onclick="shareStory('${s.title.replace(/'/g, "\\'")}', '${storyId}')">
                    <i class="fas fa-share-alt"></i> SHARE
                </button>
            </div>
            <div class="article-category-tag">PBUDD-HUB ${Array.isArray(s.category) ? s.category.join(' / ').toUpperCase() : s.category.toUpperCase()}</div>
            <h2 class="article-title">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="expandable-text-container">
                <p class="article-summary-text">${s.summary}</p>
                <div class="article-full-body">${s.fullText}</div>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr class="article-divider">`;
    }).join('') : "<p style='text-align:center;'>No stories found.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

function shareStory(title, storyId) {
    const url = window.location.origin + window.location.pathname + '?story=' + storyId;
    if (navigator.share) {
        navigator.share({ title: title, url: url });
    } else {
        navigator.clipboard.writeText(url);
        alert("Link copied!");
    }
}

function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; } else alert("Denied."); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; }
function showTab(t) { ['create', 'manage', 'drafts-tab'].forEach(tab => { document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'; }); if (t === 'manage') renderManageList(); }
function saveToLocal() { localStorage.setItem('budd_news', JSON.stringify(newsData)); }

function submitPost() {
    const selectedCats = Array.from(document.getElementById('post-category').selectedOptions).map(opt => opt.value);
    const editIdx = document.getElementById('edit-index').value;
    if(selectedCats.length === 0) return alert("Select category!");
    const post = { category: selectedCats, title: document.getElementById('post-title').value, image: document.getElementById('post-image').value, summary: document.getElementById('post-summary').value, fullText: document.getElementById('post-full').value, date: new Date().toISOString() };
    selectedCats.forEach(cat => { if(!newsData[cat]) newsData[cat] = []; newsData[cat].unshift(post); });
    saveToLocal(); refreshData(); closeAdminPanel();
}

function exportData() { const b = new Blob([JSON.stringify({ news: newsData }, null, 2)], { type: "application/json" }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `Backup.json`; l.click(); }
function setupContactForm() { const form = document.getElementById('contact-form'); if(form) form.onsubmit = (e) => { e.preventDefault(); alert("Sent!"); }; }
function setupTheme() { const saved = localStorage.getItem('budd_theme') || 'light'; document.body.setAttribute('data-theme', saved); }
