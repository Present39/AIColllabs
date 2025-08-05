// Compliance Service for child safety and legal requirements
const { v4: uuidv4 } = require('uuid');

class ComplianceService {
  constructor() {
    this.consentRequests = new Map();
    this.ageVerificationRules = {
      minAge: 6,
      parentalConsentAge: 16,
      schoolAccountAge: 13
    };
  }

  // Age verification with compliance rules
  async verifyAge(age, birthDate = null) {
    const rules = this.ageVerificationRules;
    
    // Basic age validation
    if (age < rules.minAge) {
      return {
        isValid: false,
        requiresParentalConsent: true,
        requiresSupervisorApproval: true,
        message: "Gebruikers moeten minimaal 6 jaar oud zijn.",
        restrictions: ['no-purchase', 'limited-features', 'supervisor-required']
      };
    }

    // Parental consent required for under 16
    if (age < rules.parentalConsentAge) {
      return {
        isValid: true,
        requiresParentalConsent: true,
        requiresSupervisorApproval: false,
        message: "Ouderlijke toestemming vereist voor gebruikers onder de 16.",
        restrictions: ['parental-approval-required']
      };
    }

    // Full access for 16+
    return {
      isValid: true,
      requiresParentalConsent: false,
      requiresSupervisorApproval: false,
      message: "Volledige toegang toegestaan.",
      restrictions: []
    };
  }

  // Initiate parental consent process
  async initiateParentalConsent(account) {
    const consentToken = uuidv4();
    const consentRequest = {
      id: consentToken,
      accountId: account.id,
      parentEmail: account.parentEmail,
      childName: account.firstName,
      childAge: account.age,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      attempts: 0
    };

    this.consentRequests.set(consentToken, consentRequest);

    // In production, send email to parent
    await this.sendParentalConsentEmail(consentRequest);

    return {
      consentToken,
      message: "Toestemmings-e-mail verzonden naar ouder/verzorger.",
      expiresAt: consentRequest.expiresAt
    };
  }

  // Process parental consent response
  async processParentalConsent(accountId, consentToken, approved, parentInfo = {}) {
    const consentRequest = this.consentRequests.get(consentToken);
    
    if (!consentRequest) {
      return {
        success: false,
        error: "Ongeldig of verlopen toestemmingstoken."
      };
    }

    if (consentRequest.accountId !== accountId) {
      return {
        success: false,
        error: "Token komt niet overeen met account."
      };
    }

    if (new Date() > consentRequest.expiresAt) {
      return {
        success: false,
        error: "Toestemmingsverzoek is verlopen."
      };
    }

    // Update consent request
    consentRequest.status = approved ? 'approved' : 'denied';
    consentRequest.processedAt = new Date();
    consentRequest.parentInfo = parentInfo;
    this.consentRequests.set(consentToken, consentRequest);

    return {
      success: true,
      approved,
      message: approved 
        ? "Ouderlijke toestemming verleend. Account geactiveerd."
        : "Ouderlijke toestemming geweigerd. Account toegang beperkt."
    };
  }

  // Get consent request details
  async getConsentRequest(consentToken) {
    return this.consentRequests.get(consentToken);
  }

  // Check if account needs supervisor approval
  async requiresSupervisorApproval(account) {
    if (account.accountType === 'school') {
      return {
        required: true,
        type: 'school-supervisor',
        message: "Schoolaccount vereist goedkeuring van supervisor."
      };
    }

    if (account.age < this.ageVerificationRules.schoolAccountAge) {
      return {
        required: true,
        type: 'parental-supervisor',
        message: "Jonge gebruikers vereisen supervisor goedkeuring."
      };
    }

    return {
      required: false,
      type: null,
      message: "Geen supervisor goedkeuring vereist."
    };
  }

  // Validate purchase permissions
  async validatePurchasePermissions(account, purchaseDetails) {
    const ageVerification = await this.verifyAge(account.age);
    
    if (!ageVerification.isValid) {
      return {
        allowed: false,
        reason: "Account voldoet niet aan minimale leeftijdsvereisten."
      };
    }

    if (ageVerification.requiresParentalConsent && account.status !== 'active') {
      return {
        allowed: false,
        reason: "Ouderlijke toestemming vereist voor aankopen."
      };
    }

    // Additional purchase restrictions based on age
    if (account.age < 13 && purchaseDetails.amount > 50) {
      return {
        allowed: false,
        reason: "Aankopen boven €50 vereisen ouderlijke goedkeuring voor gebruikers onder 13."
      };
    }

    return {
      allowed: true,
      restrictions: ageVerification.restrictions
    };
  }

  // Generate parental consent form data
  generateConsentForm(consentRequest) {
    return {
      childName: consentRequest.childName,
      childAge: consentRequest.childAge,
      platform: "AIColllabs",
      services: [
        "Educatieve games en activiteiten",
        "Persoonlijke leerprofielen",
        "Voortgang bijhouden",
        "Veilige communicatie met AI-begeleiders"
      ],
      dataCollection: [
        "Naam en leeftijd",
        "Leervoorkeuren en interesses",
        "Voortgangsgegevens",
        "Interactiegeschiedenis met platform"
      ],
      parentRights: [
        "Toegang tot gegevens van uw kind",
        "Verzoek tot verwijdering van gegevens",
        "Wijzigen van privacy-instellingen",
        "Account deactiveren"
      ]
    };
  }

  // Send parental consent email (mock implementation)
  async sendParentalConsentEmail(consentRequest) {
    console.log(`Sending parental consent email to ${consentRequest.parentEmail}`);
    console.log(`Consent URL: ${process.env.BASE_URL}/compliance/consent/${consentRequest.id}`);
    
    // In production, integrate with email service
    return {
      sent: true,
      email: consentRequest.parentEmail,
      consentUrl: `${process.env.BASE_URL}/compliance/consent/${consentRequest.id}`
    };
  }

  // Get compliance status for account
  async getComplianceStatus(accountId) {
    // Find any pending consent requests
    const pendingConsent = Array.from(this.consentRequests.values())
      .find(req => req.accountId === accountId && req.status === 'pending');

    return {
      accountId,
      hasParentalConsent: !pendingConsent,
      pendingConsentRequest: pendingConsent ? {
        token: pendingConsent.id,
        expiresAt: pendingConsent.expiresAt,
        parentEmail: pendingConsent.parentEmail
      } : null,
      lastChecked: new Date()
    };
  }
}

module.exports = new ComplianceService();