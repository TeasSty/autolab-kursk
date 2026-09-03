import './style.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = navigator.connection?.saveData
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
const allowFx = !reduceMotion && !saveData && !lowEnd

const year = document.querySelector('[data-year]')
if (year) year.textContent = String(new Date().getFullYear())

const header = document.querySelector('[data-header]')
const onScrollHeader = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 24)
}
onScrollHeader()
window.addEventListener('scroll', onScrollHeader, { passive: true })

const hero = document.querySelector('[data-hero]')
requestAnimationFrame(() => {
  hero?.classList.add('is-open')
})

const revealNodes = document.querySelectorAll(
  '.section-head, .why-list li, .case-card'
)
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  )
  revealNodes.forEach((node) => io.observe(node))
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'))
}

const parallax = document.querySelector('[data-parallax]')
if (allowFx && parallax) {
  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700)
        parallax.style.transform = `scale(1.08) translate3d(0, ${y * 0.12}px, 0)`
        ticking = false
      })
    },
    { passive: true }
  )
}

const switcher = document.querySelector('[data-bay-switcher]')
if (switcher) {
  const tabs = [...switcher.querySelectorAll('[role="tab"]')]
  const panels = [...switcher.querySelectorAll('[data-panel]')]

  const activate = (index) => {
    tabs.forEach((tab, i) => {
      const on = i === index
      tab.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    panels.forEach((panel, i) => {
      const on = i === index
      panel.classList.toggle('is-active', on)
      if (on) panel.removeAttribute('hidden')
      else panel.setAttribute('hidden', '')
    })
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(Number(tab.dataset.bay)))
  })

  switcher.querySelectorAll('[data-bay-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      const active = switcher.querySelector('[role="tab"][aria-selected="true"]')
      const label = active?.textContent?.trim() || 'услугу'
      const car = document.querySelector('input[name="car"]')
      if (car && !car.value) car.value = label
    })
  })
}

document.querySelectorAll('[data-magnetic]').forEach((btn) => {
  if (!allowFx || window.matchMedia('(pointer: coarse)').matches) return
  btn.addEventListener('pointermove', (e) => {
    const rect = btn.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`
  })
  btn.addEventListener('pointerleave', () => {
    btn.style.transform = ''
  })
})

const form = document.querySelector('[data-book-form]')
const status = document.querySelector('[data-form-status]')
form?.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = new FormData(form)
  if (String(data.get('company') || '').trim()) {
    status.textContent = 'Отправка отклонена.'
    status.classList.add('is-error')
    return
  }

  const name = String(data.get('name') || '').trim()
  const phone = String(data.get('phone') || '').trim()
  const car = String(data.get('car') || '').trim()
  const note = String(data.get('note') || '').trim()

  if (!name || !phone || !car) {
    status.textContent = 'Заполните имя, телефон и авто/услугу.'
    status.classList.add('is-error')
    return
  }

  const message = [
    'Здравствуйте! Хочу записаться в АвтоЛаб.',
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Авто / услуга: ${car}`,
    note ? `Комментарий: ${note}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  status.textContent = 'Открываем WhatsApp…'
  status.classList.remove('is-error')
  window.open(`https://wa.me/79308577700?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
})

function initBeams() {
  const canvas = document.getElementById('beam-canvas')
  if (!canvas || !allowFx) {
    canvas?.remove()
    return
  }

  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return

  let w = 0
  let h = 0
  let raf = 0
  const beams = Array.from({ length: 3 }, (_, i) => ({
    x: 0.55 + i * 0.12,
    speed: 0.00015 + i * 0.00005,
    phase: i * 1.7,
    width: 90 + i * 40,
  }))

  const resize = () => {
    w = canvas.width = window.innerWidth * devicePixelRatio
    h = canvas.height = window.innerHeight * devicePixelRatio
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })

  const draw = (t) => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    for (const beam of beams) {
      const drift = Math.sin(t * beam.speed + beam.phase) * 40
      const x = window.innerWidth * beam.x + drift
      const grad = ctx.createLinearGradient(x, 0, x + beam.width, window.innerHeight)
      grad.addColorStop(0, 'rgba(196,163,90,0)')
      grad.addColorStop(0.45, 'rgba(196,163,90,0.05)')
      grad.addColorStop(1, 'rgba(196,163,90,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + beam.width, 0)
      ctx.lineTo(x + beam.width * 0.35, window.innerHeight)
      ctx.lineTo(x - beam.width * 0.55, window.innerHeight)
      ctx.closePath()
      ctx.fill()
    }
    raf = requestAnimationFrame(draw)
  }

  const onVis = () => {
    if (document.hidden) cancelAnimationFrame(raf)
    else raf = requestAnimationFrame(draw)
  }
  document.addEventListener('visibilitychange', onVis)
  raf = requestAnimationFrame(draw)
}

initBeams()
