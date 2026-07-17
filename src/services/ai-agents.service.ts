import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { GBPService } from "@/services/gbp.service";

// Initialize Gemini (Ensure GEMINI_API_KEY is in .env)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// We use Gemini 2.5 Flash as it is extremely fast and cost-effective for agentic tasks
const MODEL_NAME = "gemini-2.5-flash";

export class AIAgentsService {
  /**
   * 1. APPOINTMENT AGENT
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

      const systemPrompt = `
        You are an AI medical receptionist for a clinic. Your tone should be ${tone}.
        Your job is to read the patient's incoming message and the conversation history, and determine the intent.
        
        Important Rules:
        1. Always be polite and empathetic.
        2. If the user explicitly asks for a human, respond acknowledging that a staff member will contact them.
        3. Do NOT make up medical advice.
        4. I am an AI assistant. Type 'human' to speak to staff. (Always include a variation of this fallback in your first response).
      `;

      const prompt = `
        System Instructions: ${systemPrompt}

        Conversation History:
        ${conversationHistory.join("\n")}

        Patient's New Message: "${incomingMessage}"

        Provide your response directly to the patient based on the instructions.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let aiReply = response.text || "Thank you for your message. A staff member will get back to you shortly.";
      
      // Fallback injection for safety
      if (!aiReply.toLowerCase().includes("human")) {
          aiReply += "\n\n*(I am an AI assistant. Type 'human' to speak to our staff directly).*";
      }

      return aiReply;
    } catch (error) {
      console.error("Error in Appointment Agent:", error);
      return "Thank you for your message. We have received it and will get back to you shortly.";
    }
  }

  /**
   * 2. REVIEW MANAGER AGENT
   * Drafts a response to a Google Review.
   */
  static async runReviewAgent(reviewText: string, rating: number, config: any) {
    try {
      const instructions = config.instructions || "Always mention our clinic name and thank them for choosing us.";
      
      const prompt = `
        You are the clinic owner replying to a Google Review.
        Review Rating: ${rating} Stars
        Review Text: "${reviewText}"
        
        Custom Instructions: ${instructions}
        
        Draft a professional, empathetic, and compliant response. Do not include HIPAA-sensitive information.
        If it's a negative review, apologize and ask them to contact the clinic privately.
        If it's a positive review, express gratitude.
        Respond ONLY with the text of the reply.
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      return response.text?.trim() || "Thank you for your feedback.";
    } catch (error) {
      console.error("Error in Review Agent:", error);
      return "Thank you for your review.";
    }
  }

  /**
   * 3. PROFILE UPDATER AGENT
   * Generates content for a GBP Post.
   */
  static async runProfileAgent(config: any) {
    try {
      const focusAreas = config.focusAreas || "General Dental Care, Oral Hygiene, Clinic Updates";
      
      const prompt = `
        You are a highly skilled social media manager and local SEO expert for a clinic.
        Write a highly engaging Google Business Profile post (approx 100-150 words).
        
        Focus the post on one of these topics: ${focusAreas}.
        
        Format the output EXACTLY as a JSON object with this structure (no markdown formatting, no codeblocks, just the JSON):
        {
          "title": "A catchy title for internal reference",
          "content": "The actual text of the post with emojis and a clear call to action.",
          "postType": "STANDARD",
          "ctaType": "LEARN_MORE"
        }
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let jsonStr = response.text || "{}";
      // Clean up markdown code blocks if the LLM adds them despite instructions
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error in Profile Agent:", error);
      return null;
    }
  }

  /**
   * 4. RANKING ENGINE AGENT
   * Generates actionable local SEO tasks based on keywords.
   */
  static async runRankingAgent(config: any) {
    try {
      const keywords = config.keywords || "Best clinic near me";
      
      const prompt = `
        You are an expert Local SEO Consultant analyzing a clinic's performance.
        The clinic is trying to rank for these keywords: ${keywords}.
        
        Generate 3 highly specific, actionable tasks the clinic owner can do this week to improve their Google Maps ranking for these keywords.
        
        Format the output EXACTLY as a JSON array of strings (no markdown, no codeblocks). Example:
        ["Task 1 details...", "Task 2 details...", "Task 3 details..."]
      `;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });

      let jsonStr = response.text || "[]";
      jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("Error in Ranking Agent:", error);
      return [];
    }
  }
}
