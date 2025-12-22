import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Sun, Moon, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Language } from '@/hooks/useLanguage';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

export function Navbar({ theme, toggleTheme, language, toggleLanguage, t }: NavbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [themeAnimating, setThemeAnimating] = useState(false);
  const [langAnimating, setLangAnimating] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isHome = location.pathname === '/';

  const handleThemeToggle = () => {
    setThemeAnimating(true);
    toggleTheme();
    setTimeout(() => setThemeAnimating(false), 300);
  };

  const handleLangToggle = () => {
    setLangAnimating(true);
    toggleLanguage();
    setTimeout(() => setLangAnimating(false), 300);
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isVisible ? "translate-y-0" : "-translate-y-full",
          "glass-strong"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
                <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
              </div>
              <span className="text-lg font-semibold tracking-tight hidden sm:inline">
                Tongbarn<span className="text-primary">Tube</span>
              </span>
            </Link>

            {/* Right Side Actions - Inline Icons */}
            <div className="flex items-center gap-1">
              {/* Home button (only show when not on home) */}
              {!isHome && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9 hover:bg-primary/10 transition-all duration-200"
                >
                  <Link to="/">
                    <Home className="w-4 h-4" />
                  </Link>
                </Button>
              )}

              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLangToggle}
                className={cn(
                  "h-9 px-2.5 font-medium text-sm hover:bg-primary/10 transition-all duration-200",
                  langAnimating && "scale-90"
                )}
              >
                <span className={cn(
                  "transition-all duration-200",
                  langAnimating && "opacity-0 scale-50"
                )}>
                  {language === 'en' ? 'TH' : 'EN'}
                </span>
              </Button>
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className={cn(
                  "h-9 w-9 hover:bg-primary/10 transition-all duration-200",
                  themeAnimating && "rotate-180"
                )}
              >
                <div className={cn(
                  "transition-all duration-300",
                  themeAnimating && "scale-0"
                )}>
                  {theme === 'light' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
