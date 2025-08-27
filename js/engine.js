// Basic parse / render (same as earlier), but buildChart will be replaced by DB engine.
const R = window.__ZIWEI_RULES__;
function parseInput() {
  const gregorian = document.getElementById('gregorian').value.trim();
  const hourZhi = document.getElementById('hourZhi').value;
  const gender = document.getElementById('gender').value;
  const location = document.getElementById('location').value.trim();
  const lunarMonth = document.getElementById('lunarMonth')?.value.trim();
  return { gregorian, hourZhi, gender, location, lunarMonth };
}

function renderChart(chart){
  const board = document.getElementById('board');
  board.innerHTML = '';
  R.PALACES.forEach((name, idx)=>{
    const cell = chart.palaces[idx];
    const wrap = document.createElement('div');
    wrap.className = 'cell';
    const head = document.createElement('div');
    head.className = 'title';
    head.innerHTML = `<div>${cell.branch}｜${cell.name}宮</div>
                      <div class="badges">
                        <span class="badge">${chart.meta.heavenlyStem}${chart.meta.earthlyBranchYear}年</span>
                      </div>`;
    const stars = document.createElement('div');
    stars.className = 'stars';

    cell.stars.forEach(st=>{
      const tag = document.createElement('span');
      tag.className = 'tag ' + (st.type==='major' ? 'major' : 'aux');
      tag.textContent = st.name;
      if (st.sihua) {
        const sh = document.createElement('span');
        sh.className = 'badge';
        sh.textContent = st.sihua;
        sh.style.borderColor = '#ffcc66';
        sh.style.color = '#ffcc66';
        tag.appendChild(document.createTextNode(' '));
        tag.appendChild(sh);
      }
      stars.appendChild(tag);
    });

    wrap.appendChild(head);
    wrap.appendChild(stars);
    board.appendChild(wrap);
  });

  const status = document.getElementById('status');
  status.textContent = `${chart.meta.gregorian} ${chart.meta.hour}時｜${chart.meta.sex}｜${chart.meta.location || '—'}｜五行局：${chart.meta.fivePhaseBureau}`;
}

function exportJSON(chart){
  const blob = new Blob([JSON.stringify(chart, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ziwei_chart.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadPNG(){
  const node = document.getElementById('board');
  const rect = node.getBoundingClientRect();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
    <foreignObject x="0" y="0" width="100%" height="100%">
      ${new XMLSerializer().serializeToString(node)}
    </foreignObject>
  </svg>`;
  const blob = new Blob([svg], {type:'image/svg+xml;charset=utf-8'});
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();

  const canvas = document.createElement('canvas');
  canvas.width = rect.width; canvas.height = rect.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#0f1115';
  ctx.fillRect(0,0,canvas.width, canvas.height);
  ctx.drawImage(img,0,0);
  URL.revokeObjectURL(url);

  canvas.toBlob(b=>{
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'ziwei_board.png';
    a.click();
  });
}

window.__ZIWEI_ENGINE__ = { parseInput, renderChart, exportJSON, downloadPNG };
