'use client'

import React from 'react'
import { Banner, Pill, Select } from '@payloadcms/ui'

import { ActivityChart, RankingChart } from './components/charts.js'
import { LinksTable } from './components/links-table.js'
import { Panel } from './components/panel.js'
import { Stat } from './components/stats.js'
import { styleSlug } from './constants.js'
import { useFilters } from './hooks/use-filters.js'
import { type Metric, RANGES, type Range, type Report } from './types.js'
import { attribution, formatMoney, formatNumber, formatRate } from './utils.js'

export function Dashboard({
  report,
  error,
  link,
  range,
  isPro,
}: {
  report: Report | null
  error: string
  link: string
  range: Range
  isPro: boolean
}) {
  const filters = useFilters(link, range)

  const managed = report?.links ?? []
  const totals = report?.totals
  const breakdown = attribution(managed)
  const period = isPro ? report?.analytics?.totals : null
  const topLinks: Metric[] = managed
    .filter((item) => item.synced)
    .slice(0, 7)
    .map((item) => ({
      name: item.shortLink.replace(/^https?:\/\//, ''),
      clicks: item.clicks,
      leads: item.leads,
      sales: item.sales,
      saleAmount: item.saleAmount,
    }))

  const warnings = [
    ...(!report?.complete && report
      ? ['Link pagination reached its limit; totals may be incomplete.']
      : []),
    ...(report?.warnings ?? []),
    ...(report?.analytics?.warnings ?? []),
  ]

  return (
    <main className={`${styleSlug}`}>
      <header className={`${styleSlug}__header`}>
        <h1>Analytics</h1>
        <Pill pillStyle={isPro ? 'success' : 'light'} rounded>
          {isPro ? 'Pro' : 'Free'}
        </Pill>
      </header>

      {error && <Banner type="danger">{error}</Banner>}

      {report && (
        <div className={`${styleSlug}__main`}>
          <div className={`${styleSlug}__toolbar`}>
            <div className={`${styleSlug}__filter`}>
              <label htmlFor="dub-link-filter">Link</label>
              <Select
                inputId="dub-link-filter"
                isClearable={false}
                isSearchable={report.allLinks.length > 8}
                onChange={(option) => {
                  if (!Array.isArray(option)) filters.setSelectedLink(String(option?.value ?? ''))
                }}
                options={[
                  { label: 'All managed links', value: '' },
                  ...report.allLinks.map((item) => ({
                    label: item.shortLink || item.externalId,
                    value: item.externalId || item.shortLink,
                  })),
                ]}
                value={{
                  label:
                    report.allLinks.find(
                      (item) => (item.externalId || item.shortLink) === filters.selectedLink
                    )?.shortLink || 'All managed links',
                  value: filters.selectedLink,
                }}
              />
            </div>

            {isPro && (
              <div className={`${styleSlug}__filter ${styleSlug}__filter--range`}>
                <label htmlFor="dub-range-filter">Reporting period</label>
                <Select
                  inputId="dub-range-filter"
                  isClearable={false}
                  isSearchable={false}
                  onChange={(option) => {
                    if (!Array.isArray(option))
                      filters.setSelectedRange(String(option?.value ?? '30d') as Range)
                  }}
                  options={RANGES}
                  value={RANGES.find((item) => item.value === filters.selectedRange)}
                />
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <div className={`${styleSlug}__notices`}>
              {warnings.map((warning, index) => (
                <Banner key={`${index}-${warning}`} type="warning">
                  {warning}
                </Banner>
              ))}
            </div>
          )}

          <div className={`${styleSlug}__section-heading`}>
            <div>
              <h2>Overview</h2>
              <p>All-time performance across your links</p>
            </div>
            <span>{formatNumber(managed.length)} managed links</span>
          </div>

          <div className={`${styleSlug}__stats`}>
            <Stat
              detail="Total managed short links"
              label="Links"
              value={formatNumber(managed.length)}
            />
            <Stat
              detail="Lifetime visits"
              emphasis
              label="Clicks"
              value={formatNumber(totals?.clicks ?? 0)}
            />
            <Stat
              detail={`${formatRate(totals?.leads ?? 0, totals?.clicks ?? 0)} click-to-lead rate`}
              label="Leads"
              value={formatNumber(totals?.leads ?? 0)}
            />
            <Stat
              detail={`${formatNumber(totals?.sales ?? 0)} attributed sales - USD`}
              label="Revenue"
              value={formatMoney(totals?.saleAmount ?? 0)}
            />
          </div>

          {isPro && (
            <>
              <div className={`${styleSlug}__section-heading`}>
                <div>
                  <h2>Performance</h2>
                  <p>{RANGES.find((item) => item.value === range)?.label} - UTC</p>
                </div>
              </div>

              {period ? (
                <div className={`${styleSlug}__stats ${styleSlug}__stats--compact`}>
                  <Stat label="Period clicks" value={formatNumber(period.clicks)} />
                  <Stat label="Period leads" value={formatNumber(period.leads)} />
                  <Stat label="Period sales" value={formatNumber(period.sales)} />
                  <Stat label="Period revenue" value={formatMoney(period.saleAmount)} />
                </div>
              ) : (
                <Banner type="warning">Date-filtered metrics require an eligible plan.</Banner>
              )}
            </>
          )}

          <div className={`${styleSlug}__charts-grid`}>
            {isPro && (
              <Panel
                className={`${styleSlug}__panel--wide`}
                detail="Clicks throughout the period"
                title="Traffic"
              >
                <ActivityChart points={report.analytics?.series ?? []} />
              </Panel>
            )}
            <Panel detail="Your most visited links" title="Top performing">
              <RankingChart
                empty="Your links have not received any recorded clicks."
                items={topLinks}
              />
            </Panel>
            <Panel detail="Click attribution from UTM campaigns" title="Campaign">
              <RankingChart
                empty="No campaign attribution. Add UTM campaigns to your links."
                items={
                  isPro && report.analytics?.campaigns.length
                    ? report.analytics.campaigns
                    : breakdown.campaigns
                }
              />
            </Panel>
          </div>

          <div className={`${styleSlug}__section-heading`}>
            <div>
              <h2>Marketing</h2>
              <p>
                {isPro ? 'Selected-period analytics' : 'Lifetime attribution from link metadata'}
              </p>
            </div>
          </div>

          <div className={`${styleSlug}__channels`}>
            <Panel detail="UTM source attribution" title="Sources">
              <RankingChart
                empty="No UTM sources have been assigned."
                items={
                  isPro && report.analytics?.sources.length
                    ? report.analytics.sources
                    : breakdown.sources
                }
              />
            </Panel>
            {isPro ? (
              <>
                <Panel detail="Sites sending your visitors" title="Referrers">
                  <RankingChart items={report.analytics?.referers ?? []} />
                </Panel>
                <Panel detail="Where clicks originate" title="Countries">
                  <RankingChart items={report.analytics?.countries ?? []} />
                </Panel>
                <Panel detail="Visitor device types" title="Devices">
                  <RankingChart items={report.analytics?.devices ?? []} />
                </Panel>
              </>
            ) : (
              <Panel detail="UTM medium attribution" title="Mediums">
                <RankingChart
                  empty="No UTM mediums have been assigned."
                  items={breakdown.mediums}
                />
              </Panel>
            )}
          </div>

          <Panel
            className={`${styleSlug}__panel--table`}
            detail="Top 100 links by lifetime clicks"
            title="Links"
          >
            <LinksTable links={managed} />
          </Panel>
        </div>
      )}
    </main>
  )
}
