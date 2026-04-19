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
  const days = Object.entries(calendar).slice(-120); // last ~4 months

  let x = 0, y = 0;
  let rects = "";

  days.forEach(([ts, count], i) => {
    const color =
      count === 0 ? "#022c22" :
      count < 2 ? "#065f46" :
      count < 5 ? "#10b981" :
      "#00FFC6";

    rects += `<rect x="${x}" y="${y}" width="8" height="8" fill="${color}" />`;

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
<svg width="1000" height="320" xmlns="http://www.w3.org/2000/svg">
<style>
.text { font-family: monospace; fill: #00FFC6; }
.sub { fill: #85FFC4; font-size: 12px; }
.title { font-size: 18px; fill: #00FFC6; }
.box { fill: none; stroke: #00FFC6; stroke-width: 1; }
</style>

<!-- BORDER -->
<rect x="10" y="10" width="980" height="300" class="box"/>

<!-- TITLE -->
<text x="40" y="50" class="title">LEETCODE SYSTEM</text>
<text x="40" y="75" class="sub">Algorithmic Problem Solving Engine</text>

<!-- STATS -->
<text x="40" y="120" class="text">TOTAL: ${total}</text>
<text x="40" y="150" class="text">EASY: ${easy}</text>
<text x="200" y="150" class="text">MEDIUM: ${medium}</text>
<text x="380" y="150" class="text">HARD: ${hard}</text>

<!-- HEATMAP -->
<g transform="translate(40,180)">
${heatmap}
</g>

</svg>
`;

  fs.writeFileSync("assets/leetcode.svg", svg);
}

main();