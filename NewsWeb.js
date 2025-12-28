const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { local:[], tech:[], finance:[], international:[], sports:[], fashion:[], all:[] };
let currentCategory = 'all';
const categories = ['all', 'local', 'tech', 'finance', 'international', 'sports', 'fashion'];

window.onload = () => {
    initNavs();
    loadSharedNews();
    setupTheme();
    setupContactForm();
};

function initNavs() {
    const horizontalNav = document.getElementById('horizontal-nav');
    const drawerNav = document.getElementById('drawer-nav-list');
    
    // Horizontal items for main header
    const horizontalHTML = categories.map(cat => 
        `<a href="#" class="nav-item ${cat === currentCategory ? 'active-page' : ''}" 
            data-category="${cat}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('');
    
    // Vertical items for the Side Menu (Drawer)
    const verticalHTML = categories.map(cat => 
        `<a href="#" class="drawer-item" data-category="${cat}" onclick="selectCategory('${cat}')">
            ${cat.toUpperCase()}
         </a>`
    ).join('');
    
    if(horizontalNav) horizontalNav.innerHTML = horizontalHTML;
    if(drawerNav) drawerNav.innerHTML = verticalHTML + 
        `<hr style="margin:15px 0; border:0; border-top:1px solid rgba(128,128,128,0.3);">
         <button id="theme-toggle" class="drawer-theme-btn">🌙 Dark Mode</button>`;
}

function selectCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active-page', el.dataset.category === cat);
    });
    handleSearch();
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

async function loadSharedNews() {
    const jsonPath = 'BUDD-HUB-Backup.json'; 
    try {
        const response = await fetch(jsonPath + '?t=' + new Date().getTime());
        if (response.ok) {
            const shared = await response.json();
            newsData = shared.news;
        }
    } catch (e) {
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
    }
    refreshData();
}

function refreshData() {
    const cats = ['local', 'tech', 'finance', 'international', 'sports', 'fashion'];
    let combined = [];
    cats.forEach(c => { combined = combined.concat(newsData[c] || []); });
    newsData.all = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateTicker();
    handleSearch();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 10);
    const tickerText = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `<span class="ticker-item">PBUDD-HUB: Verified News Source</span>`;
    ticker.innerHTML = tickerText + tickerText;
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <div class="article-meta">
                <span style="font-weight:700; opacity:0.7;">${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-share-alt"></i> SHARE
                </button>
            </div>
            <div style="color:red; font-weight:bold; font-size:0.8rem;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p><b>${s.summary}</b></p><p>${s.fullText}</p>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr>`).join('') : "<p style='text-align:center;'>No stories found.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q));
    renderFeed(filtered);
}

function verifyAdmin() {
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else alert("Invalid Key");
}

function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; }

function showTab(t) { 
    ['create', 'manage'].forEach(tab => document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'); 
    document.getElementById('btn-tab-create').classList.toggle('active', t === 'create');
    document.getElementById('btn-tab-manage').classList.toggle('active', t === 'manage');
    if (t === 'manage') renderManageList();
}

function submitPost() {
    const cat = document.getElementById('post-category').value;
    const post = { 
        category: cat, title: document.getElementById('post-title').value, 
        image: document.getElementById('post-image').value, 
        summary: document.getElementById('post-summary').value, 
        fullText: document.getElementById('post-full').value, 
        date: new Date().toISOString() 
    };
    newsData[cat].unshift(post);
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    refreshData(); closeAdminPanel();
}

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; padding:10px; border-bottom:1px solid #ddd; align-items:center;">
            <span style="flex:1; font-size:0.8rem;">${s.title.slice(0,30)}...</span>
            <button onclick="deletePost(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">DEL</button>
        </div>`).join('');
}

function deletePost(i) {
    if (confirm("Permanently delete story?")) {
        const s = newsData.all[i];
        newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
        localStorage.setItem('budd_news', JSON.stringify(newsData));
        refreshData(); renderManageList();
    }
}

function exportData() {
    const b = new Blob([JSON.stringify({ news: newsData })], { type: "application/json" });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `BUDD-HUB-Backup.json`; l.click();
}

function shareStory(title) {
    if (navigator.share) navigator.share({ title: title, url: window.location.href });
    else { navigator.clipboard.writeText(window.location.href); alert("Link Copied!"); }
}

function setupTheme() {
    const btn = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('budd_theme') || 'light';
    document.body.setAttribute('data-theme', saved);
    if(btn) {
        btn.innerHTML = (saved === 'dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
        btn.onclick = () => {
            const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('budd_theme', next);
            btn.innerHTML = (next === 'dark') ? '☀️ Light Mode' : '🌙 Dark Mode';
        };
    }
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            window.location.href = `mailto:ebenezerewemoje@gmail.com?subject=${document.getElementById('contact-subject').value}&body=${document.getElementById('contact-message').value}`;
        };
    }
}
