// Admin Panel JavaScript - OtoLastik Pro
// Tahir kardeşim için admin paneli (DKWMDWISKW)

class AdminPanel {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.token = localStorage.getItem('adminToken');
        this.quillEditor = null;
        this.currentData = {};
        
        this.init();
    }

    async init() {
        console.log('🚀 Admin Panel başlatılıyor kardeşim!');
        
        // Loading'i göster
        this.showLoading();
        
        // Event listener'ları ekle
        this.setupEventListeners();
        
        // Token varsa dashboard'a git, yoksa login göster
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showLogin();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // View site button
        const viewSite = document.getElementById('viewSite');
        if (viewSite) {
            viewSite.addEventListener('click', () => {
                window.open('../index.html', '_blank');
            });
        }

        // Tab navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const tab = e.target.closest('.nav-link').dataset.tab;
                this.switchTab(tab);
            });
        });

        // Save buttons
        document.getElementById('saveGeneral')?.addEventListener('click', () => this.saveGeneral());
        document.getElementById('saveServices')?.addEventListener('click', () => this.saveServices());
        document.getElementById('saveBrands')?.addEventListener('click', () => this.saveBrands());
        document.getElementById('saveContact')?.addEventListener('click', () => this.saveContact());
        document.getElementById('saveAbout')?.addEventListener('click', () => this.saveAbout());

        // Add buttons
        document.getElementById('addService')?.addEventListener('click', () => this.addService());
        document.getElementById('addBrand')?.addEventListener('click', () => this.addBrand());
    }

    showLoading() {
        document.getElementById('loadingSpinner').style.display = 'flex';
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    showLogin() {
        this.hideLoading();
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
    }

    showDashboard() {
        this.hideLoading();
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.token;
                localStorage.setItem('adminToken', this.token);
                
                this.showMessage('Giriş başarılı! Hoş geldin kardeşim! 🎉', 'success');
                await this.loadDashboard();
            } else {
                errorDiv.textContent = data.message || 'Giriş yapılamadı amk!';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorDiv.textContent = 'Bağlantı hatası! Backend çalışıyor mu kontrol et.';
            errorDiv.style.display = 'block';
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                await this.loadDashboard();
            } else {
                localStorage.removeItem('adminToken');
                this.token = null;
                this.showLogin();
            }
        } catch (error) {
            console.error('Token verification error:', error);
            this.showLogin();
        }
    }

    async loadDashboard() {
        this.showDashboard();
        await this.loadContent();
        this.initializeQuillEditor();
    }

    async loadContent() {
        try {
            const response = await fetch(`${this.apiUrl}/content`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentData = data.data;
                this.populateFields();
                console.log('✅ Content yüklendi kardeşim!');
            } else {
                this.showMessage('Content yüklenemedi amk!', 'error');
            }
        } catch (error) {
            console.error('Content loading error:', error);
            this.showMessage('Bağlantı hatası!', 'error');
        }
    }

    populateFields() {
        if (!this.currentData) return;

        // General fields
        document.getElementById('siteTitle').value = this.currentData.siteTitle || '';
        document.getElementById('heroTitle').value = this.currentData.hero?.title || '';
        document.getElementById('heroDescription').value = this.currentData.hero?.description || '';

        // Contact fields
        document.getElementById('contactPhone').value = this.currentData.contact?.phone || '';
        document.getElementById('contactEmail').value = this.currentData.contact?.email || '';
        document.getElementById('contactAddress').value = this.currentData.contact?.address || '';
        document.getElementById('workingWeekdays').value = this.currentData.contact?.workingHours?.weekdays || '';
        document.getElementById('workingWeekend').value = this.currentData.contact?.workingHours?.weekend || '';

        // Social links
        document.getElementById('facebookLink').value = this.currentData.socialLinks?.facebook || '';
        document.getElementById('instagramLink').value = this.currentData.socialLinks?.instagram || '';
        document.getElementById('twitterLink').value = this.currentData.socialLinks?.twitter || '';

        // About stats
        if (this.currentData.about?.stats) {
            document.getElementById('happyCustomers').value = this.currentData.about.stats.find(s => s.label.includes('Müşteri'))?.number || '';
            document.getElementById('experienceYears').value = this.currentData.about.stats.find(s => s.label.includes('Tecrübe'))?.number || '';
            document.getElementById('brandCount').value = this.currentData.about.stats.find(s => s.label.includes('Marka'))?.number || '';
        }

        // Load services and brands
        this.loadServices();
        this.loadBrands();
    }

    loadServices() {
        const servicesContainer = document.getElementById('servicesList');
        if (!servicesContainer || !this.currentData.services) return;

        servicesContainer.innerHTML = '';
        
        this.currentData.services.forEach((service, index) => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
                <div class="service-header">
                    <i class="${service.icon}"></i>
                    <h4>${service.title}</h4>
                </div>
                <p>${service.description}</p>
                <div class="service-actions">
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.removeService(${index})">
                        <i class="fas fa-trash"></i>
                        Sil
                    </button>
                </div>
            `;
            servicesContainer.appendChild(serviceCard);
        });
    }

    loadBrands() {
        const brandsContainer = document.getElementById('brandsList');
        if (!brandsContainer || !this.currentData.brands) return;

        brandsContainer.innerHTML = '';
        
        this.currentData.brands.forEach((brand, index) => {
            const brandCard = document.createElement('div');
            brandCard.className = 'brand-card';
            brandCard.innerHTML = `
                <div class="brand-header">
                    <h4>${brand.name}</h4>
                </div>
                <p>${brand.description}</p>
                <div class="brand-actions">
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.removeBrand(${index})">
                        <i class="fas fa-trash"></i>
                        Sil
                    </button>
                </div>
            `;
            brandsContainer.appendChild(brandCard);
        });
    }

    addService() {
        const title = document.getElementById('serviceTitle').value.trim();
        const icon = document.getElementById('serviceIcon').value.trim();
        const description = document.getElementById('serviceDescription').value.trim();

        if (!title || !icon || !description) {
            this.showMessage('Tüm alanları doldur kardeşim!', 'error');
            return;
        }

        if (!this.currentData.services) {
            this.currentData.services = [];
        }

        this.currentData.services.push({
            title,
            icon,
            description
        });

        // Form'u temizle
        document.getElementById('serviceTitle').value = '';
        document.getElementById('serviceIcon').value = '';
        document.getElementById('serviceDescription').value = '';

        this.loadServices();
        this.showMessage('Hizmet eklendi! Kaydetmeyi unutma kardeşim! 💡', 'info');
    }

    removeService(index) {
        if (confirm('Bu hizmeti silmek istediğinden emin misin?')) {
            this.currentData.services.splice(index, 1);
            this.loadServices();
            this.showMessage('Hizmet silindi! Kaydetmeyi unutma.', 'info');
        }
    }

    addBrand() {
        const name = document.getElementById('brandName').value.trim();
        const description = document.getElementById('brandDescription').value.trim();

        if (!name || !description) {
            this.showMessage('Marka adı ve açıklama gerekli!', 'error');
            return;
        }

        if (!this.currentData.brands) {
            this.currentData.brands = [];
        }

        this.currentData.brands.push({
            name,
            description
        });

        // Form'u temizle
        document.getElementById('brandName').value = '';
        document.getElementById('brandDescription').value = '';

        this.loadBrands();
        this.showMessage('Marka eklendi! Kaydetmeyi unutma! 💡', 'info');
    }

    removeBrand(index) {
        if (confirm('Bu markayı silmek istediğinden emin misin?')) {
            this.currentData.brands.splice(index, 1);
            this.loadBrands();
            this.showMessage('Marka silindi! Kaydetmeyi unutma.', 'info');
        }
    }

    async saveGeneral() {
        const updateData = {
            siteTitle: document.getElementById('siteTitle').value,
            hero: {
                title: document.getElementById('heroTitle').value,
                description: document.getElementById('heroDescription').value
            }
        };

        await this.saveContent(updateData, 'Genel bilgiler');
    }

    async saveServices() {
        const updateData = {
            services: this.currentData.services
        };

        await this.saveContent(updateData, 'Hizmetler');
    }

    async saveBrands() {
        const updateData = {
            brands: this.currentData.brands
        };

        await this.saveContent(updateData, 'Markalar');
    }

    async saveContact() {
        const updateData = {
            contact: {
                phone: document.getElementById('contactPhone').value,
                email: document.getElementById('contactEmail').value,
                address: document.getElementById('contactAddress').value,
                workingHours: {
                    weekdays: document.getElementById('workingWeekdays').value,
                    weekend: document.getElementById('workingWeekend').value
                }
            },
            socialLinks: {
                facebook: document.getElementById('facebookLink').value,
                instagram: document.getElementById('instagramLink').value,
                twitter: document.getElementById('twitterLink').value
            }
        };

        await this.saveContent(updateData, 'İletişim bilgileri');
    }

    async saveAbout() {
        const updateData = {
            about: {
                text: this.quillEditor ? this.quillEditor.root.innerHTML : '',
                stats: [
                    { number: document.getElementById('happyCustomers').value, label: "Mutlu Müşteri" },
                    { number: document.getElementById('experienceYears').value, label: "Yıl Tecrübe" },
                    { number: document.getElementById('brandCount').value, label: "Marka Seçeneği" }
                ]
            }
        };

        await this.saveContent(updateData, 'Hakkımızda');
    }

    async saveContent(updateData, sectionName) {
        try {
            const response = await fetch(`${this.apiUrl}/content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                this.showMessage(`${sectionName} başarıyla kaydedildi! 🎉`, 'success');
                // Update current data
                Object.assign(this.currentData, updateData);
            } else {
                this.showMessage(`${sectionName} kaydedilemedi: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showMessage(`Kaydetme hatası! Backend çalışıyor mu kontrol et.`, 'error');
        }
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}Tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    initializeQuillEditor() {
        const editorContainer = document.getElementById('aboutTextEditor');
        if (editorContainer && !this.quillEditor) {
            this.quillEditor = new Quill('#aboutTextEditor', {
                theme: 'snow',
                placeholder: 'Şirket hakkında bilgi yazın...',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                    ]
                }
            });

            // Set initial content
            if (this.currentData.about?.text) {
                this.quillEditor.root.innerHTML = this.currentData.about.text;
            }
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 
                    type === 'error' ? 'fas fa-exclamation-circle' : 
                    'fas fa-info-circle';
        
        messageEl.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="message-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    logout() {
        if (confirm('Çıkış yapmak istediğinden emin misin kardeşim?')) {
            localStorage.removeItem('adminToken');
            this.token = null;
            this.showLogin();
            this.showMessage('Başarıyla çıkış yaptın! Görüşürüz! 👋', 'info');
        }
    }
}

// Global admin panel instance
let adminPanel;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});

// Global functions for onclick handlers
window.adminPanel = adminPanel;