
import { MOCK_TENANTS } from "../constants";
import { fetchWithAuth } from "./persistenceService";

/**
 * Aurum Integration Service (Multi-tenant)
 * Maneja la comunicación con n8n y API Waha basada en el tenantId
 */

export const sendWhatsAppMessage = async (tenantId: string, phone: string, message: string) => {
  // Now using backend proxy /api/whatsapp/send
  // TenantId is passed as session for multi-tenancy support in WAHA if configured
  console.log(`[WAHA] Sending to ${phone} via Backend Proxy...`);
  
  try {
    const response = await fetchWithAuth('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: `${phone.replace('+', '')}@c.us`,
        text: message,
        session: 'default' // Using default session for now, could use tenantId
      }),
    });

    if (!response.ok) {
        throw new Error(`Backend Error: ${response.status}`);
    }

    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Waha/Backend Error:", error);
    return { success: false, error };
  }
};

export const triggerN8nWorkflow = async (tenantId: string, event: string, data: any) => {
  const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
  if (!tenant || !tenant.integrationSettings.n8nWebhook) {
    console.error(`[n8n] No config found for tenant ${tenantId}`);
    return { success: false, error: 'No configuration' };
  }

  const { n8nWebhook } = tenant.integrationSettings;
  console.log(`[n8n] (${tenant.companyName}) Disparando evento: ${event}`);
  
  try {
    const response = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        tenantId,
        companyName: tenant.companyName,
        payload: data,
        timestamp: new Date().toISOString()
      }),
    });
    return { success: response.ok };
  } catch (error) {
    console.error("n8n Error:", error);
    return { success: false };
  }
};
