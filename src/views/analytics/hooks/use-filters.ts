'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from '@payloadcms/ui'

import { type Range } from '../types.js'

export function useFilters(link: string, range: Range) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [pending, startTransition] = useTransition()
  const [selectedLink, setLink] = useState(link)
  const [selectedRange, setRange] = useState<Range>(range)
  const selected = useRef({ link, range })

  useEffect(() => {
    selected.current = { link, range }

    setLink(link)
    setRange(range)
  }, [link, range])

  const update = useCallback(
    (next: { link: string; range: Range }) => {
      if (next.link === selected.current.link && next.range === selected.current.range) {
        return
      }

      selected.current = next

      setLink(next.link)
      setRange(next.range)

      const query = new URLSearchParams(searchParams.toString())

      if (next.link) {
        query.set('link', next.link)
      } else {
        query.delete('link')
      }

      if (next.range !== '30d') {
        query.set('range', next.range)
      } else {
        query.delete('range')
      }

      const search = query.toString()

      startTransition(() => {
        router.push(search ? `${pathname}?${search}` : pathname)
      })
    },
    [pathname, router, searchParams]
  )

  const setSelectedLink = useCallback(
    (value: string) => update({ ...selected.current, link: value }),
    [update]
  )

  const setSelectedRange = useCallback(
    (value: Range) => update({ ...selected.current, range: value }),
    [update]
  )

  return {
    pending,
    selectedLink,
    selectedRange,
    setSelectedLink,
    setSelectedRange,
  }
}
