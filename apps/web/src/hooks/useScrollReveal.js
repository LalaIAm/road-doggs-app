import { useEffect, useRef } from 'react'

export function useScrollReveal(delay = 0) {
  const elementRef = useRef(null)

  useEffect(() => {
    const currentElement = elementRef.current
    if (!currentElement) return

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active')
          }, delay)
        }
      })
    }, observerOptions)

    observer.observe(currentElement)

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [delay])

  return elementRef
}
