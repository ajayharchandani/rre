// src/services/whatsAppService.js
const { organization } = require('../data/catalog');

class WhatsAppService {
  static getNumber() {
    return organization.contact.whatsappNumber || '919811150645';
  }

  /**
   * Build dynamic pre-filled WhatsApp click URL with contextual parameters
   */
  static buildUrl(options = {}) {
    const {
      productName,
      partNumber,
      machineModel,
      quantity = '1',
      destinationCountry,
      sourceUrl,
      intent = 'inquiry',
      customMessage
    } = options;

    const number = this.getNumber();

    if (customMessage) {
      return `https://wa.me/${number}?text=${encodeURIComponent(customMessage)}`;
    }

    let message = `Hello RRE International,\n\n`;

    if (intent === 'rfq_quick') {
      message += `I am requesting an immediate export quotation:\n`;
    } else if (intent === 'check_availability') {
      message += `Please check price & export availability for:\n`;
    } else {
      message += `I found this on your website and would like a price & availability quote:\n`;
    }

    if (partNumber) {
      message += `• Part Number: ${partNumber}\n`;
    }
    if (productName) {
      message += `• Product: ${productName}\n`;
    }
    if (machineModel) {
      message += `• Machine / Model: ${machineModel}\n`;
    }
    if (quantity) {
      message += `• Quantity Required: ${quantity}\n`;
    }
    if (destinationCountry) {
      message += `• Destination Port / Country: ${destinationCountry}\n`;
    }
    if (sourceUrl) {
      message += `\nReference Link: ${sourceUrl}`;
    }

    message += `\nPlease share FOB / CIF export pricing. Thank you!`;

    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}

module.exports = WhatsAppService;
