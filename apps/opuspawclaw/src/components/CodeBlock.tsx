import React, { useState } from 'react';
import { Check, Copy, Download, Terminal, TerminalSquare } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    // We can use the window.opuspawclaw API if available, 
    // or just trigger a standard download in browser
    if (window.opuspawclaw) {
      try {
        const timestamp = new Date().getTime();
        const ext = language || 'txt';
        const filename = `export_${timestamp}.${ext}`;
        await window.opuspawclaw.writeFile(filename, value);
        // Could show a notification here
      } catch (err) {
        console.error('Failed to export', err);
      }
    } else {
      const blob = new Blob([value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `code_export.${language || 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRunInTerminal = () => {
    if (window.opuspawclaw && window.opuspawclaw.writeToTerminal) {
      let command = value;
      const lang = (language || '').toLowerCase();
      if (['javascript', 'typescript', 'js', 'ts', 'node'].includes(lang)) {
        // Enclose code in single quotes and escape internal single quotes safely for bash/sh
        const escapedValue = "'" + value.replace(/'/g, "'\\''") + "'";
        command = `node -e ${escapedValue}`;
      }
      window.opuspawclaw.writeToTerminal(command + '\r\n');
    } else {
      alert("Terminal access requires Antigravity Desktop Client.");
    }
  };

  return (
    <div className="relative group rounded-md overflow-hidden bg-[#050505] border border-[#2a3a52] my-4 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#111827] border-b border-[#2a3a52]">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-[#6b82a6] font-bold">
            {language || 'text'}
          </span>
          <div className="flex items-center gap-1 opacity-60">
            <TerminalSquare size={10} className="text-[#00e676]" />
            <span className="text-[8px] uppercase tracking-widest text-[#00e676]">Antigravity Native</span>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={handleRunInTerminal}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#00e676]/10 hover:bg-[#00e676]/20 text-[#00e676] rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-[#00e676]/30"
            title="Execute in Core Terminal"
          >
            <Terminal size={12} />
            Run in Terminal
          </button>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#1a2332] hover:bg-[#2a3a52] text-[#6b82a6] hover:text-[#00d4ff] rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-[#2a3a52]"
            title="Copy Code"
          >
            {copied ? <Check size={12} className="text-[#00e676]" /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2 py-1 bg-[#1a2332] hover:bg-[#2a3a52] text-[#6b82a6] hover:text-[#e040fb] rounded text-[10px] font-bold uppercase tracking-wider transition-colors border border-[#2a3a52]"
            title="Export to Workspace"
          >
            <Download size={12} />
            Export
          </button>
        </div>
      </div>
      <div className="text-[13px]">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
          }}
          codeTagProps={{
            style: { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
