// ════════════════════════════════════════
//  Gender utilities
// ════════════════════════════════════════

export function genderFromRrn(rrn) {
  if (!rrn) return 'none';
  const m = rrn.replace(/\s/g, '').match(/\d{6}[-―]?(\d)/);
  if (!m) return 'none';
  const code = parseInt(m[1]);
  if ([1,3,5,7,9].includes(code)) return 'male';
  if ([2,4,6,8,0].includes(code)) return 'female';
  return 'none';
}

export function getGender(c) {
  if (c.gender === 'male' || c.gender === 'female') return c.gender;
  if (c.gender === 'none') return 'none';
  return genderFromRrn(c.rrn);
}

export function genderSvg(gender) {
  if (gender === 'male') return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="14" r="6" stroke="white" stroke-width="2"/>
    <line x1="14.2" y1="9.8" x2="20" y2="4" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <polyline points="16,4 20,4 20,8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  if (gender === 'female') return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="9" r="6" stroke="white" stroke-width="2"/>
    <line x1="12" y1="15" x2="12" y2="21" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <line x1="9" y1="18.5" x2="15" y2="18.5" stroke="white" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="7" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" stroke-dasharray="3 2"/>
    <text x="12" y="16" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.5)" font-family="sans-serif">?</text>
  </svg>`;
}

export function genderClass(gender) {
  if (gender === 'male')   return 'ccard-avatar gender-male';
  if (gender === 'female') return 'ccard-avatar gender-female';
  return 'ccard-avatar gender-none';
}
