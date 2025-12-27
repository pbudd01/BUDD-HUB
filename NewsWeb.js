const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = JSON.parse(localStorage.getItem('budd_news')) || { local:[], tech:[], finance:[], international:[], sports:[], fashion:[] };
let pinnedSearches = JSON.parse(localStorage.getItem('budd_pins')) || [];
let sponsorship = JSON.parse(localStorage.getItem('budd_ad')) || { title: "Advertise with BUDD-HUB", desc: "Reach our premium audience.", link: "mailto:ebenezerewemoje@gmail.com" };
let currentCategory = 'all';

window.onload = () => { refreshData(); renderPins(); applySponsorship(); handleSearch(); };

function refreshData() {
    newsData.all = Object.values(newsData).filter(v => Array.isArray(v)).flat().sort((a,b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    updateTicker();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 5);
    ticker.innerHTML = latest.length ? latest.map(s => `<div class="ticker-item"><span style="color:orange">•</span> ${s.title}</div>`).join('') : `<div class="ticker-item">Welcome to BUDD-HUB</div>`;
}

function toggleFilterUI() {
    const r = document.getElementById('date-filter-row');
    r.style.display = (r.style.display === 'none' || r.style.display === '') ? 'flex' : 'none';
}

function handleSearch() {
    const query = document.getElementById('main-search').value.toLowerCase();
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    let filtered = (currentCategory === 'all') ? newsData.all : newsData[currentCategory];
    if (from) filtered = filtered.filter(s => new Date(s.date) >= new Date(from));
    if (to) { let end = new Date(to); end.setHours(23, 59, 59); filtered = filtered.filter(s => new Date(s.date) <= end); }
    if (query) filtered = filtered.filter(s => s.title.toLowerCase().includes(query) || s.summary.toLowerCase().includes(query));
    renderFeed(filtered);
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    if (!stories.length) { feed.innerHTML = "<p style='text-align:center; padding:20px;'>No stories found.</p>"; return; }
    feed.innerHTML = stories.map((s, i) => `
        <article class="news-article">
            <span style="color:#888; font-size:0.7rem;">${new Date(s.date).toLocaleDateString()}</span>
            <div style="color:red; font-weight:bold; font-size:0.8rem;">BUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.5rem; margin:10px 0;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:bold; border-left:4px solid orange; padding-left:10px; margin:10px 0;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button class="budd-read-more" onclick="handleAction('${s.category}', ${i})">READ STORY</button>
        </article><hr style="margin:20px 0; border:0; border-top:1px solid #ddd;">
    `).join('');
}

function handleAction(cat, idx) {
    if (currentCategory === 'all') { currentCategory = cat; updateNavUI(cat); handleSearch(); window.scrollTo({top:0, behavior:'smooth'}); }
    else { const box = document.getElementById(`text-container-${idx}`); const active = box.classList.toggle('show-text'); box.nextElementSibling.textContent = active ? "HIDE STORY" : "READ STORY"; }
}

function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; updateAdminStats(); } else alert("Access Denied."); }

function showTab(t) {
    ['create', 'manage', 'ad'].forEach(tab => { document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'; document.getElementById(`btn-tab-${tab}`).classList.toggle('active', t === tab); });
    if (t === 'manage') renderManageList();
    updateAdminStats();
}

function submitPost() {
    const id = document.getElementById('edit-index').value;
    const cat = document.getElementById('post-category').value;
    const post = { category: cat, title: document.getElementById('post-title').value, image: document.getElementById('post-image').value, summary: document.getElementById('post-summary').value, fullText: document.getElementById('post-full').value, date: id ? newsData.all[id].date : new Date().toISOString() };
    if (id !== "") { const old = newsData.all[id]; newsData[old.category] = newsData[old.category].filter(s => s.date !== old.date); }
    newsData[cat].unshift(post);
    refreshData(); closeAdminPanel(); handleSearch();
}

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div style="display:flex; align-items:center; background:#f8f8f8; padding:8px; margin-bottom:5px; border-radius:8px;">
            <img src="${s.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px; margin-right:10px;">
            <span style="flex:1; font-size:0.75rem; font-weight:bold;">${s.title.slice(0,25)}...</span>
            <button onclick="editPost(${i})" style="color:blue; border:none; background:none; cursor:pointer; font-size:0.7rem;">Edit</button>
            <button onclick="deletePost(${i})" style="color:red; border:none; background:none; cursor:pointer; font-size:0.7rem; margin-left:5px;">Del</button>
        </div>`).join('');
}

function editPost(i) {
    const s = newsData.all[i]; document.getElementById('edit-index').value = i; document.getElementById('post-category').value = s.category;
    document.getElementById('post-title').value = s.title; document.getElementById('post-summary').value = s.summary; document.getElementById('post-full').value = s.fullText; document.getElementById('post-image').value = s.image; showTab('create');
}

function deletePost(i) {
    if (confirm("Delete this story?")) {
        const story = newsData.all[i];
        newsData[story.category] = newsData[story.category].filter(s => s.date !== story.date);
        refreshData(); renderManageList(); handleSearch();
    }
}

function applySponsorship() { document.querySelector('.ad-title').textContent = sponsorship.title; document.querySelector('.ad-box p').textContent = sponsorship.desc; document.getElementById('footer-ad-link').href = sponsorship.link; document.getElementById('ad-title-input').value = sponsorship.title; document.getElementById('ad-desc-input').value = sponsorship.desc; document.getElementById('ad-link-input').value = sponsorship.link; }
function saveSponsorship() { sponsorship = { title: document.getElementById('ad-title-input').value, desc: document.getElementById('ad-desc-input').value, link: document.getElementById('ad-link-input').value || "mailto:ebenezerewemoje@gmail.com" }; localStorage.setItem('budd_ad', JSON.stringify(sponsorship)); applySponsorship(); alert("Saved!"); }
function updateAdminStats() { const total = newsData.all.length; const top = total ? Object.keys(newsData).filter(k => k !== 'all').reduce((a, b) => newsData[a].length > newsData[b].length ? a : b) : "N/A"; document.getElementById('admin-stats').innerHTML = `<div class="stat-card"><span>Posts</span><b>${total}</b></div><div class="stat-card"><span>Top</span><b>${top.toUpperCase()}</b></div><div class="stat-card"><span>Pins</span><b>${pinnedSearches.length}</b></div>`; }

function exportData() {
    const dataStr = JSON.stringify({ news: newsData, pins: pinnedSearches, ad: sponsorship }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `BUDD-HUB-Backup-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function triggerImport() { document.getElementById('import-file').click(); }
function importData(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm("Restore from backup? This will overwrite your current feed.")) {
                newsData = imported.news; pinnedSearches = imported.pins; sponsorship = imported.ad;
                localStorage.setItem('budd_news', JSON.stringify(newsData)); localStorage.setItem('budd_pins', JSON.stringify(pinnedSearches)); localStorage.setItem('budd_ad', JSON.stringify(sponsorship));
                location.reload();
            }
        } catch (err) { alert("Invalid File."); }
    };
    reader.readAsText(file);
}

function saveCurrentSearch() { const val = document.getElementById('main-search').value.trim(); if (val && !pinnedSearches.includes(val)) { pinnedSearches.push(val); localStorage.setItem('budd_pins', JSON.stringify(pinnedSearches)); renderPins(); } }
function renderPins() { document.getElementById('pinned-searches').innerHTML = pinnedSearches.map((p, i) => `<div style="background:#000; color:#fff; padding:4px 10px; border-radius:15px; font-size:0.7rem; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-right:5px; margin-bottom:5px;" onclick="applyPin('${p}')">${p} <span onclick="event.stopPropagation(); removePin(${i})" style="color:orange;">×</span></div>`).join(''); }
function applyPin(p) { document.getElementById('main-search').value = p; handleSearch(); }
function removePin(i) { pinnedSearches.splice(i, 1); localStorage.setItem('budd_pins', JSON.stringify(pinnedSearches)); renderPins(); }
function clearFilters() { document.getElementById('filter-date-from').value = ''; document.getElementById('filter-date-to').value = ''; handleSearch(); }
function updateNavUI(c) { document.querySelectorAll('.nav-item').forEach(l => { l.classList.remove('active-page'); if(l.dataset.category === c) l.classList.add('active-page'); }); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; document.getElementById('admin-pass').value = ''; }
document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => { e.preventDefault(); currentCategory = l.dataset.category; updateNavUI(currentCategory); handleSearch(); }));
document.getElementById('theme-toggle').addEventListener('click', () => { const isDark = document.body.getAttribute('data-theme') === 'dark'; document.body.setAttribute('data-theme', isDark ? 'light' : 'dark'); document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️'; });
