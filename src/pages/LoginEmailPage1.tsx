import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';

const LoginEmailPage1 = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Récupérer l'email depuis les paramètres d'URL si présent
  useEffect(() => {
    const emailFromParams = searchParams.get('email');
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage('Veuillez saisir votre adresse email');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const payload = { email };
      await axios.post('/auth/send_code/', payload);
      
      const encodedEmail = encodeURIComponent(email);
      navigate(`/auth/step2?email=${encodedEmail}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error);
      setErrorMessage("Erreur lors de l'envoi du code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-deep p-4 md:p-0">
      <div className="w-full max-w-md rounded-lg bg-navy-card p-8 shadow-card border border-border">
        <div className="mb-4 flex justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-gold flex items-center justify-center bg-navy-deep">
            <span className="text-gold font-bold text-2xl">L</span>
          </div>
        </div>

        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
          Bienvenue <span className="ml-2 text-2xl">👋</span>
        </h1>

        <p className="mb-6 text-center text-xl text-muted-foreground">
          Enseignez votre email pour recevoir votre code personnel de connexion
        </p>

        {errorMessage && (
          <div className="mb-4 text-center text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-6">
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-border bg-navy-muted p-4 text-sm text-foreground placeholder-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-smooth"
            required
          />
        </form>

        <div className="mb-6 text-center text-sm text-muted-foreground">
          <p>
            En continuant, vous acceptez nos{' '}
            <a href="/terms" className="text-gold hover:text-gold-muted transition-smooth">
              conditions d'utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" className="text-gold hover:text-gold-muted transition-smooth">
              politique de confidentialité
            </a>
          </p>
        </div>

        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading}
          className="mb-6 w-full rounded-lg bg-gold p-4 text-sm text-navy-deep font-semibold hover:bg-gold-muted disabled:opacity-50 transition-smooth"
        >
          {isLoading ? 'Envoi en cours...' : 'Envoyer le code'}
        </Button>
      </div>
    </div>
  );
};

export default LoginEmailPage1; 