# AGENTS.md — Terminal Portfolio en GitHub Pages

## Visión General del Proyecto

Portfolio profesional interactivo con forma de terminal de comandos, deployado en GitHub Pages. El usuario puede tipear comandos para explorar información profesional (experiencia, proyectos, skills, contacto, etc.) y también interactuar con una IA integrada directamente desde la terminal. Diseñado mobile-first y con soporte completo para desktop.

---

## Stack Tecnológico

### Framework
- **Next.js** con output en modo **Static Export** (`output: 'export'` en `next.config.js`)
- Esto permite generar un sitio completamente estático (HTML/CSS/JS) compatible con GitHub Pages
- **No se puede usar ninguna feature de servidor** (API Routes, SSR, middleware): todo debe ser client-side o con llamadas directas a APIs externas

### Deploy
- **GitHub Pages** via rama `gh-pages` o carpeta `/docs`
- CI/CD con **GitHub Actions**: al hacer push a `main`, se ejecuta `next build` y se sube el output de `/out` a GitHub Pages automáticamente
- Dominio: `username.github.io` o `username.github.io/repo-name`

### IA Gratuita
Usar **Google Gemini API** (tier gratuito generoso):
- Modelo: `gemini-1.5-flash` o `gemini-2.0-flash`
- La API key se expone en el cliente (es pública e intencionada para este tipo de proyectos frontend), pero se debe restringir por dominio desde Google Cloud Console
- Alternativa secundaria: **OpenRouter** con modelos gratuitos como `mistralai/mistral-7b-instruct:free`

### UI y Estilos
- **Tailwind CSS** para utilidades responsivas
- Fuente monoespaciada: `JetBrains Mono` o `Fira Code` via Google Fonts
- Imagen de fondo con overlay oscuro semitransparente para legibilidad
- Animaciones CSS puras para el cursor parpadeante y el efecto typewriter

---

## Estructura del Proyecto

```
/
├── public/
│   ├── bg.jpg                  # Imagen de fondo de la terminal
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Metadata, fonts
│   │   └── page.tsx            # Entry point → renderiza <Terminal />
│   ├── components/
│   │   ├── Terminal/
│   │   │   ├── Terminal.tsx    # Componente principal, maneja historia y scroll
│   │   │   ├── InputLine.tsx   # Línea de input con cursor animado
│   │   │   ├── OutputLine.tsx  # Render de outputs (texto, links, ASCII art)
│   │   │   └── WelcomeBanner.tsx # ASCII art + mensaje de bienvenida
│   │   └── MobileKeyboard.tsx  # Botones de comandos rápidos en mobile
│   ├── lib/
│   │   ├── commands/
│   │   │   ├── index.ts        # Registry de todos los comandos
│   │   │   ├── about.ts
│   │   │   ├── experience.ts
│   │   │   ├── projects.ts
│   │   │   ├── skills.ts
│   │   │   ├── contact.ts
│   │   │   └── ai.ts           # Comando `ask` → llama a Gemini
│   │   └── gemini.ts           # Cliente de Gemini API
│   ├── data/
│   │   └── profile.ts          # Toda la info profesional centralizada aquí
│   └── types/
│       └── terminal.ts         # Types: Command, HistoryEntry, OutputType
├── next.config.js              # output: 'export', basePath si es subdominio
├── tailwind.config.ts
└── .github/
    └── workflows/
        └── deploy.yml          # GitHub Actions para auto-deploy
```

---

## Comandos de la Terminal

### Comandos Base (obligatorios)

| Comando | Descripción |
|---|---|
| `help` | Lista todos los comandos disponibles |
| `about` | Descripción profesional / bio |
| `experience` | Historial laboral (empresa, rol, fechas, descripción) |
| `projects` | Proyectos destacados con links |
| `skills` | Stack técnico organizado por categorías |
| `contact` | Email, LinkedIn, GitHub, etc. |
| `clear` | Limpia la terminal |
| `banner` | Muestra el ASCII art de bienvenida |

### Comandos Extra (diferenciadores)

| Comando | Descripción |
|---|---|
| `ask <pregunta>` | Chatea con la IA sobre tu perfil profesional |
| `theme <dark\|light\|matrix>` | Cambia el tema visual |
| `lang <es\|en>` | Cambia el idioma del contenido |
| `download cv` | Descarga el CV en PDF |
| `social` | Muestra links a redes con iconos ASCII |
| `whoami` | One-liner profesional (easter egg estilo unix) |

---

## Integración con IA (Gemini)

```typescript
// src/lib/gemini.ts
const SYSTEM_PROMPT = `
Sos un asistente que representa el portfolio profesional de [NOMBRE].
Solo respondés preguntas relacionadas con su perfil profesional.
Respondés de forma concisa (máximo 3 párrafos).
Si te preguntan algo no relacionado, redirigís amablemente al perfil.

Información del perfil:
[Aquí va el contenido de profile.ts serializado]
`;

export async function askGemini(userMessage: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }]
      })
    }
  );
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

La API key de Gemini se guarda en `.env.local` como `NEXT_PUBLIC_GEMINI_KEY` y se restringe a tu dominio desde Google Cloud Console para evitar abusos.

---

## Diseño Visual

### Fondo
- Imagen de fondo (`public/bg.jpg`) con `background-size: cover` y `background-position: center`
- Overlay con `rgba(0, 0, 0, 0.75)` para asegurar legibilidad del texto
- La imagen NO debe tener elementos distractores o texto

### Paleta de colores (tema dark por defecto)
```css
--bg-terminal: rgba(10, 10, 10, 0.85)   /* Fondo del panel terminal */
--text-primary: #00ff9f                  /* Verde terminal (outputs normales) */
--text-secondary: #888                   /* Texto dimmed (prompt, paths) */
--text-error: #ff5555                    /* Errores */
--text-warning: #ffb86c                  /* Advertencias / highlights */
--text-input: #f8f8f2                    /* Lo que escribe el usuario */
--cursor: #00ff9f                        /* Color del cursor parpadeante */
```

### Layout Responsivo

**Desktop (≥ 768px):**
- Terminal centrada con max-width ~900px, height ~80vh
- Overflow interno con scroll
- Input siempre visible al fondo

**Mobile (< 768px):**
- Terminal ocupa 100% del viewport height
- Teclado virtual respetado con `dvh` units (`height: 100dvh`)
- Botones de comandos rápidos fijos arriba del teclado (tipo shortcuts):
  `[help]` `[about]` `[projects]` `[contact]` `[clear]`
- Font size mínimo 14px para evitar zoom automático de iOS
- El input hace `focus()` automático al tocar la pantalla

---

## GitHub Actions — Deploy Automático

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_GEMINI_KEY: ${{ secrets.GEMINI_KEY }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./out
```

La API key se guarda como **secret** en el repositorio (`Settings → Secrets → GEMINI_KEY`).

---

## Configuración de Next.js para GitHub Pages

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  // Si el repo es username/portfolio (no username.github.io):
  basePath: '/nombre-del-repo',
  assetPrefix: '/nombre-del-repo/',
  images: {
    unoptimized: true  // Requerido para static export
  }
};

module.exports = nextConfig;
```

---

## Consideraciones y Restricciones

- **Sin API Routes**: todo es client-side. Las llamadas a Gemini van directo desde el browser.
- **Sin base de datos**: toda la info del perfil vive en `src/data/profile.ts`.
- **Sin autenticación**: el sitio es completamente público y estático.
- **Performance**: el bundle final debe ser liviano. Evitar librerías pesadas. Usar `next/font` para fuentes.
- **SEO**: aunque es una SPA estática, agregar metadata correcta en `layout.tsx` para que sea indexable.
- **Accesibilidad**: el input de la terminal debe tener `aria-label`. Los outputs deben ser anunciados por screen readers usando `aria-live="polite"`.

---

## Orden de Desarrollo Sugerido

1. Setup del proyecto Next.js + Tailwind + config de static export
2. GitHub Actions y primer deploy vacío (validar que el pipeline funciona)
3. Componente `Terminal` base: input, historia, scroll automático
4. Sistema de comandos: `help`, `about`, `clear`
5. Completar todos los comandos con datos reales del perfil
6. Imagen de fondo + estilos visuales
7. Integración con Gemini (`ask`)
8. Responsive mobile: layout + botones de comandos rápidos
9. Pulido final: animaciones, temas, easter eggs