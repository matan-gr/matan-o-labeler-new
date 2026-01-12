
import React from 'react';

export const MarkdownView = ({ content }: { content: string }) => {
  if (!content) return null;
  
  // Basic parsing for headers, bullets, bold
  const lines = content.split('\n');
  return (
    <div className="text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">{line.replace('## ', '')}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4">{line.replace('# ', '')}</h2>;
        if (line.startsWith('- ') || line.startsWith('* ')) {
             const text = line.replace(/^[-*] /, '');
             // Handle bolding in list items
             const parts = text.split(/\*\*(.*?)\*\*/g);
             return (
               <li key={i} className="ml-4 list-disc marker:text-blue-500 pl-1">
                 {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-blue-700 dark:text-blue-200 font-semibold">{part}</strong> : part)}
               </li>
             );
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        
        // Handle bolding in paragraphs
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return <p key={i}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-slate-900 dark:text-white font-semibold">{part}</strong> : part)}</p>;
      })}
    </div>
  );
};
