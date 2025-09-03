import { useState, useEffect } from 'react';

export function useSidebarCollapse() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    // Vérifier si nous sommes côté client
    if (typeof window === 'undefined') return false;
    
    try {
      // Récupérer la préférence sauvegardée dans localStorage
      const saved = localStorage.getItem('sidebar-collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      console.warn('Erreur lors de la lecture du localStorage:', error);
      return false;
    }
  });

  // Sauvegarder la préférence quand elle change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde dans localStorage:', error);
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return {
    isCollapsed,
    toggleSidebar,
    setIsCollapsed
  };
}