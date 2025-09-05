import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const providerId = searchParams.get('provider_id');
    const tokensParam = searchParams.get('tokens');

    // Prévenir la fenêtre parente
    if (window.opener) {
      if (providerId) {
        window.opener.postMessage({ type: 'OAUTH_PROVIDER_CREATED', provider_id: providerId }, window.location.origin);
      } else if (tokensParam) {
        // Compatibilité si on recevait encore des tokens
        window.opener.postMessage({ type: 'OAUTH_SUCCESS', tokens: tokensParam }, window.location.origin);
      } else {
        window.opener.postMessage({ type: 'OAUTH_SUCCESS' }, window.location.origin);
      }
    }

    // Fermer la fenêtre rapidement
    const timer = setTimeout(() => window.close(), 1200);
    return () => clearTimeout(timer);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
        <h1 className="text-2xl font-semibold mb-2 text-green-400">Authentification réussie !</h1>
        <p className="text-foreground/70">Vous pouvez fermer cette fenêtre.</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
