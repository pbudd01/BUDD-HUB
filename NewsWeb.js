// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = "https://epmenhoqwopcpzajedjv.supabase.co";
const SUPABASE_KEY = "sb_publishable_B8U6mTZfKMH_x1ArGfHx4..."; // Ensure this matches your full key from the dashboard

const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { all: [], drafts: [] }; 
let currentCategory = 'all';
const categories = ['all', 'trending', 'local', 'tech', 'finance', 'international', 'sports', 'fashion', 'entertainment'];

window.onload = () => {
    initNavs();
    fetchStoriesFromCloud(); // Replaces local JSON loading with live database fetch
    setupTheme();
    setupContactForm();
    setupAdminLogin();
};

// --- DATABASE FETCH LOGIC ---
async function fetchStoriesFromCloud() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/stories?select=*&order=date.desc`, {
            headers: { 
                "apikey": SUPABASE_KEY, 
                "Authorization": `Bearer ${SUPABASE_KEY}` 
            }
        });
        const stories = await response.json();
        newsData.all = stories;
        
        handleSearch(); // Refresh the feed display
        updateTicker(); // Update news ticker with latest titles
        checkDeepLink(); // Check if user arrived via a share link
    } catch (e) {
        console.error("Cloud fetch failed. Ensure your 'stories' table is public in Supabase.", e);
    }
}

// --- ADMIN LOGIN ---
function setupAdminLogin() {
    const adminPassInput = document.getElementById('admin-pass');
    if (adminPassInput) {
        adminPassInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyAdmin();
        });
    }
}

function verifyAdmin() {
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
    } else {
        alert("Denied.");
    }
}

// --- NAVIGATION & CATEGORIES ---
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

// --- SEARCH & FILTERING ---
function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) clearBtn.style.display = q.length > 0 ? 'block' : 'none';

    let filtered = newsData.all;
    
    // Filter by Category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(s => s.category && s.category.includes(currentCategory));
    }
    
    // Filter by Search Term
    if (q) {
        filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(q) || 
            s.summary.toLowerCase().includes(q)
        );
    }
    
    renderFeed(filtered);
}

function clearSearch() { document.getElementById('main-search').value = ''; handleSearch(); }

// --- FEED RENDERING ---
function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => {
        const storyId = encodeURIComponent(s.title.substring(0, 20)).replace(/%20/g, '-');
        return `
        <article class="news-article" id="${storyId}">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}', '${storyId}')">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
            <div style="color:red; font-weight:bold; font-size:0.7rem; margin-bottom:5px;">
                PBUDD-HUB ${Array.isArray(s.category) ? s.category.join(' / ').toUpperCase() : s.category.toUpperCase()}
            </div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <div>${s.fullText}</div>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`;
    }).join('') : "<p style='text-align:center;'>No stories found in this section.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text');
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

// --- SHARING & DEEP LINKING ---
function shareStory(title, storyId) {
    const shareUrl = window.location.origin + window.location.pathname + '?story=' + storyId;
    if (navigator.share) {
        navigator.share({ title: title, url: shareUrl });
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("Story link copied!");
    }
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
                setTimeout(() => { window.history.replaceState({}, document.title, window.location.origin + window.location.pathname); }, 2000);
            }
        }, 1000);
    }
}

// --- CMS LOGIC (SUPABASE UPLOAD) ---
async function submitPost() {
    const selectedCats = Array.from(document.getElementById('post-category').selectedOptions).map(opt => opt.value);
    if(selectedCats.length === 0) return alert("Select at least one category!");
    
    const post = { 
        category: selectedCats, 
        title: document.getElementById('post-title').value, 
        image: document.getElementById('post-image').value, 
        summary: document.getElementById('post-summary').value, 
        fullText: document.getElementById('post-full').value, 
        date: new Date().toISOString() 
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/stories`, {
            method: "POST",
            headers: { 
                "apikey": SUPABASE_KEY, 
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            },
            body: JSON.stringify(post)
        });

        if (response.ok) {
            alert("Published Globally!");
            fetchStoriesFromCloud(); // Refresh feed
            closeAdminPanel();
        }
    } catch (e) {
        alert("Upload failed. Check your internet connection.");
    }
}

// --- THEME & TICKER ---
function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 10);
    ticker.innerHTML = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `<span class="ticker-item">PBUDD-HUB: Premium Hub</span>`;
}

function setupTheme() {
    const saved = localStorage.getItem('budd_theme') || 'light';
    const checkbox = document.getElementById('theme-checkbox');
    document.body.setAttribute('data-theme', saved);
    if(checkbox) {
        checkbox.checked = (saved === 'dark');
        checkbox.addEventListener('change', () => {
            const next = checkbox.checked ? 'dark' : 'light';
            document.body.setAttribute('data-theme', next);
            localStorage.setItem('budd_theme', next);
        });
    }
}

function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { 
    document.getElementById('admin-panel').style.display = 'none'; 
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showTab(t) {
    ['create', 'manage', 'drafts-tab'].forEach(tab => {
        document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none';
    });
}

function exportData() {
    const b = new Blob([JSON.stringify({ news: newsData.all }, null, 2)], { type: "application/json" });
    const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `BUDD-HUB-Backup.json`; l.click();
                    }
        
