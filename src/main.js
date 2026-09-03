import './style.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = navigator.connection?.saveData
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
const allowFx = !reduceMotion && !saveData && !lowEnd

if (!allowFx) document.documentElement.classList.add('no-fx')

const year = document.querySelector('[data-year]')
if (year) year.textContent = String(new Date().getFullYear())

const hero = document.querySelector('[data-hero]')
requestAnimationFrame(() => {
  hero?.classList.add('is-lit')
})

const parallax = document.querySelector('[data-parallax]')
if (allowFx && parallax) {
  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 640)
        parallax.style.transform = `scale(1.04) translate3d(0, ${y * 0.08}px, 0)`
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
      tab.tabIndex = on ? 0 : -1
    })
    panels.forEach((panel, i) => {
      const on = i === index
      panel.classList.toggle('is-active', on)
      if (on) panel.removeAttribute('hidden')
      else panel.setAttribute('hidden', '')
    })
  }

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1
    tab.addEventListener('click', () => activate(Number(tab.dataset.bay)))
    tab.addEventListener('keydown', (e) => {
      const cur = tabs.indexOf(tab)
      let next = cur
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % tabs.length
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + tabs.length) % tabs.length
      if (e.key === 'Home') next = 0
      if (e.key === 'End') next = tabs.length - 1
      if (next === cur) return
      e.preventDefault()
      activate(next)
      tabs[next].focus()
    })
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

if (allowFx && 'IntersectionObserver' in window) {
  const cards = document.querySelectorAll('.case-card')
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const i = [...cards].indexOf(el)
        el.style.transitionDelay = `${Math.max(0, i) * 0.07}s`
        el.classList.add('is-in')
        io.unobserve(el)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  )
  cards.forEach((card) => io.observe(card))
} else {
  document.querySelectorAll('.case-card').forEach((card) => card.classList.add('is-in'))
}

const form = document.querySelector('[data-book-form]')
const status = document.querySelector('[data-form-status]')
form?.addEventListener('submit', (e) => {
  e.preventDefault()
  const data = new FormData(form)
  if (String(data.get('company') || '').trim()) {
    status.textContent = ''
    return
  }

  const name = String(data.get('name') || '').trim()
  const phone = String(data.get('phone') || '').trim()
  const car = String(data.get('car') || '').trim()
  const note = String(data.get('note') || '').trim()

  if (!name || !phone || !car) {
    status.textContent = 'Нужны имя, телефон и авто или услуга.'
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
