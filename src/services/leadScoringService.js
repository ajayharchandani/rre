// src/services/leadScoringService.js
const { countries } = require('../data/catalog');

class LeadScoringService {
  /**
   * Score an incoming RFQ or Lead from 0 to 100
   * 80-100: HOT
   * 50-79: WARM
   * 25-49: COLD
   * 0-24: UNQUALIFIED / SPAM RISK
   */
  static calculate(lead = {}) {
    let score = 0;
    const reasons = [];

    // 1. Destination Country Verification (Max 20 pts)
    const confirmedCountry = countries.find(c => 
      c.name.toLowerCase() === (lead.country || '').toLowerCase() ||
      c.slug === (lead.country || '').toLowerCase()
    );

    if (confirmedCountry) {
      score += 20;
      reasons.push(`Target export country confirmed (${confirmedCountry.name}) [+20]`);
    } else if (lead.country && lead.country.trim().length > 2) {
      score += 10;
      reasons.push(`International destination provided (${lead.country}) [+10]`);
    }

    // 2. Business Email / Corporate Domain (Max 15 pts)
    const email = (lead.email || '').toLowerCase().trim();
    const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'mail.ru'];
    const emailDomain = email.split('@')[1];

    if (emailDomain && !freeProviders.includes(emailDomain)) {
      score += 15;
      reasons.push(`Corporate/Company email domain (@${emailDomain}) [+15]`);
    } else if (email) {
      score += 8;
      reasons.push(`Valid email provided [+8]`);
    }

    // 3. Company Name & Buyer Type (Max 15 pts)
    if (lead.company && lead.company.trim().length > 2) {
      score += 10;
      reasons.push(`Company name specified [+10]`);
    }
    if (lead.buyerType && ['distributor', 'dealer', 'fleet_owner', 'contractor'].includes(lead.buyerType)) {
      score += 5;
      reasons.push(`Qualified B2B buyer type (${lead.buyerType}) [+5]`);
    }

    // 4. Specific Part Number / Machine Model Detail (Max 25 pts)
    if (lead.partNumber && lead.partNumber.trim().length > 3) {
      score += 15;
      reasons.push(`Exact part number supplied (${lead.partNumber}) [+15]`);
    }
    if (lead.machineModel && lead.machineModel.trim().length > 2) {
      score += 10;
      reasons.push(`Specific machine model supplied (${lead.machineModel}) [+10]`);
    }

    // 5. Quantity & Purchase Urgency (Max 15 pts)
    const qty = parseInt(lead.quantity, 10);
    if (!isNaN(qty) && qty >= 5) {
      score += 10;
      reasons.push(`Commercial/Wholesale quantity (Qty: ${qty}) [+10]`);
    } else if (!isNaN(qty) && qty >= 1) {
      score += 5;
      reasons.push(`Single unit inquiry [+5]`);
    }

    if (lead.urgency === 'asap' || lead.urgency === 'within_week') {
      score += 5;
      reasons.push(`High urgency purchase timeline [+5]`);
    }

    // 6. Bill of Materials (BOM) / File Upload (Max 10 pts)
    if (lead.hasFileUpload || (lead.files && lead.files.length > 0)) {
      score += 10;
      reasons.push(`Parts list / Bill of Materials (BOM) uploaded [+10]`);
    }

    // 7. Honeypot check (Instant Disqualification)
    if (lead.website || lead.honeypot) {
      score = 0;
      reasons.push(`Honeypot triggered — identified as automated spam [-100]`);
    }

    // Determine lead band
    let band = 'unqualified';
    if (score >= 75) {
      band = 'hot';
    } else if (score >= 45) {
      band = 'warm';
    } else if (score >= 20) {
      band = 'cold';
    }

    return {
      score: Math.min(score, 100),
      band,
      reasons
    };
  }
}

module.exports = LeadScoringService;
