const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = JSON.parse(localStorage.getItem('budd_news')) || { local:[], tech:[], finance:[], international:[], sports:[], fashion:[] };
let pinnedSearches = JSON.parse(localStorage.getItem('budd_pins')) || [];
let sponsorship = JSON.parse(localStorage.getItem('budd_ad')) || { title: "Advertise with BUDD-HUB", desc: "Reach our premium audience.", link: "mailto:ebenezerewemoje@gmail.com" };
let currentCategory = 'all';

window.onload = () => { refreshData(); renderPins(); applySponsorship(); handleSearch(); };

function refreshData() {
    const cats = ['local', 'tech', 'finance', 'international', 'sports', 'fashion'];
    let combined = [];
    cats.forEach(cat => { if (Array.isArray(newsData[cat])) combined = combined.concat(newsData[cat]); });
    newsData.all = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('budd_news', JSON.stringify(newsData));
    updateTicker();
}

function updateTicker() {
    const ticker = document.getElementById('ticker-scroll');
    const latest = newsData.all.slice(0, 5);
    ticker.innerHTML = latest.length ? latest.map(s => `<div class="ticker-item"><span style="color:orange">•</span> ${s.title}</div>`).join('') : `<div class="ticker-item">Welcome to BUDD-HUB</div>`;
}

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

    if (!post.title || !post.fullText) { alert("Fields required."); return; }
    if (id !== "") {
        const old = newsData.all[id];
        newsData[old.category] = newsData[old.category].filter(s => s.date !== old.date);
    }
    newsData[cat].unshift(post);
    
    btn.classList.add('success');
    setTimeout(() => {
        document.getElementById('edit-index').value = "";
        document.getElementById('post-title').value = "";
        document.getElementById('post-image').value = "";
        document.getElementById('post-summary').value = "";
        document.getElementById('post-full').value = "";
        btn.classList.remove('success');
        refreshData(); closeAdminPanel(); handleSearch();
    }, 1200);
}

function deletePost(i) {
    if (confirm("Permanently erase story?")) {
        const s = newsData.all[i];
        newsData[s.category] = newsData[s.category].filter(x => x.date !== s.date);
        refreshData(); renderManageList(); handleSearch();
    }
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    const from = document.getElementById('filter-date-from').value;
    const to = document.getElementById('filter-date-to').value;
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    if (from) filtered = filtered.filter(s => new Date(s.date) >= new Date(from));
    if (to) { let e = new Date(to); e.setHours(23, 59, 59); filtered = filtered.filter(s => new Date(s.date) <= e); }
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q));
    renderFeed(filtered);
}

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <span style="color:#888; font-size:0.7rem;">${new Date(s.date).toLocaleDateString()}</span>
            <div style="color:red; font-weight:bold; font-size:0.8rem;">BUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.5rem; margin:10px 0;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:bold; border-left:4px solid orange; padding-left:10px; margin:10px 0;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button class="budd-read-more" onclick="handleAction('${s.category}', ${i})">READ STORY</button>
        </article><hr style="margin:20px 0; border:0; border-top:1px solid #ddd;">`).join('') : "<p style='text-align:center;'>Empty.</p>";
}

function renderManageList() {
    document.getElementById('manage-list').innerHTML = newsData.all.map((s, i) => `
        <div class="db-row">
            <img src="${s.image}" style="width:35px; height:35px; border-radius:4px; object-fit:cover;">
            <div style="flex:1; overflow:hidden;"><div style="font-size:0.75rem; font-weight:bold; color:orange; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title}</div></div>
            <button onclick="editPost(${i})" style="color:#007bff; background:none; border:none; cursor:pointer; font-size:0.7rem;">EDIT</button>
            <button onclick="deletePost(${i})" style="color:#dc3545; background:none; border:none; cursor:pointer; font-size:0.7rem;">DEL</button>
        </div>`).join('');
}

function handleAction(cat, idx) {
    if (currentCategory === 'all') { currentCategory = cat; updateNavUI(cat); handleSearch(); window.scrollTo({top:0, behavior:'smooth'}); }
    else { const box = document.getElementById(`text-container-${idx}`); const active = box.classList.toggle('show-text'); box.nextElementSibling.textContent = active ? "HIDE STORY" : "READ STORY"; }
}
function toggleFilterUI() { const r = document.getElementById('date-filter-row'); r.style.display = (r.style.display === 'none' || r.style.display === '') ? 'flex' : 'none'; }
function verifyAdmin() { if (document.getElementById('admin-pass').value === ADMIN_PASSWORD) { document.getElementById('login-section').style.display = 'none'; document.getElementById('admin-dashboard').style.display = 'block'; updateAdminStats(); } else alert("Denied."); }
function showTab(t) { ['create', 'manage', 'ad'].forEach(tab => { document.getElementById(`tab-${tab}`).style.display = (t === tab) ? 'block' : 'none'; document.getElementById(`btn-tab-${tab}`).classList.toggle('active', t === tab); }); if (t === 'manage') renderManageList(); updateAdminStats(); }
function editPost(i) { const s = newsData.all[i]; document.getElementById('edit-index').value = i; document.getElementById('post-category').value = s.category; document.getElementById('post-title').value = s.title; document.getElementById('post-summary').value = s.summary; document.getElementById('post-full').value = s.fullText; document.getElementById('post-image').value = s.image; showTab('create'); }
function applySponsorship() { document.querySelector('.ad-title').textContent = sponsorship.title; document.querySelector('.ad-box p').textContent = sponsorship.desc; document.getElementById('footer-ad-link').href = sponsorship.link; }
function saveSponsorship() { sponsorship = { title: document.getElementById('ad-title-input').value, desc: document.getElementById('ad-desc-input').value, link: document.getElementById('ad-link-input').value || "mailto:ebenezerewemoje@gmail.com" }; localStorage.setItem('budd_ad', JSON.stringify(sponsorship)); applySponsorship(); alert("Saved!"); }
function updateAdminStats() { const total = newsData.all.length; const top = total ? Object.keys(newsData).filter(k => k !== 'all').reduce((a, b) => newsData[a].length > newsData[b].length ? a : b) : "N/A"; document.getElementById('admin-stats').innerHTML = `<div class="stat-card"><span>Posts</span><b>${total}</b></div><div class="stat-card"><span>Top</span><b>${top.toUpperCase()}</b></div><div class="stat-card"><span>Admin</span><b>ACTIVE</b></div>`; }
function saveCurrentSearch() { const val = document.getElementById('main-search').value.trim(); if (val && !pinnedSearches.includes(val)) { pinnedSearches.push(val); localStorage.setItem('budd_pins', JSON.stringify(pinnedSearches)); renderPins(); } }
function renderPins() { document.getElementById('pinned-searches').innerHTML = pinnedSearches.map((p, i) => `<div style="background:#000; color:#fff; padding:4px 10px; border-radius:15px; font-size:0.7rem; cursor:pointer; display:inline-flex; align-items:center; gap:5px; margin-right:5px; margin-bottom:5px;" onclick="applyPin('${p}')">${p} <span onclick="event.stopPropagation(); removePin(${i})" style="color:orange;">×</span></div>`).join(''); }
function applyPin(p) { document.getElementById('main-search').value = p; handleSearch(); }
function removePin(i) { pinnedSearches.splice(i, 1); localStorage.setItem('budd_pins', JSON.stringify(pinnedSearches)); renderPins(); }
function clearFilters() { document.getElementById('filter-date-from').value = ''; document.getElementById('filter-date-to').value = ''; handleSearch(); }
function updateNavUI(c) { document.querySelectorAll('.nav-item').forEach(l => { l.classList.remove('active-page'); if(l.dataset.category === c) l.classList.add('active-page'); }); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; document.getElementById('admin-pass').value = ''; }
function exportData() { const d = JSON.stringify({ news: newsData, pins: pinnedSearches, ad: sponsorship }, null, 2); const b = new Blob([d], { type: "application/json" }); const u = URL.createObjectURL(b); const l = document.createElement('a'); l.href = u; l.download = `BUDD-HUB-Backup.json`; document.body.appendChild(l); l.click(); document.body.removeChild(l); }
function triggerImport() { document.getElementById('import-file').click(); }
function importData(e) { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = function(ev) { try { const i = JSON.parse(ev.target.result); if (confirm("Restore from backup?")) { newsData = i.news; pinnedSearches = i.pins; sponsorship = i.ad; localStorage.setItem('budd_news', JSON.stringify(newsData)); location.reload(); } } catch (er) { alert("Invalid File."); } }; r.readAsText(f); }
document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => { e.preventDefault(); currentCategory = l.dataset.category; updateNavUI(currentCategory); handleSearch(); }));
document.getElementById('theme-toggle').addEventListener('click', () => { const i = document.body.getAttribute('data-theme') === 'dark'; document.body.setAttribute('data-theme', i ? 'light' : 'dark'); document.getElementById('theme-toggle').textContent = i ? '🌙' : '☀️'; });
l.classList.remove('active-page'); if(l.dataset.category === c) l.classList.add('active-page'); }); }
function openAdminPanel() { document.getElementById('admin-panel').style.display = 'block'; }
function closeAdminPanel() { document.getElementById('admin-panel').style.display = 'none'; document.getElementById('login-section').style.display = 'block'; document.getElementById('admin-dashboard').style.display = 'none'; document.getElementById('admin-pass').value = ''; }
document.querySelectorAll('.nav-item').forEach(l => l.addEventListener('click', e => { e.preventDefault(); currentCategory = l.dataset.category; updateNavUI(currentCategory); handleSearch(); }));
document.getElementById('theme-toggle').addEventListener('click', () => { const isDark = document.body.getAttribute('data-theme') === 'dark'; document.body.setAttribute('data-theme', isDark ? 'light' : 'dark'); document.getElementById('theme-toggle').textContent = isDark ? '🌙' : '☀️'; });
