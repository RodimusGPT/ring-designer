// Ring Designer API - Secure proxy for fal.ai
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');

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

// =============================================
// IMPORT RING FROM URL ENDPOINT
// Fetches ring details from major jewelry vendors
// =============================================

// Supported jewelry vendor domains
const SUPPORTED_VENDORS = [
    // Luxury
    'tiffany.com', 'cartier.com', 'harrywinston.com', 'vancleefarpels.com',
    'graff.com', 'debeers.com', 'chopard.com', 'bulgari.com',
    // Specialists
    'bluenile.com', 'jamesallen.com', 'brilliantearth.com', 'ritani.com',
    'whiteflash.com', 'adiamor.com', 'withclarity.com', 'vrai.com', 'cleanorigin.com',
    // Retail
    'kay.com', 'zales.com', 'jared.com', 'helzberg.com', 'shaneco.com',
    // Designer
    'tacori.com', 'verragio.com', 'simongjewelry.com', 'heartsonfire.com', 'charlesandcolvard.com'
];

// Check if URL is from a supported vendor
function getVendorFromUrl(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        for (const vendor of SUPPORTED_VENDORS) {
            if (hostname.includes(vendor.replace('www.', ''))) {
                return vendor;
            }
        }
        return null;
    } catch {
        return null;
    }
}

// Extract images from HTML
function extractImages($, baseUrl) {
    const images = new Set();

    // 1. Open Graph images (highest priority)
    $('meta[property="og:image"]').each((_, el) => {
        const content = $(el).attr('content');
        if (content) images.add(resolveUrl(content, baseUrl));
    });

    // 2. Twitter card images
    $('meta[name="twitter:image"]').each((_, el) => {
        const content = $(el).attr('content');
        if (content) images.add(resolveUrl(content, baseUrl));
    });

    // 3. JSON-LD structured data images
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html());
            extractJsonLdImages(data, images, baseUrl);
        } catch (e) {
            // Ignore parsing errors
        }
    });

    // 4. Product gallery images (common patterns)
    const productImageSelectors = [
        // Common product image selectors
        '[data-testid*="product-image"] img',
        '[class*="product-image"] img',
        '[class*="gallery"] img',
        '[class*="carousel"] img',
        '[class*="pdp-image"] img',
        '[class*="main-image"] img',
        '.product-detail img',
        '.product-gallery img',
        '#product-images img',
        '.ring-image img',
        // Srcset support
        'picture source',
        // Data attributes
        '[data-src]',
        '[data-zoom-image]',
        '[data-large-image]'
    ];

    productImageSelectors.forEach(selector => {
        $(selector).each((_, el) => {
            // Check multiple attributes
            const src = $(el).attr('src') || $(el).attr('data-src') ||
                       $(el).attr('data-zoom-image') || $(el).attr('data-large-image') ||
                       $(el).attr('srcset')?.split(',')[0]?.trim()?.split(' ')[0];
            if (src && isValidImageUrl(src)) {
                images.add(resolveUrl(src, baseUrl));
            }
        });
    });

    // 5. Any large images on the page (fallback)
    $('img').each((_, el) => {
        const src = $(el).attr('src');
        const width = parseInt($(el).attr('width')) || 0;
        const height = parseInt($(el).attr('height')) || 0;

        if (src && (width >= 300 || height >= 300 || (!width && !height))) {
            if (isValidImageUrl(src)) {
                images.add(resolveUrl(src, baseUrl));
            }
        }
    });

    return Array.from(images).slice(0, 10); // Limit to 10 images
}

// Extract images from JSON-LD data
function extractJsonLdImages(data, images, baseUrl) {
    if (Array.isArray(data)) {
        data.forEach(item => extractJsonLdImages(item, images, baseUrl));
        return;
    }

    if (typeof data !== 'object' || !data) return;

    // Direct image properties
    if (data.image) {
        if (typeof data.image === 'string') {
            images.add(resolveUrl(data.image, baseUrl));
        } else if (Array.isArray(data.image)) {
            data.image.forEach(img => {
                if (typeof img === 'string') images.add(resolveUrl(img, baseUrl));
                else if (img?.url) images.add(resolveUrl(img.url, baseUrl));
            });
        } else if (data.image.url) {
            images.add(resolveUrl(data.image.url, baseUrl));
        }
    }

    // Product-specific
    if (data['@type'] === 'Product' || data['@type'] === 'Offer') {
        if (data.image) {
            const imgArray = Array.isArray(data.image) ? data.image : [data.image];
            imgArray.forEach(img => {
                if (typeof img === 'string') images.add(resolveUrl(img, baseUrl));
            });
        }
    }

    // Recurse into nested objects
    Object.values(data).forEach(value => {
        if (typeof value === 'object') {
            extractJsonLdImages(value, images, baseUrl);
        }
    });
}

// Extract metadata from HTML
function extractMetadata($) {
    const metadata = {
        title: null,
        description: null,
        price: null,
        currency: null,
        brand: null,
        sku: null,
        material: null,
        gemstone: null,
        setting: null,
        caratWeight: null,
        metalType: null,
        availability: null
    };

    // Title
    metadata.title = $('meta[property="og:title"]').attr('content') ||
                     $('meta[name="twitter:title"]').attr('content') ||
                     $('h1').first().text().trim() ||
                     $('title').text().trim();

    // Description
    metadata.description = $('meta[property="og:description"]').attr('content') ||
                          $('meta[name="description"]').attr('content') ||
                          $('[class*="product-description"]').first().text().trim();

    // Price (multiple patterns)
    const priceSelectors = [
        '[class*="price"]:not([class*="compare"])',
        '[data-testid*="price"]',
        '[itemprop="price"]',
        '.product-price',
        '#product-price',
        'meta[property="product:price:amount"]'
    ];

    for (const selector of priceSelectors) {
        const el = $(selector).first();
        const price = el.attr('content') || el.text().trim();
        if (price) {
            const match = price.match(/[\d,]+\.?\d*/);
            if (match) {
                metadata.price = match[0].replace(/,/g, '');
                break;
            }
        }
    }

    // Currency
    metadata.currency = $('meta[property="product:price:currency"]').attr('content') ||
                       $('[itemprop="priceCurrency"]').attr('content') || 'USD';

    // Brand
    metadata.brand = $('meta[property="og:brand"]').attr('content') ||
                    $('[itemprop="brand"]').text().trim() ||
                    $('meta[property="og:site_name"]').attr('content');

    // Try to extract from JSON-LD
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const data = JSON.parse($(el).html());
            extractJsonLdMetadata(data, metadata);
        } catch (e) {
            // Ignore
        }
    });

    // Extract ring-specific details from description
    if (metadata.description) {
        const desc = metadata.description.toLowerCase();

        // Metal type
        const metals = ['platinum', 'white gold', 'yellow gold', 'rose gold', '18k', '14k', 'palladium'];
        for (const metal of metals) {
            if (desc.includes(metal)) {
                metadata.metalType = metal;
                break;
            }
        }

        // Diamond shape
        const shapes = ['round', 'princess', 'cushion', 'oval', 'pear', 'emerald', 'marquise', 'radiant', 'asscher'];
        for (const shape of shapes) {
            if (desc.includes(shape)) {
                metadata.gemstone = shape + ' cut diamond';
                break;
            }
        }

        // Carat weight pattern
        const caratMatch = desc.match(/(\d+\.?\d*)\s*(?:ct|carat|tcw)/i);
        if (caratMatch) {
            metadata.caratWeight = caratMatch[1] + ' ct';
        }

        // Setting type
        const settings = ['solitaire', 'halo', 'three-stone', 'pavé', 'pave', 'channel', 'bezel', 'cathedral'];
        for (const setting of settings) {
            if (desc.includes(setting)) {
                metadata.setting = setting;
                break;
            }
        }
    }

    return metadata;
}

// Extract metadata from JSON-LD
function extractJsonLdMetadata(data, metadata) {
    if (Array.isArray(data)) {
        data.forEach(item => extractJsonLdMetadata(item, metadata));
        return;
    }

    if (typeof data !== 'object' || !data) return;

    if (data['@type'] === 'Product') {
        metadata.title = metadata.title || data.name;
        metadata.description = metadata.description || data.description;
        metadata.sku = metadata.sku || data.sku;
        metadata.brand = metadata.brand || data.brand?.name || data.brand;

        if (data.offers) {
            const offer = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            metadata.price = metadata.price || offer.price;
            metadata.currency = metadata.currency || offer.priceCurrency;
            metadata.availability = offer.availability;
        }
    }
}

// Resolve relative URLs
function resolveUrl(url, baseUrl) {
    if (!url) return null;
    try {
        if (url.startsWith('//')) {
            return 'https:' + url;
        }
        if (url.startsWith('/')) {
            const base = new URL(baseUrl);
            return base.origin + url;
        }
        if (!url.startsWith('http')) {
            return new URL(url, baseUrl).href;
        }
        return url;
    } catch {
        return url;
    }
}

// Check if URL is a valid image
function isValidImageUrl(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    // Exclude common non-product images
    if (lower.includes('logo') || lower.includes('icon') || lower.includes('sprite') ||
        lower.includes('pixel') || lower.includes('tracking') || lower.includes('analytics') ||
        lower.includes('placeholder') || lower.includes('loading')) {
        return false;
    }
    // Check for image extensions or image CDN patterns
    return /\.(jpg|jpeg|png|webp|gif)/i.test(url) ||
           url.includes('cloudinary') ||
           url.includes('imgix') ||
           url.includes('shopify') ||
           url.includes('scene7') ||
           url.includes('/images/') ||
           url.includes('/product/');
}

// Helper: Fetch with proper timeout using AbortController
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}

// Import ring from URL endpoint
app.post('/api/import-ring', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if vendor is supported
    const vendor = getVendorFromUrl(url);
    if (!vendor) {
        return res.status(400).json({
            error: 'Unsupported vendor',
            message: 'This jewelry store is not yet supported. Try Tiffany, Blue Nile, James Allen, Brilliant Earth, or other major retailers.',
            supportedVendors: SUPPORTED_VENDORS
        });
    }

    console.log(`🔗 Importing ring from ${vendor}: ${url}`);

    try {
        // Fetch the page with proper timeout and realistic headers
        const response = await fetchWithTimeout(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"macOS"',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Upgrade-Insecure-Requests': '1'
            },
            redirect: 'follow'
        }, 20000);

        // Handle specific HTTP errors
        if (!response.ok) {
            console.error(`Fetch failed: ${response.status} ${response.statusText}`);

            if (response.status === 403) {
                return res.status(403).json({
                    error: 'Access blocked',
                    message: `${vendor} is blocking automated requests. Please try a different retailer like Blue Nile or Brilliant Earth, or manually save the ring image and upload it.`
                });
            }

            if (response.status === 429) {
                return res.status(429).json({
                    error: 'Rate limited',
                    message: 'Too many requests. Please wait a moment and try again.'
                });
            }

            return res.status(response.status).json({
                error: 'Could not fetch page',
                message: 'The page could not be loaded. Please check the URL and try again.'
            });
        }

        const html = await response.text();

        // Check for bot protection pages (Cloudflare, PerimeterX, etc.)
        if (html.includes('challenge-platform') ||
            html.includes('cf-browser-verification') ||
            html.includes('px-captcha') ||
            html.includes('Access Denied') ||
            html.length < 1000) {
            console.warn(`Bot protection detected for ${vendor}`);
            return res.status(403).json({
                error: 'Bot protection',
                message: `${vendor} has bot protection enabled. Please try Blue Nile, James Allen, or Brilliant Earth instead, or manually save the ring image.`
            });
        }

        const $ = cheerio.load(html);

        // Extract images and metadata
        const images = extractImages($, url);
        const metadata = extractMetadata($);

        if (images.length === 0) {
            return res.status(404).json({
                error: 'No images found',
                message: 'Could not find ring images on this page. Please try a direct product page URL.'
            });
        }

        console.log(`✅ Imported: ${metadata.title || 'Ring'} - ${images.length} images`);

        return res.json({
            success: true,
            vendor: vendor,
            url: url,
            images: images,
            metadata: metadata
        });

    } catch (error) {
        console.error('Import error:', error.name, error.message);

        // Handle specific error types
        if (error.name === 'AbortError') {
            return res.status(504).json({
                error: 'Request timeout',
                message: 'The request took too long. The website may be slow or blocking requests.'
            });
        }

        if (error.cause?.code === 'ENOTFOUND' || error.cause?.code === 'ECONNREFUSED') {
            return res.status(502).json({
                error: 'Connection failed',
                message: 'Could not connect to the website. Please check the URL.'
            });
        }

        return res.status(500).json({
            error: 'Import failed',
            message: 'Could not import ring details. Please try again or use a different URL.'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`💍 Ring Designer API running on port ${PORT}`);
    console.log(`   Allowed origin: ${ALLOWED_ORIGIN}`);
    console.log(`   FAL_API_KEY: ${FAL_API_KEY ? '✅ configured' : '❌ missing'}`);
});
