// src/data/categoryTaxonomy.js
//
// The customer-facing catalogue category taxonomy for RRE International.
//
// Source of truth for these 26 categories: the section headings that appear
// throughout Jcb catalogue E.pdf (extracted to reports/pdf-extract.jsonl).
// Two categories (Bucket Parts, Light & Lenses) have no clean OCR'd section
// header in the extraction but are unambiguously present as product groups
// on PDF pages 22 and 66 respectively — see reports/category-migration-report.md
// for the page-level evidence trail.
//
// This file is read by scripts/build-category-mapping.js (Phase 2 of the
// catalog build) and is NOT itself product data — it is the classification
// ruleset used to assign each of the 85,150 Excel products to one of these
// categories.

const CATEGORIES = [
  { id: 'axle-wheel-parts', name: 'Axle & Wheel Parts', description: 'Front and rear axle assemblies, axle shafts, wheel hubs, wheel nuts/studs, kingpins, and differential components.' },
  { id: 'bearings', name: 'Bearings', description: 'Hub, thrust, transmission, and differential bearings for axle and drivetrain assemblies.' },
  { id: 'body-parts', name: 'Body Parts', description: 'Fuel and hydraulic tank caps, grilles, clamp housings, and other machine body/chassis components.' },
  { id: 'brake-parts', name: 'Brake Parts', description: 'Brake master cylinders, reservoirs, friction plates, pipes, and pad assemblies.' },
  { id: 'bucket-parts', name: 'Bucket Parts', description: 'Bucket assemblies, tooth points, side cutters, and bucket mounting hardware.' },
  { id: 'bushes-bearing-liners', name: 'Bushes / Bearing Liners', description: 'Pivot, spring, and repair bushes / bearing liners for boom, dipper, and bucket linkages.' },
  { id: 'cabin-parts', name: 'Cabin Parts', description: 'Door handles, latches, window mechanisms, wipers, and cabin hardware.' },
  { id: 'cables', name: 'Cables', description: 'Throttle, brake, and bonnet-release control cables.' },
  { id: 'column-switch', name: 'Column Switch', description: 'Steering column forward/reverse, lights, and wiper switch assemblies.' },
  { id: 'electrical-parts', name: 'Electrical Parts', description: 'Sensors, relays, fuses, solenoid coils, connectors, and general electrical components.' },
  { id: 'engine-parts', name: 'Engine Parts', description: 'Crankshaft pulleys, water pumps, thermostats, gaskets-in-place, and other engine components.' },
  { id: 'filters', name: 'Filters', description: 'Oil, fuel, hydraulic, and air pre-cleaner filters and strainers.' },
  { id: 'gasket', name: 'Gasket', description: 'Cylinder head, manifold, thermostat housing, and tank gaskets.' },
  { id: 'greasing', name: 'Greasing', description: 'Grease nipples, grease guns, and greasing accessories.' },
  { id: 'hoses', name: 'Hoses', description: 'Oil cooler, water, and hydraulic hoses with associated adaptors and clamps.' },
  { id: 'hydraulic-pump-drive', name: 'Hydraulic / Pump Drive', description: 'Main hydraulic pumps, pump drive components, relief valves, and valve blocks.' },
  { id: 'light-lenses', name: 'Light & Lenses', description: 'Headlamps, tail lights, indicator lenses, and working lights.' },
  { id: 'pins', name: 'Pins', description: 'Pivot pins, cotter pins, and general linkage pins.' },
  { id: 'seals-seal-kits', name: 'Seals & Seal Kits', description: 'O-rings, Dowty seals, oil seals, and hydraulic cylinder seal kits.' },
  { id: 'shim-spacer-washer', name: 'Shim / Spacer / Washer', description: 'Shims, spacers, thrust washers, and circlips.' },
  { id: 'solenoid', name: 'Solenoid', description: 'Solenoid valves, coils, and pump cut-off solenoids.' },
  { id: 'torque-converter', name: 'Torque Converter', description: 'Torque converter assemblies for transmission drivetrains.' },
  { id: 'transmission-gear-parts', name: 'Transmission & Gear Parts', description: 'Transmission gears, clutch/friction plates, layshafts, and gear housing components.' },
  { id: 'transmission-pumps', name: 'Transmission & Pumps', description: 'Transmission oil pumps and related drive components.' },
  { id: 'uj-cross-spider-kit', name: 'U.J. Cross / Spider Kit', description: 'Universal joint kits, propshaft cross straps, and spider kit assemblies.' },
  { id: 'wear-pads-wear-plates', name: 'Wear Pads / Wear Plates', description: 'Wear pads, wear slides, and stabiliser wear plates.' }
];

// Normalized PDF section-header text -> category id.
// "Normalized" = uppercased, whitespace/punctuation collapsed to nothing,
// which absorbs the OCR spacing noise seen in reports/pdf-extract.jsonl
// (e.g. "BRAKEPARTS" vs "BRAKE PARTS", "CABINPARTS" vs "CABIN PARTS").
function normalizeHeaderText(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z]/g, '');
}

const HEADER_ALIASES = {
  'AXLEANDWHEELPARTS': 'axle-wheel-parts',
  'BEARINGS': 'bearings',
  'BODYPARTS': 'body-parts',
  'BRAKEPARTS': 'brake-parts',
  'BUSHESTBEARINGLINERS': 'bushes-bearing-liners',   // OCR misread "&" as "T"
  'BUSHESBEARINGLINERS': 'bushes-bearing-liners',
  'CABINPARTS': 'cabin-parts',
  'CONTROLCABLES': 'cables',
  'COLUMNSWITCHES': 'column-switch',
  'ELECTRICALPARTS': 'electrical-parts',
  'ENGINEPARTS': 'engine-parts',
  'FILTERS': 'filters',
  'GASKETS': 'gasket',
  'GREASING': 'greasing',
  'HOSES': 'hoses',
  'HYDRAULICPUMPDRIVE': 'hydraulic-pump-drive',
  'PINS': 'pins',
  'SEALSORINGSSEALKITS': 'seals-seal-kits',
  'SHIMSPACERSHIMWASHER': 'shim-spacer-washer',
  'SOLENOIDS': 'solenoid',
  'TORQUECONVERTERS': 'torque-converter',
  'TRANSMISSIONANDGEARPARTS': 'transmission-gear-parts',
  'TRANSMISSIONPUMP': 'transmission-pumps',
  'UJCROSSSPIDERKITS': 'uj-cross-spider-kit',
  'WEARPADSWEARSLIDES': 'wear-pads-wear-plates'
};

// Ordered keyword classification rules — evaluated top to bottom, first
// match wins. Order runs from most specific/distinctive term to most
// generic, so e.g. "PARKING BRAKE CABLE" matches Cables (rule 17) before
// it would otherwise match Brake Parts (rule 18) on the word BRAKE.
// Confidence is always 'medium' for this path (vs 'high' for direct PDF
// OE-reference matches) — it is pattern inference over the description
// text, not a sourced fact.
const KEYWORD_RULES = [
  { categoryId: 'uj-cross-spider-kit', pattern: /U\.?J\.?\s?CROSS|SPIDER\s?KIT|UNIVERSAL\s?JOINT|PROP\s?SHAFT/ },
  { categoryId: 'torque-converter', pattern: /TORQUE\s?CONVERTER/ },
  { categoryId: 'solenoid', pattern: /SOLENOID/ },
  { categoryId: 'column-switch', pattern: /COLUMN\s?SWITCH/ },
  { categoryId: 'transmission-pumps', pattern: /TRANSMISSION\s?(OIL\s?)?PUMP/ },
  { categoryId: 'hydraulic-pump-drive', pattern: /HYDRAULIC\s?PUMP|PUMP\s?DRIVE|RELIEF\s?VALVE|VALVE\s?BLOCK|SPOOL/ },
  { categoryId: 'transmission-gear-parts', pattern: /TRANSMISSION|\bGEAR\b|CLUTCH\s?PLATE|FRICTION\s?PLATE|LAYSHAFT/ },
  { categoryId: 'wear-pads-wear-plates', pattern: /WEAR\s?PAD|WEAR\s?SLIDE|WEAR\s?PLATE/ },
  { categoryId: 'shim-spacer-washer', pattern: /\bSHIM\b|\bSPACER\b|\bWASHER\b|CIRCLIP/ },
  { categoryId: 'greasing', pattern: /GREAS(E|ING)|NIPPLE/ },
  { categoryId: 'gasket', pattern: /GASKET/ },
  { categoryId: 'filters', pattern: /FILTER|STRAINER|PRECLEANER/ },
  { categoryId: 'hoses', pattern: /\bHOSE\b/ },
  { categoryId: 'seals-seal-kits', pattern: /\bSEAL\b|O[- ]?RING|DOWTY/ },
  { categoryId: 'bushes-bearing-liners', pattern: /\bBUSH(ING)?\b/ },
  { categoryId: 'bearings', pattern: /\bBEARING\b/ },
  { categoryId: 'cables', pattern: /\bCABLE\b/ },
  { categoryId: 'brake-parts', pattern: /\bBRAKE\b/ },
  { categoryId: 'light-lenses', pattern: /\bLIGHT\b|\bLAMP\b|\bLENS\b|BEACON/ },
  { categoryId: 'electrical-parts', pattern: /\bSWITCH\b|SENSOR|\bRELAY\b|\bFUSE\b|WIRING|CONNECTOR|ELECTRICAL/ },
  { categoryId: 'engine-parts', pattern: /\bENGINE\b|CRANKSHAFT|\bPISTON\b|CYLINDER\s?HEAD|THERMOSTAT|BELT\s?TENSIONER/ },
  { categoryId: 'bucket-parts', pattern: /\bBUCKET\b|TOOTH\s?POINT|SIDE\s?CUTTER/ },
  { categoryId: 'axle-wheel-parts', pattern: /\bAXLE\b|WHEEL\s?NUT|WHEEL\s?STUD|KING\s?PIN|DIFFERENTIAL/ },
  { categoryId: 'pins', pattern: /\bPIN\b/ },
  { categoryId: 'cabin-parts', pattern: /\bCABIN\b|\bDOOR\b|\bWINDOW\b|\bWIPER\b|\bMIRROR\b|\bLATCH\b|\bHINGE\b|BONNET/ },
  { categoryId: 'body-parts', pattern: /\bBODY\b|TANK\s?CAP|\bGRILL\b|CLAMP\s?HOUSING|MUDGUARD|FENDER/ }
];

module.exports = { CATEGORIES, HEADER_ALIASES, KEYWORD_RULES, normalizeHeaderText };
