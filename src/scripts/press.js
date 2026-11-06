// All the motion on the site. Everything here is an extra: with this script
// missing, or with reduced motion on, the paper still reads the same.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const CALM = '(prefers-reduced-motion: reduce)';
const prefersCalm = () => matchMedia(CALM).matches;

const lenis = prefersCalm() ? null : new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
const RUNNING_HEAD_ROOM = 60;

if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function setUpPageTurning() {
  const sheets = gsap.utils.toArray('.broadsheet[data-page]');
  const label = document.getElementById('page-now');
  if (sheets.length < 2 || !label) return;

  let current = 0;

  sheets.forEach((sheet, index) => {
    ScrollTrigger.create({
      trigger: sheet,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        current = index;
        label.textContent = `Page ${index + 1}`;
      },
    });
  });

  // offsetTop ignores the tilt a page has before it settles, so a jump always
  // lands on the top of the page.
  const goTo = (sheet) => {
    const top = sheet.offsetParent.offsetTop + sheet.offsetTop - RUNNING_HEAD_ROOM;
    if (lenis) lenis.scrollTo(top, { duration: 1.1 });
    else scrollTo(0, top);
  };

  const turn = (step) => goTo(sheets[gsap.utils.clamp(0, sheets.length - 1, current + step)]);

  document.querySelectorAll('a[href^="#page-"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      goTo(document.querySelector(link.getAttribute('href')));
    });
  });

  document.querySelectorAll('[data-turn]').forEach((button) => {
    button.addEventListener('click', () => turn(Number(button.dataset.turn)));
  });

  addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'ArrowRight') turn(1);
    if (event.key === 'ArrowLeft') turn(-1);
  });
}

function setUpRunningHead() {
  const masthead = document.querySelector('.masthead');
  if (!masthead) return;

  ScrollTrigger.create({
    trigger: masthead,
    start: 'bottom top',
    end: 'max',
    toggleClass: { targets: '.running-head, .page-tab', className: 'is-on' },
  });
}

// The one big moment: the sheet comes off the press and the ink goes down.
async function runThePress() {
  if (!root.classList.contains('press-run')) return;

  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 700))]);

  const banner = document.querySelector('.banner');
  const split = banner ? SplitText.create(banner, { type: 'lines', mask: 'lines' }) : null;

  root.classList.remove('press-run');

  gsap
    .timeline({
      defaults: { ease: 'power3.out' },
      onComplete() {
        split?.revert();
        gsap.set('.broadsheet-front, .title, .folio, .sections, .kicker, .deck', { clearProps: 'all' });
        sessionStorage.setItem('dak-printed', '1');
      },
    })
    .from('.broadsheet-front', { y: 90, rotateX: 5, transformOrigin: '50% 0%', opacity: 0, duration: 1 })
    .from('.title', { clipPath: 'inset(0 100% 0 0)', duration: 1.05, ease: 'power2.inOut' }, 0.15)
    .from('.folio, .sections', { scaleX: 0, opacity: 0, transformOrigin: '50% 50%', duration: 0.7, stagger: 0.08 }, 0.45)
    .from(split?.lines ?? [], { yPercent: 105, duration: 0.8, stagger: 0.09 }, 0.7)
    .from('.front .kicker, .deck, .roundup, .seconds .story, .talking', { opacity: 0, y: 14, duration: 0.55, stagger: 0.05 }, 0.95);
}

// Each page lifts off the desk and settles flat as it scrolls into view.
function settleThePages() {
  gsap.utils.toArray('.broadsheet:not(.broadsheet-front)').forEach((sheet) => {
    gsap.from(sheet, {
      rotateX: -5,
      y: 60,
      transformOrigin: '50% 0%',
      ease: 'none',
      scrollTrigger: { trigger: sheet, start: 'top 100%', end: 'top 62%', scrub: 0.5 },
    });
  });

  gsap.to('.reading-rule', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: true },
  });
}

async function layTheDesk() {
  const wideEnough = matchMedia('(min-width: 1100px)').matches;
  if (!wideEnough || navigator.connection?.saveData) return;

  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  try {
    const [THREE] = await Promise.all([import('three'), import('vanta/dist/vanta.fog.min.js')]);

    // Vanta's build registers each effect on window.VANTA as it loads.
    const desk = window.VANTA.FOG({
      el: '#desk',
      THREE,
      mouseControls: false,
      touchControls: false,
      gyroControls: false,
      baseColor: 0x14120e,
      lowlightColor: 0x24201a,
      midtoneColor: 0x39332a,
      highlightColor: 0x6d6350,
      blurFactor: 0.68,
      speed: 0.7,
      zoom: 1.15,
      scale: 2,
    });

    addEventListener('pagehide', () => desk.destroy(), { once: true });
  } catch (error) {
    // The plain dark desk stays. It looks fine without the fog.
    console.warn('Desk effect not started', error);
  }
}

setUpPageTurning();
setUpRunningHead();

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  runThePress();
  settleThePages();

  const lay = () => layTheDesk();
  if ('requestIdleCallback' in window) requestIdleCallback(lay, { timeout: 2500 });
  else setTimeout(lay, 1200);
});
