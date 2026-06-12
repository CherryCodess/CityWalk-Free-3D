import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { GeocodeResult } from '../types/geo';
import { searchPlaces } from '../map/geocode';

type Props = {
  onSelect: (result: GeocodeResult) => void;
};

export function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const next = await searchPlaces(query, controller.signal);
        setResults(next);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, query.trim().length < 2 ? 80 : 320);
    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  function choose(result: GeocodeResult) {
    setQuery(result.name);
    setOpen(false);
    onSelect(result);
  }

  return (
    <div className="search-shell">
      <Search size={18} aria-hidden />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search city, landmark, or address"
        aria-label="Search city, landmark, or address"
      />
      {loading && <span className="search-loading">Searching</span>}
      {open && results.length > 0 && (
        <div className="suggestions">
          {results.map((result) => (
            <button key={result.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(result)}>
              <span>{result.name}</span>
              <small>{result.displayName}</small>
              <em>{result.source}</em>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
