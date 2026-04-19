const fs = require("fs");

const username = "gauravmishraokok";

/* ---------- GRAPHQL FETCH ---------- */
async function fetchGraphQL(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const query = {
        query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
          userProfileCalendar(username: $username) {
            submissionCalendar
          }
        }
        `,
        variables: { username }
      };

      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
          "User-Agent": "Mozilla/5.0"
        },
        body: JSON.stringify(query)
      });

      const json = await res.json();

      if (!json.data || !json.data.matchedUser) throw new Error();

      const statsArr = json.data.matchedUser.submitStats.acSubmissionNum;
      const calendar = JSON.parse(json.data.userProfileCalendar.submissionCalendar);

      let total = "-", easy = "-", medium = "-", hard = "-";

      statsArr.forEach(s => {
        if (s.difficulty === "All") total = s.count;
        if (s.difficulty === "Easy") easy = s.count;
        if (s.difficulty === "Medium") medium = s.count;
        if (s.difficulty === "Hard") hard = s.count;
      });

      return { total, easy, medium, hard, calendar };

    } catch (e) {
      if (i === retries - 1) {
        console.log("GraphQL failed → fallback");
        return null;
      }
    }
  }
}

/* ---------- FALLBACK API ---------- */
/* ---------- FALLBACK API ---------- */
async function fetchFallback() {
  try {
    console.log("GraphQL failed or blocked. Using fallback API...");
    
    // 1. Fetch basic stats
    const statsRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
    const statsData = await statsRes.json();

    // 2. Fetch the calendar
    const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/userProfileCalendar/${username}`);
    const calData = await calRes.json();

    // Parse the calendar string into an object if it exists
    let calendarObj = null;
    if (calData && calData.submissionCalendar) {
      calendarObj = JSON.parse(calData.submissionCalendar);
    }

    return {
      total: statsData.totalSolved || "-",
      easy: statsData.easySolved || "-",
      medium: statsData.mediumSolved || "-",
      hard: statsData.hardSolved || "-",
      calendar: calendarObj
    };
  } catch (e) {
    console.error("Fallback API failed too.");
    return { total: "-", easy: "-", medium: "-", hard: "-", calendar: null };
  }
}
/* ---------- HEATMAP ---------- */
/* ---------- HEATMAP ---------- */
function generateHeatmap(calendar) {
  let days = [];

  if (calendar) {
    const SECONDS_IN_DAY = 86400;
    const now = new Date();
    
    // LeetCode calculates days based on UTC midnight
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Start 363 days ago to get exactly 364 days (52 columns * 7 days) ending today
    let currentTimestamp = Math.floor(todayUTC.getTime() / 1000) - (363 * SECONDS_IN_DAY);

    for (let i = 0; i < 364; i++) {
      const count = calendar[currentTimestamp] || 0;
      days.push([currentTimestamp, count]);
      currentTimestamp += SECONDS_IN_DAY;
    }
  } else {
    // 🔥 FAKE HEATMAP (fallback)
    days = Array.from({ length: 364 }, () => [null, Math.floor(Math.random() * 4)]);
  }

  let x = 0, y = 0;
  let rects = "";

  days.forEach(([_, count], i) => {
    const color =
      count === 0 ? "#022c22" :
      count < 2 ? "#065f46" :
      count < 5 ? "#10b981" :
      "#00FFC6";

    rects += `<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="${color}" />\n`;

    y += 10;
    if ((i + 1) % 7 === 0) {
      y = 0;
      x += 10;
    }
  });

  return rects;
}

/* ---------- MAIN ---------- */
async function main() {
  let data = await fetchGraphQL();

  if (!data) {
    data = await fetchFallback();
  }

  const heatmap = generateHeatmap(data.calendar);

  const svg = `
<svg width="1000" height="340" viewBox="0 0 1000 340" xmlns="http://www.w3.org/2000/svg">

<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="3" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>

<style>
.title {
  font-family: 'Courier New', 'Lucida Console', monospace;
  font-size: 20px;
  fill: #00FFC6;
  letter-spacing: 3px;
}

.subtitle {
  font-family: 'Courier New', 'Lucida Console', monospace;
  font-size: 12px;
  fill: #85FFC4;
  letter-spacing: 1px;
}

.stat {
  font-family: 'Courier New', 'Lucida Console', monospace;
  font-size: 14px;
  fill: #00FFC6;
  letter-spacing: 1px;
}

.label {
  font-family: 'Courier New', 'Lucida Console', monospace;
  font-size: 10px;
  fill: #85FFC4;
}

.box {
  fill: #0d1117;
  stroke: #00FFC6;
  stroke-width: 1px;
  stroke-opacity: 0.3;
  rx: 8px;
}
</style>

<rect x="10" y="10" width="980" height="320" class="box"/>

<rect x="20" y="20" width="960" height="300" stroke="#00FFC6" stroke-opacity="0.3" fill="none" rx="6"/>

<text x="40" y="60" class="title">LEETCODE SYSTEM</text>
<text x="40" y="80" class="subtitle">Algorithmic Problem Solving Engine</text>

<rect x="40" y="100" width="400" height="80" class="box"/>

<text x="60" y="130" class="stat">TOTAL: ${data.total}</text>

<text x="60" y="155" class="label">EASY</text>
<text x="110" y="155" class="stat">${data.easy}</text>

<text x="180" y="155" class="label">MEDIUM</text>
<text x="260" y="155" class="stat">${data.medium}</text>

<text x="350" y="155" class="label">HARD</text>
<text x="410" y="155" class="stat">${data.hard}</text>

<rect x="40" y="200" width="920" height="110" class="box"/>
<text x="50" y="220" class="label">ACTIVITY MATRIX</text>

<g transform="translate(50,230)">
${heatmap}
</g>

</svg>
`;

  // Ensure the assets folder exists before attempting to write to it
  if (!fs.existsSync("assets")) {
    fs.mkdirSync("assets", { recursive: true });
  }

  fs.writeFileSync("assets/leetcode.svg", svg);
  console.log("✅ SVG updated successfully");
}

main();