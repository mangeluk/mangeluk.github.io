'use client';

import React, { useState, useCallback, useEffect } from 'react';

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const DAYS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function CalendarApp({ lang = 'es' }: { lang?: string }) {
  const [now, setNow] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const months = lang === 'es' ? MONTHS_ES : MONTHS_EN;
  const days = lang === 'es' ? DAYS_ES : DAYS_EN;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const today = now.getDate();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  const handlePrevMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  return (
    <div className="cal-container">
      <div className="cal-clock">
        <div className="cal-time">{padZero(now.getHours())}:{padZero(now.getMinutes())}:{padZero(now.getSeconds())}</div>
        <div className="cal-date-full">{now.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={handlePrevMonth}>{'\u25C0'}</button>
        <span className="cal-month-year">{months[viewMonth]} {viewYear}</span>
        <button className="cal-nav-btn" onClick={handleNextMonth}>{'\u25B6'}</button>
      </div>

      <div className="cal-grid">
        {days.map((d) => (
          <div key={d} className="cal-day-header">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          const isToday = day === today && viewMonth === todayMonth && viewYear === todayYear;
          return (
            <div
              key={i}
              className={`cal-day ${day === null ? 'cal-day--empty' : ''} ${isToday ? 'cal-day--today' : ''}`}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}
