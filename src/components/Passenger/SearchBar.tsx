import React from "react";

interface SearchBarProps {
  query: string;
  setQuery: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch }) => (
  <div className="flex flex-col md:flex-row gap-3">
    <input 
      className="flex-1 px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-400 transition-all" 
      placeholder="Какую песню найти?" 
      value={query} 
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && onSearch()}
    />
    <button onClick={onSearch} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95">
      ПОИСК
    </button>
  </div>
);