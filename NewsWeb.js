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
    
    const navHTML = categories.map(cat => 
        `<a href="#" class="nav-item ${cat === currentCategory ? 'active-page' : ''}" 
            data-category="${cat}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('');
    
    const drawerHTML = categories.map(cat => 
        `<a href="#" class="drawer-item" data-category="${cat}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('') + `<hr style="margin:15px 0; border:0; border-top:1px solid rgba(0,0,0,0.1);"><button id="theme-toggle" class="drawer-theme-btn">🌙 Dark Mode</button>`;
    
    if(horizontalNav) horizontalNav.innerHTML = navHTML;
    if(drawerNav) drawerNav.innerHTML = drawerHTML;
}

function selectCategory(cat) {
    currentCategory = cat;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.toggle('active-page', el.dataset.category === cat));
    handleSearch();
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function toggleMenu() { document.getElementById('side-menu').classList.toggle('open'); }

async function loadSharedNews() {
    const jsonFilePath = 'BUDD-HUB-Backup.json'; 
    try {
        const response = await fetch(jsonFilePath + '?t=' + new Date().getTime());
        if (!response.ok) throw new Error('Fetch failed');
        const shared = await response.json();
        if (shared.news) newsData = shared.news;
    } catch (e) {
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
    }
    refreshData();
    checkDeepLink();
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
    const tickerText = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `<span class="ticker-item">PBUDD-HUB: Verified News</span>`;
    ticker.innerHTML = tickerText + tickerText;
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => {
        const storyId = encodeURIComponent(s.title.substring(0, 20)).replace(/%20/g, '-');
        const formattedFullText = s.fullText.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom:15px;">${p}</p>`).join('');

        return `
        <article class="news-article" id="${storyId}">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}', '${storyId}')">
                   <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
            <div style="color:red; font-weight:bold; font-size:0.7rem; margin-bottom:5px;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200?text=PBUDD-HUB'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <div>${formattedFullText}</div>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i}, '${s.category}')">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`;
    }).join('') : "<p style='text-align:center;'>Feed synced.</p>";
}

function handleAction(idx, category) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    if (currentCategory !== category && currentCategory === 'all') selectCategory(category);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

function shareStory(title, storyId) {
    const shareUrl = window.location.origin + window.location.pathname + '?story=' + storyId;
    if (navigator.share) navigator.share({ title: title, url: shareUrl });
    else { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }
}

function checkDeepLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const storyId = urlParams.get('story');
    if (storyId) {
        setTimeout(() => {
            const el = document.getElementById(storyId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
                el.style.borderLeft = "4px solid orange";
                el.style.paddingLeft = "10px";
                setTimeout(() => {
                    window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
                }, 2000);
            }
        }, 1000);
    }
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    renderFeed(filtered);
}

// --- CMS FUNCTIONS ---
function verifyAdmin() {
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else alert("Denied.");
}
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { 
    document.getElementById('admin-panel').style.display = 'none'; 
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}
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
        fullText: document.getElementById('post-full').value, date: new Date().toISOString() 
    };
    newsData[cat].unshift(post);
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    refreshData(); closeAdminPanel();
}
function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; padding:10px; border-bottom:1px solid #ddd; align-items:center; background:#f9f9f9; margin-bottom:5px; border-radius:5px;">
            <span style="flex:1; font-size:0.8rem; font-weight:bold; color:#000;">${s.title.slice(0,35)}...</span>
            <button onclick="deletePost(${i})" style="color:white; background:red; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">DEL</button>
        </div>`).join('');
}
function deletePost(i) {
    const s = newsData.all[i];
    newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    refreshData(); renderManageList();
}
function exportData() {
    const b = new Blob([JSON.stringify({ news: newsData }, null, 2)], { type: "application/json" });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `BUDD-HUB-Backup.json`; l.click();
}
function setupContactForm() {
    const form = document.getElementById('contact-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        window.location.href = `mailto:pbuddhub@gmail.com?subject=${document.getElementById('contact-subject').value}&body=${document.getElementById('contact-message').value}`;
    };
}
function setupTheme() {
    const btn = document.getElementById('theme-toggle');
    const saved = localStorage.getItem('budd_theme') || 'light';
    document.body.setAttribute('data-theme', saved);
    if(btn) btn.onclick = () => {
        const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('budd_theme', next);
    };
}
