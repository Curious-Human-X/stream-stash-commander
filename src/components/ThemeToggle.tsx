
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      toast({
        title: "🌙 Dark Mode",
        description: "Switched to dark theme for better night viewing.",
      });
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      toast({
        title: "☀️ Light Mode", 
        description: "Switched to light theme for daytime use.",
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative overflow-hidden transition-all duration-300"
    >
      <div className={`transition-transform duration-300 ${isDark ? 'rotate-180' : 'rotate-0'}`}>
        {isDark ? '🌙' : '☀️'}
      </div>
      <span className="ml-2 text-sm">
        {isDark ? 'Dark' : 'Light'}
      </span>
    </Button>
  );
};
