// src/lib/commands/system.ts
// System information commands: uname, hostname, uptime, id, w, last, cal, etc.
import { registerCommand, type CommandContext } from './index';
import { profile } from '@/data/profile';

const BOOT_TIME = Date.now();
const KERNEL_VERSION = '6.8.0-mangeluk';
const HOSTNAME = 'portfolio';

// uname - system information
registerCommand({
  name: 'uname',
  description: 'Información del sistema / System information',
  execute(args, ctx) {
    const all = args.includes('-a');
    const kernel = args.includes('-r');
    const machine = args.includes('-m');
    const nodename = args.includes('-n');
    const sysname = args.includes('-s');

    if (all) {
      return {
        type: 'text',
        content: `Linux ${HOSTNAME} ${KERNEL_VERSION} #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`
      };
    }

    const parts: string[] = [];
    if (sysname || (!kernel && !machine && !nodename && args.length === 0)) parts.push('Linux');
    if (nodename) parts.push(HOSTNAME);
    if (kernel) parts.push(KERNEL_VERSION);
    if (machine) parts.push('x86_64');

    return { type: 'text', content: parts.join(' ') || 'Linux' };
  },
});

// hostname
registerCommand({
  name: 'hostname',
  description: 'Muestra el nombre del host / Show hostname',
  execute(_args, ctx) {
    return { type: 'text', content: HOSTNAME };
  },
});

// uptime
registerCommand({
  name: 'uptime',
  description: 'Tiempo encendido del sistema / System uptime',
  execute(_args, ctx) {
    const elapsed = Math.floor((Date.now() - BOOT_TIME) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const secs = elapsed % 60;
    const upStr = hours > 0 ? `${hours}:${String(mins).padStart(2, '0')}` : `${mins} min`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const load = `${(Math.random() * 0.5 + 0.1).toFixed(2)}, ${(Math.random() * 0.3 + 0.05).toFixed(2)}, ${(Math.random() * 0.2 + 0.02).toFixed(2)}`;
    return {
      type: 'text',
      content: ` ${time} up ${upStr},  1 user,  load average: ${load}`
    };
  },
});

// id - user identity
registerCommand({
  name: 'id',
  description: 'Identidad del usuario / User identity',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `uid=1000(visitor) gid=1000(visitor) groups=1000(visitor),27(sudo),33(www-data),100(users)`
    };
  },
});

// w - who is logged in
registerCommand({
  name: 'w',
  description: 'Quién está logueado y qué hace / Who is logged in',
  execute(_args, ctx) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const upStr = '2:34';
    return {
      type: 'text',
      content: ` ${time} up ${upStr},  1 user,  load average: 0.12, 0.08, 0.03
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
visitor  pts/0    127.0.0.1        ${time}   0.00s  0.12s  0.00s w`
    };
  },
});

// last - last logins
registerCommand({
  name: 'last',
  description: 'Últimos logins / Last logins',
  execute(_args, ctx) {
    const now = new Date();
    const logins = [
      { user: 'visitor', tty: 'pts/0', from: '127.0.0.1', time: new Date(now.getTime() - 3600000), duration: '2:34' },
      { user: 'visitor', tty: 'pts/0', from: '192.168.1.100', time: new Date(now.getTime() - 86400000), duration: '1:22' },
      { user: 'root', tty: 'tty1', from: '', time: new Date(now.getTime() - 172800000), duration: '0.01' },
    ];

    const lines = logins.map(l => {
      const timeStr = l.time.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `${l.user.padEnd(8)}${l.tty.padEnd(8)}${(l.from || ':0').padEnd(16)}${timeStr}   still logged in`;
    });

    lines.push('');
    lines.push('wtmp begins ' + new Date(now.getTime() - 2592000000).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }));

    return { type: 'text', content: lines.join('\n') };
  },
});

// who - who is logged in
registerCommand({
  name: 'who',
  description: 'Quién está logueado / Who is logged in',
  execute(_args, ctx) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    return {
      type: 'text',
      content: `visitor  pts/0        ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ${time} (127.0.0.1)`
    };
  },
});

// whoami removed — kept in content.tsx (richer profile bio)

// groups - user groups
registerCommand({
  name: 'groups',
  description: 'Grupos del usuario / User groups',
  execute(_args, ctx) {
    return { type: 'text', content: 'visitor sudo www-data users' };
  },
});

// cal - calendar
registerCommand({
  name: 'cal',
  description: 'Muestra un calendario / Show calendar',
  execute(args, ctx) {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.getDate();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const header = `    ${monthNames[month]} ${year}`;
    const days = 'Su Mo Tu We Th Fr Sa';

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const lines = [header, days];
    let line = '   '.repeat(firstDay);

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d === today ? `\x1b[7m${String(d).padStart(2)}\x1b[0m` : String(d).padStart(2);
      line += dayStr + ' ';
      if ((firstDay + d) % 7 === 0) {
        lines.push(line.trimEnd());
        line = '';
      }
    }
    if (line.trim()) lines.push(line.trimEnd());

    return { type: 'text', content: lines.join('\n') };
  },
});

// date removed — kept in utility.tsx (localized + format strings)

// free - memory info
registerCommand({
  name: 'free',
  description: 'Información de memoria / Memory information',
  execute(args, ctx) {
    const human = args.includes('-h');
    const total = 16384;
    const used = Math.floor(Math.random() * 4000 + 6000);
    const free = total - used;
    const shared = Math.floor(Math.random() * 500 + 200);
    const buffCache = Math.floor(Math.random() * 2000 + 3000);
    const available = free + buffCache;

    const fmt = (v: number) => human ? `${(v / 1024).toFixed(1)}Gi` : String(v);

    return {
      type: 'text',
      content: `              total        used        free      shared  buff/cache   available
Mem:          ${fmt(total)}       ${fmt(used)}       ${fmt(free)}         ${fmt(shared)}       ${fmt(buffCache)}       ${fmt(available)}
Swap:          2048           0        ${fmt(2048)}`
    };
  },
});

// df - disk free
registerCommand({
  name: 'df',
  description: 'Espacio en disco / Disk free space',
  execute(args, ctx) {
    const human = args.includes('-h');
    const lines = [
      'Filesystem      Size  Used Avail Use% Mounted on',
      '/dev/sda1        50G   12G   36G  25% /',
      'tmpfs           8.0G     0  8.0G   0% /dev/shm',
      '/dev/sda2       100G   45G   50G  48% /home',
      'overlay          50G   12G   36G  25% /var/lib/docker/overlay2',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// du - disk usage
registerCommand({
  name: 'du',
  description: 'Uso de disco / Disk usage',
  execute(args, ctx) {
    const human = args.includes('-h');
    const lines = [
      '4.0K\t./.ssh',
      '8.0K\t./.config/portfolio',
      '12K\t./.config',
      '24K\t./experience',
      '16K\t./projects',
      '4.0K\t./documents',
      '4.0K\t./downloads',
      '72K\t.',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// lscpu - CPU info
registerCommand({
  name: 'lscpu',
  description: 'Información de la CPU / CPU information',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `Architecture:           x86_64
CPU op-mode(s):         32-bit, 64-bit
Address sizes:          46 bits physical, 48 bits virtual
Byte Order:             Little Endian
CPU(s):                 20
On-line CPU(s) list:    0-19
Vendor ID:              GenuineIntel
Model name:             Intel(R) Core(TM) i7-12700K
CPU family:             6
Model:                  151
Stepping:               2
CPU MHz:                3600.000
CPU max MHz:            5000.0000
CPU min MHz:            800.0000
BogoMIPS:               7200.00
L1d cache:              480 KiB
L1i cache:              320 KiB
L2 cache:               12 MiB
L3 cache:               25 MiB
Flags:                  fpu vme de pse tsc msr pae mce cx8 apic sep mtrr
                        pge mca cmov pat pse36 clflush dts acpi mmx fxsr
                        sse sse2 ss ht tm pbe syscall nx rdtscp lm constant_tsc`
    };
  },
});

// lsblk - block devices
registerCommand({
  name: 'lsblk',
  description: 'Dispositivos de bloque / Block devices',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `NAME   MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda      8:0    0    50G  0 disk
├─sda1   8:1    0    15G  0 part /
├─sda2   8:2    0   100G  0 part /home
└─sda3   8:3    0     2G  0 part [SWAP]
sr0     11:0    1  1024M  0 rom`
    };
  },
});

// lsusb - USB devices
registerCommand({
  name: 'lsusb',
  description: 'Dispositivos USB / USB devices',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 003: ID 8087:0026 Intel Corp.
Bus 001 Device 002: ID 046d:c52b Logitech, Inc. Unifying Receiver
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub`
    };
  },
});

// lspci - PCI devices
registerCommand({
  name: 'lspci',
  description: 'Dispositivos PCI / PCI devices',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `00:00.0 Host bridge: Intel Corporation 12th Gen Core Processor Host Bridge/DRAM Registers
00:02.0 VGA compatible controller: Intel Corporation Alder Lake-S GT1 [UHD Graphics 770]
00:14.0 USB controller: Intel Corporation Alder Lake-S USB 3.2 xHCI Host Controller
00:16.0 Communication controller: Intel Corporation Alder Lake-S HECI Controller
00:1c.0 PCI bridge: Intel Corporation Alder Lake-S PCI Express Root Port
00:1f.0 ISA bridge: Intel Corporation Alder Lake-S PCH-stitched eSPI Controller
00:1f.2 Memory controller: Intel Corporation Alder Lake-S PCH DDR Controller
00:1f.3 Audio device: Intel Corporation Alder Lake-S PCH-H High Definition Audio Controller`
    };
  },
});

// ip - network interfaces
registerCommand({
  name: 'ip',
  description: 'Información de red / Network information: ip addr, ip route',
  execute(args, ctx) {
    const sub = args[0];
    if (sub === 'addr' || sub === 'a') {
      return {
        type: 'text',
        content: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:acff:fe11:2/64 scope link
       valid_lft forever preferred_lft forever`
      };
    }
    if (sub === 'route' || sub === 'r') {
      return {
        type: 'text',
        content: `default via 172.17.0.1 dev eth0
172.17.0.0/16 dev eth0 proto kernel scope link src 172.17.0.2`
      };
    }
    return {
      type: 'text',
      content: `Usage: ip [ addr | route | link ]`
    };
  },
});

// ifconfig - network interfaces (legacy)
registerCommand({
  name: 'ifconfig',
  description: 'Configuración de red (legacy) / Network configuration (legacy)',
  execute(_args, ctx) {
    return {
      type: 'text',
      content: `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 172.17.0.2  netmask 255.255.0.0  broadcast 172.17.255.255
        inet6 fe80::42:acff:fe11:2  prefixlen 64  scopeid 0x20<link>
        ether 02:42:ac:11:00:02  txqueuelen 0  (Ethernet)
        RX packets 12345  bytes 12345678 (11.7 MiB)
        TX packets 9876  bytes 9876543 (9.4 MiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        inet6 ::1  prefixlen 128  scopeid 0x10<host>
        loop  txqueuelen 1000  (Local Loopback)
        RX packets 1234  bytes 123456 (120.5 KiB)
        TX packets 1234  bytes 123456 (120.5 KiB)`
    };
  },
});

// ping - ping simulation
registerCommand({
  name: 'ping',
  description: 'Simula un ping / Simulate ping: ping <host>',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'ping: falta un operando'
          : 'ping: missing host operand'
      };
    }
    const host = args[0];
    const lines = [
      `PING ${host} (${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'}) 56(84) bytes of data.`,
      `64 bytes from ${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'}: icmp_seq=1 ttl=56 time=12.3 ms`,
      `64 bytes from ${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'}: icmp_seq=2 ttl=56 time=11.8 ms`,
      `64 bytes from ${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'}: icmp_seq=3 ttl=56 time=12.1 ms`,
      '',
      `--- ${host} ping statistics ---`,
      `3 packets transmitted, 3 received, 0% packet loss, time 2003ms`,
      `rtt min/avg/max/mdev = 11.8/12.1/12.3/0.2 ms`,
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// curl - HTTP request simulation
registerCommand({
  name: 'curl',
  description: 'Simula una petición HTTP / Simulate HTTP request: curl <url>',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'curl: falta la URL'
          : 'curl: missing URL'
      };
    }
    const url = args[0];
    const verbose = args.includes('-v') || args.includes('--verbose');
    const lines: string[] = [];

    if (verbose) {
      lines.push(`* Trying 93.184.216.34:443...`);
      lines.push(`* Connected to ${url.replace(/https?:\/\//, '').split('/')[0]} (93.184.216.34) port 443`);
      lines.push(`* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384`);
      lines.push(`> GET / HTTP/1.1`);
      lines.push(`> Host: ${url.replace(/https?:\/\//, '').split('/')[0]}`);
      lines.push(`> User-Agent: curl/8.5.0`);
      lines.push(`> Accept: */*`);
      lines.push(`< HTTP/1.1 200 OK`);
      lines.push(`< Content-Type: text/html; charset=UTF-8`);
      lines.push(`< Content-Length: 1234`);
      lines.push(`< Server: nginx/1.24.0`);
      lines.push(`<`);
    }

    lines.push(`<!DOCTYPE html>`);
    lines.push(`<html>`);
    lines.push(`<head><title>Example Page</title></head>`);
    lines.push(`<body><h1>Hello from ${url}</h1></body>`);
    lines.push(`</html>`);

    return { type: 'text', content: lines.join('\n') };
  },
});

// wget - download simulation
registerCommand({
  name: 'wget',
  description: 'Simula una descarga / Simulate download: wget <url>',
  execute(args, ctx) {
    if (args.length === 0) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? 'wget: falta la URL'
          : 'wget: missing URL'
      };
    }
    const url = args[0];
    const filename = url.split('/').pop() || 'index.html';
    return {
      type: 'text',
      content: `--${new Date().toISOString().slice(0, 19)}--  ${url}
Resolving ${url.replace(/https?:\/\//, '').split('/')[0]}... 93.184.216.34
Connecting to ${url.replace(/https?:\/\//, '').split('/')[0]}|93.184.216.34|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 1234 (1.2K) [text/html]
Saving to: '${filename}'

${filename}           100%[===================>]   1.21K  --.-KB/s    in 0s

${new Date().toISOString().slice(0, 19)}-- (1.21 KB/s) - '${filename}' saved [1234/1234]`
    };
  },
});

// host - DNS lookup
registerCommand({
  name: 'host',
  description: 'Búsqueda DNS / DNS lookup',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'host: falta el dominio' : 'host: missing domain' };
    }
    return {
      type: 'text',
      content: `${args[0]} has address 93.184.216.34\n${args[0]} has IPv6 address 2606:2800:220:1:248:1893:25c8:1946`
    };
  },
});

// netstat - network statistics
registerCommand({
  name: 'netstat',
  description: 'Estadísticas de red / Network statistics',
  execute(args, ctx) {
    const lines = [
      'Active Internet connections (servers and established)',
      'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
      'tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN',
      'tcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN',
      'tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN',
      'tcp        0      0 172.17.0.2:443          93.184.216.34:49832     ESTABLISHED',
      'udp        0      0 0.0.0.0:53              0.0.0.0:*',
      'udp        0      0 0.0.0.0:68              0.0.0.0:*',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// ss - socket statistics
registerCommand({
  name: 'ss',
  description: 'Estadísticas de sockets / Socket statistics',
  execute(args, ctx) {
    const lines = [
      'State      Recv-Q Send-Q  Local Address:Port   Peer Address:Port  Process',
      'LISTEN     0      4096    0.0.0.0:80           0.0.0.0:*',
      'LISTEN     0      4096    0.0.0.0:443          0.0.0.0:*',
      'LISTEN     0      4096    127.0.0.1:3000       0.0.0.0:*',
      'ESTAB      0      0       172.17.0.2:443       93.184.216.34:49832',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// traceroute - route tracing simulation
registerCommand({
  name: 'traceroute',
  description: 'Trazado de ruta / Route tracing: traceroute <host>',
  execute(args, ctx) {
    if (args.length === 0) {
      return { type: 'error', content: ctx.lang === 'es' ? 'traceroute: falta el host' : 'traceroute: missing host' };
    }
    const host = args[0];
    const lines = [
      `traceroute to ${host} (${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'}), 30 hops max, 60 byte packets`,
      ` 1  gateway (172.17.0.1)  0.523 ms  0.487 ms  0.462 ms`,
      ` 2  10.0.0.1 (10.0.0.1)  1.234 ms  1.198 ms  1.176 ms`,
      ` 3  isp-router.net (200.100.50.1)  5.678 ms  5.643 ms  5.621 ms`,
      ` 4  core-router.net (190.200.100.1)  10.234 ms  10.198 ms  10.176 ms`,
      ` 5  ${host} (${host === 'localhost' ? '127.0.0.1' : '93.184.216.34'})  12.345 ms  12.312 ms  12.289 ms`,
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});

// arp - ARP table
registerCommand({
  name: 'arp',
  description: 'Tabla ARP / ARP table',
  execute(_args, ctx) {
    const lines = [
      'Address                  HWtype  HWaddress           Flags Mask            Iface',
      'gateway                  ether   02:42:ac:11:00:01   C                     eth0',
      '172.17.0.3               ether   02:42:ac:11:00:03   C                     eth0',
    ];
    return { type: 'text', content: lines.join('\n') };
  },
});
