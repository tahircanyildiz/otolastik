const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware - Admin token verification
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token yok kardeşim! Giriş yapman lazım.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin yetkisi gerekli amk!'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Geçersiz token!'
        });
    }
};

// Admin dashboard stats
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const Content = require('../models/Content');
        const content = await Content.findOne();
        
        const stats = {
            totalServices: content?.services?.length || 0,
            totalBrands: content?.brands?.length || 0,
            lastUpdated: content?.updatedAt || new Date(),
            systemStatus: 'OK'
        };

        res.json({
            success: true,
            data: stats,
            message: 'Admin stats yüklendi kardeşim! 📊'
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Stats yüklenemedi amk!'
        });
    }
});

// Get admin user info
router.get('/profile', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        res.json({
            success: true,
            data: {
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            },
            message: 'Admin profil bilgileri kardeşim!'
        });
    } catch (error) {
        console.error('Admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Profil bilgileri alınamadı!'
        });
    }
});

// Update admin password
router.put('/password', verifyAdmin, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut ve yeni şifre gerekli kardeşim!'
            });
        }

        const bcrypt = require('bcryptjs');
        const user = await User.findById(req.user._id);
        
        // Check current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre yanlış amk!'
            });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        await User.findByIdAndUpdate(req.user._id, {
            password: hashedNewPassword,
            updatedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Şifre başarıyla güncellendi kardeşim! 🔐'
        });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({
            success: false,
            message: 'Şifre güncellenemedi!'
        });
    }
});

// System health check for admin
router.get('/health', verifyAdmin, (req, res) => {
    const mongoose = require('mongoose');
    
    const healthCheck = {
        status: 'OK',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    };

    res.json({
        success: true,
        data: healthCheck,
        message: 'Sistem sağlık durumu kardeşim! 🏥'
    });
});

module.exports = router;