
import React, { useRef, useState } from 'react';
import type { Quote } from '../types';
import { DownloadIcon, HeartIcon, RefreshIcon, ShareIcon } from './Icons';
import { Spinner } from './Spinner';
import html2canvas from 'html2canvas';

interface QuoteCardProps {
  quote: Quote;
  isFavorite?: boolean;
  onToggleFavorite?: (quote: Quote) => void;
  onRegenerateImage?: (quote: Quote) => Promise<void>;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ 
  quote, 
  isFavorite = false, 
  onToggleFavorite,
  onRegenerateImage 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const captureImage = async () => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      useCORS: true,
      scale: 3,
      backgroundColor: '#050608',
      logging: false,
      ignoreElements: (el) => el.classList.contains('exclude-from-capture'),
    });
  };

  const handleDownload = async () => {
    if (!cardRef.current || isRegenerating) return;
    setIsDownloading(true);
    try {
      const canvas = await captureImage();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `sophia-quote.jpg`;
      link.href = canvas.toDataURL("image/jpeg", 0.9);
      link.click();
    } finally { setIsDownloading(false); }
  };

  const handleShare = async () => {
    if (!cardRef.current || isRegenerating) return;
    setIsSharing(true);
    try {
      const canvas = await captureImage();
      if (!canvas) return;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `sophia.jpg`, { type: "image/jpeg" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Pensamento Sophia' });
      } else {
        await navigator.clipboard.writeText(`"${quote.quote}" — ${quote.author}`);
        alert('Copiado!');
      }
    } finally { setIsSharing(false); }
  };

  const onImageChange = async () => {
    if (!onRegenerateImage || isRegenerating) return;
    setIsRegenerating(true);
    setIsImageLoaded(false);
    try { await onRegenerateImage(quote); } finally { setIsRegenerating(false); }
  };

  return (
    <div className="space-y-6 group animate-fadeIn">
      <div 
        ref={cardRef} 
        className="relative w-full aspect-[4/5] sm:aspect-[9/16] rounded-[2.5rem] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] bg-[#0a0c10] border border-white/10 flex flex-col"
      >
        {/* Camada de Imagem com Zoom Sutil */}
        {quote.imageUrl ? (
            <img 
                src={quote.imageUrl} 
                alt="Reflexão" 
                onLoad={() => setIsImageLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-[2000ms] ${isImageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            />
        ) : <div className="absolute inset-0 bg-[#0a0c10]"></div>}

        {/* Vinheta e Contraste Adaptativo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10"></div>
        <div className="absolute inset-0 bg-black/10 z-10"></div>

        {/* Conteúdo Central */}
        <div className="absolute inset-0 flex flex-col justify-center px-10 sm:px-14 text-center z-20 pointer-events-none">
            <div className="w-10 h-[2px] bg-blue-500 mx-auto mb-8 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
            
            <blockquote 
              className="font-serif-display text-2xl sm:text-4xl font-bold leading-[1.25] tracking-tight italic text-white mb-8"
              style={{ 
                textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7)',
              }}
            >
                “{quote.quote}”
            </blockquote>
            
            <cite 
              className="font-serif-display text-lg sm:text-xl text-blue-200/80 not-italic block uppercase tracking-[0.3em] font-medium"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,1)' }}
            >
                {quote.author}
            </cite>
        </div>
        
        {/* Controles Flutuantes com Blur Forte */}
        <div className="exclude-from-capture absolute top-8 right-8 flex flex-col gap-3 z-30">
            <button
                onClick={onImageChange}
                disabled={isRegenerating}
                className="p-4 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all active:scale-90"
            >
                <RefreshIcon className={`w-5 h-5 text-white ${isRegenerating ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            <button
                onClick={() => onToggleFavorite?.(quote)}
                className="p-4 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all active:scale-90"
            >
                <HeartIcon className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}`} fill={isFavorite} />
            </button>
        </div>
        
        {/* Logo Sophia na Base */}
        <div className="absolute bottom-10 left-0 right-0 text-center opacity-70 text-[10px] uppercase tracking-[0.8em] font-black text-white drop-shadow-2xl z-20">
            SOPHIA
        </div>
        
        {/* Estado de Carregamento Premium */}
        {(isRegenerating || !isImageLoaded) && (
            <div className="absolute inset-0 bg-[#050608]/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
                <Spinner />
                <span className="text-[9px] text-blue-500 mt-6 uppercase tracking-[0.6em] font-black animate-pulse">Revelando Sabedoria</span>
            </div>
        )}
      </div>

      {/* Botões de Ação estilo "Glass Message" */}
      <div className="flex gap-4 px-2">
            <button
                onClick={handleShare}
                disabled={isSharing || isDownloading || isRegenerating}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-[2.5rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl text-[12px] uppercase tracking-widest"
            >
                <ShareIcon className="w-5 h-5" /> Enviar
            </button>
            <button
                onClick={handleDownload}
                disabled={isSharing || isDownloading || isRegenerating}
                className="flex-1 bg-[#161b22] hover:bg-[#1c2128] text-white py-5 rounded-[2.5rem] flex items-center justify-center transition-all active:scale-95 border border-white/5"
            >
                <DownloadIcon className="w-6 h-6" />
            </button>
      </div>
    </div>
  );
};
