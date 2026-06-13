// src/lib/commands/help.ts
// `help` command: lists all registered commands sorted alphabetically.
// Requirements: 2.1, 2.2, 2.3

import { registerCommand, getRegistry } from './index';

registerCommand({
  name: 'help',
  description: 'Lista todos los comandos disponibles / List all available commands',
  execute(_args, _ctx) {
    const registry = getRegistry();

    if (registry.size === 0) {
      return { type: 'text', content: 'No hay comandos disponibles.' };
    }

    // Sort alphabetically (Req. 2.1) and pad name to 20 chars (Req. 2.2)
    const lines = Array.from(registry.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((def) => `${def.name.padEnd(20)}${def.description}`)
      .join('\n');

    return { type: 'text', content: lines };
  },
});
