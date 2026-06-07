import type { IGamePlugin } from './IGamePlugin.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPlugin = IGamePlugin<any, any, any>

class GameEngine {
  private plugins: Map<string, AnyPlugin> = new Map()

  register(plugin: AnyPlugin): void {
    this.plugins.set(plugin.id, plugin)
    console.log(`[engine] plugin enregistré : "${plugin.id}"`)
  }

  get(id: string): AnyPlugin {
    const plugin = this.plugins.get(id)
    if (!plugin) throw new Error(`Plugin "${id}" introuvable.`)
    return plugin
  }

  has(id: string): boolean {
    return this.plugins.has(id)
  }
}

export const gameEngine = new GameEngine()
