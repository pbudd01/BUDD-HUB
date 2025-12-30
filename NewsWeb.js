// SUPABASE CONFIG
const SUPABASE_URL = "https://epmenhoqwopcpzajedjv.supabase.co";
const SUPABASE_KEY = "sb_publishable_B8U6mTZfKMH_x1ArGfHx4F0P93kKzW3M"; // Use full key from your dashboard

const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { all: [], drafts: [] };
let currentCategory = 'all';
const categories = ['all', 'trending', 'local', 'tech', 'finance', 'international', 'sports', 'fashion', 'entertainment'];

window.onload = () => {
    initNavs();
    fetchStoriesFromCloud(); 
    setupTheme();
    setupContactForm();
    setupAdminLogin();
};

async function fetchStoriesFromCloud() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=*&order=date.desc`, {
            headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        newsData.all = await response.json();
        handleSearch();
        updateTicker();
        checkDeepLink();
    } catch (e) { console.error("Sync failed."); }
}

function initNavs() {
    const horizontalNav = document.getElementById('horizontal-nav');
    const drawerNav = document.getElementById('drawer-nav-list');
    horizontalNav.innerHTML = categories.map(cat => `<a href="#" class="nav-item ${cat === currentCategory ? 'active-page' : ''}" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`).join('');
    drawerNav.innerHTML = categories.map(cat => `<a href="#" class="drawer-item" onclick="selectCategory('${cat}')">${cat.toUpperCase()}</a>`).join('') + `
    <div class="theme-switch-wrapper"><span>Dark Mode</span><label class="theme-switch"><input type="checkbox" id="theme-checkbox"><span class="slider"></span></label></div>`;
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
    let filtered = (currentCategory === 'all') ? [...newsData.all] : newsData.all.filter(s => s.category.includes(currentCategory));
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    renderFeed(filtered);
}

function clearSearch() { document.getElementById('main-search').value = ''; handleSearch(); }

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => {
        const storyId = encodeURIComponent(s.title.substring(0, 20)).replace(/%20/g, '-');
        return `
        <article class="news-article" id="${storyId}">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}', '${storyId}')"><i class="fas fa-share-alt"></i> Share</button>
            </div>
            <div style="color:red; font-weight:bold; font-size:0.7rem; margin-bottom:5px;">PBUDD-HUB ${s.category.join(' / ').toUpperCase()}</div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <div>${s.fullText}</div>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`;
    }).join('') : "<p style='text-align:center;'>Feed synced.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

async function submitPost() {
    const selectedCats = Array.from(document.getElementById('post-category').selectedOptions).map(opt => opt.value);
    const post = { category: selectedCats, title: document.getElementById('post-title').value, image: document.getElementById('post-image').value, summary: document.getElementById('post-summary').value, fullText: document.getElementById('post-full').value, date: new Date().toISOString() };
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(post)
    });
    if(response.ok) { alert("Published Globally!"); fetchStoriesFromCloud(); closeAdminPanel(); }
}

function shareStory(title, storyId) {
    const url = window.location.origin + window.location.pathname + '?story=' + storyId;
    if (navigator.share) navigator.share({ title: title, url: url });
    else { navigator.clipboard.writeText(url); alert("Link copied!"); }
}

function checkDeepLink() {
    const storyId = new URLSearchParams(window.location.search).get('story');
    if (storyId) {
        setTimeout(() => {
            const el = document.getElementById(storyId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
    }
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 10);
    ticker.innerHTML = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `PBUDD-HUB Premium Hub`;
}

function setupAdminLogin() { document.getElementById('admin-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') verifyAdmin(); }); }
function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; } else alert("Denied."); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; }
function showTab(t) { ['create', 'manage', 'drafts-tab'].forEach(tab => { document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'; }); }
function setupTheme() { const saved = localStorage.getItem('budd_theme') || 'light'; document.body.setAttribute('data-theme', saved); const cb = document.getElementById('theme-checkbox'); if(cb) { cb.checked = (saved === 'dark'); cb.addEventListener('change', () => { const next = cb.checked ? 'dark' : 'light'; document.body.setAttribute('data-theme', next); localStorage.setItem('budd_theme', next); }); } }
                
