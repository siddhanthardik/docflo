export class PlacesService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY!;
  }

  async searchPlaces(query: string) {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Places search failed");
    const data = await res.json();
    return (data.results || []).map((p: any) => ({
      placeId: p.place_id,
      name: p.name,
      formattedAddress: p.formatted_address,
    }));
  }

  async getPlaceDetails(placeId: string) {
    const fields = [
      "name",
      "formatted_address",
      "formatted_phone_number",
      "website",
      "rating",
      "user_ratings_total",
      "opening_hours",
      "photos",
      "editorial_summary",
      "business_status",
      "types",
      "geometry",
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Place details fetch failed");
    const data = await res.json();
    if (!data.result) throw new Error("No place details found");
    return data.result;
  }
}