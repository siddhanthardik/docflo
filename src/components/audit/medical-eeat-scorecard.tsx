"use client";

import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Star, Building, Lock, Clock, Image, FileText } from "lucide-react";

interface MedicalEEATScorecardProps {
  businessName: string;
  specialty: string;
  userRank: number;
  rating: number | string;
  reviewsCount: number;
  compAvgReviews: number;
  hasWebsite: boolean;
  isHttps: boolean;
  hasOpeningHours: boolean;
  hasPhone: boolean;
  hasPhotos: boolean;
  categoriesCount: number;
}

export function MedicalEEATScorecard({
  businessName,
  specialty,
  userRank,
  rating,
  reviewsCount,
  compAvgReviews,
  hasWebsite,
  isHttps,
  hasOpeningHours,
  hasPhone,
  hasPhotos,
  categoriesCount,
}: MedicalEEATScorecardProps) {
  // Calculate EEAT Trust Score
  let score = 0;
  if (reviewsCount >= 50) score += 25;
  else if (reviewsCount >= 10) score += 15;
  else if (reviewsCount > 0) score += 5;

  const numericRating = typeof rating === "number" ? rating : parseFloat(rating) || 0;
  if (numericRating >= 4.7) score += 25;
  else if (numericRating >= 4.2) score += 15;
  else if (numericRating >= 3.5) score += 10;

  if (hasWebsite && isHttps) score += 20;
  else if (hasWebsite) score += 10;

  if (hasOpeningHours) score += 10;
  if (hasPhone) score += 10;
  if (categoriesCount >= 3) score += 10;
  else if (categoriesCount >= 1) score += 5;

  const eeatScore = Math.min(100, score);
  const reviewGap = Math.max(0, compAvgReviews - reviewsCount);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Medical EEAT & Trust Signals Scorecard
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Google's Experience, Expertise, Authoritativeness & Trustworthiness audit for healthcare
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-extrabold text-emerald-600 leading-none">{eeatScore}/100</div>
            <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
              {eeatScore >= 80 ? "High Trust Rating" : eeatScore >= 60 ? "Moderate Trust" : "Trust Deficit"}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Core EEAT Trust Badges Grid */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* 1. Category Precision */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Medical Category Precision</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">Verified as <span className="font-semibold text-slate-800">{specialty}</span> with {categoriesCount} secondary categories.</p>
            </div>
          </div>

          {/* 2. SSL Medical Website */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              hasWebsite && isHttps ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {hasWebsite && isHttps ? <Lock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Encrypted Clinical Website</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hasWebsite && isHttps ? "Secure HTTPS domain connected." : "Missing secure website link on Google."}
              </p>
            </div>
          </div>

          {/* 3. Patient Reputation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              numericRating >= 4.5 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Patient Sentiment ({numericRating}★)</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {numericRating >= 4.5 ? "Meets Google's 4.5★+ patient preference threshold." : "Below local 4.5★ competitor benchmark."}
              </p>
            </div>
          </div>

          {/* 4. Consultation Hours */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              hasOpeningHours ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {hasOpeningHours ? <Clock className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Operating Consultation Hours</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hasOpeningHours ? "Configured for 'Open Now' search filters." : "Missing hours, loses 'open now' patients."}
              </p>
            </div>
          </div>

          {/* 5. Direct Patient Line */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              hasPhone ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}>
              {hasPhone ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Direct Contact Line</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hasPhone ? "Verified phone line connected for instant calls." : "Missing direct phone number."}
              </p>
            </div>
          </div>

          {/* 6. Visual Media Assets */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              hasPhotos ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}>
              {hasPhotos ? <Image className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Clinic Interior & Facility Media</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {hasPhotos ? "Published clinical media verified." : "Recommended: Upload 20+ clinic & staff photos."}
              </p>
            </div>
          </div>

        </div>

        {/* Review Deficit & Competitive Momentum Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Patient Review Momentum Benchmark:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {reviewsCount} vs {compAvgReviews} Avg
              </span>
            </div>
            <div className="text-[11px] text-slate-600">
              {userRank === 1 ? (
                reviewGap > 0 ? (
                  <>Your clinic holds the <span className="font-bold text-emerald-700">#1 position on Google Maps</span>! Adding <span className="font-bold text-indigo-700">~{reviewGap} more reviews</span> will defend your top rank against high-volume competitors.</>
                ) : (
                  <>Your clinic holds the <span className="font-bold text-emerald-700">#1 position</span> and leads the local review benchmark!</>
                )
              ) : (
                reviewGap > 0 ? (
                  <>Your clinic has a gap of <span className="font-bold text-rose-600">{reviewGap} reviews</span> behind the local competitor average to reach the #1 position.</>
                ) : (
                  <>Your clinic has strong review volume ({reviewsCount} reviews). Optimize secondary categories to climb to #1.</>
                )
              )}
            </div>
          </div>

          <div className="w-full sm:w-48 space-y-1">
            <div className="flex justify-between text-[10px] font-semibold text-slate-600">
              <span>You: {reviewsCount}</span>
              <span>Avg: {compAvgReviews}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${Math.min(100, Math.round((reviewsCount / Math.max(compAvgReviews, 1)) * 100))}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
