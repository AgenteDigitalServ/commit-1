
import React, { useState, useCallback, useEffect } from 'react';
import { SearchBar } from './components/SearchBar';
import { QuoteCard } from './components/QuoteCard';
import { Spinner } from './components/Spinner';
import { getPhilosophicalQuotes, getRandomQuote, generateQuoteImage } from './services/geminiService';
import type { Quote } from './types';
import { SophiaIcon, SearchIcon, BookmarkIcon, RefreshIcon } from './components/Icons';

type ViewState = 'search' | 'favorites';

const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [randomQuote, setRandomQuote] = useState<Quote | null>(null);
  const [isRandomLoading, setIsRandomLoading] = useState<boolean>(true);
  
  const [favorites, setFavorites] = useState<Quote[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('search');

  useEffect(() => {
    const savedFavorites = localStorage.getItem('sophia_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) { console.error(e); }
    }
    fetchRandomQuote();
  }, []);

  useEffect(() => {
    localStorage.setItem('sophia_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const fetchRandomQuote = async () => {
    setIsRandomLoading(true);
    setError(null);
    try {
      const quote = await getRandomQuote();
      setRandomQuote(quote);
    } catch (err: any) {
      setRandomQuote(null);
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setError(null);
    setQuotes([]);
    setCurrentView('search');

    try {
      const fetchedQuotes = await getPhilosophicalQuotes(searchTerm);
      if (fetchedQuotes.length === 0) {
        setError('Nenhum pensamento encontrado.');
        setIsLoading(false);
        return;
      }
      
      const quotesWithImagesPromises = fetchedQuotes.map(async (quote) => {
        const imageUrl = await generateQuoteImage(quote.quote);
        return { ...quote, imageUrl };
      });

      const resolvedQuotes = await Promise.all(quotesWithImagesPromises);
      setQuotes(resolvedQuotes);
    } catch (err: any) {
      setError("Ocorreu um erro ao buscar sabedoria.");
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const handleRegenerateImage = async (quote: Quote) => {
    try {
      const newImageUrl = await generateQuoteImage(quote.quote);
      setQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, imageUrl: newImageUrl } : q));
      if (randomQuote?.id === quote.id) setRandomQuote(prev => prev ? { ...prev, imageUrl: newImageUrl } : null);
      setFavorites(prev => prev.map(q => q.quote === quote.quote ? { ...q, imageUrl: newImageUrl } : q));
    } catch (err) { console.error(err); }
  };

  const toggleFavorite = (quote: Quote) => {
    setFavorites(prev => {
      const exists = prev.some(fav => fav.quote === quote.quote);
      return exists ? prev.filter(fav => fav.quote !== quote.quote) : [quote, ...prev];
    });
  };

  return (
    <div className="bg-[#050608] min-h-screen text-white flex justify-center p-0 sm:p-6 selection:bg-blue-500/30">
      <div className="w-full max-w-lg h-screen sm:h-[92vh] bg-[#0a0c10] sm:rounded-[3.5rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative border border-white/5">
        
        <header className="pt-12 pb-8 px-10 flex flex-col items-center">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-2.5 bg-blue-500/15 rounded-2xl ring-1 ring-blue-500/20">
              <SophiaIcon className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-2xl font-black tracking-[0.25em] text-white">SOPHIA</h1>
          </div>
          
          <nav className="flex bg-[#12161d] p-1.5 rounded-[2rem] w-full border border-white/5 shadow-2xl">
             <button 
                onClick={() => setCurrentView('search')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.8rem] text-[12px] uppercase tracking-widest font-black transition-all duration-300 ${currentView === 'search' ? 'bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <SearchIcon className="w-4 h-4" /> Explorar
             </button>
             <button 
                onClick={() => setCurrentView('favorites')}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-[1.8rem] text-[12px] uppercase tracking-widest font-black transition-all duration-300 ${currentView === 'favorites' ? 'bg-blue-600 text-white shadow-[0_10px_25px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <BookmarkIcon className="w-4 h-4" fill={currentView === 'favorites'} /> Favoritos
             </button>
          </nav>
        </header>
        
        <main className="flex-1 overflow-y-auto px-10 pb-12 space-y-10 scrollbar-hide">
          {currentView === 'favorites' ? (
            <div className="animate-fadeIn space-y-10">
                {favorites.length === 0 ? (
                    <div className="flex flex-col justify-center items-center py-40 text-center opacity-30">
                        <BookmarkIcon className="w-20 h-20 mb-6" />
                        <p className="text-sm font-medium tracking-widest uppercase italic">Nenhuma curadoria ainda.</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-center font-serif-display text-2xl text-blue-100/30 italic pb-2">Coleção de Pensamentos</h2>
                        {favorites.map((fav) => (
                            <QuoteCard key={fav.id} quote={fav} isFavorite={true} onToggleFavorite={toggleFavorite} onRegenerateImage={handleRegenerateImage} />
                        ))}
                    </>
                )}
            </div>
          ) : (
            <div className="animate-fadeIn space-y-10">
                <div className="sticky top-0 z-20 bg-[#0a0c10]/80 backdrop-blur-xl pb-4 pt-1">
                    <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={handleSearch} isLoading={isLoading} />
                </div>

                {isLoading ? (
                    <div className="flex flex-col justify-center items-center py-32">
                      <Spinner className="w-12 h-12" />
                      <p className="mt-10 text-blue-400 text-[11px] uppercase tracking-[0.4em] font-black animate-pulse">Consultando Oráculo</p>
                    </div>
                ) : quotes.length > 0 ? (
                    <div className="space-y-14">
                        {quotes.map((quote, index) => (
                            <QuoteCard key={quote.id || index} quote={quote} isFavorite={favorites.some(f => f.quote === quote.quote)} onToggleFavorite={toggleFavorite} onRegenerateImage={handleRegenerateImage} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {isRandomLoading ? (
                            <div className="flex flex-col justify-center items-center py-24">
                                <Spinner className="w-10 h-10" />
                                <p className="mt-8 text-[11px] text-gray-600 uppercase tracking-widest font-bold">Respirando fundo...</p>
                            </div>
                        ) : randomQuote && (
                            <div className="animate-slideUp flex flex-col">
                                <div className="flex items-center justify-between mb-8 px-2">
                                  <h2 className="font-serif-display text-2xl text-gray-400 italic">Sugestão do Dia</h2>
                                  <button onClick={fetchRandomQuote} className="p-3.5 rounded-full bg-white/5 hover:bg-white/10 text-blue-400 transition-all border border-white/5 active:rotate-180 duration-500">
                                    <RefreshIcon className="w-5 h-5" />
                                  </button>
                                </div>
                                <QuoteCard quote={randomQuote} isFavorite={favorites.some(f => f.quote === randomQuote.quote)} onToggleFavorite={toggleFavorite} onRegenerateImage={handleRegenerateImage} />
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
