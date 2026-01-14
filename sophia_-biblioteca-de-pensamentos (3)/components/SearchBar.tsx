
import React from 'react';
import { SearchIcon } from './Icons';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, onSearch, isLoading }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') onSearch();
  };

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
        <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="O que deseja refletir hoje?..."
        disabled={isLoading}
        className="w-full bg-[#161b22] border border-white/5 rounded-3xl py-5 pl-14 pr-14 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-[#1c2128] transition-all duration-500 shadow-inner"
      />
      {isLoading && (
        <div className="absolute inset-y-0 right-5 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-900 border-t-blue-400 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
