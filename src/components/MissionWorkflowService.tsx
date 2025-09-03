import { projectId, publicAnonKey } from '../utils/supabase/info';

export class MissionWorkflowService {
  private static getHeaders(accessToken?: string) {
    return {
      'Authorization': `Bearer ${accessToken || publicAnonKey}`,
      'Content-Type': 'application/json',
      'apikey': publicAnonKey
    };
  }

  private static getBaseUrl() {
    return `https://${projectId}.supabase.co/rest/v1`;
  }

  // Clients management
  static async getClients(accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/clients?select=id,name,contact_name,contact_email,contact_phone&order=name.asc`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Mission quotes management
  static async createMissionQuote(missionId: string, clientId: string, feePct: number, currency: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/mission_quotes`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            mission_id: missionId,
            client_id: clientId,
            fee_pct: feePct,
            currency: currency
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create mission quote: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating mission quote:', error);
      throw error;
    }
  }

  static async createMissionQuoteItems(quoteId: string, items: Array<{
    kind: string;
    description: string;
    qty: number;
    unit_price: number;
  }>, accessToken?: string) {
    try {
      const itemsWithQuoteId = items.map(item => ({
        ...item,
        quote_id: quoteId
      }));

      const response = await fetch(
        `${this.getBaseUrl()}/mission_quote_items`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify(itemsWithQuoteId)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create mission quote items: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating mission quote items:', error);
      throw error;
    }
  }

  // Client approval management
  static async generateClientApproval(missionId: string, quoteId: string, clientId: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/generate_client_approval`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            p_mission_id: missionId,
            p_quote_id: quoteId,
            p_client_id: clientId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to generate client approval: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating client approval:', error);
      throw error;
    }
  }

  static async clientApproveQuote(token: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/client_approve_quote`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            p_token: token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to approve quote: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving quote:', error);
      throw error;
    }
  }

  static async clientRejectQuote(token: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/client_reject_quote`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            p_token: token
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to reject quote: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting quote:', error);
      throw error;
    }
  }

  // Mission assignments management
  static async getMissionAssignments(missionId: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/mission_assignments?select=*&mission_id=eq.${missionId}`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch mission assignments: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mission assignments:', error);
      throw error;
    }
  }

  static async upsertAssignment(
    missionId: string, 
    userId: string, 
    position: string, 
    engagement: string,
    dayRate: number,
    currency: string,
    startDate: string,
    endDate: string,
    accessToken?: string
  ) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/upsert_assignment`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            p_mission_id: missionId,
            p_user_id: userId,
            p_position: position,
            p_engagement: engagement,
            p_day_rate: dayRate,
            p_currency: currency,
            p_start_date: startDate,
            p_end_date: endDate
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upsert assignment: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error upserting assignment:', error);
      throw error;
    }
  }

  // Contract management
  static async userHasZeroHourContract(userId: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/user_has_zero_hour_contract?p_user_id=${userId}`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to check zero hour contract: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking zero hour contract:', error);
      throw error;
    }
  }

  // Documents management
  static async createDocument(
    type: string,
    missionId: string,
    userId: string,
    storagePath: string,
    title: string,
    metadata: object,
    accessToken?: string
  ) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/documents`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            type,
            mission_id: missionId,
            user_id: userId,
            storage_path: storagePath,
            title,
            metadata
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  // Supplier invoices management
  static async createSupplierInvoice(
    assignmentId: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    pdfPath: string,
    accessToken?: string
  ) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/supplier_invoices`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            assignment_id: assignmentId,
            invoice_number: invoiceNumber,
            amount,
            currency,
            pdf_path: pdfPath,
            status: 'uploaded'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create supplier invoice: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating supplier invoice:', error);
      throw error;
    }
  }

  static async updateSupplierInvoiceStatus(invoiceId: string, status: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/supplier_invoices?id=eq.${invoiceId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            status
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update supplier invoice status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating supplier invoice status:', error);
      throw error;
    }
  }

  // Workflow tracking
  static async getMissionWorkflowStatus(accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/mission_workflow_status?select=*`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      throw error;
    }
  }

  static async getNotifications(accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/notifications?select=*&order=created_at.desc`,
        {
          headers: this.getHeaders(accessToken)
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Final validation RPC (assumed to exist)
  static async validateAndInvoice(missionId: string, accessToken?: string) {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/rpc/rpc_validate_and_invoice`,
        {
          method: 'POST',
          headers: this.getHeaders(accessToken),
          body: JSON.stringify({
            p_mission_id: missionId
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to validate and invoice: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error validating and invoicing:', error);
      throw error;
    }
  }
}