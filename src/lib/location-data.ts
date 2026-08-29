// Comprehensive Location Hierarchy Data for India & Global Clinics

export interface StateCityData {
  state: string;
  cities: {
    name: string;
    pincodes: string[];
  }[];
}

export const INDIA_LOCATION_DATA: StateCityData[] = [
  {
    state: "Jharkhand",
    cities: [
      { name: "Koderma", pincodes: ["825409", "825410", "825413", "825418", "825421"] },
      { name: "Ranchi", pincodes: ["834001", "834002", "834003", "834004", "834005", "834006", "834008", "834009", "834010"] },
      { name: "Dhanbad", pincodes: ["826001", "826004", "828101", "828104", "828109", "828111", "828201"] },
      { name: "Jamshedpur", pincodes: ["831001", "831002", "831003", "831004", "831005", "831011", "831012"] },
      { name: "Bokaro", pincodes: ["827001", "827003", "827004", "827006", "827009", "827010", "827012"] },
      { name: "Hazaribagh", pincodes: ["825301", "825302", "825303", "825319", "825411"] },
      { name: "Deoghar", pincodes: ["814112", "814113", "814114", "814120", "814142"] },
      { name: "Giridih", pincodes: ["815301", "815302", "815312", "815316"] },
      { name: "Ramgarh", pincodes: ["829122", "829101", "829117", "829126"] },
      { name: "Dumka", pincodes: ["814101", "814102", "814110"] },
      { name: "Palamu (Daltonganj)", pincodes: ["822101", "822102", "822118"] },
      { name: "Chaibasa", pincodes: ["833201", "833202", "833215"] },
    ]
  },
  {
    state: "Bihar",
    cities: [
      { name: "Patna", pincodes: ["800001", "800002", "800003", "800004", "800006", "800013", "800020", "800024", "800025"] },
      { name: "Gaya", pincodes: ["823001", "823002", "823003", "824231"] },
      { name: "Muzaffarpur", pincodes: ["842001", "842002", "842003", "842004", "843119"] },
      { name: "Bhagalpur", pincodes: ["812001", "812002", "812003", "812007"] },
      { name: "Darbhanga", pincodes: ["846001", "846002", "846003", "846004"] },
      { name: "Purnia", pincodes: ["854301", "854302", "854303"] },
      { name: "Begusarai", pincodes: ["851101", "851117", "851204"] },
      { name: "Samastipur", pincodes: ["848101", "848102", "848114"] },
      { name: "Munger", pincodes: ["811201", "811202", "811214"] },
      { name: "Chapra (Saran)", pincodes: ["841301", "841302", "841311"] },
      { name: "Nawada", pincodes: ["805110", "805111", "805123"] },
      { name: "Arrah (Bhojpur)", pincodes: ["802301", "802302", "802312"] },
      { name: "Sasaram (Rohtas)", pincodes: ["821115", "821113", "821106"] },
    ]
  },
  {
    state: "Delhi",
    cities: [
      { name: "Central Delhi", pincodes: ["110001", "110002", "110005", "110006", "110055"] },
      { name: "South Delhi", pincodes: ["110016", "110017", "110019", "110020", "110024", "110025", "110048", "110049", "110062"] },
      { name: "South West Delhi", pincodes: ["110070", "110075", "110077", "110078", "110037"] },
      { name: "North Delhi", pincodes: ["110007", "110009", "110054", "110084"] },
      { name: "North West Delhi", pincodes: ["110034", "110085", "110088"] },
      { name: "West Delhi", pincodes: ["110015", "110018", "110026", "110027", "110058", "110063"] },
      { name: "East Delhi", pincodes: ["110051", "110091", "110092"] },
      { name: "New Delhi", pincodes: ["110001", "110003", "110011", "110021", "110023"] },
      { name: "Dwarka", pincodes: ["110075", "110077", "110078"] },
      { name: "Rohini", pincodes: ["110085", "110086", "110089"] }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      { name: "Mumbai", pincodes: ["400001", "400002", "400004", "400012", "400020", "400050", "400051", "400053", "400058", "400070", "400080", "400092", "400101"] },
      { name: "Pune", pincodes: ["411001", "411002", "411004", "411007", "411014", "411028", "411038", "411045", "411057"] },
      { name: "Nagpur", pincodes: ["440001", "440002", "440010", "440012", "440022", "440025"] },
      { name: "Thane", pincodes: ["400601", "400602", "400604", "400607", "400615"] },
      { name: "Navi Mumbai", pincodes: ["400703", "400705", "400706", "400708", "400709"] },
      { name: "Nashik", pincodes: ["422001", "422002", "422003", "422005", "422009"] },
      { name: "Aurangabad (Chhatrapati Sambhajinagar)", pincodes: ["431001", "431003", "431005"] },
      { name: "Kolhapur", pincodes: ["416001", "416002", "416003", "416012"] },
      { name: "Solapur", pincodes: ["413001", "413002", "413003"] }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      { name: "Bengaluru", pincodes: ["560001", "560002", "560004", "560011", "560025", "560034", "560037", "560038", "560068", "560076", "560100", "560102", "560103"] },
      { name: "Mysuru", pincodes: ["570001", "570002", "570004", "570008", "570020"] },
      { name: "Mangaluru", pincodes: ["575001", "575002", "575003", "575004"] },
      { name: "Hubballi-Dharwad", pincodes: ["580020", "580021", "580024", "580030"] },
      { name: "Belagavi", pincodes: ["590001", "590002", "590006"] },
      { name: "Kalaburagi", pincodes: ["585101", "585102", "585103"] }
    ]
  },
  {
    state: "Uttar Pradesh",
    cities: [
      { name: "Lucknow", pincodes: ["226001", "226002", "226003", "226004", "226010", "226016", "226020", "226024"] },
      { name: "Noida", pincodes: ["201301", "201303", "201304", "201305", "201307", "201309", "201318"] },
      { name: "Greater Noida", pincodes: ["201306", "201308", "201310"] },
      { name: "Ghaziabad", pincodes: ["201001", "201002", "201009", "201010", "201012", "201014"] },
      { name: "Varanasi", pincodes: ["221001", "221002", "221005", "221010"] },
      { name: "Kanpur", pincodes: ["208001", "208002", "208005", "208012", "208024"] },
      { name: "Agra", pincodes: ["282001", "282002", "282003", "282005"] },
      { name: "Prayagraj (Allahabad)", pincodes: ["211001", "211002", "211003", "211004"] },
      { name: "Gorakhpur", pincodes: ["273001", "273004", "273008", "273015"] },
      { name: "Meerut", pincodes: ["250001", "250002", "250004"] },
      { name: "Bareilly", pincodes: ["243001", "243003", "243005"] },
      { name: "Aligarh", pincodes: ["202001", "202002"] },
      { name: "Moradabad", pincodes: ["244001", "244102"] }
    ]
  },
  {
    state: "West Bengal",
    cities: [
      { name: "Kolkata", pincodes: ["700001", "700002", "700004", "700019", "700020", "700029", "700032", "700064", "700091", "700107"] },
      { name: "Howrah", pincodes: ["711101", "711102", "711104", "711106"] },
      { name: "Siliguri", pincodes: ["734001", "734003", "734004", "734006"] },
      { name: "Durgapur", pincodes: ["713201", "713204", "713216"] },
      { name: "Asansol", pincodes: ["713301", "713302", "713304"] },
      { name: "Kharagpur", pincodes: ["721301", "721302"] },
      { name: "Bardhaman", pincodes: ["713101", "713103"] }
    ]
  },
  {
    state: "Tamil Nadu",
    cities: [
      { name: "Chennai", pincodes: ["600001", "600002", "600004", "600017", "600018", "600028", "600034", "600040", "600096"] },
      { name: "Coimbatore", pincodes: ["641001", "641002", "641004", "641012", "641018", "641044"] },
      { name: "Madurai", pincodes: ["625001", "625002", "625016", "625020"] },
      { name: "Tiruchirappalli", pincodes: ["620001", "620002", "620018"] },
      { name: "Salem", pincodes: ["636001", "636004", "636007"] },
      { name: "Tirunelveli", pincodes: ["627001", "627002"] },
      { name: "Vellore", pincodes: ["632001", "632004", "632006"] }
    ]
  },
  {
    state: "Telangana",
    cities: [
      { name: "Hyderabad", pincodes: ["500001", "500003", "500004", "500016", "500032", "500034", "500081", "500084", "500090"] },
      { name: "Secunderabad", pincodes: ["500003", "500009", "500015", "500026"] },
      { name: "Warangal", pincodes: ["506001", "506002", "506009"] },
      { name: "Nizamabad", pincodes: ["503001", "503002"] },
      { name: "Karimnagar", pincodes: ["505001", "505002"] },
      { name: "Khammam", pincodes: ["507001", "507002"] }
    ]
  },
  {
    state: "Gujarat",
    cities: [
      { name: "Ahmedabad", pincodes: ["380001", "380006", "380009", "380015", "380054", "380058"] },
      { name: "Surat", pincodes: ["395001", "395003", "395007", "395009"] },
      { name: "Vadodara", pincodes: ["390001", "390005", "390007", "390020"] },
      { name: "Rajkot", pincodes: ["360001", "360002", "360004", "360005"] },
      { name: "Bhavnagar", pincodes: ["364001", "364002"] },
      { name: "Jamnagar", pincodes: ["361001", "361008"] },
      { name: "Gandhinagar", pincodes: ["382010", "382016", "382024"] }
    ]
  },
  {
    state: "Rajasthan",
    cities: [
      { name: "Jaipur", pincodes: ["302001", "302004", "302015", "302017", "302020", "302033"] },
      { name: "Jodhpur", pincodes: ["342001", "342003", "342008"] },
      { name: "Udaipur", pincodes: ["313001", "313002", "313004"] },
      { name: "Kota", pincodes: ["324001", "324005", "324007"] },
      { name: "Bikaner", pincodes: ["334001", "334003"] },
      { name: "Ajmer", pincodes: ["305001", "305004"] }
    ]
  },
  {
    state: "Kerala",
    cities: [
      { name: "Kochi (Ernakulam)", pincodes: ["682001", "682011", "682016", "682020", "682030"] },
      { name: "Thiruvananthapuram", pincodes: ["695001", "695004", "695011", "695014"] },
      { name: "Kozhikode (Calicut)", pincodes: ["673001", "673004", "673016"] },
      { name: "Thrissur", pincodes: ["680001", "680004", "680020"] },
      { name: "Kollam", pincodes: ["691001", "691008"] },
      { name: "Kannur", pincodes: ["670001", "670002"] },
      { name: "Kottayam", pincodes: ["686001", "686002"] }
    ]
  },
  {
    state: "Punjab",
    cities: [
      { name: "Ludhiana", pincodes: ["141001", "141002", "141008", "141012"] },
      { name: "Amritsar", pincodes: ["143001", "143002", "143006"] },
      { name: "Jalandhar", pincodes: ["144001", "144002", "144008"] },
      { name: "Patiala", pincodes: ["147001", "147002", "147004"] },
      { name: "Bathinda", pincodes: ["151001", "151005"] },
      { name: "Mohali (SAS Nagar)", pincodes: ["160055", "160059", "160062", "160071"] }
    ]
  },
  {
    state: "Haryana",
    cities: [
      { name: "Gurugram (Gurgaon)", pincodes: ["122001", "122002", "122003", "122018", "122102"] },
      { name: "Faridabad", pincodes: ["121001", "121002", "121006", "121007"] },
      { name: "Panipat", pincodes: ["132103", "132108"] },
      { name: "Ambala", pincodes: ["133001", "134003"] },
      { name: "Karnal", pincodes: ["132001", "132002"] },
      { name: "Hisar", pincodes: ["125001", "125005"] },
      { name: "Rohtak", pincodes: ["124001", "124002"] },
      { name: "Panchkula", pincodes: ["134109", "134112", "134114"] }
    ]
  },
  {
    state: "Madhya Pradesh",
    cities: [
      { name: "Indore", pincodes: ["452001", "452002", "452010", "452016"] },
      { name: "Bhopal", pincodes: ["462001", "462003", "462016", "462023"] },
      { name: "Jabalpur", pincodes: ["482001", "482002", "482005"] },
      { name: "Gwalior", pincodes: ["474001", "474002", "474009"] },
      { name: "Ujjain", pincodes: ["456001", "456006", "456010"] }
    ]
  },
  {
    state: "Andhra Pradesh",
    cities: [
      { name: "Visakhapatnam", pincodes: ["530001", "530002", "530016", "530020"] },
      { name: "Vijayawada", pincodes: ["520001", "520002", "520008", "520010"] },
      { name: "Guntur", pincodes: ["522001", "522002", "522004"] },
      { name: "Tirupati", pincodes: ["517501", "517502", "517507"] },
      { name: "Kurnool", pincodes: ["518001", "518002"] }
    ]
  },
  {
    state: "Odisha",
    cities: [
      { name: "Bhubaneswar", pincodes: ["751001", "751002", "751007", "751010", "751024"] },
      { name: "Cuttack", pincodes: ["753001", "753002", "753008"] },
      { name: "Rourkela", pincodes: ["769001", "769004", "769012"] },
      { name: "Puri", pincodes: ["752001", "752002"] },
      { name: "Sambalpur", pincodes: ["768001", "768004"] }
    ]
  },
  {
    state: "Assam",
    cities: [
      { name: "Guwahati", pincodes: ["781001", "781005", "781007", "781022"] },
      { name: "Silchar", pincodes: ["788001", "788005"] },
      { name: "Dibrugarh", pincodes: ["786001", "786003"] },
      { name: "Jorhat", pincodes: ["785001", "785006"] }
    ]
  },
  {
    state: "Goa",
    cities: [
      { name: "Panaji (North Goa)", pincodes: ["403001", "403002", "403507"] },
      { name: "Margao (South Goa)", pincodes: ["403601", "403602", "403707"] },
      { name: "Vasco da Gama", pincodes: ["403802", "403803"] }
    ]
  },
  {
    state: "Chandigarh",
    cities: [
      { name: "Chandigarh", pincodes: ["160017", "160019", "160022", "160036", "160047"] }
    ]
  },
  {
    state: "Uttarakhand",
    cities: [
      { name: "Dehradun", pincodes: ["248001", "248002", "248008", "248197"] },
      { name: "Haridwar", pincodes: ["249401", "249407"] },
      { name: "Rishikesh", pincodes: ["249201", "249204"] },
      { name: "Haldwani", pincodes: ["263139", "263141"] }
    ]
  },
  {
    state: "Himachal Pradesh",
    cities: [
      { name: "Shimla", pincodes: ["171001", "171002", "171006"] },
      { name: "Dharamshala", pincodes: ["176215", "176219"] },
      { name: "Mandi", pincodes: ["175001", "175002"] },
      { name: "Solan", pincodes: ["173211", "173212"] }
    ]
  },
  {
    state: "Jammu and Kashmir",
    cities: [
      { name: "Srinagar", pincodes: ["190001", "190008", "190019"] },
      { name: "Jammu", pincodes: ["180001", "180004", "180012"] },
      { name: "Anantnag", pincodes: ["192101", "192102"] }
    ]
  },
  {
    state: "Chhattisgarh",
    cities: [
      { name: "Raipur", pincodes: ["492001", "492002", "492006", "492013"] },
      { name: "Bhilai", pincodes: ["490001", "490006", "490020"] },
      { name: "Bilaspur", pincodes: ["495001", "495004"] }
    ]
  }
];

export function getIndianStates(): string[] {
  return INDIA_LOCATION_DATA.map(d => d.state).sort();
}

export function getCitiesByState(stateName: string): string[] {
  const found = INDIA_LOCATION_DATA.find(d => d.state.toLowerCase() === stateName.toLowerCase());
  if (!found) return [];
  return found.cities.map(c => c.name).sort();
}

export function getPincodesByCity(cityName: string, stateName?: string): string[] {
  if (stateName) {
    const foundState = INDIA_LOCATION_DATA.find(d => d.state.toLowerCase() === stateName.toLowerCase());
    if (foundState) {
      const foundCity = foundState.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
      if (foundCity) return foundCity.pincodes;
    }
  }

  // Search across all states
  for (const stateObj of INDIA_LOCATION_DATA) {
    const foundCity = stateObj.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (foundCity) return foundCity.pincodes;
  }
  return [];
}

export function lookupPincode(pincode: string): { state: string; city: string } | null {
  const cleanPin = pincode.trim();
  for (const stateObj of INDIA_LOCATION_DATA) {
    for (const cityObj of stateObj.cities) {
      if (cityObj.pincodes.includes(cleanPin)) {
        return { state: stateObj.state, city: cityObj.name };
      }
    }
  }
  return null;
}
