import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
scrollTo(0, 0)
const $ = (s, c = document) => c.querySelector(s)
const $$ = (s, c = document) => [...c.querySelectorAll(s)]
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches

/* ---------- Smooth scroll ---------- */
const lenis = new Lenis({ lerp: 0.09, smoothWheel: !reduce })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
lenis.stop()

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href')
  const el = id === '#top' ? document.body : $(id)
  if (!el) return
  e.preventDefault()
  closeMenu()
  lenis.scrollTo(id === '#top' ? 0 : el, { offset: id === '#stanze' || id === '#prenota' ? 0 : -10, duration: 1.6 })
})

/* ---------- Word split (keeps inner spans like .grad) ---------- */
function splitWords(el) {
  const walk = (node, wrapChain) => {
    ;[...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return
          if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(' '))
          const w = document.createElement('span')
          w.className = 'word'
          const inner = document.createElement('i')
          inner.textContent = tok
          let host = inner
          wrapChain.forEach((tpl) => {
            const c = tpl.cloneNode(false)
            c.appendChild(host)
            host = c
          })
          w.appendChild(host)
          frag.appendChild(w)
        })
        n.replaceWith(frag)
      } else if (n.nodeType === 1) {
        walk(n, [...wrapChain, n])
        // unwrap original element (its clone now wraps each word)
        if (wrapChain.length >= 0) n.replaceWith(...n.childNodes)
      }
    })
  }
  walk(el, [])
  return $$('.word > i, .word > * ', el).filter((x) => x.parentElement.classList.contains('word'))
}

/* ---------- Loader + intro ---------- */
const loader = $('#loader')
const num = $('#loaderNum')
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
  tl.to('.hero__video', { scale: 1, duration: 2.4, ease: 'power2.out' }, 0)
  tl.from('.hero .line__in', { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.12 }, 0.15)
  tl.from('.hero__kicker', { opacity: 0, y: 30, duration: 1 }, 0.4)
  tl.from('.hero__lead, .hero__ctas > *', { opacity: 0, y: 40, duration: 1, stagger: 0.1 }, 0.8)
  tl.from('.hero__badge', { scale: 0, rotate: -120, duration: 1.4, ease: 'elastic.out(1,.6)' }, 0.9)
  tl.from('.header', { yPercent: -100, duration: 1 }, 0.9)
}
function runLoader() {
  const tl = gsap.timeline()
  tl.to('.loader__word span', { y: 0, yPercent: -0, opacity: 1, duration: 0.9, stagger: 0.06, ease: 'power4.out', startAt: { yPercent: 110 } })
  const o = { v: 0 }
  tl.to(o, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => (num.textContent = Math.round(o.v)) }, 0.1)
  tl.to('.loader__word span', { yPercent: -110, opacity: 0, duration: 0.6, stagger: 0.03, ease: 'power3.in' }, '+=0.15')
  tl.to('.loader__dots,.loader__count,.loader__star', { opacity: 0, duration: 0.4 }, '<')
  tl.to(loader, { yPercent: -100, duration: 1.1, ease: 'power4.inOut', onStart: intro }, '-=0.1')
  tl.set(loader, { display: 'none' })
  tl.add(() => { lenis.start(); initScroll() })
}
if (reduce) {
  loader.remove(); lenis.start(); initScroll()
} else {
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(() => requestAnimationFrame(runLoader))
}

/* ---------- Header / progress ---------- */
const header = $('#header')
const prog = $('#progress')
let lastY = 0, headerHidden = false, introDone = false
setTimeout(() => (introDone = true), 4500)
lenis.on('scroll', ({ scroll, limit }) => {
  header.classList.toggle('is-solid', scroll > 40)
  const hide = scroll > lastY && scroll > 500 && !menuOpen
  if (hide !== headerHidden && introDone) {
    headerHidden = hide
    gsap.to(header, { yPercent: hide ? -110 : 0, duration: 0.5, ease: 'power3.out', overwrite: true })
  }
  lastY = scroll
  prog.style.transform = `scaleX(${limit ? scroll / limit : 0})`
})

/* ---------- Menu ---------- */
const menu = $('#menu')
const menuBtn = $('#menuBtn')
const menuBg = $('#menuBg')
let menuOpen = false
const mtl = gsap.timeline({ paused: true, defaults: { ease: 'power4.inOut' } })
mtl.set(menu, { visibility: 'visible' })
  .to(menu, { clipPath: 'circle(150% at calc(100% - 60px) 40px)', duration: 1 })
  .from('.menu__list a', { yPercent: 120, duration: 0.9, stagger: 0.07, ease: 'power4.out' }, 0.35)
  .from('.menu__foot > *', { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 }, 0.7)
function openMenu() {
  menuOpen = true
  menuBtn.setAttribute('aria-expanded', 'true')
  document.body.classList.add('menu-open')
  headerHidden = false; gsap.to(header, { yPercent: 0, duration: 0.3, overwrite: true })
  lenis.stop(); mtl.timeScale(1).play()
}
function closeMenu() {
  if (!menuOpen) return
  menuOpen = false
  menuBtn.setAttribute('aria-expanded', 'false')
  document.body.classList.remove('menu-open')
  mtl.timeScale(1.6).reverse(); lenis.start()
  menuBg.classList.remove('on')
}
menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()))
addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu())
$$('.menu__list a').forEach((a) => {
  a.addEventListener('mouseenter', () => { menuBg.style.backgroundImage = `url(${a.dataset.img})`; menuBg.classList.add('on') })
})

/* ---------- Cursor, magnetic, tilt ---------- */
if (fine) {
  const cur = $('#cursor')
  const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' })
  const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' })
  addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY) })
  document.addEventListener('mouseover', (e) => cur.classList.toggle('is-big', !!e.target.closest('a,button,.room,[data-tilt]')))

  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1,.5)' })
    const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1,.5)' })
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect()
      x((e.clientX - r.left - r.width / 2) * 0.3); y((e.clientY - r.top - r.height / 2) * 0.4)
    })
    el.addEventListener('mouseleave', () => { x(0); y(0) })
  })

  $$('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5 })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5 })
    gsap.set(el, { transformPerspective: 900 })
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect()
      ry(((e.clientX - r.left) / r.width - 0.5) * 12); rx(-((e.clientY - r.top) / r.height - 0.5) * 12)
    })
    el.addEventListener('mouseleave', () => { rx(0); ry(0) })
  })
}

/* ---------- Sparks (canvas) ---------- */
;(() => {
  const cv = $('#sparks'); if (!cv || reduce) return
  const ctx = cv.getContext('2d'); let W, H, ps = []
  const size = () => { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight }
  size(); addEventListener('resize', size)
  const spawn = () => ({ x: Math.random() * W, y: H + 10, r: Math.random() * 2.4 + 0.6, vy: Math.random() * 1.6 + 0.5, vx: (Math.random() - 0.5) * 0.7, life: 0, max: Math.random() * 220 + 120, h: Math.random() * 40 + 15 })
  let vis = true
  new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(cv)
  ;(function loop() {
    requestAnimationFrame(loop); if (!vis) return
    ctx.clearRect(0, 0, W, H)
    if (ps.length < 90 && Math.random() < 0.6) ps.push(spawn())
    ps = ps.filter((p) => p.life < p.max)
    ps.forEach((p) => {
      p.life++; p.y -= p.vy; p.x += p.vx + Math.sin(p.life / 20) * 0.3
      const a = 1 - p.life / p.max
      ctx.beginPath(); ctx.fillStyle = `hsla(${p.h},100%,60%,${a})`; ctx.shadowColor = `hsl(${p.h},100%,55%)`; ctx.shadowBlur = 12
      ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill()
    })
  })()
})()

/* ---------- Scroll animations ---------- */
let scrollInit = false
function initScroll() {
  if (scrollInit) return; scrollInit = true

  // heading word reveals
  $$('.reveal-lines').forEach((h) => {
    splitWords(h)
    gsap.from($$('.word', h).map((w) => w.firstElementChild), {
      yPercent: 115, rotate: 5, duration: 1.1, stagger: 0.045, ease: 'power4.out',
      scrollTrigger: { trigger: h, start: 'top 85%' },
    })
  })
  // big CTA lines
  gsap.from('.cta .line__in', { yPercent: 115, duration: 1.3, stagger: 0.15, ease: 'power4.out', scrollTrigger: { trigger: '.cta', start: 'top 65%' } })
  gsap.from('.cta .lead, .cta__row > *', { y: 40, opacity: 0, duration: 1, stagger: 0.12, scrollTrigger: { trigger: '.cta', start: 'top 55%' } })

  // simple fades
  $$('.eyebrow, .intro__cols p, .lead:not(.cta .lead)').forEach((el) =>
    gsap.from(el, { opacity: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }))

  // counters
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, o = { v: 0 }
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () =>
      gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => {
        el.textContent = Math.round(o.v).toLocaleString('it-IT') + ('k' in el.dataset ? 'K' : '') + ('plus' in el.dataset ? '+' : '')
      } }) })
  })
  gsap.from('.stat', { opacity: 0, y: 60, duration: 1, stagger: 0.12, scrollTrigger: { trigger: '.stats', start: 'top 85%' } })

  // horizontal showcase
  const track = $('#showsTrack')
  const dist = () => Math.max(0, track.scrollWidth - innerWidth)
  gsap.to(track, { x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: '.shows', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } })
  $$('.ticket__img img').forEach((img) =>
    gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.shows', start: 'top top', end: () => '+=' + dist(), scrub: true } }))

  // cards grid
  ScrollTrigger.batch('.gcard, .soc, .room, .rev, .where__map', { start: 'top 90%', once: true,
    onEnter: (b) => gsap.from(b, { opacity: 0, y: 90, rotate: 2, scale: 0.94, duration: 1.1, stagger: 0.1, ease: 'power4.out' }) })

  // band parallax + text
  gsap.fromTo('.band__bg', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.band', scrub: true } })
  gsap.from('.band__txt', { scale: 0.85, opacity: 0, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.band', start: 'top 50%' } })

  // clients + booking
  gsap.from('.clienti__sheet', { scale: 0.88, opacity: 0, borderRadius: 120, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: '.clienti__sheet', start: 'top 88%' } })
  gsap.from('.booking > *', { opacity: 0, y: 70, duration: 1.1, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.booking', start: 'top 85%' } })

  // footer big text
  gsap.from('.footer__big', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'power4.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } })
  ScrollTrigger.refresh()
}

/* ---------- Rooms / booking preview ---------- */
const roomImg = $('#roomImg'), roomBadge = $('#roomBadge'), fRoom = $('#fRoom')
$$('.room').forEach((r) => r.addEventListener('click', () => {
  $$('.room').forEach((x) => x.classList.remove('is-active')); r.classList.add('is-active')
  fRoom.value = r.dataset.room; roomBadge.textContent = r.dataset.room
  gsap.fromTo(roomImg, { opacity: 0, scale: 1.12 }, { opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' })
  roomImg.src = r.dataset.img
}))
const dIn = $('input[name=from]'), dOut = $('input[name=to]')
const iso = (d) => d.toISOString().slice(0, 10)
const today = new Date(); dIn.min = dOut.min = iso(today)
dIn.addEventListener('change', () => { dOut.min = dIn.value || iso(today); if (dOut.value < dIn.value) dOut.value = dIn.value })
$('#bookForm').addEventListener('submit', (e) => {
  e.preventDefault()
  const f = e.target; let ok = true
  $$('input[required]', f).forEach((i) => { const bad = !i.value.trim(); i.classList.toggle('err', bad); if (bad) ok = false })
  const out = $('#bookOk')
  if (!ok) { out.hidden = false; out.style.cssText = 'background:#ff5a5a22;border-color:#ff5a5a88;color:#ffd0d0'; out.textContent = 'Compila tutti i campi per continuare.'; return }
  out.style.cssText = ''; out.hidden = false
  out.textContent = `Anteprima: richiesta per «${f.room.value}» dal ${f.from.value} al ${f.to.value}, ${f.guests.value} ospiti. (Il modulo non è ancora collegato: usa WhatsApp per prenotare.)`
  gsap.from(out, { y: 20, opacity: 0, duration: 0.6 })
})
