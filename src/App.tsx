import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import {Index} from "./pages";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import NotFound from "./pages/NotFound";
import LoginEmailPage1 from "./pages/LoginEmailPage1";
import LoginEmailPage2 from "./pages/LoginEmailPage2";
import UserProfile from "./pages/UserProfile";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import EventsPage from "./pages/EventsPage";
import MessagesPage from "./pages/MessagesPage";
import DrivePage from "./pages/DrivePage";
import SettingsPage from "./pages/SettingsPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import OAuthSuccess from "./pages/OAuthSuccess";
import OAuthError from "./pages/OAuthError";
import { usePushNotifications } from "./hooks/usePushNotifications";
import { usePostHogIdentify } from "./hooks/usePostHogIdentify";

const App = () => {
  const { initializeAuth } = useAuthStore();

  // Initialize push notifications for native platforms
  usePushNotifications();

  // Identifier l'utilisateur dans PostHog
  usePostHogIdentify();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ThemeProvider>
      <TooltipProvider>
        <NotificationProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
          {/* Routes protégées - nécessitent une authentification */}
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />
          
          {/* Routes publiques - accessibles seulement si NON connecté */}
          <Route path="/auth/step1" element={
            <PublicRoute>
              <LoginEmailPage1 />
            </PublicRoute>
          } />
          
          <Route path="/auth/step2" element={
            <PublicRoute>
              <LoginEmailPage2 />
            </PublicRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute>
              <ProjectsPage />
            </ProtectedRoute>
          } />

          <Route path="/tasks" element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          } />

          <Route path="/events" element={
            <ProtectedRoute>
              <EventsPage />
            </ProtectedRoute>
          } />

          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />

          <Route path="/drive" element={
            <ProtectedRoute>
              <DrivePage />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          <Route path="/subscription" element={
            <ProtectedRoute>
              <SubscriptionPage />
            </ProtectedRoute>
          } />

          {/* Routes OAuth callback (redirigées par le backend) */}
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/oauth-error" element={<OAuthError />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
  }

export default App;
