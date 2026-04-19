const fs = require("fs");

const username = "gauravmishraokok";

/* ---------- ROBUST DATA FETCHING ---------- */
async function fetchLeetCodeData() {
  try {
    // Attempt 1: LeetCode Stats API (Usually returns everything in one call)
    console.log("Attempt 1: Fetching from leetcode-stats-api...");
    const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`);
    const data = await res.json();
    
    if (data.status === "success") {
       return {
         total: data.totalSolved || "-",
         easy: data.easySolved || "-",
         medium: data.mediumSolved || "-",
         hard: data.hardSolved || "-",
         // Ensure calendar is parsed properly whether it arrives as a string or object
         calendar: typeof data.submissionCalendar === 'string' 
            ? JSON.parse(data.submissionCalendar) 
            : data.submissionCalendar
       };
    }
    throw new Error("Primary API failed or returned an error status.");
  } catch (e) {
    console.log("Primary API failed. Attempt 2: Fetching from Alfa API...");
    try {
      // Attempt 2: Alfa LeetCode API (Requires two separate endpoint calls)
      const statsRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}`);
      const stats = await statsRes.json();
      
      const calRes = await fetch(`https://alfa-leetcode-api.onrender.com/${username}/calendar`);
      const cal = await calRes.json();
      
      let calendarObj = null;
      if (cal && cal.submissionCalendar) {
         calendarObj = typeof cal.submissionCalendar === 'string' 
            ? JSON.parse(cal.submissionCalendar) 
            : cal.submissionCalendar;
      }
      
      return {
        total: stats.totalSolved || "-",
        easy: stats.easySolved || "-",
        medium: stats.mediumSolved || "-",
        hard: stats.hardSolved || "-",
        calendar: calendarObj
      };
    } catch (err) {
      console.error("All APIs failed to retrieve data.");
      return { total: "-", easy: "-", medium: "-", hard: "-", calendar: null };
    }
  }
}

/* ---------- HEATMAP ---------- */
function generateHeatmap(calendar) {
  let days = [];
  const SECONDS_IN_DAY = 86400;

  if (calendar && Object.keys(calendar).length > 0) {
    // 1. Normalize the LeetCode calendar by exact Date String (YYYY-MM-DD)
    const normalizedCalendar = {};
    for (const [timestamp, count] of Object.entries(calendar)) {
      // LeetCode keys are in seconds, JS Date needs milliseconds
      const date = new Date(parseInt(timestamp) * 1000);
      const dateString = date.toISOString().split('T')[0];
      normalizedCalendar[dateString] = (normalizedCalendar[dateString] || 0) + count;
    }

    // 2. Generate an array of the last 364 days ending exactly today
    const now = new Date();
    // Start 363 days ago to get exactly 52 weeks (364 days)
    let current = new Date(now.getTime() - (363 * SECONDS_IN_DAY * 1000));

    for (let i = 0; i < 364; i++) {
      const dateString = current.toISOString().split('T')[0];
      const count = normalizedCalendar[dateString] || 0;
      days.push([dateString, count]);
      
      // Move forward one day
      current.setDate(current.getDate() + 1);
    }
  } else {
    console.log("No valid calendar data found. Generating fake fallback heatmap.");
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
    
    // Every 7 days, wrap to the top of the next column
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

  // Ensure the assets folder exists before writing
  if (!fs.existsSync("assets")) {
    fs.mkdirSync("assets", { recursive: true });
  }

  fs.writeFileSync("assets/leetcode.svg", svg);
  console.log("✅ SVG generated and saved successfully to assets/leetcode.svg");
}

main();