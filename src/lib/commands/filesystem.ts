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
===============================
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
=================================
- Desarrollado en Godot 4
- Disponible en Google Play`
          },
          'slimeflight.txt': {
            type: 'file',
            content: `SlimeFlight - Juego de Acción
=============================
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
======
Backend: PHP (Laravel/Symfony), Node.js, Go, MySQL, PostgreSQL, MongoDB
Frontend: Vue.js, React, Next.js, Tailwind CSS, Radix UI
DevOps: Docker, Git, GitLab, AWS, Cloudflare Pages
Tools: Godot 4, GDScript, Aseprite, Gradle, Android Studio
AI: Claude, Kiro, Gemini, LLMs`
      },
      'readme.md': {
        type: 'file',
        content: `# Portfolio Terminal de Matias Angeluk
====================================
Bienvenido! Usa 'help' para ver todos los comandos disponibles!`
      }
    }
  }
};

// Helper para resolver rutas
function resolvePath(path: string, currentDir: string): string {
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
