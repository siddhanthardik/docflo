"use client";

import { Star, MapPin, Phone, Globe, Navigation, Award, AlertCircle, CheckCircle2 } from "lucide-react";

interface Google3PackPreviewProps {
  specialty: string;
  city: string;
  businessName: string;
  userRank: number;
  rating: string | number;
  reviewsCount: number;
  address: string;
  allCompetitors: Array<{
    name: string;
    isYou: boolean;
    rating: string | number;
    reviewCount: number | string;
    rank: number;
  }>;
}

export function Google3PackPreview({
  specialty,
  city,
  businessName,
  userRank,
  rating,
  reviewsCount,
  address,
  allCompetitors,
}: Google3PackPreviewProps) {
  // Take top 3 listings from the search results
  const top3 = allCompetitors.slice(0, 3);
  const isInTop3 = userRank <= 3;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs print-card break-inside-avoid print:break-inside-avoid">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Live Google 3-Pack SERP Visual Preview
            </h2>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Real-time mobile Google Maps simulation for patients searching in {city}
          </p>
        </div>

        {isInTop3 ? (
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Active in Google 3-Pack (Rank #{userRank})
          </span>
        ) : (
          <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Missing from 3-Pack (Position #{userRank})
          </span>
        )}
      </div>

      {/* Google Mobile SERP Container */}
      <div className="p-6 bg-slate-50/60">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          
          {/* Simulated Google Search Bar */}
          <div className="p-3.5 bg-white border-b border-slate-100 flex items-center gap-2.5 text-xs text-slate-700 shadow-2xs">
            <div className="flex items-center gap-1 text-[13px] font-bold tracking-tighter shrink-0 select-none">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
            </div>
            <div className="flex-1 bg-slate-100/90 rounded-full px-3 py-1.5 text-slate-800 font-medium truncate flex items-center gap-2 text-xs">
              <span className="text-slate-400">🔍</span>
              <span>Best {specialty} in {city}</span>
            </div>
          </div>

          {/* Simulated Map Header with Pins */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-100 to-emerald-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="text-xs font-bold text-slate-800">Google Local 3-Pack Results ({city})</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200">
              Updated Live
            </span>
          </div>

          {/* Top 3 Listings */}
          <div className="divide-y divide-slate-100">
            {top3.map((clinic, i) => {
              const isDoctor = clinic.isYou;
              return (
                <div
                  key={i}
                  className={`p-4 sm:p-5 transition-colors ${
                    isDoctor
                      ? "bg-emerald-50/50 border-l-4 border-emerald-500"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                          {clinic.rank}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {clinic.name}
                        </h4>
                        {isDoctor && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                            YOU (RANK #{clinic.rank})
                          </span>
                        )}
                      </div>

                      {/* Rating & Reviews */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-bold text-slate-900">{clinic.rating}</span>
                        <div className="flex items-center text-amber-400 text-[10px]">
                          {"★★★★★".slice(0, 5)}
                        </div>
                        <span className="text-slate-500">({clinic.reviewCount})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-medium">{specialty}</span>
                      </div>

                      {/* Address & Hours */}
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="text-emerald-600 font-semibold">Open</span> ⋅ Closes 8 PM ⋅ {city}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 hover:bg-blue-100 transition-colors" title="Directions">
                        <Navigation className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 transition-colors" title="Call">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notice if not in top 3 */}
          {!isInTop3 && (
            <div className="p-4 bg-amber-50/80 border-t border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">
                  {businessName} is currently outside the Top 3 Google Map Pack (at position #{userRank}).
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Over 78% of high-intent mobile searchers exclusively click clinics inside the 3-Pack above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
