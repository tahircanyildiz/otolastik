const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB bağlantısı başarılı kardeşim!');
        initializeDefaultData();
    })
    .catch(err => {
        console.error('❌ MongoDB bağlantı hatası amk:', err);
        process.exit(1);
    });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend çalışıyor kardeşim! 🚀',
        timestamp: new Date()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('💥 Hata yakalandı:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Sunucu hatası amk!',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialize default data
async function initializeDefaultData() {
    try {
        const Content = require('./models/Content');
        const User = require('./models/User');
        
        // Check if content exists
        const existingContent = await Content.findOne();
        if (!existingContent) {
            const defaultContent = new Content({
                siteTitle: "OtoLastik Pro - Lastik Uzmanı",
                hero: {
                    title: "Kaliteli Lastik, Güvenli Yolculuk",
                    description: "20 yıllık tecrübemizle araçlarınız için en kaliteli lastikleri sunuyoruz. Montaj, balans ve onarım hizmetlerimizle yanınızdayız."
                },
                services: [
                    {
                        title: "Lastik Montajı",
                        description: "Profesyonel ekipmanlarla hızlı ve güvenli lastik montajı yapıyoruz.",
                        icon: "fas fa-tools"
                    },
                    {
                        title: "Balans Ayarı",
                        description: "Tekerlek balansı ile titreşimsiz ve konforlu sürüş deneyimi.",
                        icon: "fas fa-balance-scale"
                    },
                    {
                        title: "Lastik Onarımı",
                        description: "Delinmiş lastiklerinizi profesyonelce onarıyoruz.",
                        icon: "fas fa-wrench"
                    },
                    {
                        title: "Rot Balans",
                        description: "Aracınızın düzgün gitmesi için rot balans hizmeti.",
                        icon: "fas fa-car"
                    },
                    {
                        title: "Lastik Basıncı",
                        description: "Doğru basınç kontrolü ile yakıt tasarrufu ve güvenlik.",
                        icon: "fas fa-gauge"
                    },
                    {
                        title: "Kış Lastiği",
                        description: "Kış şartlarında güvenli sürüş için kış lastiği montajı.",
                        icon: "fas fa-snowflake"
                    }
                ],
                brands: [
                    { name: "Bridgestone", description: "Yüksek performans ve dayanıklılık" },
                    { name: "Michelin", description: "Fransız kalitesi ve teknoloji" },
                    { name: "Continental", description: "Alman mühendisliği" },
                    { name: "Pirelli", description: "İtalyan tasarım ve performans" },
                    { name: "Goodyear", description: "Amerikan güvenilirliği" },
                    { name: "Dunlop", description: "Spor ve konfor bir arada" }
                ],
                about: {
                    text: "20 yıldır lastik sektöründe hizmet veren deneyimli ekibimizle, müşterilerimize en kaliteli ürün ve hizmeti sunmaktayız. Modern teknoloji ve geleneksel ustalığı birleştirerek, aracınızın ihtiyaçlarına en uygun çözümü buluyoruz.",
                    stats: [
                        { number: "5000+", label: "Mutlu Müşteri" },
                        { number: "20+", label: "Yıl Tecrübe" },
                        { number: "15+", label: "Marka Seçeneği" }
                    ]
                },
                contact: {
                    address: "Esenyurt / İstanbul",
                    phone: "0552 850 86 06",
                    email: "info@otolastikpro.com",
                    supportEmail: "destek@otolastikpro.com",
                    workingHours: {
                        weekdays: "Pazartesi - Cumartesi: 08:00 - 19:00",
                        weekend: "Pazar: 09:00 - 17:00"
                    }
                },
                socialLinks: {
                    facebook: "#",
                    instagram: "#",
                    twitter: "#"
                }
            });
            
            await defaultContent.save();
            console.log('✅ Default content oluşturuldu!');
        }
        
        // Check if admin user exists
        const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (!existingAdmin) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            
            const adminUser = new User({
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin'
            });
            
            await adminUser.save();
            console.log('✅ Admin kullanıcısı oluşturuldu!');
            console.log(`📧 Email: ${process.env.ADMIN_EMAIL}`);
            console.log(`🔐 Şifre: ${process.env.ADMIN_PASSWORD}`);
        }
        
    } catch (error) {
        console.error('❌ Default data initialization error:', error);
    }
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor port ${PORT}'da kardeşim!`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;