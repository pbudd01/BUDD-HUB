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

// Initialize both Horizontal and Drawer Navs
function initNavs() {
    const horizontalNav = document.getElementById('horizontal-nav');
    const drawerNav = document.getElementById('drawer-nav-list');
    
    const navHTML = categories.map(cat => 
        `<a href="#" class="nav-item ${cat === 'all' ? 'active-page' : ''}" data-category="${cat}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`
    ).join('');
    
    if(horizontalNav) horizontalNav.innerHTML = navHTML;
    if(drawerNav) drawerNav.innerHTML = navHTML + `<hr style="margin:15px 0; border:0; border-top:1px solid rgba(0,0,0,0.1);"><button id="theme-toggle" class="drawer-theme-btn">🌙 Dark Mode</button>`;
}

function selectCategory(cat) {
    currentCategory = cat;
    // Update Underlining for all nav items
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active-page', el.dataset.category === cat);
    });
    handleSearch();
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

async function loadSharedNews() {
    const jsonPath = 'BUDD-HUB-Backup.json'; 
    try {
        const response = await fetch(jsonPath + '?nocache=' + new Date().getTime());
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
    if (!feed) return;
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
            <div style="color:red; font-weight:900; font-size:0.75rem; margin-bottom:5px;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.6rem; margin-bottom:12px;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200?text=PBUDD-HUB'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`).join('') : "<p style='text-align:center;'>No stories found.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

function shareStory(title) {
    if (navigator.share) {
        navigator.share({ title: title, text: "Check this story on PBUDD-HUB", url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    }
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
    } else alert("Access Denied.");
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
        refreshData(); renderManageList(); handleSearch();
    }
}

function exportData() {
    const d = JSON.stringify({ news: newsData }, null, 2);
    const b = new Blob([d], { type: "application/json" });
    const u = URL.createObjectURL(b);
    const l = document.createElement('a'); l.href = u; l.download = `BUDD-HUB-Backup.json`; l.click();
}

function setupContactForm() {
    const form = document.getElementById('contact-form');
    if(form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const sub = document.getElementById('contact-subject').value;
            const msg = document.getElementById('contact-message').value;
            window.location.href = `mailto:ebenezerewemoje@gmail.com?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(msg)}`;
        };
    }
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
