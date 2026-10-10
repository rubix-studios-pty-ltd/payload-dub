
'use client'

import React, { type CSSProperties } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { styleSlug } from '../constants.js'
import { type Metric, type Series } from '../types.js'
import { formatNumber } from '../utils.js'

const tooltipStyle: CSSProperties = {
  background: 'var(--color-bg, #fff)',
  border: '1px solid var(--color-border, #e4e4e7)',
  borderRadius: 8,
  color: 'var(--color-text, #18181b)',
  fontSize: 12,
}

const tickStyle = {
  fill: 'var(--color-text-secondary, #71717a)',
  fontSize: 11,
}

export function ActivityChart({ points }: { points: Series[] }) {
  if (!points.length) {
    return <div className={`${styleSlug}__empty`}>No activity recorded for this period.</div>
  }

  return (
    <div aria-label="Clicks over time" className={`${styleSlug}__chart`} role="img">
      <ResponsiveContainer height="100%" minHeight={220} width="100%">
        <AreaChart data={points} margin={{ top: 14, right: 12, left: -20, bottom: 2 }}>
          <defs>
            <linearGradient id="dub-clicks-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--dub-accent)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--dub-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 4" vertical={false} />

          <XAxis
            axisLine={false}
            dataKey="label"
            minTickGap={28}
            tick={tickStyle}
            tickLine={false}
            tickMargin={12}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={tickStyle}
            tickLine={false}
            width={48}
          />

          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value)), 'Clicks']}
          />

          <Area
            activeDot={{ r: 4 }}
            dataKey="clicks"
            fill="url(#dub-clicks-gradient)"
            stroke="var(--dub-accent)"
            strokeWidth={2.5}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RankingChart({
  items,
  empty = 'No data available yet.',
}: {
  items: Metric[]
  empty?: string
}) {
  const values = items.filter((item) => item.clicks > 0).slice(0, 7)

  if (!values.length) {
    return <div className={`${styleSlug}__empty`}>{empty}</div>
  }

  return (
    <div
      aria-label="Click totals by category"
      className={`${styleSlug}__chart ${styleSlug}__chart--ranking`}
      role="img"
    >
      <ResponsiveContainer height="100%" minHeight={200} width="100%">
        <BarChart
          data={values}
          layout="vertical"
          margin={{ top: 6, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 4" />

          <XAxis
            allowDecimals={false}
            axisLine={false}
            tick={tickStyle}
            tickLine={false}
            type="number"
          />

          <YAxis
            axisLine={false}
            dataKey="name"
            tick={tickStyle}
            tickLine={false}
            tickMargin={10}
            type="category"
            width={128}
          />

          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value)), 'Clicks']}
          />

          <Bar
            dataKey="clicks"
            fill="var(--dub-accent)"
            maxBarSize={24}
            radius={[0, 5, 5, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
