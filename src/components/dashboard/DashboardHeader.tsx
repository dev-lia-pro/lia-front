import React from 'react';
import { User } from 'lucide-react';

export const DashboardHeader = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-navy-card border-b border-border">
      {/* Logo */}
      <div className="w-10 h-10 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep">
        <span className="text-gold font-bold text-lg">L</span>
      </div>
      
      {/* App Name */}
      <h1 className="text-xl font-semibold text-foreground">L-IA</h1>
      
      {/* Profile Icon */}
      <button className="w-10 h-10 rounded-full border border-gold flex items-center justify-center hover:bg-navy-muted transition-smooth animate-press">
        <User className="w-5 h-5 text-gold" />
      </button>
    </header>
  );
};