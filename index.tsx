import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

type Language = 'EN' | 'TA';
type View = 'list' | 'detail' | 'search';
type Theme = 'light' | 'dark';

interface DevotionBlock {
  type: 'meta' | 'verse' | 'paragraph' | 'lesson' | 'prayer' | 'Subheading';
  [key: string]: any;
}

interface MetaBlock extends DevotionBlock {
  type: 'meta';
  title: string;
  subtitle: string;
  language: Language;
  date: string; // YYYY-MM-DD
  youtubeUrl?: string;
  pdfUrl?: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface ManifestEntry {
  date: string;
  EN: { title: string };
  TA: { title: string };
}

interface SearchResult {
  manifestInfo: ManifestEntry;
  snippet: string;
}

const formatDateForFilename = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const DEFAULT_OG_TITLE = 'Morning Light';
const DEFAULT_OG_DESCRIPTION = 'Daily devotion from Morning Light.';
const DEFAULT_OG_IMAGE = '';

const toAbsoluteUrl = (url: string | undefined): string => {
  if (!url) return '';
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return '';
  }
};

const upsertMetaTag = (attr: 'property' | 'name', key: string, content: string) => {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

const parseDateFromInput = (dateStr: string): Date => {
  return new Date(dateStr + 'T00:00:00');
};

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" width="16" height="16" x="0" y="0" viewBox="0 0 302.4 302.4" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className="">
    <g>
      <path d="M204.8 97.6C191.2 84 172 75.2 151.2 75.2s-40 8.4-53.6 22.4c-13.6 13.6-22.4 32.8-22.4 53.6s8.8 40 22.4 53.6c13.6 13.6 32.8 22.4 53.6 22.4s40-8.4 53.6-22.4c13.6-13.6 22.4-32.8 22.4-53.6s-8.4-40-22.4-53.6zM151.2 51.6c5.6 0 10.4-4.8 10.4-10.4V10.4c0-5.6-4.8-10.4-10.4-10.4-5.6 0-10.4 4.8-10.4 10.4v30.8c0 5.6 4.8 10.4 10.4 10.4zM236.4 80.8l22-22c4-4 4-10.4 0-14.4s-10.4-4-14.4 0l-22 22c-4 4-4 10.4 0 14.4 3.6 4 10 4 14.4 0zM292 140.8h-30.8c-5.6 0-10.4 4.8-10.4 10.4 0 5.6 4.8 10.4 10.4 10.4H292c5.6 0 10.4-4.8 10.4-10.4 0-5.6-4.8-10.4-10.4-10.4zM236 221.6c-4-4-10.4-4-14.4 0s-4 10.4 0 14.4l22 22c4 4 10.4 4 14.4 0s4-10.4 0-14.4l-22-22zM151.2 250.8c-5.6 0-10.4 4.8-10.4 10.4V292c0 5.6 4.8 10.4 10.4 10.4 5.6 0 10.4-4.8 10.4-10.4v-30.8c0-5.6-4.8-10.4-10.4-10.4zM66 221.6l-22 22c-4 4-4 10.4 0 14.4s10.4 4 14.4 0l22-22c4-4 4-10.4 0-14.4-3.6-4-10-4-14.4 0zM51.6 151.2c0-5.6-4.8-10.4-10.4-10.4H10.4c-5.6 0-10.4 4.8-10.4 10.4s4.8 10.4 10.4 10.4h30.8c5.6 0 10.4-4.8 10.4-10.4zM66 80.8c4 4 10.4 4 14.4 0s4-10.4 0-14.4l-22-22c-4-4-10.4-4-14.4 0s-4 10.4 0 14.4l22 22z" fill="currentColor" opacity="1" data-original="#000000" className=""></path>
    </g>
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.31 0-6-2.69-6-6 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
  </svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);

const NotAvailableIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 0 24 24" width="48px" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z" />
  </svg>
);

const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlnsXlink="http://www.w3.org/1999/xlink" width="40" height="40" x="0" y="0" viewBox="0 0 64 64" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve" className="">
    <g>
      <radialGradient id="logo-a" cx="21.56" cy="21.67" r="28.61" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#feed01"></stop>
        <stop offset=".23" stopColor="#fde500"></stop>
        <stop offset=".59" stopColor="#facf00"></stop>
        <stop offset="1" stopColor="#f7af00"></stop>
      </radialGradient>
      <radialGradient id="logo-b" cx="25.23" cy="25.22" r="24.86" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#fac533"></stop>
        <stop offset="1" stopColor="#f7931e"></stop>
      </radialGradient>
      <path fill="url(#logo-a)" d="M56.25 44.58c-.93-.53.87-5.28-1.78-6.78-1.79-1.01-3.44-1.31-4.61-1.36C51.89 34.95 51.56 31 54 31c2 0 2.9 1 5 1-1.05 0-3-5-6-5-1.36 0-2.38.13-3.13.29 1.55-2.13-.71-5.01 1.54-6.29 2.47-1.4 3.49.33 5.34-.72 2.74-1.55.19-5.88.19-5.88s.14 2.23-1.72 3.28c-.93.53-4.22-3.38-6.87-1.88-1.86 1.05-2.96 2.37-3.58 3.34.09-2.73-3.92-4.48-2.64-6.7 1-1.73 2.32-2.01 3.37-3.83-.53.91-5.83.1-7.33 2.7-.81 1.41-1.22 2.47-1.43 3.25C35.72 12.05 32 12.59 32 10c0-2.8 2-2.8 2-4.9C34 2 29 2 29 2s2 1 2 3.1c0 1.05-5 1.9-5 4.9 0 1.86.47 3.31.95 4.33-2.31-1.06-5.59 1.24-6.82-.88-1-1.73-.58-3.01-1.63-4.83.53.91-2.83 5.1-1.33 7.7.83 1.44 1.57 2.35 2.15 2.92-2.92-.67-4.36 3.11-6.73 1.77-2.47-1.4-1.45-3.13-3.3-4.18-2.74-1.55-5.28 2.78-5.28 2.78s1.9-1.23 3.75-.18c.93.53-.87 5.28 1.78 6.78 1.79 1.01 3.44 1.31 4.61 1.36-2.03 1.49-1.7 5.44-4.14 5.44-2 0-2.9-1-5-1 1.05 0 3 5 6 5 1.36 0 2.38-.13 3.13-.29-1.55 2.13.71 5.01-1.54 6.29-2.47 1.4-3.49-.33-5.34.72-2.74 1.55-.19 5.88-.19 5.88s-.14-2.23 1.72-3.28c-.93-.53 4.22 3.38 6.87 1.88 1.86-1.05 2.96-2.37 3.58-3.34-.09 2.73 3.92 4.48 2.64 6.7-1 1.73-2.32 2.01-3.37 3.83.53-.91 5.83-.1 7.33-2.7.81-1.41 1.22-2.47 1.43-3.25 1.02 2.51 4.74 1.97 4.74 4.56 0 2.8-2 2.8-2 4.9 0 3.1 5 3.1 5 3.1s-2-1-2-3.1c0-1.05 5-1.9 5-4.9 0-1.86-.47-3.31-.95-4.33 2.31 1.06 5.59-1.24 6.82.88 1 1.73.58 3.01 1.63 4.83-.53-.91 2.83-5.1 1.33-7.7-.83-1.44-1.57-2.35-2.15-2.92 2.92.67 4.36-3.11 6.73-1.77 2.47 1.4 1.45 3.13 3.3 4.18C57.46 48.73 60 44.4 60 44.4s-1.9 1.23-3.75.18z" opacity="1" data-original="url(#logo-a)" className=""></path>
      <circle cx="32" cy="32" r="15" fill="url(#logo-b)" opacity="1" data-original="url(#logo-b)" className=""></circle>
    </g>
  </svg>
);

const ScrollToTopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12 4l-8 8h6v8h4v-8h6l-8-8z" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);


const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;

// Helper function for parsing markdown and applying highlights
const renderContentWithHighlight = (text: string, highlight: string): React.ReactNode => {
  if (!text) return null;

  const highlightAndParse = (subtext: string, keyPrefix: string = ''): React.ReactNode[] => {
    // Split by markdown delimiters, but keep them
    const parts = subtext.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(Boolean);

    return parts.map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={key}>{highlightAndParse(part.slice(2, -2), key)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={key}>{highlightAndParse(part.slice(1, -1), key)}</em>;
      }

      // It's a plain text part, apply highlighting if a query exists
      if (highlight) {
        const subParts = part.split(new RegExp(`(${highlight})`, 'gi'));
        return (
          <React.Fragment key={key}>
            {subParts.map((subPart, subIndex) =>
              subPart.toLowerCase() === highlight.toLowerCase() ? (
                <span key={`${key}-${subIndex}`} className="search-highlight-active">
                  {subPart}
                </span>
              ) : (
                subPart
              )
            )}
          </React.Fragment>
        );
      }
      return part; // Return plain text if no highlight query
    });
  };

  return <>{highlightAndParse(text)}</>;
};


const DISABLE_NAVIGATION = true; // Temporarily disable next/prev buttons

const App: React.FC = () => {
  const [view, setView] = useState<View>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [language, setLanguage] = useState<Language>(
    (localStorage.getItem('devotionLanguage') as Language) || 'EN'
  );
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem('devotionTheme') as Theme) || 'light'
  );
  const [fontSize, setFontSize] = useState<number>(
    parseInt(localStorage.getItem('devotionFontSize') || '16', 10)
  );
  const [manifest, setManifest] = useState<ManifestEntry[]>([]);
  const [devotion, setDevotion] = useState<DevotionBlock[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allDevotions, setAllDevotions] = useState<Record<string, DevotionBlock[]>>({});
  const availableDates = manifest.map(item => parseDateFromInput(item.date)).sort((a, b) => a.getTime() - b.getTime());
  const [highlightQuery, setHighlightQuery] = useState<string>('');
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [showMorningLightList, setShowMorningLightList] = useState(false);

  // Function to parse URL pathname into date and language
  const parsePathname = (pathname: string): { date: Date | null; language: Language | null } => {
    if (pathname === '/' || pathname === '' || pathname === '/index.html') return { date: null, language: null };

    // Remove leading slash and split by dashes
    const slug = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const parts = slug.split('-');
    if (parts.length < 4) return { date: null, language: null };

    // Expected format: dd-MM-yyyy-LANG
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
    const year = parseInt(parts[2], 10);
    const langPart = parts[3].toUpperCase();

    const date = new Date(year, month, day);
    if (isNaN(date.getTime())) return { date: null, language: null };

    const language: Language | null = (langPart === 'EN' || langPart === 'TA') ? langPart : null;
    return { date, language };
  };

  // Function to create path from date and language using JSON filename format
  const createPath = (date: Date, language: Language): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `/${day}-${month}-${year}-${language}`;
  };

  // Function to navigate with History API
  const navigateTo = (path: string) => {
    window.history.pushState(null, '', path);
  };

  const dateInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Audio state management
  // Uses useRef to manage a single global audio instance ensuring only one audio can play at a time
  // Audio state is managed through isPlaying and currentAudioUrl states
  // The audioUrl comes from the meta block in devotion JSON data and controls playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  // Fetch manifest on initial load
  useEffect(() => {
    const fetchManifest = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/manifest.json');
        if (!response.ok) throw new Error('Could not load devotion list.');
        const data: ManifestEntry[] = await response.json();
        setManifest(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchManifest();
  }, []);

  // Initialize from URL pathname on app load
  useEffect(() => {
    const { date, language: pathnameLang } = parsePathname(window.location.pathname);
    if (date) {
      setCurrentDate(date);
      setView('detail');
      if (pathnameLang) setLanguage(pathnameLang);
    }
  }, []);

  // Add popstate listener for browser navigation (back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const { date, language: pathnameLang } = parsePathname(window.location.pathname);
      if (date) {
        setCurrentDate(date);
        setView('detail');
        if (pathnameLang) setLanguage(pathnameLang);
      } else {
        // If no devotion path, go back to list view
        setView('list');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL pathname when in detail view and date/language changes
  useEffect(() => {
    if (view === 'detail') {
      navigateTo(createPath(currentDate, language));
    } else if (view === 'list' && window.location.pathname !== '/') {
      // Navigate back to home when going to list view
      navigateTo('/');
    }
  }, [currentDate, language, view]);

  // Pre-fetch all devotion content for searching after manifest is loaded
  useEffect(() => {
    const fetchAllDevotions = async () => {
      if (manifest.length === 0) return;

      const promises = manifest.flatMap(item => [
        fetch(`https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/${formatDateForFilename(parseDateFromInput(item.date))}-EN.json`)
          .then(res => res.ok ? res.json() : [])
          .then(data => ({ key: `${formatDateForFilename(parseDateFromInput(item.date))}-EN`, data })),
        fetch(`https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/${formatDateForFilename(parseDateFromInput(item.date))}-TA.json`)
          .then(res => res.ok ? res.json() : [])
          .then(data => ({ key: `${formatDateForFilename(parseDateFromInput(item.date))}-TA`, data }))
      ]);

      try {
        const results = await Promise.all(promises);
        const devotionsData = results.reduce((acc, result) => {
          if (result.data) {
            acc[result.key] = result.data;
          }
          return acc;
        }, {} as Record<string, DevotionBlock[]>);
        setAllDevotions(devotionsData);
      } catch (err) {
        console.error("Failed to pre-fetch devotion data:", err);
      }
    };

    fetchAllDevotions();
  }, [manifest]);


  const fetchDevotion = useCallback(async (date: Date, lang: Language) => {
    setIsLoading(true);
    setError(null);
    setDevotion(null);

    const key = `${formatDateForFilename(date)}-${lang}`;
    if (allDevotions[key]) {
      setDevotion(allDevotions[key]);
      setIsLoading(false);
      return;
    }

    const filename = `${formatDateForFilename(date)}-${lang}.json`;
    try {
      const response = await fetch(`https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/${filename}`);
      if (!response.ok) {
        throw new Error('Morning Light not available for this date.');
      }
      const data: DevotionBlock[] = await response.json();
      setDevotion(data);
    } catch (err) {
      const errorMessage = (err as Error).message;
      // Replace JSON parsing errors with user-friendly message
      if (errorMessage.includes('Unexpected token') || errorMessage.includes('is not valid JSON')) {
        setError('Morning Light not available for this date.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [allDevotions]);

  // Fetch devotion content when in detail view
  useEffect(() => {
    if (view === 'detail') {
      fetchDevotion(currentDate, language);
    }
  }, [currentDate, language, fetchDevotion, view]);

  // Keep social preview metadata in sync with the currently opened devotion.
  useEffect(() => {
    const metaBlock = devotion?.find(block => block.type === 'meta') as MetaBlock | undefined;
    const isDetailView = view === 'detail' && !!metaBlock;

    const ogTitle = isDetailView && metaBlock.title ? metaBlock.title : DEFAULT_OG_TITLE;
    const ogImage = isDetailView ? toAbsoluteUrl(metaBlock.imageUrl) : DEFAULT_OG_IMAGE;
    const ogDescription = isDetailView && metaBlock.subtitle ? metaBlock.subtitle : DEFAULT_OG_DESCRIPTION;
    const canonicalUrl = window.location.href;

    document.title = isDetailView && metaBlock.title ? `${metaBlock.title} | Morning Light` : DEFAULT_OG_TITLE;
    upsertMetaTag('property', 'og:title', ogTitle);
    upsertMetaTag('property', 'og:image', ogImage);
    upsertMetaTag('property', 'og:description', ogDescription);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('name', 'twitter:title', ogTitle);
    upsertMetaTag('name', 'twitter:image', ogImage);
    upsertMetaTag('name', 'twitter:description', ogDescription);
  }, [view, devotion]);

  useEffect(() => {
    if (isSearchVisible) {
      searchInputRef.current?.focus();
    }
  }, [isSearchVisible]);

  // Effect to scroll to and highlight search term
  useEffect(() => {
    if (view !== 'detail' || !highlightQuery || !devotion) {
      return;
    }

    let targetBlockIndex = -1;
    for (let i = 0; i < devotion.length; i++) {
      const block = devotion[i];
      // Combine all string values in the block for searching
      const blockText = Object.values(block).filter(v => typeof v === 'string').join(' ').toLowerCase();
      if (blockText.includes(highlightQuery.toLowerCase())) {
        targetBlockIndex = i;
        break;
      }
    }

    if (targetBlockIndex !== -1) {
      const targetElement = document.querySelector(`[data-block-index="${targetBlockIndex}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const fadeTimer = setTimeout(() => {
          const highlights = document.querySelectorAll('.search-highlight-active');
          highlights.forEach(h => h.classList.add('fade-out'));
        }, 500);

        const clearTimer = setTimeout(() => {
          setHighlightQuery('');
        }, 3000);

        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(clearTimer);
        };
      }
    } else {
      // If no match found, clear the query so this doesn't re-run
      setHighlightQuery('');
    }
  }, [view, highlightQuery, devotion]);

  // Persist language
  useEffect(() => {
    localStorage.setItem('devotionLanguage', language);
  }, [language]);

  // Persist and apply theme
  useEffect(() => {
    localStorage.setItem('devotionTheme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme]);

  // Persist and apply font size
  useEffect(() => {
    localStorage.setItem('devotionFontSize', fontSize.toString());
    document.documentElement.style.setProperty('--content-font-size', `${fontSize}px`);
  }, [fontSize]);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down 300px or reaches bottom 100px from viewport
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      setShowScrollToTop(scrollTop > 300 || (scrollTop + windowHeight) >= (documentHeight - 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results: SearchResult[] = [];
    const addedDates = new Set<string>();
    const lowerCaseQuery = query.toLowerCase();

    for (const manifestInfo of manifest) {
      if (addedDates.has(manifestInfo.date)) continue;

      const devotionsToCheck = [
        allDevotions[`${formatDateForFilename(parseDateFromInput(manifestInfo.date))}-EN`],
        allDevotions[`${formatDateForFilename(parseDateFromInput(manifestInfo.date))}-TA`]
      ].filter(Boolean);

      let matchFound = false;
      let snippet = '';

      for (const devotionContent of devotionsToCheck) {
        if (matchFound) break;
        if (!devotionContent || devotionContent.length === 0) continue;

        const title = (devotionContent[0] as MetaBlock)?.title || '';
        if (title.toLowerCase().includes(lowerCaseQuery)) {
          matchFound = true;
          snippet = title;
        } else {
          const fullText = devotionContent.map(block => Object.values(block).join(' ')).join(' ').toLowerCase();
          const matchIndex = fullText.indexOf(lowerCaseQuery);
          if (matchIndex !== -1) {
            matchFound = true;
            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(fullText.length, matchIndex + lowerCaseQuery.length + 40);
            snippet = `...${fullText.substring(start, end)}...`;
          }
        }
      }

      if (matchFound) {
        results.push({ manifestInfo, snippet });
        addedDates.add(manifestInfo.date);
      }
    }
    setSearchResults(results);
    setIsSearching(false);
  }, [allDevotions, manifest]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSubmittedQuery(searchQuery);
    performSearch(searchQuery);
    setView('search');
    setIsSearchVisible(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(parseDateFromInput(e.target.value));
  };

  const handlePrevDay = () => {
    const currIndex = availableDates.findIndex(d => d.getTime() === currentDate.getTime());
    if (currIndex > 0) {
      setCurrentDate(availableDates[currIndex - 1]);
    }
  };

  const handleNextDay = () => {
    const currIndex = availableDates.findIndex(d => d.getTime() === currentDate.getTime());
    if (currIndex !== -1 && currIndex < availableDates.length - 1) {
      setCurrentDate(availableDates[currIndex + 1]);
    }
  };

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleIncreaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 1, MAX_FONT_SIZE));
  };

  const handleDecreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 1, MIN_FONT_SIZE));
  };

  const handleSelectDevotion = (dateStr: string, query: string = '') => {
    setCurrentDate(parseDateFromInput(dateStr));
    setHighlightQuery(query);
    setView('detail');
  };

  const handleGoBackToList = () => {
    setView('list');
    setError(null);
    setDevotion(null);
    setSearchQuery('');
    setSubmittedQuery('');
    setSearchResults([]);
    setHighlightQuery('');
  }

  const handleCalendarClick = () => {
    setShowMorningLightList(true);
  };

  const handleSelectFromPopup = (dateStr: string) => {
    setCurrentDate(parseDateFromInput(dateStr));
    setShowMorningLightList(false);
  };

  const handleClosePopup = () => {
    setShowMorningLightList(false);
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) {
      return text;
    }
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="highlight">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const meta = devotion?.find(block => block.type === 'meta') as MetaBlock | undefined;

  // Audio control functions
  const handleAudioToggle = useCallback(() => {
    const audioUrl = meta?.audioUrl;
    if (!audioUrl) return;

    if (isPlaying && currentAudioUrl === audioUrl) {
      // Pause current audio
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      // Stop any existing audio and play new audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // For Vercel optimization: Check if audio instance exists and has different URL
      if (!audioRef.current || audioRef.current.src !== audioUrl) {
        const audio = new Audio(audioUrl);
        // Critical for Vercel: preload metadata and warm up the stream
        audio.preload = 'metadata';
        audioRef.current = audio;
      }

      // Critical for instant playback: load() ensures audio is ready before play()
      audioRef.current.load();

      // Critical for instant playback: wait for canplay event to start playback
      // This prevents silent delays on slow networks
      const handleCanPlay = () => {
        audioRef.current?.play().then(() => {
          setIsPlaying(true);
          setCurrentAudioUrl(audioUrl);
        }).catch((error) => {
          console.error('Audio playback failed:', error);
          setIsPlaying(false);
          setCurrentAudioUrl(null);
        });
        // Remove listener after successful playback start
        audioRef.current?.removeEventListener('canplay', handleCanPlay);
      };

      audioRef.current?.addEventListener('canplay', handleCanPlay);
      audioRef.current?.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentAudioUrl(null);
      });

      // Add playsInline for mobile compatibility
      audioRef.current.playsInline = true;
    }
  }, [isPlaying, currentAudioUrl, meta?.audioUrl]);

  // Cleanup audio on component unmount or when view/content changes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [view, currentDate, language]);

  const renderListView = () => (
    <main className="devotion-list">
      {isLoading && <div className="loading">Loading...</div>}
      {error && (
        <div className="error-container">
          <NotAvailableIcon />
          <div className="error">{error}</div>
        </div>
      )}
      {!isLoading && !error && manifest.map(item => (
        <div key={item.date} className="devotion-list-item" onClick={() => handleSelectDevotion(item.date)} role="button" tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleSelectDevotion(item.date)}>
          <h2>{item[language]?.title || item['EN'].title}</h2>
          <p>{new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      ))}
    </main>
  );

  const renderDetailView = () => (
    <>
      <div className="controls">
        <div className="bottom-nav-island">
          {!DISABLE_NAVIGATION && (
            <button onClick={handlePrevDay} aria-label="Previous Day">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
          )}
          <button onClick={handleGoBackToList} className="icon-btn sub-header-home-btn" aria-label="Go to Home">
            <HomeIcon />
          </button>
          <button className="icon-btn" aria-label="Search" onClick={() => setIsSearchVisible(true)}>
            <SearchIcon />
          </button>
          <button className="icon-btn" aria-label="Select Morning Light" onClick={handleCalendarClick}>
            <ListIcon />
          </button>
          {meta?.youtubeUrl && meta.youtubeUrl !== '#' && (
            <a href={meta.youtubeUrl} target="_blank" rel="noopener noreferrer" className="youtube-link" aria-label="YouTube Content">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </a>
          )}
          {meta?.pdfUrl && meta.pdfUrl !== '#' && meta.pdfUrl !== '' && (
            <a href={meta.pdfUrl} target="_blank" rel="noopener noreferrer" className="pdf-download" aria-label="Download PDF">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </a>
          )}
          {meta?.audioUrl && meta.audioUrl !== '#' && meta.audioUrl !== '' && (
            <button
              className="icon-btn"
              aria-label="Play Audio"
              onClick={handleAudioToggle}
            >
              {isPlaying && currentAudioUrl === meta.audioUrl ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
          {!DISABLE_NAVIGATION && (
            <button onClick={handleNextDay} aria-label="Next Day">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <main className="content-area">
        {isLoading && <div className="loading">Loading...</div>}
        {error && (
          <div className="error-container">
            <NotAvailableIcon />
            <div className="error">{error}</div>
          </div>
        )}
        {devotion && (
          <>
            {devotion.map((block, index) => {
              switch (block.type) {
                case 'meta':
                  const metaBlock = block as MetaBlock;
                  return (
                    <div key={index} className="devotion-block devotion-meta" data-block-index={index}>
                      <h2>{renderContentWithHighlight(metaBlock.title, highlightQuery)}</h2>
                      <h3>{renderContentWithHighlight(metaBlock.subtitle, highlightQuery)}</h3>
                    </div>
                  );
                case 'verse':
                  return (
                    <div key={index} className="devotion-block devotion-verse" data-block-index={index}>
                      <span className="verse-ref">{block.reference}</span>
                      <p>{renderContentWithHighlight(block.text, highlightQuery)}</p>
                    </div>
                  );
                case 'paragraph':
                case 'lesson':
                case 'prayer':
                case 'Subheading':
                  return (
                    <div key={index} className="devotion-block" data-block-index={index}>
                      {(block.title || block.subtitle) && <h4>{renderContentWithHighlight(block.title || block.subtitle, highlightQuery)}</h4>}
                      {(block.content || block.text)?.split('\n').map((p: string, i: number) =>
                        p.trim() && <p key={i}>{renderContentWithHighlight(p, highlightQuery)}</p>
                      )}
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </>
        )}
      </main>
    </>
  );

  const renderSearchView = () => (
    <main className="search-results-list">
      <div className="search-results-header">
        <h2>Results for "{submittedQuery}"</h2>
        <p>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found</p>
      </div>

      {isSearching && <div className="loading">Searching...</div>}
      {!isSearching && searchResults.length === 0 && <div className="no-results">No devotions found matching your search.</div>}

      {!isSearching && searchResults.map(({ manifestInfo, snippet }) => (
        <div key={manifestInfo.date} className="devotion-list-item" onClick={() => handleSelectDevotion(manifestInfo.date, submittedQuery)} role="button" tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleSelectDevotion(manifestInfo.date, submittedQuery)}>
          <h2>{getHighlightedText(manifestInfo[language]?.title || manifestInfo['EN'].title, submittedQuery)}</h2>
          <p className="search-snippet">{getHighlightedText(snippet, submittedQuery)}</p>
          <p className="search-result-date">{new Date(manifestInfo.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      ))}
    </main>
  );

  return (
    <div className={`app-container lang-${language.toLowerCase()} view-${view}`}>
      <header className="header">
        <div className="header-left">
          {/* Home button moved to sub-header for detail/search views */}
        </div>
        <div className="header-title">
          <LogoIcon />
          <h1>Morning Light</h1>
        </div>
        <div className="header-right">
          {/* This div is a spacer to keep the title centered */}
        </div>
      </header>

      <input
        ref={dateInputRef}
        type="date"
        value={formatDateForInput(currentDate)}
        onChange={handleDateChange}
        className="hidden-date-input"
        aria-label="Select Date"
      />

      <div className="sub-header">
        {isSearchVisible ? (
          <form className="search-bar" onSubmit={handleSearchSubmit}>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search Morning Light..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search Morning Light"
            />
            <button type="button" onClick={() => setIsSearchVisible(false)} className="icon-btn close-btn" aria-label="Close Search">&times;</button>
          </form>
        ) : (
          <div className="sub-header-content">
            <div className="left-controls">
              <div className="language-toggle">
                <span className={language === 'EN' ? 'active-lang' : ''}>EN</span>
                <label className="switch" aria-label={`Switch to ${language === 'EN' ? 'Tamil' : 'English'} language`}>
                  <input
                    type="checkbox"
                    checked={language === 'TA'}
                    onChange={() => setLanguage(prev => (prev === 'EN' ? 'TA' : 'EN'))}
                  />
                  <span className="slider"></span>
                </label>
                <span className={language === 'TA' ? 'active-lang' : ''}>TA</span>
              </div>

              {view === 'search' && (
                <button onClick={handleGoBackToList} className="icon-btn sub-header-home-btn" aria-label="Go to Home">
                  <HomeIcon />
                </button>
              )}
            </div>

            <div className="center-controls">
              {view === 'list' && (
                <button className="mini-search-placeholder" onClick={() => setIsSearchVisible(true)} aria-label="Open Search">
                  <SearchIcon />
                  <span>Search...</span>
                </button>
              )}
            </div>

            <div className="theme-toggle">
              <SunIcon />
              <label className="switch" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                <input
                  type="checkbox"
                  checked={theme === 'dark'}
                  onChange={handleThemeToggle}
                />
                <span className="slider"></span>
              </label>
              <MoonIcon />
            </div>
          </div>
        )}
      </div>

      {view === 'list' ? renderListView() : view === 'detail' ? renderDetailView() : renderSearchView()}

      {/* Morning Light List Popup */}
      {showMorningLightList && (
        <div className="popup-overlay" onClick={handleClosePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Select Morning Light</h2>
              <button className="popup-close-btn" onClick={handleClosePopup} aria-label="Close">
                &times;
              </button>
            </div>
            <div className="popup-body">
              {manifest.map((item) => (
                <div
                  key={item.date}
                  className="popup-list-item"
                  onClick={() => handleSelectFromPopup(item.date)}
                >
                  <h3>{item[language]?.title || item['EN'].title}</h3>
                  <p>{new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button
        className={`scroll-to-top-btn ${showScrollToTop ? 'visible' : ''}`}
        onClick={handleScrollToTop}
        aria-label="Scroll to top"
        title="Scroll to top"
      >
        <ScrollToTopIcon />
      </button>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
