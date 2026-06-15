// src/lib/commands/textproc.ts
// Text processing: grep, head, tail, sort, uniq, cut, tr, rev, column
import { registerCommand } from './index';

// grep - pattern matching
registerCommand({
  name: 'grep',
  description: 'Busca patrones en texto / Search text patterns: grep <pattern> [file]',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'grep: falta el patrón'
          : 'grep: missing pattern'
      };
    }

    const caseInsensitive = args.includes('-i');
    const lineNumbers = args.includes('-n');
    const countOnly = args.includes('-c');
    const invertMatch = args.includes('-v');
    const wholeWord = args.includes('-w');

    const flags = args.filter(a => a.startsWith('-'));
    const nonFlags = args.filter(a => !a.startsWith('-'));
    const pattern = nonFlags[0] || '';

    if (!pattern) {
      return { type: 'error', content: ctx.lang === 'es' ? 'grep: falta el patrón' : 'grep: missing pattern' };
    }

    // Simulated grep output
    const sampleLines = [
      'visitor@portfolio:~$ grep',
      '#!/bin/bash',
      'export PATH=/usr/local/bin:$PATH',
      'function search() {',
      '  echo "Searching for patterns...";',
      '}',
      'grep -r "pattern" /home/visitor',
      'PORTFOLIO_VERSION=1.0.0',
      'LOG_FILE=/var/log/syslog',
    ];

    const regex = wholeWord
      ? new RegExp(`\\b${pattern}\\b`, caseInsensitive ? 'i' : '')
      : new RegExp(pattern, caseInsensitive ? 'i' : '');

    const matches = sampleLines
      .map((line, i) => ({ line, num: i + 1 }))
      .filter(({ line }) => invertMatch ? !regex.test(line) : regex.test(line));

    if (countOnly) {
      return { type: 'text', content: String(matches.length) };
    }

    const output = matches.map(({ line, num }) => {
      let display = line;
      if (!invertMatch) {
        display = line.replace(regex, (m) => `\x1b[31m${m}\x1b[0m`);
      }
      return lineNumbers ? `${num}:${display}` : display;
    });

    return { type: 'text', content: output.join('\n') || '' };
  },
});

// head - first N lines
registerCommand({
  name: 'head',
  description: 'Muestra las primeras N líneas / Show first N lines: head [-n N] [file]',
  execute(args, ctx) {
    let n = 10;
    const nIdx = args.indexOf('-n');
    if (nIdx >= 0 && args[nIdx + 1]) {
      n = parseInt(args[nIdx + 1], 10) || 10;
    }

    const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}: This is sample content for line ${i + 1}`);
    return { type: 'text', content: lines.slice(0, n).join('\n') };
  },
});

// tail - last N lines
registerCommand({
  name: 'tail',
  description: 'Muestra las últimas N líneas / Show last N lines: tail [-n N] [file]',
  execute(args, ctx) {
    let n = 10;
    const nIdx = args.indexOf('-n');
    if (nIdx >= 0 && args[nIdx + 1]) {
      n = parseInt(args[nIdx + 1], 10) || 10;
    }

    const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}: This is sample content for line ${i + 1}`);
    return { type: 'text', content: lines.slice(-n).join('\n') };
  },
});

// sort - sort lines
registerCommand({
  name: 'sort',
  description: 'Ordena líneas / Sort lines: sort [file]',
  execute(args, ctx) {
    const reverse = args.includes('-r');
    const numeric = args.includes('-n');

    const lines = ['banana', 'apple', 'cherry', 'date', 'elderberry'];
    const sorted = [...lines].sort((a, b) => {
      if (numeric) return Number(a) - Number(b);
      return reverse ? b.localeCompare(a) : a.localeCompare(b);
    });
    return { type: 'text', content: sorted.join('\n') };
  },
});

// uniq - unique lines
registerCommand({
  name: 'uniq',
  description: 'Elimina líneas duplicadas / Remove duplicate lines',
  execute(args, ctx) {
    const lines = ['apple', 'banana', 'banana', 'cherry', 'cherry', 'cherry', 'date'];
    return { type: 'text', content: [...new Set(lines)].join('\n') };
  },
});

// cut - cut columns
registerCommand({
  name: 'cut',
  description: 'Corta columnas de texto / Cut text columns: cut -d"," -f1 [file]',
  execute(args, ctx) {
    let delimiter = '\t';
    let fields = '1';

    const dIdx = args.indexOf('-d');
    if (dIdx >= 0 && args[dIdx + 1]) {
      delimiter = args[dIdx + 1].replace(/['"]/g, '');
    }
    const fIdx = args.indexOf('-f');
    if (fIdx >= 0 && args[fIdx + 1]) {
      fields = args[fIdx + 1];
    }

    const fieldNums = fields.split(',').map(Number);
    const sampleData = [
      `name${delimiter}age${delimiter}city`,
      `Alice${delimiter}30${delimiter}Buenos Aires`,
      `Bob${delimiter}25${delimiter}Córdoba`,
      `Charlie${delimiter}35${delimiter}Rosario`,
    ];

    const result = sampleData.map(line => {
      const parts = line.split(delimiter);
      return fieldNums.map(f => parts[f - 1] || '').join(delimiter);
    });

    return { type: 'text', content: result.join('\n') };
  },
});

// tr - translate characters
registerCommand({
  name: 'tr',
  description: 'Traduce caracteres / Translate characters: tr <set1> <set2>',
  execute(args, ctx) {
    if (args.length < 2) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'tr: faltan argumentos'
          : 'tr: missing operands'
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? 'tr: la entrada se toma de stdin (simulado)'
        : 'tr: input taken from stdin (simulated)'
    };
  },
});

// rev - reverse text
registerCommand({
  name: 'rev',
  description: 'Invierte el texto / Reverse text',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: '' };
    }
    return { type: 'text', content: args.join(' ').split('').reverse().join('') };
  },
});

// column - format as table
registerCommand({
  name: 'column',
  description: 'Formatea como tabla / Format as table: column -t [file]',
  execute(args, ctx) {
    const lines = [
      'NAME          AGE    CITY',
      'Alice         30     Buenos Aires',
      'Bob           25     Córdoba',
      'Charlie       35     Rosario',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// paste - merge lines
registerCommand({
  name: 'paste',
  description: 'Une líneas / Merge lines: paste <file1> <file2>',
  execute(args, ctx) {
    return { type: 'text', content: 'line1\tline2\tline3' };
  },
});

// fmt - format text
registerCommand({
  name: 'fmt',
  description: 'Formatea texto / Format text',
  execute(args, ctx) {
    const text = args.join(' ') || 'This is sample text that would be formatted to a specific width.';
    return { type: 'text', content: text };
  },
});

// pr - format for printing
registerCommand({
  name: 'pr',
  description: 'Formatea para impresión / Format for printing',
  execute(args, ctx) {
    return {
      type: 'text',
      content: `${new Date().toLocaleDateString()}  page 1\n\nsample content for printing`
    };
  },
});

// fold - wrap lines
registerCommand({
  name: 'fold',
  description: 'Adjusta líneas a un ancho / Wrap lines at width: fold -w 40',
  execute(args, ctx) {
    let width = 80;
    const wIdx = args.indexOf('-w');
    if (wIdx >= 0 && args[wIdx + 1]) {
      width = parseInt(args[wIdx + 1], 10) || 80;
    }
    const text = args.filter(a => !a.startsWith('-')).join(' ') || 'This is a long line that needs to be wrapped at a certain width.';
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > width) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += ' ' + word;
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return { type: 'text', content: lines.join('\n') };
  },
});

// expand / unexpand
registerCommand({
  name: 'expand',
  description: 'Convierte tabs a espacios / Convert tabs to spaces',
  execute(args, ctx) {
    return { type: 'text', content: args.join(' ').replace(/\t/g, '    ') };
  },
});

// comm - compare sorted files
registerCommand({
  name: 'comm',
  description: 'Compara archivos ordenados / Compare sorted files',
  execute(args, ctx) {
    return { type: 'text', content: 'common line only in file1\tline only in file2' };
  },
});

// tee - read from stdin and write to file
registerCommand({
  name: 'tee',
  description: 'Lee stdin y escribe en archivo / Read stdin and write to file',
  execute(args, ctx) {
    return { type: 'text', content: args.join(' ') || 'piped input' };
  },
});

// awk - pattern scanning (simplified)
registerCommand({
  name: 'awk',
  description: 'Escaneo de patrones / Pattern scanning: awk \'{print $1}\' [file]',
  execute(args, ctx) {
    return { type: 'text', content: 'column1 column2 column3' };
  },
});

// sed - stream editor (simplified)
registerCommand({
  name: 'sed',
  description: 'Editor de flujo / Stream editor: sed \'s/old/new/g\' [file]',
  execute(args, ctx) {
    return { type: 'text', content: args.join(' ') || 'sample output' };
  },
});

// xargs - build command lines
registerCommand({
  name: 'xargs',
  description: 'Construye líneas de comandos / Build command lines',
  execute(args, ctx) {
    return { type: 'text', content: args.join(' ') };
  },
});
