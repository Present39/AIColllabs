// AIColllabs Frontend Application
class AIColllabsApp {
    constructor() {
        this.currentSession = null;
        this.currentAccount = null;
        this.authToken = localStorage.getItem('authToken');
        this.init();
    }

    async init() {
        // Initialize the application
        await this.startClaudetteSession();
        await this.loadProducts();
        
        if (this.authToken) {
            await this.loadAccountInfo();
        }
    }

    // Phase 1: Claudette Interaction Engine
    async startClaudetteSession() {
        try {
            const response = await fetch('/api/claudette/welcome', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            this.currentSession = data.sessionId;
            
            this.addMessage('claudette', data.message);
            this.showWelcomeOptions(data.options);
            
        } catch (error) {
            console.error('Failed to start Claudette session:', error);
            this.addMessage('system', 'Er ging iets mis bij het starten van de chat. Probeer de pagina te verversen.');
        }
    }

    async startAccountMode() {
        this.hideWelcomeButtons();
        
        try {
            const response = await fetch('/api/claudette/account-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.currentSession })
            });
            
            const data = await response.json();
            this.addMessage('claudette', data.message);
            this.enableChatInput();
            
        } catch (error) {
            console.error('Failed to start account mode:', error);
        }
    }

    async startBrowseMode() {
        this.hideWelcomeButtons();
        
        try {
            const response = await fetch('/api/claudette/browse-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.currentSession })
            });
            
            const data = await response.json();
            this.addMessage('claudette', data.message);
            this.showProductOptions(data.options);
            this.enableChatInput();
            
        } catch (error) {
            console.error('Failed to start browse mode:', error);
        }
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addMessage('user', message);
        input.value = '';
        
        try {
            const response = await fetch('/api/claudette/conversation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSession,
                    message: message
                })
            });
            
            const data = await response.json();
            this.addMessage('claudette', data.response.message);
            
            // Handle special responses
            if (data.response.action === 'create-profile') {
                await this.handleProfileCreation(data.response);
            } else if (data.response.action === 'search') {
                await this.handleProductSearch(data.response);
            }
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addMessage('system', 'Er ging iets mis. Probeer het opnieuw.');
        }
    }

    async handleProfileCreation(response) {
        try {
            // Extract profile data from conversation
            const profileData = this.extractProfileData();
            
            const createResponse = await fetch('/api/accounts/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: this.currentSession,
                    ...profileData
                })
            });
            
            const accountData = await createResponse.json();
            
            if (accountData.token) {
                this.authToken = accountData.token;
                localStorage.setItem('authToken', this.authToken);
                this.currentAccount = accountData.account;
                
                this.addMessage('claudette', accountData.message);
                this.showAccountLink();
                await this.loadAccountInfo();
            }
            
        } catch (error) {
            console.error('Failed to create profile:', error);
            this.addMessage('claudette', 'Er ging iets mis bij het aanmaken van je profiel. Probeer het opnieuw.');
        }
    }

    // Phase 3: Product Management
    async loadProducts() {
        try {
            const response = await fetch('/api/products/catalog');
            const data = await response.json();
            
            this.displayProducts(data.products);
            
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    async filterProducts(category) {
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        try {
            const url = category === 'all' 
                ? '/api/products/catalog'
                : `/api/products/catalog/${category}`;
                
            const response = await fetch(url);
            const data = await response.json();
            
            const products = data.products || data.items;
            this.displayProducts(products);
            
        } catch (error) {
            console.error('Failed to filter products:', error);
        }
    }

    displayProducts(products) {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';
        
        products.forEach(product => {
            const productCard = this.createProductCard(product);
            grid.appendChild(productCard);
        });
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.innerHTML = `
            <div class="product-image">
                <div class="product-type ${product.type}">${this.getTypeLabel(product.type)}</div>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-details">
                    <span class="age-group">Leeftijd: ${product.ageGroup}</span>
                    <span class="rating">★ ${product.rating}</span>
                </div>
                <div class="product-footer">
                    <span class="price">€${product.price}</span>
                    <button class="btn btn-primary" onclick="app.addToCart('${product.id}')">
                        Koop Nu
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    getTypeLabel(type) {
        const labels = {
            'game': 'Game',
            'subscription': 'Abonnement',
            'blueprint': 'Blueprint'
        };
        return labels[type] || type;
    }

    // Phase 4: Purchase Flow
    async addToCart(productId) {
        if (!this.authToken) {
            this.addMessage('claudette', 'Je moet eerst een account aanmaken om producten te kunnen kopen. Zal ik je helpen?');
            this.showSection('home');
            return;
        }

        try {
            const response = await fetch(`/api/products/product/${productId}`);
            const product = await response.json();
            
            await this.initializeCheckout([{ ...product, quantity: 1 }]);
            
        } catch (error) {
            console.error('Failed to add to cart:', error);
        }
    }

    async initializeCheckout(products) {
        try {
            const response = await fetch('/api/payments/checkout/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    accountId: this.currentAccount.id,
                    products: products
                })
            });
            
            const checkoutData = await response.json();
            
            if (response.ok) {
                this.showCheckoutModal(checkoutData);
            } else {
                alert(checkoutData.error);
            }
            
        } catch (error) {
            console.error('Failed to initialize checkout:', error);
        }
    }

    showCheckoutModal(checkoutData) {
        const modal = document.getElementById('checkoutModal');
        const content = document.getElementById('checkoutContent');
        
        content.innerHTML = `
            <div class="checkout-summary">
                <h3>Bestelling Overzicht</h3>
                <div class="summary-details">
                    <div class="line-item">
                        <span>Subtotaal:</span>
                        <span>€${checkoutData.summary.subtotal}</span>
                    </div>
                    <div class="line-item">
                        <span>BTW (21%):</span>
                        <span>€${checkoutData.summary.tax}</span>
                    </div>
                    <div class="line-item total">
                        <span>Totaal:</span>
                        <span>€${checkoutData.summary.total}</span>
                    </div>
                </div>
            </div>
            
            <div class="payment-methods">
                <h3>Betaalmethode</h3>
                ${checkoutData.paymentMethods.map(method => `
                    <label class="payment-method">
                        <input type="radio" name="paymentMethod" value="${method.id}">
                        <span>${method.name}</span>
                    </label>
                `).join('')}
            </div>
            
            <div class="payment-form" id="paymentForm">
                <!-- Payment form will be loaded based on selected method -->
            </div>
            
            <div class="checkout-actions">
                <button class="btn btn-primary" onclick="app.processPayment('${checkoutData.checkoutId}')">
                    Betaal €${checkoutData.summary.total}
                </button>
                <button class="btn btn-secondary" onclick="app.closeCheckout()">
                    Annuleren
                </button>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Add payment method change listener
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.showPaymentForm(e.target.value);
            });
        });
    }

    showPaymentForm(paymentMethod) {
        const form = document.getElementById('paymentForm');
        
        switch (paymentMethod) {
            case 'card':
                form.innerHTML = `
                    <div class="payment-fields">
                        <input type="text" id="cardNumber" placeholder="Kaartnummer" required>
                        <input type="text" id="expiryDate" placeholder="MM/YY" required>
                        <input type="text" id="cvv" placeholder="CVV" required>
                        <input type="text" id="holderName" placeholder="Naam op kaart" required>
                    </div>
                `;
                break;
            case 'ideal':
                form.innerHTML = `
                    <div class="payment-fields">
                        <select id="bankSelect" required>
                            <option value="">Selecteer je bank</option>
                            <option value="abn_amro">ABN AMRO</option>
                            <option value="ing">ING</option>
                            <option value="rabobank">Rabobank</option>
                            <option value="sns_bank">SNS Bank</option>
                        </select>
                    </div>
                `;
                break;
            case 'paypal':
                form.innerHTML = `
                    <div class="payment-fields">
                        <p>Je wordt doorgestuurd naar PayPal om de betaling te voltooien.</p>
                    </div>
                `;
                break;
        }
    }

    async processPayment(checkoutId) {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        
        if (!paymentMethod) {
            alert('Selecteer een betaalmethode');
            return;
        }

        const paymentDetails = this.getPaymentDetails(paymentMethod);
        
        try {
            const response = await fetch('/api/payments/checkout/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({
                    checkoutId,
                    paymentMethod,
                    paymentDetails
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await this.confirmOrder(result.orderId);
            } else {
                alert(result.message || 'Betaling mislukt');
            }
            
        } catch (error) {
            console.error('Payment processing failed:', error);
            alert('Er ging iets mis bij de betaling');
        }
    }

    getPaymentDetails(paymentMethod) {
        switch (paymentMethod) {
            case 'card':
                return {
                    cardNumber: document.getElementById('cardNumber').value,
                    expiryDate: document.getElementById('expiryDate').value,
                    cvv: document.getElementById('cvv').value,
                    holderName: document.getElementById('holderName').value
                };
            case 'ideal':
                return {
                    bank: document.getElementById('bankSelect').value
                };
            case 'paypal':
                return {
                    email: 'user@example.com' // Would be collected in real implementation
                };
            default:
                return {};
        }
    }

    async confirmOrder(orderId) {
        try {
            const response = await fetch('/api/payments/checkout/confirm', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: JSON.stringify({ orderId })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.closeCheckout();
                this.showOrderConfirmation(result.order);
                await this.loadAccountInfo(); // Refresh account info
            }
            
        } catch (error) {
            console.error('Order confirmation failed:', error);
        }
    }

    showOrderConfirmation(order) {
        this.addMessage('claudette', `🎉 Fantastisch! Je bestelling (${order.orderNumber}) is bevestigd. Je kunt nu je aankopen gebruiken via je account.`);
        this.showSection('account');
    }

    closeCheckout() {
        document.getElementById('checkoutModal').style.display = 'none';
    }

    // Account Management
    async loadAccountInfo() {
        if (!this.authToken || !this.currentAccount) return;
        
        try {
            const response = await fetch(`/api/accounts/profile/${this.currentAccount.id}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            const accountData = await response.json();
            this.displayAccountInfo(accountData);
            
        } catch (error) {
            console.error('Failed to load account info:', error);
        }
    }

    displayAccountInfo(account) {
        const content = document.getElementById('accountContent');
        
        content.innerHTML = `
            <div class="account-info">
                <h3>Welkom terug, ${account.firstName}!</h3>
                <div class="account-details">
                    <p><strong>Status:</strong> ${this.getStatusLabel(account.status)}</p>
                    <p><strong>Leeftijd:</strong> ${account.age} jaar</p>
                    <p><strong>Lid sinds:</strong> ${new Date(account.createdAt).toLocaleDateString('nl-NL')}</p>
                </div>
                
                ${account.claudetteAdvice && account.claudetteAdvice.length > 0 ? `
                    <div class="advice-section">
                        <h4>Claudette's Advies</h4>
                        <div class="advice-list">
                            ${account.claudetteAdvice.map(advice => `
                                <div class="advice-item">
                                    <p>${advice.advice}</p>
                                    <small>Status: ${advice.status}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="account-actions">
                    <button class="btn btn-primary" onclick="app.showSection('products')">
                        Bekijk Producten
                    </button>
                </div>
            </div>
        `;
    }

    getStatusLabel(status) {
        const labels = {
            'active': 'Actief',
            'pending-parental-consent': 'Wacht op ouderlijke toestemming',
            'parental-consent-denied': 'Ouderlijke toestemming geweigerd'
        };
        return labels[status] || status;
    }

    // Helper Methods
    extractProfileData() {
        // In a real implementation, this would extract profile data from the conversation
        return {
            firstName: 'Demo User',
            age: 25,
            email: 'demo@example.com',
            interests: ['Programming', 'Games']
        };
    }

    addMessage(sender, message) {
        const messages = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${sender}`;
        
        if (sender === 'claudette') {
            messageEl.innerHTML = `
                <div class="message-avatar">
                    <div class="mini-sphere"></div>
                </div>
                <div class="message-content">${message}</div>
            `;
        } else {
            messageEl.innerHTML = `<div class="message-content">${message}</div>`;
        }
        
        messages.appendChild(messageEl);
        messages.scrollTop = messages.scrollHeight;
    }

    showWelcomeOptions(options) {
        const buttons = document.getElementById('welcomeButtons');
        buttons.style.display = 'block';
    }

    hideWelcomeButtons() {
        const buttons = document.getElementById('welcomeButtons');
        buttons.style.display = 'none';
    }

    showProductOptions(options) {
        // Show product category options in chat
        const optionsHtml = options.map(option => 
            `<button class="chat-option" onclick="app.selectProductCategory('${option.category}')">${option.text}</button>`
        ).join('');
        
        this.addMessage('claudette', `${optionsHtml}`);
    }

    async selectProductCategory(category) {
        await this.filterProducts(category);
        this.showSection('products');
        this.addMessage('claudette', `Hier zijn onze ${category === 'all' ? 'alle producten' : this.getTypeLabel(category)}`);
    }

    enableChatInput() {
        const input = document.getElementById('messageInput');
        const button = document.getElementById('sendButton');
        
        input.disabled = false;
        button.disabled = false;
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    showAccountLink() {
        document.getElementById('accountLink').style.display = 'block';
    }

    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionName).classList.add('active');
    }
}

// Global functions for HTML onclick handlers
let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new AIColllabsApp();
});

function showSection(sectionName) {
    app.showSection(sectionName);
}

function sendMessage() {
    app.sendMessage();
}

function startAccountMode() {
    app.startAccountMode();
}

function startBrowseMode() {
    app.startBrowseMode();
}

function filterProducts(category) {
    app.filterProducts(category);
}

function closeCheckout() {
    app.closeCheckout();
}