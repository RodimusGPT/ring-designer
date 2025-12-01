// Ring Designer API - Secure proxy for fal.ai
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables (set these in Render dashboard)
const FAL_API_KEY = process.env.FAL_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rodimusgpt.github.io';

// Middleware
app.use(express.json());
app.use(cors({
    origin: ALLOWED_ORIGIN,
    methods: ['POST', 'GET'],
}));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Ring Designer API is running 💍' });
});

// Generate ring image endpoint
app.post('/api/generate-ring', async (req, res) => {
    // Validate API key is configured
    if (!FAL_API_KEY) {
        console.error('FAL_API_KEY not configured');
        return res.status(500).json({ error: 'Server not configured properly' });
    }

    const { prompt, referenceImage, isRefinement } = req.body;

    // Validate prompt
    if (!prompt || prompt.length < 10) {
        return res.status(400).json({ error: 'Please provide a detailed description (at least 10 characters)' });
    }

    if (prompt.length > 1000) {
        return res.status(400).json({ error: 'Description too long (max 1000 characters for refinements)' });
    }

    // Build the full prompt with jewelry-specific enhancements
    let fullPrompt;
    if (isRefinement && referenceImage) {
        // For refinements, emphasize the modification while maintaining engagement ring context
        fullPrompt = `A beautiful diamond engagement ring with these exact specifications: ${prompt}. Professional jewelry photography, elegant white studio background, macro detail shot, luxury presentation, 4K quality, perfect lighting highlighting the diamond brilliance and metal finish`;
        console.log('🔄 Refining design...');
    } else {
        // Initial generation
        fullPrompt = `A stunning diamond engagement ring: ${prompt}. Professional jewelry photography, elegant white studio background, macro detail shot, luxury presentation, 4K quality, perfect lighting highlighting the diamond brilliance and metal finish`;
        console.log('✨ Creating new design...');
    }

    console.log('Prompt:', fullPrompt.substring(0, 120) + '...');

    try {
        const response = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Key ${FAL_API_KEY}`
            },
            body: JSON.stringify({
                prompt: fullPrompt,
                image_size: '1024x1024',
                num_inference_steps: 28,
                guidance_scale: 3.5,
                num_images: 1,
                enable_safety_checker: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('fal.ai error:', errorText);
            return res.status(response.status).json({ error: 'Failed to generate image' });
        }

        const result = await response.json();

        if (result.images && result.images.length > 0) {
            console.log(`${isRefinement ? '🔄' : '✅'} Ring ${isRefinement ? 'refined' : 'generated'} successfully`);
            return res.json({
                success: true,
                imageUrl: result.images[0].url,
                prompt: fullPrompt,
                isRefinement: !!isRefinement
            });
        } else {
            return res.status(500).json({ error: 'No image generated' });
        }

    } catch (error) {
        console.error('Generation error:', error);
        return res.status(500).json({ error: 'Failed to generate ring image' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`💍 Ring Designer API running on port ${PORT}`);
    console.log(`   Allowed origin: ${ALLOWED_ORIGIN}`);
    console.log(`   FAL_API_KEY: ${FAL_API_KEY ? '✅ configured' : '❌ missing'}`);
});
