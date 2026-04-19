const fs = require("fs");
const fetch = require("node-fetch");

const username = "gauravmishraokok";

/* ---------- GRAPHQL FETCH ---------- */
async function fetchGraphQL() {
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

    if (!json.data || !json.data.matchedUser) throw new Error("GraphQL failed");

    const statsArr = json.data.matchedUser.submitStats.acSubmissionNum;
    const calendar = JSON.parse(json.data.userProfileCalendar.submissionCalendar);

    let total = 0, easy = 0, medium = 0, hard = 0;

    statsArr.forEach(s => {
      if (s.difficulty === "All") total = s.count;
      if (s.difficulty === "Easy") easy = s.count;
      if (s.difficulty === "Medium") medium = s.count;
      if (s.difficulty === "Hard") hard = s.count;
    });

    return { total, easy, medium, hard, calendar };

  } catch (err) {
    console.log("GraphQL failed → fallback");
    return null;
  }
}

/* ---------- FALLBACK API ---------- */
async function fetchFallback() {
  try {
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = await res.json();

    return {
      total: data.totalSolved || 0,
      easy: data.easySolved || 0,
      medium: data.mediumSolved || 0,
      hard: data.hardSolved || 0,
      calendar: null
    };
  } catch {
    return { total: 0, easy: 0, medium: 0, hard: 0, calendar: null };
  }
}

/* ---------- HEATMAP ---------- */
function generateHeatmap(calendar) {
  if (!calendar) return "";

  const days = Object.entries(calendar).slice(-140);

  let x = 0, y = 0;
  let rects = "";

  days.forEach(([_, count], i) => {
    const color =
      count === 0 ? "#022c22" :
      count < 2 ? "#065f46" :
      count < 5 ? "#10b981" :
      "#00FFC6";

    rects += `<rect x="${x}" y="${y}" width="8" height="8" rx="1" fill="${color}" />`;

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
.title { font-family: monospace; font-size: 20px; fill: #00FFC6; }
.subtitle { font-size: 12px; fill: #85FFC4; }
.stat { font-size: 14px; fill: #00FFC6; }
.label { font-size: 10px; fill: #85FFC4; }
.box { fill: none; stroke: #00FFC6; stroke-width: 1; filter: url(#glow); }
</style>

<!-- OUTER -->
<rect x="10" y="10" width="980" height="320" class="box"/>

<!-- INNER -->
<rect x="20" y="20" width="960" height="300" stroke="#00FFC6" stroke-opacity="0.3" fill="none"/>

<!-- TITLE -->
<text x="40" y="60" class="title">LEETCODE SYSTEM</text>
<text x="40" y="80" class="subtitle">Algorithmic Problem Solving Engine</text>

<!-- STATS -->
<rect x="40" y="100" width="400" height="80" class="box"/>

<text x="60" y="130" class="stat">TOTAL: ${data.total}</text>

<text x="60" y="155" class="label">EASY</text>
<text x="110" y="155" class="stat">${data.easy}</text>

<text x="180" y="155" class="label">MEDIUM</text>
<text x="260" y="155" class="stat">${data.medium}</text>

<text x="350" y="155" class="label">HARD</text>
<text x="410" y="155" class="stat">${data.hard}</text>

<!-- HEATMAP -->
<rect x="40" y="200" width="920" height="110" class="box"/>
<text x="50" y="220" class="label">ACTIVITY MATRIX</text>

<g transform="translate(50,230)">
${heatmap}
</g>

</svg>
`;

  fs.writeFileSync("assets/leetcode.svg", svg);
  console.log("✅ SVG updated successfully");
}

main();