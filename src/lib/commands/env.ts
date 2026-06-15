// src/lib/commands/env.ts
// Environment and shell commands: env, printenv, export, which, type, alias, exit, reboot
import { registerCommand } from './index';

// Default environment variables
const DEFAULT_ENV: Record<string, string> = {
  HOME: '/home/visitor',
  USER: 'visitor',
  SHELL: '/bin/bash',
  PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
  TERM: 'xterm-256color',
  LANG: 'es_ES.UTF-8',
  LC_ALL: 'es_ES.UTF-8',
  EDITOR: '/usr/bin/nano',
  HOSTNAME: 'portfolio',
  LOGNAME: 'visitor',
  PWD: '~',
  OLDPWD: '~',
  SHLVL: '1',
  _: '/usr/bin/env',
  HOSTTYPE: 'x86_64',
  MACHTYPE: 'x86_64-pc-linux-gnu',
  OSTYPE: 'linux-gnu',
  VENDOR: 'unknown',
};

// Mutable copy for session env
const sessionEnv: Record<string, string> = { ...DEFAULT_ENV };

export function getEnv(): Record<string, string> {
  return { ...sessionEnv };
}

export function setEnvVar(key: string, value: string): void {
  sessionEnv[key] = value;
}

export function unsetEnvVar(key: string): void {
  delete sessionEnv[key];
}

// env - show all environment variables
registerCommand({
  name: 'env',
  description: 'Muestra todas las variables de entorno / Show all environment variables',
  execute(_args, ctx) {
    const env = getEnv();
    const lines = Object.entries(env)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`);
    return { type: 'text', content: lines.join('\n') };
  },
});

// printenv - print environment variable(s)
registerCommand({
  name: 'printenv',
  description: 'Imprime variables de entorno / Print environment variables',
  execute(args, ctx) {
    if (args.length === 0) {
      return (getEnv as () => Record<string, string>)() // fallback
        ? { type: 'text', content: Object.entries(getEnv()).map(([k, v]) => `${k}=${v}`).join('\n') }
        : { type: 'text', content: '' };
    }
    const env = getEnv();
    const lines = args.map(a => {
      const val = env[a];
      return val !== undefined ? `${val}` : '';
    }).filter(Boolean);
    return { type: 'text', content: lines.join('\n') };
  },
});

// export - set environment variable for session
registerCommand({
  name: 'export',
  description: 'Exporta variable de entorno / Export environment variable: export KEY=value',
  execute(args, ctx) {
    if (args.length === 0) {
      // Show exported vars
      const env = getEnv();
      const lines = Object.entries(env)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `declare -x ${k}="${v}"`);
      return { type: 'text', content: lines.join('\n') };
    }

    const assignment = args.join(' ');
    const eqIndex = assignment.indexOf('=');
    if (eqIndex === -1) {
      // Just export (mark as exported, which in our case does nothing extra)
      const key = assignment;
      if (getEnv()[key] !== undefined) {
        return { type: 'text', content: '' };
      }
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? `bash: export: \`${key}': not a valid identifier`
          : `bash: export: \`${key}': not a valid identifier`
      };
    }

    const key = assignment.slice(0, eqIndex);
    let value = assignment.slice(eqIndex + 1);
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    setEnvVar(key, value);
    return { type: 'text', content: '' };
  },
});

// unset - remove environment variable
registerCommand({
  name: 'unset',
  description: 'Elimina variable de entorno / Unset environment variable',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'unset: falta un operando'
          : 'unset: missing operand'
      };
    }
    args.forEach(a => unsetEnvVar(a));
    return { type: 'text', content: '' };
  },
});

// which - show command location
registerCommand({
  name: 'which',
  description: 'Muestra la ubicación de un comando / Show command location',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: '' };
    }
    // All our commands are "built-in"
    const builtins = ['cd', 'echo', 'export', 'unset', 'alias', 'source', 'exit'];
    const results = args.map(cmd => {
      if (builtins.includes(cmd)) {
        return `${cmd}: shell built-in command`;
      }
      return `/usr/bin/${cmd}`;
    });
    return { type: 'text', content: results.join('\n') };
  },
});

// type - show command type
registerCommand({
  name: 'type',
  description: 'Muestra el tipo de un comando / Show command type',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: '' };
    }
    const builtins = ['cd', 'echo', 'export', 'unset', 'alias', 'source', 'exit', 'type', 'which'];
    const results = args.map(cmd => {
      if (builtins.includes(cmd)) {
        return `${cmd} is a shell builtin`;
      }
      return `${cmd} is /usr/bin/${cmd}`;
    });
    return { type: 'text', content: results.join('\n') };
  },
});

// alias removed — kept in utility.tsx (better UX with ctx.getAliases)

// unalias - remove alias
registerCommand({
  name: 'unalias',
  description: 'Elimina un alias / Remove alias',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'unalias: falta un operando'
          : 'unalias: missing operand'
      };
    }
    const aliases = { ...ctx.getAliases() };
    args.forEach(a => delete aliases[a]);
    ctx.setAliases(aliases);
    return { type: 'text', content: '' };
  },
});

// exit - exit terminal
registerCommand({
  name: 'exit',
  description: 'Cierra la terminal / Exit terminal',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'Sesión terminada. Gracias por visitar mi portfolio.\n[Proceso terminado]'
        : 'Session ended. Thank you for visiting my portfolio.\n[Process terminated]'
    };
  },
});

// reboot - reboot animation
registerCommand({
  name: 'reboot',
  description: 'Reinicia el sistema / Reboot the system',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'Reiniciando el sistema...\n[  OK  ] Deteniendo servicios...\n[  OK  ] Desmontando filesystems...\n[  OK  ] Apagando...\n\nReiniciando... Presiona Enter para continuar.'
        : 'Rebooting system...\n[  OK  ] Stopping services...\n[  OK  ] Unmounting filesystems...\n[  OK  ] Shutting down...\n\nRebooting... Press Enter to continue.'
    };
  },
});

// shutdown - shutdown animation
registerCommand({
  name: 'shutdown',
  description: 'Apaga el sistema / Shutdown the system',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'Apagando el sistema...\n[  OK  ] Deteniendo servicios...\n[  OK  ] Desmontando filesystems...\n[  OK  ] Apagando...\n\nSistema apagado. Presiona Enter para reiniciar.'
        : 'Shutting down...\n[  OK  ] Stopping services...\n[  OK  ] Unmounting filesystems...\n[  OK  ] Shutting down...\n\nSystem halted. Press Enter to restart.'
    };
  },
});

// login - simulate login prompt
registerCommand({
  name: 'login',
  description: 'Simula un prompt de login / Simulate login prompt',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'login: visitor\nPassword: ********\n\nBienvenido a Mangeluk OS 1.0 (Debian GNU/Linux 12 bookworm)\n\nÚltimo login: ' + new Date().toLocaleString() + ' from 127.0.0.1'
        : 'login: visitor\nPassword: ********\n\nWelcome to Mangeluk OS 1.0 (Debian GNU/Linux 12 bookworm)\n\nLast login: ' + new Date().toLocaleString() + ' from 127.0.0.1'
    };
  },
});

// sudo - easter egg
registerCommand({
  name: 'sudo',
  description: 'Modo superusuario (easter egg) / Superuser mode (easter egg)',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: 'usage: sudo <command>' };
    }
    if (args[0] === 'rm' && args.includes('-rf') && args.includes('/')) {
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? 'Nice try, pero no voy a borrar el sistema 😏'
          : 'Nice try, but I\'m not deleting the system 😏'
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `[sudo] contraseña de visitor: \nLo siento, visitor no está en el archivo sudoers. Este incidente será reportado.`
        : `[sudo] password for visitor: \nSorry, visitor is not in the sudoers file. This incident will be reported.`
    };
  },
});

// su - switch user
registerCommand({
  name: 'su',
  description: 'Cambiar usuario / Switch user',
  execute(args, ctx) {
    const user = args[0] || 'root';
    if (user === 'root') {
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? 'su: Autenticación fallida'
          : 'su: Authentication failure'
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `su: Usuario ${user} no existe`
        : `su: User ${user} does not exist`
    };
  },
});

// passwd - change password
registerCommand({
  name: 'passwd',
  description: 'Cambiar contraseña / Change password',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'Cambiando contraseña para visitor.\nNueva contraseña: ********\nLa contraseña no cumple con los requisitos de complejidad.'
        : 'Changing password for visitor.\nNew password: ********\nPassword does not meet complexity requirements.'
    };
  },
});

// clear - enhanced with history support
// (already exists in utility.tsx, this is just a note)

// history - show command history with numbers
// (already exists in utility.tsx)

// help - override to include env commands
// (will be updated in index.ts)
