import React from 'react';

interface CalendarMiniProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  taskDates: string[]; // YYYY-MM-DD
}

export const CalendarMini: React.FC<CalendarMiniProps> = ({
  selectedDate,
  onSelectDate,
  taskDates,
}) => {
  // Generate 7 days around selectedDate (today + next 6 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  return (
    <div className="p-3.5 rounded-2xl bg-surface border border-surface-muted shadow-sm space-y-2">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold text-text-main">ตารางสัปดาห์นี้</h3>
        <span className="text-[10px] text-text-muted">
          {new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(selectedDate)}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, index) => {
          const isSelected = isSameDay(d, selectedDate);
          const dateIso = d.toISOString().slice(0, 10);
          const hasTask = taskDates.includes(dateIso);

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center gap-1 transition ${
                isSelected
                  ? 'bg-brand-primary text-white font-bold'
                  : 'hover:bg-surface-subtle text-text-main'
              }`}
            >
              <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-text-muted'}`}>
                {dayNames[d.getDay()]}
              </span>
              <span className="text-xs font-bold">{d.getDate()}</span>
              {hasTask && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-brand-primary'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
