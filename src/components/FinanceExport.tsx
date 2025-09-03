import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { 
  useAllMissionOrders,
  type MissionOrder 
} from './MissionOrderService';
import { useNotifications } from './NotificationContext';
import { 
  Download,
  FileSpreadsheet,
  Calendar,
  Filter,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Plane,
  User,
  FileText,
  FileJson,
  FileX,
  Settings,
  Eye,
  BarChart3
} from 'lucide-react';

// Export format types
type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

// Export utilities
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToExcel = async (data: any[], filename: string) => {
  try {
    // Using SheetJS (xlsx) - this would need to be installed as a dependency
    // For now, we'll fall back to CSV with Excel-specific formatting
    const headers = Object.keys(data[0]);
    const worksheetData = [headers, ...data.map(row => headers.map(header => row[header]))];
    
    // Create a more Excel-friendly CSV
    const csvContent = worksheetData.map(row => 
      row.map(cell => {
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell || '';
      }).join(',')
    ).join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.csv', '.xls'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Excel export error:', error);
    // Fallback to CSV
    exportToCSV(data, filename.replace('.xls', '.csv'));
  }
};

const exportToPDF = async (data: any[], filename: string, summary: any) => {
  try {
    // Create a simple PDF using browser print functionality
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Finance Export Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            h1 { color: #333; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 11px; color: #666; margin-bottom: 5px; }
            .summary-value { font-size: 16px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .amount { text-align: right; }
            .center { text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h1>Finance Export Report</h1>
          <p class="center">Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
          
          <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Missions</div>
                <div class="summary-value">${summary.count}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Salaries</div>
                <div class="summary-value">${summary.salary.toLocaleString()} EUR</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Total Per Diem</div>
                <div class="summary-value">${summary.perDiem.toLocaleString()} EUR</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Grand Total</div>
                <div class="summary-value">${summary.total.toLocaleString()} EUR</div>
              </div>
            </div>
          </div>

          <h2>Mission Details</h2>
          <table>
            <thead>
              <tr>
                <th>Mission ID</th>
                <th>Type</th>
                <th>Crew</th>
                <th>Position</th>
                <th>Period</th>
                <th>Days</th>
                <th class="amount">Daily Rate</th>
                <th class="amount">Total Salary</th>
                <th class="amount">Per Diem</th>
                <th class="amount">Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(mission => `
                <tr>
                  <td>${mission['Mission ID']}</td>
                  <td>${mission['Mission Type']}</td>
                  <td>${mission['Crew Name']}</td>
                  <td>${mission['Position']}</td>
                  <td>${mission['Start Date']} - ${mission['End Date']}</td>
                  <td class="center">${mission['Number of Days']}</td>
                  <td class="amount">${mission['Daily Rate']} ${mission['Currency']}</td>
                  <td class="amount">${mission['Total Salary']} ${mission['Currency']}</td>
                  <td class="amount">${mission['Total Per Diem']} ${mission['Currency']}</td>
                  <td class="amount">${mission['Total Compensation']} ${mission['Currency']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } catch (error) {
    console.error('PDF export error:', error);
    throw error;
  }
};

const exportToJSON = (data: any[], filename: string) => {
  const jsonData = {
    exportDate: new Date().toISOString(),
    exportFormat: 'JSON',
    totalRecords: data.length,
    data: data
  };
  
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format configuration for different export types
const formatConfigs = {
  csv: {
    name: 'CSV',
    description: 'Comma-separated values (Excel compatible)',
    icon: FileSpreadsheet,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    extension: '.csv'
  },
  excel: {
    name: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    icon: FileX,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    extension: '.xls'
  },
  pdf: {
    name: 'PDF',
    description: 'Portable Document Format (for reports)',
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    extension: '.pdf'
  },
  json: {
    name: 'JSON',
    description: 'JavaScript Object Notation (for developers)',
    icon: FileJson,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    extension: '.json'
  }
};

export default function FinanceExport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['freelance', 'extra_day', 'service']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['validated', 'completed']);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [showPreview, setShowPreview] = useState(false);
  
  const { missionOrders, loading, refreshMissionOrders } = useAllMissionOrders();
  const { showToast } = useNotifications();

  // Set default date range (current year)
  useEffect(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    setStartDate(startOfYear.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  // Filter missions based on criteria
  const getFilteredMissions = (): MissionOrder[] => {
    return missionOrders.filter(mission => {
      // Filter by status - only completed/validated missions for finance
      const statusMatch = selectedStatuses.includes(mission.status);
      
      // Filter by type
      const typeMatch = selectedTypes.includes(mission.type);
      
      // Filter by date range (using contract end date or validation date)
      let dateMatch = true;
      if (startDate || endDate) {
        const missionDate = mission.validatedAt || mission.contract?.endDate;
        if (missionDate) {
          const missionDateTime = new Date(missionDate).getTime();
          const startDateTime = startDate ? new Date(startDate).getTime() : 0;
          const endDateTime = endDate ? new Date(endDate + 'T23:59:59').getTime() : Infinity;
          dateMatch = missionDateTime >= startDateTime && missionDateTime <= endDateTime;
        } else {
          dateMatch = false; // Exclude missions without proper dates
        }
      }
      
      return statusMatch && typeMatch && dateMatch;
    });
  };

  const calculateMissionFinancials = (mission: MissionOrder) => {
    if (!mission.contract) {
      return {
        days: 0,
        salaryAmount: 0,
        salaryType: 'daily',
        salaryCurrency: 'EUR',
        dailyRate: 0,
        totalSalary: 0,
        perDiemAmount: 0,
        totalPerDiem: 0,
        grandTotal: 0
      };
    }

    const startDate = mission.contract.startDate ? new Date(mission.contract.startDate) : null;
    const endDate = mission.contract.endDate ? new Date(mission.contract.endDate) : null;
    
    let days = 1;
    if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const salaryAmount = mission.contract.salaryAmount || 0;
    const totalSalary = mission.contract.salaryType === 'daily' 
      ? salaryAmount * days 
      : salaryAmount;
    
    const perDiemAmount = mission.contract.hasPerDiem ? (mission.contract.perDiemAmount || 0) : 0;
    const totalPerDiem = perDiemAmount * days;
    
    return {
      days,
      salaryAmount,
      salaryType: mission.contract.salaryType || 'daily',
      salaryCurrency: mission.contract.salaryCurrency || 'EUR',
      dailyRate: salaryAmount,
      totalSalary,
      perDiemAmount,
      totalPerDiem,
      grandTotal: totalSalary + totalPerDiem
    };
  };

  const prepareExportData = () => {
    const filteredMissions = getFilteredMissions();
    
    return filteredMissions.map(mission => {
      const financials = calculateMissionFinancials(mission);
      const serviceInvoiceTotal = mission.serviceInvoice ? mission.serviceInvoice.total : 0;
      
      return {
        // Mission Info
        'Mission ID': mission.id,
        'Mission Type': mission.type === 'freelance' ? 'Freelance' : 
                       mission.type === 'extra_day' ? 'Extra Day' : 'Service',
        'Status': mission.status === 'validated' ? 'Validated' : 
                 mission.status === 'completed' ? 'Completed' : mission.status,
        'Creation Date': mission.createdAt ? new Date(mission.createdAt).toLocaleDateString('en-US') : '',
        'Validation Date': mission.validatedAt ? new Date(mission.validatedAt).toLocaleDateString('en-US') : '',
        
        // Crew Info
        'Crew Name': mission.crew?.name || 'Unknown',
        'Position': mission.crew?.position || 'Unknown',
        'Crew Type': mission.crew?.type === 'internal' ? 'Internal' : 'External',
        'Email': mission.crew?.email || '',
        
        // Contract Info
        'Start Date': mission.contract?.startDate ? new Date(mission.contract.startDate).toLocaleDateString('en-US') : '',
        'End Date': mission.contract?.endDate ? new Date(mission.contract.endDate).toLocaleDateString('en-US') : '',
        'Number of Days': financials.days,
        'Salary Type': financials.salaryType === 'daily' ? 'Daily' : 'Monthly',
        'Daily Rate': financials.dailyRate,
        'Currency': financials.salaryCurrency,
        
        // Financial Details
        'Total Salary': financials.totalSalary,
        'Per Diem (Unit)': financials.perDiemAmount,
        'Total Per Diem': financials.totalPerDiem,
        'Total Compensation': financials.grandTotal,
        'Service Invoice': serviceInvoiceTotal,
        'Total Mission Cost': financials.grandTotal + serviceInvoiceTotal,
        
        // Aircraft Info
        'Registration': mission.aircraft?.immat || 'Unknown',
        'Aircraft Type': mission.aircraft?.type || 'Unknown',
        
        // Flight Info
        'Number of Flights': mission.flights ? mission.flights.length : 0,
        'Route': mission.flights && mission.flights.length > 0 
          ? mission.flights.map(f => f.departure).concat(mission.flights[mission.flights.length - 1]?.arrival).join(' → ')
          : 'No flights',
        
        // Owner Approval (for extra_day)
        'Owner Approval': mission.type === 'extra_day' && mission.contract?.ownerApproval ? 'Yes' : 
                         mission.type === 'extra_day' ? 'No' : 'N/A',
        
        // Additional Info
        'Contract Notes': mission.contract?.additionalNotes || '',
        'Crew Comments': mission.validation?.crewComments || '',
        'Issues Reported': mission.validation?.issuesReported?.join('; ') || '',
        'Payment Issue': mission.validation?.paymentIssue ? 'Yes' : 'No',
        'Payment Issue Details': mission.validation?.paymentIssueDetails || ''
      };
    });
  };

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      const filteredMissions = getFilteredMissions();
      
      if (filteredMissions.length === 0) {
        showToast('warning', 'No Data', 'No missions match the selected criteria');
        setIsExporting(false);
        return;
      }

      const exportData = prepareExportData();
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const config = formatConfigs[exportFormat];
      const filename = `Finance_Export_Missions_${dateStr}${config.extension}`;
      
      // Calculate summary for PDF
      const summary = {
        count: filteredMissions.length,
        salary: filteredMissions.reduce((sum, m) => sum + calculateMissionFinancials(m).totalSalary, 0),
        perDiem: filteredMissions.reduce((sum, m) => sum + calculateMissionFinancials(m).totalPerDiem, 0),
        total: filteredMissions.reduce((sum, m) => {
          const financials = calculateMissionFinancials(m);
          const serviceInvoice = m.serviceInvoice?.total || 0;
          return sum + financials.grandTotal + serviceInvoice;
        }, 0)
      };

      // Export based on selected format
      switch (exportFormat) {
        case 'csv':
          exportToCSV(exportData, filename);
          break;
        case 'excel':
          await exportToExcel(exportData, filename);
          break;
        case 'pdf':
          await exportToPDF(exportData, filename, summary);
          break;
        case 'json':
          exportToJSON(exportData, filename);
          break;
        default:
          throw new Error('Unknown export format');
      }
      
      showToast('success', 'Export Complete', `${filteredMissions.length} missions exported to ${filename}`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('error', 'Export Error', 'Unable to generate file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleTypeChange = (type: string, checked: boolean) => {
    setSelectedTypes(prev => 
      checked 
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    setSelectedStatuses(prev => 
      checked 
        ? [...prev, status]
        : prev.filter(s => s !== status)
    );
  };

  const filteredMissions = getFilteredMissions();
  const totalFinancials = filteredMissions.reduce((acc, mission) => {
    const financials = calculateMissionFinancials(mission);
    const serviceInvoice = mission.serviceInvoice?.total || 0;
    return {
      salary: acc.salary + financials.totalSalary,
      perDiem: acc.perDiem + financials.totalPerDiem,
      serviceInvoices: acc.serviceInvoices + serviceInvoice,
      total: acc.total + financials.grandTotal + serviceInvoice
    };
  }, { salary: 0, perDiem: 0, serviceInvoices: 0, total: 0 });

  const exportPreviewData = prepareExportData().slice(0, 5); // Show first 5 records

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl text-gray-900">Finance Export</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentConfig = formatConfigs[exportFormat];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900">Finance Export</h1>
          <p className="text-sm text-gray-600">
            Extract financial data from completed missions in multiple formats
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <currentConfig.icon className={`h-5 w-5 ${currentConfig.color}`} />
          <Badge variant="outline" className={`${currentConfig.bgColor} ${currentConfig.color}`}>
            {currentConfig.name} Export
          </Badge>
        </div>
      </div>

      {/* Export Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Export Format</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(formatConfigs).map(([format, config]) => (
              <div
                key={format}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  exportFormat === format
                    ? `border-blue-500 ${config.bgColor}`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExportFormat(format as ExportFormat)}
              >
                <div className="flex items-center space-x-3">
                  <config.icon className={`h-6 w-6 ${config.color}`} />
                  <div>
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-gray-600">{config.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Export Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Mission Types */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Mission Types</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="freelance"
                  checked={selectedTypes.includes('freelance')}
                  onCheckedChange={(checked) => handleTypeChange('freelance', checked as boolean)}
                />
                <Label htmlFor="freelance">Freelance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extra-day"
                  checked={selectedTypes.includes('extra_day')}
                  onCheckedChange={(checked) => handleTypeChange('extra_day', checked as boolean)}
                />
                <Label htmlFor="extra-day">Extra Day</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="service"
                  checked={selectedTypes.includes('service')}
                  onCheckedChange={(checked) => handleTypeChange('service', checked as boolean)}
                />
                <Label htmlFor="service">Service</Label>
              </div>
            </div>
          </div>

          {/* Mission Status */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Status</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validated"
                  checked={selectedStatuses.includes('validated')}
                  onCheckedChange={(checked) => handleStatusChange('validated', checked as boolean)}
                />
                <Label htmlFor="validated">Validated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="completed"
                  checked={selectedStatuses.includes('completed')}
                  onCheckedChange={(checked) => handleStatusChange('completed', checked as boolean)}
                />
                <Label htmlFor="completed">Completed</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Data Summary</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Total Missions</span>
              </div>
              <p className="text-2xl font-semibold">{filteredMissions.length}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Total Salaries</span>
              </div>
              <p className="text-2xl font-semibold">{totalFinancials.salary.toLocaleString()} EUR</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">Total Per Diem</span>
              </div>
              <p className="text-2xl font-semibold">{totalFinancials.perDiem.toLocaleString()} EUR</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">Grand Total</span>
              </div>
              <p className="text-2xl font-semibold text-blue-600">{totalFinancials.total.toLocaleString()} EUR</p>
            </div>
          </div>

          {/* Data Preview */}
          {showPreview && exportPreviewData.length > 0 && (
            <div className="mt-6">
              <Separator className="mb-4" />
              <h4 className="font-medium mb-3">Data Preview (First 5 Records)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left">Mission ID</th>
                      <th className="border border-gray-200 px-3 py-2 text-left">Type</th>
                      <th className="border border-gray-200 px-3 py-2 text-left">Crew Name</th>
                      <th className="border border-gray-200 px-3 py-2 text-left">Period</th>
                      <th className="border border-gray-200 px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportPreviewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2">{row['Mission ID']}</td>
                        <td className="border border-gray-200 px-3 py-2">{row['Mission Type']}</td>
                        <td className="border border-gray-200 px-3 py-2">{row['Crew Name']}</td>
                        <td className="border border-gray-200 px-3 py-2">{row['Start Date']} - {row['End Date']}</td>
                        <td className="border border-gray-200 px-3 py-2 text-right">{row['Total Compensation']} {row['Currency']}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredMissions.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    ... and {filteredMissions.length - 5} more records
                  </p>
                )}
              </div>
            </div>
          )}

          {filteredMissions.length === 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No missions match the selected criteria. Adjust your filters to view data.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">Export to {currentConfig.name}</h3>
              <p className="text-sm text-gray-600">
                {currentConfig.description} • {filteredMissions.length} missions selected
              </p>
            </div>
            <Button
              onClick={exportData}
              disabled={isExporting || filteredMissions.length === 0}
              className={`${currentConfig.color.replace('text-', 'bg-').replace('-600', '-600')} hover:${currentConfig.color.replace('text-', 'bg-').replace('-600', '-700')}`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to {currentConfig.name}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Format-specific instructions */}
      <Alert className={`border-blue-200 ${currentConfig.bgColor}`}>
        <currentConfig.icon className={`h-4 w-4 ${currentConfig.color}`} />
        <AlertDescription>
          <div className={`${currentConfig.color} text-sm`}>
            <strong>{currentConfig.name} Export Information:</strong>
            {exportFormat === 'csv' && (
              <p>CSV files are compatible with Excel, Google Sheets, and most spreadsheet applications. Contains all mission data with proper encoding for international characters.</p>
            )}
            {exportFormat === 'excel' && (
              <p>Excel format optimized for Microsoft Excel with proper cell formatting. May fall back to CSV if Excel libraries are unavailable.</p>
            )}
            {exportFormat === 'pdf' && (
              <p>PDF format creates a printable report with summary statistics and detailed mission table. Perfect for presentations and archival.</p>
            )}
            {exportFormat === 'json' && (
              <p>JSON format provides structured data ideal for developers, APIs, and data analysis tools. Includes metadata and full mission details.</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}