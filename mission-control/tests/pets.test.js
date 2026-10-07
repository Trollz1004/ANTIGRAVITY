import { describe, it, expect, vi } from 'vitest'

const pets = await import('../lib/pets.mjs')

describe('Hermes pets integration', () => {
  it('lists only valid installed pets and exposes safe sprite URLs', () => {
    const rows = pets.listInstalledPets({
      petsDir: 'C:/pets',
      readdir: () => [
        { name: 'hermes-girl', isDirectory: () => true },
        { name: '..bad', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
      ],
      readFile: () => JSON.stringify({ id: 'hermes-girl', displayName: 'Hermes-Girl', description: 'Mascot', spritesheetPath: 'spritesheet.webp' }),
      exists: () => true,
    })
    expect(rows).toEqual([{ id: 'hermes-girl', displayName: 'Hermes-Girl', description: 'Mascot', spriteUrl: '/pets/hermes-girl/spritesheet.webp' }])
  })

  it('selects a pet through the Hermes CLI, never by editing config.yaml', async () => {
    const spawned = []
    const spawn = vi.fn((bin, args) => {
      spawned.push({ bin, args })
      return { exitCode: 0, stdout: 'Selected hermes-girl', stderr: '' }
    })
    const result = await pets.selectPet('hermes-girl', { spawn, hermesBin: 'hermes' })
    expect(result).toMatchObject({ ok: true, slug: 'hermes-girl' })
    expect(spawned).toEqual([{ bin: 'hermes', args: ['pets', 'select', 'hermes-girl'] }])
  })

  it('rejects path traversal and unknown pet slugs', async () => {
    await expect(pets.selectPet('../secrets', { spawn: vi.fn(), hermesBin: 'hermes' })).rejects.toThrow(/valid pet slug/i)
  })
})
