'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: string;
  onSelect: (date: string) => void;
  minDate?: string;
  blockedDates?: string[];
}

export const Calendar: React.FC<CalendarProps> = ({ 
  selectedDate, 
  onSelect, 
  minDate,
  blockedDates = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [focusedDate, setFocusedDate] = useState<number | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    
    if (focusedDate === null) {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setFocusedDate(1);
      }
      return;
    }

    let nextFocus = focusedDate;

    switch (e.key) {
      case 'ArrowRight':
        nextFocus = Math.min(totalDays, focusedDate + 1);
        break;
      case 'ArrowLeft':
        nextFocus = Math.max(1, focusedDate - 1);
        break;
      case 'ArrowDown':
        nextFocus = Math.min(totalDays, focusedDate + 7);
        break;
      case 'ArrowUp':
        nextFocus = Math.max(1, focusedDate - 7);
        break;
      case 'Enter':
      case ' ':
        const date = new Date(year, month, focusedDate);
        const dateString = date.toISOString().split('T')[0];
        const isPast = date < (minDate ? new Date(minDate) : new Date());
        const isBlocked = blockedDates.includes(dateString);
        if (!isPast && !isBlocked) {
          onSelect(dateString);
        }
        e.preventDefault();
        return;
      default:
        return;
    }

    setFocusedDate(nextFocus);
    e.preventDefault();
  };

  const renderDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Fill in empty slots for the start of the month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" role="gridcell"></div>);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const min = minDate ? new Date(minDate) : today;
    min.setHours(0, 0, 0, 0);

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      const dateString = date.toISOString().split('T')[0];
      const isSelected = selectedDate === dateString;
      const isPast = date < min;
      const isBlocked = blockedDates.includes(dateString);
      const isFocused = focusedDate === day;

      days.push(
        <button
          key={day}
          type="button"
          disabled={isPast || isBlocked}
          role="gridcell"
          aria-label={`${day} ${monthNames[month]} ${year}${isBlocked ? ' (Blocked)' : ''}`}
          aria-selected={isSelected}
          aria-disabled={isPast || isBlocked}
          tabIndex={isSelected || (focusedDate === null && day === 1) || isFocused ? 0 : -1}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isPast || isBlocked ? 'disabled' : ''} ${isFocused ? 'focused' : ''}`}
          onClick={() => !isPast && !isBlocked && onSelect(dateString)}
          onFocus={() => setFocusedDate(day)}
        >
          {day}
          {isBlocked && <span className="blocked-indicator" aria-hidden="true" />}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div 
      className="calendar-container glass-panel" 
      ref={calendarRef}
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label="Booking Calendar"
    >
      <div className="calendar-header">
        <button 
          type="button" 
          onClick={handlePrevMonth} 
          className="calendar-nav-btn"
          aria-label="Previous Month"
        >
          <ChevronLeft size={18} />
        </button>
        <div 
          className="calendar-month-year"
          aria-live="polite"
          role="status"
        >
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button 
          type="button" 
          onClick={handleNextMonth} 
          className="calendar-nav-btn"
          aria-label="Next Month"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-grid" role="row">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="calendar-weekday" role="columnheader" aria-label={day}>
            {day}
          </div>
        ))}
        {renderDays()}
      </div>
      
      <style jsx>{`
        .calendar-container {
          padding: 1.5rem;
          width: 100%;
          max-width: 320px;
          background: rgba(23, 25, 35, 0.4);
          outline: none;
        }
        .calendar-container:focus-within {
          box-shadow: 0 0 0 2px var(--primary-color);
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .calendar-nav-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-main);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .calendar-nav-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .calendar-month-year {
          font-weight: 700;
          font-size: 1rem;
          color: var(--text-main);
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          padding-bottom: 0.5rem;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 0.85rem;
          background: transparent;
          border: 2px solid transparent;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }
        .calendar-day:not(.disabled):hover {
          background: rgba(var(--primary-color-rgb), 0.2);
          color: var(--primary-color);
        }
        .calendar-day.selected {
          background: var(--primary-color);
          color: white;
          font-weight: bold;
          box-shadow: 0 0 15px rgba(var(--primary-color-rgb), 0.4);
        }
        .calendar-day.focused {
          border-color: var(--primary-color);
        }
        .calendar-day.disabled {
          color: rgba(255, 255, 255, 0.1);
          cursor: not-allowed;
        }
        .calendar-day.disabled:not(.empty) {
          text-decoration: line-through;
        }
        .blocked-indicator {
          position: absolute;
          bottom: 4px;
          width: 4px;
          height: 4px;
          background: var(--error-color);
          border-radius: 50%;
        }
        .calendar-day.empty {
          cursor: default;
        }
      `}</style>
    </div>
  );
};
