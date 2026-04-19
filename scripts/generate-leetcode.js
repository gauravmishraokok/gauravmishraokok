const fs = require("fs");

const username = "gauravmishraokok";

/* ---------- ROBUST DATA FETCHING ---------- */
async function fetchLeetCodeData() {
  let stats = { total: "-", easy: "-", medium: "-", hard: "-" };
  let calendarObj = null;
  let contest = { rating: "-", ranking: "-", attended: "-", top: "-" };

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

  console.log("Fetching Calendar & Contest from Alfa API...");
  try {
    // Fetch Calendar
    const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`);
    const calData = await calRes.json();

    if (calData && calData.submissionCalendar) {
      calendarObj = typeof calData.submissionCalendar === 'string' 
        ? JSON.parse(calData.submissionCalendar) 
        : calData.submissionCalendar;
    }

    // Fetch Contest
    const contestRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/contest`);
    const contestData = await contestRes.json();
    
    if (contestData) {
      // Aggressively check all possible JSON keys the API might be using
      const attendedCount = contestData.contestAttend 
                         ?? contestData.attendedContestsCount 
                         ?? contestData.contestParticipationNum 
                         ?? (contestData.userContestRanking && contestData.userContestRanking.attendedContestsCount) 
                         ?? "0";

      contest = {
        rating: contestData.contestRating ? Math.round(contestData.contestRating) : "N/A",
        ranking: contestData.contestGlobalRanking || "N/A",
        attended: attendedCount,
        top: contestData.contestTopPercentage ? `${contestData.contestTopPercentage}%` : "N/A"
      };
    }
    
  } catch (e) {
    console.error("Failed to fetch calendar/contest:", e.message);
  }

  return { ...stats, calendar: calendarObj, contest };
}

/* ---------- HEATMAP (LEETCODE STYLE) ---------- */
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
    const color =
      count === 0 ? "#022c22" :           // Empty (Dark Green)
      count < 2 ? "#065f46" :             // Subtle
      count < 5 ? "#10b981" :             // Mid
      "#00FFC6";                          // Primary

    // 11x11 squares with 2px border radius, jumping by 15px (creates a 4px gap)
    rects += `<rect x="${x}" y="${y}" width="11" height="11" rx="2" fill="${color}" />\n`;

    y += 15;
    if ((i + 1) % 7 === 0) {
      y = 0;
      x += 15;
    }
  });

  return rects;
}

/* ---------- MAIN ---------- */
async function main() {
  const data = await fetchLeetCodeData();
  const heatmap = generateHeatmap(data.calendar);

  // Expanded height to 460 to accommodate the 50/50 split and spaced-out grid
  const svg = `
<svg width="1000" height="460" viewBox="0 0 1000 460" xmlns="http://www.w3.org/2000/svg">

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
  .stat-value { font-size: 20px; letter-spacing: 1px; }
  
  /* BOX STYLES */
  .bg { fill: #0A0A0E; }
  .box-outer { stroke: #00FFC6; stroke-width: 2; fill: none; }
  .box-inner { stroke: #00FFC6; stroke-width: 1; fill: none; stroke-opacity: 0.4; }
  .box-subtle { stroke: #00FFC6; stroke-width: 1; fill: none; stroke-opacity: 0.2; }
</style>

<rect width="1000" height="460" class="bg" rx="10"/>

<rect x="10" y="10" width="980" height="440" class="box-outer" rx="6"/>
<rect x="16" y="16" width="968" height="428" class="box-inner" rx="4"/>

<text x="40" y="55" class="font primary title">LEETCODE SYSTEM</text>
<text x="40" y="75" class="font secondary subtitle">Algorithmic Problem Solving Engine</text>

<rect x="40" y="100" width="440" height="140" class="box-inner" rx="4"/>
<text x="55" y="125" class="font primary section-label">PROBLEM SOLVING</text>

<rect x="55" y="140" width="195" height="40" class="box-subtle" rx="2"/>
<text x="65" y="165" class="font secondary stat-label">TOTAL</text>
<text x="120" y="166" class="font tertiary stat-value">${data.total}</text>

<rect x="265" y="140" width="195" height="40" class="box-subtle" rx="2"/>
<text x="275" y="165" class="font secondary stat-label">EASY</text>
<text x="320" y="166" class="font tertiary stat-value">${data.easy}</text>

<rect x="55" y="185" width="195" height="40" class="box-subtle" rx="2"/>
<text x="65" y="210" class="font secondary stat-label">MEDIUM</text>
<text x="120" y="211" class="font tertiary stat-value">${data.medium}</text>

<rect x="265" y="185" width="195" height="40" class="box-subtle" rx="2"/>
<text x="275" y="210" class="font secondary stat-label">HARD</text>
<text x="320" y="211" class="font tertiary stat-value">${data.hard}</text>

<rect x="520" y="100" width="440" height="140" class="box-inner" rx="4"/>
<text x="535" y="125" class="font primary section-label">CONTEST METRICS</text>

<rect x="535" y="140" width="195" height="40" class="box-subtle" rx="2"/>
<text x="545" y="165" class="font secondary stat-label">RATING</text>
<text x="610" y="166" class="font tertiary stat-value">${data.contest.rating}</text>

<rect x="745" y="140" width="195" height="40" class="box-subtle" rx="2"/>
<text x="755" y="165" class="font secondary stat-label">RANK</text>
<text x="800" y="166" class="font tertiary stat-value">${data.contest.ranking}</text>

<rect x="535" y="185" width="195" height="40" class="box-subtle" rx="2"/>
<text x="545" y="210" class="font secondary stat-label">ATTENDED</text>
<text x="620" y="211" class="font tertiary stat-value">${data.contest.attended}</text>

<rect x="745" y="185" width="195" height="40" class="box-subtle" rx="2"/>
<text x="755" y="210" class="font secondary stat-label">TOP %</text>
<text x="810" y="211" class="font tertiary stat-value">${data.contest.top}</text>

<rect x="40" y="260" width="920" height="165" class="box-inner" rx="4"/>
<text x="55" y="285" class="font primary section-label">ACTIVITY MATRIX (LAST 365 DAYS)</text>

<g transform="translate(60, 305)">
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