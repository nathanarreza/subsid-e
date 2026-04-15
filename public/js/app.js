/**
 * subsid-e — Frontend Application
 * All Gemini API calls go through /api/* endpoints (no keys in browser).
 */

'use strict';

// ── SUBSIDY DATA ──────────────────────────────────────────────────────────────
const SUBSIDIES = [
  { id:1,  name:'Pantawid Pamilyang Pilipino Program (4Ps)', agency:'DSWD', agencyClass:'agency-dswd', category:'cash',        status:'ongoing',  amount:'₱500–₱1,400/month',            description:'Flagship conditional cash transfer program providing financial assistance to poor households for health, nutrition, and education.', eligibility:'Households identified as poor through NHTS-PR, with children 0–18 years old or a pregnant/lactating mother.', documents:'Valid ID, Birth Certificates of children, Proof of residence', link:'https://www.dswd.gov.ph/pantawid-pamilyang-pilipino-program-4ps/' },
  { id:2,  name:'Social Amelioration Program (SAP)',          agency:'DSWD', agencyClass:'agency-dswd', category:'cash',        status:'ended',    amount:'₱5,000–₱8,000 (one-time)',     description:'Emergency subsidy program providing cash assistance to low-income households affected by community quarantine during COVID-19.', eligibility:'Families in low-income brackets not receiving other government assistance during quarantine periods.', documents:'Valid government ID, Barangay Certification', link:'https://www.dswd.gov.ph/' },
  { id:3,  name:'Sustainable Livelihood Program (SLP)',       agency:'DSWD', agencyClass:'agency-dswd', category:'livelihood',  status:'ongoing',  amount:'₱3,000–₱10,000 seed capital',  description:'Provides skills training, livelihood assistance, and micro-enterprise development to poor households.', eligibility:'Current 4Ps beneficiaries or NHTS-poor households in active barangays.', documents:'Valid ID, Barangay Certification, SLP application form', link:'https://www.dswd.gov.ph/sustainable-livelihood-program-slp/' },
  { id:4,  name:'Assistance to Individuals in Crisis (AICS)', agency:'DSWD', agencyClass:'agency-dswd', category:'cash',        status:'ongoing',  amount:'Variable per crisis type',     description:'Provides cash or in-kind assistance to individuals and families facing crisis situations like medical emergencies, natural calamities, or displacement.', eligibility:'Individuals or families in crisis situations with valid referral or walk-in applications.', documents:'Valid ID, Medical certificate (if medical), Referral letter', link:'https://www.dswd.gov.ph/' },
  { id:5,  name:'TUPAD (Tulong Panghanapbuhay)',              agency:'DOLE', agencyClass:'agency-dole', category:'livelihood',  status:'ongoing',  amount:'Min. wage × 10 days',          description:'Community-based emergency employment program providing short-term wage subsidies to displaced, underemployed, and seasonal workers.', eligibility:'Displaced workers, seasonal/contractual employees, informal economy workers aged 18–59.', documents:'Valid ID, Barangay Certification, DOLE application form', link:'https://tupad.dole.gov.ph/' },
  { id:6,  name:'CAMP (COVID-19 Adjustment Measures)',        agency:'DOLE', agencyClass:'agency-dole', category:'cash',        status:'ended',    amount:'₱5,000 (one-time)',            description:'One-time financial assistance to workers in private establishments affected by COVID-19 community quarantine.', eligibility:'Employees in private establishments under quarantine with certified suspension of operations.', documents:'Employment certificate, Valid ID, CAMP application form', link:'https://www.dole.gov.ph/' },
  { id:7,  name:'SSS Unemployment Insurance',                 agency:'SSS',  agencyClass:'agency-sss',  category:'cash',        status:'ongoing',  amount:'50% of avg. monthly salary',   description:'Monthly cash benefit for involuntarily unemployed SSS members for up to 2 months.', eligibility:'SSS member involuntarily separated from employment with at least 36 monthly contributions.', documents:'SSS ID/UMID, SSB Form 1, Employer Separation Certificate', link:'https://www.sss.gov.ph/' },
  { id:8,  name:'SSS Salary Loan',                            agency:'SSS',  agencyClass:'agency-sss',  category:'cash',        status:'ongoing',  amount:'Up to ₱32,000',                description:'Short-term cash loan for SSS members based on monthly salary credit and contribution history.', eligibility:'Active SSS member with at least 36 monthly contributions, employed or self-employed.', documents:'SSS ID/UMID, Salary Loan Application Form, Employment Certificate', link:'https://www.sss.gov.ph/' },
  { id:9,  name:'SSS Maternity Benefit',                      agency:'SSS',  agencyClass:'agency-sss',  category:'health',      status:'ongoing',  amount:'100 days salary credit',       description:'Cash benefit covering 100% of average daily salary credit for female SSS members during maternity leave.', eligibility:'Female SSS member with at least 3 monthly contributions in the 12 months before semester of delivery.', documents:'MAT-1 notification, Medical certificate, Birth certificate', link:'https://www.sss.gov.ph/' },
  { id:10, name:'PhilHealth Basic Coverage',                  agency:'PhilHealth', agencyClass:'agency-philhealth', category:'health', status:'ongoing', amount:'Covers in/out-patient services', description:'National health insurance covering hospitalization, outpatient care, maternity, and Z benefits for catastrophic illnesses.', eligibility:'All Filipino citizens — employees, self-employed, OFWs, indigents.', documents:'PhilHealth ID, MDR form, Hospital claim documents', link:'https://www.philhealth.gov.ph/' },
  { id:11, name:'PhilHealth Z Benefits (Catastrophic Illness)',agency:'PhilHealth', agencyClass:'agency-philhealth', category:'health', status:'ongoing', amount:'Full coverage for conditions', description:'Full financial coverage for catastrophic and costly medical conditions including cancer, kidney transplant, and coronary artery bypass.', eligibility:'Active PhilHealth member or dependent diagnosed with qualifying catastrophic conditions.', documents:'PhilHealth ID, Medical diagnosis, Hospital referral', link:'https://www.philhealth.gov.ph/' },
  { id:12, name:'Malasakit Center Assistance',                agency:'DOH',  agencyClass:'agency-doh',  category:'health',      status:'ongoing',  amount:'Covers unpaid hospital bills',  description:'One-stop shop for indigent patients to access financial assistance from PCSO, DSWD, and PhilHealth to cover hospital bills.', eligibility:'Indigent or low-income patients in government hospitals with unpaid medical bills.', documents:'Valid ID, Hospital billing statement, Barangay indigency certificate', link:'https://malasakit.gov.ph/' },
  { id:13, name:'Free Tuition in SUCs (UniFAST)',             agency:'CHED', agencyClass:'agency-ched', category:'education',   status:'ongoing',  amount:'100% tuition + misc fees',     description:'Universal access to quality tertiary education — free tuition and miscellaneous fees in State Universities and Colleges.', eligibility:'Filipino students enrolled in SUCs, LUCs, and qualifying technical-vocational institutions.', documents:'Grade certificates, Enrollment form, PSA birth certificate', link:'https://www.ched.gov.ph/unifast/' },
  { id:14, name:'SKoL Scholarship',                           agency:'CHED', agencyClass:'agency-ched', category:'education',   status:'ongoing',  amount:'₱40,000/year stipend',         description:'Merit-based scholarship providing allowances and book grants to graduating senior high school students from low-income families.', eligibility:'Senior high school graduates with at least 90% GWA, family income below ₱400,000/year.', documents:'Transcript, Income tax return, PSA birth certificate', link:'https://www.ched.gov.ph/' },
  { id:15, name:'DOST-SEI Scholarship',                       agency:'DOST', agencyClass:'agency-dost', category:'education',   status:'ongoing',  amount:'₱16,000–₱20,000/year',         description:'Merit-based scholarship for students pursuing science, technology, engineering, and mathematics courses.', eligibility:'Students with aptitude in science and math, enrolled in STEM courses in recognized HEIs.', documents:'NSAT results, High school transcript, PSA birth certificate', link:'https://www.sei.dost.gov.ph/' },
  { id:16, name:'Pag-IBIG Housing Loan',                      agency:'Pag-IBIG', agencyClass:'agency-pag-ibig', category:'housing', status:'ongoing', amount:'Up to ₱6,000,000',           description:'Affordable housing loan program for Pag-IBIG Fund members to purchase, construct, or renovate homes.', eligibility:'Pag-IBIG member with at least 24 monthly contributions, not more than 65 years old.', documents:'Pag-IBIG ID, Income documents, TCT/CCT of property', link:'https://www.pagibigfund.gov.ph/' },
  { id:17, name:'Pag-IBIG Calamity Loan',                     agency:'Pag-IBIG', agencyClass:'agency-pag-ibig', category:'disaster', status:'active', amount:'Up to ₱40,000',             description:'Emergency loan for Pag-IBIG members in areas declared under a state of calamity due to natural or man-made disasters.', eligibility:'Pag-IBIG member in calamity-declared areas with at least 24 monthly contributions.', documents:'Pag-IBIG ID, Calamity Loan Application Form, Barangay certification', link:'https://www.pagibigfund.gov.ph/' },
  { id:18, name:'Agricultural Competitiveness Enhancement (ACEF)', agency:'DA', agencyClass:'agency-da', category:'agriculture', status:'ongoing', amount:'Subsidized inputs and loans', description:'Provides subsidized fertilizers, seeds, and farm inputs to Filipino farmers to enhance agricultural competitiveness.', eligibility:'Registered farmers and fisherfolk in good standing with LGU or accredited farmers associations.', documents:"Farmer's ID, Land title/Certificate of Stewardship, Barangay certification", link:'https://www.da.gov.ph/' },
  { id:19, name:'Rice Farmers Financial Assistance (RFFA)',    agency:'DA',   agencyClass:'agency-da',   category:'agriculture', status:'ongoing',  amount:'₱5,000/hectare (up to 2ha)',   description:'Direct cash subsidy to rice farmers to compensate for income losses due to tariff reduction under RCEF.', eligibility:'Filipino rice farmers with land area of 0.5–2 hectares, registered in RSBSA.', documents:"RSBSA registration, Farmer's ID, Proof of landholding", link:'https://www.da.gov.ph/' },
  { id:20, name:'GSIS Pension (Old-Age)',                      agency:'GSIS', agencyClass:'agency-gsis', category:'pension',     status:'ongoing',  amount:'₱6,000/month min. + COLA',     description:'Monthly pension for government employees who have retired and met minimum service requirements.', eligibility:'Government employee with at least 15 years of service and 60 years old at retirement.', documents:'GSIS UMID, Application for Retirement, Service Record', link:'https://www.gsis.gov.ph/' },
  { id:21, name:'Social Pension for Indigent Senior Citizens', agency:'DSWD', agencyClass:'agency-dswd', category:'senior',      status:'ongoing',  amount:'₱1,000/month',                 description:'Monthly stipend for poor, frail, and neglected senior citizens who have no regular income or support.', eligibility:'Filipino citizen 60 years old or above, frail/sick/no regular income, not a pension recipient.', documents:'Valid senior citizen ID, Barangay Certificate of Indigency, PSA birth certificate', link:'https://www.dswd.gov.ph/' },
  { id:22, name:'Senior Citizen Discount (RA 9994)',           agency:'OSCA', agencyClass:'agency-dswd', category:'senior',      status:'ongoing',  amount:'20% discount + VAT exemption', description:'Mandatory 20% discount and VAT exemption on medicines, basic commodities, services, and utilities for senior citizens.', eligibility:'Filipino citizen 60 years old and above with valid senior citizen ID.', documents:'Senior Citizen ID issued by OSCA', link:'https://dswd.gov.ph/' },
  { id:23, name:'PWD Cash Transfer Program',                   agency:'DSWD', agencyClass:'agency-dswd', category:'pwd',         status:'ongoing',  amount:'₱1,000/month',                 description:'Monthly cash assistance to persons with disabilities who are indigent and without regular income.', eligibility:'Filipino PWD registered with LGU, without stable income, not receiving other disability pensions.', documents:'PWD ID, Medical Certificate, Barangay Certificate of Indigency', link:'https://www.dswd.gov.ph/' },
  { id:24, name:'PWD Discount (RA 10754)',                     agency:'NCDA', agencyClass:'agency-dswd', category:'pwd',         status:'ongoing',  amount:'20% discount on goods/services', description:'Mandatory 20% discount for PWDs on medicines, medical services, basic commodities, and transportation.', eligibility:'Filipino citizen with disability as defined by RA 7277, registered with LGU.', documents:'PWD ID issued by LGU/NCDA', link:'https://ncda.gov.ph/' },
  { id:25, name:'DTI Pondo sa Pagbabago (P3)',                 agency:'DTI',  agencyClass:'agency-dti',  category:'livelihood',  status:'ongoing',  amount:'₱5,000–₱200,000 micro-loans',  description:'Micro-financing program providing low-cost loans to micro-entrepreneurs and informal sector workers.', eligibility:'Filipino micro-entrepreneurs and informal economy workers needing business capital.', documents:'Valid ID, Business plan, Barangay Business Clearance', link:'https://www.dti.gov.ph/' },
  { id:26, name:'Go Negosyo Negosyo Center',                   agency:'DTI',  agencyClass:'agency-dti',  category:'livelihood',  status:'ongoing',  amount:'Free mentoring + capital access', description:'One-stop business development centers providing mentoring, training, business registration, and financing assistance.', eligibility:'All Filipino micro and small entrepreneurs, aspiring business owners.', documents:'Valid ID, Business registration documents', link:'https://www.dti.gov.ph/' },
  { id:27, name:'Bangon Pilipinas (Disaster Rehabilitation)', agency:'DSWD', agencyClass:'agency-dswd', category:'disaster',    status:'active',   amount:'₱3,000–₱20,000/household',    description:'Cash-for-work and livelihood assistance for communities affected by typhoons, earthquakes, and other disasters.', eligibility:'Households in officially declared calamity areas identified through damage assessment.', documents:'Valid ID, LGU damage assessment form, Barangay disaster certificate', link:'https://www.dswd.gov.ph/' },
  { id:28, name:'GSIS Emergency Loan',                         agency:'GSIS', agencyClass:'agency-gsis', category:'disaster',    status:'active',   amount:'Up to ₱40,000',               description:'Emergency loan facility for government employees and retirees in calamity-declared areas.', eligibility:'Active GSIS member or pensioner in calamity-declared areas.', documents:'GSIS UMID, Emergency Loan Application Form', link:'https://www.gsis.gov.ph/' },
  { id:29, name:'DOLE Integrated Livelihood Program (DILP)',   agency:'DOLE', agencyClass:'agency-dole', category:'livelihood',  status:'ongoing',  amount:'₱5,000–₱25,000/beneficiary',   description:'Provides livelihood grants, skills training, and entrepreneurship development for displaced workers.', eligibility:'Displaced workers, disadvantaged youth, women, and informal sector workers.', documents:'Valid ID, DOLE application form, Barangay recommendation', link:'https://www.dole.gov.ph/' },
  { id:30, name:'Sagip Saka (Farmers & Fisherfolk Aid)',       agency:'DA',   agencyClass:'agency-da',   category:'agriculture', status:'ongoing',  amount:'Seeds, fertilizers, equipment', description:'In-kind assistance to farmers and fisherfolk displaced or affected by calamities.', eligibility:'Registered farmers and fisherfolk affected by typhoons, pests, or agricultural calamities.', documents:"Farmer's ID, RSBSA registration, Calamity report", link:'https://www.da.gov.ph/' },
  { id:31, name:'Universal Health Care Act Benefits',          agency:'DOH',  agencyClass:'agency-doh',  category:'health',      status:'ongoing',  amount:'Comprehensive health package',  description:'Guarantees all Filipinos comprehensive health benefits including prevention, rehabilitation, and palliative care.', eligibility:'All Filipino citizens automatically enrolled in PhilHealth under RA 11223.', documents:'PhilHealth ID or proof of Filipino citizenship', link:'https://www.doh.gov.ph/uhc' },
  { id:32, name:'Livelihood Seeding Program (LSP)',            agency:'DSWD', agencyClass:'agency-dswd', category:'livelihood',  status:'ongoing',  amount:'₱5,000 starter kit',           description:'Provides starter livelihood kits and training to indigent families to engage in small-scale livelihood activities.', eligibility:'Indigent families enrolled in DSWD programs with capacity for livelihood participation.', documents:'DSWD case record, Valid ID, Livelihood plan', link:'https://www.dswd.gov.ph/' },
  { id:33, name:'DSWD Food Packs & Relief Goods',             agency:'DSWD', agencyClass:'agency-dswd', category:'disaster',    status:'active',   amount:'Food packs per family',        description:'Food packs and relief goods for families affected by disasters, displaced communities, and indigent households.', eligibility:'Disaster-affected families, homeless individuals, and indigent communities needing food relief.', documents:'None required for emergency; Barangay certificate for regular assistance', link:'https://www.dswd.gov.ph/' },
  { id:34, name:'PhilSys National ID',                        agency:'PSA',  agencyClass:'agency-dswd', category:'cash',        status:'ongoing',  amount:'Gateway to all subsidy programs', description:'Philippine Identification System enabling faster, more accurate verification for subsidy applications across all agencies.', eligibility:'All Filipino citizens and resident aliens.', documents:'PSA birth certificate, Proof of address', link:'https://philsys.gov.ph/' },
  { id:35, name:'GSIS Conso-Loan Plus',                       agency:'GSIS', agencyClass:'agency-gsis', category:'cash',        status:'ongoing',  amount:'Up to ₱3,000,000',             description:'Consolidation loan for government employees to manage multiple existing GSIS loans with lower interest rates.', eligibility:'Active government employee with at least 3 years of service and existing GSIS loans.', documents:'GSIS UMID, Loan Statement, Employment certification', link:'https://www.gsis.gov.ph/' },
  { id:36, name:'Balik Probinsya Program',                    agency:'NEDA', agencyClass:'agency-dswd', category:'livelihood',  status:'ongoing',  amount:'Transport + livelihood starter', description:'Encourages urban poor and displaced workers to return to their home provinces with livelihood and resettlement support.', eligibility:'Urban poor, displaced workers, and informal settlers willing to relocate to provinces.', documents:'Valid ID, Intent application, Barangay clearance', link:'https://www.neda.gov.ph/' },
  { id:37, name:'NCIP Ancestral Land Title',                  agency:'NCIP', agencyClass:'agency-da',   category:'agriculture', status:'ongoing',  amount:'Land security for IPs',        description:'Certificate of Ancestral Domain/Land Title for indigenous peoples, securing land rights and enabling access to livelihood programs.', eligibility:'Recognized Indigenous People communities with continuous occupation of ancestral land.', documents:'Community proof of occupation, NCIP application', link:'https://www.ncip.gov.ph/' },
  { id:38, name:'DOST Balik Scientist Program',               agency:'DOST', agencyClass:'agency-dost', category:'youth',       status:'ongoing',  amount:'Stipend + research grant',     description:'Engages Filipino scientists, engineers, and technology experts from abroad to contribute to national development.', eligibility:'Filipino scientists and professionals abroad willing to return and contribute to Philippine R&D.', documents:'Proof of citizenship, Professional credentials, Research proposal', link:'https://www.dost.gov.ph/' },
];

// ── STATE ─────────────────────────────────────────────────────────────────────
let currentFilter  = 'all';
let currentSearch  = '';
let chatHistory    = [];        // [{role, parts}]
let isChatPending  = false;
let serverReady    = false;

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderSubsidies(SUBSIDIES);
  bindEvents();
  checkServerHealth();
});

// ── SERVER HEALTH CHECK ───────────────────────────────────────────────────────
async function checkServerHealth() {
  const dot   = document.getElementById('statusDot');
  const label = document.getElementById('statusLabel');
  const modelLabel = document.getElementById('chatModelLabel');
  const modelBadge = document.getElementById('modelBadge');

  dot.className     = 'status-dot ok';
  // Vertex AI doesn't use keys, so we show the connection status
  label.textContent = 'Vertex AI Connected';

  
}

function showServerError() {
  const feed = document.getElementById('newsFeed');
  feed.innerHTML = `
    <div class="news-empty">
      <div class="news-empty-icon">⚠️</div>
      <div class="news-empty-title" style="color:var(--ph-red)">No API keys configured</div>
      <div class="news-empty-sub">Add GEMINI_KEY_1 through GEMINI_KEY_10 to your <code>.env</code> file and redeploy to Vercel.</div>
    </div>`;
}

// ── EVENT BINDING ─────────────────────────────────────────────────────────────
function bindEvents() {
  // Hero search
  document.getElementById('heroSearchBtn').addEventListener('click', onHeroSearch);
  document.getElementById('heroSearch').addEventListener('keydown', e => { if (e.key === 'Enter') onHeroSearch(); });

  // Sidebar search
  document.getElementById('sidebarSearch').addEventListener('input', e => {
    currentSearch = e.target.value.toLowerCase();
    applyFilters();
  });

  // Category pills
  document.getElementById('catPills').addEventListener('click', e => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.cat;
    applyFilters();
  });

  // Nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const section = document.getElementById(`section${capitalize(btn.dataset.section)}`);
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // News
  document.getElementById('fetchNewsBtn').addEventListener('click', fetchNews);
  document.getElementById('newsQuery').addEventListener('keydown', e => { if (e.key === 'Enter') fetchNews(); });

  // News presets
  document.getElementById('newsPresets').addEventListener('click', e => {
    const chip = e.target.closest('.preset-chip');
    if (!chip) return;
    document.getElementById('newsQuery').value = chip.dataset.query;
    fetchNews();
  });

  // Chat send
  document.getElementById('chatSendBtn').addEventListener('click', sendChat);
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });
  document.getElementById('chatInput').addEventListener('input', e => autoResize(e.target));

  // Quick chat buttons
  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('chatInput').value = btn.dataset.q;
      sendChat();
    });
  });

  // Detail modal
  document.getElementById('detailClose').addEventListener('click', closeDetail);
  document.getElementById('detailOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeDetail();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDetail();
  });
}

// ── SUBSIDY DIRECTORY ─────────────────────────────────────────────────────────
function renderSubsidies(list) {
  const el = document.getElementById('subsidyList');
  if (!list.length) {
    el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">No programs found matching your search.</div>';
    return;
  }
  el.innerHTML = list.map(s => `
    <div class="subsidy-item" role="listitem" tabindex="0" data-id="${s.id}"
         aria-label="View details for ${escHtml(s.name)}">
      <div class="subsidy-item-header">
        <div class="subsidy-name">${escHtml(s.name)}</div>
        <span class="subsidy-agency ${s.agencyClass}">${escHtml(s.agency)}</span>
      </div>
      <div class="subsidy-desc">${escHtml(s.description.substring(0, 90))}…</div>
      <div class="subsidy-meta">
        <span class="subsidy-amount">${escHtml(s.amount)}</span>
        <span class="subsidy-status ${statusClass(s.status)}">${capitalize(s.status)}</span>
      </div>
    </div>
  `).join('');

  // Click & keyboard activation
  el.querySelectorAll('.subsidy-item').forEach(item => {
    item.addEventListener('click', () => showDetail(+item.dataset.id));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showDetail(+item.dataset.id); }
    });
  });
}

function onHeroSearch() {
  const q = document.getElementById('heroSearch').value;
  document.getElementById('sidebarSearch').value = q;
  currentSearch = q.toLowerCase();
  applyFilters();
  document.getElementById('subsidyList').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyFilters() {
  let list = SUBSIDIES;
  if (currentFilter !== 'all') list = list.filter(s => s.category === currentFilter);
  if (currentSearch) list = list.filter(s =>
    s.name.toLowerCase().includes(currentSearch) ||
    s.agency.toLowerCase().includes(currentSearch) ||
    s.description.toLowerCase().includes(currentSearch)
  );
  renderSubsidies(list);
  document.getElementById('directoryCount').textContent =
    `${list.length} program${list.length !== 1 ? 's' : ''} found`;
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
function showDetail(id) {
  const s = SUBSIDIES.find(x => x.id === id);
  if (!s) return;

  document.getElementById('dAgency').textContent   = s.agency;
  document.getElementById('dTitle').textContent    = s.name;
  document.getElementById('dStatusRow').innerHTML  = `
    <span class="subsidy-amount" style="background:rgba(255,255,255,0.2);color:#fff;">${escHtml(s.amount)}</span>
    <span class="subsidy-status ${statusClass(s.status)}" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.85);">${capitalize(s.status)}</span>
  `;
  document.getElementById('dDesc').textContent     = s.description;
  document.getElementById('dGrid').innerHTML       = `
    <div class="detail-info-box"><div class="detail-info-label">Agency</div><div class="detail-info-value">${escHtml(s.agency)}</div></div>
    <div class="detail-info-box"><div class="detail-info-label">Category</div><div class="detail-info-value">${capitalize(s.category)}</div></div>
    <div class="detail-info-box"><div class="detail-info-label">Benefit</div><div class="detail-info-value">${escHtml(s.amount)}</div></div>
    <div class="detail-info-box"><div class="detail-info-label">Status</div><div class="detail-info-value">${capitalize(s.status)}</div></div>
  `;
  document.getElementById('dElig').textContent     = s.eligibility;
  document.getElementById('dDocs').textContent     = s.documents;
  document.getElementById('dLink').href            = s.link;

  const overlay = document.getElementById('detailOverlay');
  overlay.classList.remove('hidden');
  overlay.focus();
}
function closeDetail() {
  document.getElementById('detailOverlay').classList.add('hidden');
}

// ── NEWS FEED ─────────────────────────────────────────────────────────────────
async function fetchNews() {
  const query  = document.getElementById('newsQuery').value.trim();
  const btn    = document.getElementById('fetchNewsBtn');
  const feedEl = document.getElementById('newsFeed');

  btn.disabled      = true;
  btn.textContent   = 'Fetching…';
  feedEl.innerHTML  = `
    <div class="news-loading">
      <div class="spinner"></div>
      <div>Searching via Gemini + Google grounding…</div>
    </div>`;
  document.getElementById('groundingPanel').classList.add('hidden');

  try {
    const resp = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query || 'Philippine government subsidy programs 2025' }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${resp.status}`);
    }

    const data = await resp.json();

    renderNewsText(data.text, data.grounded);

    if (data.groundingMetadata?.groundingChunks?.length) {
      renderGrounding(data.groundingMetadata.groundingChunks);
    }

    const indicator = document.getElementById('liveIndicator');
    indicator.textContent = data.grounded ? '● LIVE' : '● CACHED';
    indicator.className   = `panel-badge ${data.grounded ? 'live pulse' : 'grounded'}`;

  } catch (e) {
    feedEl.innerHTML = `
      <div class="news-empty">
        <div class="news-empty-icon">⚠️</div>
        <div class="news-empty-title" style="color:var(--ph-red)">Error fetching news</div>
        <div class="news-empty-sub">${escHtml(e.message)}</div>
      </div>`;
  }

  btn.disabled    = false;
  btn.textContent = '🔍 Fetch News';
}

function renderNewsText(text) {
  const feedEl = document.getElementById('newsFeed');
  
  // 1. Clean up the text: Remove leading/trailing whitespace
  const cleanText = text.trim();
  if (!cleanText) return;

  // 2. Split into logical sections (usually by double newlines)
  const sections = cleanText.split(/\n\n+/);
  let html = '<div class="news-feed">';

  sections.forEach(section => {
    const lines = section.split('\n').filter(l => l.trim());
    if (lines.length === 0) return;

    let itemHtml = '';
    let headline = '';
    let source = '';
    let bodyLines = [];

    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Identify Source Lines (Source: Agency Name)
      if (lowerLine.includes('source:') || lowerLine.includes('publication:')) {
        source = line.replace(/^(source|publication):\s*/i, '').replace(/[*#]/g, '').trim();
      } 
      // Identify Headlines (First line, or starts with #, or wrapped in **)
      else if (index === 0 && (line.startsWith('#') || line.startsWith('**') || line.length < 100)) {
        headline = line.replace(/[*#]/g, '').trim();
      }
      // Everything else is the body
      else {
        bodyLines.push(line);
      }
    });

    // Fallback: If no headline was identified, use the first line of body
    if (!headline && bodyLines.length > 0) {
      headline = bodyLines.shift().replace(/[*#]/g, '').trim();
    }

    // Build the Card HTML
    html += `<div class="news-item">`;
    
    if (source) {
      html += `
        <div class="news-source-row">
          <div class="news-source-dot"></div>
          <div class="news-source">${escHtml(source)}</div>
        </div>`;
    }

    if (headline) {
      html += `<div class="news-headline">${escHtml(headline)}</div>`;
    }

    if (bodyLines.length > 0) {
      // We use mdToHtml here so that Gemini's bullet points and bolding work!
      const bodyMarkdown = bodyLines.join('\n');
      html += `<div class="news-snippet">${mdToHtml(bodyMarkdown)}</div>`;
    }

    html += `</div>`;
  });

  html += '</div>';
  feedEl.innerHTML = html;
}

function renderGrounding(chunks) {
  const panel    = document.getElementById('groundingPanel');
  const chipsEl  = document.getElementById('groundingChips');
  panel.classList.remove('hidden');

  chipsEl.innerHTML = chunks.slice(0, 12)
    .map(c => {
      const src = c.web || c.groundingChunk?.web;
      if (!src) return '';
      const title = (src.title || src.uri || 'Source').substring(0, 40);
      const uri   = src.uri || '#';
      return `<a href="${escHtml(uri)}" target="_blank" rel="noopener noreferrer" class="grounding-chip" role="listitem">
        ↗ ${escHtml(title)}${title.length >= 40 ? '…' : ''}
      </a>`;
    })
    .filter(Boolean)
    .join('');
}

// ── AI CHAT ───────────────────────────────────────────────────────────────────
function addMsg(role, html, sources = []) {
  const container = document.getElementById('chatMessages');
  const div       = document.createElement('div');
  div.className   = `msg ${role}`;

  const avatar = role === 'ai'
    ? '<div class="msg-avatar ai" aria-hidden="true">🇵🇭</div>'
    : '<div class="msg-avatar user" aria-hidden="true">👤</div>';

  let sourcesHtml = '';
  if (sources.length) {
    sourcesHtml = '<div class="chat-grounding-sources">' +
      sources.slice(0, 5).map(s =>
        `<a href="${escHtml(s.uri || '#')}" target="_blank" rel="noopener noreferrer" class="chat-source-chip">
          ↗ ${escHtml((s.title || 'Source').substring(0, 28))}
        </a>`
      ).join('') +
      '</div>';
  }

  div.innerHTML = `${avatar}<div class="msg-bubble">${html}${sourcesHtml}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addTyping() {
  const container = document.getElementById('chatMessages');
  const div       = document.createElement('div');
  div.className   = 'msg ai';
  div.id          = 'typingIndicator';
  div.innerHTML   = `
    <div class="msg-avatar ai" aria-hidden="true">🇵🇭</div>
    <div class="msg-bubble">
      <div class="chat-typing" aria-label="Typing">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function removeTyping() {
  document.getElementById('typingIndicator')?.remove();
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function sendChat() {
  if (isChatPending) return;

  const input = document.getElementById('chatInput');
  const text  = input.value.trim();
  if (!text) return;

  input.value           = '';
  input.style.height    = 'auto';
  isChatPending         = true;
  document.getElementById('chatSendBtn').disabled = true;

  addMsg('user', escHtml(text));
  addTyping();

  chatHistory.push({ role: 'user', parts: [{ text }] });

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages:     chatHistory.slice(-10),   // send last 10 turns
        useGrounding: true,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Server error ${resp.status}`);
    }

    const data        = await resp.json();
    const replyText   = data.text || 'Sorry, I could not generate a response.';
    const chunks      = data.groundingMetadata?.groundingChunks || [];
    const sources     = chunks.map(c => c.web || c.groundingChunk?.web).filter(Boolean);

    chatHistory.push({ role: 'model', parts: [{ text: replyText }] });

    removeTyping();
    addMsg('ai', mdToHtml(replyText), sources);

    if (sources.length) {
      document.getElementById('chatGroundingBadge').classList.remove('hidden');
    }
  } catch (e) {
    removeTyping();
    addMsg('ai', `<span style="color:var(--ph-red);font-weight:600;">Error:</span> ${escHtml(e.message)}`);
  }

  isChatPending = false;
  document.getElementById('chatSendBtn').disabled = false;
  document.getElementById('chatInput').focus();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function statusClass(s) {
  return { ongoing: 'status-ongoing', active: 'status-active', ended: 'status-ended', upcoming: 'status-upcoming' }[s] || 'status-ongoing';
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function mdToHtml(md) {
  if (!md) return '';

  let html = md
    // 1. Handle Bold (**text**)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 2. Handle Italics (*text*)
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // 3. Handle Headers (### Header)
    .replace(/^### (.*$)/gm, '<h3 style="margin-top:12px; margin-bottom:4px; color:var(--ph-blue);">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="margin-top:16px; margin-bottom:8px; color:var(--ph-blue);">$1</h2>');

  // 4. THE LIST FIX: 
  // Convert lines starting with * into <li> items
  html = html.replace(/^\s*[\*|-]\s+(.*)$/gm, '<li>$1</li>');
  
  // Wrap adjacent <li> items into a single <ul>
  html = html.replace(/(<li>.*<\/li>(\s*<li>.*<\/li>)*)/g, '<ul>$1</ul>');

  // 5. Handle remaining newlines for paragraphs
  // We split by <ul> blocks so we don't accidentally add <br> inside lists
  const parts = html.split(/(<ul>[^]*?<\/ul>)/g);
  html = parts.map(part => {
    if (part.startsWith('<ul>')) return part;
    return part
      .replace(/\n\n+/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }).join('');

  return html;
}