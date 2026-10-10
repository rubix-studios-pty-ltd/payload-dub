'use client'

import React from 'react'
import { type Column } from 'payload'
import { Pill, Table } from '@payloadcms/ui'

import { styleSlug } from '../constants.js'
import { type Link } from '../types.js'
import { formatMoney, formatNumber, formatRate, safeHref } from '../utils.js'

function column(accessor: string, heading: string, cells: React.ReactNode[]): Column {
  return {
    accessor,
    active: true,
    field: { name: accessor, type: 'text' } as Column['field'],
    Heading: heading,
    renderedCells: cells,
  }
}

export function LinksTable({ links }: { links: Link[] }) {
  const visible = links.slice(0, 100)

  if (!links.length) {
    return <div className={`${styleSlug}__empty`}>No managed links for this selection.</div>
  }

  const columns: Column[] = [
    column(
      'shortLink',
      'Short link',
      visible.map((link) => {
        const url = safeHref(link.shortLink)

        return url ? (
          <a href={url} key={link.id} rel="noopener noreferrer" target="_blank">
            {link.shortLink}
          </a>
        ) : (
          <span key={link.id}>{link.shortLink || '—'}</span>
        )
      })
    ),
    column(
      'source',
      'Collection',
      visible.map((link) => link.source)
    ),
    column(
      'campaign',
      'Campaign',
      visible.map((link) => link.campaign || '—')
    ),
    column(
      'status',
      'Status',
      visible.map((link) => (
        <Pill key={link.id} pillStyle={link.synced ? 'success' : 'warning'} size="small">
          {link.synced ? 'Available' : 'Unavailable'}
        </Pill>
      ))
    ),
    column(
      'clicks',
      'Clicks',
      visible.map((link) => (link.synced ? formatNumber(link.clicks) : '—'))
    ),
    column(
      'leads',
      'Leads',
      visible.map((link) => (link.synced ? formatNumber(link.leads) : '—'))
    ),
    column(
      'rate',
      'Lead rate',
      visible.map((link) => (link.synced ? formatRate(link.leads, link.clicks) : '—'))
    ),
    column(
      'sales',
      'Sales',
      visible.map((link) => (link.synced ? formatNumber(link.sales) : '—'))
    ),
    column(
      'revenue',
      'Revenue',
      visible.map((link) => (link.synced ? formatMoney(link.saleAmount) : '—'))
    ),
  ]

  return (
    <>
      <Table
        ariaLabel="Managed Dub links"
        columns={columns}
        data={visible.map((item) => ({ ...item }))}
      />

      {links.length > visible.length && (
        <p className={`${styleSlug}__table-note`}>
          Showing the top {visible.length} of {formatNumber(links.length)} links by lifetime clicks.
        </p>
      )}
    </>
  )
}
