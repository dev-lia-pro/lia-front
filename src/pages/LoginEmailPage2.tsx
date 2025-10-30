import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import axios from '@/api/axios';
import { useAuthStore } from '@/stores/authStore';

const LoginEmailPage2 = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, intendedPlan, setIntendedPlan } = useAuthStore();

  // Récupérer l'email et le plan depuis les paramètres d'URL
  useEffect(() => {
    const emailFromParams = searchParams.get('email');
    if (emailFromParams) {
      setEmail(decodeURIComponent(emailFromParams));
    }

    // Récupérer et stocker le plan s'il existe dans l'URL
    const planFromParams = searchParams.get('plan');
    if (planFromParams) {
      setIntendedPlan(planFromParams);
    }
  }, [searchParams, setIntendedPlan]);

  // Focus sur le premier input au montage
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    setErrorMessage('');
    
    // Ne permettre que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '');
    
    const newCode = [...code];
    newCode[index] = numericValue;
    setCode(newCode);

    // Passer au champ suivant si une valeur est saisie
    if (numericValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Soumettre automatiquement si tous les champs sont remplis
    // Utiliser setTimeout pour s'assurer que l'état est mis à jour
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      setTimeout(() => {
        handleSubmit(newCode);
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      // Aller au champ précédent si le champ actuel est vide
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      setTimeout(() => {
        handleSubmit(newCode);
      }, 100);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get('/users/');
      return response.data.results[0];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  };

  const handleSubmit = async (codeOverride?: string[]) => {
    const codeString = (codeOverride ?? code).join('');
    if (codeString.length !== 6) {
      setErrorMessage('Veuillez saisir le code complet');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const payload = { email, code: codeString };
      const response = await axios.post('/auth/verify_code/', payload);
      
      // Stocker le token dans localStorage (mais PAS dans le store Zustand encore)
      localStorage.setItem('access_token', response.data.access);

      // Récupérer les informations utilisateur
      const user = await fetchUser();

      // Stocker temporairement l'utilisateur pour la prochaine page
      sessionStorage.setItem('temp_user', JSON.stringify(user));

      // Déterminer la destination
      let destination = '/';

      // Si un plan est choisi, toujours rediriger vers la page d'abonnement
      if (intendedPlan) {
        destination = `/subscription?plan=${intendedPlan}`;
      } else if (!user.first_name || !user.last_name) {
        // Pas de plan + profil incomplet - rediriger vers le profil
        destination = '/profile?onboarding=true';
      } else {
        // Pas de plan + profil complet - dashboard
        destination = '/';
      }

      // Utiliser window.location.href pour forcer un vrai rechargement
      // Cela évite complètement le problème du PublicRoute
      window.location.href = destination;
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      setErrorMessage('Le code est erroné.');
      setCode(['', '', '', '', '', '']);
      
      // Focus sur le premier champ
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    const encodedEmail = encodeURIComponent(email);
    navigate(`/auth/step1?email=${encodedEmail}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-0">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-card border border-border">
        <h1 className="mb-4 text-center text-3xl font-bold text-foreground">
          Code envoyé dans votre boîte mail
        </h1>

        <p className="mb-6 text-center text-xl text-muted-foreground">
          Entrez ci-dessous le code reçu par mail
        </p>

        {errorMessage && (
          <div className="mb-4 text-center text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="mb-6">
          {isLoading ? (
            <div className="text-center text-muted-foreground">Vérification en cours...</div>
          ) : (
            <div className="flex justify-center gap-2 sm:gap-4">
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  data-bwignore
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg border border-border bg-muted text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-smooth"
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Vous n'avez pas reçu le code ?
          </p>
          {!isLoading && (
            <button
              onClick={handleResendCode}
              className="text-sm font-bold text-primary underline hover:text-primary/80 transition-smooth"
            >
              Renvoyer le code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginEmailPage2; 
