import { describe, it, expect } from 'vitest'
import { parseTrendsNotebook, loadTrends } from '../lib/trends.mjs'

const notebook = {
  cells: [
    { cell_type: 'markdown', source: ['# Introduction'], metadata: {} },
    { cell_type: 'markdown', source: ['Google Trends gives us an estimate of search volume. ', 'Perhaps search volume for "Unemployment Benefits" tells us something real.'] },
    { cell_type: 'code', source: ["import pandas as pd", "df_tesla = pd.read_csv('TESLA Search Trend vs Price.csv')"] },
    { cell_type: 'code', source: ["df_btc = pd.read_csv('Bitcoin Search Trend.csv')"] },
    { cell_type: 'markdown', source: ['# Data Exploration'] },
  ],
}

describe('trends lib — the real notebook in C:\\DREAM, honestly summarized', () => {
  it('extracts headings, cell counts and the datasets the notebook reads', () => {
    const s = parseTrendsNotebook(notebook)
    expect(s.ok).toBe(true)
    expect(s.headings).toEqual(['Introduction', 'Data Exploration'])
    expect(s.mdCells).toBe(3)
    expect(s.codeCells).toBe(2)
    expect(s.datasets).toContain('TESLA Search Trend vs Price.csv')
    expect(s.datasets).toContain('Bitcoin Search Trend.csv')
    expect(s.intro).toMatch(/estimate of search volume/)
  })

  it('loads from disk (readFile injected) and keeps the source path', () => {
    const r = loadTrends('C:/DREAM/google trends .txt', { readFile: () => JSON.stringify(notebook) })
    expect(r.ok).toBe(true)
    expect(r.source).toBe('C:/DREAM/google trends .txt')
    expect(r.summary.datasets.length).toBe(2)
  })

  it('missing file is an honest not-found, not fake data', () => {
    const r = loadTrends('X:/nope.txt', { readFile: () => { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e } })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/not found|ENOENT/i)
  })

  it('a file that is not JSON reports a parse error', () => {
    const r = loadTrends('C:/x.txt', { readFile: () => 'not json {{' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/parse/i)
  })
})
