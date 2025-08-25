import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { Button } from '@/componen../button';

interface PageNavigationProps {
  title: string;
  description?: string;
  showBackButton?: boolean;
  backPath?: string;
}

export const PageNavigation = ({ title, description, showBackButton = true, backPath = '/' }: PageNavigationProps) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  if (isHome) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-3">
        {showBackButton && (
          <Link to={backPath}>
            <Button variant="ghost" size="sm" className="p-2 h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
        )}
        <Link to="/" className="text-gold hover:text-gold-muted transition-smooth">
          <Home className="w-5 h-5" />
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      {description && (
        <p className="text-muted-foreground mt-2">{description}</p>
      )}
    </div>
  );
};
