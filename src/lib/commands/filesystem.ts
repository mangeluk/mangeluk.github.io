// src/lib/commands/filesystem.ts
// Sistema de archivos simulado para la terminal
import { registerCommand, type CommandContext } from './index';
import { profile } from '@/data/profile';

// Definición del sistema de archivos
interface FileSystemEntry {
  type: 'file' | 'dir';
  content?: string;
  children?: Record<string, FileSystemEntry>;
}

// Estado global mutable para simular filesystem
const fileSystem: Record<string, FileSystemEntry> = {
  '~': {
    type: 'dir',
    children: {
      'about.txt': {
        type: 'file',
        content: profile.es.bio
      },
      'experience': {
        type: 'dir',
        children: {
          'libgot.txt': {
            type: 'file',
            content: `Libgot - Backend Engineering Lead (Mar 2026 - Present)
===============================================
- Liderazgo técnico de equipo backend
- Diseño y optimización de sistemas escalables
- Implementación de IA en flujos de trabajo (Claude, Kiro, Gemini)
- Desarrollo core de funcionalidades complejas`
          },
          'bamboo.txt': {
            type: 'file',
            content: `Bamboo - Full Stack Developer (Nov 2023 - May 2024)
===============================================
- Desarrollo de eComEngine (sistema de pagos)
- Integración con Shopify, WooCommerce, X-cart
- Tecnologías: Laravel, Vue.js, MySQL`
          }
        }
      },
      'projects': {
        type: 'dir',
        children: {
          'agendita.txt': {
            type: 'file',
            content: `Agendita - Agenda Offline-First
================================
- Next.js con exportación estática
- Wrapper en Godot 4 para Android
- Web ↔ Native Bridge (jsbridge://)
- AlarmManager para notificaciones locales`
          },
          'cuandonosjuntamos.txt': {
            type: 'file',
            content: `Cuando Nos Juntamos - Organizador de Reuniones
===============================================
- Backend: Node.js + Express
- Frontend: Vanilla JS, mobile-first
- Cloudflare Pages + Functions
- Cloudflare Turnstile, Rate Limiting`
          },
          'randomath.txt': {
            type: 'file',
            content: `Randomath - Juego de Matemáticas
==================================
- Desarrollado en Godot 4
- Disponible en Google Play`
          },
          'slimeflight.txt': {
            type: 'file',
            content: `SlimeFlight - Juego de Acción
==============================
- 10 personajes desbloqueables
- 3 dificultades
- 24 logros
- Desarrollado en Godot`
          }
        }
      },
      'skills.txt': {
        type: 'file',
        content: `Skills
=======
Backend: PHP (Laravel/Symfony), Node.js, Go, MySQL, PostgreSQL, MongoDB
Frontend: Vue.js, React, Next.js, Tailwind CSS, Radix UI
DevOps: Docker, Git, GitLab, AWS, Cloudflare Pages
Tools: Godot 4, GDScript, Aseprite, Gradle, Android Studio
AI: Claude, Kiro, Gemini, LLMs`
      },
      'readme.md': {
        type: 'file',
        content: `# Portfolio Terminal de Matias Angeluk
=====================================
Bienvenido! Usa 'help' para ver todos los comandos disponibles!`
      },
      '.bashrc': {
        type: 'file',
        content: [
          '# ~/.bashrc: executed by bash(1) for non-login shells.',
          '',
          '# If not running interactively, don\'t do anything',
          'case $- in',
          '    *i*) ;;',
          '      *) return;;',
          'esac',
          '',
          '# History settings',
          'HISTSIZE=1000',
          'HISTFILESIZE=2000',
          'HISTCONTROL=ignoreboth',
          '',
          '# Check window size after each command',
          'shopt -s checkwinsize',
          '',
          '# Make less more friendly for non-text input files',
          '[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"',
          '',
          '# Prompt',
          "PS1='\\[\\e[32m\\]\\u@portfolio\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ '",
          '',
          '# Aliases',
          "alias ll='ls -la'",
          "alias la='ls -A'",
          "alias l='ls -CF'",
          "alias grep='grep --color=auto'",
          "alias rm='rm -i'",
          "alias cp='cp -i'",
          "alias mv='mv -i'",
          '',
          '# Environment',
          'export EDITOR=nano',
          'export LANG=es_ES.UTF-8',
        ].join('\n')
      },
      '.profile': {
        type: 'file',
        content: `# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login exists.

if [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bashrc" ]; then
        . "$HOME/.bashrc"
    fi
fi

if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi`
      },
      '.ssh': {
        type: 'dir',
        children: {
          'authorized_keys': {
            type: 'file',
            content: 'ssh-ed25519 AAAA... visitor@portfolio'
          },
          'config': {
            type: 'file',
            content: `Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3`
          }
        }
      },
      '.config': {
        type: 'dir',
        children: {
          'portfolio': {
            type: 'dir',
            children: {
              'config.json': {
                type: 'file',
                content: JSON.stringify({
                  theme: 'dark',
                  lang: 'es',
                  bootEnabled: true,
                  soundEnabled: false,
                  version: '1.0.0'
                }, null, 2)
              }
            }
          },
          'git': {
            type: 'dir',
            children: {
              'config': {
                type: 'file',
                content: `[user]
    name = Matias Angeluk
    email = matias.angeluk@gmail.com
[core]
    editor = nano
[init]
    defaultBranch = main`
              }
            }
          }
        }
      },
      'nohup.out': {
        type: 'file',
        content: 'nohup: output appended to nohup.out'
      }
    }
  },
  '/etc': {
    type: 'dir',
    children: {
      'hostname': { type: 'file', content: 'portfolio' },
      'hosts': {
        type: 'file',
        content: `127.0.0.1\tlocalhost
127.0.1.1\tportfolio

# The following lines are desirable for IPv6 capable hosts
::1     localhost ip6-localhost ip6-loopback
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters`
      },
      'os-release': {
        type: 'file',
        content: `PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"
NAME="Debian GNU/Linux"
VERSION_ID="12"
VERSION="12 (bookworm)"
VERSION_CODENAME=bookworm
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"`
      },
      'passwd': {
        type: 'file',
        content: `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
visitor:x:1000:1000:visitor:/home/visitor:/bin/bash`
      },
      'group': {
        type: 'file',
        content: `root:x:0:
daemon:x:1:
bin:x:2:
sys:x:3:
www-data:x:33:
visitor:x:1000:`
      },
      'motd': {
        type: 'file',
        content: `
  _    _                       _    __  __
 | |  | |                     | |  |  \\/  |
 | |  | | __ _ _ __   __ _ ___| |_ | \\  / | __ _ _ __ ___
 | |/\\| |/ _\` | '_ \\ / _\` / __| __|| |\\/| |/ _\` | '_ \` _ \\
 \\  /\\  / (_| | | | | (_| \\__ \\ |_ | |  | | (_| | | | | | |
  \\/  \\/ \\__,_|_| |_|\\__,_|___/\\__||_|  |_|\\__,_|_| |_| |_|
`
      },
      'issue': {
        type: 'file',
        content: 'Mangeluk OS 1.0 (Debian GNU/Linux 12 bookworm) \\n \\l\n'
      },
      'localtime': { type: 'file', content: 'America/Argentina/Buenos_Aires' },
      'timezone': { type: 'file', content: 'America/Argentina/Buenos_Aires' },
      'fstab': {
        type: 'file',
        content: `# /etc/fstab: static file system information.
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
/dev/sda1       /               ext4    errors=remount-ro 0       1
tmpfs           /tmp            tmpfs   defaults          0       0`
      },
      'shells': {
        type: 'file',
        content: `/bin/sh
/bin/bash
/bin/zsh`
      },
      'nano': {
        type: 'dir',
        children: {
          'nanorc': {
            type: 'file',
            content: `set autoindent
set tabsize 4
set tabstospaces`
          }
        }
      },
      'apt': {
        type: 'dir',
        children: {
          'sources.list': {
            type: 'file',
            content: `deb http://deb.debian.org/debian bookworm main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security bookworm-security main contrib non-free non-free-firmware
deb http://deb.debian.org/debian bookworm-updates main contrib non-free non-free-firmware`
          }
        }
      }
    }
  },
  '/proc': {
    type: 'dir',
    children: {
      'cpuinfo': {
        type: 'file',
        content: `processor\t: 0
vendor_id\t: GenuineIntel
cpu family\t: 6
model\t\t: 142
model name\t: Intel(R) Core(TM) i7-12700K CPU @ 3.60GHz
stepping\t: 10
microcode\t: 0xca
cpu MHz\t\t: 1800.000
cache size\t: 8192 KB
physical id\t: 0
siblings\t: 8
core id\t\t: 0
cpu cores\t: 4
flags\t\t: fpu vme de pse tsc msr pae mce cx8 apic sep mtrr ...
bogomips\t: 3984.00`
      },
      'meminfo': {
        type: 'file',
        content: `MemTotal:       16384000 kB
MemFree:         8192000 kB
MemAvailable:   12288000 kB
Buffers:          512000 kB
Cached:          3072000 kB
SwapCached:            0 kB
Active:          4096000 kB
Inactive:        2048000 kB
SwapTotal:       2048000 kB
SwapFree:        2048000 kB`
      },
      'version': {
        type: 'file',
        content: 'Linux version 6.1.0-17-amd64 (debian-kernel@lists.debian.org) (gcc-12 (Debian 12.2.0-14) 12.2.0, GNU ld (GNU Binutils for Debian) 2.40) #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1'
      },
      'uptime': { type: 'file', content: '12345.67 98765.43' },
      'loadavg': { type: 'file', content: '0.15 0.10 0.05 1/234 5678' },
      'stat': {
        type: 'file',
        content: 'cpu  12345 0 6789 87654321 0 0 1234 0 0 0\ncpu0 1234 0 678 10956789 0 0 154 0 0 0'
      },
      'diskstats': {
        type: 'file',
        content: '  8       0 sda 123456 0 9876543 12345 0 0 0 0 1234 12345'
      },
      'modules': {
        type: 'file',
        content: `ext4
mbcache
crc16
dm_mod
sd_mod
ahci
libahci`
      }
    }
  },
  '/var': {
    type: 'dir',
    children: {
      'log': {
        type: 'dir',
        children: {
          'syslog': {
            type: 'file',
            content: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} portfolio kernel: [    0.000000] Linux version 6.1.0-17-amd64
${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} portfolio systemd[1]: Started Network Manager.
${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} portfolio sshd[1234]: Server listening on 0.0.0.0 port 22.`
          },
          'auth.log': {
            type: 'file',
            content: `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} portfolio sshd[1234]: Accepted publickey for visitor from 127.0.0.1
${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()} portfolio sshd[1234]: pam_unix(sshd:session): session opened for user visitor(uid=1000)`
          },
          'dmesg': {
            type: 'file',
            content: `[    0.000000] Linux version 6.1.0-17-amd64
[    0.000000] Command line: BOOT_IMAGE=/vmlinuz-6.1.0-17-amd64
[    0.000000] BIOS-provided physical RAM map:
[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable
[    0.000000] NX (Execute Disable) protection: active`
          },
          'apt': {
            type: 'dir',
            children: {
              'history.log': {
                type: 'file',
                content: `Start-Date: 2024-01-15  10:00:00
Commandline: apt install nodejs nginx git
Install: nodejs:amd64 (20.11.0-1nodesource), nginx:amd64 (1.24.0-1), git:amd64 (2.43.0-1)
End-Date: 2024-01-15  10:00:15`
              }
            }
          }
        }
      },
      'cache': {
        type: 'dir',
        children: {
          'apt': {
            type: 'dir',
            children: {
              'archives': {
                type: 'dir',
                children: {}
              }
            }
          }
        }
      },
      'tmp': {
        type: 'dir',
        children: {}
      }
    }
  },
  '/usr': {
    type: 'dir',
    children: {
      'bin': {
        type: 'dir',
        children: {
          'node': { type: 'file', content: '' },
          'npm': { type: 'file', content: '' },
          'git': { type: 'file', content: '' },
          'python3': { type: 'file', content: '' },
          'php': { type: 'file', content: '' },
          'gcc': { type: 'file', content: '' },
          'g++': { type: 'file', content: '' },
          'make': { type: 'file', content: '' },
          'vim': { type: 'file', content: '' },
          'nano': { type: 'file', content: '' },
          'curl': { type: 'file', content: '' },
          'wget': { type: 'file', content: '' },
          'ssh': { type: 'file', content: '' },
          'docker': { type: 'file', content: '' }
        }
      },
      'local': {
        type: 'dir',
        children: {
          'bin': { type: 'dir', children: {} },
          'lib': { type: 'dir', children: {} }
        }
      },
      'share': {
        type: 'dir',
        children: {
          'doc': { type: 'dir', children: {} },
          'man': { type: 'dir', children: {} }
        }
      }
    }
  },
  '/tmp': {
    type: 'dir',
    children: {}
  },
  '/home': {
    type: 'dir',
    children: {
      'visitor': { type: 'dir', children: {} }
    }
  }
};

// Helper para resolver rutas
export function resolvePath(path: string, currentDir: string): string {
  let fullPath: string;
  if (path.startsWith('~')) {
    fullPath = path;
  } else if (path.startsWith('/')) {
    fullPath = '~' + path;
  } else {
    fullPath = currentDir + (currentDir.endsWith('/') ? '' : '/') + path;
  }

  // Normalizar (remover ./ y ../)
  const parts = fullPath.split('/').filter(Boolean);
  const normalized: string[] = [];
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (normalized.length > 1) normalized.pop();
    } else {
      normalized.push(part);
    }
  }
  return '~' + (normalized.length > 1 ? '/' + normalized.slice(1).join('/') : '');
}

// Helper para obtener una entrada del FS
function getEntry(path: string): FileSystemEntry | null {
  const parts = path.split('/').filter(Boolean);
  let current: FileSystemEntry | undefined = { type: 'dir', children: fileSystem };
  
  for (const part of parts) {
    if (!current || current.type !== 'dir' || !current.children) return null;
    current = current.children[part];
    if (!current) return null;
  }
  return current;
}

// Helper para listar nombres de hijos de un directorio
export function listDir(path: string): string[] {
  const entry = getEntry(path);
  if (!entry || entry.type !== 'dir' || !entry.children) return [];
  return Object.keys(entry.children);
}

// Comando pwd
registerCommand({
  name: 'pwd',
  description: 'Muestra el directorio actual',
  execute: (_args: string[], ctx: CommandContext) => {
    return {
      type: 'text',
      content: ctx.getCurrentDir()
    };
  }
});

// Comando ls
registerCommand({
  name: 'ls',
  description: 'Lista archivos y directorios',
  execute: (args: string[], ctx: CommandContext) => {
    let targetPath = ctx.getCurrentDir();
    if (args.length > 0) targetPath = resolvePath(args[0], ctx.getCurrentDir());
    
    const entry = getEntry(targetPath);
    if (!entry) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `ls: no existe el archivo o directorio: ${args[0]}` 
          : `ls: no such file or directory: ${args[0]}`
      };
    }
    if (entry.type !== 'dir' || !entry.children) {
      return {
        type: 'text',
        content: args[0] || targetPath
      };
    }

    const items = Object.entries(entry.children)
      .map(([name, e]) => e.type === 'dir' ? name + '/' : name)
      .sort()
      .join('  ');
    return { type: 'text', content: items };
  }
});

// Comando cd
registerCommand({
  name: 'cd',
  description: 'Cambia de directorio',
  execute: (args: string[], ctx: CommandContext) => {
    const target = args[0] || '~';
    const newPath = resolvePath(target, ctx.getCurrentDir());
    const entry = getEntry(newPath);
    
    if (!entry) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `cd: no existe el directorio: ${target}` 
          : `cd: no such directory: ${target}`
      };
    }
    if (entry.type !== 'dir') {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `cd: no es un directorio: ${target}` 
          : `cd: not a directory: ${target}`
      };
    }
    
    ctx.setCurrentDir(newPath);
    return { type: 'text', content: '' };
  }
});

// Comando cat
registerCommand({
  name: 'cat',
  description: 'Muestra el contenido de un archivo',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'cat: falta un operando de fichero' 
          : 'cat: missing file operand'
      };
    }
    const path = resolvePath(args[0], ctx.getCurrentDir());
    const entry = getEntry(path);
    if (!entry) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `cat: no existe el archivo: ${args[0]}` 
          : `cat: no such file: ${args[0]}`
      };
    }
    if (entry.type !== 'file' || !entry.content) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `cat: es un directorio: ${args[0]}` 
          : `cat: is a directory: ${args[0]}`
      };
    }
    return { type: 'text', content: entry.content || '' };
  }
});

// Comando mkdir
registerCommand({
  name: 'mkdir',
  description: 'Crea un directorio',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'mkdir: falta un operando' 
          : 'mkdir: missing operand'
      };
    }
    const path = resolvePath(args[0], ctx.getCurrentDir());
    const lastSlashIndex = path.lastIndexOf('/');
    const parentPath = lastSlashIndex > 1 ? path.slice(0, lastSlashIndex) : '~';
    const dirName = path.slice(lastSlashIndex + 1);
    const parent = getEntry(parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'mkdir: no existe el directorio padre' 
          : 'mkdir: parent directory does not exist'
      };
    }
    if (parent.children[dirName]) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `mkdir: ya existe: ${args[0]}` 
          : `mkdir: already exists: ${args[0]}`
      };
    }
    parent.children[dirName] = { type: 'dir', children: {} };
    return { type: 'text', content: '' };
  }
});

// Comando touch
registerCommand({
  name: 'touch',
  description: 'Crea un archivo vacío',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'touch: falta un operando' 
          : 'touch: missing operand'
      };
    }
    const path = resolvePath(args[0], ctx.getCurrentDir());
    const lastSlashIndex = path.lastIndexOf('/');
    const parentPath = lastSlashIndex > 1 ? path.slice(0, lastSlashIndex) : '~';
    const fileName = path.slice(lastSlashIndex + 1);
    const parent = getEntry(parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'touch: no existe el directorio padre' 
          : 'touch: parent directory does not exist'
      };
    }
    if (parent.children[fileName]) {
      // If already exists, do nothing (like real touch for now
      return { type: 'text', content: '' };
    }
    parent.children[fileName] = { type: 'file', content: '' };
    return { type: 'text', content: '' };
  }
});

// Comando rm
registerCommand({
  name: 'rm',
  description: 'Elimina un archivo o directorio',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? 'rm: falta un operando' 
          : 'rm: missing operand'
      };
    }
    const path = resolvePath(args[0], ctx.getCurrentDir());
    const lastSlashIndex = path.lastIndexOf('/');
    const parentPath = lastSlashIndex > 1 ? path.slice(0, lastSlashIndex) : '~';
    const name = path.slice(lastSlashIndex + 1);
    const parent = getEntry(parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `rm: no existe el archivo o directorio: ${args[0]}` 
          : `rm: no such file or directory: ${args[0]}`
      };
    }
    if (!parent.children[name]) {
      return {
        type: 'error',
        content: ctx.lang === 'es' 
          ? `rm: no existe el archivo o directorio: ${args[0]}` 
          : `rm: no such file or directory: ${args[0]}`
      };
    }
    delete parent.children[name];
    return { type: 'text', content: '' };
  }
});
