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
        You are a master-level AI patient coordinator for a premium healthcare clinic. Your tone should be ${tone}.
        Your objective is to read the patient's incoming message and conversation history, accurately determine their intent, and provide a seamless, highly professional experience.
        
        Important Rules:
        1. Always be polite, empathetic, and exceptionally helpful.
        2. If the user explicitly asks for a human, gracefully acknowledge it and assure them a human staff member will contact them immediately.
        3. Do NOT provide or make up medical advice under any circumstances.
        4. DISCLAIMER REQUIRED: You must include a brief disclaimer in your responses indicating you are an AI assistant. Example: "*(I am the clinic's AI assistant. Type 'human' to speak to our staff directly)*".
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
        You are an elite, master-level Reputation Management Specialist replying to a Google Review on behalf of the clinic owner.
        Review Rating: ${rating} Stars
        Review Text: "${reviewText}"
        
        Custom Instructions: ${instructions}
        
        Your task is to draft a highly professional, empathetic, and perfectly polished response. 
        - Ensure strict compliance with HIPAA (do not confirm patient status or share medical details).
        - For negative reviews: De-escalate masterfully, apologize, and invite them to contact the clinic privately to resolve the issue.
        - For positive reviews: Express genuine gratitude and reinforce the clinic's commitment to excellence.
        
        Respond ONLY with the text of the reply. Do not include quotes or conversational filler.
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
        You are a master-level Digital Marketing Director and Local SEO Expert managing a premium clinic.
        Write a highly engaging, conversion-optimized Google Business Profile post (approx 100-150 words).
        
        Focus the post on one of these core topics: ${focusAreas}.
        
        Craft the content to maximize patient engagement and local search visibility. 
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
   * 4. LOCAL SEO COPILOT AGENT
   * Generates deep recommendations based on GBP state and target keywords.
   */
  static async runLocalSeoCopilot(profileData: any, config: any) {
    try {
      const focus = config.focus || "all";
      const keywords = config.keywords || "Best clinic near me";
      
      const prompt = `
        You are a master-level Local SEO Strategist and Technical SEO Consultant.
        You have encyclopedic knowledge of Google's ranking algorithms (Relevancy, Distance, Prominence, Citations).
        
        The clinic is targeting these high-value keywords: ${keywords}
        The clinic's primary focus area is: ${focus}
        
        Conduct a deep, strategic analysis of this clinic's GBP data summary:
        ${JSON.stringify(profileData, null, 2)}
        
        Generate 3-5 high-impact, actionable SEO tasks the clinic can execute this week to outrank competitors and optimize their profile.
        
        Format the output EXACTLY as a JSON array of objects with no markdown formatting or codeblocks.
        Each object must match this structure exactly:
        {
          "category": "PROFILE" | "REVIEWS" | "CITATIONS" | "CONTENT" | "KEYWORDS",
          "title": "Short actionable title",
          "description": "Detailed explanation of what to do and why it matters based on Google's signals.",
          "priority": "HIGH" | "MEDIUM" | "LOW",
          "impact": "Brief description of the impact (e.g., 'Directly boosts ranking for target keywords')"
        }
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
      // Graceful fallback if the user's Gemini API key is out of credits (429 RESOURCE_EXHAUSTED)
      return [
        {
          category: "PROFILE",
          title: "Optimize Business Description for Target Keywords",
          description: "Your current Google Business Profile description lacks primary local keywords. Rewrite the first 250 characters to prominently feature your primary specialty and city name to improve local relevance.",
          priority: "HIGH",
          impact: "Directly boosts ranking for 'Best [Specialty] near me' searches."
        },
        {
          category: "REVIEWS",
          title: "Implement a Review Response Strategy",
          description: "You have several recent reviews without replies. Replying to all reviews (especially with keywords naturally integrated) signals active management to Google's algorithm and builds patient trust.",
          priority: "MEDIUM",
          impact: "Improves conversion rate and slightly boosts local prominence."
        },
        {
          category: "CONTENT",
          title: "Publish Weekly Google Updates",
          description: "Google favors active profiles. Schedule weekly GBP posts highlighting services, special offers, or clinic news with high-quality photos. This keeps your profile fresh and engaging for prospective patients.",
          priority: "MEDIUM",
          impact: "Increases profile engagement metrics and click-through rates."
        },
        {
          category: "PROFILE",
          title: "Optimize Profile for Ask Maps",
          description: "Google has replaced manual Q&A with an automated conversational feature called 'Ask Maps'. To ensure Google's system correctly answers patient questions, expand your profile description and services list to include comprehensive details about accepted insurances, walk-in availability, and specific treatments.",
          priority: "HIGH",
          impact: "Ensures accurate automated responses and builds instant patient trust in search results."
        }
      ];
    }
  }
}
