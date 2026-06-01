'use client';
import { useState, useRef } from 'react';

interface Props {
  users: Array<{ id: number; username: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function PlayerCombobox({ users, value, onChange, placeholder, required, className }: Props) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = value.trim()
    ? users.filter(u => u.username.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  const base = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors text-sm';

  return (
    <div className="relative">
      <input
        type="text" value={value} autoComplete="off"
        onChange={e => onChange(e.target.value)}
        onFocus={() => { if (timer.current) clearTimeout(timer.current); setOpen(true); }}
        onBlur={() => { timer.current = setTimeout(() => setOpen(false), 150); }}
        placeholder={placeholder} required={required}
        className={className ?? base}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
          {filtered.map(u => (
            <li key={u.id} onMouseDown={() => { onChange(u.username); setOpen(false); }}
              className="px-3 py-2 text-sm text-white hover:bg-slate-700 cursor-pointer transition-colors">
              {u.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
