import { GbpSnapshot } from "@prisma/client";
import { RuleObservation } from "./types";

export function evaluateRules(current: GbpSnapshot, previous: GbpSnapshot | null): RuleObservation[] {
  const observations: RuleObservation[] = [];
  
  // Rule 1: No posts recently
  if (current.postCount === 0 || (current.postCount === null) || (previous && current.postCount === previous.postCount)) {
    observations.push({
      ruleMetadata: {
        id: "RULE_NO_RECENT_POSTS",
        version: "1.0.0",
        name: "Stagnant Post Velocity",
        category: "Content Strategy",
        description: "Detects if the GBP profile has stopped publishing regular updates.",
        apiSource: "GET /v1/locations/{locationId}/localPosts",
        fieldMapping: "Response length of localPosts array"
      },
      detectedValue: current.postCount?.toString() || "0",
      observationText: "No new Google Posts detected recently.",
      evidence: `Your profile currently has ${current.postCount || 0} posts total.`,
      reason: "Profiles with regular posts (1-2x/week) receive higher engagement and local ranking bumps.",
      title: "Publish a new clinic update",
      priority: "HIGH",
      estimatedEffort: "10 minutes",
      expectedImpact: "High",
      confidenceScore: 95
    });
  }

  // Rule 2: Unanswered reviews
  if (current.unansweredReviews && current.unansweredReviews > 0) {
    observations.push({
      ruleMetadata: {
        id: "RULE_UNANSWERED_REVIEWS",
        version: "1.0.0",
        name: "Unanswered Reviews Detection",
        category: "Reputation Management",
        description: "Identifies reviews that lack an owner response.",
        apiSource: "GET /v1/locations/{locationId}/reviews",
        fieldMapping: "Count of reviews where reviewReply is missing"
      },
      detectedValue: current.unansweredReviews.toString(),
      observationText: `You have ${current.unansweredReviews} unanswered reviews.`,
      evidence: "Google prioritizes businesses that respond to customer feedback.",
      reason: "Responding to reviews (both positive and negative) signals active management to Google's algorithm.",
      title: "Respond to pending reviews",
      priority: "HIGH",
      estimatedEffort: "15 minutes",
      expectedImpact: "High",
      confidenceScore: 100
    });
  }
  
  // Rule 3: Missing Booking URL
  if (current.hasAppointmentUrl === false) {
    observations.push({
      ruleMetadata: {
        id: "RULE_MISSING_BOOKING_URL",
        version: "1.0.0",
        name: "Missing Appointment Link",
        category: "Conversion Optimization",
        description: "Checks if the profile has a direct appointment booking URL configured.",
        apiSource: "GET /v1/locations/{locationId}",
        fieldMapping: "location.regularHours & location.profile.attributes"
      },
      detectedValue: "false",
      observationText: "No Appointment URL configured.",
      evidence: "Your GBP profile is missing a direct booking link.",
      reason: "Adding an appointment link directly increases conversion rates from local searches.",
      title: "Add Appointment URL to Profile",
      priority: "MEDIUM",
      estimatedEffort: "5 minutes",
      expectedImpact: "High",
      confidenceScore: 100
    });
  }

  // If no tasks triggered, return a maintenance task
  if (observations.length === 0) {
    observations.push({
      ruleMetadata: {
        id: "RULE_ALL_CLEAR",
        version: "1.0.0",
        name: "Profile Optimized",
        category: "Maintenance",
        description: "No actionable issues detected in the current scan.",
        apiSource: "Aggregate",
        fieldMapping: "Aggregate"
      },
      detectedValue: "SUCCESS",
      observationText: "Profile is fully optimized based on current scan.",
      evidence: "All core metrics look healthy.",
      reason: "Consistent check-ins ensure no new issues arise.",
      title: "Review monthly analytics",
      priority: "LOW",
      estimatedEffort: "5 minutes",
      expectedImpact: "Low",
      confidenceScore: 90
    });
  }

  return observations;
}
