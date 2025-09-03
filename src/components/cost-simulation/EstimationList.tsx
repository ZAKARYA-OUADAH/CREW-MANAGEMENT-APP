import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Trash2 } from 'lucide-react';
import { CostEstimation } from './CostSimulationTypes';
import { CURRENCIES } from './CostSimulationConstants';

interface EstimationListProps {
  savedEstimations: CostEstimation[];
  currentEstimation: CostEstimation | null;
  onLoadEstimation: (estimation: CostEstimation) => void;
  onDeleteEstimation: (estimationId: string) => void;
}

export default function EstimationList({
  savedEstimations,
  currentEstimation,
  onLoadEstimation,
  onDeleteEstimation
}: EstimationListProps) {
  if (savedEstimations.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Saved Estimations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedEstimations.map((estimation) => (
            <div
              key={estimation.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                currentEstimation?.id === estimation.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => onLoadEstimation(estimation)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={estimation.status === 'draft' ? 'secondary' : 'default'}>
                  {estimation.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteEstimation(estimation.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{estimation.aircraft} - {estimation.position}</p>
                <p className="text-gray-600">
                  {new Date(estimation.startDate).toLocaleDateString()} - {new Date(estimation.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  {estimation.duration} days • {CURRENCIES[estimation.currency as keyof typeof CURRENCIES]?.symbol}
                  {estimation.results?.totalWithMargin?.toLocaleString() || estimation.results?.totalCost.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}