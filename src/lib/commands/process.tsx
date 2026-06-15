// src/lib/commands/process.tsx
// Process management commands: ps, top, kill, jobs, bg, fg
import { registerCommand } from './index';
import React, { useState, useEffect } from 'react';

// Fake process table
const FAKE_PROCESSES = [
  { pid: 1, user: 'root', cpu: '0.0', mem: '0.4', vsz: '169476', rss: '8120', tty: '?', stat: 'Ss', start: '10:00', time: '0:03', cmd: '/sbin/init' },
  { pid: 234, user: 'root', cpu: '0.0', mem: '0.2', vsz: '72340', rss: '4512', tty: '?', stat: 'Ss', start: '10:00', time: '0:01', cmd: '/usr/sbin/sshd -D' },
  { pid: 456, user: 'root', cpu: '0.0', mem: '0.3', vsz: '98760', rss: '6234', tty: '?', stat: 'Ss', start: '10:00', time: '0:02', cmd: 'nginx: master process /usr/sbin/nginx' },
  { pid: 678, user: 'www-data', cpu: '0.0', mem: '0.2', vsz: '98760', rss: '4123', tty: '?', stat: 'S', start: '10:00', time: '0:00', cmd: 'nginx: worker process' },
  { pid: 890, user: 'visitor', cpu: '0.1', mem: '1.2', vsz: '1234560', rss: '24567', tty: 'pts/0', stat: 'Ss', start: '10:01', time: '0:05', cmd: '-bash' },
  { pid: 1011, user: 'visitor', cpu: '2.3', mem: '4.5', vsz: '2345678', rss: '98765', tty: 'pts/0', stat: 'Ssl', start: '10:02', time: '0:12', cmd: 'node /app/server.js' },
  { pid: 1213, user: 'visitor', cpu: '0.5', mem: '2.1', vsz: '1567890', rss: '43210', tty: 'pts/0', stat: 'Sl', start: '10:02', time: '0:03', cmd: 'next-server (portfolio)' },
  { pid: 1415, user: 'visitor', cpu: '0.0', mem: '0.1', vsz: '45678', rss: '2345', tty: 'pts/0', stat: 'S', start: '10:03', time: '0:00', cmd: 'ps aux' },
  { pid: 1617, user: 'root', cpu: '0.0', mem: '0.1', vsz: '23456', rss: '1234', tty: '?', stat: 'Ss', start: '10:00', time: '0:00', cmd: '/usr/sbin/cron -f' },
  { pid: 1819, user: 'root', cpu: '0.0', mem: '0.1', vsz: '34567', rss: '2345', tty: '?', stat: 'Ss', start: '10:00', time: '0:00', cmd: '/usr/sbin/rsyslogd -n' },
];

// ps - process status
registerCommand({
  name: 'ps',
  description: 'Estado de procesos / Process status: ps [aux]',
  execute(args, ctx) {
    const showAll = args.includes('aux') || args.includes('-aux') || args.includes('ef') || args.includes('-ef');

    if (showAll) {
      const header = 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND';
      const lines = FAKE_PROCESSES.map(p =>
        `${p.user.padEnd(10)} ${String(p.pid).padStart(5)} ${p.cpu.padStart(4)} ${p.mem.padStart(4)} ${p.vsz.padStart(7)} ${p.rss.padStart(6)} ${p.tty.padEnd(8)} ${p.stat.padEnd(5)} ${p.start.padEnd(5)} ${p.time.padEnd(6)} ${p.cmd}`
      );
      return { type: 'text', content: header + '\n' + lines.join('\n') };
    }

    // Simple ps output
    const header = '  PID TTY          TIME CMD';
    const lines = FAKE_PROCESSES
      .filter(p => p.tty.startsWith('pts'))
      .map(p => `${String(p.pid).padStart(5)} ${p.tty.padEnd(12)} ${p.time.padEnd(6)} ${p.cmd.split(' ')[0]}`);
    return { type: 'text', content: header + '\n' + lines.join('\n') };
  },
});

// pgrep - find process by name
registerCommand({
  name: 'pgrep',
  description: 'Busca procesos por nombre / Find processes by name',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'pgrep: falta el nombre' : 'pgrep: missing process name' };
    }
    const name = args[0].toLowerCase();
    const matches = FAKE_PROCESSES.filter(p => p.cmd.toLowerCase().includes(name));
    if (matches.length === 0) {
      return { type: 'text', content: '' };
    }
    return { type: 'text', content: matches.map(p => String(p.pid)).join('\n') };
  },
});

// pkill - kill by name
registerCommand({
  name: 'pkill',
  description: 'Mata procesos por nombre / Kill processes by name',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'pkill: falta el nombre' : 'pkill: missing process name' };
    }
    const name = args[0].toLowerCase();
    const matches = FAKE_PROCESSES.filter(p => p.cmd.toLowerCase().includes(name));
    if (matches.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? `pkill: no se encontró el proceso "${args[0]}"`
          : `pkill: no process found "${args[0]}"`
      };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `Se terminaron ${matches.length} proceso(s)`
        : `Terminated ${matches.length} process(es)`
    };
  },
});

// kill - kill by PID
registerCommand({
  name: 'kill',
  description: 'Mata un proceso por PID / Kill process by PID: kill <pid>',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'kill: falta el PID' : 'kill: missing PID' };
    }
    const pid = parseInt(args[0], 10);
    if (isNaN(pid)) {
      return { type: 'error', content: ctx.lang === 'es' ? `kill: PID inválido "${args[0]}"` : `kill: invalid PID "${args[0]}"` };
    }
    const proc = FAKE_PROCESSES.find(p => p.pid === pid);
    if (!proc) {
      return { type: 'error', content: ctx.lang === 'es' ? `kill: (${pid}) - No such process` : `kill: (${pid}) - No such process` };
    }
    if (pid === 1) {
      return { type: 'error', content: ctx.lang === 'es' ? 'kill: no se puede matar PID 1 (init)' : 'kill: cannot kill PID 1 (init)' };
    }
    return { type: 'text', content: ctx.lang === 'es' ? `Proceso ${pid} terminado` : `Process ${pid} terminated` };
  },
});

// top - process viewer (JSX)
const TopComponent = () => {
  const [tick, setTick] = useState(0);
  const [stats, setStats] = useState(() => ({
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    upMin: Math.floor((Date.now() - 1000 * 60 * 60 * 2) / 60000),
    load1: (Math.random() * 0.5 + 0.1).toFixed(2),
    load5: (Math.random() * 0.3 + 0.05).toFixed(2),
    load15: (Math.random() * 0.2 + 0.02).toFixed(2),
    usedMem: Math.floor(Math.random() * 1000 + 6000),
    buffCache: Math.floor(Math.random() * 2000 + 3000),
    availMem: Math.floor(Math.random() * 1000 + 8000),
    procs: FAKE_PROCESSES.map(p => ({
      ...p,
      cpu: (Math.random() * 3 + 0.1).toFixed(1),
      mem: (Math.random() * 2 + 0.1).toFixed(1),
      virt: Math.floor(Math.random() * 2000000 + 100000),
      res: Math.floor(Math.random() * 100000 + 5000),
      shr: Math.floor(Math.random() * 50000 + 1000),
    })),
  }));

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setStats({
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        upMin: Math.floor((Date.now() - 1000 * 60 * 60 * 2) / 60000),
        load1: (Math.random() * 0.5 + 0.1).toFixed(2),
        load5: (Math.random() * 0.3 + 0.05).toFixed(2),
        load15: (Math.random() * 0.2 + 0.02).toFixed(2),
        usedMem: Math.floor(Math.random() * 1000 + 6000),
        buffCache: Math.floor(Math.random() * 2000 + 3000),
        availMem: Math.floor(Math.random() * 1000 + 8000),
        procs: FAKE_PROCESSES.map(p => ({
          ...p,
          cpu: (Math.random() * 3 + 0.1).toFixed(1),
          mem: (Math.random() * 2 + 0.1).toFixed(1),
          virt: Math.floor(Math.random() * 2000000 + 100000),
          res: Math.floor(Math.random() * 100000 + 5000),
          shr: Math.floor(Math.random() * 50000 + 1000),
        })),
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const totalMem = 16384;
  const freeMem = totalMem - stats.usedMem;

  return (
    <div className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
      <pre style={{ margin: 0, fontFamily: 'inherit' }}>
{`top - ${stats.time} up ${Math.floor(stats.upMin / 60)}:${String(stats.upMin % 60).padStart(2, '0')},  1 user,  load average: ${stats.load1}, ${stats.load5}, ${stats.load15}
Tasks: ${stats.procs.length} total,   1 running, ${stats.procs.length - 1} sleeping,   0 stopped,   0 zombie
%Cpu(s):  2.3 us,  1.1 sy,  0.0 ni, 96.2 id,  0.3 wa,  0.0 hi,  0.1 si,  0.0 st
MiB Mem :  ${totalMem} total,   ${freeMem} free,   ${stats.usedMem} used,   ${stats.buffCache} buff/cache
MiB Swap:   2048 total,   2048 free,      0 used.  ${stats.availMem} avail Mem

    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
${stats.procs.map(p => `${String(p.pid).padStart(7)} ${p.user.padEnd(9)} 20   0 ${String(p.virt).padStart(7)} ${String(p.res).padStart(7)} ${String(p.shr).padStart(7)} S   ${p.cpu.padStart(4)}   ${p.mem.padStart(4)} ${p.time.padStart(8)} ${p.cmd.split(' ')[0]}`).join('\n')}`}
      </pre>
    </div>
  );
};

registerCommand({
  name: 'top',
  description: 'Visor de procesos en tiempo real / Real-time process viewer',
  execute(_args, _ctx) {
    return { type: 'jsx', content: <TopComponent /> };
  },
});

// htop - enhanced top
registerCommand({
  name: 'htop',
  description: 'Visor de procesos mejorado / Enhanced process viewer',
  execute(_args, _ctx) {
    return { type: 'jsx', content: <TopComponent /> };
  },
});

// nice - set priority
registerCommand({
  name: 'nice',
  description: 'Ejecuta con prioridad / Run with priority: nice <command>',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: '0' };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `Ejecutando "${args.join(' ')}" con prioridad 10`
        : `Running "${args.join(' ')}" with nice value 10`
    };
  },
});

// nohup - no hangup
registerCommand({
  name: 'nohup',
  description: 'Ejecuta sin hangup / Run without hangup',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'nohup: falta el comando' : 'nohup: missing command' };
    }
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `nohup: ejecutando "${args.join(' ')}" en segundo plano\nnohup: salida redirigida a 'nohup.out'`
        : `nohup: running "${args.join(' ')}" in background\nnohup: output redirected to 'nohup.out'`
    };
  },
});

// jobs - background jobs
registerCommand({
  name: 'jobs',
  description: 'Trabajos en segundo plano / Background jobs',
  execute(_args, ctx) {
    return { type: 'text', content: '' };
  },
});

// bg - background
registerCommand({
  name: 'bg',
  description: 'Continúa en segundo plano / Continue in background',
  execute(args, ctx) {
    return { type: 'text', content: '' };
  },
});

// fg - foreground
registerCommand({
  name: 'fg',
  description: 'Trae al primer plano / Bring to foreground',
  execute(args, ctx) {
    return { type: 'text', content: '' };
  },
});

// time - command timing
registerCommand({
  name: 'time',
  description: 'Mide el tiempo de ejecución / Time command execution',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'text', content: 'real\t0m0.001s\nuser\t0m0.000s\nsys\t0m0.000s' };
    }
    return {
      type: 'text',
      content: `real\t0m${(Math.random() * 0.5 + 0.01).toFixed(3)}s\nuser\t0m${(Math.random() * 0.3 + 0.005).toFixed(3)}s\nsys\t0m${(Math.random() * 0.1 + 0.002).toFixed(3)}s`
    };
  },
});

// wait - wait for process
registerCommand({
  name: 'wait',
  description: 'Espera a que terminen procesos / Wait for processes',
  execute(_args, ctx) {
    return { type: 'text', content: '' };
  },
});
