import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

// Initialize Gemini (Ensure GEMINI_API_KEY is in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// We use Gemini 3.5 Flash for high-speed, highly accurate agentic tasks
const MODEL_NAME = "gemini-3.5-flash";

export class AIAgentsService {
  /**
   * 1. WHATSAPP AI BOOKING ASSISTANT
   * Analyzes WhatsApp messages and decides on the action to take.
   */
  static async runAppointmentAgent(
    doctorId: string,
    incomingMessage: string,
    conversationHistory: string[],
    config: any
  ) {
    try {
      const mode = config.mode || "handoff"; // handoff vs autonomous
      const tone = config.tone || "professional";
      const customRules = config.trainingPrompt || config.customRules || "Consultations are 30 mins. Walk-ins accepted during business hours.";
      const emergencyTriggers = config.emergencyTriggers || "severe pain, bleeding, chest pain, trauma, emergency";

      // Emergency Trigger Check
      const lowerMsg = incomingMessage.toLowerCase();
      const triggers = emergencyTriggers.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      const isEmergency = triggers.some((t: string) => lowerMsg.includes(t));

      if (isEmergency) {
        return "⚠️ **Emergency Alert**: If you are experiencing a medical emergency, severe bleeding, or chest pain, please call emergency services immediately or visit the nearest emergency room. Our staff has been alerted to your message. *(I am the clinic's AI assistant. Type 'human' to speak to staff directly)*";
      }

      const systemPrompt = `
        You are a master-level AI WhatsApp Patient Coordinator for a premium clinic using Gemini 3.5 Flash.
        Conversational Tone: ${tone}.
        
        Clinic Rules & Custom Training Guidelines:
        "${customRules}"

        Your Objective:
        1. Read the patient's incoming message and conversation history.
        2. Accurately answer questions about booking appointments, operating hours, and clinic location.
        3. If the patient wants to book, provide clear booking options or direct them to book online.
        
        Important Safety & Operational Rules:
        - Always be polite, empathetic, and exceptionally helpful.
        - If the patient asks for a human, staff, or doctor, gracefully acknowledge it and confirm staff will contact them.
        - Do NOT provide medical prescriptions or diagnosis under any circumstances.
        - Mandatory Disclaimer: End all responses with: "\n\n*(I am the clinic's AI assistant. Type 'human' to speak to staff directly)*".
      `;

      const prompt = `
        System Instructions: ${systemPrompt}

        Conversation History:
        ${conversationHistory.join("\n")}

        Patient's New Message: "${incomingMessage}"

        Provide your direct WhatsApp response to the patient based on these instructions.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let aiReply = response.text || "Thank you for your message. A staff member will get back to you shortly.";
      
      if (!aiReply.toLowerCase().includes("human")) {
        aiReply += "\n\n*(I am the clinic's AI assistant. Type 'human' to speak to staff directly).*";
      }

      return aiReply;
    } catch (error) {
      console.error("Error in Appointment Agent:", error);
      return "Thank you for your message. We have received it and a staff member will get back to you shortly.\n\n*(I am the clinic's AI assistant. Type 'human' to speak to staff directly).*";
    }
  }

  /**
   * 2. REVIEW MANAGER AGENT
   * Drafts a response to a Google Review incorporating target keywords naturally.
   */
  static async runReviewAgent(reviewText: string, rating: number, config: any) {
    try {
      const instructions = config.instructions || "Always thank the patient by name, mention Gyrex Clinic, and invite negative reviewers to contact us privately.";
      const targetKeywords = config.targetKeywords || "Root Canal, Laser Treatment, Pediatric Care";
      
      const prompt = `
        You are an elite Reputation Management Specialist replying to a Google Business Review on behalf of the clinic owner using Gemini 3.5 Flash.
        
        Review Rating: ${rating} Stars
        Review Text: "${reviewText}"
        
        Custom Guidelines: ${instructions}
        Target Keywords to Weave In Naturally (if relevant): ${targetKeywords}
        
        Your Task:
        - Draft a highly professional, empathetic response.
        - HIPAA Compliance: Never confirm patient medical condition or disclose health details.
        - For 4 & 5-star reviews: Express genuine gratitude and naturally weave in 1 target keyword if contextually appropriate.
        - For 1 to 3-star reviews: De-escalate masterfully, apologize politely, and invite them to email/call the clinic privately.
        
        Respond ONLY with the exact text of the reply. No markdown quotes or extra filler.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      return response.text?.trim() || "Thank you for your feedback.";
    } catch (error) {
      console.error("Error in Review Agent:", error);
      return "Thank you for your review and feedback.";
    }
  }

  /**
   * 3. PROFILE UPDATER AGENT
   * Generates content for a GBP Post.
   */
  static async runProfileAgent(config: any) {
    try {
      const focusAreas = config.focusAreas || "General Care, Preventive Health, Clinic Updates";
      const brandVoice = config.brandVoice || "Informative healthcare tone, max 2 emojis, end with booking phone number.";
      const ctaType = config.ctaType || "LEARN_MORE";
      
      const prompt = `
        You are a master Digital Marketing Director for a premium clinic using Gemini 3.5 Flash.
        Write an engaging, conversion-optimized Google Business Profile post (100-150 words).
        
        Focus Topics: ${focusAreas}
        Brand Voice Guidelines: ${brandVoice}
        CTA Button Type: ${ctaType}
        
        Format the output EXACTLY as a JSON object with this structure (no markdown codeblocks, raw JSON only):
        {
          "title": "Catchy internal title",
          "content": "The actual text of the post with emojis and a clear call to action.",
          "postType": "STANDARD",
          "ctaType": "${ctaType}"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let jsonStr = response.text || "{}";
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error in Profile Agent:", error);
      return null;
    }
  }

  /**
   * 4. LOCAL SEO COPILOT AGENT
   * Generates deep recommendations based on GBP state and target keywords.
   */
  static async runLocalSeoCopilot(profileData: any, config: any) {
    try {
      const focus = config.focus || "all";
      const keywords = config.keywords || "Best clinic near me, specialist near me";
      
      const prompt = `
        You are a master Local SEO Strategist and Technical Consultant using Gemini 3.5 Flash.
        
        Target Keywords to Monitor: ${keywords}
        Focus Area: ${focus}
        
        GBP Data Summary:
        ${JSON.stringify(profileData, null, 2)}
        
        Generate 3-5 high-impact, actionable SEO tasks for this week.
        Format output EXACTLY as a JSON array of objects with no codeblocks or markdown:
        [
          {
            "category": "PROFILE" | "REVIEWS" | "CITATIONS" | "CONTENT" | "KEYWORDS",
            "title": "Short actionable title",
            "description": "Detailed explanation of what to do and why it matters.",
            "priority": "HIGH" | "MEDIUM" | "LOW",
            "impact": "Brief description of estimated impact"
          }
        ]
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let jsonStr = response.text || "[]";
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error in Local SEO Copilot Agent:", error);
      return [
        {
          category: "PROFILE",
          title: "Optimize Business Description for Target Keywords",
          description: "Your current Google Business Profile description lacks primary local keywords. Rewrite the first 250 characters to prominently feature your primary specialty and city name to improve local relevance.",
          priority: "HIGH",
          impact: "Directly boosts ranking for 'Best specialty near me' searches."
        },
        {
          category: "REVIEWS",
          title: "Implement a Review Response Strategy",
          description: "Replying to all reviews (especially with keywords naturally integrated) signals active management to Google's algorithm and builds patient trust.",
          priority: "MEDIUM",
          impact: "Improves conversion rate and slightly boosts local prominence."
        }
      ];
    }
  }
}
