// src/lib/commands/fileops.ts
// File operations: cp, mv, chmod, chown, find, locate, ln, tree, stat, file
import { registerCommand } from './index';

// cp - copy files (simulated)
registerCommand({
  name: 'cp',
  description: 'Copia archivos / Copy files: cp <src> <dest>',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'cp: falta el archivo destino'
          : 'cp: missing destination file'
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `'${args[0]}' -> '${args[1]}'`
        : `'${args[0]}' -> '${args[1]}'`
    };
  },
});

// mv - move/rename files
registerCommand({
  name: 'mv',
  description: 'Mueve o renombra archivos / Move or rename files: mv <src> <dest>',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'mv: falta el archivo destino'
          : 'mv: missing destination file'
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `'${args[0]}' -> '${args[1]}'`
        : `'${args[0]}' -> '${args[1]}'`
    };
  },
});

// chmod - change permissions (simulated)
registerCommand({
  name: 'chmod',
  description: 'Cambia permisos de archivo / Change file permissions',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'chmod: falta operando'
          : 'chmod: missing operand'
      };
    }
    return { type: 'text', content: '' };
  },
});

// chown - change owner (simulated)
registerCommand({
  name: 'chown',
  description: 'Cambia el propietario / Change file owner',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'chown: falta operando'
          : 'chown: missing operand'
      };
    }
    return { type: 'text', content: '' };
  },
});

// find - find files
registerCommand({
  name: 'find',
  description: 'Busca archivos / Find files: find [path] -name <pattern>',
  execute(args, ctx) {
    const nameIdx = args.indexOf('-name');
    let pattern = '*';
    let searchPath = '.';

    if (nameIdx >= 0 && args[nameIdx + 1]) {
      pattern = args[nameIdx + 1];
    }
    if (args.length > 0 && !args[0].startsWith('-')) {
      searchPath = args[0];
    }

    // Simulated find results
    const results = [
      `${searchPath === '.' ? '.' : searchPath}/about.txt`,
      `${searchPath === '.' ? '.' : searchPath}/skills.txt`,
      `${searchPath === '.' ? '.' : searchPath}/readme.md`,
      `${searchPath === '.' ? '.' : searchPath}/experience/libgot.txt`,
      `${searchPath === '.' ? '.' : searchPath}/experience/bamboo.txt`,
      `${searchPath === '.' ? '.' : searchPath}/projects/agendita.txt`,
    ];

    const filtered = results.filter(r => {
      if (pattern === '*') return true;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      return regex.test(r.split('/').pop() || '');
    });

    return { type: 'text', content: filtered.join('\n') };
  },
});

// locate - locate files (simulated)
registerCommand({
  name: 'locate',
  description: 'Localiza archivos en la base de datos / Locate files in database',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: '' };
    }
    return {
      type: 'text',
      content: [
        '/home/visitor/about.txt',
        '/home/visitor/skills.txt',
        '/usr/share/doc/portfolio/readme.md',
      ].join('\n')
    };
  },
});

// ln - create links (simulated)
registerCommand({
  name: 'ln',
  description: 'Crea enlaces / Create links: ln <target> <link_name>',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'ln: falta el archivo destino'
          : 'ln: missing target file'
      };
    }
    return { type: 'text', content: '' };
  },
});

// tree - directory tree (JSX)
registerCommand({
  name: 'tree',
  description: 'Vista de árbol del directorio / Directory tree view',
  execute(args, ctx) {
    const dir = args[0] || '.';
    const lines = [
      `${dir}`,
      '├── about.txt',
      '├── .bashrc',
      '├── .profile',
      '├── documents/',
      '│   ├── cv.txt',
      '│   └── notes.txt',
      '├── downloads/',
      '├── experience/',
      '│   ├── libgot.txt',
      '│   └── bamboo.txt',
      '├── projects/',
      '│   ├── agendita.txt',
      '│   ├── cuandonosjuntamos.txt',
      '│   ├── randomath.txt',
      '│   └── slimeflight.txt',
      '├── .ssh/',
      '│   └── authorized_keys',
      '├── .config/',
      '│   └── portfolio/',
      '│       └── config.json',
      '├── skills.txt',
      '└── readme.md',
      '',
      '6 directories, 16 files',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// stat - file statistics
registerCommand({
  name: 'stat',
  description: 'Muestra información de archivo / Show file statistics',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'stat: falta el archivo'
          : 'stat: missing file'
      };
    }
    const filename = args[0];
    const isDir = !filename.includes('.');
    const size = isDir ? '4096' : String(Math.floor(Math.random() * 50000 + 1000));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    return {
      type: 'text',
      content: `  File: ${filename}
  Size: ${size.padStart(10)}    Blocks: ${String(Math.ceil(Number(size) / 512)).padStart(8)}    IO Block: 4096   ${isDir ? 'directory' : 'regular file'}
Access: (0${isDir ? '755' : '644'}/-${isDir ? 'rwxr-xr-x' : 'rw-r--r--'})  Uid: ( 1000/ visitor)   Gid: ( 1000/ visitor)
Access: ${now}.000000000 -0300
Modify: ${now}.000000000 -0300
Change: ${now}.000000000 -0300
 Birth: -`
    };
  },
});

// file - file type detection
registerCommand({
  name: 'file',
  description: 'Detecta el tipo de archivo / Detect file type',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'file: falta el archivo' : 'file: missing file' };
    }
    return {
      type: 'text',
      content: args.map(a => {
        if (a.endsWith('.txt')) return `${a}: ASCII text`;
        if (a.endsWith('.md')) return `${a}: UTF-8 Unicode text`;
        if (a.endsWith('.json')) return `${a}: JSON data`;
        if (a.endsWith('.js')) return `${a}: JavaScript source, ASCII text`;
        if (a.endsWith('.ts')) return `${a}: TypeScript source, ASCII text`;
        if (a.endsWith('.pdf')) return `${a}: PDF document, version 1.7`;
        return `${a}: data`;
      }).join('\n')
    };
  },
});

// wc - word count
registerCommand({
  name: 'wc',
  description: 'Cuenta líneas, palabras y caracteres / Count lines, words, chars',
  execute(args, ctx) {
    // Simple simulation
    return {
      type: 'text',
      content: args.length > 0
        ? `  42  128  1024 ${args[0]}`
        : '  42  128  1024'
    };
  },
});

// diff - compare files (simulated)
registerCommand({
  name: 'diff',
  description: 'Compara archivos / Compare files: diff <file1> <file2>',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'diff: falta el segundo archivo'
          : 'diff: missing second file'
      };
    }
    return { type: 'text', content: '' };
  },
});

// md5sum / sha256sum (simulated)
registerCommand({
  name: 'md5sum',
  description: 'Calcula checksum MD5 / Calculate MD5 checksum',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'md5sum: falta el archivo' : 'md5sum: missing file' };
    }
    const hash = Array.from({ length: 32 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    return { type: 'text', content: `${hash}  ${args[0]}` };
  },
});

registerCommand({
  name: 'sha256sum',
  description: 'Calcula checksum SHA256 / Calculate SHA256 checksum',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'sha256sum: falta el archivo' : 'sha256sum: missing file' };
    }
    const hash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    return { type: 'text', content: `${hash}  ${args[0]}` };
  },
});

// base64 - base64 encode/decode
registerCommand({
  name: 'base64',
  description: 'Codifica/decodifica en base64 / Encode/decode base64',
  execute(args, ctx) {
    if (args.includes('-d') || args.includes('-D')) {
      return { type: 'text', content: 'Hello, World!' };
    }
    const text = args.join(' ') || 'Hello, World!';
    return { type: 'text', content: btoa(text) };
  },
});

// xxd - hex dump
registerCommand({
  name: 'xxd',
  description: 'Volcado hexadecimal / Hex dump',
  execute(args, ctx) {
    const text = args.join(' ') || 'Hello';
    const hex = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(text).map(c => {
      const code = c.charCodeAt(0);
      return code >= 32 && code <= 126 ? c : '.';
    }).join('');
    return {
      type: 'text',
      content: `00000000: ${hex.padEnd(48)}  ${ascii}`
    };
  },
});
