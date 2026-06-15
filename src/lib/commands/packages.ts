// src/lib/commands/packages.ts
// Package managers: apt, npm, git, docker, node, python, php, go
import { registerCommand } from './index';

// apt - Debian package manager (simulated)
registerCommand({
  name: 'apt',
  description: 'Gestor de paquetes Debian / Debian package manager',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === 'list' || sub === undefined) {
      return {
        type: 'text',
        content: `Listing... Done
nodejs/stable 20.11.0-1nodesource amd64 [upgradable from: 18.19.0]
nginx/stable 1.24.0-1 amd64
git/stable 2.43.0-1 amd64
python3/stable 3.11.6-1 amd64
php/stable 8.2.15-1 amd64
golang/stable 2:1.21.5-1 amd64
docker-ce/stable 24.0.7-1 amd64
postgresql/stable 16.1-1 amd64
redis/stable 7.2.3-1 amd64
vim/stable 2:9.0.2136-1 amd64`
      };
    }
    if (sub === 'update') {
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? 'Leyendo listas de paquetes... Hecho\nCreando árbol de dependencias... Hecho\nLeyendo información de estado... Hecho\nTodos los paquetes están actualizados.'
          : 'Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nAll packages are up to date.'
      };
    }
    if (sub === 'install' || sub === 'remove') {
      const pkgs = args.slice(1).filter(a => !a.startsWith('-'));
      if (pkgs.length === 0) {
        return { type: 'error', content: ctx.lang === 'es' ? 'apt: falta el nombre del paquete' : 'apt: missing package name' };
      }
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? `Leyendo listas de paquetes... Hecho\nCreando árbol de dependencias... Hecho\n${sub === 'install' ? 'Instalando' : 'Eliminando'} ${pkgs.join(', ')}...`
          : `Reading package lists... Done\nBuilding dependency tree... Done\n${sub === 'install' ? 'Installing' : 'Removing'} ${pkgs.join(', ')}...`
      };
    }
    if (sub === 'search') {
      const query = args[1] || '';
      return {
        type: 'text',
        content: `Sorting... Done\nFull Text Search... Done\nnodejs/now 20.11.0-1nodesource amd64\n  Fast, scalable network application platform`
      };
    }
    return { type: 'text', content: `Usage: apt [list|update|install|remove|search]` };
  },
});

// apt-get - alternative apt interface
registerCommand({
  name: 'apt-get',
  description: 'Interfaz alternativa de apt / Alternative apt interface',
  execute(args, ctx) {
    return { type: 'text', content: `Usage: apt-get [update|install|remove]` };
  },
});

// dpkg - Debian package manager low-level
registerCommand({
  name: 'dpkg',
  description: 'Gestor de paquetes Debian (bajo nivel) / Debian package manager (low-level)',
  execute(args, ctx) {
    if (args.includes('-l') || args.includes('--list')) {
      return {
        type: 'text',
        content: `Desired=Unknown/Install/Remove/Purge/Hold
| Status=Not/Inst/Conf-files/Unpacked/halF-conf/Half-inst/trig-aWait/Trig-pend
|/ Err?=(none)/Reinst-required (Status,Err: uppercase=bad)
||/ Name           Version      Architecture Description
+++-==============-============-============-=================================
ii  nodejs         20.11.0-1n   amd64        Node.js event-based server-side
ii  nginx          1.24.0-1     amd64        web server and reverse proxy
ii  git            2.43.0-1     amd64        fast, scalable, distributed`
      };
    }
    return { type: 'text', content: `Usage: dpkg [options] <action>` };
  },
});

// npm - Node.js package manager (simulated)
registerCommand({
  name: 'npm',
  description: 'Gestor de paquetes Node.js / Node.js package manager',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === '-v' || sub === '--version') {
      return { type: 'text', content: '10.2.4' };
    }
    if (sub === 'list' || sub === 'ls') {
      return {
        type: 'text',
        content: `portfolio@1.0.0 D:\\GitHub\\mangeluk.github.io
+-- next@16.2.9
+-- react@19.2.4
+-- react-dom@19.2.4
+-- typescript@5.3.3
+-- tailwindcss@4.0.0
+-- vitest@4.1.8
+-- eslint@9.0.0`
      };
    }
    if (sub === 'init') {
      return { type: 'text', content: 'Wrote to D:\\GitHub\\mangeluk.github.io\\package.json' };
    }
    if (sub === 'install' || sub === 'i') {
      const pkgs = args.slice(1).filter(a => !a.startsWith('-'));
      if (pkgs.length === 0) {
        return { type: 'text', content: 'added 0 packages in 0.5s' };
      }
      return { type: 'text', content: `added ${pkgs.length} package${pkgs.length > 1 ? 's' : ''} in 1.2s` };
    }
    if (sub === 'update') {
      return { type: 'text', content: 'up to date' };
    }
    if (sub === 'outdated') {
      return { type: 'text', content: 'Package     Current   Wanted   Latest  Location' };
    }
    if (sub === 'run') {
      return { type: 'text', content: `> portfolio@1.0.0 ${args.slice(1).join(' ')}\n> next dev` };
    }
    return { type: 'text', content: `Usage: npm [list|install|init|update|run]` };
  },
});

// npx - execute npm packages
registerCommand({
  name: 'npx',
  description: 'Ejecuta paquetes npm / Execute npm packages',
  execute(args, ctx) {
    return { type: 'text', content: `Executing ${args[0] || 'command'}...` };
  },
});

// yarn - alternative package manager
registerCommand({
  name: 'yarn',
  description: 'Gestor de paquetes alternativo / Alternative package manager',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === '-v' || sub === '--version') return { type: 'text', content: '1.22.21' };
    if (sub === 'install') return { type: 'text', content: 'success Already up-to-date.' };
    return { type: 'text', content: `Usage: yarn [install|add|remove]` };
  },
});

// pnpm - fast package manager
registerCommand({
  name: 'pnpm',
  description: 'Gestor de paquetes rápido / Fast package manager',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === '-v' || sub === '--version') return { type: 'text', content: '8.14.0' };
    return { type: 'text', content: `Usage: pnpm [install|add|remove]` };
  },
});

// git - version control (simulated)
registerCommand({
  name: 'git',
  description: 'Sistema de control de versiones / Version control system',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === 'status') {
      return {
        type: 'text',
        content: `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`
      };
    }
    if (sub === 'log') {
      return {
        type: 'text',
        content: `commit a1b2c3d (HEAD -> main, origin/main)
Author: Matias Angeluk <matias.angeluk@gmail.com>
Date:   ${new Date().toLocaleDateString()}

    feat: add Linux OS simulation commands

commit e4f5g6h
Author: Matias Angeluk <matias.angeluk@gmail.com>
Date:   ${new Date(Date.now() - 86400000).toLocaleDateString()}

    feat: add terminal portfolio with AI integration

commit i7j8k9l
Author: Matias Angeluk <matias.angeluk@gmail.com>
Date:   ${new Date(Date.now() - 172800000).toLocaleDateString()}

    init: project setup with Next.js and Tailwind`
      };
    }
    if (sub === 'branch') {
      return { type: 'text', content: '* main\n  develop\n  feature/linux-commands' };
    }
    if (sub === 'remote') {
      return { type: 'text', content: 'origin\thttps://github.com/Magamex/mangeluk.github.io.git (fetch)\norigin\thttps://github.com/Magamex/mangeluk.github.io.git (push)' };
    }
    if (sub === 'diff') {
      return { type: 'text', content: '' };
    }
    if (sub === 'stash') {
      return { type: 'text', content: 'Saved working directory and index state WIP on main: a1b2c3d feat: add Linux OS simulation' };
    }
    if (sub === 'pull') {
      return { type: 'text', content: 'Already up to date.' };
    }
    if (sub === 'push') {
      return { type: 'text', content: 'Everything up-to-date' };
    }
    if (sub === 'clone') {
      const url = args[1] || 'repo';
      return { type: 'text', content: `Cloning into '${url.split('/').pop()?.replace('.git', '') || 'repo'}'...\nremote: Enumerating objects: 1234, done.\nremote: Total 1234 (delta 0), reused 0 (delta 0)\nReceiving objects: 100% (1234/1234), 1.23 MiB | 2.34 MiB/s, done.` };
    }
    if (sub === 'add') {
      return { type: 'text', content: '' };
    }
    if (sub === 'commit') {
      return { type: 'text', content: `[main abc1234] ${args.slice(1).filter(a => a !== '-m').join(' ')}\n 1 file changed, 42 insertions(+), 0 deletions(-)` };
    }
    return { type: 'text', content: `git version 2.43.0\n\nUsage: git [status|log|branch|diff|add|commit|push|pull|clone|stash|remote]` };
  },
});

// docker - container management (simulated)
registerCommand({
  name: 'docker',
  description: 'Gestor de contenedores / Container management',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === 'ps' || sub === 'container ls') {
      return {
        type: 'text',
        content: `CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                  NAMES
a1b2c3d4e5f6   nginx:latest   "/docker-entrypoint.…"   2 hours ago     Up 2 hours     0.0.0.0:80->80/tcp     web-server
b2c3d4e5f6g7   redis:7        "docker-entrypoint.s…"   3 hours ago     Up 3 hours     0.0.0.0:6379->6379/tcp redis-cache
c3d4e5f6g7h8   postgres:16    "docker-entrypoint.s…"   1 day ago       Up 1 day       0.0.0.0:5432->5432/tcp portfolio-db`
      };
    }
    if (sub === 'images') {
      return {
        type: 'text',
        content: `REPOSITORY       TAG       IMAGE ID       CREATED        SIZE
nginx            latest    a8758716bb6a   2 weeks ago    187MB
redis            7         9c1d50522236   3 weeks ago    138MB
postgres         16        9b8e48356464   1 month ago    412MB
node             20        15a6ab11223f   2 months ago   1.1GB`
      };
    }
    if (sub === 'version') {
      return {
        type: 'text',
        content: `Client:
 Version:           24.0.7
 API version:       1.43
 Go version:        go1.21.3

Server:
 Version:           24.0.7
 API version:       1.43 (minimum version 1.12)
 Go version:        go1.21.3`
      };
    }
    if (sub === 'build') {
      return { type: 'text', content: `[+] Building 12.3s (8/8) FINISHED\n => [internal] load build definition from Dockerfile\n => => transferring dockerfile: 156B\n => [internal] load .dockerignore\n => [internal] load metadata for docker.io/library/node:20\n => [1/4] FROM docker.io/library/node:20@sha256:...\n => [2/4] WORKDIR /app\n => [3/4] COPY package*.json ./\n => [4/4] RUN npm ci --only=production\n => exporting to image\n => => writing image sha256:abc123...` };
    }
    return { type: 'text', content: `docker version 24.0.7\n\nUsage: docker [ps|images|build|run|stop|rm]` };
  },
});

// docker-compose
registerCommand({
  name: 'docker-compose',
  description: 'Gestor de contenedores multi-servicio / Multi-container management',
  execute(args, ctx) {
    if (args[0] === 'ps') {
      return {
        type: 'text',
        content: `Name                Command              State           Ports
portfolio-db   docker-entrypoint.sh postgres   Up 2 hours   0.0.0.0:5432->5432/tcp
redis-cache    docker-entrypoint.sh redis      Up 2 hours   0.0.0.0:6379->6379/tcp
web-server     /docker-entrypoint.sh nginx      Up 2 hours   0.0.0.0:80->80/tcp`
      };
    }
    return { type: 'text', content: `docker-compose version 2.23.0\n\nUsage: docker-compose [ps|up|down|logs]` };
  },
});

// node - Node.js runtime
registerCommand({
  name: 'node',
  description: 'Runtime de Node.js / Node.js runtime',
  execute(args, ctx) {
    if (args[0] === '-v' || args[0] === '--version') {
      return { type: 'text', content: 'v20.11.0' };
    }
    if (args[0] === '-e') {
      const expr = args.slice(1).join(' ');
      try {
        // eslint-disable-next-line no-eval
        const result = eval(expr);
        return { type: 'text', content: String(result) };
      } catch {
        return { type: 'error', content: expr };
      }
    }
    return { type: 'text', content: 'Welcome to Node.js v20.11.0.\nType ".help" for more information.' };
  },
});

// npm (already registered above, skip)

// python3 - Python runtime
registerCommand({
  name: 'python3',
  description: 'Runtime de Python / Python runtime',
  execute(args, ctx) {
    if (args[0] === '--version' || args[0] === '-V') {
      return { type: 'text', content: 'Python 3.11.6' };
    }
    if (args[0] === '-c') {
      return { type: 'text', content: args.slice(1).join(' ') };
    }
    return { type: 'text', content: 'Python 3.11.6 (main, Oct  2 2023, 13:45:54) [GCC 12.3.0] on linux\nType "help", "copyright", "credits" or "license" for more information.' };
  },
});

// python (alias for python3)
registerCommand({
  name: 'python',
  description: 'Runtime de Python (alias de python3) / Python runtime',
  execute(args, ctx) {
    if (args[0] === '--version' || args[0] === '-V') {
      return { type: 'text', content: 'Python 3.11.6' };
    }
    return { type: 'text', content: 'Python 3.11.6 (main, Oct  2 2023, 13:45:54) [GCC 12.3.0] on linux\nType "help", "copyright", "credits" or "license" for more information.' };
  },
});

// pip - Python package manager
registerCommand({
  name: 'pip',
  description: 'Gestor de paquetes Python / Python package manager',
  execute(args, ctx) {
    if (args[0] === '--version') {
      return { type: 'text', content: 'pip 23.3.1 from /usr/lib/python3/dist-packages/pip (python 3.11)' };
    }
    if (args[0] === 'list') {
      return {
        type: 'text',
        content: `Package    Version
---------- -------
flask      3.0.0
django     4.2.8
requests   2.31.0
numpy      1.26.2
pandas     2.1.4`
      };
    }
    return { type: 'text', content: `Usage: pip [install|list|show|freeze]` };
  },
});

// php - PHP runtime
registerCommand({
  name: 'php',
  description: 'Runtime de PHP / PHP runtime',
  execute(args, ctx) {
    if (args[0] === '-v' || args[0] === '--version') {
      return {
        type: 'text',
        content: `PHP 8.2.15 (cli) (built: Jan 10 2024 08:45:23) (NTS)\nCopyright (c) The PHP Group\nZend Engine v4.2.15, Copyright (c) Zend Technologies\n    with Zend OPcache v8.2.15, Copyright (c), by Zend Technologies`
      };
    }
    return { type: 'text', content: 'PHP 8.2.15 (cli) (built: Jan 10 2024 08:45:23) (NTS)' };
  },
});

// go - Go runtime
registerCommand({
  name: 'go',
  description: 'Runtime de Go / Go runtime',
  execute(args, ctx) {
    if (args[0] === 'version') {
      return { type: 'text', content: 'go version go1.21.5 linux/amd64' };
    }
    return { type: 'text', content: 'Go is a tool for managing Go source code.\n\nUsage:\n\tgo <command> [arguments]\n\nCommands:\n\tbuild       compile packages and dependencies\n\trun         compile and run Go program\n\ttest        test packages\n\tget         add dependencies\n\tmod         module maintenance' };
  },
});

// cargo - Rust package manager
registerCommand({
  name: 'cargo',
  description: 'Gestor de paquetes Rust / Rust package manager',
  execute(args, ctx) {
    if (args[0] === '--version' || args[0] === '-V') {
      return { type: 'text', content: 'cargo 1.74.1 (7b9a13586 2023-10-23)' };
    }
    return { type: 'text', content: 'Rust\'s package manager\ncargo 1.74.1 (7b9a13586 2023-10-23)' };
  },
});

// make - build tool
registerCommand({
  name: 'make',
  description: 'Herramienta de build / Build tool',
  execute(args, ctx) {
    if (args[0] === '-v' || args[0] === '--version') {
      return { type: 'text', content: 'GNU Make 4.3\nBuilt for x86_64-pc-linux-gnu' };
    }
    if (args[0] === '-n' || args[0] === '--dry-run') {
      return { type: 'text', content: 'echo "Building..."\ngcc -o app main.c\n./app' };
    }
    return { type: 'text', content: 'make: *** No targets specified and no makefile found.  Stop.' };
  },
});

// gcc - C compiler
registerCommand({
  name: 'gcc',
  description: 'Compilador de C / C compiler',
  execute(args, ctx) {
    if (args.includes('--version')) {
      return { type: 'text', content: 'gcc (Debian 12.3.0-11) 12.3.0\nCopyright (C) 2022 Free Software Foundation, Inc.' };
    }
    if (args.includes('-o')) {
      return { type: 'text', content: '' };
    }
    return { type: 'text', content: 'gcc: fatal error: no input files\ncompilation terminated.' };
  },
});

// g++ - C++ compiler
registerCommand({
  name: 'g++',
  description: 'Compilador de C++ / C++ compiler',
  execute(args, ctx) {
    if (args.includes('--version')) {
      return { type: 'text', content: 'g++ (Debian 12.3.0-11) 12.3.0\nCopyright (C) 2022 Free Software Foundation, Inc.' };
    }
    return { type: 'text', content: 'g++: fatal error: no input files\ncompilation terminated.' };
  },
});

// rustc - Rust compiler
registerCommand({
  name: 'rustc',
  description: 'Compilador de Rust / Rust compiler',
  execute(args, ctx) {
    if (args.includes('--version')) {
      return { type: 'text', content: 'rustc 1.74.1 (7b9a13586 2023-10-23)' };
    }
    return { type: 'text', content: 'Usage: rustc [OPTIONS] INPUT' };
  },
});

// java - Java runtime
registerCommand({
  name: 'java',
  description: 'Runtime de Java / Java runtime',
  execute(args, ctx) {
    if (args.includes('-version')) {
      return {
        type: 'text',
        content: `openjdk version "21.0.1" 2023-10-17
OpenJDK Runtime Environment (build 21.0.1+12-29)
OpenJDK 64-Bit Server VM (build 21.0.1+12-29, mixed mode, sharing)`
      };
    }
    return { type: 'text', content: 'Usage: java [options] <mainclass> [args]' };
  },
});

// ruby - Ruby runtime
registerCommand({
  name: 'ruby',
  description: 'Runtime de Ruby / Ruby runtime',
  execute(args, ctx) {
    if (args.includes('-v') || args.includes('--version')) {
      return { type: 'text', content: 'ruby 3.1.2p20 (2022-12-25 revision 3a5109e4f8) [x86_64-linux]' };
    }
    return { type: 'text', content: 'irb(main):001:0> puts "Hello!"' };
  },
});
