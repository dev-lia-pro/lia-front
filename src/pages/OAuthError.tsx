import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const OAuthError = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    if (window.opener) {
      window.opener.postMessage({ type: 'OAUTH_ERROR', error: error || 'unknown' }, window.location.origin);
    }
    const timer = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-navy-deep text-foreground flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h1 className="text-2xl font-semibold mb-2 text-red-400">Erreur d'authentification</h1>
        <p className="text-foreground/70">Vous pouvez fermer cette fenêtre.</p>
      </div>
    </div>
  );
};

export default OAuthError;
