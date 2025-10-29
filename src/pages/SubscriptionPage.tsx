import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardHeader } from '@/components/DashboardHeader';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { NavigationTab } from '@/types/navigation';
import { useBilling } from '@/hooks/useBilling';
import { useUser } from '@/hooks/useUser';
import { Loader2, Star, Check, X, Crown, Sparkles, RefreshCw, AlertTriangle, Zap } from 'lucide-react';
import apiClient from '@/api/axios';

// Définition des plans
const plans = [
  {
    id: 'freemium',
    name: 'Freemium',
    price: 'Gratuit',
    period: 'Pour toujours',
    description: 'Accès gratuit aux fonctionnalités essentielles',
    features: [
      { text: 'Accès à la plateforme', included: true },
      { text: 'Toutes les fonctionnalités de base', included: true },
      { text: 'Feedback prioritaire', included: true },
      { text: 'Influence sur le développement', included: true },
      { text: 'Support dédié', included: true },
      { text: 'Badge early adopter', included: true },
    ],
    cta: 'Plan actuel',
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '29 €',
    period: '/mois',
    description: 'Accès complet à toutes les fonctionnalités',
    features: [
      { text: 'Messages illimités', included: true },
      { text: 'Projets illimités', included: true },
      { text: 'Toutes les intégrations', included: true },
      { text: 'Support prioritaire 24/7', included: true },
      { text: 'Multi-providers', included: true },
      { text: 'Classification automatique', included: true },
      { text: 'API access', included: false },
    ],
    cta: 'S\'abonner',
    highlighted: true,
    badge: 'Populaire',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sur devis',
    period: '',
    description: 'Solutions entreprise personnalisées',
    features: [
      { text: 'Tout de Premium', included: true },
      { text: 'Déploiement on-premise', included: true },
      { text: 'SLA garanti', included: true },
      { text: 'Formation équipe', included: true },
      { text: 'API illimitée', included: true },
      { text: 'Intégrations custom', included: true },
      { text: 'Account manager dédié', included: true },
    ],
    cta: 'Nous contacter',
    highlighted: false,
  },
];

const SubscriptionPage = () => {
  const [activeTab, setActiveTab] = React.useState<NavigationTab>('accueil');
  const [searchParams] = useSearchParams();
  const planParam = searchParams.get('plan');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { user, loading: userLoading, fetchUser } = useUser();
  const { createSubscription, cancelSubscription, reactivateSubscription, loading: billingLoading, error: billingError } = useBilling();

  useEffect(() => {
    // Rafraîchir les données utilisateur au montage
    fetchUser();
  }, []);

  const handleSubscribe = async () => {
    try {
      await createSubscription();
      // La fonction redirige automatiquement vers Stripe
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const handleCancelClick = () => {
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelSubscription();
      // Rafraîchir les données utilisateur
      await fetchUser();
      setShowCancelDialog(false);
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateSubscription();
      // Rafraîchir les données utilisateur
      await fetchUser();
    } catch (error) {
      console.error('Reactivate error:', error);
    }
  };

  const handleContactEnterprise = () => {
    window.location.href = 'mailto:dev@lia.pro?subject=L-IA%20Enterprise';
  };

  const isLoading = userLoading || billingLoading;

  // Vérifier si l'abonnement est marqué pour annulation
  const isPendingCancellation = user?.subscription && user?.cancel_at_period_end;

  // Formater la date de fin
  const formatEndDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'var(--header-height)', paddingBottom: 'var(--bottom-nav-height)' }}>
        <div className="px-4 py-6 max-w-7xl mx-auto">
          {/* En-tête de la page */}
          <div className="mb-6 md:mb-8 text-center">
            <div className="flex items-center justify-center mb-2">
              <Crown className="h-6 w-6 md:h-8 md:w-8 text-yellow-500 mr-2" />
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Choisissez votre plan</h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground px-4">
              Sélectionnez le plan qui correspond le mieux à vos besoins
            </p>
          </div>

          {/* Message d'erreur */}
          {billingError && (
            <Alert variant="destructive" className="mb-6">
              <X className="h-4 w-4" />
              <AlertDescription>{billingError}</AlertDescription>
            </Alert>
          )}

          {/* Statut de l'abonnement actuel */}
          {user?.subscription && !isPendingCancellation && (
            <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="font-semibold mb-1">✨ Abonnement Premium actif</div>
                <div className="text-sm">
                  {user.subscription_ends_at ? (
                    <>
                      Prochain renouvellement le <strong>{formatEndDate(user.subscription_ends_at)}</strong> pour 29 €
                    </>
                  ) : (
                    <>Renouvellement automatique : <strong>29 € chaque mois</strong></>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Alerte d'annulation en attente */}
          {isPendingCancellation && (
            <Alert className="mb-6 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Annulation programmée</strong>
                <br />
                Votre abonnement Premium restera actif jusqu'au{' '}
                <strong>{user.subscription_ends_at && formatEndDate(user.subscription_ends_at)}</strong>.
                Vous pouvez réactiver votre abonnement à tout moment avant cette date.
              </AlertDescription>
            </Alert>
          )}

          {/* Grille des plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan) => {
              const isCurrentPlan =
                (plan.id === 'freemium' && !user?.subscription) ||
                (plan.id === 'premium' && user?.subscription);

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    isCurrentPlan
                      ? 'border-2 border-yellow-500 shadow-lg'
                      : plan.highlighted
                      ? 'border-2 border-yellow-500/30 shadow-lg md:scale-105'
                      : 'border-border'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-yellow-500 text-black hover:bg-yellow-600">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                      {plan.id === 'premium' && <Star className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />}
                      {plan.id === 'enterprise' && <Crown className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />}
                      {plan.id === 'freemium' && <Zap className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />}
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-base md:text-lg mt-2">
                      <span className="text-2xl md:text-3xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm md:text-base text-muted-foreground ml-2">{plan.period}</span>}
                    </CardDescription>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </CardHeader>

                  <CardContent>
                    {/* Liste des fonctionnalités */}
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {feature.included ? (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Bouton d'action */}
                    <div>
                      {isCurrentPlan && plan.id === 'premium' && !isPendingCancellation ? (
                        <button
                          className="w-full text-center text-sm text-muted-foreground hover:text-foreground underline decoration-dotted underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
                          onClick={handleCancelClick}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Chargement...' : 'Annuler l\'abonnement'}
                        </button>
                      ) : isPendingCancellation && plan.id === 'premium' ? (
                        <Button
                          className="w-full"
                          onClick={handleReactivate}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Réactiver
                            </>
                          )}
                        </Button>
                      ) : plan.id === 'premium' ? (
                        <Button
                          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                          onClick={handleSubscribe}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Chargement...
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              {plan.cta}
                            </>
                          )}
                        </Button>
                      ) : plan.id === 'enterprise' ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={handleContactEnterprise}
                        >
                          {plan.cta}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Questions fréquentes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Comment fonctionne l'abonnement Premium ?
                </h4>
                <p className="text-sm text-muted-foreground">
                  L'abonnement Premium coûte 29 € par mois et se renouvelle automatiquement. Vous pouvez annuler à tout moment depuis cette page, sans frais ni engagement.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Quels moyens de paiement sont acceptés ?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Nous acceptons toutes les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire de paiement sécurisé Stripe. Vos informations de paiement sont chiffrées et sécurisées.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Que se passe-t-il si j'annule mon abonnement ?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vous conservez l'accès Premium jusqu'à la fin de votre période de facturation en cours (visible dans l'alerte orange ci-dessus). Vous pouvez réactiver votre abonnement à tout moment avant cette date. Après la date d'expiration, vous revenez automatiquement au plan Freemium.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Puis-je passer du plan Freemium au Premium ?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Oui, vous pouvez passer au Premium à tout moment en cliquant sur le bouton "S'abonner". L'accès Premium est activé immédiatement après le paiement.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  Comment modifier mon moyen de paiement ?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez modifier votre carte bancaire directement via le portail sécurisé Stripe. Cliquez sur la section "Paiement et factures" ci-dessous pour accéder à vos informations de paiement, consulter vos factures et mettre à jour votre moyen de paiement en toute sécurité.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lien vers le portail client Stripe pour les abonnés Premium */}
          {user?.subscription && (
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Paiement et factures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Accédez au portail sécurisé Stripe pour modifier votre moyen de paiement et consulter vos factures.
                </p>
                <Button
                  onClick={async () => {
                    try {
                      const response = await apiClient.get('/billing/customer_portal/');
                      if (response.data.url) {
                        window.location.href = response.data.url;
                      }
                    } catch (error: any) {
                      console.error('Error opening customer portal:', error);
                      alert(
                        'Le portail client Stripe n\'est pas encore configuré. ' +
                        'Veuillez configurer le portail dans le dashboard Stripe : ' +
                        'https://dashboard.stripe.com/test/settings/billing/portal'
                      );
                    }
                  }}
                  variant="outline"
                  disabled={isLoading}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Ouvrir le portail Stripe
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Dialog de confirmation d'annulation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="max-w-md mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Annuler votre abonnement ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-sm">
              <p>
                Vous êtes sur le point d'annuler votre abonnement Premium (29 €/mois).
              </p>
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="font-semibold text-orange-900 dark:text-orange-100 text-sm">
                  ⏱️ Vous conserverez l'accès jusqu'à la fin de votre période en cours.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Vous pourrez réactiver à tout moment avant expiration.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={billingLoading} className="mt-0">
              Non, conserver
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={billingLoading}
            >
              {billingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Annulation...
                </>
              ) : (
                'Oui, annuler'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SubscriptionPage;
