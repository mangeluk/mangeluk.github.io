// src/data/profile.ts
// Single source of truth for all professional profile content.
// Requirements: 20.1, 20.3, 3.1, 4.1, 5.1, 6.1, 7.1, 10.1, 11.1, 12.1

export interface WorkEntry {
  company: string;
  role: string;
  from: string;   // YYYY
  to: string;     // YYYY | 'presente' | 'present'
  description: string;
}

export interface Project {
  name: string;
  description: string;
  url: string;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export interface ContactChannel {
  label: string;
  value: string;   // URL or email
  isUrl: boolean;
}

export interface SocialLink {
  name: string;
  icon: string;   // ASCII char(s), e.g. "[@]", "[gh]"
  url: string;
}

export interface LangProfile {
  bio: string;
  whoami: string;       // max 160 chars, no newlines
  experience: WorkEntry[];
  projects: Project[];
  skills: SkillCategory[];
  contact: ContactChannel[];
  social: SocialLink[];
  cvUrl: string;        // URL to PDF in /public or external; '' if unavailable
}

export interface ProfileData {
  es: LangProfile;
  en: LangProfile;
}

export const profile: ProfileData = {
  es: {
    bio: `Soy Matias Angeluk, desarrollador Full Stack con más de 8 años de experiencia construyendo aplicaciones web escalables. Me interesa especialmente el backend, donde trabajo con PHP (Laravel/Symfony), Node.js y Go, aunque también hago frontend con Vue.js.

Actualmente lidero equipos técnicos, diseño arquitecturas de sistemas e implemento soluciones de IA (Claude, Kiro, Gemini) para optimizar flujos de trabajo. Trabajo cómodamente tanto en el lado cliente como en el servidor, y disfruto llevar proyectos desde la idea hasta la producción.`,

    // max 160 chars, no newlines
    whoami: 'Matias Angeluk · Full Stack · PHP/Laravel/Node/Go Backend · Vue Frontend · IA (Claude/Kiro/Gemini) · Apasionado por el código limpio.',

    experience: [
      {
        company: 'Libgot',
        role: 'Líder de Ingeniería Backend',
        from: '2026',
        to: 'presente',
        description: 'Liderazgo técnico, mentoría y revisión de código para un equipo de desarrolladores backend. Diseño y optimización de servicios, bases de datos y APIs escalables. Implementación de IA para productos y flujos de trabajo (Claude, Kiro, Gemini). Programación activa de módulos complejos, refactorización y aseguramiento de buenas prácticas.',
      },
      {
        company: 'Libgot',
        role: 'Full Stack Developer',
        from: '2024',
        to: 'presente',
        description: 'Diseño, desarrollo y corrección de funcionalidades asegurando la estabilidad del sistema. Implementación de tests unitarios y mantenimiento de documentación técnica. Tecnologías: Laravel, Node.js, Go, Vue.js, Electron, AWS, PostgreSQL, MySQL.',
      },
      {
        company: 'Bamboo (Freelance)',
        role: 'Full Stack Developer',
        from: '2023',
        to: '2024',
        description: 'Desarrollo de funcionalidades para eComEngine (Sistema de Pagos) en plataformas como Shopify, WooCommerce y X-cart. Tecnologías: Laravel, Vue.js, MySQL.',
      },
      {
        company: 'Aconcagua Software Spain',
        role: 'Full Stack Developer',
        from: '2023',
        to: '2023',
        description: 'Desarrollo de soluciones web con PHP y Laravel.',
      },
      {
        company: 'Geopagos',
        role: 'Backend Developer',
        from: '2023',
        to: '2023',
        description: 'Desarrollo en PHP con Symfony en el área de Retenciones. Tecnologías: Scrum, Docker, MySQL, GitLab, PHPUnit.',
      },
      {
        company: 'Grupo Digital',
        role: 'Backend Developer',
        from: '2021',
        to: '2023',
        description: 'Desarrollo en PHP con framework propio y Laravel. Metodologías ágiles (Scrum). Frontend con HTML, CSS, JS y Angular. Tecnologías: Git, Postman, Docker, PostgreSQL.',
      },
      {
        company: 'Del Plata Ingeniería S.A.',
        role: 'Analista de Sistemas / Desarrollador',
        from: '2016',
        to: '2021',
        description: 'Administración de sistemas, puesta en producción, testing, gestión de calidad y desarrollo de nuevos módulos. Desarrollo en PHP y scripting en bash. Bases de datos MySQL y MongoDB. Mantenimiento de servidores Linux (Debian/CentOS).',
      },
    ],

    projects: [
      {
        name: 'Terminal Portfolio',
        description: 'Portfolio interactivo con interfaz de terminal de comandos. Next.js static export, Tailwind CSS, integración con Google Gemini AI.',
        url: 'https://mangeluk.github.io',
      },
      {
        name: 'Agendita',
        description: 'App de agenda offline-first. Next.js (static export) + Godot 4 wrapper nativo para Android. Web↔Nativo bridge, notificaciones locales nativas (AlarmManager + BroadcastReceiver), permisos runtime, Tailwind CSS, localStorage, date-fns.',
        url: 'https://play.google.com/store/apps/details?id=com.agendita.app',
      },
      {
        name: 'Cuando Nos Juntamos',
        description: 'Organizador de encuestas grupales para fechas y horarios. Node.js + Express, Cloudflare Pages + Functions + D1, Turnstile CAPTCHA, mobile-first vanilla JS, Web Share API + WhatsApp deep link.',
        url: 'https://cuandonosjuntamos.pages.dev/',
      },
      {
        name: 'Randomath',
        description: 'Juego de matemáticas donde tienes que alcanzar el resultado correcto con botones que cambian constantemente. Desarrollado en Godot 4, disponible en Google Play.',
        url: 'https://play.google.com/store/apps/details?id=com.randomath.app',
      },
      {
        name: 'SlimeFlight',
        description: 'Juego de acción con 10 personajes, 3 dificultades y 24 logros. Desarrollado en Godot, publicado en 2016.',
        url: '',
      },
    ],

    skills: [
      {
        name: 'Backend',
        skills: ['PHP', 'Laravel', 'Symfony', 'Node.js', 'Express', 'Go', 'REST APIs'],
      },
      {
        name: 'Frontend & Desktop',
        skills: ['Vue.js', 'React', 'Next.js', 'Electron', 'HTML5', 'CSS3', 'JavaScript', 'Angular', 'Tailwind CSS'],
      },
      {
        name: 'Bases de Datos',
        skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Cloudflare D1', 'JSON'],
      },
      {
        name: 'Cloud & DevOps',
        skills: ['AWS', 'Argo', 'Docker', 'Git', 'GitLab', 'GitHub Pages', 'Cloudflare Pages'],
      },
      {
        name: 'IA & Herramientas',
        skills: ['LLMs', 'Claude Code', 'Kiro', 'Gemini', 'Scrum', 'Kanban'],
      },
      {
        name: 'Testing',
        skills: ['PHPUnit', 'Testing Unitario'],
      },
      {
        name: 'Sistemas Operativos',
        skills: ['Linux', 'Debian', 'CentOS', 'Bash', 'Android'],
      },
      {
        name: 'Game Development & Tools',
        skills: ['Godot 4', 'GDScript', 'Aseprite', 'Gradle', 'Android Studio'],
      },
      {
        name: 'Librerías',
        skills: ['date-fns', 'flatpickr', 'nanoid', 'undici', 'shadcn/ui', 'Radix UI'],
      },
    ],

    contact: [
      {
        label: 'Email',
        value: 'mailto:matias.angeluk@gmail.com',
        isUrl: true,
      },
      {
        label: 'LinkedIn',
        value: 'https://linkedin.com/in/matiasangeluk',
        isUrl: true,
      },
      {
        label: 'GitHub',
        value: 'https://github.com/Magamex',
        isUrl: true,
      },
    ],

    social: [
      {
        name: 'GitHub',
        icon: '[gh]',
        url: 'https://github.com/Magamex',
      },
      {
        name: 'LinkedIn',
        icon: '[in]',
        url: 'https://linkedin.com/in/matiasangeluk',
      },
    ],

    cvUrl: '/CV - Matias Angeluk.pdf',
  },

  en: {
    bio: `I'm Matias Angeluk, a Full Stack Developer with over 8 years of experience building scalable web applications. I'm especially interested in the backend, where I work with PHP (Laravel/Symfony), Node.js and Go, though I also do frontend with Vue.js.

I currently lead technical teams, design system architectures and implement AI solutions (Claude, Kiro, Gemini) to optimize workflows. I’m equally comfortable on the client and server side, and I enjoy taking projects from idea to production.`,

    // max 160 chars, no newlines
    whoami: 'Matias Angeluk · Full Stack · PHP/Laravel/Node/Go Backend · Vue Frontend · AI (Claude/Kiro/Gemini) · Passionate about clean code.',

    experience: [
      {
        company: 'Libgot',
        role: 'Backend Engineering Lead',
        from: '2026',
        to: 'present',
        description: 'Technical leadership, mentoring, and code reviews for a backend developer team. Design and optimization of services, databases and scalable APIs. AI implementation for products and workflows (Claude, Kiro, Gemini). Active development of complex modules, refactoring, and best practices.',
      },
      {
        company: 'Libgot',
        role: 'Full Stack Developer',
        from: '2024',
        to: 'present',
        description: 'Design, development, and feature fixes ensuring system stability. Unit tests implementation and technical documentation maintenance. Tech stack: Laravel, Node.js, Go, Vue.js, Electron, AWS, PostgreSQL, MySQL.',
      },
      {
        company: 'Bamboo (Freelance)',
        role: 'Full Stack Developer',
        from: '2023',
        to: '2024',
        description: 'Feature development for eComEngine (Payment System) on Shopify, WooCommerce and X-cart platforms. Tech stack: Laravel, Vue.js, MySQL.',
      },
      {
        company: 'Aconcagua Software Spain',
        role: 'Full Stack Developer',
        from: '2023',
        to: '2023',
        description: 'Web solution development with PHP and Laravel.',
      },
      {
        company: 'Geopagos',
        role: 'Backend Developer',
        from: '2023',
        to: '2023',
        description: 'PHP/Symfony development in the Withholding area. Tech stack: Scrum, Docker, MySQL, GitLab, PHPUnit.',
      },
      {
        company: 'Grupo Digital',
        role: 'Backend Developer',
        from: '2021',
        to: '2023',
        description: 'PHP development with proprietary framework and Laravel. Agile methodologies (Scrum). Frontend with HTML, CSS, JS and Angular. Tech stack: Git, Postman, Docker, PostgreSQL.',
      },
      {
        company: 'Del Plata Ingeniería S.A.',
        role: 'System Analyst / Developer',
        from: '2016',
        to: '2021',
        description: 'System administration, production deployment, testing, quality management and new module development. PHP development and bash scripting. MySQL and MongoDB databases. Linux server maintenance (Debian/CentOS).',
      },
    ],

    projects: [
      {
        name: 'Terminal Portfolio',
        description: 'Interactive portfolio with command-line terminal interface. Next.js static export, Tailwind CSS, Google Gemini AI integration.',
        url: 'https://mangeluk.github.io',
      },
      {
        name: 'Agendita',
        description: 'Offline-first agenda app. Next.js (static export) + native Godot 4 wrapper for Android. Web↔Native bridge, local native notifications (AlarmManager + BroadcastReceiver), runtime permissions, Tailwind CSS, localStorage, date-fns.',
        url: 'https://play.google.com/store/apps/details?id=com.agendita.app',
      },
      {
        name: 'Cuando Nos Juntamos',
        description: 'Group poll organizer for dates and times. Node.js + Express, Cloudflare Pages + Functions + D1, Turnstile CAPTCHA, mobile-first vanilla JS, Web Share API + WhatsApp deep link.',
        url: 'https://cuandonosjuntamos.pages.dev/',
      },
      {
        name: 'Randomath',
        description: 'Math game where you reach the correct result with constantly changing buttons. Developed in Godot 4, available on Google Play.',
        url: 'https://play.google.com/store/apps/details?id=com.randomath.app',
      },
      {
        name: 'SlimeFlight',
        description: 'Action game with 10 characters, 3 difficulties and 24 achievements. Developed in Godot, published in 2016.',
        url: '',
      },
    ],

    skills: [
      {
        name: 'Backend',
        skills: ['PHP', 'Laravel', 'Symfony', 'Node.js', 'Express', 'Go', 'REST APIs'],
      },
      {
        name: 'Frontend & Desktop',
        skills: ['Vue.js', 'React', 'Next.js', 'Electron', 'HTML5', 'CSS3', 'JavaScript', 'Angular', 'Tailwind CSS'],
      },
      {
        name: 'Databases',
        skills: ['PostgreSQL', 'MySQL', 'MongoDB', 'Cloudflare D1', 'JSON'],
      },
      {
        name: 'Cloud & DevOps',
        skills: ['AWS', 'Argo', 'Docker', 'Git', 'GitLab', 'GitHub Pages', 'Cloudflare Pages'],
      },
      {
        name: 'AI & Tools',
        skills: ['LLMs', 'Claude Code', 'Kiro', 'Gemini', 'Scrum', 'Kanban'],
      },
      {
        name: 'Testing',
        skills: ['PHPUnit', 'Unit Testing'],
      },
      {
        name: 'Operating Systems',
        skills: ['Linux', 'Debian', 'CentOS', 'Bash', 'Android'],
      },
      {
        name: 'Game Development & Tools',
        skills: ['Godot 4', 'GDScript', 'Aseprite', 'Gradle', 'Android Studio'],
      },
      {
        name: 'Libraries',
        skills: ['date-fns', 'flatpickr', 'nanoid', 'undici', 'shadcn/ui', 'Radix UI'],
      },
    ],

    contact: [
      {
        label: 'Email',
        value: 'mailto:matias.angeluk@gmail.com',
        isUrl: true,
      },
      {
        label: 'LinkedIn',
        value: 'https://linkedin.com/in/matiasangeluk',
        isUrl: true,
      },
      {
        label: 'GitHub',
        value: 'https://github.com/Magamex',
        isUrl: true,
      },
    ],

    social: [
      {
        name: 'GitHub',
        icon: '[gh]',
        url: 'https://github.com/Magamex',
      },
      {
        name: 'LinkedIn',
        icon: '[in]',
        url: 'https://linkedin.com/in/matiasangeluk',
      },
    ],

    cvUrl: '/CV - Matias Angeluk.pdf',
  },
};
