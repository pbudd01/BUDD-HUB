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
            if(!newsData.drafts) newsData.drafts = [];
        }
    } catch (e) { console.warn("Sync failed, using offline data."); }
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
    ticker.innerHTML = latest.length ? latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') + latest.map(s => `<span class="ticker-item">● ${s.title}</span>`).join('') : `<span class="ticker-item">PBUDD-HUB: Premium Hub</span>`;
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => {
        // PARAGRAPH SENSITIVITY LOGIC
        const formattedFullText = s.fullText.split('\n').filter(p => p.trim() !== '').map(p => `<p style="margin-bottom:15px;">${p}</p>`).join('');
        
        return `
        <article class="news-article">
            <div class="article-meta"><span>${new Date(s.date).toLocaleDateString()}</span></div>
            <div style="color:red; font-weight:bold; font-size:0.7rem; margin-bottom:5px;">PBUDD-HUB ${Array.isArray(s.category) ? s.category.join(' / ').toUpperCase() : s.category.toUpperCase()}</div>
            <h2>${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <div>${formattedFullText}</div>
            </div>
            <button class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`;
    }).join('') : "<p style='text-align:center;'>No stories found.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    box.classList.toggle('show-text');
}

function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; } else alert("Denied."); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; }

function showTab(t) { 
    ['create', 'manage', 'drafts-tab'].forEach(tab => { 
        const el = document.getElementById(`tab-${tab}`);
        if(el) el.style.display = (t === tab) ? 'block' : 'none'; 
    }); 
    if (t === 'manage') renderManageList(); 
    if (t === 'drafts-tab') renderDraftsList();
}

function saveToLocal() { localStorage.setItem('budd_news', JSON.stringify(newsData)); }

function submitPost() {
    const selectedCats = Array.from(document.getElementById('post-category').selectedOptions).map(opt => opt.value);
    const editIdx = document.getElementById('edit-index').value;
    if(selectedCats.length === 0) return alert("Select category!");
    const post = { category: selectedCats, title: document.getElementById('post-title').value, image: document.getElementById('post-image').value, summary: document.getElementById('post-summary').value, fullText: document.getElementById('post-full').value, date: editIdx !== "" ? newsData.all[editIdx].date : new Date().toISOString() };
    if(editIdx !== "") { const old = newsData.all[editIdx]; categories.forEach(c => { if(newsData[c]) newsData[c] = newsData[c].filter(x => x.date !== old.date); }); }
    selectedCats.forEach(cat => { if(!newsData[cat]) newsData[cat] = []; newsData[cat].unshift(post); });
    saveToLocal(); refreshData(); closeAdminPanel();
}

function saveDraft() {
    const d = { title: document.getElementById('post-title').value, image: document.getElementById('post-image').value, summary: document.getElementById('post-summary').value, fullText: document.getElementById('post-full').value, category: Array.from(document.getElementById('post-category').selectedOptions).map(opt => opt.value), date: new Date().toISOString() };
    if(!newsData.drafts) newsData.drafts = [];
    newsData.drafts.unshift(d);
    saveToLocal();
    alert("Draft Saved Successfully.");
    showTab('drafts-tab');
}

function renderDraftsList() {
    const list = document.getElementById('drafts-list');
    list.innerHTML = (newsData.drafts && newsData.drafts.length) ? newsData.drafts.map((d, i) => `
        <div style="display:flex; padding:10px; border-bottom:1px solid #ddd; align-items:center; background:#f9f9f9; margin-bottom:5px; border-radius:5px; gap:10px;">
            <span style="flex:1; font-size:0.75rem; font-weight:bold; color:#000;">${d.title || "(No Title)"}</span>
            <button onclick="loadDraft(${i})" style="color:white; background:green; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.7rem;">LOAD</button>
            <button onclick="deleteDraft(${i})" style="color:white; background:red; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.7rem;">DEL</button>
        </div>`).join('') : "<p style='color:#000; text-align:center;'>No Drafts.</p>";
}

function loadDraft(i) {
    const d = newsData.drafts[i];
    document.getElementById('post-title').value = d.title;
    document.getElementById('post-image').value = d.image;
    document.getElementById('post-summary').value = d.summary;
    document.getElementById('post-full').value = d.fullText;
    const select = document.getElementById('post-category');
    Array.from(select.options).forEach(opt => { opt.selected = d.category.includes(opt.value); });
    showTab('create');
}

function deleteDraft(i) { newsData.drafts.splice(i, 1); saveToLocal(); renderDraftsList(); }

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.length ? newsData.all.map((s, i) => `
        <div style="display:flex; padding:10px; border-bottom:1px solid #ddd; align-items:center; background:#f9f9f9; margin-bottom:5px; border-radius:5px; gap:10px;">
            <span style="flex:1; font-size:0.75rem; font-weight:bold; color:#000;">${s.title.slice(0,35)}...</span>
            <button onclick="editPost(${i})" style="color:white; background:blue; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.7rem;">EDIT</button>
            <button onclick="deletePost(${i})" style="color:white; background:red; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.7rem;">DEL</button>
        </div>`).join('') : "<p style='color:#000; text-align:center;'>Empty.</p>";
}

function editPost(allIdx) {
    const s = newsData.all[allIdx];
    document.getElementById('edit-index').value = allIdx;
    document.getElementById('post-title').value = s.title;
    document.getElementById('post-image').value = s.image;
    document.getElementById('post-summary').value = s.summary;
    document.getElementById('post-full').value = s.fullText;
    const select = document.getElementById('post-category');
    Array.from(select.options).forEach(opt => { opt.selected = s.category.includes(opt.value); });
    showTab('create');
}

function deletePost(i) { if (confirm("Delete story?")) { const s = newsData.all[i]; categories.forEach(c => { if(newsData[c]) newsData[c] = newsData[c].filter(x => x.date !== s.date); }); saveToLocal(); refreshData(); renderManageList(); } }

function exportData() { const b = new Blob([JSON.stringify({ news: newsData }, null, 2)], { type: "application/json" }); const l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = `BUDD-HUB-Backup.json`; document.body.appendChild(l); l.click(); document.body.removeChild(l); }

function setupContactForm() { 
    const form = document.getElementById('contact-form'); 
    if(form) { 
        form.onsubmit = (e) => { 
            e.preventDefault(); 
            window.location.href = `mailto:pbuddhub@gmail.com?subject=${document.getElementById('contact-subject').value}&body=${document.getElementById('contact-message').value}`; 
        }; 
    } 
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
