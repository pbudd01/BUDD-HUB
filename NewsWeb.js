const ADMIN_PASSWORD = "budd-hub-2025";
let newsData = { local:[], tech:[], finance:[], international:[], sports:[], fashion:[], all:[] };
let currentCategory = 'all';

window.onload = () => {
    loadSharedNews();
    setupTheme();
    setupContactForm();
};

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
}

function selectCategory(cat) {
    currentCategory = cat;
    toggleMenu();
    handleSearch();
    window.scrollTo({top: 0, behavior: 'smooth'});
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

function renderFeed(stories) {
    const feed = document.getElementById('news-feed');
    feed.innerHTML = stories.length ? stories.map((s, i) => `
        <article class="news-article">
            <div class="article-meta">
                <span>${new Date(s.date).toLocaleDateString()}</span>
                <button class="share-btn" onclick="shareStory('${s.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-share-alt"></i> Share
                </button>
            </div>
            <div style="color:red; font-weight:900; font-size:0.8rem;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.7rem; margin:10px 0;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" style="width:100%; border-radius:10px; border:2px solid #000;" onerror="this.src='https://via.placeholder.com/400x200'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:bold; margin-bottom:10px;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" style="background:orange; border:2px solid #000; padding:10px 20px; font-weight:900; border-radius:50px; cursor:pointer;" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:20px 0;">`).join('') : "<p style='text-align:center;'>Feed synchronization complete.</p>";
}

function handleAction(idx) {
    const box = document.getElementById(`text-container-${idx}`); 
    const btn = document.getElementById(`read-btn-${idx}`);
    const active = box.classList.toggle('show-text'); 
    btn.textContent = active ? "HIDE STORY" : "READ STORY";
}

function shareStory(title) {
    if (navigator.share) {
        navigator.share({ title: title, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
    }
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
    if(btn) btn.onclick = () => {
        const next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('budd_theme', next);
        btn.innerHTML = next === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
    };
}

function refreshData() {
    const cats = ['local', 'tech', 'finance', 'international', 'sports', 'fashion'];
    let combined = [];
    cats.forEach(c => { combined = combined.concat(newsData[c] || []); });
    newsData.all = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function handleSearch() {
    const q = document.getElementById('main-search').value.toLowerCase();
    let filtered = (currentCategory === 'all') ? [...newsData.all] : [...newsData[currentCategory]];
    if (q) filtered = filtered.filter(s => s.title.toLowerCase().includes(q));
    renderFeed(filtered);
}
