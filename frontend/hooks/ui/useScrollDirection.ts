'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface UseScrollDirectionOptions {
  threshold?: number
  initialDirection?: 'up' | 'down'
}

export function useScrollDirection(options: UseScrollDirectionOptions = {}) {
  const { threshold = 10, initialDirection = 'up' } = options
  
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>(initialDirection)
  const lastScrollY = useRef(0)

  const updateScrollDirection = useCallback(() => {
    const scrollY = window.pageYOffset

    // Si el scroll es menor que threshold, no cambiar
    if (Math.abs(scrollY - lastScrollY.current) < threshold) {
      return
    }

    // Determinar dirección
    const direction = scrollY > lastScrollY.current ? 'down' : 'up'
    
    // Actualizar solo si cambió
    setScrollDirection(prev => prev !== direction ? direction : prev)

    // Actualizar último scroll
    lastScrollY.current = scrollY > 0 ? scrollY : 0
  }, [threshold])

  useEffect(() => {
    window.addEventListener('scroll', updateScrollDirection, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollDirection)
    }
  }, [updateScrollDirection])

  return scrollDirection
}
