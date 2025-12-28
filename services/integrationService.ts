
import { MOCK_TENANTS } from "../constants";

/**
 * Aurum Integration Service (Multi-tenant)
 * Maneja la comunicación con n8n y API Waha basada en el tenantId
 */

export const sendWhatsAppMessage = async (tenantId: string, phone: string, message: string) => {
  const tenant = MOCK_TENANTS.find(t => t.id === tenantId);
  if (!tenant || !tenant.integrationSettings.wahaUrl) {
    console.error(`[WAHA] No config found for tenant ${tenantId}`);
    return { success: false, error: 'No configuration' };
  }

  const { wahaUrl, wahaToken } = tenant.integrationSettings;
  console.log(`[WAHA] (${tenant.companyName}) Enviando a ${phone}...`);
  
  try {
    const response = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wahaToken}`
      },
      body: JSON.stringify({
        chatId: `${phone}@c.us`,
        text: message,
        session: 'default'
      }),
    });
    return { success: response.ok, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("Waha Error:", error);
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
