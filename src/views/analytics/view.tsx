import React from 'react'
import { type CollectionSlug, type DocumentViewServerProps } from 'payload'
import { Dub } from 'dub'

import { Dashboard } from './dashboard.js'
import { loadReport } from './data.js'
import { RANGES, type Range, type Report } from './types.js'

import './styles.css'

type Props = DocumentViewServerProps & {
  dubApiKey: string
  isPro?: boolean
  linksSlug: CollectionSlug
  tenantId?: string
}

export async function DubAnalytics({
  initPageResult,
  searchParams,
  dubApiKey,
  isPro = false,
  linksSlug,
  tenantId,
}: Props) {
  const { req } = initPageResult
  const allowed = Boolean(req.user && req.user.collection === req.payload.config.admin.user)

  if (!allowed) {
    return <p>You do not have permission.</p>
  }

  const query = searchParams as Record<string, unknown>
  const candidate = typeof query?.range === 'string' ? query.range : '30d'

  const range: Range = RANGES.some(({ value }) => value === candidate)
    ? (candidate as Range)
    : '30d'

  const link = typeof query?.link === 'string' ? query.link : ''

  let report: Report | null = null
  let error = ''

  try {
    report = await loadReport({
      dub: new Dub({ token: dubApiKey }),
      payload: req.payload,
      req,
      linksSlug,
      tenantId,
      isPro,
      range,
      externalId: link || undefined,
    })
  } catch (cause) {
    req.payload.logger.error({ err: cause, msg: 'Failed to load Dub analytics' })
    error = 'Unable to load Dub analytics. Check the server logs for details.'
  }

  return <Dashboard error={error} isPro={isPro} link={link} range={range} report={report} />
}
