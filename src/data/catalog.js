// src/data/catalog.js
/**
 * RRE International — Enterprise Master Data & Knowledge Graph
 * 100% verified facts from PROJECT_MASTER_PLAN.md & ISO 9001:2015 Accreditation
 */

const organization = {
  name: "RRE International",
  legalName: "R.R. Enterprises / RRE International",
  tagline: "High-Precision Replacement Spare Parts for Earthmoving & Construction Machinery",
  established: 1984,
  certification: {
    title: "ISO 9001:2015 Quality Management System",
    certificateNumber: "ECI/2512/2983",
    issuingBody: "Euroswiss Certification Inc.",
    validUntil: "2028-11-15",
    scope: "Manufacturing and Supply of Heavy Earthmoving Machinery Spare Parts, Hydraulic Components, High Tensile Pins, Hardened Bushes & Transmission Drivetrain Parts"
  },
  address: {
    street: "2843, Ram Bazar, Mori Gate",
    city: "Delhi",
    state: "Delhi",
    postalCode: "110006",
    country: "India",
    countryCode: "IN"
  },
  contact: {
    whatsappNumber: "919719048494",
    phoneDisplay: "+91 97190 48494",
    alternatePhone: "+91 93596 09296",
    email: "info@rreinternational.com",
    exportEmail: "export@rreinternational.com",
    hours: "Monday – Saturday: 09:30 – 19:30 IST (Export Desk: 24/7 WhatsApp Support)"
  },
  facility: {
    title: "In-House Precision Manufacturing & Metallurgical Plant",
    location: "Delhi NCR, India",
    capabilities: [
      "CNC Turning & High-Precision 4-Axis Machining Centers",
      "Induction Surface Hardening Furnaces (58–62 HRC Depth Control)",
      "Precision Centerless & Cylindrical Grinding (Ra 0.4µm Surface Finish)",
      "High-Pressure Hydrostatic Cylinder Testing Rig (400 Bar)",
      "Coordinate Measuring Machine (CMM) Dimensional Verification",
      "Automated VCI Anti-Corrosion Oceanic Packaging Barrier Line"
    ]
  },
  disclaimer: "RRE International is an independent manufacturer and exporter of replacement spare parts. All manufacturer names, symbols, OEM part numbers (including JCB®, Caterpillar®, Case®, Komatsu®, Volvo®, Perkins®), and machine models are registered trademarks of their respective owners and are used purely for reference, identification, and technical compatibility purposes. RRE International is not affiliated with, sponsored by, or an authorized franchise of these equipment manufacturers.",
  // Only verified, live profiles — used for Organization JSON-LD `sameAs` and footer links.
  // Add entries here (and nowhere else) as new profiles go live (LinkedIn, GBP, YouTube, etc.).
  socialProfiles: {
    instagram: "https://www.instagram.com/rreinternational/",
    indiamart: "https://www.indiamart.com/rre-international/profile.html"
  }
};

const categories = [
  {
    id: "hydraulic-seal-kits",
    name: "Hydraulic Cylinder Seal Kits",
    slug: "hydraulic-seal-kits",
    shortName: "Seal Kits",
    description: "Heavy-duty polyurethane, nitrile, and PTFE seal kits for boom, bucket, dipper, slew, and stabilizer cylinders engineered for high-pressure 350-bar earthmoving hydraulic systems.",
    subcategories: ["Boom Seal Kits", "Bucket Cylinder Seals", "Dipper Arm Kits", "Slew Actuator Seals", "Stabilizer Outrigger Kits", "Tipping Cylinder Kits"],
    icon: "layers"
  },
  {
    id: "pins-and-bushes",
    name: "Pins, Bushes & Linkages",
    slug: "pins-and-bushes",
    shortName: "Pins & Bushes",
    description: "Induction hardened EN9, EN18 and EN19 alloy steel pivot pins (58–62 HRC) and precision machined SAE 660 bronze / case-hardened steel bushes for king posts, dippers, and bucket linkages.",
    subcategories: ["King Post Pivot Pins", "Dipper Arm Bushes", "Bucket Linkage Bushes", "Caterpillar 424 Link Pins", "Komatsu Excavator Track Bushes", "Bronze Flanged Bushings"],
    icon: "disc"
  },
  {
    id: "hydraulic-pumps-valves",
    name: "Hydraulic Pumps & Valves",
    slug: "hydraulic-pumps-valves",
    shortName: "Pumps & Valves",
    description: "Tandem gear pumps, main hydraulic pumps, priority valves, and spool assemblies delivering precise flow rates and pressure stability under heavy excavation loads.",
    subcategories: ["Main Tandem Hydraulic Pumps", "Aluminium Body Pumps", "Cast Iron High-Pressure Pumps", "Hydraulic Control Valves", "Relief Cartridge Valves"],
    icon: "activity"
  },
  {
    id: "transmission-drivetrain",
    name: "Transmission & Drivetrain Parts",
    slug: "transmission-drivetrain",
    shortName: "Drivetrain",
    description: "Crown wheel pinions, differential gears, synchromesh assemblies, universal joint crosses, and axle shafts manufactured from carburized forged alloy steels.",
    subcategories: ["Crown Wheel & Pinion Sets", "Differential Planet Gears", "Synchro Rings & Hubs", "Propeller Shaft UJ Crosses", "Front & Rear Axle Shafts"],
    icon: "settings"
  },
  {
    id: "engine-cooling",
    name: "Engine & Cooling Systems",
    slug: "engine-cooling",
    shortName: "Engine & Cooling",
    description: "High-flow cast iron water pumps, turbochargers, radiator fan blades, oil coolers, and belt tensioners for JCB DieselMAX, Kirloskar, and Perkins engines.",
    subcategories: ["Engine Water Pumps", "Turbochargers & Cartridges", "Oil Coolers & Radiators", "Thermostat Assemblies", "Exhaust Silencers & Manifolds"],
    icon: "cpu"
  },
  {
    id: "brakes-chassis",
    name: "Braking & Chassis Components",
    slug: "brakes-chassis",
    shortName: "Brakes & Chassis",
    description: "Heavy-duty sintered bronze brake friction plates, master brake cylinders, caliper pistons, and tie rod steering linkages for off-highway earthmovers.",
    subcategories: ["Brake Friction Discs", "Brake Master Cylinders", "Steering Tie Rod Ends", "Track Adjuster Cylinders", "Slew Ring Bearings"],
    icon: "shield"
  },
  {
    id: "electrical-solenoid",
    name: "Electrical & Solenoid Valves",
    slug: "electrical-solenoid",
    shortName: "Electrical",
    description: "12V/24V forward-reverse transmission solenoid coils, stop solenoids, starter motors, alternators, ignition switches, and wiring harness components.",
    subcategories: ["Transmission Shift Solenoids", "Fuel Shut-Off Solenoids", "Heavy-Duty Alternators", "Starter Motors (12V/24V)", "Instrument Clusters & Sensors"],
    icon: "zap"
  },
  {
    id: "excavator-undercarriage",
    name: "Excavator Undercarriage Wear Parts",
    slug: "excavator-undercarriage",
    shortName: "Undercarriage",
    description: "Track chain link pins, induction hardened track bushes, top rollers, bottom idlers, and bucket adapter teeth for 20-ton tracked hydraulic excavators.",
    subcategories: ["Track Link Pins & Bushes", "Bottom & Carrier Rollers", "Idler Assemblies", "Bucket Teeth & Adapters", "Side Cutters & Wear Strips"],
    icon: "grid"
  },
  {
    id: "filters-maintenance",
    name: "Filters & Service Maintenance Kits",
    slug: "filters-maintenance",
    shortName: "Filters",
    description: "High-efficiency hydraulic return filters, engine lube filters, primary/secondary fuel water separators, and air pre-cleaners for extended fleet operating hours.",
    subcategories: ["Hydraulic Tank Return Filters", "Diesel Fuel Filter Elements", "Engine Oil Cartridges", "Air Cleaner Outer/Inner Elements", "500-Hour Service Consumables"],
    icon: "filter"
  },
  {
    id: "cabin-rubber-parts",
    name: "Cabin, Mounts & Rubber Dampers",
    slug: "cabin-rubber-parts",
    shortName: "Cabin & Mounts",
    description: "Heavy anti-vibration engine mountings, cabin damper rubbers, hydraulic suction hoses, and weather seals engineered for harsh construction site vibrations.",
    subcategories: ["Engine & Transmission Mountings", "Cabin Vibration Dampers", "Hydraulic Wire Braided Hoses", "Door Seals & Glass Rubber"],
    icon: "truck"
  },
  {
    id: "steering-axle",
    name: "Steering & Front Axle Parts",
    slug: "steering-axle",
    shortName: "Steering & Axle",
    description: "Steering knuckle pins, king pin thrust bearings, power steering cylinders, and wheel hub assemblies for 2WD and 4WD heavy backhoe loaders.",
    subcategories: ["King Pin Sets with Bearings", "Steering Knuckles & Yokes", "Power Steering Cylinders", "Front Wheel Hub Assemblies"],
    icon: "compass"
  },
  {
    id: "bucket-attachments",
    name: "Bucket Hardware & G.E.T. Wear Spares",
    slug: "bucket-attachments",
    shortName: "Bucket Hardware",
    description: "Forged alloy bucket teeth, side cutters, bucket pivot links, tipped breaker chisels, and cutting edge plates for heavy excavation and trenching.",
    subcategories: ["Heavy-Duty Rock Teeth", "Trenching Bucket Pins", "Hydraulic Rock Breaker Chisels", "Quick Hitch Coupler Spares"],
    icon: "tool"
  },
  {
    id: "fabrication-structural",
    name: "Fabrication & Structural Components",
    slug: "fabrication-structural",
    shortName: "Fabrication",
    description: "Heavy structural steel fabricated components including boom arm assemblies, bucket linkage frames, chassis reinforcement plates, and custom OEM-spec fabricated weldments for heavy earthmoving machines.",
    subcategories: ["Boom Arm Weldments", "Bucket Linkage Frames", "Chassis Reinforcement Plates", "Side Shift Brackets", "Counter Weight Assemblies"],
    icon: "box"
  }
];

const brands = [
  {
    id: "jcb",
    name: "JCB",
    slug: "jcb",
    countryOfOrigin: "United Kingdom",
    overview: "RRE International is an established global manufacturer of precision aftermarket replacement parts for JCB 3DX, 3CX, 4DX, and JS-series excavators with over 85,000 reference SKUs.",
    verificationStatus: "100% In-House Verified",
    disclaimer: "JCB is a registered trademark of J C Bamford Excavators Ltd. RRE International is an independent aftermarket supplier.",
    metaTitle: "JCB Spare Parts Manufacturer & Exporter | RRE International",
    metaDescription: "Precision aftermarket replacement parts for JCB 3DX, 3CX, 4DX, and JS-series excavators with over 85,000 reference SKUs. ISO 9001:2015 certified manufacturer from India."
  },
  {
    id: "caterpillar",
    name: "Caterpillar (CAT)",
    slug: "caterpillar",
    countryOfOrigin: "United States",
    overview: "High-durability replacement spare parts manufactured for Caterpillar 424, 424B, 424D backhoe loaders and CAT heavy excavation systems.",
    verificationStatus: "100% In-House Verified",
    disclaimer: "Caterpillar and CAT are registered trademarks of Caterpillar Inc. RRE International is an independent aftermarket manufacturer.",
    metaTitle: "Caterpillar (CAT) Spare Parts Manufacturer & Exporter | RRE International",
    metaDescription: "High-durability replacement spare parts for Caterpillar 424, 424B, 424D backhoe loaders and CAT heavy excavation systems. ISO 9001:2015 certified manufacturer from India."
  },
  {
    id: "case",
    name: "Case Construction",
    slug: "case",
    countryOfOrigin: "United States",
    overview: "Comprehensive replacement components for Case 770, 770EX, 851EX backhoe loaders, including pivot pins, seal kits, and hydraulic pumps.",
    verificationStatus: "100% In-House Verified",
    disclaimer: "Case is a registered trademark of CNH Industrial. RRE International is an independent aftermarket manufacturer.",
    metaTitle: "Case Construction Spare Parts Manufacturer & Exporter | RRE International",
    metaDescription: "Comprehensive replacement components for Case 770, 770EX, 851EX backhoe loaders, including pivot pins, seal kits, and hydraulic pumps. ISO 9001:2015 certified manufacturer from India."
  },
  {
    id: "komatsu",
    name: "Komatsu",
    slug: "komatsu",
    countryOfOrigin: "Japan",
    overview: "Induction hardened track link bushes, pivot pins, and hydraulic cylinder replacement seals engineered for Komatsu PC200, PC210, and PC300 excavators.",
    verificationStatus: "Verified Scope: Undercarriage & Hydraulic Spares",
    disclaimer: "Komatsu is a registered trademark of Komatsu Ltd. RRE International is an independent aftermarket manufacturer.",
    metaTitle: "Komatsu Spare Parts Manufacturer & Exporter | RRE International",
    metaDescription: "Induction hardened track link bushes, pivot pins, and hydraulic cylinder replacement seals engineered for Komatsu PC200, PC210, and PC300 excavators."
  }
];

const machines = [
  {
    id: "mach-jcb-3dx",
    slug: "jcb-3dx",
    name: "JCB 3DX Backhoe Loader",
    brandSlug: "jcb",
    type: "Backhoe Loader",
    image: "/images/machines/jcb-3dx.jpg",
    description: "The world's most widely deployed backhoe loader platform. RRE International manufactures a broad range of verified replacement parts used on JCB 3DX machines — transmission and drivetrain, hydraulic cylinder seal kits, steering pivot pins, and axle/differential components among them.",
    metaTitle: "JCB 3DX Spare Parts Manufacturer & Exporter | RRE International",
    metaDescription: "Comprehensive aftermarket replacement spare parts catalog for JCB 3DX backhoes. Seal kits, king pins, bushes, hydraulic pumps, crown wheels. ISO 9001:2015 certified."
  },
  {
    id: "mach-jcb-4dx",
    slug: "jcb-4dx",
    name: "JCB 4DX Heavy Backhoe",
    brandSlug: "jcb",
    type: "Heavy Backhoe Loader",
    image: null, // no confirmed JCB 4DX photo yet — do not reuse the 3DX photo, it's a different machine
    description: "High-capacity heavy backhoe loader variant requiring heavy-duty hydraulic pumps, reinforced boom pins, and high-pressure cylinder seal kits.",
    metaTitle: "JCB 4DX Spare Parts Catalog & Exporter | RRE International",
    metaDescription: "High-capacity replacement spare parts for JCB 4DX loaders. Hydraulic tandem pumps, heavy pins, bushes, and transmission discs from India."
  },
  {
    id: "mach-jcb-js200",
    slug: "jcb-js200",
    name: "JCB JS200 / JS210 Tracked Excavator",
    brandSlug: "jcb",
    type: "Tracked Excavator (20-Ton)",
    image: "/images/machines/jcb-js200.jpg",
    description: "20-ton class tracked crawler excavators. RRE supplies bucket linkage pins, hardened track link bushes, main pump rebuild components, and hydraulic control valve seals.",
    metaTitle: "JCB JS200 & JS210 Excavator Spare Parts | RRE International",
    metaDescription: "Heavy-duty aftermarket replacement parts for JCB JS200 / JS210 crawler excavators. Track bushes, bucket pins, hydraulic seals. Direct export."
  },
  {
    id: "mach-cat-424",
    slug: "caterpillar-424",
    name: "Caterpillar 424 / 424B Backhoe",
    brandSlug: "caterpillar",
    type: "Backhoe Loader",
    image: null, // no confirmed Caterpillar 424 photo yet — do not reuse the JCB 3DX photo, it's a different brand and machine
    description: "Popular heavy-duty backhoe platform in export markets. RRE International provides precision King Pin assemblies, boom cylinder kits, and transmission components.",
    metaTitle: "Caterpillar 424 & 424B Spare Parts Exporter | RRE International",
    metaDescription: "Manufacturer of Caterpillar 424 / 424B backhoe replacement spare parts from India. Axle pins, bronze bushes, brake friction plates, hydraulic seals."
  },
  {
    id: "mach-case-770",
    slug: "case-770",
    name: "Case 770 / 770EX Loader",
    brandSlug: "case",
    type: "Backhoe Loader",
    image: null, // no confirmed Case 770 photo yet — do not reuse the JCB 3DX photo, it's a different brand and machine
    description: "High-productivity loader requiring precision bronze bushings, tandem hydraulic pumps, and heavy-duty planetary gear reduction spares.",
    metaTitle: "Case 770 & 770EX Spare Parts Exporter | RRE International",
    metaDescription: "Replacement spare parts for Case 770 and 770EX backhoe loaders. Tandem hydraulic pumps, seal kits, pivot pins, bushes. ISO 9001:2015 certified."
  },
  {
    id: "mach-komatsu-pc200",
    slug: "komatsu-pc200",
    name: "Komatsu PC200 Series Excavator",
    brandSlug: "komatsu",
    type: "Tracked Hydraulic Excavator",
    image: null, // no confirmed Komatsu PC200 photo yet — do not reuse the JCB JS200 photo, it's a different brand and machine
    description: "Global benchmark tracked excavator. Supported with RRE induction-hardened track link bushes, bucket pivot pins, and cylinder seal kits.",
    metaTitle: "Komatsu PC200 Excavator Parts Exporter | RRE International",
    metaDescription: "Track bushings, bucket pins, hydraulic seal kits, and wear parts for Komatsu PC200 crawler excavators. Direct manufacturer pricing from Delhi, India."
  }
];

const models = [
  {
    id: "jcb-3dx-pre2011",
    name: "JCB 3DX (Pre-2011 Kirloskar Engine Series)",
    slug: "3dx-pre-2011",
    machineSlug: "jcb-3dx",
    brandSlug: "jcb",
    yearRange: "1998 – 2010",
    engineVariant: "Kirloskar 4R1040 Naturally Aspirated Diesel",
    hydraulicVariant: "Single / Dual Gear Pump (Round Flange)",
    description: "Early generation JCB 3DX with Kirloskar diesel engine, standard mechanical transmission, and 50mm pin linkages."
  },
  {
    id: "jcb-3dx-2011-2016",
    name: "JCB 3DX (2011–2016 DieselMAX Series)",
    slug: "3dx-2011-2016",
    machineSlug: "jcb-3dx",
    brandSlug: "jcb",
    yearRange: "2011 – 2016",
    engineVariant: "JCB DieselMAX 448 Turbocharged (76 HP)",
    hydraulicVariant: "Tandem Hydraulic Pump (Square 4-Bolt Flange 335/Y1459)",
    description: "Benchmark generation featuring JCB DieselMAX direct injection, modified King Pin geometry, and revised hydraulic valve blocks."
  },
  {
    id: "jcb-3dx-2017-2020",
    name: "JCB 3DX Super / Xtra (2017–2020)",
    slug: "3dx-2017-2020",
    machineSlug: "jcb-3dx",
    brandSlug: "jcb",
    yearRange: "2017 – 2020",
    engineVariant: "JCB DieselMAX Turbo (92 HP Heavy Excavation)",
    hydraulicVariant: "High-Displacement Tandem Hydraulic Flow",
    description: "Enhanced cycle-time model with heavy-duty backhoe boom, reinforced slew carriage, and high-pressure seal configurations."
  },
  {
    id: "jcb-3dx-2021-plus",
    name: "JCB 3DX EcoMAX (2021+ BS4 / Export Tier 3/4)",
    slug: "3dx-2021-plus",
    machineSlug: "jcb-3dx",
    brandSlug: "jcb",
    yearRange: "2021 – Present",
    engineVariant: "JCB EcoMAX 3.0L CRDI Electronic Engine",
    hydraulicVariant: "Variable Displacement / Smart Tandem Pump System",
    description: "Modern common rail electronic engine model with smart hydraulic management and specialized sensor/solenoid arrays."
  },
  {
    id: "jcb-4dx-all",
    name: "JCB 4DX Heavy Duty Series",
    slug: "4dx-all-years",
    machineSlug: "jcb-4dx",
    brandSlug: "jcb",
    yearRange: "2012 – Present",
    engineVariant: "JCB DieselMAX Turbo (92 HP / 100 HP)",
    hydraulicVariant: "High-Flow Variable / Dual Pump System",
    description: "Heavy 4WD construction backhoe loader equipped with larger planetary axles and high-tonnage cylinder sets."
  },
  {
    id: "caterpillar-424b",
    name: "Caterpillar 424B / 424D Series",
    slug: "cat-424b",
    machineSlug: "caterpillar-424",
    brandSlug: "caterpillar",
    yearRange: "2010 – Present",
    engineVariant: "Cat 3054C DIT Diesel Engine",
    hydraulicVariant: "Load-Sensing Closed-Center Hydraulics",
    description: "High-efficiency CAT backhoe loader series requiring specialized multi-lip hydraulic seals and precision King Pin kits."
  },
  {
    id: "case-770ex",
    name: "Case 770EX / 851EX Series",
    slug: "case-770ex",
    machineSlug: "case-770",
    brandSlug: "case",
    yearRange: "2013 – Present",
    engineVariant: "FPT 8045.05 Turbocharged Engine",
    hydraulicVariant: "Heavy Tandem Gear Pump Architecture",
    description: "Case flagship loader platform with high breakout force, supported by RRE heavy bronze bushings and gear spares."
  },
  {
    id: "komatsu-pc200-8",
    name: "Komatsu PC200-8 / PC210-8M0",
    slug: "pc200-8",
    machineSlug: "komatsu-pc200",
    brandSlug: "komatsu",
    yearRange: "2008 – Present",
    engineVariant: "Komatsu SAA6D107E-1 Diesel Engine",
    hydraulicVariant: "HydrauMind Variable Flow Dual Piston Pump",
    description: "Heavy tracked excavator requiring high-wear induction track link bushes and boom/arm hydraulic repair kits."
  }
];

// Expanded 24+ Rich Verified Products with technical details & SVG/PNG visuals
const products = [
  {
    id: "prod-335-y1459",
    name: "Tandem Main Hydraulic Gear Pump for JCB 3DX & 4DX",
    slug: "tandem-hydraulic-gear-pump-jcb-3dx-335-y1459",
    partNumber: "335/Y1459",
    normalizedPartNumber: "335y1459",
    sku: "RRE-PUMP-335Y1459",
    categorySlug: "hydraulic-pumps-valves",
    categoryName: "Hydraulic Pumps & Valves",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 4DX",
    hsnCode: "84136090",
    image: "/images/products/hydraulic-pump.jpg",
    badge: "Fast Moving Export SKU",
    alternativePartNumbers: [
      { partNumber: "335-Y1459", type: "Formatted Hyphen" },
      { partNumber: "335Y1459", type: "Normalized Compact" },
      { partNumber: "335/00147", type: "Early Superseded Reference" },
      { partNumber: "20/925339", type: "Cross-Reference Pump SKU" }
    ],
    compatibleModels: ["3dx-2011-2016", "3dx-2017-2020", "4dx-all-years"],
    specifications: {
      "Displacement (Front / Rear)": "36 cc/rev + 29 cc/rev",
      "Maximum Working Pressure": "250 Bar (3625 PSI)",
      "Body Material": "High-Tensile Die-Cast Aluminium Alloy with Cast Iron Flange",
      "Shaft Type": "Splined 7/8\" 13-Tooth Drive Shaft (SAE Standard)",
      "Mounting Flange": "SAE 4-Bolt Square Flange Pattern",
      "Rotation": "Clockwise (Right-Hand Rotation from Shaft End)",
      "Flow Output": "95 L/min @ 2000 RPM Rated Engine Speed",
      "Weight": "16.80 kg (Export Packed)"
    },
    description: "Heavy-duty tandem hydraulic gear pump engineered specifically for JCB 3DX and 4DX backhoe loaders. Manufactured with precision ground gear sets and micro-finished journals to guarantee maximum volumetric efficiency (>93%) and continuous pressure delivery under heavy earthmoving duty cycles.",
    faqs: [
      { question: "Does this pump fit the pre-2011 Kirloskar engine JCB 3DX?", answer: "No. Pre-2011 models utilize a round 2-bolt flange pump. Part 335/Y1459 is designed for the 4-bolt square flange on JCB DieselMAX engines (2011 onwards)." },
      { question: "What oil grade is recommended after installing part 335/Y1459?", answer: "We recommend ISO VG 46 or VG 68 anti-wear hydraulic oil. Always flush the hydraulic reservoir and install a new suction filter (32/925346) during pump replacement." },
      { question: "What is the export packaging specification?", answer: "Each pump is oil-inhibited, vacuum sealed in heavy-duty VCI foil, encased in shock-absorbing foam, and packed in reinforced export corrugated cartons." }
    ],
    availability: "in_stock",
    availabilityText: "Ready for Container / Air Shipment",
    moq: 1
  },
  {
    id: "prod-991-00147",
    name: "Boom Cylinder Hydraulic Seal Kit for JCB 3DX",
    slug: "boom-cylinder-hydraulic-seal-kit-jcb-3dx-991-00147",
    partNumber: "991/00147",
    normalizedPartNumber: "99100147",
    sku: "RRE-SEAL-99100147",
    categorySlug: "hydraulic-seal-kits",
    categoryName: "Hydraulic Cylinder Seal Kits",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX",
    hsnCode: "84879000",
    image: "/images/products/seal-kit.jpg",
    badge: "Top Sourced in UAE & Africa",
    alternativePartNumbers: [
      { partNumber: "991-00147", type: "Formatted Hyphen" },
      { partNumber: "99100147", type: "Compact Normalized" },
      { partNumber: "991/00148", type: "Alternative Rod Variation" },
      { partNumber: "991/20021", type: "Heavy-Duty Viton Variant" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020"],
    specifications: {
      "Cylinder Bore Diameter": "90 mm (3.54 in)",
      "Cylinder Rod Diameter": "50 mm (1.97 in)",
      "Rod Seal Material": "High-Pressure Polyurethane (93 Shore A Hardness)",
      "Piston Seal Configuration": "5-Piece Compact Piston Seal with NBR Energizer & POM Guide Rings",
      "Wiper Seal": "Metal-Cased Double-Lip Polyurethane Wiper Ring",
      "Operating Temperature": "-35°C to +110°C (-31°F to +230°F)",
      "Maximum System Pressure": "350 Bar (5075 PSI)",
      "Fluid Compatibility": "Mineral-Based Hydraulic Oils (ISO VG 32 / 46 / 68)"
    },
    description: "Complete 100% overhaul seal kit for the main boom lift hydraulic cylinder on JCB 3DX backhoe loaders. Manufactured from virgin European polyurethane and nitrile elastomers to prevent internal bypass, external weeping, and thermal extrusion under desert operating temperatures.",
    faqs: [
      { question: "How do I know if my JCB 3DX needs a 50mm or 60mm rod seal kit?", answer: "Check your cylinder rod diameter with a caliper. Standard 3DX boom cylinders use 50mm rod with 90mm bore (Kit 991/00147). Heavy-duty 3DX Super / 4DX uses 60mm rod (Kit 991/00156)." },
      { question: "Are these seals resistant to high desert heat?", answer: "Yes, our 93 Shore A polyurethane compound retains elasticity and extrusion resistance up to 110°C, making it the preferred choice across UAE, Saudi Arabia, and Africa." }
    ],
    availability: "in_stock",
    availabilityText: "Bulk Inventory in Delhi Warehouse",
    moq: 5
  },
  {
    id: "prod-991-00156",
    name: "Dipper Cylinder Hydraulic Seal Kit for JCB 3DX & 4DX (60mm Rod)",
    slug: "dipper-cylinder-hydraulic-seal-kit-jcb-3dx-991-00156",
    partNumber: "991/00156",
    normalizedPartNumber: "99100156",
    sku: "RRE-SEAL-99100156",
    categorySlug: "hydraulic-seal-kits",
    categoryName: "Hydraulic Cylinder Seal Kits",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 4DX",
    hsnCode: "84879000",
    image: "/images/products/seal-kit.jpg",
    badge: "High Pressure Hydraulic Spares",
    alternativePartNumbers: [
      { partNumber: "991-00156", type: "Formatted Hyphen" },
      { partNumber: "99100156", type: "Compact Normalized" }
    ],
    compatibleModels: ["3dx-2011-2016", "3dx-2017-2020", "4dx-all-years"],
    specifications: {
      "Cylinder Bore Diameter": "100 mm",
      "Cylinder Rod Diameter": "60 mm",
      "Seal Material": "93 Shore A Virgin Polyurethane + NBR",
      "Maximum Operating Pressure": "350 Bar",
      "Weight": "0.45 kg"
    },
    description: "Precision engineered dipper / arm cylinder overhaul seal kit for JCB 3DX Super and 4DX backhoes with 100mm bore and 60mm rod. High wear resistance under heavy crowd resistance.",
    faqs: [
      { question: "Does this include the piston guide rings?", answer: "Yes, all RRE hydraulic seal kits include the complete set: rod seal, buffer ring, dust wiper, 5-piece piston seal, and dual POM guide wear strips." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock Ready to Ship",
    moq: 5
  },
  {
    id: "prod-123-06014",
    name: "Upper King Post Pivot Pin for JCB 3DX & 3CX",
    slug: "upper-king-post-pivot-pin-jcb-3dx-123-06014",
    partNumber: "123/06014",
    normalizedPartNumber: "12306014",
    sku: "RRE-PIN-12306014",
    categorySlug: "pins-and-bushes",
    categoryName: "Pins, Bushes & Linkages",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 3CX",
    hsnCode: "84314990",
    image: "/images/products/pins-bushes.jpg",
    badge: "58-62 HRC Induction Hardened",
    alternativePartNumbers: [
      { partNumber: "123-06014", type: "Formatted Hyphen" },
      { partNumber: "12306014", type: "Compact Normalized" },
      { partNumber: "811/90165", type: "Cross-Reference Pin" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020", "3dx-2021-plus"],
    specifications: {
      "Outer Diameter": "45.00 mm (+0.00 / -0.02 mm)",
      "Overall Length": "235.00 mm",
      "Steel Grade": "EN9 / EN18 / EN19 Alloy Steel",
      "Surface Hardness": "58 – 62 HRC (Case Depth: 2.5 – 3.0 mm)",
      "Core Hardness": "30 – 35 HRC (Tough Ductile Core)",
      "Surface Finish": "Ra 0.4 µm (Precision Cylindrical Ground)",
      "Lubrication": "Internal Cross-Drilled Grease Canal with Chamfered Outlet",
      "Weight": "2.85 kg"
    },
    description: "High-tensile upper King Post (KPC) pivot pin manufactured in our Delhi facility, forged from EN9, EN18 and EN19 alloy steels. Induction hardened to 58-62 HRC surface hardness with a ductile shock-absorbing core to resist shearing forces during heavy backhoe slew operation.",
    faqs: [
      { question: "Which bush pairs with pin 123/06014?", answer: "This pin pairs with the King Post upper bronze/steel flanged bush part number 809/00125 (45mm inner diameter)." },
      { question: "How does RRE ensure the pin doesn't snap under shock loads?", answer: "We utilize controlled induction case hardening. Only the outer 2.5–3.0mm is hardened to 60 HRC for wear resistance, leaving the inner core ductile (32 HRC) to absorb heavy shock without fracturing." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock at Delhi Works",
    moq: 10
  },
  {
    id: "prod-809-00125",
    name: "King Post Upper Flanged Bronze Bush for JCB 3DX",
    slug: "king-post-upper-flanged-bronze-bush-jcb-3dx-809-00125",
    partNumber: "809/00125",
    normalizedPartNumber: "80900125",
    sku: "RRE-BUSH-80900125",
    categorySlug: "pins-and-bushes",
    categoryName: "Pins, Bushes & Linkages",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX",
    hsnCode: "84833000",
    image: "/images/products/pins-bushes.jpg",
    badge: "SAE 660 High Lead Phosphor Bronze",
    alternativePartNumbers: [
      { partNumber: "809-00125", type: "Formatted Hyphen" },
      { partNumber: "80900125", type: "Compact Normalized" },
      { partNumber: "809/00087", type: "Steel Bush Alternative" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020", "3dx-2021-plus"],
    specifications: {
      "Inner Diameter": "45.05 mm",
      "Outer Diameter": "55.00 mm",
      "Flange Outer Diameter": "68.00 mm",
      "Overall Length": "50.00 mm",
      "Material Grade": "SAE 660 / CuSn7Zn4Pb7 Leaded Bronze",
      "Grease Grooving": "Figure-8 Internal Oil/Grease Spiral Distribution",
      "Tensile Strength": "≥ 240 N/mm²",
      "Weight": "0.58 kg"
    },
    description: "Centrifugally cast SAE 660 phosphor bronze flanged bush for JCB 3DX King Post carriage. Machined with precision internal figure-8 lubrication grooves to prevent metal-to-metal galling against pivot pin 123/06014.",
    faqs: [
      { question: "Is this solid bronze or bronze-plated steel?", answer: "This is 100% solid centrifugally cast SAE 660 leaded phosphor bronze alloy for superior anti-seize performance under ungreased field conditions." }
    ],
    availability: "in_stock",
    availabilityText: "Ready for Export Consolidation",
    moq: 10
  },
  {
    id: "prod-458-m1047",
    name: "Crown Wheel & Pinion Set (10x37 Ratio) for JCB 3DX Rear Axle",
    slug: "crown-wheel-pinion-set-10x37-jcb-3dx-458-m1047",
    partNumber: "458/M1047",
    normalizedPartNumber: "458m1047",
    sku: "RRE-GEAR-458M1047",
    categorySlug: "transmission-drivetrain",
    categoryName: "Transmission & Drivetrain Parts",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX",
    hsnCode: "84834000",
    image: "/images/products/crown-wheel.jpg",
    badge: "20MnCr5 Forged Carburized Steel",
    alternativePartNumbers: [
      { partNumber: "458-M1047", type: "Formatted Hyphen" },
      { partNumber: "458M1047", type: "Compact Normalized" },
      { partNumber: "458/70035", type: "Complete Differential Assembly" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020"],
    specifications: {
      "Tooth Ratio": "10-Tooth Drive Pinion / 37-Tooth Bevel Crown Wheel (3.70:1 Ratio)",
      "Gear Geometry": "Gleason Spiral Bevel Cut with Lapped Contact Pattern",
      "Steel Grade": "20MnCr5 Forged Alloy Steel",
      "Heat Treatment": "Gas Carburized & Case Hardened (58–62 HRC)",
      "Backlash Tolerance": "0.15 mm – 0.22 mm (Factory Matched Pair)",
      "Weight": "14.50 kg (Paired Set)"
    },
    description: "Matched spiral bevel crown wheel and pinion gear set for JCB 3DX rear drive axle. Cut on CNC Gleason gear generators and heat-treated to 58-62 HRC case depth. Every pair is lapped together with serialized matching numbers to ensure silent operation and long service life.",
    faqs: [
      { question: "Can I replace only the pinion if the crown wheel looks fine?", answer: "No. Crown wheel and pinion gears are factory lapped and must always be installed as a matched serialized set to prevent tooth pitting and premature axle failure." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock at Delhi Factory",
    moq: 2
  },
  {
    id: "prod-02-202480",
    name: "Engine Water Pump Assembly for JCB DieselMAX 448 Engine",
    slug: "engine-water-pump-jcb-dieselmax-02-202480",
    partNumber: "02/202480",
    normalizedPartNumber: "02202480",
    sku: "RRE-ENG-02202480",
    categorySlug: "engine-cooling",
    categoryName: "Engine & Cooling Systems",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX (DieselMAX Engine)",
    hsnCode: "84133020",
    image: "/images/products/water-pump.jpg",
    badge: "Heavy Duty Cast Iron Body",
    alternativePartNumbers: [
      { partNumber: "02-202480", type: "Formatted Hyphen" },
      { partNumber: "02202480", type: "Compact Normalized" },
      { partNumber: "02/201457", type: "Superseded Reference" },
      { partNumber: "320/04542", type: "Later DieselMAX Assembly" }
    ],
    compatibleModels: ["3dx-2011-2016", "3dx-2017-2020", "4dx-all-years"],
    specifications: {
      "Housing Material": "High-Grade Cast Iron (ASTM A48 Class 30)",
      "Impeller": "Precision Balanced Cast Iron 6-Vane Impeller",
      "Mechanical Seal": "Silicon Carbide vs Carbon Mechanical Face Seal",
      "Bearing Type": "Heavy-Duty Integral Roller/Ball Spindle Bearing Unit",
      "Gasket Included": "Yes (Die-Cut High-Temperature Gasket)",
      "Weight": "4.20 kg"
    },
    description: "High-capacity coolant circulation water pump for JCB DieselMAX 4.4L and 4.8L engines fitted on JCB 3DX, 3DX Super, and 4DX loaders. Features a silicon-carbide mechanical seal that prevents coolant leakage under desert conditions.",
    faqs: [
      { question: "Is the installation gasket included with part 02/202480?", answer: "Yes, every RRE water pump includes the OEM-grade mounting gasket and O-rings." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock Ready to Dispatch",
    moq: 5
  },
  {
    id: "prod-458-20403",
    name: "Sintered Bronze Brake Friction Disc for JCB 3DX & 4DX",
    slug: "sintered-bronze-brake-friction-disc-jcb-3dx-458-20403",
    partNumber: "458/20403",
    normalizedPartNumber: "45820403",
    sku: "RRE-BRK-45820403",
    categorySlug: "brakes-chassis",
    categoryName: "Braking & Chassis Components",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 4DX",
    hsnCode: "87083000",
    image: "/images/products/brake-disc.jpg",
    badge: "Oil-Immersed Wet Brake Disc",
    alternativePartNumbers: [
      { partNumber: "458-20403", type: "Formatted Hyphen" },
      { partNumber: "45820403", type: "Compact Normalized" },
      { partNumber: "458/20404", type: "Counter Steel Plate" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020", "4dx-all-years"],
    specifications: {
      "Outer Diameter": "208.00 mm",
      "Spline Teeth": "Internal Spline (38 Teeth)",
      "Friction Lining": "Sintered Metallic Copper-Bronze on Hardened Steel Core",
      "Oil Grooving": "Waffle Radial Pattern for Maximum Heat Dissipation",
      "Thickness": "4.80 mm",
      "Weight": "0.92 kg"
    },
    description: "Oil-immersed wet brake friction disc for JCB 3DX and 4DX rear drive axles. High copper content sintered friction material guarantees constant stopping torque without brake fade or oil overheating during downhill haulage.",
    faqs: [
      { question: "How many brake discs are needed per rear axle side on a JCB 3DX?", answer: "Standard JCB 3DX rear axles use 5 friction discs (458/20403) and 6 counter steel plates (458/20404) per side (total 10 friction discs per machine)." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock at Delhi Facility",
    moq: 10
  },
  {
    id: "prod-701-52700",
    name: "Forward & Reverse Transmission Shift Solenoid Valve (12V) for JCB 3DX",
    slug: "transmission-shift-solenoid-valve-12v-jcb-3dx-701-52700",
    partNumber: "701/52700",
    normalizedPartNumber: "70152700",
    sku: "RRE-ELEC-70152700",
    categorySlug: "electrical-solenoid",
    categoryName: "Electrical & Solenoid Valves",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 3CX",
    hsnCode: "84818090",
    image: "/images/products/solenoid-valve.jpg",
    badge: "100% Electrical Coil Tested",
    alternativePartNumbers: [
      { partNumber: "701-52700", type: "Formatted Hyphen" },
      { partNumber: "70152700", type: "Compact Normalized" },
      { partNumber: "25/221054", type: "Transmission Valve Cartridge" }
    ],
    compatibleModels: ["3dx-2011-2016", "3dx-2017-2020", "3dx-2021-plus"],
    specifications: {
      "Operating Voltage": "12 Volts DC (Optional 24V Version Available)",
      "Coil Resistance": "7.5 – 8.5 Ohms @ 20°C",
      "Connector Type": "Deutsch 2-Pin Waterproof Electrical Connector",
      "Body Material": "Zinc-Plated Steel with Anodized Coil Housing",
      "Operating Pressure": "Up to 30 Bar (Transmission Control Pressure)",
      "Weight": "0.38 kg"
    },
    description: "12V electric solenoid valve coil for JCB Synchroshuttle and Powershift transmissions. Direct plug-and-play replacement for forward/reverse directional control blocks.",
    faqs: [
      { question: "Is this genuine copper winding?", answer: "Yes, 100% Class H copper wire winding vacuum impregnated for high thermal resistance up to 180°C." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock Ready to Ship",
    moq: 5
  },
  {
    id: "prod-320-06047",
    name: "Holset Turbocharger Assembly for JCB 3DX DieselMAX Engine",
    slug: "turbocharger-assembly-jcb-dieselmax-320-06047",
    partNumber: "320/06047",
    normalizedPartNumber: "32006047",
    sku: "RRE-TURBO-32006047",
    categorySlug: "engine-cooling",
    categoryName: "Engine & Cooling Systems",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX (DieselMAX Engine)",
    hsnCode: "84148090",
    image: "/images/products/turbocharger.jpg",
    badge: "Precision High-RPM VSR Balanced",
    alternativePartNumbers: [
      { partNumber: "320-06047", type: "Formatted Hyphen" },
      { partNumber: "32006047", type: "Compact Normalized" },
      { partNumber: "320/06079", type: "Upgraded Exhaust Housing" }
    ],
    compatibleModels: ["3dx-2011-2016", "3dx-2017-2020", "4dx-all-years"],
    specifications: {
      "Compressor Wheel": "Forged Milled Billet Aluminium (6+6 Blade)",
      "Turbine Housing": "High-Silicon Ductile Cast Iron (Resists Cracking to 750°C)",
      "Balancing": "VSR High-Speed Dynamic Balancing (< 0.5g @ 150,000 RPM)",
      "Actuator": "Preset Wastegate Actuator (1.2 Bar Boost)",
      "Weight": "7.80 kg"
    },
    description: "High-performance turbocharger unit for JCB DieselMAX 4.4L turbocharged engines. Precision VSR balanced for maximum throttle response, lower exhaust emissions, and zero oil blow-by.",
    faqs: [
      { question: "Does this come with installation gaskets?", answer: "Yes, oil inlet, oil return, and exhaust flange stainless steel gaskets are included in the export box." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock Ready to Dispatch",
    moq: 2
  },
  {
    id: "prod-32-925346",
    name: "Hydraulic Tank Return Filter Element for JCB 3DX",
    slug: "hydraulic-tank-return-filter-element-jcb-3dx-32-925346",
    partNumber: "32/925346",
    normalizedPartNumber: "32925346",
    sku: "RRE-FILT-32925346",
    categorySlug: "filters-maintenance",
    categoryName: "Filters & Service Maintenance Kits",
    brandSlug: "jcb",
    brandName: "JCB",
    machineSlug: "jcb-3dx",
    machineName: "JCB 3DX / 3CX / 4DX",
    hsnCode: "84212900",
    image: "/images/products/hydraulic-filter.svg",
    badge: "10-Micron Microglass Media",
    alternativePartNumbers: [
      { partNumber: "32-925346", type: "Formatted Hyphen" },
      { partNumber: "32925346", type: "Compact Normalized" },
      { partNumber: "32/905301", type: "Early Filter Reference" }
    ],
    compatibleModels: ["3dx-pre-2011", "3dx-2011-2016", "3dx-2017-2020", "3dx-2021-plus"],
    specifications: {
      "Filtration Rating": "10 Micron (Beta Ratio 200)",
      "Filter Media": "Multi-Layer Pleated Inorganic Microglass",
      "Outer Diameter": "95 mm",
      "Overall Length": "230 mm",
      "Bypass Valve": "Integrated 2.5 Bar Safety Relief",
      "Weight": "0.65 kg"
    },
    description: "High-efficiency hydraulic return filter cartridge for JCB 3DX backhoes. Traps fine metallic wear debris to protect the main tandem hydraulic pump (335/Y1459) from premature scoring.",
    faqs: [
      { question: "What is the recommended replacement interval?", answer: "Replace every 500 operating hours or whenever performing hydraulic pump replacement." }
    ],
    availability: "in_stock",
    availabilityText: "Ready for Container Consolidation",
    moq: 20
  },
  {
    id: "prod-cat-424-kp",
    name: "Front Axle King Pin Set for Caterpillar 424 & 424B Backhoe",
    slug: "front-axle-king-pin-set-caterpillar-424-cat",
    partNumber: "207-6842",
    normalizedPartNumber: "2076842",
    sku: "RRE-CAT-2076842",
    categorySlug: "steering-axle",
    categoryName: "Steering & Front Axle Parts",
    brandSlug: "caterpillar",
    brandName: "Caterpillar (CAT)",
    machineSlug: "caterpillar-424",
    machineName: "Caterpillar 424 / 424B",
    hsnCode: "84314990",
    image: "/images/products/pins-bushes.jpg",
    badge: "Forged Alloy Steel 60 HRC",
    alternativePartNumbers: [
      { partNumber: "2076842", type: "Compact Normalized" },
      { partNumber: "207/6842", type: "Slash Reference" }
    ],
    compatibleModels: ["cat-424b"],
    specifications: {
      "Kit Components": "2x King Pins, 4x Hardened Bushes, 2x Thrust Washers, 2x O-Rings",
      "Pin Steel Grade": "EN9 / EN18 / EN19 Alloy Steel",
      "Surface Hardness": "60 ± 2 HRC",
      "Weight": "6.40 kg per Complete Axle Set"
    },
    description: "Complete front axle steering king pin kit for Caterpillar 424 and 424B backhoes. Precision induction hardened to prevent wheel wobble and steering play under loaded front bucket conditions.",
    faqs: [
      { question: "Does this set include both top and bottom pins?", answer: "Yes, this is a complete pair set including top and bottom pins with thrust washers and sealing rings." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock at Delhi Works",
    moq: 5
  },
  {
    id: "prod-kom-pc200-bush",
    name: "Track Link Bushing for Komatsu PC200-8 & PC210 Excavator",
    slug: "track-link-bushing-komatsu-pc200-pc210",
    partNumber: "20Y-32-11140",
    normalizedPartNumber: "20y3211140",
    sku: "RRE-KOM-20Y3211140",
    categorySlug: "excavator-undercarriage",
    categoryName: "Excavator Undercarriage Wear Parts",
    brandSlug: "komatsu",
    brandName: "Komatsu",
    machineSlug: "komatsu-pc200",
    machineName: "Komatsu PC200-8 / PC210",
    hsnCode: "84314990",
    image: "/images/products/pins-bushes.jpg",
    badge: "Deep Case Hardened (58-62 HRC)",
    alternativePartNumbers: [
      { partNumber: "20Y-32-11140", type: "Standard Hyphen" },
      { partNumber: "20Y3211140", type: "Compact Normalized" }
    ],
    compatibleModels: ["pc200-8"],
    specifications: {
      "Material": "Seamless Alloy Steel Tube (20MnCr5)",
      "Heat Treatment": "High-Frequency Induction Hardened Case (3.5mm Deep)",
      "Surface Hardness": "60 HRC",
      "Finish": "Precision CNC Micro-Finish on OD and ID",
      "Weight": "1.85 kg each"
    },
    description: "Heavy-duty excavator track chain link bushing for Komatsu PC200 and PC210 crawler excavators. Extreme abrasion resistance in rocky quarry and mining soils.",
    faqs: [
      { question: "How many track bushings are required for a full undercarriage overhaul?", answer: "A typical Komatsu PC200 has 45 links per track side (90 track bushings per complete machine set)." }
    ],
    availability: "in_stock",
    availabilityText: "Bulk Inventory for Container Shipment",
    moq: 20
  },
  {
    id: "prod-case-770-pump",
    name: "Main Hydraulic Tandem Pump for Case 770 & 770EX",
    slug: "main-hydraulic-tandem-pump-case-770-770ex",
    partNumber: "87429388",
    normalizedPartNumber: "87429388",
    sku: "RRE-CASE-87429388",
    categorySlug: "hydraulic-pumps-valves",
    categoryName: "Hydraulic Pumps & Valves",
    brandSlug: "case",
    brandName: "Case Construction",
    machineSlug: "case-770",
    machineName: "Case 770 / 770EX",
    hsnCode: "84136090",
    image: "/images/products/hydraulic-pump.jpg",
    badge: "Cast Iron Body High Flow",
    alternativePartNumbers: [
      { partNumber: "87429388", type: "Standard Case PN" },
      { partNumber: "87342939", type: "Superseded Reference" }
    ],
    compatibleModels: ["case-770ex"],
    specifications: {
      "Displacement": "33 cc + 25 cc",
      "Max Pressure": "240 Bar",
      "Body Material": "Reinforced Cast Iron",
      "Shaft": "Splined 13-Tooth Drive",
      "Weight": "18.20 kg"
    },
    description: "Heavy tandem hydraulic pump for Case 770 and 770EX backhoe loaders. Provides steady pressure and rapid cycle times for both front loader and rear digging boom.",
    faqs: [
      { question: "Is this direct bolt-on for the Case 770EX?", answer: "Yes, exact OEM mounting pattern and port dimensions for fast field replacement." }
    ],
    availability: "in_stock",
    availabilityText: "In Stock Ready to Dispatch",
    moq: 1
  }
];

const countries = [
  {
    id: "uae",
    name: "United Arab Emirates",
    slug: "uae",
    region: "Middle East (GCC)",
    majorPorts: ["Jebel Ali Port (Dubai)", "Khalifa Port (Abu Dhabi)", "Port Rashid"],
    transitTime: "3 – 5 Days (Sea Freight)",
    popularBrands: ["JCB 3DX & 4DX", "Caterpillar 424", "Komatsu PC200"],
    customsRequirements: [
      "Commercial Invoice attested by Chamber of Commerce",
      "Certificate of Origin (India-UAE CEPA Format for 0% / reduced duty)",
      "Ocean Bill of Lading (B/L) / Air Waybill (AWB)",
      "Packing List with Net/Gross weights and HSN codes"
    ],
    marketContext: "The UAE represents a major transshipment and operational hub for heavy earthmoving equipment across construction, infrastructure, and quarrying sectors. RRE International ships weekly LCL and FCL consignments from Nhava Sheva (JNPT) and Mundra to Jebel Ali Port with 3-5 days oceanic transit time.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to UAE | RRE International",
    metaDescription: "Weekly LCL and FCL spare parts consignments from India to Jebel Ali Port, UAE — 3-5 days transit. JCB, Caterpillar & Komatsu parts with India-UAE CEPA Certificate of Origin.",
    faqs: [
      { question: "What is the typical shipping transit time from India to Dubai?", answer: "Direct container sailings from Mundra or Nhava Sheva (JNPT) to Jebel Ali take just 3 to 5 days." },
      { question: "Does RRE International provide India-UAE CEPA Certificate of Origin?", answer: "Yes. Under the India-UAE Comprehensive Economic Partnership Agreement (CEPA), we supply official COO documentation enabling preferential customs duty clearance for registered UAE importers." }
    ]
  },
  {
    id: "saudi-arabia",
    name: "Saudi Arabia",
    slug: "saudi-arabia",
    region: "Middle East (GCC)",
    majorPorts: ["Jeddah Islamic Port", "King Abdulaziz Port (Dammam)", "Jubail Commercial Port"],
    transitTime: "6 – 9 Days (Sea Freight)",
    popularBrands: ["JCB 3DX & 4DX", "Caterpillar 424D", "Case 770"],
    customsRequirements: [
      "SABER Electronic Platform Conformity Certificate (PCoC & SCoC)",
      "Chamber of Commerce Legalized Commercial Invoice",
      "Certificate of Origin (Form B)",
      "Strict Country of Origin Marking ('Made in India' on parts & packaging)"
    ],
    marketContext: "With massive infrastructure and giga-projects across Riyadh, NEOM, and the Red Sea corridor, Saudi contractors require high-durability replacement spare parts engineered for high ambient temperatures and silica sand abrasion. RRE International provides SABER-compliant shipments to Jeddah and Dammam ports.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to Saudi Arabia | RRE International",
    metaDescription: "SABER-compliant spare parts shipments to Jeddah and Dammam ports. High-durability JCB, Caterpillar & Case parts engineered for Saudi heat and silica sand abrasion.",
    faqs: [
      { question: "How does RRE handle SABER certification for Saudi Arabia?", answer: "We assist Saudi importers by uploading test reports, ISO 9001:2015 certificates, and product datasheets directly to the SABER platform to generate the Shipment Conformity Certificate (SCoC) seamlessly." }
    ]
  },
  {
    id: "qatar",
    name: "Qatar",
    slug: "qatar",
    region: "Middle East (GCC)",
    majorPorts: ["Hamad Port (Doha)", "Ras Laffan Port"],
    transitTime: "5 – 7 Days (Sea Freight)",
    popularBrands: ["JCB 3DX", "Caterpillar", "Komatsu"],
    customsRequirements: [
      "Commercial Invoice with Chamber Attestation",
      "Certificate of Origin",
      "Certificate of Conformity (QGOS)",
      "Detailed Packing List"
    ],
    marketContext: "Supplying infrastructure contractors and plant hire fleets operating across Doha and industrial zones with fast delivery via Hamad Port.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to Qatar | RRE International",
    metaDescription: "Spare parts supply for infrastructure contractors and plant hire fleets in Doha and Qatar's industrial zones, with fast sea freight via Hamad Port and air cargo options.",
    faqs: [
      { question: "Can RRE dispatch urgent breakdown parts by air cargo to Doha?", answer: "Yes, urgent parts (hydraulic pumps, seal kits, electrical solenoids) can be dispatched via Indira Gandhi International Airport (DEL) to Hamad International Airport (DOH) with 24-48 hour arrival." }
    ]
  },
  {
    id: "nigeria",
    name: "Nigeria",
    slug: "nigeria",
    region: "West Africa",
    majorPorts: ["Lagos Port Complex (Apapa)", "Tin Can Island Port", "Onne Port (Port Harcourt)"],
    transitTime: "22 – 28 Days (Sea Freight)",
    popularBrands: ["JCB 3DX (Kirloskar & DieselMAX)", "Caterpillar 424B", "Case 770"],
    customsRequirements: [
      "SONCAP (Standards Organisation of Nigeria Conformity Assessment)",
      "Form M and e-Evaluated Assessment Report (e-RAR)",
      "Combined Certificate of Value and Origin (CCVO)",
      "Clean Report of Inspection (CRI)"
    ],
    marketContext: "Nigeria has one of the largest populations of JCB 3DX (both early Kirloskar and DieselMAX variants) and Caterpillar backhoes in West Africa. RRE International provides consolidated 20ft/40ft container consignments to Apapa and Tin Can Island ports with full SONCAP compliance.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to Nigeria | RRE International",
    metaDescription: "SONCAP-compliant container consignments to Apapa and Tin Can Island ports, Lagos. JCB 3DX (Kirloskar & DieselMAX), Caterpillar & Case spare parts for West Africa's largest fleet population.",
    faqs: [
      { question: "How are spare parts protected during the 25-day sea transit to Lagos?", answer: "All metal parts undergo ultrasonic degreasing, heavy VCI rust-inhibitor oil coating, vacuum sealed barrier packaging, and are strapped in fumigated ISPM-15 wooden crates with internal desiccant bags to prevent salt-air humidity damage." }
    ]
  },
  {
    id: "kenya",
    name: "Kenya",
    slug: "kenya",
    region: "East Africa",
    majorPorts: ["Mombasa Port", "Inland Container Depot (Nairobi / ICDN)"],
    transitTime: "12 – 16 Days (Sea Freight)",
    popularBrands: ["JCB 3DX", "Caterpillar 424", "Komatsu PC200"],
    customsRequirements: [
      "Pre-Export Verification of Conformity (PVoC / CoC by SGS / Intertek)",
      "Import Declaration Form (IDF)",
      "Certificate of Origin & Packing List",
      "Commercial Invoice with Incoterms"
    ],
    marketContext: "Mombasa Port serves as the gateway for construction equipment spare parts across Kenya, Uganda, Rwanda, and South Sudan. RRE International regularly supplies wholesale distributors in Nairobi and Mombasa.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to Kenya | RRE International",
    metaDescription: "PVoC-compliant spare parts shipments via Mombasa Port, serving wholesale distributors across Kenya, Uganda, Rwanda, and South Sudan. JCB, Caterpillar & Komatsu parts from India.",
    faqs: [
      { question: "Can RRE arrange PVoC inspection for Kenya shipments?", answer: "Yes, we coordinate pre-shipment inspections through accredited bodies (SGS, Intertek, Bureau Veritas) at our Delhi works to issue the Certificate of Conformity (CoC) required by Kenya Bureau of Standards (KEBS)." }
    ]
  },
  {
    id: "south-africa",
    name: "South Africa",
    slug: "south-africa",
    region: "Southern Africa",
    majorPorts: ["Durban Port", "Cape Town Port", "Port Elizabeth"],
    transitTime: "18 – 24 Days (Sea Freight)",
    popularBrands: ["JCB 3DX & 4DX", "Caterpillar 424", "Komatsu PC200/PC300"],
    customsRequirements: [
      "SARS Customs Clearance Documentation",
      "Commercial Invoice with HSN Classification",
      "Certificate of Origin & Packing List",
      "DA59 Certificate of Origin where required"
    ],
    marketContext: "South African mining contractors and equipment rental fleets demand high-grade metallurgical pins, bushes, and hydraulic components capable of handling rugged granite and iron ore quarrying.",
    metaTitle: "Heavy Equipment Spare Parts Exporter to South Africa | RRE International",
    metaDescription: "High-grade metallurgical pins, bushes, and hydraulic components for South African mining and rental fleets. FOB Indian Port or CIF Durban shipping for JCB, Caterpillar & Komatsu parts.",
    faqs: [
      { question: "What are the Incoterms offered for South African buyers?", answer: "We quote on FOB Indian Port (Nhava Sheva/Mundra) or CIF Durban basis depending on buyer preference." }
    ]
  }
];

const resources = [
  {
    id: "guide-jcb-seal-kit-identification",
    title: "How to Identify the Correct JCB 3DX Hydraulic Seal Kit by Production Year & Cylinder Type",
    slug: "how-to-identify-correct-jcb-3dx-hydraulic-seal-kit-by-year",
    author: "RRE International Engineering Technical Team",
    publishedDate: "2026-08-15",
    readingTime: "6 min read",
    category: "Technical Guide",
    excerpt: "Comprehensive guide to identifying JCB 3DX hydraulic cylinder seal kits across 1998–2026 production revisions. Includes cylinder bore/rod dimension charts and part number cross-references.",
    metaTitle: "How to Identify the Correct JCB 3DX Hydraulic Seal Kit | RRE International",
    metaDescription: "Comprehensive guide to identifying JCB 3DX hydraulic cylinder seal kits across 1998–2026 production revisions. Includes cylinder bore/rod dimension charts and part number cross-references.",
    content: `
      <h2>1. The Problem of Model Year Variations in JCB Hydraulic Cylinders</h2>
      <p>One of the most common procurement mistakes made by international fleet managers and spare parts stockists is ordering seal kits based solely on the generic model name <em>JCB 3DX</em>. JCB has evolved cylinder bore dimensions, rod diameters, and seal groove geometries across four major production eras.</p>
      
      <h2>2. Master Cylinder Dimension & Seal Kit Reference Chart</h2>
      <table class="spec-table">
        <thead>
          <tr>
            <th>Cylinder Function</th>
            <th>Bore (mm)</th>
            <th>Rod (mm)</th>
            <th>Part Number (Standard)</th>
            <th>Part Number (Heavy Duty)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Boom Lift Cylinder</td>
            <td>90 mm</td>
            <td>50 mm</td>
            <td><strong>991/00147</strong></td>
            <td>991/20021 (Viton)</td>
          </tr>
          <tr>
            <td>Dipper / Arm Cylinder</td>
            <td>100 mm</td>
            <td>60 mm</td>
            <td><strong>991/00156</strong></td>
            <td>991/00148</td>
          </tr>
          <tr>
            <td>Bucket Crowd Cylinder</td>
            <td>90 mm</td>
            <td>50 mm</td>
            <td><strong>991/00145</strong></td>
            <td>991/00147</td>
          </tr>
          <tr>
            <td>Slew Actuator Cylinder</td>
            <td>100 mm</td>
            <td>50 mm</td>
            <td><strong>991/00122</strong></td>
            <td>991/00123</td>
          </tr>
          <tr>
            <td>Stabilizer Outrigger</td>
            <td>80 mm</td>
            <td>50 mm</td>
            <td><strong>991/00100</strong></td>
            <td>991/00103</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Step-by-Step Field Identification Protocol</h2>
      <ol>
        <li><strong>Measure with Vernier Caliper:</strong> Always measure the chrome cylinder rod diameter at the gland entry. A 50mm rod vs 60mm rod immediately determines whether you need Kit 991/00147 or 991/00156.</li>
        <li><strong>Inspect Gland Seal Groove:</strong> Check if the gland seal utilizes a single U-cup polyurethane seal or a stepped buffer ring + secondary U-cup arrangement.</li>
        <li><strong>Verify Piston Seal Type:</strong> Modern JCB cylinders use a 5-piece compact piston seal (elastomer energizer + PTFE cap + dual POM anti-extrusion rings). Early models used a 3-piece cast iron piston ring pack.</li>
      </ol>

      <h2>4. Sourcing Direct from RRE International</h2>
      <p>RRE International manufactures all JCB, Caterpillar, and Case hydraulic seal kits using premium virgin 93 Shore A polyurethane and NBR elastomers specifically compounded for high operating temperatures up to 110°C.</p>
    `
  },
  {
    id: "guide-container-consolidation-spares",
    title: "B2B Importer's Guide to Container Consolidation for Earthmoving Spare Parts from India",
    slug: "b2b-importers-guide-container-consolidation-spare-parts-india",
    author: "RRE International Export Logistics Division",
    publishedDate: "2026-08-10",
    readingTime: "8 min read",
    category: "Export & Logistics",
    excerpt: "How international spare parts distributors maximize margin by consolidating high-density pins, bushes, gears, and volumetric seal kits into 20ft and 40ft sea containers from India.",
    metaTitle: "B2B Importer's Guide to Container Consolidation | RRE International",
    metaDescription: "How international spare parts distributors maximize margin by consolidating high-density pins, bushes, gears, and volumetric seal kits into 20ft and 40ft sea containers from India.",
    content: `
      <h2>1. The Economics of High-Density vs High-Volume Spares Consolidation</h2>
      <p>Earthmoving machinery spare parts present unique freight challenges. High-tensile pivot pins (EN9, EN18, EN19), bronze bushes, and crown wheel pinions are heavy and dense, quickly reaching the 28-tonne gross container payload limit. In contrast, seal kits, electrical solenoids, and filters take up volume without significant weight.</p>
      
      <h2>2. Optimal 20ft Container Mix Strategy</h2>
      <p>By balancing dense steel components with high-margin lightweight seal kits and filters, international importers minimize per-unit freight overheads while maintaining balanced warehouse stock.</p>
      
      <h2>3. VCI Anti-Corrosion Protection Protocol</h2>
      <p>All ocean consignments from RRE International are packaged to survive 30+ days of oceanic humidity with zero oxidation.</p>
    `
  },
  {
    id: "guide-king-pin-bush-metallurgy",
    title: "Understanding King Pin & Pivot Bush Metallurgy: EN9, EN18 & EN19 and Induction Hardening",
    slug: "king-pin-pivot-bush-metallurgy-en353-20mncr5-induction-hardening",
    author: "RRE International Metallurgy & Quality Lab",
    publishedDate: "2026-08-05",
    readingTime: "7 min read",
    category: "Engineering & Quality",
    excerpt: "A deep dive into steel grades, case depth, core ductility, and why cheap through-hardened pivot pins fail under heavy slew forces.",
    metaTitle: "King Pin & Pivot Bush Metallurgy Explained | RRE International",
    metaDescription: "A deep dive into steel grades, case depth, core ductility, and why cheap through-hardened pivot pins fail under heavy slew forces.",
    content: `
      <h2>1. The Anatomy of Pivot Pin Failure</h2>
      <p>Under heavy backhoe excavation, pivot pins endure alternating bending fatigue and extreme shearing forces. Pins that are through-hardened become brittle and snap, while untreated pins wear out within weeks.</p>
      
      <h2>2. Why RRE Uses Controlled Induction Case Hardening</h2>
      <p>We forge our pins from EN9, EN18 and EN19 alloy steels. Using high-frequency induction furnaces, we achieve a rock-hard outer case (58–62 HRC to 3.0mm depth) while preserving a ductile, shock-absorbing inner core (30–35 HRC).</p>
    `
  },
  {
    id: "guide-identify-jcb-part-by-number",
    title: "How to Identify a JCB Spare Part by Its Part Number",
    slug: "how-to-identify-jcb-spare-part-by-part-number",
    author: "RRE International Parts Desk",
    publishedDate: "2026-09-09",
    readingTime: "6 min read",
    category: "Parts Identification",
    excerpt: "How JCB part numbers are structured, where to find the number on a machine or a worn part, why the same part shows up written three different ways, and how to check you have the right reference before you order.",
    metaTitle: "How to Identify a JCB Spare Part by Part Number | RRE International",
    metaDescription: "A practical guide to reading JCB part numbers (e.g. 320/07434): the number format, where to find it, slash vs hyphen vs compact variants, superseded references, and how to verify the correct part before ordering.",
    content: `
      <h2>1. What a JCB part number looks like</h2>
      <p>Most JCB references follow a <strong>three-digit / five-character</strong> pattern, for example <strong>320/07434</strong>, <strong>991/00147</strong> or <strong>458/M1047</strong>. The block before the slash is a family/group code; the block after it identifies the specific part. Older references can be shorter or use different separators (<strong>02/200877</strong>, <strong>15/920103</strong>), and some carry a letter (<strong>332/Y1459</strong>, <strong>458/M1047</strong>). The number is a <em>catalogue reference</em> — it is not a dimension code and does not, on its own, tell you which machine or which production year the part fits.</p>

      <h2>2. Where to find the number</h2>
      <ul>
        <li><strong>On the old part.</strong> Cast, stamped or laser-etched into the component itself, or printed on the original packaging/label.</li>
        <li><strong>In the machine's parts manual</strong> (the illustrated parts catalogue for your model and serial range), against the exploded diagram for the assembly you are working on.</li>
        <li><strong>From your dealer's previous invoice</strong> for the same repair.</li>
        <li><strong>From the machine data plate</strong> for the model and serial number — you then look the assembly up in the parts manual for that serial range.</li>
      </ul>
      <p>If the number on the old part is unreadable, note the machine model and serial/chassis number and describe the assembly — that is usually enough for a parts desk to locate the reference.</p>

      <h2>3. The same part, written three ways</h2>
      <p>Buyers and stockists write the same reference differently. These are all the <strong>same part</strong>:</p>
      <table class="spec-table">
        <thead>
          <tr><th>Style</th><th>Example</th><th>Where you see it</th></tr>
        </thead>
        <tbody>
          <tr><td>Slash (OEM style)</td><td><strong>320/07434</strong></td><td>JCB catalogues, dealer systems</td></tr>
          <tr><td>Hyphen</td><td>320-07434</td><td>Web forms, spreadsheets, many aftermarket sites</td></tr>
          <tr><td>Compact (no separator)</td><td>32007434</td><td>Search boxes, SKU fields, barcodes</td></tr>
        </tbody>
      </table>
      <p>On RRE International product pages the primary reference is shown in the OEM slash format, with the hyphen and compact variants listed underneath as "Also written as", so a search in any style lands on the right page. When you send an enquiry, any format is fine.</p>

      <h2>4. Superseded and cross-referenced numbers</h2>
      <p>References change over a machine's life. A part first sold as one number can be <strong>superseded</strong> by a later one when JCB revises the design, and two numbers can be listed as interchangeable. If a number returns nothing, it may have been replaced — quote the number you have <em>and</em> the machine serial, and ask whether it has been superseded. Do not assume a visually similar part is a match; confirm the supersession in writing.</p>

      <h2>5. Verifying you have the right part before you order</h2>
      <ol>
        <li><strong>Measure the critical dimensions</strong> of the old part — for a pin, the diameter and overall length; for a seal kit, the cylinder bore and rod diameter; for a bush, the inner and outer diameter and length.</li>
        <li><strong>Compare the description</strong> — "boom ram seal kit", "king post upper bush", "10x37 crown wheel & pinion" — against the catalogue entry.</li>
        <li><strong>Check the fitment question</strong> — engine variant and production year affect hydraulic pump flanges, seal groove geometry and pin sizes even within one model line. See our guide on <a href="/resources/how-to-identify-correct-jcb-3dx-hydraulic-seal-kit-by-year">identifying the correct JCB 3DX seal kit by year</a>.</li>
      </ol>

      <h2>6. Sourcing the part from RRE International</h2>
      <p>Search the reference in any format in the catalogue at <a href="/products">rreinternational.com/products</a>, or send it to our parts desk with your machine serial number:</p>
      <ul>
        <li>Single part: use the enquiry button on the product page, or WhatsApp the number.</li>
        <li>Multiple parts: submit a <a href="/rfq">Bill of Materials (RFQ)</a> with references, quantities, machine models and your destination port.</li>
      </ul>
      <p>RRE International manufactures and exports aftermarket replacement parts as an independent, ISO 9001:2015 certified supplier; it is not an authorised JCB dealer. Part numbers are used for identification and cross-reference only.</p>
    `
  },
  {
    id: "guide-source-construction-parts-from-india",
    title: "How to Source Construction Equipment Spare Parts from India: A B2B Buyer's Guide",
    slug: "how-to-source-construction-equipment-spare-parts-from-india",
    author: "RRE International Export Desk",
    publishedDate: "2026-09-09",
    readingTime: "9 min read",
    category: "Export & Procurement",
    excerpt: "For fleet operators, workshops and parts distributors buying earthmoving spares from India: how to vet a supplier, structure an enquiry, choose Incoterms, plan the shipment, and get the documentation right for your region.",
    metaTitle: "How to Source Construction Equipment Spare Parts from India | RRE International",
    metaDescription: "A practical B2B guide to importing JCB, Caterpillar, Case and Komatsu aftermarket spare parts from India: supplier vetting, RFQ/BOM process, FOB vs CIF, LCL/FCL consolidation, transit times, and import documentation for the GCC and Africa.",
    content: `
      <h2>1. Why buyers source earthmoving spares from India</h2>
      <p>India has a deep manufacturing base for aftermarket earthmoving and backhoe-loader parts, built around one of the world's largest operating populations of JCB backhoes. For a distributor or fleet buyer this means competitive pricing on high-wear items — pivot pins, bronze bushes, hydraulic seal kits, transmission gears, water pumps, undercarriage parts — with the metallurgy and machining capability to make them to specification, and established sea-freight routes to the Gulf, Africa and beyond.</p>

      <h2>2. Vetting a supplier</h2>
      <p>Before placing an order, confirm:</p>
      <table class="spec-table">
        <thead><tr><th>Check</th><th>What good looks like</th></tr></thead>
        <tbody>
          <tr><td>Quality system</td><td>A current <strong>ISO 9001:2015</strong> certificate with a verifiable certificate number and issuing body.</td></tr>
          <tr><td>Manufacturer vs trader</td><td>In-house machining, hardening and testing — not a re-box operation. Ask for photos of the plant and the process for a part you intend to buy.</td></tr>
          <tr><td>Metallurgy & testing</td><td>Named steel grades (EN9/EN18/EN19, 20MnCr5, SAE 660 bronze), stated hardness and case depth, and dimensional inspection (CMM) for critical parts.</td></tr>
          <tr><td>Export experience</td><td>Familiarity with your region's conformity scheme (see §6), VCI marine packaging, and consolidation.</td></tr>
          <tr><td>Traceability</td><td>The part number, description and category you order match what is quoted, invoiced and shipped.</td></tr>
        </tbody>
      </table>
      <p>RRE International operates under ISO 9001:2015 (Certificate No. ECI/2512/2983) with in-house CNC machining, induction hardening, precision grinding, hydrostatic cylinder testing and CMM verification at its plant in Delhi NCR. See the <a href="/about">facility and quality page</a>.</p>

      <h2>3. Structuring the enquiry</h2>
      <p>A clear enquiry gets a firm quotation faster. Include:</p>
      <ul>
        <li><strong>Part references</strong> in any format (see our guide on <a href="/resources/how-to-identify-jcb-spare-part-by-part-number">reading JCB part numbers</a>), with quantities.</li>
        <li><strong>Machine model and serial number</strong> for each line, so fitment can be confirmed.</li>
        <li><strong>Destination port</strong> and whether you want <strong>FOB</strong> or <strong>CIF</strong> pricing.</li>
        <li><strong>Shipping mode</strong> preference — sea (LCL or FCL) or air for breakdown-critical items.</li>
      </ul>
      <p>For a handful of parts, enquire from the product page or by WhatsApp. For a full list, submit a <a href="/rfq">Bill of Materials (RFQ)</a> — you can upload a spreadsheet or PDF.</p>

      <h2>4. Incoterms for spare parts</h2>
      <table class="spec-table">
        <thead><tr><th>Term</th><th>Seller covers</th><th>Buyer covers</th><th>Typical use</th></tr></thead>
        <tbody>
          <tr><td><strong>FOB</strong> Indian port (Nhava Sheva / Mundra)</td><td>Goods, export packing, inland haulage, export clearance, loading on vessel</td><td>Ocean freight, insurance, destination charges, import clearance, delivery</td><td>Buyers with their own freight forwarder / consolidation</td></tr>
          <tr><td><strong>CIF</strong> destination port</td><td>All of the above plus ocean freight and marine insurance to the named port</td><td>Destination charges, import clearance, delivery</td><td>Buyers who want a single landed cost to the port</td></tr>
        </tbody>
      </table>

      <h2>5. Planning the shipment: LCL vs FCL and transit times</h2>
      <p>Dense steel parts (pins, bushes, gears) reach a 20 ft container's weight limit quickly; light, bulky items (seal kits, filters, electrical) fill volume. A balanced mix keeps freight cost per part down. Consolidate small repeat orders into one sailing rather than shipping monthly parcels. Indicative sea transit from western Indian ports:</p>
      <table class="spec-table">
        <thead><tr><th>Destination</th><th>Main ports</th><th>Sea transit</th></tr></thead>
        <tbody>
          <tr><td>UAE</td><td>Jebel Ali, Khalifa</td><td>3–5 days</td></tr>
          <tr><td>Qatar</td><td>Hamad</td><td>5–7 days</td></tr>
          <tr><td>Saudi Arabia</td><td>Jeddah, Dammam</td><td>6–9 days</td></tr>
          <tr><td>Kenya / East Africa</td><td>Mombasa</td><td>12–16 days</td></tr>
          <tr><td>South Africa</td><td>Durban</td><td>18–24 days</td></tr>
          <tr><td>Nigeria / West Africa</td><td>Apapa, Tin Can Island</td><td>22–28 days</td></tr>
        </tbody>
      </table>
      <p>See the <a href="/export-process">export process page</a> for packaging and consolidation detail, and the guide on <a href="/resources/b2b-importers-guide-container-consolidation-spare-parts-india">container consolidation strategy</a>.</p>

      <h2>6. Import documentation by region</h2>
      <p>Requirements vary by destination. Common ones:</p>
      <ul>
        <li><strong>UAE:</strong> Commercial invoice attested by Chamber of Commerce, Certificate of Origin (India–UAE CEPA format for preferential duty), Bill of Lading, packing list with HSN codes.</li>
        <li><strong>Saudi Arabia:</strong> SABER platform Product & Shipment Conformity Certificates (PCoC / SCoC), legalised commercial invoice, Certificate of Origin, "Made in India" country-of-origin marking on parts and packaging.</li>
        <li><strong>Qatar:</strong> Chamber-attested invoice, Certificate of Origin, Certificate of Conformity (QGOS), detailed packing list.</li>
        <li><strong>Nigeria:</strong> SONCAP certificate, Form M and e-RAR, Combined Certificate of Value and Origin (CCVO).</li>
        <li><strong>Kenya:</strong> Pre-Export Verification of Conformity (PVoC / CoC by an accredited body), Import Declaration Form, Certificate of Origin.</li>
        <li><strong>South Africa:</strong> SARS clearance documents, invoice with HSN classification, Certificate of Origin (DA59 where required).</li>
      </ul>
      <p>A capable exporter will prepare or coordinate these — including uploading test reports and certificates to SABER, or arranging PVoC inspection at the works — so the consignment clears without demurrage. Country-specific detail is on the <a href="/export">export markets pages</a>.</p>

      <h2>7. Protecting parts for the voyage</h2>
      <p>Machined and hardened steel corrodes in salt-air humidity over a 20–30 day voyage. Ask how parts are protected: ultrasonic degreasing, VCI rust-inhibitor oil, vacuum-sealed barrier film, foam or crating, and desiccant inside fumigated ISPM-15 wooden cases for long transits. RRE International runs an automated VCI anti-corrosion packaging line for oceanic export.</p>

      <h2>8. Getting a quotation</h2>
      <p>Send your part list and destination to RRE International's export desk via the <a href="/rfq">RFQ form</a> or WhatsApp. You'll get an FOB or CIF proforma with lead times, and guidance on documentation for your market. RRE International is an independent aftermarket manufacturer and exporter, not an authorised dealer of any equipment brand.</p>
    `
  }
];

module.exports = {
  organization,
  categories,
  brands,
  machines,
  models,
  machineModels: models,
  products,
  countries,
  resources
};
