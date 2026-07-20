/* ============================================================
   NAR ÇİÇEĞİM RESTAURANT — Dijital Açılış Davetiyesi
   Vanilla JS. Tüm animasyonlar transform/opacity üzerinden (GPU).
   Görseller hiçbir şekilde yeniden çizilmez; yalnızca hareketlendirilir.
   ============================================================ */

/* ---------- 1) AYARLAR — sadece bu bloğu düzenleyin ---------- */
const CONFIG = {
  // Açılış tarihi. Geri sayımın canlı çalışması için ileri bir tarih girin.
  // Tarih geçmişte kalırsa görseldeki sabit rakamlar olduğu gibi kalır.
  eventDate: '2025-08-30T13:00:00+03:00',

  instagram: 'https://www.instagram.com/narcicegimrestaurant',
  facebook:  'https://www.facebook.com/narcicegimrestaurant',
  phone:     'tel:+903120000000',
  whatsapp:  'https://wa.me/905000000000?text=' +
             encodeURIComponent('Merhaba, Nar Çiçeğim Restaurant açılışına katılacağımı bildirmek istiyorum.'),
  maps:      'https://www.google.com/maps/search/?api=1&query=' +
             encodeURIComponent('Atatürk Mah. 123. Sk. No:45/B Çankaya Ankara'),

  // İsteğe bağlı: kendi ortam müziğiniz. Boş bırakılırsa yumuşak
  // bir ambiyans sesi tarayıcı içinde üretilir (ek dosya gerekmez).
  musicFile: '',
  musicVolume: 0.22
};

/* ---------- 2) GÖRSEL GEOMETRİSİ (orijinal piksel değerleri) ---------- */
const IMG_W = 863, IMG_H = 1822, SRC = 'davetiye.png';

// İç davetiyenin mantıksal bölümleri (kart kenarlarından bölünmüştür)
const SLICES = [
  { y:0,    h:600, anim:'fade', sheen:true },   // logo + başlık
  { y:600,  h:375, anim:'rise' },               // kurdele + kapı sahnesi
  { y:975,  h:170, anim:'cols' },               // TARİH | SAAT | YER
  { y:1145, h:155, anim:'rise' },               // geri sayım
  { y:1300, h:120, anim:'rise' },               // mesaj kartı
  { y:1420, h:155, anim:'rise' },               // konum kartı
  { y:1575, h:85,  anim:'rise' },               // katılım bildirimi
  { y:1660, h:95,  anim:'rise' },               // ikramlar / hediyeler
  { y:1755, h:67,  anim:'rise' }                // müzik + sosyal medya
];

// Bilgi kartının üç sütunu (soldan / sağdan / aşağıdan)
const INFO_COLS = [
  { x:98,  w:232, cls:'col-a' },
  { x:330, w:204, cls:'col-b' },
  { x:534, w:230, cls:'col-c' }
];

// Görselin üzerindeki tıklanabilir alanlar
const HOTS = [
  { x:95,  y:1425, w:675, h:150, act:'map',   label:'Konumu Google Haritalar\'da aç' },
  { x:95,  y:1580, w:675, h:80,  act:'wa',    label:'Katılım durumumu bildir' },
  { x:418, y:1762, w:52,  h:52,  act:'ig',    label:'Instagram sayfamız', round:true },
  { x:476, y:1762, w:52,  h:52,  act:'fb',    label:'Facebook sayfamız',  round:true },
  { x:534, y:1762, w:52,  h:52,  act:'tel',   label:'Bizi arayın',        round:true },
  { x:18,  y:1760, w:158, h:56,  act:'music', label:'Müziği aç veya kapat' }
];

// Geri sayım kutularının iç ölçüleri
const CD_BOXES = [
  { x:118, w:147 }, { x:289, w:136 }, { x:449, w:133 }, { x:607, w:133 }
];
const CD_TOP = 1204, CD_H = 54;

/* ---------- 3) KISA YARDIMCILAR ---------- */
const $  = (s, r = document) => r.querySelector(s);
const el = (t, c) => { const n = document.createElement(t); if (c) n.className = c; return n; };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const cover   = $('#cover');
const sealHit = $('#sealHit');
const invite  = $('#invite');
const card    = $('#card');
const flash   = $('#flash');
const fx      = $('#fx');
const musicBtn= $('#musicBtn');
const modal   = $('#mapModal');

/* ============================================================
   4) SES — dosya gerekmez, Web Audio ile üretilir
   ============================================================ */
const Audio_ = {
  ctx: null, master: null, musicGain: null, nodes: [], playing: false, timer: null, htmlAudio: null,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  /* balmumu kırılma sesi: kısa gürültü patlaması + çıtırtılar */
  crack() {
    this.init(); if (!this.ctx) return; this.resume();
    const ctx = this.ctx, t0 = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.35);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const p = i / len;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 3.2);
    }
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2100, t0);
    bp.frequency.exponentialRampToValueAtTime(520, t0 + 0.3);
    bp.Q.value = 1.1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.6, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.34);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + 0.36);

    // ardından iki kuru çıtırtı
    [0.06, 0.13].forEach((dt, i) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(320 - i * 90, t0 + dt);
      og.gain.setValueAtTime(0.22, t0 + dt);
      og.gain.exponentialRampToValueAtTime(0.001, t0 + dt + 0.09);
      o.connect(og).connect(this.master); o.start(t0 + dt); o.stop(t0 + dt + 0.1);
    });
  },

  /* açılış anı: yumuşak altın parıltı sesi */
  chime() {
    this.init(); if (!this.ctx) return; this.resume();
    const ctx = this.ctx, t0 = ctx.currentTime;
    [784, 1046.5, 1568].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + i * 0.07);
      g.gain.linearRampToValueAtTime(0.16 / (i + 1), t0 + i * 0.07 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.07 + 2.2);
      o.connect(g).connect(this.master); o.start(t0 + i * 0.07); o.stop(t0 + i * 0.07 + 2.3);
    });
  },

  /* ortam müziği — kapalı başlar, kullanıcı açar */
  startMusic() {
    if (CONFIG.musicFile) {
      if (!this.htmlAudio) {
        this.htmlAudio = new Audio(CONFIG.musicFile);
        this.htmlAudio.loop = true;
        this.htmlAudio.volume = CONFIG.musicVolume;
      }
      this.htmlAudio.play().catch(() => {});
      this.playing = true; return;
    }
    this.init(); if (!this.ctx) return; this.resume();
    const ctx = this.ctx;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicGain.gain.exponentialRampToValueAtTime(CONFIG.musicVolume, ctx.currentTime + 2.5);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.4;
    lp.connect(this.musicGain).connect(this.master);

    // sıcak, sabit bir yastık akoru
    [110, 164.81, 220, 329.63].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 5;
      g.gain.value = 0.13 / (i * 0.6 + 1);
      o.connect(g).connect(lp); o.start();
      this.nodes.push(o);
      // yavaş nefes alma
      const lfo = ctx.createOscillator(), la = ctx.createGain();
      lfo.frequency.value = 0.05 + i * 0.017; la.gain.value = g.gain.value * 0.55;
      lfo.connect(la).connect(g.gain); lfo.start();
      this.nodes.push(lfo);
    });

    // aralıklı, uzak çan notaları
    const scale = [587.33, 659.25, 783.99, 880, 1174.66];
    const bell = () => {
      if (!this.playing) return;
      const f = scale[(Math.random() * scale.length) | 0];
      const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      o.connect(g).connect(this.musicGain);
      o.start(t); o.stop(t + 3.5);
      this.timer = setTimeout(bell, 2600 + Math.random() * 3800);
    };
    this.playing = true;
    this.timer = setTimeout(bell, 1600);
  },

  stopMusic() {
    this.playing = false;
    clearTimeout(this.timer);
    if (this.htmlAudio) { this.htmlAudio.pause(); return; }
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(Math.max(this.musicGain.gain.value, 0.0001), t);
    this.musicGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const nodes = this.nodes.slice(); this.nodes = [];
    setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1400);
  },

  toggle() {
    this.playing ? this.stopMusic() : this.startMusic();
    musicBtn.setAttribute('aria-pressed', String(this.playing));
    musicBtn.setAttribute('aria-label', this.playing ? 'Müziği kapat' : 'Müziği aç');
  }
};

/* ============================================================
   5) KONFETİ / TOZ / IŞIK PARÇACIKLARI
   ============================================================ */
const FX = {
  ctx: null, w: 0, h: 0, dpr: 1, parts: [], raf: 0, until: 0,

  size() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth; this.h = innerHeight;
    fx.width = this.w * this.dpr; fx.height = this.h * this.dpr;
    fx.style.width = this.w + 'px'; fx.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  },

  burst() {
    if (REDUCED) return;
    this.ctx = fx.getContext('2d'); this.size();
    fx.classList.add('on');
    const gold = ['#f0d79a', '#c9a24a', '#e8c66f', '#a5802f', '#fff2cf'];
    const n = innerWidth < 480 ? 90 : 150;

    for (let i = 0; i < n; i++) {
      this.parts.push({
        t: 'c',
        x: this.w * (0.5 + (Math.random() - 0.5) * 0.5),
        y: this.h * 0.5 + (Math.random() - 0.5) * 60,
        vx: (Math.random() - 0.5) * 9,
        vy: -3 - Math.random() * 9,
        w: 4 + Math.random() * 7, h: 6 + Math.random() * 10,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.28,
        c: gold[(Math.random() * gold.length) | 0], a: 1
      });
    }
    for (let i = 0; i < 60; i++) {
      this.parts.push({
        t: 'd',
        x: Math.random() * this.w, y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.35, vy: -0.15 - Math.random() * 0.45,
        r: 0.7 + Math.random() * 1.9, a: 0.15 + Math.random() * 0.55,
        c: '#f4e0b0'
      });
    }
    for (let i = 0; i < 10; i++) {
      this.parts.push({
        t: 'g',
        x: this.w * (0.2 + Math.random() * 0.6), y: this.h * (0.25 + Math.random() * 0.5),
        r: 20 + Math.random() * 60, a: 0, life: 0, max: 40 + Math.random() * 50
      });
    }
    this.until = performance.now() + 7000;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.loop(t));
  },

  loop(t) {
    const c = this.ctx;
    c.clearRect(0, 0, this.w, this.h);
    for (const p of this.parts) {
      if (p.t === 'c') {
        p.vy += 0.16; p.vx *= 0.995;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        if (p.y > this.h + 40) p.a -= 0.05;
        c.save(); c.globalAlpha = Math.max(p.a, 0);
        c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = p.c;
        c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.55 + 0.45 * Math.abs(Math.cos(p.rot))));
        c.restore();
      } else if (p.t === 'd') {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = this.h + 10; p.x = Math.random() * this.w; }
        c.globalAlpha = p.a; c.fillStyle = p.c;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      } else {
        p.life++;
        p.a = Math.sin(Math.PI * Math.min(p.life / p.max, 1)) * 0.5;
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(255,236,190,' + p.a.toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,236,190,0)');
        c.globalAlpha = 1; c.fillStyle = g;
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.283); c.fill();
      }
    }
    c.globalAlpha = 1;

    if (t < this.until) {
      this.raf = requestAnimationFrame(x => this.loop(x));
    } else {
      fx.classList.remove('on');
      setTimeout(() => { c.clearRect(0, 0, this.w, this.h); this.parts.length = 0; }, 450);
    }
  }
};

/* ============================================================
   6) İÇ DAVETİYEYİ KUR
   ============================================================ */
function buildInvite() {
  const frag = document.createDocumentFragment();

  SLICES.forEach(s => {
    const d = el('div', 'slice' + (s.anim === 'rise' ? ' rise' : '') + (s.anim === 'cols' ? ' cols' : ''));
    d.style.setProperty('--y', s.y);
    d.style.setProperty('--h', s.h);

    const img = new Image();
    img.src = SRC; img.alt = ''; img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');
    d.appendChild(img);

    if (s.anim === 'cols') {
      INFO_COLS.forEach(cdef => {
        const col = el('div', 'col ' + cdef.cls);
        col.style.left  = 'calc(var(--iw) * ' + cdef.x + ' / ' + IMG_W + ')';
        col.style.width = 'calc(var(--iw) * ' + cdef.w + ' / ' + IMG_W + ')';
        col.style.setProperty('--x', cdef.x);
        col.style.setProperty('--y', s.y);
        const ci = new Image();
        ci.src = SRC; ci.alt = ''; ci.setAttribute('aria-hidden', 'true');
        col.appendChild(ci);
        d.appendChild(col);
      });
    }
    if (s.sheen) d.appendChild(el('div', 'sheen'));

    frag.appendChild(d);
  });

  // görselin gerçek metnini ekran okuyucular için tek seferde tanımla
  const alt = el('p', 'sr-only');
  alt.textContent = 'Nar Çiçeğim Restaurant büyük açılışına davetlisiniz. ' +
    'Tarih 30 Ağustos 2025 Cumartesi, saat 13.00, ' +
    'Atatürk Mahallesi 123. Sokak No 45/B Çankaya, Ankara.';
  frag.appendChild(alt);

  // tıklanabilir alanlar
  HOTS.forEach(h => {
    const b = el('button', 'hot' + (h.round ? ' round' : ''));
    b.type = 'button';
    b.setAttribute('aria-label', h.label);
    b.dataset.act = h.act;
    b.style.zIndex = '5';
    b.style.left   = 'calc(var(--iw) * ' + h.x + ' / ' + IMG_W + ')';
    b.style.top    = 'calc(var(--iw) * ' + h.y + ' / ' + IMG_W + ')';
    b.style.width  = 'calc(var(--iw) * ' + h.w + ' / ' + IMG_W + ')';
    b.style.height = 'calc(var(--iw) * ' + h.h + ' / ' + IMG_W + ')';
    frag.appendChild(b);
  });

  card.appendChild(frag);
  card.addEventListener('click', onHot);
}

function onHot(e) {
  const b = e.target.closest('.hot'); if (!b) return;
  switch (b.dataset.act) {
    case 'map':   openModal(); break;
    case 'wa':    open(CONFIG.whatsapp); break;
    case 'ig':    open(CONFIG.instagram); break;
    case 'fb':    open(CONFIG.facebook); break;
    case 'tel':   location.href = CONFIG.phone; break;
    case 'music': Audio_.toggle(); break;
  }
}
const open = u => window.open(u, '_blank', 'noopener');

/* ---------- genişliği ölç, tüm hesaplar buna bağlı ---------- */
let lastW = 0;
function measure() {
  const w = card.getBoundingClientRect().width;
  if (w && Math.abs(w - lastW) > 0.4) {
    lastW = w;
    card.style.setProperty('--iw', w + 'px');
  }
}
/* kısa süreli takip: kaydırma çubuğu / adres çubuğu değişimlerini yakalar */
function trackWidth(ms) {
  const end = performance.now() + ms;
  const step = () => { measure(); if (performance.now() < end) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ============================================================
   7) SCROLL İLE BÖLÜM AÇILIŞLARI (yalnızca ilk kez)
   ============================================================ */
function observe() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  card.querySelectorAll('.slice').forEach(s => io.observe(s));
}

/* ============================================================
   8) CANLI GERİ SAYIM (tarih ileriyse devreye girer)
   ============================================================ */
function countdown() {
  const target = new Date(CONFIG.eventDate).getTime();
  if (!target || target - Date.now() <= 0) return;   // geçmişse görsel olduğu gibi kalır

  const wrap = el('div', 'cd');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.zIndex = '4';
  const cells = CD_BOXES.map(b => {
    const n = el('div', 'cd-num');
    n.style.left   = 'calc(var(--iw) * ' + b.x + ' / ' + IMG_W + ')';
    n.style.top    = 'calc(var(--iw) * ' + CD_TOP + ' / ' + IMG_W + ')';
    n.style.width  = 'calc(var(--iw) * ' + b.w + ' / ' + IMG_W + ')';
    n.style.height = 'calc(var(--iw) * ' + CD_H + ' / ' + IMG_W + ')';
    wrap.appendChild(n);
    return n;
  });
  card.appendChild(wrap);

  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  card.appendChild(live);

  let prev = ['', '', '', ''];
  const pad = v => String(v).padStart(2, '0');

  const tick = () => {
    const diff = Math.max(target - Date.now(), 0);
    const s = Math.floor(diff / 1000);
    const v = [Math.floor(s / 86400), pad(Math.floor(s / 3600) % 24), pad(Math.floor(s / 60) % 60), pad(s % 60)];
    v.forEach((val, i) => {
      const t = String(val);
      if (t === prev[i]) return;
      prev[i] = t;
      cells[i].textContent = t;
      if (!REDUCED) {
        cells[i].classList.remove('tick');
        void cells[i].offsetWidth;
        cells[i].classList.add('tick');
      }
    });
    live.textContent = 'Açılışa ' + v[0] + ' gün ' + v[1] + ' saat kaldı.';
    if (diff > 0) setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  tick();
}

/* ============================================================
   9) KAPAK AÇILIŞ SENARYOSU
   ============================================================ */
let opened = false;

function openInvitation() {
  if (opened) return;
  opened = true;
  sealHit.disabled = true;

  Audio_.init();
  Audio_.crack();

  // 1) mühür parlar ve çatlar
  cover.classList.add('is-cracking');

  // 2) kurdele çözülmeye başlar
  setTimeout(() => cover.classList.add('is-untying'), 420);

  // 3) kapak iki yana açılır (≈2 sn)
  setTimeout(() => {
    cover.classList.remove('is-untying');
    cover.classList.add('is-opening');
    flash.classList.add('go');
    Audio_.chime();
    FX.burst();

    invite.hidden = false;
    measure();
    trackWidth(3000);
    requestAnimationFrame(() => {
      card.classList.add('in');
      observe();
      countdown();
    });
  }, 780);

  // 4) kapak tamamen kaybolur, sayfa serbest kalır
  setTimeout(() => {
    cover.classList.add('is-gone');
    document.body.classList.remove('is-locked');
    musicBtn.classList.add('show');
  }, 2500);

  setTimeout(() => { cover.remove(); }, 3200);
}

/* ============================================================
   10) KONUM ONAY KUTUSU
   ============================================================ */
let lastFocus = null;
function openModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('on'));
  setTimeout(() => $('#mapYes').focus(), 260);
}
function closeModal() {
  modal.classList.remove('on');
  setTimeout(() => { modal.hidden = true; lastFocus && lastFocus.focus(); }, 320);
}
modal.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) closeModal(); });
$('#mapYes').addEventListener('click', () => { open(CONFIG.maps); closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

/* ============================================================
   11) BAŞLAT
   ============================================================ */
sealHit.addEventListener('click', openInvitation);
sealHit.addEventListener('pointerdown', () => Audio_.init(), { once: true });
musicBtn.addEventListener('click', () => Audio_.toggle());

buildInvite();
measure();
setTimeout(() => musicBtn.classList.add('show'), 900);
addEventListener('resize', () => { measure(); if (FX.ctx) FX.size(); }, { passive: true });
addEventListener('orientationchange', () => setTimeout(measure, 250));
if (window.ResizeObserver) {
  const ro = new ResizeObserver(measure);
  ro.observe(card);
  ro.observe(document.documentElement);
}
trackWidth(2500);
addEventListener('scroll', measure, { passive: true });

// sekme arka plana alınınca müziği duraklat
document.addEventListener('visibilitychange', () => {
  if (document.hidden && Audio_.playing) Audio_.ctx && Audio_.ctx.suspend();
  else if (!document.hidden && Audio_.playing) Audio_.resume();
});
