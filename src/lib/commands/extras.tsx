// src/lib/commands/extras.tsx
// Comandos extra: man, redes sociales, stats, clock, timer, cv, weather, typing test
import React, { useState, useEffect, useRef } from 'react';
import { registerCommand, type CommandContext, getRegistry } from './index';
import { profile } from '@/data/profile';

// ------------------------------
// Comando man
// ------------------------------
registerCommand({
  name: 'man',
  description: 'Muestra el manual de un comando',
  execute(args, ctx) {
    if (args.length === 0) {
      const allCommands = Array.from(getRegistry().keys()).sort();
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? `Uso: man <comando>\nComandos disponibles: ${allCommands.join(', ')}`
          : `Usage: man <command>\nAvailable commands: ${allCommands.join(', ')}`
      };
    }
    const cmd = args[0].toLowerCase();
    const def = getRegistry().get(cmd);
    if (!def) {
      return {
        type: 'error',
        content: ctx.lang === 'es'
          ? `No hay entrada de manual para ${cmd}`
          : `No manual entry for ${cmd}`
      };
    }
    return { type: 'text', content: `${def.name} - ${def.description}` };
  },
});

// ------------------------------
// Comandos directos a redes
// ------------------------------
registerCommand({
  name: 'github',
  description: 'Abre el perfil de GitHub',
  execute() {
    if (typeof window !== 'undefined') {
      window.open('https://github.com/Magamex', '_blank');
    }
    return {
      type: 'text',
      content: 'Abriendo https://github.com/Magamex...'
    };
  },
});

registerCommand({
  name: 'linkedin',
  description: 'Abre el perfil de LinkedIn',
  execute() {
    if (typeof window !== 'undefined') {
      window.open('https://linkedin.com/in/matiasangeluk', '_blank');
    }
    return {
      type: 'text',
      content: 'Abriendo LinkedIn...'
    };
  },
});

registerCommand({
  name: 'email',
  description: 'Abre el cliente de correo',
  execute() {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:matias.angeluk@gmail.com';
    }
    return {
      type: 'text',
      content: 'Abriendo cliente de correo...'
    };
  },
});

// ------------------------------
// Comando stats
// ------------------------------
registerCommand({
  name: 'stats',
  description: 'Muestra estadísticas de la sesión y de la carrera',
  execute(_args, ctx) {
    const { commandCount, startTime } = ctx.getSessionStats();
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const totalExperience = profile.es.experience.length;
    const totalProjects = profile.es.projects.length;

    const contentEs = `Estadísticas de la Sesión:
------------------------
Comandos ejecutados: ${commandCount}
Tiempo transcurrido: ${minutes}m ${seconds}s

Estadísticas Profesionales:
---------------------------
Años de experiencia: ~8+
Trabajos anteriores: ${totalExperience}
Proyectos destacados: ${totalProjects}`;

    const contentEn = `Session Statistics:
------------------
Commands executed: ${commandCount}
Elapsed time: ${minutes}m ${seconds}s

Professional Stats:
------------------
Years of experience: ~8+
Previous jobs: ${totalExperience}
Featured projects: ${totalProjects}`;

    return { type: 'text', content: ctx.lang === 'es' ? contentEs : contentEn };
  },
});

// ------------------------------
// Comando clock
// ------------------------------
const ClockComponent = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{time.toLocaleString()}</div>;
};

registerCommand({
  name: 'clock',
  description: 'Muestra un reloj en tiempo real',
  execute() {
    return { type: 'jsx', content: <ClockComponent /> };
  },
});

// ------------------------------
// Comando timer
// ------------------------------
const TimerComponent = ({ minutes = 5 }) => {
  const [remaining, setRemaining] = useState(minutes * 60);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => setRemaining(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
  const secs = (remaining % 60).toString().padStart(2, '0');
  const done = remaining <= 0;

  return <div>{done ? '⏰ ¡Tiempo!' : `${mins}:${secs}`}</div>;
};

registerCommand({
  name: 'timer',
  description: 'Temporizador: timer <minutos>',
  execute(args) {
    const mins = args.length > 0 ? parseInt(args[0], 10) : 5;
    if (isNaN(mins) || mins <= 0) {
      return { type: 'error', content: 'Uso: timer <número positivo de minutos>' };
    }
    return { type: 'jsx', content: <TimerComponent minutes={mins} /> };
  },
});

// ------------------------------
// Comando cv
// ------------------------------
registerCommand({
  name: 'cv',
  description: 'Consulta tu CV: cv --skills, --experience, --projects',
  execute(args, ctx) {
    const flag = args[0]?.toLowerCase();
    const langProfile = ctx.lang === 'es' ? profile.es : profile.en;

    if (flag === '--skills' || flag === '-s') {
      const skillText = langProfile.skills
        .map(cat => `${cat.name}: ${cat.skills.join(', ')}`)
        .join('\n');
      return { type: 'text', content: skillText };
    }

    if (flag === '--experience' || flag === '-e') {
      const expText = langProfile.experience
        .map(exp => `${exp.company} - ${exp.role} (${exp.from}–${exp.to})\n  ${exp.description}`)
        .join('\n\n');
      return { type: 'text', content: expText };
    }

    if (flag === '--projects' || flag === '-p') {
      const projText = langProfile.projects
        .map(proj => `- ${proj.name}\n  ${proj.description}${proj.url ? `\n  Link: ${proj.url}` : ''}`)
        .join('\n\n');
      return { type: 'text', content: projText };
    }

    // Si no hay opciones (o no hay args), descargar el PDF
    const cvUrl = profile[ctx.lang]?.cvUrl || profile['es']?.cvUrl || '';

    if (!cvUrl) {
      return {
        type: 'error',
        content: ctx.lang === 'en'
          ? 'CV is not available at this time.'
          : 'El CV no está disponible actualmente.',
      };
    }

    // Trigger download via JSX anchor with `download` attribute
    const content = (
      <span>
        {ctx.lang === 'en' ? 'Starting download... ' : 'Iniciando descarga... '}
        <a
          href={cvUrl}
          download
          className="underline hover:opacity-80"
          onClick={(e) => {
            e.currentTarget.click();
          }}
        >
          {ctx.lang === 'en' ? 'Click here if it does not start automatically.' : 'Haz clic aquí si no inicia automáticamente.'}
        </a>
      </span>
    );

    return { type: 'jsx', content };
  },
});

// ------------------------------
// Comando weather
// ------------------------------
registerCommand({
  name: 'weather',
  description: 'Muestra el clima (usa Open-Meteo, sin clave API): weather <ciudad>',
  execute: async (args, ctx) => {
    let location = 'Mar del Plata';
    if (args.length > 0) location = args.join(' ');

    try {
      // Primero usamos geocoding para encontrar la ubicación
      const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=${ctx.lang}&format=json`;
      const geoRes = await fetch(geocodingUrl);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        return { 
          type: 'error', 
          content: ctx.lang === 'es' 
            ? `No se encontró la ubicación: ${location}` 
            : `Location not found: ${location}` 
        };
      }

      const { latitude: lat, longitude: lon, name: foundLocation } = geoData.results[0];
      const displayLocation = foundLocation || location;

      // Ahora obtenemos el clima con las coordenadas correctas
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();
      
      const temp = weatherData.current.temperature_2m;
      const humidity = weatherData.current.relative_humidity_2m;
      const weatherCode = weatherData.current.weather_code;

      // Mapeo de weather codes a descripciones (más completo)
      const weatherDescriptions: Record<number, { es: string; en: string }> = {
        0: { es: 'Despejado', en: 'Clear sky' },
        1: { es: 'Mayormente despejado', en: 'Mainly clear' },
        2: { es: 'Parcialmente nublado', en: 'Partly cloudy' },
        3: { es: 'Nublado', en: 'Overcast' },
        45: { es: 'Niebla', en: 'Fog' },
        48: { es: 'Niebla con escarcha', en: 'Depositing rime fog' },
        51: { es: 'Llovizna ligera', en: 'Light drizzle' },
        53: { es: 'Llovizna moderada', en: 'Moderate drizzle' },
        55: { es: 'Llovizna intensa', en: 'Dense drizzle' },
        61: { es: 'Lluvia ligera', en: 'Slight rain' },
        63: { es: 'Lluvia moderada', en: 'Moderate rain' },
        65: { es: 'Lluvia intensa', en: 'Heavy rain' },
        71: { es: 'Nieve ligera', en: 'Slight snow' },
        73: { es: 'Nieve moderada', en: 'Moderate snow' },
        75: { es: 'Nieve intensa', en: 'Heavy snow' },
        77: { es: 'Granos de nieve', en: 'Snow grains' },
        80: { es: 'Chubascos ligeros', en: 'Slight rain showers' },
        81: { es: 'Chubascos moderados', en: 'Moderate rain showers' },
        82: { es: 'Chubascos violentos', en: 'Violent rain showers' },
        85: { es: 'Chubascos de nieve ligeros', en: 'Slight snow showers' },
        86: { es: 'Chubascos de nieve intensos', en: 'Heavy snow showers' },
        95: { es: 'Tormenta', en: 'Thunderstorm' },
        96: { es: 'Tormenta con granizo ligero', en: 'Thunderstorm with slight hail' },
        99: { es: 'Tormenta con granizo intenso', en: 'Thunderstorm with heavy hail' }
      };

      const weatherDesc = weatherDescriptions[weatherCode] || { es: 'Desconocido', en: 'Unknown' };

      const textEs = `Clima en ${displayLocation}
================
Temperatura: ${temp}°C
Humedad: ${humidity}%
Condiciones: ${weatherDesc.es}`;
      const textEn = `Weather in ${displayLocation}
================
Temperature: ${temp}°C
Humidity: ${humidity}%
Conditions: ${weatherDesc.en}`;

      return { type: 'text', content: ctx.lang === 'es' ? textEs : textEn };
    } catch (e) {
      return { type: 'error', content: ctx.lang === 'es' ? 'No se pudo obtener el clima' : 'Could not get weather' };
    }
  },
});

// ------------------------------
// Comando typing-test
// ------------------------------
const TypingTestComponent = ({ lang }: { lang: 'es' | 'en' }) => {
  const sampleTexts = {
    es: 'El desarrollador Full Stack construye aplicaciones web escalables.',
    en: 'The Full Stack Developer builds scalable web applications.'
  };

  const [text] = useState(sampleTexts[lang]);
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!started) {
      setStarted(true);
      setStartTime(Date.now());
    }
    const newInput = e.target.value;
    setInput(newInput);
    if (newInput === text) {
      setEndTime(Date.now());
    }
  };

  const wpm = endTime && startTime ? Math.round((text.split(' ').length / ((endTime - startTime) / 1000 / 60))) : 0;

  return (
    <div>
      <p style={{ marginBottom: '1rem' }}>{text}</p>
      <input
        ref={inputRef}
        value={input}
        disabled={!!endTime}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '0.5rem',
          fontFamily: 'inherit',
          backgroundColor: 'transparent',
          color: 'inherit',
          border: '1px solid var(--text-secondary)'
        }}
      />
      {endTime && (
        <p style={{ marginTop: '1rem' }}>
          ¡Listo! WPM: {wpm}
        </p>
      )}
    </div>
  );
};

registerCommand({
  name: 'typing-test',
  description: 'Test de velocidad de escritura',
  execute(_args, ctx) {
    return { type: 'jsx', content: <TypingTestComponent lang={ctx.lang} /> };
  },
});

// ------------------------------
// Comando calc (calculadora)
// ------------------------------
registerCommand({
  name: 'calc',
  description: 'Calculadora simple: calc 2+2',
  execute(args) {
    if (args.length === 0) {
      return {
        type: 'text',
        content: 'Uso: calc <expresión> Ejemplo: calc 2+2'
      };
    }
    try {
      const expr = args.join('');
      // Validador básico para evitar ejecución de código malicioso
      if (!/^[\d\s+\-*/().]+$/.test(expr)) {
        return { type: 'error', content: 'Expresión inválida' };
      }
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      return {
        type: 'text',
        content: `${expr} = ${result}`
      };
    } catch (e) {
      return { type: 'error', content: 'Error en la expresión' };
    }
  }
});

// ------------------------------
// Comando fortune (frases aleatorias)
// ------------------------------
const fortunes = [
  "El código que no escribes es el código que no tienes que mantener.",
  "Primero, resuelve el problema. Luego, escribe el código.",
  "Nunca es tarde para refactorizar.",
  "La mejor línea de código es la que no existe.",
  "Siempre prueba tu código.",
  "Tu futuro yo agradecerá los comentarios que escribes hoy.",
  "La simplicidad es la máxima sofisticación.",
  "No te preocupes por si alguien va a robar tu código. Preocúpate por si lo quieren.",
  "La consistencia es la clave del éxito.",
  "El debugging es el doble de difícil que escribir el código en primer lugar. Por lo tanto, si escribes el código de la manera más inteligente posible, no eres lo suficientemente inteligente para depurarlo.",
  "Caminar sobre el agua y desarrollar software a partir de una especificación son dos cosas muy fáciles… si ambas están congeladas."
];

registerCommand({
  name: 'fortune',
  description: 'Muestra una frase aleatoria sobre programación',
  execute() {
    const randomIndex = Math.floor(Math.random() * fortunes.length);
    return { type: 'text', content: fortunes[randomIndex] };
  }
});

// ------------------------------
// Comando sudo (easter egg)
// ------------------------------
registerCommand({
  name: 'sudo',
  description: 'Modo superusuario (easter egg)',
  execute(args) {
    if (args.length === 0) {
      return { type: 'text', content: 'Uso: sudo <comando>. Pero... ¿seguro?' };
    }
    return {
      type: 'text',
      content: `Acceso denegado. ¡No eres root aquí! 😉`
    };
  }
});

// ------------------------------
// Comando hack (easter egg)
// ------------------------------
registerCommand({
  name: 'hack',
  description: '¡Hackear la NASA! (easter egg)',
  execute() {
    return {
      type: 'text',
      content: `Iniciando protocolo de hackeo...
████████████████████████████████████████████████
¡Acceso denegado!
...
...
...
Nah, es broma. ¡Tu portfolio es seguro! 😜`
    };
  }
});

// ------------------------------
// Comando resume (ASCII CV)
// ------------------------------
registerCommand({
  name: 'resume',
  description: 'Muestra tu CV en formato ASCII',
  execute(_args, ctx) {
    const langProfile = ctx.lang === 'es' ? profile.es : profile.en;
    const name = 'Matias Angeluk';
    const separator = '================================================';
    
    const experienceText = langProfile.experience.slice(0, 3).map(exp => 
      `${exp.company} - ${exp.role} (${exp.from}–${exp.to})\n  ${exp.description.substring(0, 100)}...`
    ).join('\n\n');

    const skillsText = langProfile.skills.slice(0, 4).map(cat => 
      `${cat.name}: ${cat.skills.slice(0, 4).join(', ')}`
    ).join('\n');

    return {
      type: 'text',
      content: `${separator}
   ${name}
${separator}
${ctx.lang === 'es' ? 'Desarrollador Full Stack' : 'Full Stack Developer'}
• ${langProfile.contact.filter(c => c.isUrl).map(c => c.value).join('\n• ')}

${ctx.lang === 'es' ? 'EXPERIENCIA' : 'EXPERIENCE'}
------------------
${experienceText}

${ctx.lang === 'es' ? 'SKILLS' : 'SKILLS'}
------------------
${skillsText}

${separator}
${ctx.lang === 'es' ? 'Para ver más, escribe "cv --experience" o "cv --skills"' : 'For more info, type "cv --experience" or "cv --skills"'}
${separator}`
    };
  }
});

// ------------------------------
// Comando todo (add/list/done)
// ------------------------------
// Estado para todo list (localStorage persistence)
const TODO_STORAGE_KEY = 'terminal-todos';
interface Todo {
  id: number;
  text: string;
  done: boolean;
}

registerCommand({
  name: 'todo',
  description: 'Todo list: todo add "texto", todo list, todo done #id',
  execute(args, ctx) {
    // Load todos from storage if available
    let todos: Todo[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(TODO_STORAGE_KEY);
        todos = stored ? JSON.parse(stored) : [];
      } catch { /* ignore */ }
    }

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'add') {
      const text = args.slice(1).join(' ');
      if (!text) {
        return {
          type: 'error',
          content: ctx.lang === 'es'
            ? 'Uso: todo add "texto del todo"'
            : 'Usage: todo add "todo text"'
        };
      }
      const newTodo: Todo = {
        id: Date.now(),
        text,
        done: false
      };
      todos.push(newTodo);
      if (typeof window !== 'undefined') {
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
      }
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? 'Todo agregado!'
          : 'Todo added!'
      };
    }

    if (subcommand === 'list') {
      if (todos.length === 0) {
        return {
          type: 'text',
          content: ctx.lang === 'es'
            ? 'No hay todos! Usa todo add para agregar uno'
            : 'No todos yet! Use todo add to add one'
        };
      }
      const lines = todos.map(t =>
        `${t.done ? '[X]' : '[ ]'} #${t.id} ${t.text}`
      ).join('\n');
      return { type: 'text', content: lines };
    }

    if (subcommand === 'done') {
      const idStr = args[1];
      if (!idStr) {
        return {
          type: 'error',
          content: ctx.lang === 'es'
            ? 'Uso: todo done #id'
            : 'Usage: todo done #id'
        };
      }
      const id = parseInt(idStr.replace('#', ''), 10);
      const todo = todos.find(t => t.id === id);
      if (!todo) {
        return {
          type: 'error',
          content: ctx.lang === 'es'
            ? 'No se encontró ese todo'
            : 'Todo not found'
        };
      }
      todo.done = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
      }
      return {
        type: 'text',
        content: ctx.lang === 'es'
          ? 'Todo marcado como hecho!'
          : 'Todo marked as done!'
      };
    }

    // Default: show help
    return {
      type: 'text',
      content: ctx.lang === 'es'
        ? `Uso: todo <comando>
  todo add "texto" - Agregar un todo
  todo list - Listar todos
  todo done #id - Marcar un todo como hecho`
        : `Usage: todo <command>
  todo add "text" - Add a todo
  todo list - List todos
  todo done #id - Mark a todo as done`
    };
  }
});

// ------------------------------
// Comando tictactoe (Juego de Triqui)
// ------------------------------
const TicTacToeComponent = ({ lang }: { lang: 'es' | 'en' }) => {
  const [board, setBoard] = useState(['', '', '', '', '', '', '', '', '']);
  const [isX, setIsX] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical
    [0, 4, 8], [2, 4, 6]             // diagonal
  ];

  const checkWinner = (currentBoard: string[]) => {
    for (const [a, b, c] of winningLines) {
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return currentBoard[a];
      }
    }
    if (currentBoard.every(cell => cell !== '')) return 'draw';
    return null;
  };

  const handleClick = (index: number) => {
    if (board[index] !== '' || winner) return;
    const newBoard = [...board];
    newBoard[index] = isX ? 'X' : 'O';
    setBoard(newBoard);
    setIsX(!isX);
    setWinner(checkWinner(newBoard));
  };

  const resetGame = () => {
    setBoard(['', '', '', '', '', '', '', '', '']);
    setIsX(true);
    setWinner(null);
  };

  const renderCell = (index: number) => (
    <button
      key={index}
      onClick={() => handleClick(index)}
      style={{
        width: '60px',
        height: '60px',
        fontSize: '32px',
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        color: 'var(--text-primary)',
        border: '2px solid var(--text-secondary)',
        cursor: 'pointer'
      }}
    >
      {board[index]}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 60px)', gap: '4px', marginBottom: '16px' }}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(renderCell)}
      </div>
      <div style={{ marginBottom: '8px' }}>
        {winner ? (
          <span style={{ fontWeight: 'bold' }}>
            {winner === 'draw'
              ? (lang === 'es' ? '¡Empate!' : 'Draw!')
              : (lang === 'es' ? `¡Gana ${winner}!` : `Winner: ${winner}!`)}
          </span>
        ) : (
          <span>
            {lang === 'es' ? `Turno de: ${isX ? 'X' : 'O'}` : `Turn: ${isX ? 'X' : 'O'}`}
          </span>
        )}
      </div>
      <button
        onClick={resetGame}
        style={{
          padding: '6px 12px',
          fontFamily: 'inherit',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--text-secondary)',
          cursor: 'pointer'
        }}
      >
        {lang === 'es' ? 'Reiniciar' : 'Reset'}
      </button>
    </div>
  );
};

registerCommand({
  name: 'tictactoe',
  description: 'Juega Triqui/Tic Tac Toe',
  execute(_args, ctx) {
    return { type: 'jsx', content: <TicTacToeComponent lang={ctx.lang} /> };
  }
});
