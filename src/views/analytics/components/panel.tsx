'use client'

import React from 'react'

import { styleSlug } from '../constants.js'

export function Panel({
  title,
  detail,
  children,
  className = '',
}: {
  title: string
  detail?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`${styleSlug}__panel ${className}`}>
      <div className={`${styleSlug}__panel-heading`}>
        <div>
          <h2>{title}</h2>

          {detail && <p>{detail}</p>}
        </div>
      </div>

      <div className={`${styleSlug}__panel-body`}>{children}</div>
    </section>
  )
}
