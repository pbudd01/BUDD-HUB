const ADMIN_PASSWORD = "budd-hub-2025";

// Unified data structure: initialized empty, then filled by GitHub or LocalStorage
let newsData = { 
    local: [], tech: [], finance: [], international: [], 
    sports: [], fashion: [], all: [] 
};

let sponsorship = { 
    title: "Advertise on PBUDD-HUB", 
    desc: "Reach a premium audience.", 
    link: "mailto:ebenezerewemoje@gmail.com" 
};

let currentCategory = 'all';
let filterEnabled = false; // Gatekeeper: Date filter only works when UI is open

// Single entry point for the application
window.onload = () => {
    loadSharedNews();
};

/**
 * FETCH LOGIC: Pulls the global news file from GitHub.
 * This is what allows everyone to see the same stories.
 */
async function loadSharedNews() {
    try {
        // Fetches from your specific GitHub repository
        const response = await fetch('https://raw.githubusercontent.com/pbudd01/BUDD-HUB/main/BUDD-HUB-Backup.json');
        if (response.ok) {
            const shared = await response.json();
            newsData = shared.news;
            if (shared.ad) sponsorship = shared.ad;
        } else {
            // If GitHub file isn't found, load from this device's memory
            newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
        }
    } catch (e) {
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
    }
    refreshData();
    applySponsorship();
    handleSearch();
}

/**
 * REFRESH: Rebuilds the 'all' category from individual sections and saves locally
 */
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

/**
 * UI TOGGLE: Opens/Closes the date filter row
 */
function toggleFilterUI() {
    const r = document.getElementById('date-filter-row');
    if (r.style.display === 'none' || r.style.display === '') {
        r.style.display = 'flex';
        filterEnabled = true;
    } else {
        r.style.display = 'none';
        filterEnabled = false;
        clearFilters(); 
    }
}

/**
 * SEARCH & FILTER: Handles text queries and date constraints
 */
function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    
    // Date Lock: Only filters if the UI is actually open
    if (filterEnabled) {
        if (from) filtered = filtered.filter(s => new Date(s.date) >= new Date(from));
        if (to) { 
            let e = new Date(to); 
            e.setHours(23, 59, 59); 
            filtered = filtered.filter(s => new Date(s.date) <= e); 
        }
    }
    
    if (q) {
        filtered = filtered.filter(s => 
            s.title.toLowerCase().includes(q) || 
            s.summary.toLowerCase().includes(q)
        );
    }
    renderFeed(filtered);
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
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
        </article><hr style="margin:20px 0; border:0; border-top:1px solid #ddd;">`).join('') : "<p style='text-align:center;'>No stories found.</p>";
}

/**
 * PUBLISH: Adds new content, triggers success animation, and resets the form
 */
function submitPost() {
    const btn = document.getElementById('publish-btn');
    const id = document.getElementById('edit-index').value;
    const cat = document.getElementById('post-category').value;
    
    const post = { 
        category: cat, 
        title: document.getElementById('post-title').value, 
        image: document.getElementById('post-image').value, 
        summary: document.getElementById('post-summary').value, 
        fullText: document.getElementById('post-full').value, 
        date: id !== "" ? newsData.all[id].date : new Date().toISOString() 
    };

    if (!post.title || !post.fullText) { alert("Headline and Content required."); return; }

    if (id !== "") {
        const old = newsData.all[id];
        newsData[old.category] = newsData[old.category].filter(s => s.date !== old.date);
    }
    newsData[cat].unshift(post);
    
    // UI Feedback
    btn.classList.add('success');
    
    setTimeout(() => {
        // Reset fields
        document.getElementById('edit-index').value = "";
        document.getElementById('post-title').value = "";
        document.getElementById('post-image').value = "";
        document.getElementById('post-summary').value = "";
        document.getElementById('post-full').value = "";
        
        btn.classList.remove('success');
        refreshData(); 
        closeAdminPanel(); 
        handleSearch();
    }, 1200);
}

/**
 * DELETE: Permanently erases the story from the specific category and rebuilds the feed
 */
function deletePost(i) {
    if (confirm("ERASE PERMANENTLY? This removes all traces of the story.")) {
        const s = newsData.all[i];
        newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
        refreshData(); 
        renderManageList(); 
        handleSearch();
    }
}

// --- UTILITIES ---

function verifyAdmin() { 
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { 
        document.getElementById('login-section').style.display = 'none'; 
        document.getElementById('admin-dashboard').style.display = 'block'; 
        updateAdminStats();
    } else alert("Access Denied."); 
}

function showTab(t) { 
    ['create', 'manage', 'ad'].forEach(tab => {
        document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none';
        document.getElementById(`btn-tab-${tab}`).classList.toggle('active', t === tab);
    }); 
    if (t === 'manage') renderManageList(); 
}

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; padding:8px; border-bottom:1px solid #ddd; font-size:11px; align-items:center;">
            <span style="flex:1;">${s.title.slice(0,30)}...</span>
            <button onclick="editPost(${i})" style="color:blue; background:none; border:none; cursor:pointer; margin-right:10px;">EDIT</button>
            <button onclick="deletePost(${i})" style="color:red; background:none; border:none; cursor:pointer;">DELETE</button>
        </div>`).join('');
}

function editPost(i) {
    const s = newsData.all[i];
    document.getElementById('edit-index').value = i;
    document.getElementById('post-category').value = s.category;
    document.getElementById('post-title').value = s.title;
    document.getElementById('post-image').value = s.image;
    document.getElementById('post-summary').value = s.summary;
    document.getElementById('post-full').value = s.fullText;
    showTab('create');
}

function applySponsorship() {
    const titleEl = document.querySelector('.ad-title');
    const descEl = document.querySelector('.ad-box p');
    if (titleEl) titleEl.textContent = sponsorship.title;
    if (descEl) descEl.textContent = sponsorship.desc;
}

function saveSponsorship() {
    sponsorship = { 
        title: document.getElementById('ad-title-input').value, 
        desc: document.getElementById('ad-desc-input').value, 
        link: "mailto:ebenezerewemoje@gmail.com" 
    };
    localStorage.setItem('budd_ad', JSON.stringify(sponsorship));
    applySponsorship();
    alert("Sponsorship Saved!");
}

function updateAdminStats() {
    const total = newsData.all.length;
    const statsEl = document.getElementById('admin-stats');
    if (statsEl) statsEl.innerHTML = `<div class="stat-card"><span>Total Posts</span><b>${total}</b></div>`;
}

function handleAction(cat, idx) {
    if (currentCategory === 'all') { 
        currentCategory = cat; 
        updateNavUI(cat); 
        handleSearch(); 
        window.scrollTo({top:0, behavior:'smooth'}); 
    } else { 
        const box = document.getElementById(`text-container-${idx}`); 
        const active = box.classList.toggle('show-text'); 
        box.nextElementSibling.textContent = active ? "HIDE STORY" : "READ STORY"; 
    }
}

function clearFilters() { 
    document.getElementById('filter-date-from').value = ''; 
    document.getElementById('filter-date-to').value = ''; 
    handleSearch(); 
}

function updateNavUI(c) { 
    document.querySelectorAll('.nav-item').forEach(l => { 
        l.classList.remove('active-page'); 
        if(l.dataset.category === c) l.classList.add('active-page'); 
    }); 
}

function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { 
    document.getElementById('admin-panel').style.display = 'none'; 
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('admin-pass').value = '';
}

function exportData() { 
    const d = JSON.stringify({ news: newsData, ad: sponsorship }, null, 2); 
    const b = new Blob([d], { type: "application/json" }); 
    const u = URL.createObjectURL(b); 
    const l = document.createElement('a'); 
    l.href = u; l.download = `BUDD-HUB-Backup.json`; 
    document.body.appendChild(l); l.click(); document.body.removeChild(l); 
}

function triggerImport() { document.getElementById('import-file').click(); }

function importData(e) { 
    const f = e.target.files[0]; if (!f) return; 
    const r = new FileReader(); 
    r.onload = function(ev) { 
        try { 
            const i = JSON.parse(ev.target.result); 
            if (confirm("Restore from backup?")) { 
                newsData = i.news; sponsorship = i.ad; 
                localStorage.setItem('budd_news', JSON.stringify(newsData)); 
                location.reload(); 
            } 
        } catch (er) { alert("Error reading file."); } 
    }; 
    r.readAsText(f); 
}

// Event Listeners for Categories
document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    currentCategory = l.dataset.category;
    updateNavUI(currentCategory);
    handleSearch();
}));

// Theme Toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️';
});
