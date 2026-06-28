// エンジン登録レジストリ
import { localEngine } from './localEngine'
import { claudeEngine } from './claudeEngine'
import { ollamaEngine } from './ollamaEngine'
import type { Engine } from './types'
import type { EngineId } from './settings'

export const ENGINES: Record<EngineId, Engine> = {
  local: localEngine,
  claude: claudeEngine,
  ollama: ollamaEngine,
}

export function getEngine(id: EngineId): Engine {
  return ENGINES[id] ?? localEngine
}

export * from './types'
