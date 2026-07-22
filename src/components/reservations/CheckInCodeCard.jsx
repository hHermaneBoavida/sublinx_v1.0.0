import React, { useState } from 'react';
import { Copy, Check, QrCode, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckInCodeCard({ code, checkedInAt, checkedOutAt, variant = 'user' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <div className="rounded-xl border-2 border-dashed border-cyan-600/40 bg-cyan-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2 text-cyan-400">
        <QrCode className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wide">
          {variant === 'organizer' ? 'Código do Cliente' : 'Seu Código de Check-in'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <code className="text-lg sm:text-xl font-mono font-bold text-white tracking-wider">
          {code}
        </code>
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="text-cyan-400 hover:bg-cyan-900/30 h-8 px-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <LogIn className={`w-3.5 h-3.5 ${checkedInAt ? 'text-green-400' : 'text-gray-600'}`} />
          <span className={checkedInAt ? 'text-green-400' : 'text-gray-500'}>
            {checkedInAt ? 'Check-in realizado' : 'Check-in pendente'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <LogOut className={`w-3.5 h-3.5 ${checkedOutAt ? 'text-blue-400' : 'text-gray-600'}`} />
          <span className={checkedOutAt ? 'text-blue-400' : 'text-gray-500'}>
            {checkedOutAt ? 'Check-out realizado' : 'Check-out pendente'}
          </span>
        </div>
      </div>

      {variant === 'user' && !checkedInAt && (
        <p className="text-xs text-gray-500">
          Apresente este código no local para realizar o check-in.
        </p>
      )}
    </div>
  );
}