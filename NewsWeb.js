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
        `<a href="#" class="nav-item ${cat === 'all' ? 'active-page' : ''}" data-category="${cat}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('');
    
    horizontalNav.innerHTML = navHTML;
    drawerNav.innerHTML = navHTML + `<hr><button id="theme-toggle" class="drawer-theme-btn">🌙 Dark Mode</button>`;
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

async function loadSharedNews() {
    try {
        const response = await fetch('BUDD-HUB-Backup.json?t=' + new Date().getTime());
        if (response.ok) {
            const shared = await response.json();
            newsData = shared.news;
        }
    } catch (e) {
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
    }
    refreshData();
    handleSearch();
}

function refreshData() {
    const cats = ['local', 'tech', 'finance', 'international', 'sports', 'fashion'];
    let combined = [];
    cats.forEach(c => { combined = combined.concat(newsData[c] || []); });
    newsData.all = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    updateTicker();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 8);
    ticker.innerHTML = latest.length ? latest.map(s => `<div class="ticker-item">● ${s.title}</div>`).join('') : `<div class="ticker-item">PBUDD-HUB: Your Premium News Source</div>`;
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}')"><i class="fas fa-share-alt"></i> Share</button>
            </div>
            <div style="color:red; font-weight:900; font-size:0.8rem;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p><b>${s.summary}</b></p>
                <p>${s.fullText}</p>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr>`).join('') : "<p style='text-align:center;'>Feed updated.</p>";
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

// --- ADMIN CMS LOGIC ---
function verifyAdmin() {
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else alert("Denied.");
}
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; }
function showTab(t) { 
    ['create', 'manage'].forEach(tab => document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'); 
    if (t === 'manage') renderManageList();
}
function submitPost() {
    const id = document.getElementById('edit-index').value;
    const cat = document.getElementById('post-category').value;
    const post = { 
        category: cat, title: document.getElementById('post-title').value, 
        image: document.getElementById('post-image').value, 
        summary: document.getElementById('post-summary').value, 
        fullText: document.getElementById('post-full').value, 
        date: id !== "" ? newsData.all[id].date : new Date().toISOString() 
    };
    if (id !== "") {
        const old = newsData.all[id];
        newsData[old.category] = newsData[old.category].filter(s => s.date !== old.date);
    }
    newsData[cat].unshift(post);
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    refreshData(); closeAdminPanel(); handleSearch();
}
function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; padding:10px; border-bottom:1px solid #ddd;">
            <span style="flex:1;">${s.title.slice(0,25)}...</span>
            <button onclick="deletePost(${i})" style="color:red; background:none; border:none; cursor:pointer;">DEL</button>
        </div>`).join('');
}
function deletePost(i) {
    const s = newsData.all[i];
    newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    refreshData(); renderManageList(); handleSearch();
}
function exportData() {
    const d = JSON.stringify({ news: newsData }, null, 2);
    const b = new Blob([d], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const l = document.createElement('a'); l.href = u; l.download = `BUDD-HUB-Backup.json`; l.click();
}
// Menu, Theme, Contact, Share logic as previously written...
