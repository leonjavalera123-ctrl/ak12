// Eager, tiny motion gate — the ONLY script the static site pays for.
//
// Motion policy: the OS reduced-motion setting decides, but a ?motion=
// query param overrides it — ?motion=1 forces animations on (handy when
// Windows "Animation effects" is off and you still want to preview the
// animated variant), ?motion=0 forces the static site.
//
// The CSS layer (scroll-cue bob, card hover lift, smooth anchors) keys off
// the html class so a ?motion override previews the SAME variant a visitor
// with that OS setting would get. Without JS the media query alone decides.
//
// GSAP and every animation live in a separate chunk, dynamically imported
// only when motion is on — a reduced-motion visitor never downloads them.

const override = new URLSearchParams(window.location.search).get('motion');
const osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionOn = override === '1' || (override !== '0' && !osReduced);

document.documentElement.classList.add(motionOn ? 'motion-on' : 'motion-off');

if (motionOn) {
  import('./animations');
}
