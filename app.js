
const USER = "sohamkirar";
const API = "https://api.github.com";
const $ = (id) => document.getElementById(id);
const number = (n) => new Intl.NumberFormat("en").format(n || 0);
const cacheKey = "ak-hub-github-cache-v2";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(cacheKey) || "null");
  } catch {
    return null;
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ time: Date.now(), data })
    );
  } catch (error) {
    console.warn("Could not save GitHub cache:", error);
  }
}

async function githubJSON(path) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error("GitHub API rate limit reached. Try again later.");
    }

    if (response.status === 404) {
      throw new Error("GitHub profile or resource not found.");
    }

    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

function setStat(id, value) {
  const element = $(id);
  if (element) element.textContent = number(value);
}

function setStatus(message, state = "normal") {
  const status = $("apiStatus");
  if (!status) return;

  status.textContent = message;
  status.dataset.state = state;
}

function makeStatusClickable() {
  const status = $("apiStatus");
  if (!status) return;

  status.setAttribute("role", "button");
  status.setAttribute("tabindex", "0");
  status.setAttribute("aria-label", "Refresh GitHub statistics");
  status.setAttribute("title", "Click to refresh GitHub data");
  status.style.cursor = "pointer";
  status.style.userSelect = "none";
  status.style.transition = "opacity 0.2s ease";

  status.addEventListener("click", () => loadGitHub(true));

  status.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      loadGitHub(true);
    }
  });

  status.addEventListener("mouseenter", () => {
    status.style.opacity = "0.65";
  });

  status.addEventListener("mouseleave", () => {
    status.style.opacity = "1";
  });
}

function timeAgo(date) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  );

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return `${Math.floor(seconds / 86400)}d ago`;
}

function eventDescription(event) {
  const repo = (event.repo?.name || "").replace(`${USER}/`, "");

  const descriptions = {
    PushEvent: `Pushed code to <b>${repo}</b>`,
    CreateEvent: `Created a branch or repository in <b>${repo}</b>`,
    WatchEvent: `Starred <b>${repo}</b>`,
    ForkEvent: `Forked <b>${repo}</b>`,
    IssuesEvent: `Updated an issue in <b>${repo}</b>`,
    PullRequestEvent: `Worked on a pull request in <b>${repo}</b>`,
    ReleaseEvent: `Published a release in <b>${repo}</b>`,
    PublicEvent: `Made <b>${repo}</b> public`
  };

  return descriptions[event.type] ||
    `Activity in <b>${repo || "GitHub"}</b> · ${event.type.replace("Event", "")}`;
}

function renderEvents(events) {
  const list = $("eventList");
  if (!list) return;

  if (!events || !events.length) {
    list.innerHTML =
      '<p class="loading">No recent public events found. Your public activity will appear here when GitHub reports it.</p>';
    return;
  }

  list.innerHTML = events.slice(0, 7).map(event => `
    <div class="event-row">
      <span class="event-dot"></span>
      <div class="event-title">
        ${eventDescription(event)}
        <div class="event-meta">
          ${event.type.replace("Event", "")} ·
          <a href="https://github.com/${event.repo.name}"
             target="_blank" rel="noreferrer">
            ${event.repo.name}
          </a>
        </div>
      </div>
      <span class="event-meta">${timeAgo(event.created_at)}</span>
    </div>
  `).join("");
}

function renderProjects(repos) {
  const featured = [
    {
      name: "ThinkMate AI",
      tag: "AI PRODUCT",
      symbol: "✳",
      description: "An AI-powered thinking and productivity assistant concept.",
      match: ["thinkmate"]
    },
    {
      name: "TIMECRAFT AI",
      tag: "PRODUCTIVITY",
      symbol: "◷",
      description: "An AI-assisted timetable and planning experience.",
      match: ["timecraft"]
    },
    {
      name: "RADIX AI",
      tag: "AI / HEALTH TECH",
      symbol: "⌬",
      description: "An AI-assisted radiology decision-support project concept.",
      match: ["radix"]
    },
    {
      name: "EventSphere",
      tag: "JAVA / WEB",
      symbol: "▦",
      description: "Online event management system using Java, JSP, Servlets and MySQL.",
      match: ["eventsphere"]
    }
  ];

  const grid = $("projectGrid");
  if (!grid) return;

  const cards = featured.map(project => {
    const repo = repos.find(repository =>
      project.match.some(match =>
        repository.name.toLowerCase().includes(match)
      )
    );

    const href = repo
      ? repo.html_url
      : `https://github.com/${USER}?tab=repositories`;

    const label = repo
      ? "Open repository ↗"
      : "Find project repository ↗";

    return `
      <article class="project-card">
        <div class="project-top">
          <span class="project-symbol">${project.symbol}</span>
          <span class="project-tag">${project.tag}</span>
        </div>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <a href="${href}" target="_blank" rel="noreferrer">
          ${label}
        </a>
        ${repo ? `
          <div class="repo-mini">
            ${repo.language || "Repository"} · ★ ${number(repo.stargazers_count)}
          </div>
        ` : ""}
      </article>
    `;
  }).join("");

  grid.innerHTML = cards;
}

function applyData({ user, repos, events }) {
  if (user) {
    if ($("avatar")) $("avatar").src = user.avatar_url;
    if ($("profileName")) {
      $("profileName").textContent = user.name || USER;
    }
    if ($("profileBio")) {
      $("profileBio").textContent =
        user.bio || "AI & Full Stack Developer · Exploring ideas and building products.";
    }

    setStat("repoCount", user.public_repos);
    setStat("followerCount", user.followers);
  }

  if (repos) {
    setStat(
      "starCount",
      repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    );

    setStat(
      "forkCount",
      repos.reduce((sum, repo) => sum + repo.forks_count, 0)
    );

    renderProjects(repos);
  }

  if (events !== undefined) {
    renderEvents(events);
  }
}

let isLoading = false;

async function loadGitHub(force = false) {
  if (isLoading) return;

  const cached = readCache();

  if (
    cached &&
    cached.data &&
    !force &&
    Date.now() - cached.time < 10 * 60 * 1000
  ) {
    applyData(cached.data);
    setStatus("CONNECTED · CACHED GITHUB DATA", "success");
    return;
  }

  isLoading = true;

  const refreshButton = $("refreshBtn");
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = "↻ Loading...";
  }

  setStatus("CONNECTING TO GITHUB API...", "loading");

  try {
    // Load profile and repositories independently of the activity feed.
    const [user, repos] = await Promise.all([
      githubJSON(`/users/${USER}`),
      githubJSON(`/users/${USER}/repos?per_page=100&sort=updated`)
    ]);

    const data = {
      user,
      repos,
      events: []
    };

    // Display statistics immediately.
    applyData(data);

    saveCache(data);

    setStatus("CONNECTED · LIVE GITHUB DATA", "success");

    // Activity feed is optional; its failure must not break statistics.
    try {
      const events = await githubJSON(
        `/users/${USER}/events/public?per_page=7`
      );

      data.events = events;
      renderEvents(events);
      saveCache(data);

    } catch (activityError) {
      console.warn("GitHub activity feed unavailable:", activityError);

      renderEvents([]);

      setStatus(
        "CONNECTED · ACTIVITY FEED UNAVAILABLE",
        "success"
      );
    }

  } catch (error) {
    console.error("GitHub API error:", error);

    if (cached && cached.data) {
      applyData(cached.data);

      setStatus("OFFLINE · SHOWING CACHED DATA", "warning");
    } else {
      setStatus("API UNAVAILABLE · CLICK TO RETRY", "error");

      const list = $("eventList");

      if (list) {
        list.innerHTML = `
          <p class="loading">
            ${escapeHTML(error.message)}
            · Click the status above to retry.
          </p>
        `;
      }
    }

  } finally {
    isLoading = false;

    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = "↻ Refresh data";
    }
  }
}

const roles = [
  "AI & Full Stack Developer",
  "Building useful digital products",
  "Exploring AI / ML & software"
];

let roleIndex = 0;

setInterval(() => {
  const role = $("typedRole");
  if (!role) return;

  roleIndex = (roleIndex + 1) % roles.length;
  role.textContent = roles[roleIndex];
}, 2800);

const output = $("terminalOutput");

function terminalLine(html, cls = "") {
  if (!output) return;

  const paragraph = document.createElement("p");

  if (cls) paragraph.className = cls;

  paragraph.innerHTML = html;
  output.appendChild(paragraph);
  output.scrollTop = output.scrollHeight;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function runCommand(raw) {
  const command = raw.trim().toLowerCase();

  if (!command) return;

  terminalLine(
    `<span style="color:#63d8ff">soham@ak-hub:~$</span> ${escapeHTML(raw)}`
  );

  const commands = {
    help: () => terminalLine(
      "Available commands: <b>help</b>, <b>about</b>, <b>projects</b>, <b>stats</b>, <b>contact</b>, <b>clear</b>"
    ),

    about: () => terminalLine(
      "I'm Soham Kirar — exploring AI, machine learning and full-stack development. I learn by building practical products."
    ),

    projects: () => {
      terminalLine(
        "Featured builds: <b>ThinkMate AI</b> · <b>TIMECRAFT AI</b> · <b>RADIX AI</b> · <b>EventSphere</b>"
      );

      document.querySelector("#projects")?.scrollIntoView({
        behavior: "smooth"
      });
    },

    stats: () => {
      terminalLine(
        "Loading public GitHub statistics above. <a href='https://github.com/sohamkirar' target='_blank' rel='noreferrer'>Open GitHub profile ↗</a>"
      );

      document.querySelector("#home")?.scrollIntoView({
        behavior: "smooth"
      });
    },

    contact: () => terminalLine(
      "Connect: <a href='https://github.com/sohamkirar' target='_blank' rel='noreferrer'>github.com/sohamkirar ↗</a>"
    ),

    clear: () => {
      if (output) output.innerHTML = "";
    }
  };

  if (commands[command]) {
    commands[command]();
  } else {
    terminalLine(
      `Command not found: <b>${escapeHTML(command)}</b>. Type <b>help</b> to see available commands.`,
      "terminal-muted"
    );
  }
}

const terminalForm = $("terminalForm");

if (terminalForm) {
  terminalForm.addEventListener("submit", event => {
    event.preventDefault();

    const input = $("terminalInput");
    if (!input) return;

    runCommand(input.value);
    input.value = "";
  });
}

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    runCommand(button.dataset.command);
  });
});

const clearButton = $("clearTerminal");

if (clearButton) {
  clearButton.addEventListener("click", () => {
    if (output) output.innerHTML = "";
  });
}

const refreshButton = $("refreshBtn");

if (refreshButton) {
  refreshButton.addEventListener("click", () => loadGitHub(true));
}

makeStatusClickable();

const menuToggle = $("menuToggle");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.querySelector(".nav")?.classList.toggle("open");
  });
}

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".nav")?.classList.remove("open");
  });
});

loadGitHub();
