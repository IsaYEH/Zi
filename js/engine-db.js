
const DIZHI = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const PALACES_CCW = ["命","兄弟","夫妻","子女","財帛","疾厄","遷移","僕役","事業","田宅","福德","父母"];

function mod12(n){ return (n%12+12)%12; }
function idx(b){ return DIZHI.indexOf(b); }
function branchByOffset(startBranch, direction, steps){
  const s = idx(startBranch);
  const step = direction==='cw' ? steps : -steps;
  return DIZHI[mod12(s + step)];
}
function hourIndex(zhi){ return idx(zhi); }

async function loadDB(){
  const files = [
    'metadata.json','palaces.json','stems_branches.json',
    'rules_main_stars.json','rules_auxiliary_stars.json',
    'rules_four_hua.json','rules_five_bureau.json','rules_ming_shen.json'
  ];
  const out = {};
  for (const f of files){
    const res = await fetch(`./data/${f}`);
    out[f.replace('.json','')] = await res.json();
  }
  return out;
}

// Approximate Li-Chun boundary for year stem/branch
function approxYearStemBranch(dateStr){
  const [y,m,d] = dateStr.split('-').map(Number);
  const y2 = (m<2 || (m===2 && d<4)) ? y-1 : y; // Treat before Feb 4 as previous year
  const stems = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
  const branches = DIZHI;
  return { stem: stems[(y2 - 4) % 10], branch: branches[(y2 - 4) % 12] };
}

function buildPalaces(mingBranch){
  const start = idx(mingBranch);
  return PALACES_CCW.map((name, i)=>({ name, branch: DIZHI[mod12(start+i)], stars: [] }));
}

function locateMingShen(db, lunarMonth, hourBranch){
  const rule = db.rules_ming_shen["命身宮定位"].algorithm;
  const start = rule.start_branch; // 寅
  const monthPal = branchByOffset(start, rule.month_count_direction, lunarMonth-1);
  const ming = branchByOffset(monthPal, rule.ming_hour_direction, hourIndex(hourBranch));
  const shen = branchByOffset(monthPal, rule.shen_hour_direction, hourIndex(hourBranch));
  return {ming, shen};
}

function placeMainStars(db, palaces, ziweiAnchorBranch){
  const palIndexByBranch = Object.fromEntries(palaces.map((p,i)=>[p.branch, i]));
  const zRule = db.rules_main_stars.ziwei_series_rule;
  const tRule = db.rules_main_stars.tianfu_series_rule;
  const mapZF = db.rules_main_stars.ziwei_to_tianfu_mapping;
  // 紫微 anchor
  const ZB = ziweiAnchorBranch || palaces[0].branch;
  const zi = palIndexByBranch[ZB];
  palaces[zi].stars.push({ name:'紫微', type:'major' });
  // offsets_from_anchor use signed steps (ccw negative)
  for (const [star, off] of Object.entries(zRule.offsets_from_anchor)){
    const idx2 = mod12(zi + off);
    palaces[idx2].stars.push({ name:star, type:'major' });
  }
  // 天府 anchor from mapping
  const tfBranch = mapZF[ZB];
  const tfIdx = palIndexByBranch[tfBranch];
  if (tfIdx!=null){
    palaces[tfIdx].stars.push({ name:'天府', type:'major' });
    for (const [star, off] of Object.entries(tRule.offsets_from_anchor)){
      const idx2 = mod12(tfIdx + off);
      palaces[idx2].stars.push({ name:star, type:'major' });
    }
  }
}

function placeAuxStars(db, palaces, context){
  const { lunarMonth, hourBranch, yearStem, yearBranch } = context;
  const rules = db.rules_auxiliary_stars.rules;
  const palIndexByBranch = Object.fromEntries(palaces.map((p,i)=>[p.branch, i]));
  const place = (star, branch)=>{
    if(branch==null) return;
    const idxp = palIndexByBranch[branch];
    if (idxp==null) return;
    palaces[idxp].stars.push({ name:star, type:'aux' });
  };
  for (const r of rules){
    if (r.basis==='month'){
      const b = branchByOffset(r.start_branch, r.direction, lunarMonth-1);
      place(r.star, b);
    } else if (r.basis==='hour'){
      const b = branchByOffset(r.start_branch, r.direction, hourIndex(hourBranch));
      place(r.star, b);
    } else if (r.basis==='year_stem' && r.star==='祿存'){
      const b = r.mapping[yearStem];
      place('祿存', b);
      // 擎羊、陀羅相對祿存
      place('擎羊', branchByOffset(b, 'cw', 1));
      place('陀羅', branchByOffset(b, 'ccw', 1));
    } else if (r.basis==='year_branch_quadrant' && r.star==='天馬'){
      let dest=null;
      for (const group in r.mapping){
        if (group.includes(yearBranch)){ dest = r.mapping[group]; break; }
      }
      place('天馬', dest);
    } else if (r.basis==='year_branch_plus_hour' && r.star==='火星/鈴星'){
      const table = {
        "寅午戌": ["丑","卯"],
        "申子辰": ["寅","戌"],
        "巳酉丑": ["卯","戌"],
        "亥卯未": ["酉","戌"]
      };
      let starts=null;
      for (const k in table){ if (k.includes(yearBranch)) { starts = table[k]; break; } }
      if (starts){
        const fire = branchByOffset(starts[0], 'cw', hourIndex(hourBranch));
        const bell = branchByOffset(starts[1], 'cw', hourIndex(hourBranch));
        place('火星', fire);
        place('鈴星', bell);
      }
    }
  }
}

function applySihua(db, palaces, yearStem, variant='108s_tw'){
  const table = db.rules_four_hua.variants?.[variant]?.table || {};
  const mapping = table[yearStem] || {};
  palaces.forEach(cell=>{
    cell.stars.forEach(s=>{
      for (const tag in mapping){
        if (s.name === mapping[tag]) s.sihua = tag; // 祿/權/科/忌
      }
    });
  });
}

function fiveBureau(db, stem){
  return db.rules_five_bureau.stem_to_bureau?.[stem] || "（未知）";
}

export async function calcChartWithDB(input){
  const db = await loadDB();
  const { stem, branch } = approxYearStemBranch(input.gregorian);
  const lunarMonth = input.lunarMonth && Number(input.lunarMonth) ? Number(input.lunarMonth) : (new Date(input.gregorian+'T12:00:00').getMonth()+1);
  // 命/身宮
  const ms = locateMingShen(db, lunarMonth, input.hourZhi);
  // 宮盤
  const palaces = buildPalaces(ms.ming);
  // 主星（以命宮分支作為紫微錨點；必要時可從 UI 提供校正）
  placeMainStars(db, palaces, palaces[0].branch);
  // 輔星
  placeAuxStars(db, palaces, { lunarMonth, hourBranch: input.hourZhi, yearStem: stem, yearBranch: branch });
  // 四化
  if (document.getElementById('toggleSihua')?.checked) applySihua(db, palaces, stem, '108s_tw');
  // 五行局
  const bureau = fiveBureau(db, stem);

  return {
    meta:{
      gregorian: input.gregorian,
      hour: input.hourZhi,
      sex: input.gender,
      location: input.location,
      heavenlyStem: stem,
      earthlyBranchYear: branch,
      fivePhaseBureau: bureau,
      lunarMonth
    },
    palaces
  };
}
