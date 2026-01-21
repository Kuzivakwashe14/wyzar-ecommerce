// backend/config/platformPaymentDetails.js

const platformPaymentDetails = {
    // Platform Name / Business Name
    businessName: "Wyzar Marketplace",
  
    // EcoCash Details
    ecocash: {
      name: "Wyzar Marketplace",
      number: "0771234567" // Example number, should be env var in production
    },
  
    // Bank Details
    bank: {
      bankName: "Stanbic Bank",
      accountName: "Wyzar Marketplace Pvt Ltd",
      accountNumber: "9140001234567" // Example number
    },
  
    // Contact for Payment Confirmation
    contact: {
      whatsapp: "263771234567",
      email: "payments@wyzar.co.zw"
    }
  };
  
  module.exports = platformPaymentDetails;
