import { MissionOrder } from './MissionOrderTypes';
import { EmailData } from './MissionApprovalModal';

export class PDFGenerator {
  private static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static generateMissionHTML(mission: MissionOrder, emailData: EmailData): string {
    const missionType = mission.type === 'service' ? 'Service' : 
                       mission.type === 'freelance' ? 'Freelance' : 'Jour supplémentaire';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ordre de Mission ${mission.id}</title>
        <style>
          @page { 
            size: A4; 
            margin: 20mm; 
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 24px;
            color: #0066cc;
            margin: 0 0 10px 0;
          }
          .mission-id {
            font-size: 14px;
            color: #666;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          .details-table td {
            padding: 8px 15px;
            border: 1px solid #ddd;
            vertical-align: top;
          }
          .details-table td:first-child {
            font-weight: bold;
            background-color: #f8f9fa;
            width: 30%;
          }
          .flight-item {
            background-color: #f8f9fa;
            padding: 10px;
            margin-bottom: 8px;
            border-left: 4px solid #0066cc;
          }
          .fees-section {
            background-color: #f0f8ff;
            padding: 20px;
            border: 1px solid #b8d4f0;
            border-radius: 5px;
          }
          .fees-table {
            width: 100%;
            border-collapse: collapse;
          }
          .fees-table td {
            padding: 8px 0;
            border-bottom: 1px solid #ddd;
          }
          .fees-table td:first-child {
            font-weight: bold;
          }
          .fees-table td:last-child {
            text-align: right;
            font-weight: bold;
          }
          .total-row {
            border-top: 2px solid #0066cc;
            background-color: #e6f2ff;
          }
          .total-row td {
            font-size: 16px;
            padding: 12px 0;
          }
          .notes {
            background-color: #fff8dc;
            padding: 15px;
            border-left: 4px solid #ffa500;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDRE DE MISSION</h1>
          <div class="mission-id">Mission N° ${mission.id}</div>
        </div>

        <div class="section">
          <div class="section-title">DÉTAILS DE LA MISSION</div>
          <table class="details-table">
            <tr>
              <td>Type de mission</td>
              <td>${missionType}</td>
            </tr>
            <tr>
              <td>Équipage</td>
              <td>${mission.crew?.name || 'N/A'}</td>
            </tr>
            <tr>
              <td>Position</td>
              <td>${mission.crew?.position || 'N/A'}</td>
            </tr>
            <tr>
              <td>Aéronef</td>
              <td>${mission.aircraft?.immat || 'N/A'} (${mission.aircraft?.type || 'N/A'})</td>
            </tr>
            <tr>
              <td>Période</td>
              <td>${mission.contract?.startDate ? this.formatDate(mission.contract.startDate) : 'N/A'} au ${mission.contract?.endDate ? this.formatDate(mission.contract.endDate) : 'N/A'}</td>
            </tr>
            <tr>
              <td>Durée</td>
              <td>${emailData.fees.duration} jour(s)</td>
            </tr>
          </table>
        </div>

        ${mission.flights && mission.flights.length > 0 ? `
        <div class="section">
          <div class="section-title">VOLS PROGRAMMÉS</div>
          ${mission.flights.map(flight => `
            <div class="flight-item">
              <strong>${flight.flight || 'N/A'}:</strong> ${flight.departure || 'N/A'} → ${flight.arrival || 'N/A'}
              <br>
              <small>Date: ${flight.date ? this.formatDate(flight.date) : 'N/A'} ${flight.time || ''}</small>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">CALCUL DES HONORAIRES</div>
          <div class="fees-section">
            <table class="fees-table">
              <tr>
                <td>Tarif journalier</td>
                <td>${this.formatCurrency(emailData.fees.dailyRate, emailData.fees.currency)}</td>
              </tr>
              <tr>
                <td>Indemnité journalière (Per Diem)</td>
                <td>${this.formatCurrency(emailData.fees.perDiem, emailData.fees.currency)}</td>
              </tr>
              <tr>
                <td>Nombre de jours</td>
                <td>${emailData.fees.duration}</td>
              </tr>
              <tr style="border-bottom: none;">
                <td colspan="2" style="padding: 15px 0 10px 0;"></td>
              </tr>
              <tr>
                <td>Salaire total (${emailData.fees.duration} jours × ${this.formatCurrency(emailData.fees.dailyRate, emailData.fees.currency)})</td>
                <td>${this.formatCurrency(emailData.fees.totalSalary, emailData.fees.currency)}</td>
              </tr>
              <tr>
                <td>Per Diem total (${emailData.fees.duration} jours × ${this.formatCurrency(emailData.fees.perDiem, emailData.fees.currency)})</td>
                <td>${this.formatCurrency(emailData.fees.totalPerDiem, emailData.fees.currency)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL HONORAIRES</td>
                <td>${this.formatCurrency(emailData.fees.totalFees, emailData.fees.currency)}</td>
              </tr>
            </table>
          </div>
        </div>

        ${mission.contract?.additionalNotes ? `
        <div class="notes">
          <strong>NOTES:</strong><br>
          ${mission.contract.additionalNotes.replace(/\n/g, '<br>')}
        </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${this.formatDate(new Date().toISOString())}</p>
          <p>Ce document est un ordre de mission provisoire sujet à modifications.</p>
        </div>
      </body>
      </html>
    `;
  }

  static generateMissionPDF(mission: MissionOrder, emailData: EmailData): void {
    const htmlContent = this.generateMissionHTML(mission, emailData);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for the content to load then trigger print
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  }

  static downloadPDF(mission: MissionOrder, emailData: EmailData): void {
    // For now, open print dialog - in production you'd want to use a proper PDF library
    this.generateMissionPDF(mission, emailData);
  }

  static generateEmailContent(mission: MissionOrder, emailData: EmailData): string {
    const missionType = mission.type === 'service' ? 'Service' : 
                       mission.type === 'freelance' ? 'Freelance' : 'Jour supplémentaire';
    
    return `
Cher propriétaire,

Veuillez trouver ci-joint l'ordre de mission ${mission.id} pour approbation.

DÉTAILS DE LA MISSION:
- Type: ${missionType}
- Équipage: ${mission.crew?.name || 'N/A'} (${mission.crew?.position || 'N/A'})
- Aéronef: ${mission.aircraft?.immat || 'N/A'} (${mission.aircraft?.type || 'N/A'})
- Période: ${mission.contract?.startDate ? new Date(mission.contract.startDate).toLocaleDateString('fr-FR') : 'N/A'} au ${mission.contract?.endDate ? new Date(mission.contract.endDate).toLocaleDateString('fr-FR') : 'N/A'}
- Durée: ${emailData.fees.duration} jour(s)

HONORAIRES:
- Tarif journalier: ${emailData.fees.dailyRate}€
- Per Diem journalier: ${emailData.fees.perDiem}€
- TOTAL: ${emailData.fees.totalFees}€

${mission.flights && mission.flights.length > 0 ? `
VOLS:
${mission.flights.map(flight => `- ${flight.flight || 'N/A'}: ${flight.departure || 'N/A'} → ${flight.arrival || 'N/A'} (${flight.date ? new Date(flight.date).toLocaleDateString('fr-FR') : 'N/A'} ${flight.time || ''})`).join('\n')}
` : ''}

La mission a été préparée et est en attente de votre autorisation finale.

Cordialement,
L'équipe Operations Vol
    `.trim();
  }
}

export default PDFGenerator;