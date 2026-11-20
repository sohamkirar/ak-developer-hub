const USER = "sohamkirar";
const API = "https://api.github.com";
const $ = (id) => document.getElementById(id);
const number = (n) => new Intl.NumberFormat("en").format(n || 0);
const cacheKey = "ak-hub-github-cache-v1";

async function githubJSON(path) {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: "application/vnd.github+json" }
  });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json();
}
function setStat(id, value) { $(id).textContent = number(value); }
function timeAgo(date) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
function eventDescription(event) {
  const repo = (event.repo?.name || "").replace(`${USER}/`, "");
  const map = {
    PushEvent: `Pushed code to <b>${repo}</b>`,
    CreateEvent: `Created a branch or repository in <b>${repo}</b>`,
    WatchEvent: `Starred <b>${repo}</b>`,
    ForkEvent: `Forked <b>${repo}</b>`,
    IssuesEvent: `Updated an issue in <b>${repo}</b>`,
    PullRequestEvent: `Worked on a pull request in <b>${repo}</b>`,
    ReleaseEvent: `Published a release in <b>${repo}</b>`,
    PublicEvent: `Made <b>${repo}</b> public`
  };
  return map[event.type] || `Activity in <b>${repo || "GitHub"}</b> · ${event.type.replace("Event", "")}`;
}
function renderEvents(events) {
  const list = $("eventList");
  if (!events.length) {
    list.innerHTML = '<p class="loading">No recent public events found. Your public activity will appear here when GitHub reports it.</p>';
    return;
  }
  list.innerHTML = events.slice(0, 7).map(e => `
    <div class="event-row">
      <span class="event-dot"></span>
      <div class="event-title">${eventDescription(e)}<div class="event-meta">${e.type.replace("Event","")} · <a href="https://github.com/${e.repo.name}" target="_blank" rel="noreferrer">${e.repo.name}</a></div></div>
      <span class="event-meta">${timeAgo(e.created_at)}</span>
    </div>`).join("");
}
function renderProjects(repos) {
  const featured = [
    {name:"ThinkMate AI",tag:"AI PRODUCT",symbol:"✳",description:"An AI-powered thinking and productivity assistant concept.",match:["thinkmate"]},
    {name:"TIMECRAFT AI",tag:"PRODUCTIVITY",symbol:"◷",description:"An AI-assisted timetable and planning experience.",match:["timecraft"]},
    {name:"RADIX AI",tag:"AI / HEALTH TECH",symbol:"⌬",description:"An AI-assisted radiology decision-support project concept.",match:["radix"]},
    {name:"EventSphere",tag:"JAVA / WEB",symbol:"▦",description:"Online event management system using Java, JSP, Servlets and MySQL.",match:["eventsphere"]}
  ];
  const cards = featured.map(p => {
    const repo = repos.find(r => p.match.some(m => r.name.toLowerCase().includes(m)));
    const href = repo ? repo.html_url : `https://github.com/${USER}?tab=repositories`;
    const label = repo ? "Open repository ↗" : "Find project repository ↗";
    return `<article class="project-card">
      <div class="project-top"><span class="project-symbol">${p.symbol}</span><span class="project-tag">${p.tag}</span></div>
      <h3>${p.name}</h3><p>${p.description}</p>
      <a href="${href}" target="_blank" rel="noreferrer">${label}</a>
      ${repo ? `<div class="repo-mini">${repo.language || "Repository"} · ★ ${number(repo.stargazers_count)}</div>` : ""}
    </article>`;
  }).join("");
  $("projectGrid").innerHTML = cards;
}
async function loadGitHub(force = false) {
  $("apiStatus").textContent = "CONNECTING TO GITHUB API…";
  const cached = !force && JSON.parse(localStorage.getItem(cacheKey) || "null");
  if (cached && Date.now() - cached.time < 10 * 60 * 1000) {
    applyData(cached.data);
    $("apiStatus").textContent = "CACHED · REFRESHES EVERY 10 MIN";
    return;
  }
  try {
    const [user, repos, events] = await Promise.all([
      githubJSON(`/users/${USER}`),
      githubJSON(`/users/${USER}/repos?per_page=100&sort=updated`),
      githubJSON(`/users/${USER}/events/public?per_page=7`)
    ]);
    const data = {user, repos, events};
    localStorage.setItem(cacheKey, JSON.stringify({time:Date.now(), data}));
    applyData(data);
    $("apiStatus").textContent = "CONNECTED · PUBLIC GITHUB DATA";
  } catch (error) {
    $("apiStatus").textContent = "API UNAVAILABLE · TRY REFRESH";
    $("eventList").innerHTML = `<p class="loading">Couldn't load GitHub data (${error.message}). The showcase is still available; try refreshing in a moment.</p>`;
  }
}
function applyData({user, repos, events}) {
  $("avatar").src = user.avatar_url;
  $("profileName").textContent = user.name || USER;
  $("profileBio").textContent = user.bio || "AI & Full Stack Developer · Exploring ideas and building products.";
  setStat("repoCount", user.public_repos);
  setStat("followerCount", user.followers);
  setStat("starCount", repos.reduce((sum,r) => sum + r.stargazers_count, 0));
  setStat("forkCount", repos.reduce((sum,r) => sum + r.forks_count, 0));
  renderProjects(repos);
  renderEvents(events);
}
const roles = ["AI & Full Stack Developer","Building useful digital products","Exploring AI / ML & software"];
let roleIndex = 0;
setInterval(() => {
  roleIndex = (roleIndex + 1) % roles.length;
  $("typedRole").textContent = roles[roleIndex];
}, 2800);

const output = $("terminalOutput");
function terminalLine(html, cls="") {
  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.innerHTML = html;
  output.appendChild(p);
  output.scrollTop = output.scrollHeight;
}
function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  terminalLine(`<span style="color:#63d8ff">soham@ak-hub:~$</span> ${escapeHTML(raw)}`);
  const commands = {
    help: () => terminalLine("Available commands: <b>help</b>, <b>about</b>, <b>projects</b>, <b>stats</b>, <b>contact</b>, <b>clear</b>"),
    about: () => terminalLine("I'm Soham Kirar — exploring AI, machine learning and full-stack development. I learn by building practical products."),
    projects: () => { terminalLine("Featured builds: <b>ThinkMate AI</b> · <b>TIMECRAFT AI</b> · <b>RADIX AI</b> · <b>EventSphere</b>"); document.querySelector("#projects").scrollIntoView({behavior:"smooth"}); },
    stats: () => { terminalLine("Loading public GitHub statistics above. <a href='https://github.com/sohamkirar' target='_blank' rel='noreferrer'>Open GitHub profile ↗</a>"); document.querySelector("#home").scrollIntoView({behavior:"smooth"}); },
    contact: () => terminalLine("Connect: <a href='https://github.com/sohamkirar' target='_blank' rel='noreferrer'>github.com/sohamkirar ↗</a>"),
    clear: () => { output.innerHTML = ""; return; }
  };
  if (commands[cmd]) commands[cmd]();
  else terminalLine(`Command not found: <b>${escapeHTML(cmd)}</b>. Type <b>help</b> to see available commands.`, "terminal-muted");
}
function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
$("terminalForm").addEventListener("submit", e => {
  e.preventDefault(); runCommand($("terminalInput").value); $("terminalInput").value = "";
});
document.querySelectorAll("[data-command]").forEach(b => b.addEventListener("click", () => runCommand(b.dataset.command)));
$("clearTerminal").addEventListener("click", () => { output.innerHTML = ""; });
$("refreshBtn").addEventListener("click", () => loadGitHub(true));
$("menuToggle").addEventListener("click", () => document.querySelector(".nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(a => a.addEventListener("click", () => document.querySelector(".nav").classList.remove("open")));
loadGitHub();
