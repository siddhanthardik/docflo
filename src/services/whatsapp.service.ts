import { prisma } from "@/lib/prisma";

interface WhatsAppMessagePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
  parameters?: string[];
}

interface WhatsAppTemplate {
  name: string;
  language: string;
  category: string;
  components: any[];
}

export class WhatsAppService {
  private accessToken: string;
  private phoneNumberId: string;
  private doctorId: string;

  constructor(accessToken: string, phoneNumberId: string, doctorId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.doctorId = doctorId;
  }

  private get baseUrl() {
    return `https://graph.facebook.com/v18.0/${this.phoneNumberId}`;
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = "en",
    parameters: string[] = []
  ) {
    try {
      const components: any[] = [];

      if (parameters.length > 0) {
        components.push({
          type: "body",
          parameters: parameters.map((param) => ({
            type: "text",
            text: param,
          })),
        });
      }

      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Log the message in database
      await prisma.whatsAppMessage.create({
        data: {
          doctorId: this.doctorId,
          patientPhone: to,
          templateName,
          messageType: "TEMPLATE",
          content: payload as any,
          status: response.ok ? "SENT" : "FAILED",
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send message");
      }

      return data;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  async sendTextMessage(to: string, text: string) {
    try {
      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: text,
        },
      };

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      await prisma.whatsAppMessage.create({
        data: {
          doctorId: this.doctorId,
          patientPhone: to,
          messageType: "TEXT",
          content: payload as any,
          status: response.ok ? "SENT" : "FAILED",
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send message");
      }

      return data;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  async sendMediaMessage(
    to: string,
    mediaType: "image" | "document" | "video",
    mediaUrl: string,
    caption?: string
  ) {
    try {
      const payload: any = {
        messaging_product: "whatsapp",
        to,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
        },
      };

      if (caption) {
        payload[mediaType].caption = caption;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      await prisma.whatsAppMessage.create({
        data: {
          doctorId: this.doctorId,
          patientPhone: to,
          messageType: mediaType.toUpperCase(),
          content: payload as any,
          status: response.ok ? "SENT" : "FAILED",
          deliveredAt: response.ok ? new Date() : null,
        },
      });

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send media");
      }

      return data;
    } catch (error) {
      console.error("Error sending WhatsApp media:", error);
      throw error;
    }
  }

  async getTemplates() {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/message_templates`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  async createTemplate(template: WhatsAppTemplate) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/message_templates`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(template),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to create template");
      }

      // Store template in database
      await prisma.whatsAppTemplate.create({
        data: {
          doctorId: this.doctorId,
          name: template.name,
          language: template.language,
          category: template.category,
          components: template.components as any,
          status: data.status || "PENDING",
        },
      });

      return data;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }
}