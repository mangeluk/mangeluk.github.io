'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';

interface Process {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

function generateProcesses(): Process[] {
  const procs: Process[] = [
    { pid: 1, user: 'root', cpu: 0.0, mem: 0.3, command: 'systemd' },
    { pid: 2, user: 'root', cpu: 0.0, mem: 0.0, command: 'kthreadd' },
    { pid: 142, user: 'root', cpu: 0.3, mem: 0.5, command: 'sshd' },
    { pid: 256, user: 'www-data', cpu: 1.2, mem: 2.1, command: 'nginx' },
    { pid: 389, user: 'postgres', cpu: 0.8, mem: 3.4, command: 'postgres' },
    { pid: 512, user: 'root', cpu: 0.1, mem: 0.4, command: 'redis-server' },
    { pid: 623, user: 'mangeluk', cpu: 12.4, mem: 8.2, command: 'node server.js' },
    { pid: 734, user: 'mangeluk', cpu: 8.7, mem: 6.1, command: 'next-server' },
    { pid: 845, user: 'mangeluk', cpu: 5.3, mem: 4.5, command: 'webpack' },
    { pid: 956, user: 'root', cpu: 2.1, mem: 1.8, command: 'docker-containerd' },
    { pid: 1067, user: 'mangeluk', cpu: 3.4, mem: 2.9, command: 'python3 app.py' },
    { pid: 1178, user: 'root', cpu: 0.0, mem: 0.1, command: 'cron' },
    { pid: 1289, user: 'mangeluk', cpu: 15.2, mem: 7.3, command: 'code-server' },
    { pid: 1400, user: 'mangeluk', cpu: 1.8, mem: 1.5, command: 'eslint' },
    { pid: 1511, user: 'root', cpu: 0.5, mem: 0.8, command: 'systemd-journal' },
    { pid: 1622, user: 'mangeluk', cpu: 0.2, mem: 0.6, command: 'bash' },
    { pid: 1733, user: 'mangeluk', cpu: 22.1, mem: 9.4, command: 'vim main.ts' },
  ];

  return procs.map((p) => ({
    ...p,
    cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 4),
    mem: Math.max(0.1, p.mem + (Math.random() - 0.5) * 1),
  }));
}

function BarChart({ value, color }: { value: number; color: string }) {
  return (
    <div className="sysmon-bar-track">
      <div className="sysmon-bar-fill" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

export default function SystemMonitorApp() {
  const [cpu, setCpu] = useState(45);
  const [mem, setMem] = useState(55);
  const [processes, setProcesses] = useState(generateProcesses);
  const [uptime] = useState(() => {
    const h = Math.floor(Math.random() * 48) + 1;
    const m = Math.floor(Math.random() * 60);
    return `${h}h ${m}m`;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  const refresh = useCallback(() => {
    setCpu((prev) => Math.max(5, Math.min(95, prev + (Math.random() - 0.5) * 20)));
    setMem((prev) => Math.max(20, Math.min(85, prev + (Math.random() - 0.5) * 10)));
    setProcesses(generateProcesses());
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(refresh, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const sorted = [...processes].sort((a, b) => b.cpu - a.cpu).slice(0, 15);

  return (
    <div className="sysmon-container">
      <div className="sysmon-bars">
        <div className="sysmon-metric">
          <div className="sysmon-metric-header">
            <span>CPU</span>
            <span>{cpu.toFixed(1)}%</span>
          </div>
          <BarChart value={cpu} color={cpu > 80 ? '#ff5555' : cpu > 60 ? '#ffb86c' : '#00ff9f'} />
        </div>
        <div className="sysmon-metric">
          <div className="sysmon-metric-header">
            <span>MEM</span>
            <span>{mem.toFixed(1)}%</span>
          </div>
          <BarChart value={mem} color={mem > 80 ? '#ff5555' : mem > 60 ? '#ffb86c' : '#00ff9f'} />
        </div>
      </div>

      <div className="sysmon-info">
        <span>Uptime: {uptime}</span>
        <span>Processes: {processes.length}</span>
      </div>

      <div className="sysmon-table-wrapper">
        <table className="sysmon-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>USER</th>
              <th>CPU%</th>
              <th>MEM%</th>
              <th>COMMAND</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.pid} className={p.cpu > 15 ? 'sysmon-row--hot' : ''}>
                <td>{p.pid}</td>
                <td>{p.user}</td>
                <td>{p.cpu.toFixed(1)}</td>
                <td>{p.mem.toFixed(1)}</td>
                <td className="sysmon-cmd">{p.command}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
