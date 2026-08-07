// Animation layer — loaded ONLY when motion.ts decides motion is on, and
// pure enhancement: the site renders complete and readable before this
// runs, so users with JS disabled — or prefers-reduced-motion — get the
// full static site.
//
// Hidden-then-revealed states are set from JS (gsap.set / gsap.from),
// never in CSS. If this chunk fails to load, nothing is ever hidden.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// Mobile address-bar show/hide fires height-only resizes; a full refresh
// mid-pin visibly jumps. Nothing here measures the dynamic viewport
// height (panels use svh), so those refreshes are pure cost.
ScrollTrigger.config({ ignoreMobileResize: true });
// The rail swap changes the document height before any trigger exists, so
// native scroll restoration on reload/back-forward would land Chromium
// users a screen away from where they were. Manual is GSAP's own
// recommendation for pinned layouts; the static site keeps native restore.
ScrollTrigger.clearScrollMemory('manual');
initHero();
initRoad();
initSeasons();
// Titillium swaps in with font-display: swap; if that lands after window
// load, every trigger position measured above is stale. No-op otherwise.
document.fonts?.ready.then(() => ScrollTrigger.refresh());

/* ---------------------------------------------------------------- hero */

function initHero() {
  // Entrance: the whole hero block rises into place.
  gsap.from('.hero-inner', { opacity: 0, y: 44, duration: 0.9, ease: 'power2.out' });

  // Stat counters count up from 0 to their real (already-rendered) values.
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el, i) => {
    const target = Number(el.dataset.count);
    const original = el.textContent ?? '';
    const counter = { n: 0 };
    gsap.to(counter, {
      n: target,
      duration: 1.6,
      delay: 0.4 + i * 0.18,
      ease: 'power2.out',
      onUpdate: () => (el.textContent = String(Math.round(counter.n))),
      // Restore the exact rendered string: a fractional stat (half-points
      // races exist in F1) must not end permanently rounded.
      onComplete: () => (el.textContent = original),
    });
  });

  // The track ribbon drifts slower than the page: cheap parallax depth.
  gsap.to('.ribbon', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ------------------------------------------------- the Road (horizontal) */

// The signature move: the career chapters pin to the viewport and travel
// SIDEWAYS as you scroll down — karting on the left, Formula 1 on the
// right, like a lap unfolding. The vertical stack remains the layout for
// static/reduced-motion visitors; this function opts into the rail.
function initRoad() {
  const section = document.querySelector<HTMLElement>('.road');
  const rail = section?.querySelector<HTMLElement>('.chapters');
  if (!section || !rail) return;

  // The rail is a wide-viewport experience. On portrait phones the panels
  // would be forced into deep internal scrolling that fights the scrub; on
  // landscape phones calc(100svh - chrome) collapses them to slivers. Small
  // screens keep the vertical story instead. gsap.matchMedia re-evaluates
  // on rotate/resize and reverts every tween and trigger cleanly.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 700px) and (min-height: 481px)', () => {
    const cleanup = buildRail(section, rail);
    return cleanup;
  });
}

function buildRail(section: HTMLElement, rail: HTMLElement): (() => void) | void {
  section.classList.add('road--rail');

  const distance = () =>
    Math.max(0, rail.scrollWidth - (rail.parentElement?.clientWidth ?? window.innerWidth));

  // Degenerate case: everything already fits — nothing to scroll.
  if (distance() === 0) {
    section.classList.remove('road--rail');
    return;
  }

  // Panels get exactly the height left under the section header — measured,
  // not guessed, so the budget is honest at every viewport. Scroll-invariant
  // because both rects shift together.
  const chrome = Math.round(
    rail.getBoundingClientRect().top -
      section.getBoundingClientRect().top +
      parseFloat(getComputedStyle(section).paddingBottom)
  );
  section.style.setProperty('--road-chrome', `${chrome}px`);

  // JS-built progress bar: exists only in the enhanced experience. Its
  // hidden initial state comes from gsap.set, honoring the no-CSS-hiding
  // rule even for JS-created elements.
  const progress = document.createElement('div');
  progress.className = 'road-progress';
  progress.setAttribute('aria-hidden', 'true');
  section.append(progress);
  gsap.set(progress, { scaleX: 0 });

  // One timeline drives rail AND progress bar so both share the same scrub
  // smoothing — separate triggers would let the bar lead the panels.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => `+=${distance()}`,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
  tl.to(rail, { x: () => -distance(), ease: 'none' }, 0).to(
    progress,
    { scaleX: 1, ease: 'none' },
    0
  );

  // Each chapter wakes up as it rolls into view along the rail — except the
  // ones already on stage at x=0, which would just flicker at page load.
  rail.querySelectorAll<HTMLElement>('.era').forEach((panel) => {
    if (panel.offsetLeft < window.innerWidth * 0.78) return;
    gsap.from(panel, {
      opacity: 0.25,
      scale: 0.96,
      duration: 0.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: panel,
        containerAnimation: tl,
        start: 'left 78%',
        once: true,
      },
    });
  });

  // Keyboard support inside the pinned rail: panels are focusable scroll
  // containers (arrow keys scroll a dense chapter), and focusing anything
  // in an off-screen panel drives the page to the scroll position that
  // brings that chapter onto the stage.
  const panels = rail.querySelectorAll<HTMLElement>('.era');
  panels.forEach((p) => p.setAttribute('tabindex', '0'));
  const onFocusIn = (e: FocusEvent) => {
    const panel = (e.target as HTMLElement).closest<HTMLElement>('.era');
    const st = tl.scrollTrigger;
    if (!panel || !st) return;
    const target = st.start + Math.min(panel.offsetLeft, distance());
    if (Math.abs(window.scrollY - target) > 40) window.scrollTo({ top: target });
  };
  rail.addEventListener('focusin', onFocusIn);

  // matchMedia cleanup: GSAP reverts the tweens/triggers it saw created;
  // the DOM changes this function made are ours to undo.
  return () => {
    rail.removeEventListener('focusin', onFocusIn);
    panels.forEach((p) => p.removeAttribute('tabindex'));
    progress.remove();
    section.style.removeProperty('--road-chrome');
    section.classList.remove('road--rail');
  };
}

/* ------------------------------------------------------------- seasons */

function initSeasons() {
  document.querySelectorAll<HTMLElement>('.season').forEach((section) => {
    // The big year numeral slides in from the left, the summary follows.
    gsap.from(section.querySelector('.year'), {
      x: -70,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    });
    gsap.from(section.querySelector('.head-info'), {
      y: 24,
      opacity: 0,
      duration: 0.7,
      delay: 0.15,
      ease: 'power2.out',
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    });

    // The leader banner pops in; a champion banner (should a title land —
    // the component renders it from data automatically) also gets confetti.
    const leader = section.querySelector<HTMLElement>('.leader-banner');
    const champion = section.querySelector<HTMLElement>('.champion-banner');
    const banner = champion ?? leader;
    if (banner) {
      gsap.from(banner, {
        scale: 0,
        rotation: -6,
        duration: 0.55,
        ease: 'back.out(2.2)',
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          once: true,
          onEnter: () => {
            if (champion) confettiBurst(section, champion);
          },
        },
      });
    }
  });

  // Race cards rise in small staggered batches as they enter the viewport.
  // Animated on the list-item wrappers, so card styles are never touched.
  // Items already in view when the script lands (slow connection, deep
  // scroll restore) are left alone — hiding rendered content is worse than
  // skipping its entrance.
  const items = gsap.utils
    .toArray<HTMLElement>('.race-grid > li')
    .filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.9);
  gsap.set(items, { y: 26, opacity: 0 });
  ScrollTrigger.batch(items, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }),
  });
}

/* ------------------------------------------------------------ confetti */

// Tiny hand-rolled confetti in AK12 colors: teal, silver, gold, white.
// Dormant until a season file carries isChampion: true — then the banner
// appears from data and this celebrates it. ~90 flakes, throwaway canvas.
function confettiBurst(section: HTMLElement, origin: HTMLElement) {
  const canvas = document.createElement('canvas');
  const rect = section.getBoundingClientRect();
  const originRect = origin.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = Math.min(rect.height, 700);
  Object.assign(canvas.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    pointerEvents: 'none',
  } as CSSStyleDeclaration);
  section.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const startX = originRect.left - rect.left + originRect.width / 2;
  const startY = originRect.top - rect.top + originRect.height / 2;
  const colors = ['#00f5d0', '#00a19c', '#c7ced2', '#f0b323', '#eef4f2'];

  const flakes = Array.from({ length: 90 }, () => ({
    x: startX,
    y: startY,
    vx: (Math.random() - 0.5) * 11,
    vy: -(Math.random() * 8 + 3),
    w: Math.random() * 7 + 4,
    h: Math.random() * 4 + 2,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  const started = performance.now();
  const DURATION = 2200;

  function frame(now: number) {
    const t = now - started;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.globalAlpha = t > DURATION - 500 ? Math.max(0, (DURATION - t) / 500) : 1;
    for (const f of flakes) {
      f.vy += 0.16; // gravity
      f.x += f.vx;
      f.y += f.vy;
      f.rot += f.vr;
      ctx!.save();
      ctx!.translate(f.x, f.y);
      ctx!.rotate(f.rot);
      ctx!.fillStyle = f.color;
      ctx!.fillRect(-f.w / 2, -f.h / 2, f.w, f.h);
      ctx!.restore();
    }
    if (t < DURATION) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
