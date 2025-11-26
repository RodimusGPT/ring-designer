// Configuration for the Ring Designer App
const CONFIG = {
    // =============================================
    // BACKEND API URL (Render.com)
    // This is where the secure backend runs - API key is stored there
    // =============================================
    API_URL: 'YOUR_RENDER_URL',  // e.g., 'https://ring-designer-api.onrender.com'

    // =============================================
    // FIREBASE Configuration (Cloud Database - Optional)
    // Get this from: console.firebase.google.com → Project Settings
    // =============================================
    FIREBASE: {
        projectId: 'YOUR_PROJECT_ID',  // e.g., 'ring-designer-12345'
    },

    // Example prompts for inspiration
    EXAMPLE_PROMPTS: [
        'A classic platinum solitaire with a round brilliant cut diamond, simple elegant band with subtle details',
        'A vintage-inspired rose gold ring with an oval diamond center, surrounded by a halo of small diamonds and intricate milgrain details',
        'A modern minimalist design with a princess cut diamond, thin delicate band, white gold with clean geometric lines'
    ],

    // Curated ring gallery data
    CURATED_RINGS: [
        {
            id: 1,
            title: 'Classic Solitaire',
            description: 'Timeless platinum band with a brilliant round diamond. Simple elegance that never goes out of style.',
            imageUrl: 'images/rings/classic-solitaire.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400'
        },
        {
            id: 2,
            title: 'Halo Diamond',
            description: 'Round center diamond surrounded by a sparkling halo of smaller diamonds on a white gold band.',
            imageUrl: 'images/rings/halo-diamond.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'
        },
        {
            id: 3,
            title: 'Vintage Romance',
            description: 'Art deco inspired design with intricate milgrain details and delicate filigree work in rose gold.',
            imageUrl: 'images/rings/vintage-romance.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=400'
        },
        {
            id: 4,
            title: 'Three Stone',
            description: 'Past, present, and future represented by three graduated diamonds on a platinum band.',
            imageUrl: 'images/rings/three-stone.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400'
        },
        {
            id: 5,
            title: 'Rose Gold Accent',
            description: 'Delicate rose gold band with a center diamond accented by small sapphires.',
            imageUrl: 'images/rings/rose-gold-accent.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1612323371341-a05dd8a23f99?w=400'
        },
        {
            id: 6,
            title: 'Pear Shaped',
            description: 'Elegant pear-shaped diamond in a simple solitaire setting with a thin platinum band.',
            imageUrl: 'images/rings/pear-shaped.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400'
        },
        {
            id: 7,
            title: 'Cushion Cut',
            description: 'Cushion cut diamond with a split shank band adorned with pavé diamonds.',
            imageUrl: 'images/rings/cushion-cut.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=400'
        },
        {
            id: 8,
            title: 'Oval Elegance',
            description: 'Oval diamond with delicate pavé band in white gold, elongating and sophisticated.',
            imageUrl: 'images/rings/oval-elegance.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400'
        },
        {
            id: 9,
            title: 'Emerald Cut',
            description: 'Geometric emerald cut diamond with clean lines and a sleek platinum setting.',
            imageUrl: 'images/rings/emerald-cut.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=400'
        },
        {
            id: 10,
            title: 'Modern Minimalist',
            description: 'Contemporary design with unique tension setting and ultra-thin band.',
            imageUrl: 'images/rings/modern-minimalist.jpg',
            fallbackUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400'
        }
    ],

    // LocalStorage keys
    STORAGE_KEYS: {
        SELECTED_DESIGN: 'maria_ring_design',
        DESIGN_TIMESTAMP: 'maria_ring_timestamp',
        DESIGN_TYPE: 'maria_ring_type', // 'gallery' or 'custom'
    }
};
