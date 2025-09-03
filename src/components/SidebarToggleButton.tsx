import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SidebarToggleButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  variant?: 'default' | 'icon-only' | 'menu';
  className?: string;
}

export default function SidebarToggleButton({ 
  isCollapsed, 
  onToggle, 
  variant = 'default',
  className = ''
}: SidebarToggleButtonProps) {
  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className={`p-2 ${className}`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isCollapsed ? 'Étendre la navigation' : 'Réduire la navigation'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'menu') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className={`p-2 ${className}`}
      >
        <Menu className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={`${isCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start'} text-gray-600 hover:text-gray-900 hover:bg-gray-100 ${className}`}
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Réduire
        </>
      )}
    </Button>
  );
}