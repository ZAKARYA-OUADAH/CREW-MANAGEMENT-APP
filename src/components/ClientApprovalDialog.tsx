import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { UserCheck } from 'lucide-react';
import type { MissionOrder } from './MissionOrderService';

interface ClientApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (comments?: string) => void;
  mission: MissionOrder;
  isLoading?: boolean;
}

export default function ClientApprovalDialog({
  open,
  onOpenChange,
  onApprove,
  mission,
  isLoading = false
}: ClientApprovalDialogProps) {
  const [comments, setComments] = useState('');

  const handleConfirm = () => {
    onApprove(comments.trim() || undefined);
    setComments('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setComments('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span>Approuver la mission</span>
          </DialogTitle>
          <DialogDescription>
            Mission {mission.id} - Le client approuve cette mission. 
            Vous pouvez ajouter des commentaires optionnels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="approval-comments">Commentaires du client (optionnel)</Label>
            <Textarea
              id="approval-comments"
              placeholder="Ex: Mission approuvée, merci pour la rapidité de traitement..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-20"
              maxLength={300}
            />
            <p className="text-xs text-gray-500">
              {comments.length}/300 caractères
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
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <UserCheck className="h-4 w-4" />
            )}
            <span>Confirmer l'approbation</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}