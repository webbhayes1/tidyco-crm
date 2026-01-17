'use client';

import { useState, useEffect } from 'react';

// Hours 1-12
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

// Minutes in 15-minute intervals
const MINUTES = ['00', '15', '30', '45'];

// AM/PM
const PERIODS = ['AM', 'PM'];

// Parse a time string into components
function parseTime(time: string): { hour: string; minute: string; period: string } {
  if (!time) {
    return { hour: '', minute: '', period: '' };
  }

  // Handle 24h format (HH:mm)
  if (!time.includes('AM') && !time.includes('PM')) {
    const [hourStr, minute] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;

    return {
      hour: hour.toString(),
      minute: minute || '00',
      period,
    };
  }

  // Handle 12h format (H:mm AM/PM)
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return { hour: '', minute: '', period: '' };
  }

  return {
    hour: match[1],
    minute: match[2],
    period: match[3].toUpperCase(),
  };
}

// Format components into a time string
function formatTime(
  hour: string,
  minute: string,
  period: string,
  format: '12h' | '24h'
): string {
  if (!hour || !minute || !period) return '';

  if (format === '12h') {
    return `${hour}:${minute} ${period}`;
  }

  // Convert to 24h
  let h = parseInt(hour, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;

  return `${h.toString().padStart(2, '0')}:${minute}`;
}

// Add hours to a time string (24h format)
export function addHoursToTime(time24h: string, hours: number): string {
  if (!time24h) return '';

  const [hourStr, minute] = time24h.split(':');
  let hour = parseInt(hourStr, 10) + hours;

  // Cap at reasonable bounds
  if (hour > 20) hour = 20;
  if (hour < 6) hour = 6;

  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

// Convert between 12h and 24h formats
export function convertTo24h(time12h: string): string {
  if (!time12h || (time12h.includes(':') && !time12h.includes(' '))) {
    return time12h; // Already in 24h format or empty
  }

  const { hour, minute, period } = parseTime(time12h);
  if (!hour) return time12h;

  return formatTime(hour, minute, period, '24h');
}

export function convertTo12h(time24h: string): string {
  if (!time24h || time24h.includes('AM') || time24h.includes('PM')) {
    return time24h; // Already in 12h format or empty
  }

  const { hour, minute, period } = parseTime(time24h);
  if (!hour) return time24h;

  return formatTime(hour, minute, period, '12h');
}

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  format?: '12h' | '24h';
  required?: boolean;
  className?: string;
}

export function TimeSelect({
  value,
  onChange,
  format = '24h',
  required = false,
  className = '',
}: TimeSelectProps) {
  // Track internal state for partial selections
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [period, setPeriod] = useState('');

  // Sync internal state when value prop changes (e.g., from auto-update)
  useEffect(() => {
    const parsed = parseTime(value);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
  }, [value]);

  const handleHourChange = (newHour: string) => {
    setHour(newHour);
    // If all parts filled, emit
    if (newHour && minute && period) {
      onChange(formatTime(newHour, minute, period, format));
    }
  };

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute);
    // If all parts filled, emit
    if (hour && newMinute && period) {
      onChange(formatTime(hour, newMinute, period, format));
    }
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
    // If all parts filled, emit
    if (hour && minute && newPeriod) {
      onChange(formatTime(hour, minute, newPeriod, format));
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Hour */}
      <select
        value={hour}
        onChange={(e) => handleHourChange(e.target.value)}
        required={required}
        className="px-2 py-2 border border-gray-300 rounded-lg bg-white text-center appearance-none cursor-pointer min-w-[60px]"
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="text-gray-500 font-medium">:</span>

      {/* Minute */}
      <select
        value={minute}
        onChange={(e) => handleMinuteChange(e.target.value)}
        required={required}
        className="px-2 py-2 border border-gray-300 rounded-lg bg-white text-center appearance-none cursor-pointer min-w-[60px]"
      >
        <option value="">--</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* AM/PM */}
      <select
        value={period}
        onChange={(e) => handlePeriodChange(e.target.value)}
        required={required}
        className="px-2 py-2 border border-gray-300 rounded-lg bg-white text-center appearance-none cursor-pointer min-w-[60px]"
      >
        <option value="">--</option>
        {PERIODS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}

// Generate time options in 15-minute intervals (for backwards compatibility)
function generateTimeOptions(format: '12h' | '24h' = '12h'): string[] {
  const options: string[] = [];

  for (let hour = 6; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (format === '24h') {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        options.push(`${h}:${m}`);
      } else {
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        const m = minute.toString().padStart(2, '0');
        options.push(`${displayHour}:${m} ${period}`);
      }
    }
  }

  return options;
}

// Export the time options generators for use in other components
export const TIME_OPTIONS_15MIN_12H = generateTimeOptions('12h');
export const TIME_OPTIONS_15MIN_24H = generateTimeOptions('24h');
