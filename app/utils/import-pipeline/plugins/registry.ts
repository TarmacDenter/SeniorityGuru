import type { ImportPlugin } from '../types'
import { deltaImportPlugin } from './delta'
import { genericImportPlugin } from './generic'
import { createJetBlueImportPlugin } from './jetblue'

/** All compiled-in upload types. Selection is always explicit. */
function registerImportPlugins(plugins: readonly ImportPlugin[]): readonly ImportPlugin[] {
  const ids = new Set<string>()
  for (const plugin of plugins) {
    if (ids.has(plugin.id)) throw new Error(`Duplicate Import Plugin ID: ${plugin.id}`)
    ids.add(plugin.id)
  }
  return plugins
}

// jetBlue is currently leaving names with -EU flag in the data that should not be split out.. eg MCO and EWR
export const importPlugins = registerImportPlugins([createJetBlueImportPlugin({ splitEuBases: false }), deltaImportPlugin, genericImportPlugin])

export function getImportPlugin(id: string): ImportPlugin | undefined {
  return importPlugins.find(plugin => plugin.id === id)
}
