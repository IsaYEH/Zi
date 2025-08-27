const E = window.__ZIWEI_ENGINE__;
const R = window.__ZIWEI_RULES__;

function init(){
  const btnCalc = document.getElementById('btnCalc');
  const btnSample = document.getElementById('btnSample');
  const btnExport = document.getElementById('btnExport');
  const btnPNG = document.getElementById('btnPNG');
  const fontScale = document.getElementById('fontScale');
  const darkMode = document.getElementById('darkMode');

  btnCalc.addEventListener('click', async ()=>{
    const input = E.parseInput();
    const chart = await window.calcChartWithDB(input);
    E.renderChart(chart);
    window.__CURRENT_CHART__ = chart;
  });

  btnSample.addEventListener('click', async ()=>{
    const chart = await window.calcChartWithDB({gregorian:'1991-06-28', hourZhi:'午', gender:'男', location:'台北'});
    E.renderChart(chart);
    window.__CURRENT_CHART__ = chart;
  });

  btnExport.addEventListener('click', ()=>{
    E.exportJSON(window.__CURRENT_CHART__);
  });

  btnPNG.addEventListener('click', E.downloadPNG);

  fontScale.addEventListener('input', ()=>{
    document.documentElement.style.fontSize = (fontScale.value * 100) + '%';
  });
  darkMode.addEventListener('change', ()=>{
    document.body.style.background = darkMode.checked ? '#0f1115' : '#f7f7f9';
    document.body.style.color = darkMode.checked ? '#eef1f5' : '#111';
  });

  document.getElementById('btnSample').click();
}
document.addEventListener('DOMContentLoaded', init);
