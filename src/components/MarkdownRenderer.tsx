'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm italic text-slate-400 dark:text-slate-500">
        Brak dodatkowej treści Markdown. Przełącz na zakładkę Edycja, aby dodać opis lub notatkę.
      </p>
    );
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${index}`}
            className="my-3 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800"
          >
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={index}
          className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={index}
          className="text-lg font-semibold text-slate-900 dark:text-white mt-3.5 mb-1.5"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={index}
          className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={index}
          className="border-l-4 border-indigo-500 pl-3 py-1 my-2 italic text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-r-lg"
        >
          {renderInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li
          key={index}
          className="ml-5 list-disc text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed"
        >
          {renderInline(line.slice(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const textPart = line.replace(/^\d+\.\s/, '');
      elements.push(
        <li
          key={index}
          className="ml-5 list-decimal text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed"
        >
          {renderInline(textPart)}
        </li>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={index} className="h-2" />);
    } else {
      elements.push(
        <p key={index} className="text-sm text-slate-700 dark:text-slate-300 my-1.5 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}
