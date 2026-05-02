import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = '', ...props }: InputProps) {
  const inputId = id || label.replace(/\s+/g, '-').toLowerCase();
  
  return (
    <div className="input-group">
      <label htmlFor={inputId}>{label}</label>
      <input 
        id={inputId}
        className={`input ${className}`.trim()} 
        {...props} 
      />
    </div>
  );
}
