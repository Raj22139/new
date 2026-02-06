


// script.js - GitHub Profile Analyzer with Ranked Repositories

const analyzeBtn = document.getElementById('analyzeBtn');
const usernameInput = document.getElementById('usernameInput');
const msg = document.getElementById('msg');

const profileSection = document.getElementById('profileSection');
const reposSection = document.getElementById('reposSection');
const chartSection = document.getElementById('charts');

const avatar = document.getElementById('avatar');
const nameEl = document.getElementById('name');
const bioEl = document.getElementById('bio');
const locationEl = document.getElementById('location');
const followersEl = document.getElementById('followers');
const followingEl = document.getElementById('following');
const publicReposEl = document.getElementById('public_repos');
const profileLink = document.getElementById('profileLink');

const reposTableWrapper = document.getElementById('reposTableWrapper');

let starsChart = null;
let langChart = null;

analyzeBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) { showMessage('Enter a GitHub username'); return; }
  fetchProfile(username);
});

usernameInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') analyzeBtn.click();
});

function showMessage(text, error = false) {
  msg.textContent = text;
  msg.style.color = error ? '#ff8b8b' : '#9aa4b2';
  setTimeout(() => { msg.textContent = ''; }, 4000);
}

async function fetchProfile(username) {
  clearUI();
  showMessage('Fetching data...');
  try {
    const profileResp = await fetch(`https://api.github.com/users/${username}`);
    if (profileResp.status === 404) { showMessage('User not found', true); return; }
    if (profileResp.status === 403) { showMessage('API rate limit exceeded. Try later or use a token.', true); return; }

    const profileData = await profileResp.json();
    displayProfile(profileData);

    const reposResp = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
    const reposData = await reposResp.json();
    if (Array.isArray(reposData)) {
      displayRepos(reposData);
    } else {
      showMessage('Unable to fetch repositories', true);
    }
  } catch (err) {
    console.error(err);
    showMessage('Something went wrong. Check console.', true);
  }
}

function displayProfile(data) {
  avatar.src = data.avatar_url;
  nameEl.textContent = data.name || data.login;
  bioEl.textContent = data.bio || '';
  locationEl.textContent = data.location || '';
  followersEl.textContent = data.followers;
  followingEl.textContent = data.following;
  publicReposEl.textContent = data.public_repos;
  profileLink.href = data.html_url;
  profileLink.textContent = 'View on GitHub';
  profileSection.classList.remove('hidden');
}

function displayRepos(repos) {
  reposSection.classList.remove('hidden');
  chartSection.classList.remove('hidden');

  if (repos.length === 0) {
    reposTableWrapper.innerHTML = '<p class="muted">No public repositories.</p>';
    return;
  }

  // *Sort repositories*: Stars desc → Forks desc → Open issues asc
  repos.sort((a, b) => {
    if (b.stargazers_count !== a.stargazers_count) return b.stargazers_count - a.stargazers_count;
    if (b.forks_count !== a.forks_count) return b.forks_count - a.forks_count;
    return a.open_issues_count - b.open_issues_count;
  });

  // Build table-like list with rank
  reposTableWrapper.innerHTML = '';
  repos.forEach((r, index) => {
    const row = document.createElement('div');
    row.className = 'repo-row';
    row.innerHTML = `
      <div class="repo-left">
        <h5>#${index + 1} <a href="${r.html_url}" target="_blank" style="color:inherit;text-decoration:none">${r.name}</a></h5>
        <div class="repo-meta">${r.language || '—'} • Updated ${new Date(r.updated_at).toLocaleDateString()}</div>
      </div>
      <div class="repo-right">
        <div class="repo-meta">⭐ ${r.stargazers_count} &nbsp;•&nbsp; 🍴 ${r.forks_count} &nbsp;•&nbsp; Issues: ${r.open_issues_count}</div>
      </div>
    `;
    reposTableWrapper.appendChild(row);
  });

  // Top 6 repos by stars for chart
  const topByStars = [...repos].slice(0, 6);
  const starLabels = topByStars.map(r => r.name);
  const starValues = topByStars.map(r => r.stargazers_count);

  // Language distribution
  const langMap = {};
  repos.forEach(r => {
    const lang = r.language || 'Other';
    langMap[lang] = (langMap[lang] || 0) + 1;
  });
  const langLabels = Object.keys(langMap);
  const langValues = Object.values(langMap);

  renderStarsChart(starLabels, starValues);
  renderLangChart(langLabels, langValues);
}

function renderStarsChart(labels, values) {
  const ctx = document.getElementById('starsChart').getContext('2d');
  if (starsChart) starsChart.destroy();
  starsChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Stars', data: values, borderRadius: 6, borderSkipped: false }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }
  });
}

function renderLangChart(labels, values) {
  const ctx = document.getElementById('langChart').getContext('2d');
  if (langChart) langChart.destroy();
  langChart = new Chart(ctx, {
    type: 'pie',
    data: { labels, datasets: [{ data: values }] },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
  });
}

function clearUI() {
  profileSection.classList.add('hidden');
  reposSection.classList.add('hidden');
  reposTableWrapper.innerHTML = '';
  if (starsChart) { starsChart.destroy(); starsChart = null; }
  if (langChart) { langChart.destroy(); langChart = null; }
}