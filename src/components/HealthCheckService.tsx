import React, { useEffect } from 'react';
import * as kv from '../utils/supabase/kv_store';
import { toast } from 'sonner@2.0.3';

// Service de vérification de santé pour la connectivité et le nettoyage des données
export default function HealthCheckService() {
  
  useEffect(() => {
    // Vérification de santé toutes les 2 minutes
    const healthCheckInterval = setInterval(async () => {
      try {
        const connectivity = kv.getConnectivityStatus();
        
        // Si on était en mode local et qu'on revient en mode serveur
        if (connectivity.serverAvailable === true && connectivity.lastCheck > 0) {
          const wasLocalMode = localStorage.getItem('crewtech_was_local_mode');
          if (wasLocalMode) {
            console.log('🔄 Reconnexion détectée - mode serveur restauré');
            localStorage.removeItem('crewtech_was_local_mode');
            
            // Notification discrète de reconnexion
            toast.success('Connexion Supabase restaurée', {
              description: 'Synchronisation avec le serveur active',
              duration: 3000
            });
          }
        }
        
        // Marquer le mode local si nécessaire
        if (connectivity.serverAvailable === false) {
          localStorage.setItem('crewtech_was_local_mode', 'true');
        }
        
      } catch (error) {
        console.warn('Health check échoué:', error);
      }
    }, 120000); // 2 minutes
    
    // Nettoyage des anciennes données toutes les 30 minutes
    const cleanupInterval = setInterval(async () => {
      try {
        await cleanupOldData();
      } catch (error) {
        console.warn('Nettoyage des données échoué:', error);
      }
    }, 1800000); // 30 minutes
    
    return () => {
      clearInterval(healthCheckInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  // Fonction de nettoyage des anciennes données
  const cleanupOldData = async () => {
    try {
      console.log('🧹 Nettoyage des anciennes données...');
      
      // Nettoyer les anciennes activités (garder seulement les 100 dernières)
      const activities = await kv.getByPrefix('crewtech:activities:');
      if (activities.length > 100) {
        const sortedActivities = activities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        const oldActivities = sortedActivities.slice(100);
        console.log(`🗑️ Suppression de ${oldActivities.length} anciennes activités`);
        
        for (const activity of oldActivities) {
          await kv.del(`crewtech:activities:${activity.id}`);
        }
      }
      
      // Nettoyer les anciennes notifications lues (plus de 7 jours)
      const notifications = await kv.getByPrefix('crewtech:notifications:');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldNotifications = notifications.filter(notif => 
        notif.read && new Date(notif.created_at) < sevenDaysAgo
      );
      
      if (oldNotifications.length > 0) {
        console.log(`🗑️ Suppression de ${oldNotifications.length} anciennes notifications`);
        for (const notif of oldNotifications) {
          await kv.del(`crewtech:notifications:${notif.id}`);
        }
      }
      
      // Nettoyer les sessions expirées
      const sessionData = localStorage.getItem('crewtech_auth_user');
      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 heures
          
          if (Date.now() - timestamp > SESSION_TIMEOUT) {
            console.log('🗑️ Session expirée supprimée');
            localStorage.removeItem('crewtech_auth_user');
          }
        } catch (error) {
          console.warn('Erreur lors de la vérification de session:', error);
          localStorage.removeItem('crewtech_auth_user');
        }
      }
      
      // Nettoyer les données de cache obsolètes
      const cacheKeys = ['crewtech_local_mode_notification_shown'];
      for (const key of cacheKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          // Réinitialiser certains flags après 24h
          const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
          try {
            const timestamp = parseInt(item);
            if (timestamp && timestamp < dayAgo) {
              localStorage.removeItem(key);
            }
          } catch {
            // Si ce n'est pas un timestamp, on garde
          }
        }
      }
      
      console.log('✅ Nettoyage des données terminé');
      
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
    }
  };

  // Vérification initiale de santé
  useEffect(() => {
    const initialHealthCheck = async () => {
      try {
        const connectivity = kv.getConnectivityStatus();
        const stats = await kv.getStats();
        
        console.log('🏥 Health Check initial:');
        console.log(`   Mode: ${connectivity.mode}`);
        console.log(`   Total données: ${stats.total_keys} clés`);
        console.log(`   Taille estimée: ${(stats.total_size / 1024).toFixed(2)} KB`);
        
        // Vérifier si on a des données
        if (stats.total_keys === 0) {
          console.log('💡 Base de données vide - seeding recommandé');
        }
        
      } catch (error) {
        console.warn('Health check initial échoué:', error);
      }
    };
    
    // Attendre 2 secondes avant le check initial
    setTimeout(initialHealthCheck, 2000);
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
}