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
    // Relative path to your JSON file in the repo
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
            <div style="color:red; font-weight:900; font-size:0.75rem; margin-bottom:5px;">PBUDD-HUB ${s.category.toUpperCase()}</div>
            <h2 style="font-size:1.6rem; margin-bottom:12px;">${s.title}</h2>
            <img src="${s.image}" class="dynamic-img" onerror="this.src='https://via.placeholder.com/400x200?text=PBUDD-HUB'">
            <div id="text-container-${i}" class="text-container">
                <p style="font-weight:700; border-left:4px solid orange; padding-left:12px; margin-bottom:15px;">${s.summary}</p>
                <p>${s.fullText}</p>
            </div>
            <button id="read-btn-${i}" class="budd-read-more" onclick="handleAction(${i})">READ STORY</button>
        </article><hr style="margin:25px 0; border:0; border-top:1px solid #eee;">`).join('') : "<p style='text-align:center;'>Feed empty.</p>";
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
