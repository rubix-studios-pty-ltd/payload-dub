import React from 'react'

import { styleSlug } from '../constants.js'

export function Stat({
  label,
  value,
  detail,
  emphasis = false,
}: {
  label: string
  value: string
  detail?: string
  emphasis?: boolean
}) {
  return (
    <div
      className={[`${styleSlug}__stat`, emphasis && `${styleSlug}__stat--emphasis`]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={`${styleSlug}__stat-label`}>{label}</span>

      <strong className={`${styleSlug}__stat-number`}>{value}</strong>

      {detail && <span className={`${styleSlug}__stat-detail`}>{detail}</span>}
    </div>
  )
}
