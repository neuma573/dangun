// ════════════════════════════════════════
//  Customer detail view rendering
// ════════════════════════════════════════

import { state }                 from '../state.js';
import { STEPS, APPLY_STEP_IDX } from '../constants.js';
import { PLANS }                 from '../constants.js';
import { daysSince, esc, feeStr, nowTimestamp } from '../utils/format.js';
import { ensureDocItems }        from '../utils/docs.js';
import { calcActualPlan }        from '../utils/calc.js';

export function renderDetail(id) {
  const c = state.findCustomer(id);
  if (!c) return;

  const si         = Math.max(0, Math.min(c.stepIdx ?? 0, STEPS.length - 1));
  const isHold     = c.status === 'hold';
  const isCancel   = c.status === 'cancel';
  const isRejected = c.status === 'rejected';
  const locked     = isHold || isCancel || isRejected;

  const statusBanner = isHold
    ? `<div class="status-banner status-banner-hold">⏸ 진행 보류 중</div>`
    : isCancel
    ? `<div class="status-banner status-banner-cancel">✕ 진행 취소됨</div>`
    : isRejected
    ? `<div class="status-banner status-banner-rejected">⛔ 부결 처리됨</div>` : '';

  // ── Stepper ─────────────────────────────────────────────────────
  const hiddenSteps     = Array.isArray(c.hiddenSteps) ? c.hiddenSteps : [];
  const postApplyReached = si >= APPLY_STEP_IDX && !hiddenSteps.includes(APPLY_STEP_IDX);
  const visibleSteps    = STEPS
    .map((s, i) => ({ ...s, globalIdx: i }))
    .filter(s => !hiddenSteps.includes(s.globalIdx) &&
                 (s.globalIdx <= APPLY_STEP_IDX || postApplyReached));

  const stepperHtml = visibleSteps.map(s => {
    const i       = s.globalIdx;
    const cls     = i < si ? 's-done' : i === si ? 's-current' : '';
    const dateVal = c.stepDates?.[i] ?? '';
    const dtHtml  = dateVal
      ? `<div class="step-date" onclick="toggleStepDateEdit('${c.id}',${i})">${dateVal}</div>`
      : `<div class="step-date-empty" onclick="toggleStepDateEdit('${c.id}',${i})">+ 날짜</div>`;
    const stepDateInput = `
      <input type="date" class="step-date-input" id="sdi-${c.id}-${i}"
        style="display:none;" value="${dateVal}"
        onchange="saveStepDate('${c.id}',${i},this.value)"
        onblur="saveStepDate('${c.id}',${i},this.value)">`;
    const onclick    = locked ? '' : `onclick="setStep('${c.id}',${i})"`;
    const stepDelBtn = !locked
      ? `<button class="step-del-btn" onclick="event.stopPropagation();deleteStep('${c.id}',${i})" title="단계 제거">✕</button>` : '';
    const isRouteStep = (i === 7);
    const routeTag    = isRouteStep && c.applyRoute
      ? `<div style="font-size:8px;color:#60a5fa;margin-top:2px;">${esc(c.applyRoute)}</div>` : '';
    const stepLbl = isRouteStep && !locked
      ? `<div class="step-lbl" onclick="openRouteModal('${c.id}')" style="cursor:pointer;">${s.label}${routeTag}</div>`
      : `<div class="step-lbl">${s.label}${routeTag}</div>`;
    const displayNum = isRouteStep && c.applyRoute ? '🌐' : i + 1;
    return `
    <div class="step-item ${cls}">
      <div class="step-circle" ${onclick}>
        ${displayNum}${stepDelBtn}
      </div>
      ${stepLbl}
      <div id="sdl-${c.id}-${i}" style="display:${dateVal?'none':'inline-block'}"></div>
      ${dtHtml}
      ${stepDateInput}
    </div>`;
  }).join('');

  // ── Plan card ────────────────────────────────────────────────────
  const planInfo   = c.plan && PLANS[c.plan] ? PLANS[c.plan] : null;
  const actualInfo = c.actualFund ? calcActualPlan(parseFloat(c.actualFund)) : null;
  const planCardHtml = `<div class="plan-card">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div class="plan-name">${planInfo ? planInfo.name : '미설정'}</div>
        <div class="plan-target">${planInfo ? '목표: '+planInfo.target.toLocaleString()+'만원' : ''}</div>
        <div class="plan-fee-label">계약 용역비</div>
        <div class="plan-fee">${planInfo ? feeStr(planInfo.fee) : '-'}</div>
      </div>
      ${actualInfo ? `<div style="text-align:right;">
        <div style="font-size:10px;color:var(--dim);margin-bottom:3px;">실제 조달</div>
        <div style="font-size:14px;font-weight:800;color:var(--accent);">${parseFloat(c.actualFund).toLocaleString()}만원</div>
        <div style="font-size:10px;color:var(--dim);margin-top:4px;">실제 용역비</div>
        <div style="font-size:14px;font-weight:800;color:#facc15;">${feeStr(actualInfo.fee)}</div>
      </div>` : ''}
    </div>
  </div>`;

  // ── Collect section ──────────────────────────────────────────────
  const fundDays        = c.fundDate ? daysSince(c.fundDate) : -1;
  const collectDaysLeft = c.fundDate ? 3 - fundDays : null;
  const collectHtml = `<div class="collect-section">
    <div class="collect-item${c.fundDate?' funded':''}">
      <div class="collect-lbl">자금 수령일</div>
      <div class="collect-val${c.fundDate?' green':''}">${c.fundDate||'미정'}</div>
    </div>
    <div class="collect-item${c.collected==='완료'?' funded':fundDays>=3?' overdue':''}">
      <div class="collect-lbl">용역비 수금 (3일 이내)</div>
      <div class="collect-val ${c.collected==='완료'?'green':fundDays>=3?'red':'yellow'}">
        ${c.collected==='완료'?'✓ 수금완료':c.fundDate?`D+${fundDays} (${collectDaysLeft>0?collectDaysLeft+'일 남음':'기한초과'})`:'대기중'}
      </div>
    </div>
    <div class="collect-item"><div class="collect-lbl">수금일</div><div class="collect-val">${c.collectDate||'-'}</div></div>
    <div class="collect-item"><div class="collect-lbl">계약일</div><div class="collect-val">${c.contractDate||'-'}</div></div>
  </div>`;

  // ── Doc checklist ────────────────────────────────────────────────
  const docItems = ensureDocItems(c);
  const docHtml  = docItems.map((item, i) => {
    const isOpt = item.name.includes('불필요');
    return `<div class="doc-item" onclick="toggleDoc('${c.id}',${i})">
      <div class="doc-cb ${item.checked?'on':''}">${item.checked?'✓':''}</div>
      <span${isOpt?' style="color:var(--dim);"':''}>${esc(item.name)}${item.custom?'<span style="font-size:9px;color:rgba(96,165,250,0.7);margin-left:4px;">추가</span>':''}</span>
      <button class="doc-del-btn" onclick="event.stopPropagation();deleteDoc('${c.id}',${i})" title="서류 삭제">✕</button>
    </div>`;
  }).join('');

  // ── Memos ────────────────────────────────────────────────────────
  const memoHtml = (c.memos ?? []).slice().reverse().map((m, ri) => {
    const idx = (c.memos.length - 1 - ri);
    return `<div class="memo-item">
      <div class="memo-dt">${m.date}</div>
      <div class="memo-tx">${esc(m.text)}</div>
      <button class="memo-del" onclick="delMemo('${c.id}',${idx})">✕</button>
    </div>`;
  }).join('');

  const consultHtml = c.consult
    ? `<div class="dsec full"><div class="dsec-title">1차콜 상담내역</div><div class="consult-box">${esc(c.consult)}</div></div>` : '';

  // ── Reject reason ────────────────────────────────────────────────
  const rejectHtml = isRejected ? `
    <div class="dsec full" style="border-color:rgba(139,92,246,0.35);background:rgba(109,40,217,0.06);">
      <div class="dsec-title" style="color:#a78bfa;display:flex;align-items:center;justify-content:space-between;">
        ⛔ 부결사유
        <button class="dsec-edit-btn" onclick="toggleRejectEdit('${c.id}')" style="color:#a78bfa;border-color:rgba(139,92,246,0.4);">✎ 수정</button>
      </div>
      <div id="reject-view-${c.id}">
        ${c.rejectReason
          ? `<div class="reject-reason-box">${esc(c.rejectReason)}</div>`
          : `<div style="color:rgba(255,255,255,0.3);font-size:13px;padding:6px 0;">부결 사유가 기재되지 않았습니다.</div>`}
      </div>
      <textarea class="reject-reason-edit" id="reject-edit-${c.id}"
        placeholder="부결 사유 입력...">${esc(c.rejectReason||'')}</textarea>
      <div id="reject-edit-btns-${c.id}" style="display:none;">
        <button class="inline-cancel-btn" onclick="toggleRejectEdit('${c.id}')">취소</button>
        <button class="inline-save-btn" style="margin-left:8px;" onclick="saveRejectReason('${c.id}')">저장</button>
      </div>
    </div>` : '';

  // ── Assemble ─────────────────────────────────────────────────────
  document.getElementById('detailView').innerHTML = `
    <div class="detail-page-header">
      <button class="back-btn" onclick="goHome()">← 목록</button>
      <div>
        <div class="detail-page-name">${esc(c.name||'이름없음')} 대표</div>
        <div class="detail-page-sub">${esc(c.bizname||'')}${c.region?' · '+esc(c.region):''}${c.industry?' · '+esc(c.industry):''} · D+${daysSince(c.createdAt)}</div>
      </div>
    </div>

    ${statusBanner}

    <div class="stepper-wrap" style="${locked?'opacity:0.6':''}">
      <div class="stepper-scroll"><div class="stepper-row">${stepperHtml}</div></div>
    </div>

    <div class="dgrid">
      <div class="dsec">
        <div class="dsec-title" style="display:flex;align-items:center;">기본 정보
          <button class="dsec-edit-btn" onclick="toggleInlineEdit('basic','${c.id}')">✎ 수정</button>
        </div>
        <div id="basic-view-${c.id}">
          <div class="drow"><span class="dk">연락처</span>
            <span class="dv" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
              ${esc(c.phone||'')}
              <select class="quick-select ${c.carrier?'qs-carrier':'qs-carrier-dim'}"
                onchange="quickSave('${c.id}','carrier',this.value);this.className='quick-select '+(this.value?'qs-carrier':'qs-carrier-dim');">
                <option value="" ${!c.carrier?'selected':''}>통신사</option>
                ${['SK','LG','KT','SK알뜰','LG알뜰','KT알뜰'].map(v=>`<option value="${v}" ${c.carrier===v?'selected':''}>${v}</option>`).join('')}
              </select>
            </span>
          </div>
          <div class="drow"><span class="dk">이메일</span><span class="dv">${esc(c.email||'-')}</span></div>
          <div class="drow"><span class="dk">출생연도</span><span class="dv">${esc(c.birth||'')}</span></div>
          <div class="drow"><span class="dk">주민번호</span><span class="dv">${c.rrn?c.rrn.replace(/(.{6})-?(.{1}).+/,'$1-$2******'):'-'}</span></div>
          <div class="drow"><span class="dk">자택주소</span><span class="dv">${esc(c.homeaddr||'')}</span></div>
          <div class="drow"><span class="dk">자택 소유형태</span>
            <select class="quick-select ${['자가(본인)','자가(배우자)','자가(가족)'].includes(c.homeOwnership)?'qs-home-self':c.homeOwnership==='전월세'?'qs-home-rent':'qs-home-none'}"
              onchange="quickSaveHome('${c.id}',this.value);this.className='quick-select '+(this.value==='자가(본인)'||this.value==='자가(배우자)'||this.value==='자가(가족)'?'qs-home-self':this.value==='전월세'?'qs-home-rent':'qs-home-none');">
              <option value="" ${!c.homeOwnership?'selected':''}>미입력</option>
              ${['자가(본인)','자가(배우자)','자가(가족)','전월세'].map(v=>`<option value="${v}" ${c.homeOwnership===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="drow"><span class="dk">주거래은행</span><span class="dv">${esc(c.bank||'')}</span></div>
          <div class="drow"><span class="dk">신용평점</span><span class="dv">${esc(c.score||'')}</span></div>
          <div class="drow"><span class="dk">네이버 인증서 보유</span>
            <button class="quick-toggle ${c.naver==='있음'?'qt-green':c.naver==='없음'?'qt-red':'qt-dim'}"
              onclick="quickToggleNaver('${c.id}',this)">
              ${c.naver==='있음'?'✓ 있음':c.naver==='없음'?'✕ 없음':'미확인'}
            </button>
          </div>
        </div>
        <div id="basic-edit-${c.id}" style="display:none;">
          <div class="inline-edit-row">
            ${_inlineField('phone',  c, '연락처',     '010-0000-0000')}
            ${_inlineCarrier(c)}
            ${_inlineField('email',  c, '이메일',     'example@email.com')}
            ${_inlineField('birth',  c, '출생연도',   '1980년생')}
            ${_inlineField('rrn',    c, '주민번호',   '000000-0000000')}
            ${_inlineField('homeaddr', c, '자택주소', '자택 주소')}
            ${_inlineHomeOwn(c)}
            ${_inlineField('bank',   c, '주거래은행', '신한은행')}
            ${_inlineField('score',  c, '신용평점',   'KCB 850 / NICE 820')}
            ${_inlineNaver(c)}
          </div>
          <div class="inline-edit-row-save">
            <button class="inline-cancel-btn" onclick="toggleInlineEdit('basic','${c.id}')">취소</button>
            <button class="inline-save-btn" onclick="saveInlineEdit('basic','${c.id}')">저장</button>
          </div>
        </div>
      </div>

      <div class="dsec">
        <div class="dsec-title" style="display:flex;align-items:center;">사업 정보
          <button class="dsec-edit-btn" onclick="toggleInlineEdit('biz','${c.id}')">✎ 수정</button>
        </div>
        <div id="biz-view-${c.id}">
          <div class="drow"><span class="dk">회사명</span><span class="dv">${esc(c.bizname||'')}</span></div>
          <div class="drow"><span class="dk">사업자번호</span><span class="dv">${esc(c.bizno||'')}</span></div>
          <div class="drow"><span class="dk">업종</span><span class="dv">${esc(c.industry||'')}${_buildFoodBadge(c)}</span></div>
          <div class="drow"><span class="dk">사업기간</span><span class="dv">${esc(c.period||'')}</span></div>
          <div class="drow"><span class="dk">매출</span><span class="dv">${esc(c.revenue||'')}</span></div>
          <div class="drow"><span class="dk">(4대보험) 직원수</span><span class="dv">${esc(c.employee||'')}</span></div>
          <div class="drow"><span class="dk">사업장주소</span><span class="dv">${esc(c.bizaddr||'')}</span></div>
        </div>
        <div id="biz-edit-${c.id}" style="display:none;">
          <div class="inline-edit-row">
            ${_inlineField('bizname',  c, '회사명',    '상호명')}
            ${_inlineField('bizno',    c, '사업자번호','000-00-00000')}
            ${_inlineField('industry', c, '업종',      '음식점 (개인)')}
            ${_inlineField('period',   c, '사업기간',  '3년 6개월')}
            ${_inlineField('revenue',  c, '매출현황',  '연 2억')}
            ${_inlineField('employee', c, '(4대보험) 직원수','2명')}
            ${_inlineField('bizaddr',  c, '사업장주소','사업장 주소')}
          </div>
          <div class="inline-edit-row-save">
            <button class="inline-cancel-btn" onclick="toggleInlineEdit('biz','${c.id}')">취소</button>
            <button class="inline-save-btn" onclick="saveInlineEdit('biz','${c.id}')">저장</button>
          </div>
        </div>
      </div>

      <div class="dsec highlight full">
        <div class="dsec-title">단군비즈 플랜 &amp; 수금</div>
        ${planCardHtml}${collectHtml}
        <div style="margin-top:10px;padding:10px 12px;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.25);border-radius:9px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="font-size:12px;color:var(--dim);font-weight:700;">🖥️ 신청 플랫폼</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:14px;font-weight:800;color:${c.applyRoute?'#60a5fa':'rgba(255,255,255,0.3)'};">${c.applyRoute||'미선택'}</span>
            ${!locked?`<button class="quick-toggle qt-dim" style="font-size:11px;padding:2px 10px;" onclick="openRouteModal('${c.id}')">✎ 변경</button>`:''}
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.12);">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${_dateEditRow('초기상담일자', 'consult',  c.consultDate,  `quickSaveDate('${c.id}','consultDate',this.value)`, '📅')}
            ${_dateEditRow('신청일 (접수)', 'apply',   c.applyDate||c.stepDates?.[9]||'', `quickSaveDate('${c.id}','applyDate',this.value)`, '📋')}
            ${_dateEditRow('계약일',       'contract', c.contractDate, `quickSaveDate('${c.id}','contractDate',this.value)`, '✍️')}
            ${_dateEditRow('자금수령일',   'fund',     c.fundDate,     `quickSaveDateFund('${c.id}',this.value)`, '💰')}
          </div>
        </div>
      </div>

      <div class="dsec">
        <div class="dsec-title">서류 수령 체크리스트
          <span style="margin-left:6px;font-size:9px;padding:2px 7px;border-radius:5px;font-weight:700;${c.biztype==='corp'?'background:rgba(96,165,250,0.2);color:#60a5fa;':'background:rgba(52,211,153,0.2);color:var(--accent);'}">
            ${c.biztype==='corp'?'법인':'개인'}
          </span>
        </div>
        <div class="doc-list">${docHtml}</div>
        <div class="doc-add-row">
          <input class="doc-add-input" id="docAddInput-${c.id}" placeholder="서류명 직접 입력 후 + 추가" onkeydown="if(event.key==='Enter')addCustomDoc('${c.id}')">
          <button class="doc-add-btn" onclick="addCustomDoc('${c.id}')">＋ 추가</button>
        </div>
        <div style="margin-top:10px;border-top:1px dashed var(--div);padding-top:10px;">
          <div class="drow"><span class="dk">크레딧포유 가입</span>
            <button class="quick-toggle ${c.credit==='가입완료'?'qt-green':'qt-dim'}"
              onclick="quickToggleCredit('${c.id}',this)">
              ${c.credit==='가입완료'?'✓ 가입완료':'미완료'}
            </button>
          </div>
        </div>
      </div>

      <div class="dsec full">
        <div class="dsec-title">진행 메모</div>
        <div class="memo-tl" id="mtl-${c.id}">${memoHtml}</div>
        <div class="memo-inp-row">
          <textarea id="mi-${c.id}" placeholder="메모 입력..." rows="2"></textarea>
          <button class="memo-add" onclick="addMemo('${c.id}')">＋</button>
        </div>
      </div>
      ${consultHtml}
      ${rejectHtml}
    </div>

    <div class="card-actions" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--div);">
      <button class="act-btn act-edit" onclick="openModal('${c.id}')">✎ 수정</button>
      ${c.collectInfo
        ? `<button class="act-btn act-collect done">✅ 수금완료</button>`
        : `<button class="act-btn act-collect" onclick="openCollectPopup('${c.id}')">💰 수금완료 등록</button>`}
      ${isRejected
        ? `<button class="act-btn act-proceed" onclick="openProceedModal('${c.id}')">🔄 추가 진행</button>
           <button class="act-btn act-resume"  onclick="setStatus('${c.id}','')">▶ 진행 재개</button>`
        : locked
        ? `<button class="act-btn act-resume" onclick="setStatus('${c.id}','')">▶ 진행 재개</button>`
        : `<button class="act-btn act-hold ${isHold?'active':''}"   onclick="setStatus('${c.id}','hold')">⏸ 진행 보류</button>
           <button class="act-btn act-cancel ${isCancel?'active':''}" onclick="setStatus('${c.id}','cancel')">✕ 진행 취소</button>
           <button class="act-btn act-reject" onclick="openRejectModal('${c.id}')">⛔ 부결</button>`}
      <button class="act-btn act-del" onclick="delCustomerDetail('${c.id}')">🗑 삭제</button>
    </div>`;
}

// ── Private HTML builder helpers ────────────────────────────────

function _inlineField(field, c, label, placeholder) {
  const val = esc(c[field] || '');
  return `<div class="inline-edit-group">
    <div class="inline-edit-label">${label}</div>
    <input class="inline-edit-input" id="ie-${field}-${c.id}" value="${val}" placeholder="${placeholder}">
  </div>`;
}

function _inlineCarrier(c) {
  return `<div class="inline-edit-group"><div class="inline-edit-label">통신사</div>
    <select class="inline-edit-input carrier-select" id="ie-carrier-${c.id}">
      <option value="">선택</option>
      ${['SK','LG','KT','SK알뜰','LG알뜰','KT알뜰'].map(v=>`<option value="${v}" ${c.carrier===v?'selected':''}>${v}</option>`).join('')}
    </select>
  </div>`;
}

function _inlineHomeOwn(c) {
  return `<div class="inline-edit-group"><div class="inline-edit-label">자택 소유형태</div>
    <select class="inline-edit-input" id="ie-homeownership-${c.id}">
      <option value="" ${!c.homeOwnership?'selected':''}>선택</option>
      ${['자가(본인)','자가(배우자)','자가(가족)','전월세'].map(v=>`<option value="${v}" ${c.homeOwnership===v?'selected':''}>${v}</option>`).join('')}
    </select>
  </div>`;
}

function _inlineNaver(c) {
  return `<div class="inline-edit-group"><div class="inline-edit-label">네이버 인증서 보유</div>
    <select class="inline-edit-input" id="ie-naver-${c.id}">
      <option value="" ${!c.naver?'selected':''}>미확인</option>
      ${['있음','없음'].map(v=>`<option value="${v}" ${c.naver===v?'selected':''}>${v}</option>`).join('')}
    </select>
  </div>`;
}

function _dateEditRow(label, key, val, onchange, icon) {
  return `<div>
    <div class="collect-lbl" style="margin-bottom:5px;">${icon} ${label}</div>
    <div class="date-edit-row">
      <input type="date" class="date-edit-input" id="de-${key}" value="${val||''}" onchange="${onchange}">
    </div>
  </div>`;
}

function _buildFoodBadge(c) {
  if (!c.foodInfo) return '';
  const fi    = c.foodInfo;
  const items = [];
  const { esc: e } = { esc };
  if (fi.kiosk  === true)  items.push(`<span class="ib-item ib-on">키오스크 ✓</span>`);
  else if (fi.kiosk  === false) items.push(`<span class="ib-item ib-off">키오스크 X</span>`);
  if (fi.table  === true)  items.push(`<span class="ib-item ib-on">테이블오더 ✓</span>`);
  else if (fi.table  === false) items.push(`<span class="ib-item ib-off">테이블오더 X</span>`);
  if (fi.delivery === true) {
    const apps = fi.deliveryApps ? fi.deliveryApps.trim() : '';
    items.push(`<span class="ib-item ib-info">배달 ${apps?'('+esc(apps)+')':'✓'}</span>`);
  } else if (fi.delivery === false) items.push(`<span class="ib-item ib-off">배달 X</span>`);
  return items.length ? `<div class="industry-badge">${items.join('')}</div>` : '';
}
