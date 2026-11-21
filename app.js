
const USER = "sohamkirar";
const API = "https://api.github.com";

const $ = (id) => document.getElementById(id);

const number = (n) =>
  new Intl.NumberFormat("en").format(n || 0);

const roles = [
  "AI & Full Stack Developer",
  "Building useful digital products",
  "Exploring AI / ML & software"
];

let roleIndex = 0;
let isRefreshing = false;

function setStatus(message) {
  const status = $("apiStatus");
  if (status) status.textContent = message;
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

async function githubJSON(path) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

function renderEvents(events) {
  const list = $("eventList");

  if (!list) return;

  if (!events.length) {
    list.innerHTML =
      '<p class="loading">No recent public activity found.</p>';
    return;
  }

  list.innerHTML = events.slice(0, 7).map(event => {
    const repo = event.repo?.name || "GitHub";

    const descriptions = {
      PushEvent: "Pushed code to",
      CreateEvent: "Created a branch or repository in",
      WatchEvent: "Starred",
      ForkEvent: "Forked",
      IssuesEvent: "Updated an issue in",
      PullRequestEvent: "Worked on a pull request in",
      ReleaseEvent: "Published a release in"
    };

    const description =
      descriptions[event.type] || "Activity in";

    return `
      <div class="event-row">
        <span class="event-dot"></span>
        <div class="event-title">
          ${description} <b>${repo}</b>
          <div class="event-meta">
            ${event.type.replace("Event", "")} ·
            <a href="https://github.com/${repo}"
               target="_blank" rel="noreferrer">${repo}</a>
          </div>
        </div>
        <span class="event-meta">
          ${timeAgo(event.created_at)}
        </span>
      </div>
    `;
  }).join("");
}

function renderProjects(repos) {
  const projects = [
    {
      name: "ThinkMate AI",
      tag: "AI PRODUCT",
      symbol: "✳",
      description: "An AI-powered thinking and productivity assistant.",
      match: "thinkmate"
    },
    {
      name: "TIMECRAFT AI",
      tag: "PRODUCTIVITY",
      symbol: "◷",
      description: "An AI-assisted timetable and planning experience.",
      match: "timecraft"
    },
    {
      name: "RADIX AI",
      tag: "AI / HEALTH TECH",
      symbol: "⌬",
      description: "An AI-assisted radiology decision-support platform.",
      match: "radix"
    },
    {
      name: "EventSphere",
      tag: "JAVA / WEB",
      symbol: "▦",
      description: "Online event management using Java and MySQL.",
      match: "eventsphere"
    }
  ];

  const grid = $("projectGrid");
  if (!grid) return;

  grid.innerHTML = projects.map(project => {
    const repo = repos.find(r =>
      r.name.toLowerCase().includes(project.match)
    );

    const url = repo
      ? repo.html_url
      : `https://github.com/${USER}?tab=repositories`;

    return `
      <article class="project-card">
        <div class="project-top">
          <span class="project-symbol">${project.symbol}</span>
          <span class="project-tag">${project.tag}</span>
        </div>
        <h3>${project.name}</h3>
        <p>${project.description}</p>
        <a href="${url}" target="_blank" rel="noreferrer">
          Open repository ↗
        </a>
        ${
          repo
            ? `<div class="repo-mini">
                ${repo.language || "Repository"} ·
                ★ ${number(repo.stargazers_count)}
              </div>`
            : ""
        }
      </article>
    `;
  }).join("");
}

function applyData({ user, repos, events }) {
  if ($("avatar")) $("avatar").src = user.avatar_url;

  if ($("profileName")) {
    $("profileName").textContent = user.name || USER;
  }

  if ($("profileBio")) {
    $("profileBio").textContent =
      user.bio || "AI & Full Stack Developer · Building products.";
  }

  if ($("repoCount")) {
    $("repoCount").textContent = number(user.public_repos);
  }

  if ($("followerCount")) {
    $("followerCount").textContent = number(user.followers);
  }

  if ($("starCount")) {
    $("starCount").textContent = number(
      repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    );
  }

  if ($("forkCount")) {
    $("forkCount").textContent = number(
      repos.reduce((sum, repo) => sum + repo.forks_count, 0)
    );
  }

  renderProjects(repos);
  renderEvents(events);
}

async function loadGitHub(force = false) {
  if (isRefreshing) return;

  isRefreshing = true;

  const button = $("refreshBtn");
  const originalText = button
    ? button.textContent
    : "↻ Refresh data";

  if (button) {
    button.disabled = true;
    button.textContent = "↻ Refreshing...";
  }

  setStatus("CONNECTING TO GITHUB API...");

  const cached = !force
    ? readCache()
    : null;

  try {
    if (cached && Date.now() - cached.time < 600000) {
      applyData(cached.data);
      setStatus("CONNECTED · CACHED GITHUB DATA");
      return;
    }

    const [user, repos, events] = await Promise.all([
      githubJSON(`/users/${USER}`),
      githubJSON(`/users/${USER}/repos?per_page=100&sort=updated`),
      githubJSON(`/users/${USER}/events/public?per_page=7`)
    ]);

    const data = { user, repos, events };

    try {
      localStorage.setItem(
        "ak-hub-github-cache-v3",
        JSON.stringify({
          time: Date.now(),
          data
        })
      );
    } catch (error) {
      console.warn("Cache unavailable:", error);
    }

    applyData(data);
    setStatus("CONNECTED · LIVE PUBLIC GITHUB DATA");

  } catch (error) {
    console.error("GitHub refresh failed:", error);

    setStatus("API ERROR · CLICK REFRESH TO RETRY");

    if ($("eventList")) {
      $("eventList").innerHTML = `
        <p class="loading">
          Unable to load GitHub data: ${error.message}
        </p>
      `;
    }
  } finally {
    isRefreshing = false;

    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function readCache() {
  try {
    const value = localStorage.getItem("ak-hub-github-cache-v3");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function terminalLine(html, cls = "") {
  const output = $("terminalOutput");
  if (!output) return;

  const p = document.createElement("p");
  if (cls) p.className = cls;
  p.innerHTML = html;

  output.appendChild(p);
  output.scrollTop = output.scrollHeight;
}

function runCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;

  terminalLine(
    `<span style="color:#63d8ff">soham@ak-hub:~$</span> ${escapeHTML(raw)}`
  );

  const commands = {
    help: () => terminalLine(
      "Available commands: help, about, projects, stats, contact, clear"
    ),

    about: () => terminalLine(
      "I'm Soham Kirar — exploring AI, machine learning and full-stack development."
    ),

    projects: () => {
      terminalLine("Opening featured projects...");
      $("projects")?.scrollIntoView({ behavior: "smooth" });
    },

    stats: () => {
      terminalLine("Loading GitHub statistics...");
      $("home")?.scrollIntoView({ behavior: "smooth" });
      loadGitHub(true);
    },

    contact: () => terminalLine(
      '<a href="https://github.com/sohamkirar" target="_blank">Connect on GitHub ↗</a>'
    ),

    clear: () => {
      $("terminalOutput").innerHTML = "";
    }
  };

  if (commands[cmd]) {
    commands[cmd]();
  } else {
    terminalLine(
      `Command not found: ${escapeHTML(cmd)}. Type help.`,
      "terminal-muted"
    );
  }
}

function initializeDashboard() {
  console.log("AK Developer Hub initialized.");

  const refreshButton = $("refreshBtn");

  if (refreshButton) {
    refreshButton.addEventListener("click", event => {
      event.preventDefault();
      loadGitHub(true);
    });

    refreshButton.disabled = false;
    refreshButton.style.pointerEvents = "auto";
  } else {
    console.error("Refresh button not found in index.html");
  }

  const form = $("terminalForm");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      const input = $("terminalInput");
      if (!input) return;

      runCommand(input.value);
      input.value = "";
    });
  }

  $("clearTerminal")?.addEventListener("click", () => {
    if ($("terminalOutput")) {
      $("terminalOutput").innerHTML = "";
    }
  });

  document.querySelectorAll("[data-command]").forEach(button => {
    button.addEventListener("click", () => {
      runCommand(button.dataset.command);
    });
  });

  $("menuToggle")?.addEventListener("click", () => {
    document.querySelector(".nav")?.classList.toggle("open");
  });

  document.querySelectorAll(".nav a").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelector(".nav")?.classList.remove("open");
    });
  });

  setInterval(() => {
    roleIndex = (roleIndex + 1) % roles.length;

    if ($("typedRole")) {
      $("typedRole").textContent = roles[roleIndex];
    }
  }, 2800);

  loadGitHub(false);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDashboard);
} else {
  initializeDashboard();
}
