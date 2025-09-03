import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { UserX } from 'lucide-react';
import type { MissionOrder } from './MissionOrderService';

interface ClientRejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: (reason: string) => void;
  mission: MissionOrder;
  isLoading?: boolean;
}

export default function ClientRejectionDialog({
  open,
  onOpenChange,
  onReject,
  mission,
  isLoading = false
}: ClientRejectionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirm = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason.trim());
      setRejectionReason('');
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setRejectionReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-red-600" />
            <span>Rejeter la mission</span>
          </DialogTitle>
          <DialogDescription>
            Mission {mission.id} - Veuillez indiquer la raison du rejet par le client.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Raison du rejet *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Ex: Budget non approuvé, dates non disponibles, mission annulée..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-20"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {rejectionReason.length}/500 caractères
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!rejectionReason.trim() || isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <UserX className="h-4 w-4" />
            )}
            <span>Confirmer le rejet</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}