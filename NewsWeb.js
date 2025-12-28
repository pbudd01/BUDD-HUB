const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { local:[], tech:[], finance:[], international:[], sports:[], fashion:[], all:[] };
let currentCategory = 'all';
let filterEnabled = false; // The gatekeeper for date filtering

window.onload = () => {
    loadSharedNews();
};

/**
 * FETCH LOGIC: Attempts to pull the global news file from GitHub.
 * If it fails, it falls back to the device's local storage.
 */
async function loadSharedNews() {
    try {
        // REPLACE 'pbudd01' and 'YOUR_REPO' with your actual GitHub details
        const response = await fetch('https://raw.githubusercontent.com/pbudd01/YOUR_REPO/main/BUDD-HUB-Backup.json');
        if (response.ok) {
            const shared = await response.json();
            newsData = shared.news;
        } else {
            newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
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
    cats.forEach(cat => { 
        if (Array.isArray(newsData[cat])) combined = combined.concat(newsData[cat]); 
    });
    // Rebuild the "All News" list and sort by date
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
 * UI TOGGLE: Opens the date filter row.
 * Sets 'filterEnabled' to true so handleSearch() knows to use date inputs.
 */
function toggleFilterUI() {
    const r = document.getElementById('date-filter-row');
    if (r.style.display === 'none' || r.style.display === '') {
        r.style.display = 'flex';
        filterEnabled = true;
    } else {
        r.style.display = 'none';
        filterEnabled = false;
        clearFilters(); // Reset the dates when closing
    }
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    
    // DATE GATE: Only filters if the Calendar UI is open
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
 * PUBLISH LOGIC: Includes the Success Animation and Auto-Reset of fields.
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
    
    // Success Animation
    btn.classList.add('success');
    
    setTimeout(() => {
        // Clear Form Fields
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

function deletePost(i) {
    if (confirm("ERASE PERMANENTLY? This removes all traces of the story.")) {
        const s = newsData.all[i];
        newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
        refreshData(); 
        renderManageList(); 
        handleSearch();
    }
}

// --- ADMINISTRATIVE & UI UTILITIES ---

function verifyAdmin() { 
    if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { 
        document.getElementById('login-section').style.display = 'none'; 
        document.getElementById('admin-dashboard').style.display = 'block'; 
    } else alert("Access Denied."); 
}

function showTab(t) { 
    ['create', 'manage'].forEach(tab => {
        document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none';
        document.getElementById(`btn-tab-${tab}`).classList.toggle('active', t === tab);
    }); 
    if (t === 'manage') renderManageList(); 
}

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; padding:8px; border-bottom:1px solid #ddd; font-size:11px; align-items:center;">
            <span style="flex:1;">${s.title.slice(0,30)}...</span>
            <button onclick="deletePost(${i})" style="color:red; background:none; border:none; cursor:pointer;">DELETE</button>
        </div>`).join('');
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
}

function exportData() { 
    const d = JSON.stringify({ news: newsData }, null, 2); 
    const b = new Blob([d], { type: "application/json" }); 
    const u = URL.createObjectURL(b); 
    const l = document.createElement('a'); 
    l.href = u; l.download = `PBUDD-HUB-Backup.json`; 
    document.body.appendChild(l); l.click(); document.body.removeChild(l); 
}

document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => {
    e.preventDefault();
    currentCategory = l.dataset.category;
    updateNavUI(currentCategory);
    handleSearch();
}));

document.getElementById('theme-toggle').addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️';
});
// This function fetches your uploaded file from GitHub
async function loadSharedNews() {
    try {
        // REPLACE 'pbudd01' with your username and 'B...' with your repository name
        const response = await fetch('https://raw.githubusercontent.com/pbudd01/YOUR_REPOSITORY_NAME/main/BUDD-HUB-Backup.json');
        if (response.ok) {
            const sharedData = await response.json();
            newsData = sharedData.news;
            refreshData();
            handleSearch();
        }
    } catch (e) {
        // Fallback to local storage if the file is missing or there's an error
        newsData = JSON.parse(localStorage.getItem('budd_news')) || newsData;
        refreshData();
        handleSearch();
    }
}
