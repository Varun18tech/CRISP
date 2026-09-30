"use client";

import React from "react";

interface FormattedChatMessageProps {
  content: string;
}

export function FormattedChatMessage({ content }: FormattedChatMessageProps) {
  // Split lines to handle headings, lists, blockquotes, tables, and paragraphs
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let tableBuffer: string[] = [];
  let inTable = false;

  const flushTable = (index: number) => {
    if (tableBuffer.length < 2) {
      tableBuffer.forEach((line, i) => {
        elements.push(<p key={`tbl-fallback-${index}-${i}`} className="text-xs text-slate-300 leading-relaxed">{renderInline(line)}</p>);
      });
      tableBuffer = [];
      inTable = false;
      return;
    }

    const headerRow = tableBuffer[0].split("|").filter((c) => c.trim() !== "");
    const bodyRows = tableBuffer.slice(2).map((r) => r.split("|").filter((c) => c.trim() !== ""));

    elements.push(
      <div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60">
              {headerRow.map((cell, ci) => (
                <th key={`th-${ci}`} className="px-3 py-2 font-semibold text-slate-300 text-[11px] whitespace-nowrap">
                  {renderInline(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {bodyRows.map((row, ri) => (
              <tr key={`tr-${ri}`} className="hover:bg-slate-900/40 transition-colors">
                {row.map((cell, ci) => (
                  <td key={`td-${ri}-${ci}`} className="px-3 py-2 text-slate-300 text-xs">
                    {renderInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    tableBuffer = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Table detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableBuffer.push(trimmed);
      return;
    } else if (inTable) {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={`empty-${idx}`} className="h-2" />);
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${idx}`} className="text-sm font-bold text-slate-100 mt-2 mb-1 flex items-center gap-1.5">
          {renderInline(trimmed.replace("### ", ""))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h4 key={`h4-${idx}`} className="text-xs font-semibold text-blue-300 mt-2 mb-1">
          {renderInline(trimmed.replace("#### ", ""))}
        </h4>
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={`quote-${idx}`} className="my-2 pl-3 py-1 border-l-2 border-blue-500 bg-blue-950/20 rounded-r-lg text-xs text-blue-200">
          {renderInline(trimmed.replace("> ", ""))}
        </blockquote>
      );
      return;
    }

    // Bullet lists
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 text-xs text-slate-300 my-0.5 pl-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
          <span>{renderInline(trimmed.substring(2))}</span>
        </div>
      );
      return;
    }

    // Numbered lists
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`oli-${idx}`} className="flex items-start gap-2 text-xs text-slate-300 my-0.5 pl-1">
          <span className="font-semibold text-blue-400 shrink-0 text-[11px]">{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-xs text-slate-300 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    );
  });

  if (inTable) {
    flushTable(lines.length);
  }

  return <div className="space-y-1 text-slate-200">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Replace bold **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px] text-indigo-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <span key={i} className="font-mono text-cyan-300 px-1 font-semibold text-[11px]">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
