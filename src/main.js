import './style.css'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const saveData = navigator.connection?.saveData
const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4
const allowFx = !reduceMotion && !saveData && !lowEnd
const finePointer = window.matchMedia('(pointer: fine)').matches

if (!allowFx) document.documentElement.classList.add('no-fx')

const year = document.querySelector('[data-year]')
if (year) year.textContent = String(new Date().getFullYear())

/* —— 1. Hero mask + staggered copy —— */
const hero = document.querySelector('[data-hero]')
requestAnimationFrame(() => {
  requestAnimationFrame(() => hero?.classList.add('is-lit'))
})

/* —— 2. Hero parallax scrub —— */
const parallax = document.querySelector('[data-parallax]')
if (allowFx && parallax) {
  let ticking = false
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 720)
        parallax.style.transform = `scale(1.06) translate3d(0, ${y * 0.09}px, 0)`
        ticking = false
      })
    },
    { passive: true }
  )
}

/* —— 3. Magnetic CTA —— */
if (allowFx && finePointer) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = e.clientX - r.left - r.width / 2
      const y = e.clientY - r.top - r.height / 2
      el.style.transform = `translate(${x * 0.08}px, ${y * 0.1 - 2}px)`
    })
    el.addEventListener('pointerleave', () => {
      el.style.transform = ''
    })
  })
}

/* —— 4. Signature: horizontal garage bay rail —— */
const rail = document.querySelector('[data-bay-rail]')
if (rail) {
  const track = rail.querySelector('[data-bay-track]')
  const tabs = [...rail.querySelectorAll('[role="tab"]')]
  const panels = [...rail.querySelectorAll('[data-panel]')]
  const indexEl = document.querySelector('[data-bay-index]')
  const fillEl = document.querySelector('[data-bay-fill]')
  let active = 0
  let syncing = false

  const setActive = (index, { scroll = false } = {}) => {
    if (index < 0 || index >= panels.length) return
    active = index
    tabs.forEach((tab, i) => {
      const on = i === index
      tab.setAttribute('aria-selected', on ? 'true' : 'false')
      tab.tabIndex = on ? 0 : -1
    })
    panels.forEach((panel, i) => {
      panel.classList.toggle('is-active', i === index)
    })
    if (indexEl) indexEl.textContent = String(index + 1).padStart(2, '0')
    if (fillEl) fillEl.style.width = `${((index + 1) / panels.length) * 100}%`
    if (scroll && track) {
      syncing = true
      const target = panels[index]
      track.scrollTo({
        left: target.offsetLeft - (parseFloat(getComputedStyle(track).paddingLeft) || 0),
        behavior: allowFx ? 'smooth' : 'auto',
      })
      window.setTimeout(() => {
        syncing = false
      }, allowFx ? 450 : 0)
    }
  }

  const nearestIndex = () => {
    if (!track) return 0
    const left = track.scrollLeft
    let best = 0
    let bestDist = Infinity
    panels.forEach((panel, i) => {
      const dist = Math.abs(panel.offsetLeft - left - (parseFloat(getComputedStyle(track).paddingLeft) || 0) * 0.15)
      if (dist < bestDist) {
        bestDist = dist
        best = i
      }
    })
    return best
  }

  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1
    tab.addEventListener('click', () => setActive(Number(tab.dataset.bay), { scroll: true }))
    tab.addEventListener('keydown', (e) => {
      const cur = tabs.indexOf(tab)
      let next = cur
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % tabs.length
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + tabs.length) % tabs.length
      if (e.key === 'Home') next = 0
      if (e.key === 'End') next = tabs.length - 1
      if (next === cur) return
      e.preventDefault()
      setActive(next, { scroll: true })
      tabs[next].focus()
    })
  })

  if (track) {
    let scrollTick = false
    track.addEventListener(
      'scroll',
      () => {
        if (syncing || scrollTick) return
        scrollTick = true
        requestAnimationFrame(() => {
          const next = nearestIndex()
          if (next !== active) setActive(next)
          scrollTick = false
        })
      },
      { passive: true }
    )

    /* Drag-to-scroll kinetic feel (desktop) */
    if (allowFx && finePointer) {
      let down = false
      let startX = 0
      let startScroll = 0
      let moved = false

      track.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return
        if (e.target.closest('a, button, input, textarea, label')) return
        down = true
        moved = false
        startX = e.clientX
        startScroll = track.scrollLeft
        track.classList.add('is-dragging')
        track.setPointerCapture(e.pointerId)
      })

      track.addEventListener('pointermove', (e) => {
        if (!down) return
        const dx = e.clientX - startX
        if (Math.abs(dx) > 4) moved = true
        track.scrollLeft = startScroll - dx
      })

      const endDrag = (e) => {
        if (!down) return
        down = false
        track.classList.remove('is-dragging')
        try {
          track.releasePointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
        if (moved) {
          const next = nearestIndex()
          setActive(next, { scroll: true })
        }
      }

      track.addEventListener('pointerup', endDrag)
      track.addEventListener('pointercancel', endDrag)

      track.addEventListener('click', (e) => {
        if (moved) {
          e.preventDefault()
          e.stopPropagation()
          moved = false
        }
      }, true)
    }

    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setActive(Math.min(active + 1, panels.length - 1), { scroll: true })
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActive(Math.max(active - 1, 0), { scroll: true })
      }
    })
  }

  setActive(0)

  rail.querySelectorAll('[data-bay-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      const activeTab = rail.querySelector('[role="tab"][aria-selected="true"]')
      const label = activeTab?.textContent?.trim() || 'услугу'
      const car = document.querySelector('input[name="car"]')
      if (car && !car.value) car.value = label
    })
  })
}

/* —— 5. Scroll reveals (cases + facts) —— */
const revealEls = document.querySelectorAll('[data-reveal]')
if (allowFx && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const el = entry.target
        const siblings = [...el.parentElement.querySelectorAll('[data-reveal]')]
        const i = siblings.indexOf(el)
        el.style.transitionDelay = `${Math.max(0, i) * 0.08}s`
        el.classList.add('is-in')
        io.unobserve(el)
      })
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  )
  revealEls.forEach((el) => io.observe(el))
} else {
  revealEls.forEach((el) => el.classList.add('is-in'))
}

/* —— WhatsApp booking form —— */
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
