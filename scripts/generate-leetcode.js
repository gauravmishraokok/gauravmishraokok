const fs = require("fs");
const fetch = require("node-fetch");

const username = "gauravmishraokok";

async function getLeetCodeStats() {
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query)
  });

  const json = await res.json();

  const stats = json.data.matchedUser.submitStats.acSubmissionNum;
  const calendar = JSON.parse(json.data.userProfileCalendar.submissionCalendar);

  let total = 0, easy = 0, medium = 0, hard = 0;

  stats.forEach(s => {
    if (s.difficulty === "All") total = s.count;
    if (s.difficulty === "Easy") easy = s.count;
    if (s.difficulty === "Medium") medium = s.count;
    if (s.difficulty === "Hard") hard = s.count;
  });

  return { total, easy, medium, hard, calendar };
}

function generateHeatmap(calendar) {
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

async function main() {
  const { total, easy, medium, hard, calendar } = await getLeetCodeStats();
  const heatmap = generateHeatmap(calendar);

  const svg = `
<svg width="1000" height="340" viewBox="0 0 1000 340" xmlns="http://www.w3.org/2000/svg">

<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>

<style>
.title { font-family: monospace; font-size: 20px; fill: #00FFC6; }
.subtitle { font-size: 12px; fill: #85FFC4; }
.text { font-size: 12px; fill: #00FFC6; }
.box { fill: none; stroke: #00FFC6; stroke-width: 1; filter: url(#glow); }
.stat { font-size: 14px; fill: #00FFC6; }
.label { font-size: 10px; fill: #85FFC4; }
</style>

<!-- OUTER BORDER -->
<rect x="10" y="10" width="980" height="320" class="box"/>

<!-- INNER BORDER -->
<rect x="20" y="20" width="960" height="300" stroke="#00FFC6" stroke-opacity="0.3" fill="none"/>

<!-- TITLE -->
<text x="40" y="60" class="title">LEETCODE SYSTEM</text>
<text x="40" y="80" class="subtitle">Algorithmic Problem Solving Engine</text>

<!-- STATS BOX -->
<rect x="40" y="100" width="400" height="80" class="box"/>

<text x="60" y="130" class="stat">TOTAL: ${total}</text>

<text x="60" y="155" class="label">EASY</text>
<text x="110" y="155" class="stat">${easy}</text>

<text x="180" y="155" class="label">MEDIUM</text>
<text x="260" y="155" class="stat">${medium}</text>

<text x="350" y="155" class="label">HARD</text>
<text x="410" y="155" class="stat">${hard}</text>

<!-- HEATMAP BOX -->
<rect x="40" y="200" width="920" height="110" class="box"/>

<text x="50" y="220" class="label">ACTIVITY MATRIX</text>

<g transform="translate(50,230)">
${heatmap}
</g>

</svg>
`;

  fs.writeFileSync("assets/leetcode.svg", svg);
}

main();