import { GoogleGenerativeAI } from "@google/generative-ai";
import { SpecialityBenchmark } from "./healthcare-intelligence";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export interface AIAnalysisInput {
  businessName: string;
  specialityData: SpecialityBenchmark;
  scores: {
    overallScore: number;
    gbpScore: number;
    websiteScore: number;
    competitorScore: number;
  };
  metrics: {
    reviewCount: number;
    rating: number;
    competitorAvgReviewCount: number;
  };
}

export async function generateExecutiveSummary(input: AIAnalysisInput) {
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Returning fallback data.");
    return {
      summary: "AI analysis is currently unavailable.",
      strengths: ["Basic profile setup"],
      weaknesses: ["Needs more reviews"],
      swot: { S: "", W: "", O: "", T: "" }
    };
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
  
  const prompt = `
  You are an elite Local SEO Consultant specializing in Medical Healthcare practices. 
  You are auditing a clinic named "${input.businessName}", which specializes in ${input.specialityData.speciality}.
  
  Their Deterministic Scores are:
  - Overall SEO Score: ${input.scores.overallScore}/100
  - GBP Score: ${input.scores.gbpScore}/100
  - Website Score: ${input.scores.websiteScore}/100
  - Competitor Gap Score: ${input.scores.competitorScore}/100
  
  Metrics: They have ${input.metrics.reviewCount} reviews at ${input.metrics.rating} stars.
  Local Competitor Average: ${input.metrics.competitorAvgReviewCount} reviews.
  
  Speciality Context: High value keywords for them include: ${input.specialityData.highValueKeywords.join(', ')}.
  
  Generate a JSON response with the following schema:
  {
    "summary": "A 3-4 sentence punchy executive summary of their current standing, sounding like a consultant.",
    "strengths": ["string", "string"],
    "weaknesses": ["string", "string"],
    "swot": {
      "S": "Strengths",
      "W": "Weaknesses", 
      "O": "Opportunities (mention specific high value keywords)",
      "T": "Threats (competitors)"
    }
  }
  
  DO NOT invent scores. Use the exact scores provided to justify your analysis.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}


