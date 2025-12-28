const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { local:[], tech:[], finance:[], international:[], sports:[], fashion:[], all:[] };
let currentCategory = 'all';
let filterEnabled = false;

window.onload = () => {
    loadSharedNews();
    setupTheme(); // Initialize theme button
};

// FIX: Cache-buster added to URL to bypass GitHub's old data
async function loadSharedNews() {
    const GITHUB_URL = 'https://github.com/pbudd01/BUDD-HUB/blob/main/NewsWeb.js';
    const feed = document.getElementById('news-feed');
    
    if (feed) feed.innerHTML = "<p style='text-align:center; padding:20px;'>Syncing with PBUDD-HUB servers...</p>";

    try {
        // Adding a timestamp prevents GitHub from showing you an old version of the file
        const response = await fetch(GITHUB_URL + '?t=' + new Date().getTime());
        if (response.ok) {
            const shared = await response.json();
            newsData = shared.news;
            console.log("Global news synchronized.");
        } else {
            console.warn("Shared file not found. Loading local cache.");
            newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
        }
    } catch (e) {
        console.error("Network error:", e);
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
    }
    
    refreshData();
    handleSearch();
}

// FIX: Theme switcher logic rewritten for reliability
function setupTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    themeBtn.onclick = () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = (currentTheme === 'dark') ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        themeBtn.textContent = (newTheme === 'dark') ? '☀️' : '🌙';
        localStorage.setItem('budd_theme', newTheme);
    };

    // Load saved theme preference
    const savedTheme = localStorage.getItem('budd_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeBtn.textContent = (savedTheme === 'dark') ? '☀️' : '🌙';
}

function refreshData() {
    const cats = ['local', 'tech', 'finance', 'international', 'sports', 'fashion'];
    let combined = [];
    cats.forEach(cat => { 
        if (Array.isArray(newsData[cat])) combined = combined.concat(newsData[cat]); 
    });
    newsData.all = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    updateTicker();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 5);
    ticker.innerHTML = latest.length ? 
        latest.map(s => `<div class="ticker-item">● ${s.title}</div>`).join('') : 
        `<div class="ticker-item">Welcome to PBUDD-HUB</div>`;
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    
    if (filterEnabled) {
        if (from) filtered = filtered.filter(s => new Date(s.date) >= new Date(from));
        if (to) { 
            let e = new Date(to); 
            e.setHours(23, 59, 59); 
            filtered = filtered.filter(s => new Date(s.date) <= e); 
        }
    }
    
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    renderFeed(filtered);
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    if (!feed) return;
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <span style="color:#888; font-size:0.7rem;">${new Date(s.date).toLocaleDateString()}</span>
            <div style="color:red; font-weight:bold; font-size:0.8rem;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.5rem; margin:10px 0;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200?text=PBUDD-HUB'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:bold; border-left:4px solid orange; padding-left:10px; margin:10px 0;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button class="budd-read-more" onclick="handleAction('${s.category}', ${i})">READ STORY</button>
        </article><hr style="margin:20px 0; border:0; border-top:1px solid #ddd;">`).join('') : "<p style='text-align:center;'>No stories found. Please check your GitHub upload.</p>";
}

function handleAction(cat, idx) {
    if (currentCategory === 'all') { 
        currentCategory = cat; 
        updateNavUI(cat);
        handleSearch(); 
        window.scrollTo({top:0, behavior:'smooth'}); 
    } else { 
        const box = document.getElementById(`text-container-${idx}`); 
        box.classList.toggle('show-text'); 
    }
}

function updateNavUI(c) { 
    document.querySelectorAll('.nav-item').forEach(l => { 
        l.classList.remove('active-page'); 
        if(l.dataset.category === c) l.classList.add('active-page'); 
    }); 
}

// --- ADMIN CONTROLS ---
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; }
function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; } else alert("Access Denied."); }
function showTab(t) { ['create', 'manage'].forEach(tab => document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'); if (t === 'manage') renderManageList(); }
function renderManageList() { document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `<div style="display:flex; padding:8px; border-bottom:1px solid #ddd; font-size:11px;"><span>${s.title.slice(0,30)}...</span><button onclick="deletePost(${i})" style="color:red; margin-left:auto; background:none; border:none; cursor:pointer;">DEL</button></div>`).join(''); }
function deletePost(i) { const s = newsData.all[i]; newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date); refreshData(); renderManageList(); handleSearch(); }
function exportData() { const d = JSON.stringify({ news: newsData }, null, 2); const b = new Blob([d], { type: "application/json" }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `BUDD-HUB-Backup.json`; document.body.appendChild(l); l.click(); document.body.removeChild(l); }

// Toggle Date UI
function toggleFilterUI() {
    const r = document.getElementById('date-filter-row');
    filterEnabled = (r.style.display === 'none' || r.style.display === '');
    r.style.display = filterEnabled ? 'flex' : 'none';
}

function submitPost() {
    const btn = document.getElementById('publish-btn');
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
    btn.classList.add('success');
    setTimeout(() => {
        btn.classList.remove('success');
        refreshData(); closeAdminPanel(); handleSearch();
    }, 1200);
}

// Global Category Listeners
document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    currentCategory = l.dataset.category;
    updateNavUI(currentCategory);
    handleSearch();
}));
