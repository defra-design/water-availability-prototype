//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here

  (function () {
 function textToInt(text) {
   const n = parseInt(String(text).replace(/[^\d-]/g, ''), 10);
   return isNaN(n) ? 0 : n;
 }

 function formatPct(num) {
   // Show 0 or .0 where useful
   return (Math.round(num * 10) / 10).toString().replace(/\.0$/, '');
 }

 function buildChartFromTable(tableId, chartId) {
   const table = document.getElementById(tableId);
   const chart = document.getElementById(chartId);
   if (!table || !chart) return;

   // Sum the two numeric columns across all months
   const rows = Array.from(table.querySelectorAll('tbody tr'));
   let happened = 0;
   let didnt = 0;

   rows.forEach((tr) => {
     const tds = tr.querySelectorAll('td');
     // Expect: [Happened, Didn’t happen]
     happened += textToInt(tds[0]?.textContent);
     didnt  += textToInt(tds[1]?.textContent);
   });

   const total = happened + didnt;
   if (!total) return;

   const pH = (happened / total) * 100;
   const pN = 100 - pH;

   // Write widths
   const segH = chart.querySelector('.app-chart__segment--happened');
   const segN = chart.querySelector('.app-chart__segment--not');

   segH.style.inlineSize = `${pH}%`;
   segN.style.inlineSize = `${pN}%`;

   // Labels
   const labelH = segH.querySelector('.app-chart__label');
   const labelN = segN.querySelector('.app-chart__label');
   labelH.textContent = `X happened ${formatPct(pH)}%`;
   labelN.textContent = `Didn’t happen ${formatPct(pN)}%`;

   // ARIA text (and screen-reader figcaption)
   const sr = chart.querySelector('#chart-desc');
   const months = rows.length;
   const aria = `Across ${months} months (${total} days in total), X happened on ${happened} days (${formatPct(pH)}%) and didn’t happen on ${didnt} days (${formatPct(pN)}%).`;
   sr.textContent = aria;
   chart.querySelector('.app-chart__bar').setAttribute('aria-label', aria);

   // Provide a “Change to table view” / “Change to chart view” toggle
   const toggle = chart.querySelector('.app-chart__toggle');
   const tableWrapper = table;
   // Start with chart visible and table visible (you decide). Here we show both;
   // If you prefer chart-only by default: set table.hidden = true below.
   // tableWrapper.hidden = true;

   toggle.addEventListener('click', () => {
     const nowHidden = !tableWrapper.hidden;
     tableWrapper.hidden = nowHidden;
     toggle.setAttribute('aria-expanded', String(!nowHidden));
     toggle.textContent = nowHidden ? 'Change to chart view' : 'Change to table view';
     // Keep focus visible
     toggle.focus();
   });
 }

 document.addEventListener('DOMContentLoaded', function () {
   buildChartFromTable('monthly-data', 'summary-chart');
 });
})();

})
