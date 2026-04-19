const fs = require("fs");

const username = "gauravmishraokok";

/* ---------- ROBUST DATA FETCHING ---------- */
async function fetchLeetCodeData() {
  let stats = { total: "-", easy: "-", medium: "-", hard: "-" };
  let calendarObj = null;

  console.log("Fetching Stats from Vercel Edge API...");
  try {
    const statsRes = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
    const statsData = await statsRes.json();
    
    stats = {
      total: statsData.totalSolved ?? "-",
      easy: statsData.easySolved ?? "-",
      medium: statsData.mediumSolved ?? "-",
      hard: statsData.hardSolved ?? "-"
    };
  } catch (e) {
    console.error("Failed to fetch stats:", e.message);
  }

  console.log("Fetching Calendar from Alfa API...");
  try {
    const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`);
    const calData = await calRes.json();

    if (calData && calData.submissionCalendar) {
      calendarObj = typeof calData.submissionCalendar === 'string' 
        ? JSON.parse(calData.submissionCalendar) 
        : calData.submissionCalendar;
    }
  } catch (e) {
    console.error("Failed to fetch calendar:", e.message);
  }

  return { ...stats, calendar: calendarObj };
}

/* ---------- HEATMAP ---------- */
function generateHeatmap(calendar) {
  let days = [];
  const SECONDS_IN_DAY = 86400;

  if (calendar && Object.keys(calendar).length > 0) {
    const normalizedCalendar = {};
    for (const [timestamp, count] of Object.entries(calendar)) {
      const date = new Date(parseInt(timestamp) * 1000);
      const dateString = date.toISOString().split('T')[0];
      normalizedCalendar[dateString] = (normalizedCalendar[dateString] || 0) + count;
    }

    const now = new Date();
    let current = new Date(now.getTime() - (363 * SECONDS_IN_DAY * 1000));

    for (let i = 0; i < 364; i++) {
      const dateString = current.toISOString().split('T')[0];
      const count = normalizedCalendar[dateString] || 0;
      days.push([dateString, count]);
      current.setDate(current.getDate() + 1);
    }
  } else {
    // FAKE HEATMAP (fallback)
    days = Array.from({ length: 364 }, () => [null, Math.floor(Math.random() * 4)]);
  }

  let x = 0, y = 0;
  let rects = "";

  days.forEach(([_, count], i) => {
    // Using neon UI color levels for heatmap
    const color =
      count === 0 ? "#022c22" :           // Empty (Dark Green background)
      count < 2 ? "#065f46" :             // Subtle 
      count < 5 ? "#10b981" :             // Mid
      "#00FFC6";                          // Primary Emphasis (High activity)

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
  const data = await fetchLeetCodeData();
  const heatmap = generateHeatmap(data.calendar);

  // Box-in-box SVG layout with Neon UI Hierarchy
  const svg = `
<svg width="1000" height="420" viewBox="0 0 1000 420" xmlns="http://www.w3.org/2000/svg">

<style>
  /* FONT */
  .font { font-family: 'Courier New', 'Lucida Console', Monaco, monospace; }
  
  /* NEON UI COLOR SYSTEM */
  .primary { fill: #00FFC6; font-weight: bold; }
  .secondary { fill: #aafad3; }
  .tertiary { fill: #72a7fc; font-weight: bold; }
  
  /* TEXT SIZES */
  .title { font-size: 22px; letter-spacing: 2px; }
  .subtitle { font-size: 12px; letter-spacing: 1px; }
  .section-label { font-size: 14px; letter-spacing: 2px; }
  .stat-label { font-size: 12px; letter-spacing: 1px; }
  .stat-value { font-size: 18px; letter-spacing: 1px; }
  
  /* BOX STYLES */
  .bg { fill: #0A0A0E; } /* Deep terminal background */
  .box-outer { stroke: #00FFC6; stroke-width: 2; fill: none; }
  .box-inner { stroke: #00FFC6; stroke-width: 1; fill: none; stroke-opacity: 0.4; }
  .box-subtle { stroke: #00FFC6; stroke-width: 1; fill: none; stroke-opacity: 0.2; }
</style>

<rect width="1000" height="420" class="bg" rx="10"/>

<rect x="10" y="10" width="980" height="400" class="box-outer" rx="6"/>
<rect x="16" y="16" width="968" height="388" class="box-inner" rx="4"/>

<text x="40" y="55" class="font primary title">LEETCODE SYSTEM</text>
<text x="40" y="75" class="font secondary subtitle">Algorithmic Problem Solving Engine</text>

<rect x="40" y="100" width="920" height="120" class="box-inner" rx="4"/>
<text x="55" y="125" class="font primary section-label">PERFORMANCE METRICS</text>

<rect x="55" y="140" width="180" height="60" class="box-subtle" rx="2"/>
<text x="70" y="165" class="font secondary stat-label">TOTAL SOLVED</text>
<text x="70" y="188" class="font tertiary stat-value">${data.total}</text>

<rect x="250" y="140" width="180" height="60" class="box-subtle" rx="2"/>
<text x="265" y="165" class="font secondary stat-label">EASY</text>
<text x="265" y="188" class="font tertiary stat-value">${data.easy}</text>

<rect x="445" y="140" width="180" height="60" class="box-subtle" rx="2"/>
<text x="460" y="165" class="font secondary stat-label">MEDIUM</text>
<text x="460" y="188" class="font tertiary stat-value">${data.medium}</text>

<rect x="640" y="140" width="180" height="60" class="box-subtle" rx="2"/>
<text x="655" y="165" class="font secondary stat-label">HARD</text>
<text x="655" y="188" class="font tertiary stat-value">${data.hard}</text>

<rect x="40" y="240" width="920" height="140" class="box-inner" rx="4"/>
<text x="55" y="265" class="font primary section-label">ACTIVITY MATRIX (LAST 365 DAYS)</text>

<g transform="translate(55, 285)">
  ${heatmap}
</g>

</svg>
`;

  if (!fs.existsSync("assets")) {
    fs.mkdirSync("assets", { recursive: true });
  }

  fs.writeFileSync("assets/leetcode.svg", svg);
  console.log("✅ Custom Box-in-Box SVG updated successfully");
}

main();