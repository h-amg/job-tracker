"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions {
  hasNextPage: boolean
  isFetching: boolean
  fetchNextPage: () => void
  threshold?: number
}

export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  fetchNextPage,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      setIsIntersecting(entry.isIntersecting)

      if (entry.isIntersecting && hasNextPage && !isFetching) {
        fetchNextPage()
      }
    },
    [hasNextPage, isFetching, fetchNextPage]
  )

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: `${threshold}px`,
    })

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, threshold])

  return {
    elementRef,
    isIntersecting,
  }
}
