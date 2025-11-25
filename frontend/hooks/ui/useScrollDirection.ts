'use client'

import { useEffect, useState } from 'react'

interface UseScrollDirectionOptions {
  threshold?: number
  initialDirection?: 'up' | 'down'
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = 'up' } = options
  
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>(initialDirection)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset

      // Si el scroll es menor que threshold, no cambiar
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        return
      }

      // Determinar dirección
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      
      // Actualizar solo si cambió
      if (direction !== scrollDirection) {
        setScrollDirection(direction)
      }

      // Actualizar último scroll
      setLastScrollY(scrollY > 0 ? scrollY : 0)
    }

    window.addEventListener('scroll', updateScrollDirection, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollDirection)
    }
  }, [scrollDirection, lastScrollY, threshold])

  return scrollDirection
}
