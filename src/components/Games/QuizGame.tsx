'use client';

import React, { useState, useCallback } from 'react';

interface Question {
  question: string;
  options: string[];
  correct: number;
}

const QUESTIONS_ES: Question[] = [
  {
    question: '¿Cuántos años de experiencia tiene Matias en desarrollo?',
    options: ['5 años', '8+ años', '12 años', '3 años'],
    correct: 1,
  },
  {
    question: '¿Cuál es el framework principal que usa Matias para el backend?',
    options: ['Django', 'Ruby on Rails', 'Laravel', 'Spring Boot'],
    correct: 2,
  },
  {
    question: '¿En qué empresa trabaja actualmente Matias?',
    options: ['Google', 'Libgot', 'Meta', 'Microsoft'],
    correct: 1,
  },
  {
    question: '¿Qué juegos ha desarrollado Matias con Godot?',
    options: ['SlimeFlight y Randomath', 'Doom y Quake', 'Minecraft y Terraria', 'Pac-Man y Space Invaders'],
    correct: 0,
  },
  {
    question: '¿Cuál es la app offline-first que creó Matias?',
    options: ['Agendita', 'Notion', 'Todoist', 'Google Calendar'],
    correct: 0,
  },
  {
    question: '¿Qué lenguajes de backend domina Matias?',
    options: ['Java y C#', 'PHP, Node.js y Go', 'Python y Ruby', 'Swift y Kotlin'],
    correct: 1,
  },
  {
    question: '¿Qué herramientas de IA usa Matias?',
    options: ['ChatGPT y Bard', 'Claude, Kiro y Gemini', 'Copilot y DALL-E', 'Midjourney y Stable Diffusion'],
    correct: 1,
  },
  {
    question: '¿Qué framework de frontend usa Matias?',
    options: ['Angular y React', 'Vue.js y Next.js', 'Svelte y Remix', 'Ember y Backbone'],
    correct: 1,
  },
  {
    question: '¿Dónde estudió Matias?',
    options: ['MIT', 'Universidad de la Matanza', 'Stanford', 'Oxford'],
    correct: 1,
  },
  {
    question: '¿Qué tipo de portafolio es este?',
    options: ['Blog personal', 'Portfolio estilo terminal', 'Tienda online', 'Red social'],
    correct: 1,
  },
];

const QUESTIONS_EN: Question[] = [
  {
    question: 'How many years of experience does Matias have?',
    options: ['5 years', '8+ years', '12 years', '3 years'],
    correct: 1,
  },
  {
    question: 'What is Matias\'s main backend framework?',
    options: ['Django', 'Ruby on Rails', 'Laravel', 'Spring Boot'],
    correct: 2,
  },
  {
    question: 'Where does Matias currently work?',
    options: ['Google', 'Libgot', 'Meta', 'Microsoft'],
    correct: 1,
  },
  {
    question: 'Which games did Matias develop with Godot?',
    options: ['SlimeFlight & Randomath', 'Doom & Quake', 'Minecraft & Terraria', 'Pac-Man & Space Invaders'],
    correct: 0,
  },
  {
    question: 'What is the offline-first app Matias created?',
    options: ['Agendita', 'Notion', 'Todoist', 'Google Calendar'],
    correct: 0,
  },
  {
    question: 'Which backend languages does Matias master?',
    options: ['Java & C#', 'PHP, Node.js & Go', 'Python & Ruby', 'Swift & Kotlin'],
    correct: 1,
  },
  {
    question: 'Which AI tools does Matias use?',
    options: ['ChatGPT & Bard', 'Claude, Kiro & Gemini', 'Copilot & DALL-E', 'Midjourney & Stable Diffusion'],
    correct: 1,
  },
  {
    question: 'What frontend framework does Matias use?',
    options: ['Angular & React', 'Vue.js & Next.js', 'Svelte & Remix', 'Ember & Backbone'],
    correct: 1,
  },
  {
    question: 'Where did Matias study?',
    options: ['MIT', 'Universidad de la Matanza', 'Stanford', 'Oxford'],
    correct: 1,
  },
  {
    question: 'What kind of portfolio is this?',
    options: ['Personal blog', 'Terminal-style portfolio', 'Online store', 'Social network'],
    correct: 1,
  },
];

export default function QuizGame({ lang }: { lang: 'es' | 'en' }) {
  const questions = lang === 'es' ? QUESTIONS_ES : QUESTIONS_EN;
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleAnswer = useCallback((index: number) => {
    if (selected !== null) return;
    setSelected(index);
    setShowResult(true);
    if (index === questions[currentQ].correct) {
      setScore((s) => s + 1);
    }
  }, [selected, currentQ, questions]);

  const nextQuestion = useCallback(() => {
    if (currentQ + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowResult(false);
    }
  }, [currentQ, questions.length]);

  const resetQuiz = useCallback(() => {
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setFinished(false);
  }, []);

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="game-container quiz-container">
        <div className="quiz-result">
          <div className="quiz-result-emoji">
            {percentage >= 80 ? '🏆' : percentage >= 60 ? '🎯' : percentage >= 40 ? '📚' : '💪'}
          </div>
          <div className="quiz-result-title">
            {lang === 'es' ? '¡Quiz Completado!' : 'Quiz Completed!'}
          </div>
          <div className="quiz-result-score">
            {score}/{questions.length} ({percentage}%)
          </div>
          <div className="quiz-result-message">
            {percentage >= 80
              ? (lang === 'es' ? '¡Excelente! Conoces muy bien a Matias.' : 'Excellent! You know Matias very well.')
              : percentage >= 60
              ? (lang === 'es' ? '¡Buen trabajo! Casi lo tienes.' : 'Good job! Almost there.')
              : (lang === 'es' ? 'Sigue aprendiendo sobre el perfil.' : 'Keep learning about the profile.')}
          </div>
          <button className="game-btn quiz-btn" onClick={resetQuiz}>
            {lang === 'es' ? 'Jugar de nuevo' : 'Play again'}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="game-container quiz-container">
      <div className="quiz-header">
        <span className="quiz-progress">
          {lang === 'es' ? 'Pregunta' : 'Question'} {currentQ + 1}/{questions.length}
        </span>
        <span className="quiz-score">
          {lang === 'es' ? 'Puntos' : 'Score'}: {score}
        </span>
      </div>

      <div className="quiz-question">{q.question}</div>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          let className = 'quiz-option';
          if (showResult) {
            if (i === q.correct) className += ' quiz-option--correct';
            else if (i === selected) className += ' quiz-option--wrong';
          }
          return (
            <button
              key={i}
              className={className}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="quiz-actions">
          <button className="game-btn quiz-btn" onClick={nextQuestion}>
            {currentQ + 1 >= questions.length
              ? (lang === 'es' ? 'Ver resultados' : 'See results')
              : (lang === 'es' ? 'Siguiente' : 'Next')}
          </button>
        </div>
      )}
    </div>
  );
}
