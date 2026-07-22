"use client";

import { CheckCircle2, Plus, Sparkles, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { useLocalSeoModule } from "@/hooks/use-local-seo";
import { Skeleton } from "@/components/ui/skeleton";

const SERVICE_RECOMMENDATIONS: Record<string, string[]> = {
  default: [
    "Spine Surgery",
    "Arthritis Management",
    "Pediatric Orthopedics",
    "Carpal Tunnel Release",
    "Bone Density Scan",
    "Joint Pain Treatment",
    "Ligament Repair",
    "Shoulder Replacement",
  ],
  physio: [
    "Post-Operative Rehabilitation",
    "Dry Needling",
    "Manual Therapy",
    "Kinesio Taping",
    "Sports Massage",
    "Electrotherapy",
    "Hydrotherapy",
  ],
  dent: [
    "Teeth Whitening",
    "Root Canal",
    "Dental Implants",
    "Invisalign",
    "Tooth Extraction",
    "Gum Treatment",
    "Orthodontics",
  ],
  eye: [
    "Cataract Surgery",
    "LASIK",
    "Glaucoma Treatment",
    "Retina Surgery",
    "Diabetic Eye Care",
  ],
  skin: [
    "Acne Treatment",
    "Chemical Peel",
    "Hair Transplant",
    "Laser Hair Removal",
    "Vitiligo Treatment",
  ],
};

function getRecommendations(primaryCategory: string): string[] {
  const cat = primaryCategory.toLowerCase();
  if (cat.includes("physio")) return SERVICE_RECOMMENDATIONS.physio;
  if (cat.includes("dent")) return SERVICE_RECOMMENDATIONS.dent;
  if (cat.includes("eye") || cat.includes("ophthal")) return SERVICE_RECOMMENDATIONS.eye;
  if (cat.includes("skin") || cat.includes("derma")) return SERVICE_RECOMMENDATIONS.skin;
  return SERVICE_RECOMMENDATIONS.default;
}

export default function ServiceInsights() {
  const { data: servicesData, isLoading, error } = useLocalSeoModule<any>('services');

  const services = servicesData?.services || [];
  const primaryCategory = servicesData?.primaryCategory || "Medical Clinic";
  const additionalCategories = servicesData?.additionalCategories || [];

  // Group services by their category
  const groupedServices = useMemo(() => {
    const groups: Record<string, { name: string; services: string[] }> = {};
    
    services.forEach((service: any) => {
      const serviceName = service.freeFormServiceItem?.label?.displayName ||
                          service.structuredServiceItem?.serviceTypeId?.replace(/_/g, ' ') ||
                          null;
      if (!serviceName) return;

      // Get the category from the service item or use primaryCategory
      const categoryId = service.freeFormServiceItem?.category?.displayName ||
                         service.categoryId ||
                         primaryCategory;

      if (!groups[categoryId]) {
        groups[categoryId] = { name: categoryId, services: [] };
      }
      groups[categoryId].services.push(serviceName);
    });
    
    return Object.values(groups);
  }, [services, primaryCategory]);

  const existingServiceNames = useMemo(() => 
    services.map((s: any) => (
      s.freeFormServiceItem?.label?.displayName ||
      s.structuredServiceItem?.serviceTypeId ||
      ""
    ).toLowerCase()),
    [services]
  );

  const recommendations = useMemo(() => {
    const suggestions = getRecommendations(primaryCategory);
    return suggestions.filter(
      (rec) => !existingServiceNames.some((existing: string) => existing.includes(rec.toLowerCase()))
    );
  }, [primaryCategory, existingServiceNames]);

  if (isLoading) {
    return <Skeleton className="h-72 w-full rounded-2xl" />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">Failed to load services data. Try syncing your profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Services on Your Profile</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Fetched live from Google Business Profile · <span className="font-medium text-gray-700">{primaryCategory}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-1.5">
          <RefreshCw className="w-3 h-3" />
          Live Data
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Services */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Active Services ({services.length})
            </h4>
          </div>

          {groupedServices.length > 0 ? (
            <div className="space-y-5">
              {groupedServices.map((group, gIdx) => (
                <div key={gIdx}>
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                    {group.name}
                  </p>
                  <div className="space-y-2">
                    {group.services.map((svc, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm text-gray-800 font-medium">{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-400">
                No services found on your Google Business Profile.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try syncing your profile or add services directly in Google Business Profile.
              </p>
            </div>
          )}

          {/* Additional Categories */}
          {additionalCategories.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Additional Business Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {additionalCategories.map((cat: any, idx: number) => (
                  <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                    {cat.displayName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wider">
              Recommended to Add
            </h4>
          </div>
          <p className="text-xs text-blue-700 mb-4 leading-relaxed">
            These high-value services for <span className="font-bold">{primaryCategory}</span> doctors are commonly searched and can boost your local ranking.
          </p>

          <div className="flex flex-wrap gap-2">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <a
                  key={idx}
                  href="https://business.google.com/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm"
                  title="Click to add in Google Business Profile"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {rec}
                </a>
              ))
            ) : (
              <p className="text-sm text-blue-700 font-medium">
                🎉 Your profile covers all our top recommended services!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
