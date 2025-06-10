const express = require('express');
const Content = require('../models/Content');
const router = express.Router();

// Get all content (public endpoint)
router.get('/', async (req, res) => {
    try {
        const content = await Content.findOne({ isActive: true });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'İçerik bulunamadı!'
            });
        }
        
        res.json({
            success: true,
            message: 'İçerik başarıyla getirildi!',
            data: content
        });
        
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası amk!'
        });
    }
});

// Get specific section
router.get('/:section', async (req, res) => {
    try {
        const { section } = req.params;
        const content = await Content.findOne({ isActive: true });
        
        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'İçerik bulunamadı!'
            });
        }
        
        if (!content[section]) {
            return res.status(404).json({
                success: false,
                message: 'Bu bölüm bulunamadı !'
            });
        }
        
        res.json({
            success: true,
            message: `${section} başarıyla getirildi!`,
            data: content[section]
        });
        
    } catch (error) {
        console.error('Get section error:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası!'
        });
    }
});

module.exports = router;