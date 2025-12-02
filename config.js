// Configuration for the Ring Designer App
const CONFIG = {
    // =============================================
    // BACKEND API URL (Render.com)
    // This is where the secure backend runs - API key is stored there
    // =============================================
    API_URL: 'https://ring-designer-api.onrender.com',

    // =============================================
    // FIREBASE Configuration (Cloud Database - Optional)
    // Get this from: console.firebase.google.com → Project Settings
    // =============================================
    FIREBASE: {
        projectId: 'ring-b6de2',
    },

    // =============================================
    // SUPPORTED JEWELRY VENDORS
    // Top engagement ring and jewelry retailers
    // =============================================
    JEWELRY_VENDORS: [
        // Premium/Luxury Brands
        { name: 'Tiffany & Co.', domain: 'tiffany.com', logo: '💎', tier: 'luxury' },
        { name: 'Cartier', domain: 'cartier.com', logo: '👑', tier: 'luxury' },
        { name: 'Harry Winston', domain: 'harrywinston.com', logo: '✨', tier: 'luxury' },
        { name: 'Van Cleef & Arpels', domain: 'vancleefarpels.com', logo: '🌸', tier: 'luxury' },
        { name: 'Graff', domain: 'graff.com', logo: '💠', tier: 'luxury' },
        { name: 'De Beers', domain: 'debeers.com', logo: '💍', tier: 'luxury' },
        { name: 'Chopard', domain: 'chopard.com', logo: '⭐', tier: 'luxury' },
        { name: 'Bvlgari', domain: 'bulgari.com', logo: '🔶', tier: 'luxury' },

        // Online Diamond Specialists
        { name: 'Blue Nile', domain: 'bluenile.com', logo: '🌊', tier: 'specialist' },
        { name: 'James Allen', domain: 'jamesallen.com', logo: '🔍', tier: 'specialist' },
        { name: 'Brilliant Earth', domain: 'brilliantearth.com', logo: '🌍', tier: 'specialist' },
        { name: 'Ritani', domain: 'ritani.com', logo: '💫', tier: 'specialist' },
        { name: 'Whiteflash', domain: 'whiteflash.com', logo: '⚡', tier: 'specialist' },
        { name: 'Adiamor', domain: 'adiamor.com', logo: '💎', tier: 'specialist' },
        { name: 'With Clarity', domain: 'withclarity.com', logo: '🔮', tier: 'specialist' },
        { name: 'Vrai', domain: 'vrai.com', logo: '🌱', tier: 'specialist' },
        { name: 'Clean Origin', domain: 'cleanorigin.com', logo: '♻️', tier: 'specialist' },

        // Major Retail Chains
        { name: 'Kay Jewelers', domain: 'kay.com', logo: '❤️', tier: 'retail' },
        { name: 'Zales', domain: 'zales.com', logo: '💝', tier: 'retail' },
        { name: 'Jared', domain: 'jared.com', logo: '💒', tier: 'retail' },
        { name: 'Helzberg Diamonds', domain: 'helzberg.com', logo: '🎁', tier: 'retail' },
        { name: 'Shane Co.', domain: 'shaneco.com', logo: '🏠', tier: 'retail' },

        // Specialty & Designer
        { name: 'Tacori', domain: 'tacori.com', logo: '🎀', tier: 'designer' },
        { name: 'Verragio', domain: 'verragio.com', logo: '🌹', tier: 'designer' },
        { name: 'Simon G.', domain: 'simongjewelry.com', logo: '🎨', tier: 'designer' },
        { name: 'Hearts on Fire', domain: 'heartsonfire.com', logo: '🔥', tier: 'designer' },
        { name: 'Charles & Colvard', domain: 'charlesandcolvard.com', logo: '✦', tier: 'designer' },
    ],

    // Example prompts for inspiration - Engagement Ring focused
    EXAMPLE_PROMPTS: [
        'Round brilliant solitaire on a thin platinum band with a hidden halo of tiny diamonds underneath the center stone',
        'Oval diamond with a delicate pavé halo, rose gold split-shank band encrusted with small diamonds',
        'Cushion cut center diamond in a vintage art-deco setting, white gold with milgrain edges and sapphire accents'
    ],

    // Engagement Ring Terminology Guide for users
    RING_GUIDE: {
        diamondShapes: [
            { name: 'Round Brilliant', desc: 'The classic choice - maximum sparkle and fire' },
            { name: 'Princess', desc: 'Modern square shape with brilliant sparkle' },
            { name: 'Cushion', desc: 'Soft square with rounded corners, romantic feel' },
            { name: 'Oval', desc: 'Elongated and elegant, makes fingers look longer' },
            { name: 'Pear', desc: 'Teardrop shape, unique and feminine' },
            { name: 'Emerald', desc: 'Rectangular with step cuts, sophisticated glamour' },
            { name: 'Marquise', desc: 'Boat-shaped, maximizes carat appearance' },
            { name: 'Radiant', desc: 'Rectangular with brilliant facets, lots of fire' },
            { name: 'Asscher', desc: 'Square step-cut, vintage Art Deco style' }
        ],
        settings: [
            { name: 'Solitaire', desc: 'Single diamond, timeless and elegant' },
            { name: 'Halo', desc: 'Center stone surrounded by smaller diamonds' },
            { name: 'Three-Stone', desc: 'Past, present, future represented' },
            { name: 'Pavé', desc: 'Band encrusted with tiny diamonds' },
            { name: 'Channel-Set', desc: 'Diamonds set flush within the band' },
            { name: 'Bezel', desc: 'Metal rim surrounds the diamond securely' },
            { name: 'Cathedral', desc: 'Arches rise to hold the center stone' }
        ],
        metals: [
            { name: 'Platinum', desc: 'Most durable, naturally white, hypoallergenic' },
            { name: 'White Gold', desc: 'Classic bright white, rhodium plated' },
            { name: 'Yellow Gold', desc: 'Traditional warm gold tone' },
            { name: 'Rose Gold', desc: 'Romantic pink hue, very trendy' }
        ],
        accents: [
            { name: 'Hidden Halo', desc: 'Diamonds under the center stone, surprise sparkle' },
            { name: 'Side Stones', desc: 'Additional diamonds flanking the center' },
            { name: 'Split Shank', desc: 'Band divides as it meets the center stone' },
            { name: 'Milgrain', desc: 'Tiny beaded metal detail, vintage look' },
            { name: 'Filigree', desc: 'Delicate metalwork patterns' }
        ]
    },

    // Example images for each ring term - ENGAGEMENT RINGS ONLY
    // Curated from Unsplash & Pexels - all verified engagement ring photos
    TERM_EXAMPLES: {
        // Diamond Shapes - All engagement ring examples
        'Round Brilliant': {
            image: 'https://images.pexels.com/photos/1150611/pexels-photo-1150611.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Round Brilliant Engagement Ring - Maximum sparkle and fire'
        },
        'Princess': {
            image: 'https://images.pexels.com/photos/2735970/pexels-photo-2735970.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Princess Cut Engagement Ring - Modern square brilliance'
        },
        'Cushion': {
            image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&q=80',
            caption: 'Cushion Cut Engagement Ring - Soft romantic corners'
        },
        'Oval': {
            image: 'https://images.unsplash.com/photo-1610694955371-d4a3e0ce4b52?w=600&q=80',
            caption: 'Oval Engagement Ring - Elongated elegance'
        },
        'Pear': {
            image: 'https://images.pexels.com/photos/4046571/pexels-photo-4046571.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Pear Shaped Engagement Ring - Unique teardrop beauty'
        },
        'Emerald': {
            image: 'https://images.pexels.com/photos/5370706/pexels-photo-5370706.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Emerald Cut Engagement Ring - Art Deco sophistication'
        },
        'Marquise': {
            image: 'https://images.pexels.com/photos/4040567/pexels-photo-4040567.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Marquise Engagement Ring - Maximizes carat appearance'
        },
        'Radiant': {
            image: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=600&q=80',
            caption: 'Radiant Cut Engagement Ring - Brilliant rectangular fire'
        },
        'Asscher': {
            image: 'https://images.unsplash.com/photo-1609207131662-da80fbce3eef?w=600&q=80',
            caption: 'Asscher Cut Engagement Ring - Vintage Art Deco icon'
        },

        // Settings - All engagement ring examples
        'Solitaire': {
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
            caption: 'Solitaire Engagement Ring - Timeless single diamond'
        },
        'Halo': {
            image: 'https://images.pexels.com/photos/1444282/pexels-photo-1444282.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Halo Engagement Ring - Surrounded by sparkling diamonds'
        },
        'Three-Stone': {
            image: 'https://images.pexels.com/photos/6624862/pexels-photo-6624862.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Three-Stone Engagement Ring - Past, present, future'
        },
        'Pavé': {
            image: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=600&q=80',
            caption: 'Pavé Engagement Ring - Band encrusted with diamonds'
        },
        'Channel-Set': {
            image: 'https://images.pexels.com/photos/691046/pexels-photo-691046.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Channel-Set Engagement Ring - Diamonds flush in band'
        },
        'Bezel': {
            image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80',
            caption: 'Bezel Set Engagement Ring - Secure metal rim setting'
        },
        'Cathedral': {
            image: 'https://images.unsplash.com/photo-1544127054-3c94b78a9854?w=600&q=80',
            caption: 'Cathedral Engagement Ring - Elegant arched setting'
        },

        // Metals - All engagement ring examples
        'Platinum': {
            image: 'https://images.pexels.com/photos/3266700/pexels-photo-3266700.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Platinum Engagement Ring - Naturally white, most durable'
        },
        'White Gold': {
            image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80',
            caption: 'White Gold Engagement Ring - Classic bright finish'
        },
        'Yellow Gold': {
            image: 'https://images.pexels.com/photos/2849742/pexels-photo-2849742.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Yellow Gold Engagement Ring - Traditional warm tone'
        },
        'Rose Gold': {
            image: 'https://images.pexels.com/photos/3731256/pexels-photo-3731256.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Rose Gold Engagement Ring - Romantic pink hue'
        },

        // Accents - All engagement ring examples
        'Hidden Halo': {
            image: 'https://images.unsplash.com/photo-1619119069152-a2b331eb392a?w=600&q=80',
            caption: 'Hidden Halo Engagement Ring - Surprise sparkle underneath'
        },
        'Side Stones': {
            image: 'https://images.pexels.com/photos/6624862/pexels-photo-6624862.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Side Stone Engagement Ring - Diamonds flanking center'
        },
        'Split Shank': {
            image: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=600&q=80',
            caption: 'Split Shank Engagement Ring - Band divides elegantly'
        },
        'Milgrain': {
            image: 'https://images.unsplash.com/photo-1609207131662-da80fbce3eef?w=600&q=80',
            caption: 'Milgrain Engagement Ring - Vintage beaded detail'
        },
        'Filigree': {
            image: 'https://images.pexels.com/photos/4046568/pexels-photo-4046568.jpeg?auto=compress&cs=tinysrgb&w=600',
            caption: 'Filigree Engagement Ring - Delicate metalwork patterns'
        }
    },

    // Default placeholder image - engagement ring
    DEFAULT_PREVIEW: {
        image: 'https://images.pexels.com/photos/1150611/pexels-photo-1150611.jpeg?auto=compress&cs=tinysrgb&w=600',
        caption: 'Tap any term to see engagement ring examples'
    },

    // LocalStorage keys
    STORAGE_KEYS: {
        SELECTED_DESIGN: 'maria_ring_design',
        DESIGN_TIMESTAMP: 'maria_ring_timestamp',
        DESIGN_TYPE: 'maria_ring_type', // 'gallery' or 'custom'
    }
};
