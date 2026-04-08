// ════════════════════════════════════════
//  상담진행 패널 (consult panel)
// ════════════════════════════════════════

import { foodState, setBizType, checkFoodIndustry, resetFoodState } from './modal.js';
import { showToast } from './toast.js';

// ── Panel open / close ────────────────────────────────────────────

export function openConsultPanel() {
  document.getElementById('consultPanel').classList.add('open');
  requestAnimationFrame(() => { requestAnimationFrame(csCalcProgress); });
}
export function closeConsultPanel() {
  document.getElementById('consultPanel').classList.remove('open');
}

// ── Region selectors ──────────────────────────────────────────────

export const CS_SIGUNGU = {
  '서울특별시':['종로구','중구','용산구','성동구','광진구','동대문구','중랑구','성북구','강북구','도봉구','노원구','은평구','서대문구','마포구','양천구','강서구','구로구','금천구','영등포구','동작구','관악구','서초구','강남구','송파구','강동구'],
  '부산광역시':['중구','서구','동구','영도구','부산진구','동래구','남구','북구','해운대구','사하구','금정구','강서구','연제구','수영구','사상구','기장군'],
  '대구광역시':['중구','동구','서구','남구','북구','수성구','달서구','달성군','군위군'],
  '인천광역시':['중구','동구','미추홀구','연수구','남동구','부평구','계양구','서구','강화군','옹진군'],
  '광주광역시':['동구','서구','남구','북구','광산구'],
  '대전광역시':['동구','중구','서구','유성구','대덕구'],
  '울산광역시':['중구','남구','동구','북구','울주군'],
  '세종특별자치시':['세종시'],
  '경기도':['수원시 장안구','수원시 권선구','수원시 팔달구','수원시 영통구','성남시 수정구','성남시 중원구','성남시 분당구','의정부시','안양시 만안구','안양시 동안구','부천시','광명시','평택시','동두천시','안산시 상록구','안산시 단원구','고양시 덕양구','고양시 일산동구','고양시 일산서구','과천시','구리시','남양주시','오산시','시흥시','군포시','의왕시','하남시','용인시 처인구','용인시 기흥구','용인시 수지구','파주시','이천시','안성시','김포시','화성시','광주시','양주시','포천시','여주시','연천군','가평군','양평군'],
  '강원특별자치도':['춘천시','원주시','강릉시','동해시','태백시','속초시','삼척시','홍천군','횡성군','영월군','평창군','정선군','철원군','화천군','양구군','인제군','고성군','양양군'],
  '충청북도':['청주시 상당구','청주시 서원구','청주시 흥덕구','청주시 청원구','충주시','제천시','보은군','옥천군','영동군','증평군','진천군','괴산군','음성군','단양군'],
  '충청남도':['천안시 동남구','천안시 서북구','공주시','보령시','아산시','서산시','논산시','계룡시','당진시','금산군','부여군','서천군','청양군','홍성군','예산군','태안군'],
  '전북특별자치도':['전주시 완산구','전주시 덕진구','군산시','익산시','정읍시','남원시','김제시','완주군','진안군','무주군','장수군','임실군','순창군','고창군','부안군'],
  '전라남도':['목포시','여수시','순천시','나주시','광양시','담양군','곡성군','구례군','고흥군','보성군','화순군','장흥군','강진군','해남군','영암군','무안군','함평군','영광군','장성군','완도군','진도군','신안군'],
  '경상북도':['포항시 남구','포항시 북구','경주시','김천시','안동시','구미시','영주시','영천시','상주시','문경시','경산시','의성군','청송군','영양군','영덕군','청도군','고령군','성주군','칠곡군','예천군','봉화군','울진군','울릉군'],
  '경상남도':['창원시 의창구','창원시 성산구','창원시 마산합포구','창원시 마산회원구','창원시 진해구','진주시','통영시','사천시','김해시','밀양시','거제시','양산시','의령군','함안군','창녕군','고성군','남해군','하동군','산청군','함양군','거창군','합천군'],
  '제주특별자치도':['제주시','서귀포시'],
};

export function csUpdateSigungu() {
  const sido = document.getElementById('cs-sido').value;
  const sg   = document.getElementById('cs-sigungu');
  sg.innerHTML = '<option value="">시·군·구</option>';
  if (CS_SIGUNGU[sido]) {
    CS_SIGUNGU[sido].forEach(n => { const o = document.createElement('option'); o.textContent = n; sg.appendChild(o); });
  }
  document.getElementById('cs-region').value = sido || '';
  csCalcProgress();
}
export function csUpdateRegion() {
  const sido = document.getElementById('cs-sido').value;
  const sg   = document.getElementById('cs-sigungu').value;
  document.getElementById('cs-region').value = sg ? `${sido} ${sg}` : sido;
  csCalcProgress();
}

// ── Pill helpers ──────────────────────────────────────────────────

// Dispatch map replaces eval() for data-csonchange
const CS_ONCHANGE_DISPATCH = {
  'csToggleIndustry':    () => csToggleIndustry(),
  'csToggleBizRent':     () => csToggleBizRent(),
  'csToggleDetail':      (arg) => csToggleDetail(arg),
  'csToggleLoan':        (arg) => csToggleLoan(arg),
};

export function csPillClick(el) {
  const name       = el.dataset.csname;
  const isSelected = el.classList.contains('selected');
  document.querySelectorAll(`#consultPanel .cs-pill[data-csname="${name}"]`).forEach(p => p.classList.remove('selected'));
  if (!isSelected) el.classList.add('selected');
  const onch = el.dataset.csonchange;
  if (onch) {
    const m = onch.match(/^(\w+)\((?:'([^']*)')?\)$/);
    if (m) {
      const fn = CS_ONCHANGE_DISPATCH[m[1]];
      if (fn) fn(m[2]);
    }
  }
  csCalcProgress();
}

export function csGetPill(name) {
  const el = document.querySelector(`#consultPanel .cs-pill.selected[data-csname="${name}"]`);
  return el ? { value: el.dataset.csval } : null;
}

// ── Toggle helpers ────────────────────────────────────────────────

export function csToggleIndustry() {
  const v = csGetPill('industryType');
  document.getElementById('cs-foodDetail').style.display      = (v && v.value === '음식점') ? 'block' : 'none';
  document.getElementById('cs-etcDetail').style.display       = (v && v.value === '그외')   ? 'block' : 'none';
  document.getElementById('cs-transportDetail').style.display = (v && v.value === '운수업') ? 'block' : 'none';
  csCalcProgress();
}
export function csToggleDetail(name) {
  const v = csGetPill(name);
  const d = document.getElementById('cs-' + name + 'Detail');
  if (!d) return;
  const show = v && (v.value === 'O' || v.value === '있음' || v.value === '수령');
  d.style.display = show ? 'block' : 'none';
  csCalcProgress();
}
export function csToggleLoan(type) {
  if (type === 'credit') {
    const v = csGetPill('creditLoan');
    document.getElementById('cs-creditLoanDetail').style.display = (v && v.value === '있음') ? 'block' : 'none';
  } else {
    const v = csGetPill('bizLoan');
    document.getElementById('cs-bizLoanDetail').style.display = (v && v.value === '있음') ? 'block' : 'none';
  }
  csCalcProgress();
}
export function csToggleBizRent() {
  const v = csGetPill('bizOwnership');
  document.getElementById('cs-bizRentDiv').style.display = (v && v.value === '전월세') ? 'grid' : 'none';
  csCalcProgress();
}
export function csToggleScore(type, btn) {
  const hidden = document.getElementById('cs-' + type + 'Unk');
  const inp    = document.getElementById('cs-' + type);
  const dot    = document.getElementById('cs-' + type + 'Dot');
  const isOn   = hidden.value === 'true';
  const newOn  = !isOn;
  hidden.value = String(newOn);
  if (btn) {
    btn.dataset.on = String(newOn);
    if (newOn) btn.classList.add('selected'); else btn.classList.remove('selected');
  }
  if (dot) dot.style.background = newOn ? '#34d399' : 'rgba(255,255,255,0.22)';
  inp.disabled      = newOn;
  inp.style.opacity = newOn ? '0.35' : '1';
  if (newOn) inp.value = '';
  csCalcProgress();
}

// ── Scroll to field ───────────────────────────────────────────────

export function csScrollToField(anchorId) {
  const el = document.getElementById(anchorId);
  if (!el) return;
  const isInput = el.matches('input, select, textarea');
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    el.style.transition = 'outline .2s, box-shadow .2s';
    el.style.outline    = '2px solid #34d399';
    el.style.boxShadow  = '0 0 0 4px rgba(52,211,153,0.25)';
    if (isInput) el.focus();
    setTimeout(() => { el.style.outline = ''; el.style.boxShadow = ''; }, 1800);
  }, 380);
}

// ── Progress calculation ──────────────────────────────────────────

const CS_ANCHOR_MAP = {
  '성함':'cs-name','출생연도':'cs-birth','지역':'cs-sido','주거래은행':'cs-bank',
  '개인/법인':'cs-biz-type-block','업종':'cs-industry-block','상호명':'cs-bizName',
  '사업기간':'cs-bizPeriod','매출현황':'cs-revenue','필요자금':'cs-needFund',
  '직원수':'cs-employee','신용평점':'cs-score-wrap','정책자금 대출':'cs-guarantee-block',
  '일반신용 대출':'cs-loan-block','사업자 대출':'cs-loan-block','신용카드':'cs-loan-block',
  '연체여부':'cs-loan-block','국세·지방세':'cs-tax-block','압류·가압류':'cs-tax-block',
  '보유부동산':'cs-tax-block','방역지원금':'cs-tax-block','상가 소유형태':'cs-ownership-block',
  '자택 소유형태':'cs-ownership-block','상가-자택 동일':'cs-ownership-block',
};

const CS_FIELDS = [
  { l:'성함',          c:()=>!!document.getElementById('cs-name').value.trim() },
  { l:'출생연도',       c:()=>!!document.getElementById('cs-birth').value.trim() },
  { l:'지역',          c:()=>!!document.getElementById('cs-region').value },
  { l:'주거래은행',     c:()=>!!document.getElementById('cs-bank').value },
  { l:'개인/법인',      c:()=>!!csGetPill('bizType') },
  { l:'업종',          c:()=>{ const v=csGetPill('industryType'); if(!v) return false; if(v.value==='음식점'||v.value==='운수업') return true; return !!document.getElementById('cs-industryText').value.trim(); }},
  { l:'상호명',         c:()=>!!document.getElementById('cs-bizName').value.trim() },
  { l:'사업기간',       c:()=>!!document.getElementById('cs-bizPeriod').value.trim() },
  { l:'매출현황',       c:()=>!!document.getElementById('cs-revenue').value.trim() },
  { l:'필요자금',       c:()=>!!document.getElementById('cs-needFund').value.trim() },
  { l:'직원수',         c:()=>!!document.getElementById('cs-employee').value.trim() },
  { l:'신용평점',       c:()=>{ const ku=document.getElementById('cs-kcbUnk').value==='true'; const nu=document.getElementById('cs-niceUnk').value==='true'; const kv=document.getElementById('cs-kcb').value.trim(); const nv=document.getElementById('cs-nice').value.trim(); return ku||nu||!!kv||!!nv; }},
  { l:'정책자금 대출',  c:()=>!!csGetPill('guaranteeLoan') },
  { l:'일반신용 대출',  c:()=>!!csGetPill('creditLoan') },
  { l:'사업자 대출',    c:()=>!!csGetPill('bizLoan') },
  { l:'신용카드',       c:()=>!!csGetPill('creditCard') },
  { l:'연체여부',       c:()=>!!csGetPill('overdue') },
  { l:'국세·지방세',    c:()=>!!csGetPill('tax') },
  { l:'압류·가압류',    c:()=>!!csGetPill('seizure') },
  { l:'보유부동산',     c:()=>!!csGetPill('realEstate') },
  { l:'방역지원금',     c:()=>!!csGetPill('covidFund') },
  { l:'상가 소유형태',  c:()=>!!csGetPill('bizOwnership') },
  { l:'자택 소유형태',  c:()=>!!csGetPill('homeOwnership') },
  { l:'상가-자택 동일', c:()=>!!csGetPill('addrMatch') },
];

function csLaunchConfetti() {
  if (document.getElementById('cs-confettiCanvas')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'cs-confettiCanvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const COLORS = ['#f97316','#facc15','#4ade80','#34d399','#60a5fa','#818cf8','#f472b6','#fb7185','#a78bfa'];
  const SHAPES = ['rect','circle','star'];
  const particles = [];
  [0.2,0.5,0.8].forEach(ox => {
    for (let i=0; i<60; i++) {
      const angle=(Math.random()*160+10)*Math.PI/180, speed=Math.random()*9+4;
      particles.push({x:canvas.width*ox+(Math.random()-0.5)*40,y:canvas.height*0.15,vx:Math.cos(angle)*speed*(Math.random()>0.5?1:-1),vy:-Math.abs(Math.sin(angle)*speed)-2,color:COLORS[Math.floor(Math.random()*COLORS.length)],shape:SHAPES[Math.floor(Math.random()*SHAPES.length)],size:Math.random()*8+4,rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*0.2,alpha:1,gravity:0.18+Math.random()*0.1});
    }
  });
  function drawStar(c,x,y,r){c.beginPath();for(let i=0;i<5;i++){const a1=(i*4*Math.PI/5)-Math.PI/2,a2=(i*4*Math.PI/5+2*Math.PI/5)-Math.PI/2;i===0?c.moveTo(x+r*Math.cos(a1),y+r*Math.sin(a1)):c.lineTo(x+r*Math.cos(a1),y+r*Math.sin(a1));c.lineTo(x+r*0.4*Math.cos(a2),y+r*0.4*Math.sin(a2));}c.closePath();c.fill();}
  let frame=0;
  (function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive=false;
    particles.forEach(p=>{if(p.alpha<=0) return; alive=true; p.x+=p.vx;p.y+=p.vy;p.vy+=p.gravity;p.vx*=0.99;p.rot+=p.rotV;if(frame>80)p.alpha-=0.018;if(p.y>canvas.height)p.alpha=0;ctx.save();ctx.globalAlpha=Math.max(0,p.alpha);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.rot);if(p.shape==='rect')ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);else if(p.shape==='circle'){ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}else drawStar(ctx,0,0,p.size/2);ctx.restore();});
    frame++;
    if(alive&&frame<200) requestAnimationFrame(animate); else canvas.remove();
  })();
}

export function csCalcProgress() {
  const missing = CS_FIELDS.filter(f => !f.c()).map(f => f.l);
  const pct     = Math.round((CS_FIELDS.length - missing.length) / CS_FIELDS.length * 100);

  const pctEl    = document.getElementById('cs-pct');
  const fill     = document.getElementById('cs-fill');
  const train    = document.getElementById('cs-train');
  const puff1    = document.getElementById('cs-puff1');
  const puff2    = document.getElementById('cs-puff2');
  const wrap     = document.getElementById('cs-trackWrap');
  const progWrap = document.getElementById('cs-progress-wrap');
  if (!pctEl) return;

  pctEl.textContent = pct + '%';
  fill.style.width  = pct + '%';

  const maxLeft  = Math.max(0, (wrap.offsetWidth || 400) - 26);
  const trainLeft= Math.max(0, Math.round(pct / 100 * maxLeft));
  train.style.left = trainLeft + 'px';

  if (pct === 100) {
    train.textContent = '🎉';
    [puff1,puff2].forEach(p => { p.style.opacity='0'; p.style.animation='none'; });
    csLaunchConfetti();
    if (progWrap) progWrap.classList.add('pct100');
  } else {
    train.textContent = '🚂';
    if (progWrap) progWrap.classList.remove('pct100');
    const cc = document.getElementById('cs-confettiCanvas'); if (cc) cc.remove();
    if (pct > 0) {
      [puff1,puff2].forEach(p => { p.style.left=(trainLeft-2)+'px'; p.style.bottom='28px'; p.style.opacity=''; p.style.animation=''; });
    } else {
      [puff1,puff2].forEach(p => { p.style.opacity='0'; p.style.animation='none'; p.style.left='0px'; });
    }
  }

  const pctColors=[{p:0,c:'#f97316'},{p:20,c:'#facc15'},{p:40,c:'#4ade80'},{p:60,c:'#3b82f6'},{p:80,c:'#38bdf8'},{p:100,c:'#818cf8'}];
  function lerpHex(p) {
    for(let i=0;i<pctColors.length-1;i++){
      const a=pctColors[i],b=pctColors[i+1];
      if(p>=a.p&&p<=b.p){const t=(p-a.p)/(b.p-a.p);const ah=a.c.replace('#',''),bh=b.c.replace('#','');const r=s=>parseInt(s,16);return '#'+['0,2','2,4','4,6'].map(v=>{const[s,e]=v.split(',').map(Number);return Math.round(r(ah.slice(s,e))+(r(bh.slice(s,e))-r(ah.slice(s,e)))*t).toString(16).padStart(2,'0');}).join('');}
    }
    return pctColors.at(-1).c;
  }
  pctEl.style.color = lerpHex(pct);

  const remDiv  = document.getElementById('cs-remaining');
  const remList = document.getElementById('cs-remainingList');
  if (pct >= 80 && pct < 100) {
    remList.innerHTML = missing.map(l => {
      const aid = CS_ANCHOR_MAP[l];
      return aid
        ? `<span onclick="csScrollToField('${aid}')" style="cursor:pointer;text-decoration:underline;text-decoration-style:dotted;color:rgba(255,255,255,0.85);transition:color .15s;" onmouseover="this.style.color='#34d399'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">${l}</span>`
        : `<span style="color:rgba(255,255,255,0.85);">${l}</span>`;
    }).join('<span style="color:rgba(255,255,255,0.4);"> · </span>');
    remDiv.classList.add('show');
  } else {
    remDiv.classList.remove('show');
  }
}

// ── Text generation helpers ───────────────────────────────────────

function csFmtAmt(val) {
  if (!val) return '';
  const t = val.trim().replace(/,/g, '');
  if (!/^\d+$/.test(t)) return val.trim();
  const n = parseInt(t, 10);
  if (n >= 10000) { const e=Math.floor(n/10000),m=n%10000; return m?`${e}억 ${m}만`:`${e}억`; }
  return `${n}만`;
}
function csBuildScore() {
  const ku=document.getElementById('cs-kcbUnk').value==='true', nu=document.getElementById('cs-niceUnk').value==='true';
  const kv=document.getElementById('cs-kcb').value.trim(), nv=document.getElementById('cs-nice').value.trim();
  const ks=ku?'모름':(kv?kv+'점':''), ns=nu?'모름':(nv?nv+'점':'');
  if(ks==='모름'&&ns==='모름') return '모름';
  if(ks&&ns) return `KCB: ${ks} / NICE: ${ns}`;
  return ks||ns||'';
}
function csBuildLoan() {
  const cv=csGetPill('creditLoan'), bv=csGetPill('bizLoan'), ccv=csGetPill('creditCard');
  const ct=document.getElementById('cs-creditLoanText').value.trim();
  const bt=document.getElementById('cs-bizLoanText').value.trim();
  let cardStr='';
  if(ccv&&ccv.value==='O'){const cl=document.getElementById('cs-cardLoan').value.trim();const cs2=document.getElementById('cs-cashService').value.trim();const parts=[];if(cl)parts.push(`카드론 ${cl}`);if(cs2)parts.push(`현금서비스 ${cs2}`);cardStr=parts.length?`신용카드: ${parts.join(', ')}`:'신용카드: 있음';}
  const cStr=cv?(cv.value==='없음'?'일반신용: 없음':`일반신용: ${ct||'있음'}`):'';
  const bStr=bv?(bv.value==='없음'?'사업자대출: 없음':`사업자대출: ${bt||'있음'}`):'';
  const all=[cStr,bStr,cardStr].filter(Boolean);
  if(!all.length) return '';
  if(cv?.value==='없음'&&bv?.value==='없음'&&!cardStr) return '없음';
  return all.join('\n  ');
}
function csBuildOX(name) {
  const v=csGetPill(name); if(!v) return '';
  if(v.value==='X') return 'X';
  const d=document.getElementById('cs-'+name+'Text');
  const t=d?d.value.trim():'';
  return t?`O (${t})`:'O';
}

// ── Generate & copy ───────────────────────────────────────────────

export function csGenerate() {
  const v = id => document.getElementById(id)?.value?.trim() || '';
  const bizOwn=csGetPill('bizOwnership'); const bizOwnV=bizOwn?bizOwn.value:'';
  let rentStr='';
  if(bizOwnV==='전월세'){const dep=csFmtAmt(v('cs-bizDeposit')),rent=csFmtAmt(v('cs-bizRent'));rentStr=`전월세 (보증금 ${dep||'-'}, 월세 ${rent||'-'})`;}
  else rentStr=bizOwnV;

  const homeOwn=csGetPill('homeOwnership');
  const addrMatch=csGetPill('addrMatch');
  const industryV=csGetPill('industryType');
  const bizTypeV=csGetPill('bizType');
  const sfx=bizTypeV?`(${bizTypeV.value==='개인사업자'?'개인':'법인'})`:'';
  let industryStr='';
  if(industryV){
    if(industryV.value==='음식점'){const ki=csGetPill('kiosk'),to=csGetPill('tableOrder'),del=csGetPill('delivery');const parts=[sfx?`음식점${sfx}`:'음식점'];if(ki)parts.push(`키오스크 ${ki.value}`);if(to)parts.push(`테이블오더 ${to.value}`);if(del)parts.push(`배달 ${del.value}`);industryStr=parts.join(' / ');}
    else if(industryV.value==='운수업'){const tr=csGetPill('transportType');industryStr=`운수업${tr?'-'+tr.value:''}${sfx}`;}
    else{industryStr=v('cs-industryText')+(sfx?' '+sfx:'');}
  } else if(sfx) industryStr=sfx;

  const gv=csGetPill('guaranteeLoan');
  let gStr='';
  if(gv){if(gv.value==='없음')gStr='없음';else{const t=v('cs-guaranteeLoanText');gStr=t||'있음';}}
  const covidV=csGetPill('covidFund');
  const covidStr=covidV?(covidV.value==='미수령'?'미수령':`수령 (${v('cs-covidFundText')||''})`):'';
  const loan=csBuildLoan();
  const needFund=csFmtAmt(v('cs-needFund'));
  const etc=v('cs-etcNote');

  const result=
`- 성함 : ${v('cs-name')}
- 대표자 출생 연도 : ${v('cs-birth')}
- 지역(시,군,구) : ${v('cs-region')}
- 상호명 : ${v('cs-bizName')}
- 업종(매출구조 정확히 파악) : ${industryStr}
- 사업기간 : ${v('cs-bizPeriod')}
- 매출현황(연 매출or월 평균매출) : ${v('cs-revenue')}
- 정책자금 대출 : ${gStr}
- 기 대출 현황(일반신용/사업자대출 각각 기재) : ${loan.includes('\n')?'\n  '+loan:loan}
- 연체(연체기록) 여부 : ${csBuildOX('overdue')}
- 국세, 지방세 미납(유예,분납) 여부 : ${csBuildOX('tax')}
- 압류, 가압류, 가등기 여부 : ${csBuildOX('seizure')}
- 보유부동산 여부 : ${csBuildOX('realEstate')}
- 신용평점 : ${csBuildScore()}
- 방역지원금(1차/2차/손실보전금) : ${covidStr}
- 직원 수(4대보험 가입기준) : ${v('cs-employee')}
- 필요자금 : ${needFund}
- 상가 임대차계약서(보증금/월세) : ${rentStr}
- 자택 소유 형태 : ${homeOwn?homeOwn.value:''}
- 상가-자택 동일여부 : ${addrMatch?addrMatch.value:''}
- 주거래은행 : ${v('cs-bank')}${etc?'\n\n[ 기타사항 ]\n'+etc:''}`;

  document.getElementById('cs-result').value = result;
  document.getElementById('cs-charcount').textContent = result.length.toLocaleString() + ' chars';

  const CS_REQUIRED = ['사업기간','업종','매출현황','필요자금','연체여부','국세·지방세','압류·가압류'];
  const csReqMissing = CS_FIELDS.filter(f => CS_REQUIRED.includes(f.l) && !f.c()).map(f => f.l);
  const missingEl  = document.getElementById('cs-missing');
  const resultTa   = document.getElementById('cs-result');
  if (csReqMissing.length) {
    missingEl.textContent = '⚠️ 필수항목 미입력: ' + csReqMissing.join(', ');
    missingEl.classList.add('show');
    resultTa.classList.remove('warn-glow');
    void resultTa.offsetWidth;
    resultTa.classList.add('warn-glow');
    resultTa.addEventListener('animationend', () => resultTa.classList.remove('warn-glow'), { once: true });
  } else {
    missingEl.classList.remove('show');
    missingEl.textContent = '';
  }
}

export function csCopy() {
  const ta = document.getElementById('cs-result');
  if (!ta.value) return;
  navigator.clipboard.writeText(ta.value).then(() => {
    const btn = document.getElementById('cs-copyBtn');
    btn.textContent = '✓ 복사완료!';
    setTimeout(() => { btn.textContent = '⎘ 복사'; }, 2000);
  });
}

// ── Send to CRM ───────────────────────────────────────────────────

export function csSendToCRM() {
  const v = id => document.getElementById(id)?.value?.trim() || '';
  const industryV=csGetPill('industryType');
  const bizTypeV=csGetPill('bizType');
  const transportV=csGetPill('transportType');
  const sfx=bizTypeV?`(${bizTypeV.value==='개인사업자'?'개인':'법인'})`:'';
  let industryStr='';
  if(industryV){
    if(industryV.value==='음식점') industryStr=sfx?`음식점${sfx}`:'음식점';
    else if(industryV.value==='운수업') industryStr=`운수업${transportV?'-'+transportV.value:''}${sfx}`;
    else industryStr=v('cs-industryText')+(sfx?' '+sfx:'');
  }
  const consult = document.getElementById('cs-result')?.value?.trim() || '';

  closeConsultPanel();
  document.getElementById('mTitle').textContent = '신규 고객 등록 (상담 자동입력)';
  const FIDS_ALL=['f-name','f-phone','f-carrier','f-email','f-birth','f-rrn','f-gender','f-homeaddr','f-bizname','f-bizno','f-industry','f-region','f-period','f-revenue','f-employee','f-bank','f-bizaddr','f-consultDate','f-applyDate','f-plan','f-contractDate','f-actualFund','f-fundDate','f-collectDate','f-collected','f-score','f-naver','f-homeownership','f-credit','f-stepIdx','f-consult','f-note'];
  FIDS_ALL.forEach(fid => { const el=document.getElementById(fid); if(el) el.value=(fid==='f-stepIdx')?'1':''; });

  document.getElementById('f-name').value     = v('cs-name');
  document.getElementById('f-birth').value    = v('cs-birth');
  document.getElementById('f-region').value   = v('cs-region');
  document.getElementById('f-bizname').value  = v('cs-bizName');
  document.getElementById('f-industry').value = industryStr;
  document.getElementById('f-period').value   = v('cs-bizPeriod');
  document.getElementById('f-revenue').value  = v('cs-revenue');
  document.getElementById('f-employee').value = v('cs-employee');
  document.getElementById('f-bank').value     = v('cs-bank');
  document.getElementById('f-consult').value  = consult;

  const kcbU=document.getElementById('cs-kcbUnk').value==='true', niceU=document.getElementById('cs-niceUnk').value==='true';
  const kcbV=v('cs-kcb'), niceV=v('cs-nice');
  const ks=kcbU?'모름':(kcbV?kcbV+'점':''), ns=niceU?'모름':(niceV?niceV+'점':'');
  if(ks||ns) document.getElementById('f-score').value = (ks&&ns?`KCB: ${ks} / NICE: ${ns}`:ks||ns);

  setBizType(bizTypeV?.value === '법인사업자' ? 'corp' : 'sole');

  checkFoodIndustry();
  resetFoodState();
  if (industryV?.value === '음식점') {
    const ki=csGetPill('kiosk'), to=csGetPill('tableOrder'), del=csGetPill('delivery');
    if(ki){ foodState.kiosk=(ki.value==='있음'); const b=document.getElementById('fb-kiosk'); if(b){b.className='food-toggle-btn '+(foodState.kiosk?'on':'off');b.textContent='키오스크 '+(foodState.kiosk?'✓':'✕');} }
    if(to){ foodState.table=(to.value==='있음'); const b=document.getElementById('fb-table'); if(b){b.className='food-toggle-btn '+(foodState.table?'on':'off');b.textContent='테이블오더 '+(foodState.table?'✓':'✕');} }
    if(del){ foodState.delivery=(del.value==='운영중'); const b=document.getElementById('fb-delivery'); if(b){b.className='food-toggle-btn '+(foodState.delivery?'on':'off');b.textContent='배달운영 '+(foodState.delivery?'✓':'✕');} const dinp=document.getElementById('f-delivery-apps'); if(dinp) dinp.style.display=foodState.delivery?'block':'none'; }
  }

  document.getElementById('planPreview').classList.remove('show');
  document.getElementById('actualPlanPreview').classList.remove('show');
  document.getElementById('overlay').classList.add('open');
  showToast('✦ 상담 내용이 CRM에 자동 입력됐어요');
}

// ── Reset all ─────────────────────────────────────────────────────

export function csResetAll() {
  if (!confirm('모든 입력 내용을 초기화하시겠습니까?')) return;
  document.querySelectorAll('#consultPanel .cs-inp, #consultPanel .cs-ta').forEach(el => { el.value=''; el.disabled=false; el.style.opacity='1'; });
  document.querySelectorAll('#consultPanel .cs-pill.selected').forEach(el => el.classList.remove('selected'));
  ['cs-kcbUnk','cs-niceUnk'].forEach(id => { const h=document.getElementById(id); if(h) h.value='false'; });
  ['cs-kcbUnkBtn','cs-niceUnkBtn'].forEach(id => { const b=document.getElementById(id); if(b){b.classList.remove('selected');b.dataset.on='false';} });
  ['cs-kcbDot','cs-niceDot'].forEach(id => { const d=document.getElementById(id); if(d) d.style.background='rgba(255,255,255,0.22)'; });
  document.getElementById('cs-sido').value='';
  document.getElementById('cs-sigungu').innerHTML='<option value="">시·군·구</option>';
  document.getElementById('cs-region').value='';
  document.getElementById('cs-bank').value='';
  ['cs-foodDetail','cs-etcDetail','cs-transportDetail','cs-bizRentDiv','cs-guaranteeLoanDetail','cs-creditLoanDetail','cs-bizLoanDetail','cs-creditCardDetail','cs-overdueDetail','cs-taxDetail','cs-seizureDetail','cs-realEstateDetail','cs-covidFundDetail'].forEach(id => { const el=document.getElementById(id); if(el) el.style.display='none'; });
  document.getElementById('cs-result').value='';
  document.getElementById('cs-charcount').textContent='0 chars';
  document.getElementById('cs-missing').textContent='';
  document.getElementById('cs-missing').classList.remove('show');
  const cc=document.getElementById('cs-confettiCanvas'); if(cc) cc.remove();
  const pw=document.getElementById('cs-progress-wrap'); if(pw) pw.classList.remove('pct100');
  csCalcProgress();
}

// ── Window resize → recalc train position ────────────────────────

window.addEventListener('resize', () => {
  if (document.getElementById('consultPanel')?.classList.contains('open')) csCalcProgress();
});
