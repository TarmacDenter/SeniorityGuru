import type { ImportPlugin } from '../types'
import { deltaImportPlugin } from './delta'
import { genericImportPlugin } from './generic'
import { jetblueImportPlugin } from './jetblue'

/** All compiled-in upload types. Selection is always explicit. */
function registerImportPlugins(plugins: readonly ImportPlugin[]): readonly ImportPlugin[] {
  const ids = new Set<string>()
  for (const plugin of plugins) {
    if (ids.has(plugin.id)) throw new Error(`Duplicate Import Plugin ID: ${plugin.id}`)
    ids.add(plugin.id)
  }
  return plugins
}

export const importPlugins = registerImportPlugins([jetblueImportPlugin, deltaImportPlugin, genericImportPlugin])

export function getImportPlugin(id: string): ImportPlugin | undefined {
  return importPlugins.find(plugin => plugin.id === id)
}
