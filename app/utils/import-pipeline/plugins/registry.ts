import type { ImportPlugin } from '../types'
import { deltaImportPlugin } from './delta'
import { genericImportPlugin } from './generic'
import { jetblueImportPlugin } from './jetblue'

/** All compiled-in upload types. Selection is always explicit. */
export const importPlugins: readonly ImportPlugin[] = [jetblueImportPlugin, deltaImportPlugin, genericImportPlugin]

export function getImportPlugin(id: string): ImportPlugin | undefined {
  return importPlugins.find(plugin => plugin.id === id)
}
