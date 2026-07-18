import { SpecialityBenchmark } from "./healthcare-intelligence";

export interface RevenueCalculationInput {
  specialityData: SpecialityBenchmark;
  scores: {
    overallScore: number;
    gbpScore: number;
    websiteScore: number;
    competitorScore: number;
  };
}

export interface RevenueCalculationResult {
  assumptions: {
    estimatedLocalSearches: number;
    currentVisibilityShare: number;
    potentialVisibilityShare: number;
    estimatedAdditionalClicks: number;
    estimatedAdditionalCalls: number;
    estimatedAppointments: number;
    averageRevenuePerPatient: number;
  };
  metrics: {
    potentialMonthlyPatients: number;
    potentialMonthlyCalls: number;
    estimatedMonthlyRevenueOpp: number;
    estimatedAnnualRevenueOpp: number;
  };
}

export function calculateRevenueOpportunity(input: RevenueCalculationInput): RevenueCalculationResult {
  // Base volume on speciality competitiveness
  const searchVolume = input.specialityData.speciality === 'Dentist' ? 8000 : 
                       input.specialityData.speciality === 'Urology' ? 3000 : 
                       input.specialityData.speciality === 'IVF & Fertility' ? 4000 : 
                       input.specialityData.speciality === 'Orthopedic' ? 5000 : 2500;
  
  // Visibility is tied linearly to the Overall SEO Score, capped at 40% click share for top 3 pack
  const currentVisibilityShare = (input.scores.overallScore / 100) * 0.05; 
  const potentialVisibilityShare = 0.35; // Target Top 3 Map Pack visibility

  const currentMonthlyTraffic = Math.round(searchVolume * currentVisibilityShare);
  const potentialMonthlyTraffic = Math.round(searchVolume * potentialVisibilityShare);
  
  const estimatedAdditionalClicks = potentialMonthlyTraffic - currentMonthlyTraffic;

  // Conversion rate from traffic to calls ~ 15%
  const callConversionRate = 0.15;
  const currentCalls = Math.round(currentMonthlyTraffic * callConversionRate);
  const potentialCalls = Math.round(potentialMonthlyTraffic * callConversionRate);
  
  const estimatedAdditionalCalls = potentialCalls - currentCalls;

  // Calls to appointments ~ 40%
  const appointmentConversionRate = 0.40;
  const currentAppointments = Math.round(currentCalls * appointmentConversionRate);
  const potentialAppointments = Math.round(potentialCalls * appointmentConversionRate);
  
  const estimatedAppointments = potentialAppointments - currentAppointments;

  // Average Patient Value
  const avgValue = input.specialityData.speciality === 'IVF & Fertility' ? 8000 : 
                   input.specialityData.speciality === 'Orthopedic' ? 3000 : 
                   input.specialityData.speciality === 'Dentist' ? 800 : 500;

  const currentRevenue = currentAppointments * avgValue;
  const potentialRevenue = potentialAppointments * avgValue;
  const estimatedMonthlyRevenueOpp = potentialRevenue - currentRevenue;

  return {
    assumptions: {
      estimatedLocalSearches: searchVolume,
      currentVisibilityShare: Number((currentVisibilityShare * 100).toFixed(1)),
      potentialVisibilityShare: Number((potentialVisibilityShare * 100).toFixed(1)),
      estimatedAdditionalClicks,
      estimatedAdditionalCalls,
      estimatedAppointments,
      averageRevenuePerPatient: avgValue
    },
    metrics: {
      potentialMonthlyPatients: estimatedAppointments,
      potentialMonthlyCalls: estimatedAdditionalCalls,
      estimatedMonthlyRevenueOpp,
      estimatedAnnualRevenueOpp: estimatedMonthlyRevenueOpp * 12
    }
  };
}
