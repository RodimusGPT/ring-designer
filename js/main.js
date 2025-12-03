// Main Application Logic for Maria's Ring Designer
const app = {
    currentScreen: 'landingScreen',
    currentDesign: null,
    previousScreen: null,

    // Conversation state for iterative design
    conversation: {
        history: [],      // Array of {prompt, imageUrl, iteration}
        currentImage: null,
        iteration: 0
    },

    // Cached AI-generated term previews
    termPreviewCache: {},
    termGenerating: {}, // Track which terms are currently generating

    // Imported ring data
    importedRing: null,
    vendorListExpanded: false,
    currentTab: 'import',

    /**
     * Initialize the application
     */
    async init() {
        console.log('💎 Maria\'s Ring Designer initialized');

        // Setup text area character counter
        this.setupCharCounter();

        // Setup ring terminology guide with live preview
        this.setupRingGuide();

        // Setup URL input handler for direct image imports
        this.setupUrlInput();

        // Load cached term previews from Firebase
        await this.loadCachedPreviews();

        // Check if there's a saved design
        this.checkSavedDesign();

        // Show landing screen
        this.showScreen('landingScreen');
    },

    /**
     * Load cached term previews from Firebase
     */
    async loadCachedPreviews() {
        try {
            const result = await FirebaseClient.getTermPreviews();
            if (result.success && result.data) {
                this.termPreviewCache = result.data;
                console.log(`💎 Loaded ${Object.keys(result.data).length} cached previews`);
            }
        } catch (error) {
            console.warn('Could not load cached previews:', error);
        }
    },

    /**
     * Get category for a term (for prompt generation)
     */
    getTermCategory(term) {
        const categories = {
            shapes: ['Round Brilliant', 'Princess', 'Cushion', 'Oval', 'Pear', 'Emerald', 'Marquise', 'Radiant', 'Asscher'],
            settings: ['Solitaire', 'Halo', 'Three-Stone', 'Pavé', 'Channel-Set', 'Bezel', 'Cathedral'],
            metals: ['Platinum', 'White Gold', 'Yellow Gold', 'Rose Gold'],
            accents: ['Hidden Halo', 'Side Stones', 'Split Shank', 'Milgrain', 'Filigree']
        };

        for (const [category, terms] of Object.entries(categories)) {
            if (terms.includes(term)) return category;
        }
        return 'shapes'; // default
    },

    /**
     * Setup ring terminology guide with clickable chips
     */
    setupRingGuide() {
        if (!CONFIG.RING_GUIDE) return;

        const guide = CONFIG.RING_GUIDE;

        // Populate diamond shapes
        const shapesContainer = document.getElementById('guideShapes');
        if (shapesContainer && guide.diamondShapes) {
            shapesContainer.innerHTML = guide.diamondShapes.map(item =>
                `<button class="guide-chip" onclick="app.insertTerm('${item.name}')" title="${item.desc}">${item.name}</button>`
            ).join('');
        }

        // Populate settings
        const settingsContainer = document.getElementById('guideSettings');
        if (settingsContainer && guide.settings) {
            settingsContainer.innerHTML = guide.settings.map(item =>
                `<button class="guide-chip" onclick="app.insertTerm('${item.name}')" title="${item.desc}">${item.name}</button>`
            ).join('');
        }

        // Populate metals
        const metalsContainer = document.getElementById('guideMetals');
        if (metalsContainer && guide.metals) {
            metalsContainer.innerHTML = guide.metals.map(item =>
                `<button class="guide-chip" onclick="app.insertTerm('${item.name}')" title="${item.desc}">${item.name}</button>`
            ).join('');
        }

        // Populate accents
        const accentsContainer = document.getElementById('guideAccents');
        if (accentsContainer && guide.accents) {
            accentsContainer.innerHTML = guide.accents.map(item =>
                `<button class="guide-chip" onclick="app.insertTerm('${item.name}')" title="${item.desc}">${item.name}</button>`
            ).join('');
        }
    },

    /**
     * Toggle ring guide visibility (deprecated - guide is now always inline)
     */
    toggleGuide() {
        // Guide is now always visible inline with the prompt
        // This function kept for backward compatibility
    },

    // ============================================
    // URL IMPORT FUNCTIONALITY
    // ============================================

    /**
     * Setup URL input for direct image URL import
     */
    setupUrlInput() {
        const urlInput = document.getElementById('ringUrlInput');

        if (urlInput) {
            // Handle Enter key to import
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.importImageUrl();
                }
            });

            // Clear status on input
            urlInput.addEventListener('input', () => {
                this.showUrlStatus('', '');
            });
        }
    },

    /**
     * Switch between Import and Design tabs
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        const tabImport = document.getElementById('tabImport');
        const tabDesign = document.getElementById('tabDesign');

        if (tabImport && tabDesign) {
            tabImport.classList.toggle('active', tab === 'import');
            tabDesign.classList.toggle('active', tab === 'design');
        }

        // Update tab content visibility
        const contentImport = document.getElementById('tabContentImport');
        const contentDesign = document.getElementById('tabContentDesign');

        if (contentImport && contentDesign) {
            contentImport.classList.toggle('active', tab === 'import');
            contentDesign.classList.toggle('active', tab === 'design');
        }

        console.log(`📑 Switched to ${tab} tab`);
    },

    /**
     * Import ring from direct image URL
     * Simple and reliable - user pastes image URL directly
     */
    async importImageUrl() {
        const urlInput = document.getElementById('ringUrlInput');
        const url = urlInput?.value.trim();

        if (!url) {
            this.showUrlStatus('Please paste an image URL', 'error');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            this.showUrlStatus('Please enter a valid URL', 'error');
            return;
        }

        // Check if it looks like an image URL
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/i;
        const imagePatterns = /\/(images|photos|products|media|cdn|static)\//i;
        const isLikelyImage = imageExtensions.test(url) || imagePatterns.test(url) || url.includes('cloudinary') || url.includes('imgix');

        if (!isLikelyImage) {
            this.showUrlStatus('This doesn\'t look like an image URL. Try right-clicking an image and selecting "Copy image address"', 'error');
            return;
        }

        // Show loading state
        this.showLoading(true);
        this.showUrlStatus('Loading image...', 'loading');

        // Test if the image loads
        const img = new Image();
        img.crossOrigin = 'anonymous';

        try {
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Image failed to load'));
                img.src = url;

                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Image took too long to load')), 10000);
            });

            console.log('💍 Image loaded:', url);

            // Store imported ring data
            this.importedRing = {
                imageUrl: url,
                source: new URL(url).hostname
            };

            // Display the imported ring
            this.displayImportedRing();
            this.showUrlStatus('Image imported!', 'success');

            // Clear input
            urlInput.value = '';

        } catch (error) {
            console.error('Image load error:', error);
            this.showUrlStatus('Could not load this image. The website may be blocking it. Try saving the image first and uploading it.', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Show URL status message
     */
    showUrlStatus(message, type) {
        const urlStatus = document.getElementById('urlStatus');
        if (urlStatus) {
            urlStatus.textContent = message;
            urlStatus.className = `url-status ${type}`;
        }
    },

    /**
     * Display imported ring in the preview area
     */
    displayImportedRing() {
        if (!this.importedRing) return;

        const preview = document.getElementById('importedRingPreview');
        const urlImportSection = document.getElementById('urlImportSection');
        const designConversation = document.getElementById('designConversation');

        if (!preview) return;

        // Show imported ring preview, hide other sections
        preview.style.display = 'block';
        if (urlImportSection) urlImportSection.style.display = 'none';
        if (designConversation) designConversation.style.display = 'none';

        // Update the imported ring image
        const importedImage = document.getElementById('importedRingImage');
        if (importedImage && this.importedRing.imageUrl) {
            importedImage.src = this.importedRing.imageUrl;
            importedImage.alt = 'Imported ring from ' + (this.importedRing.source || 'web');
        }

        // Also show in the live preview panel
        this.displayPreview(this.importedRing.imageUrl, 'Imported Ring');
    },

    /**
     * Select the imported ring as the final choice
     */
    selectImportedRing() {
        if (!this.importedRing) {
            alert('No ring imported.');
            return;
        }

        // Create design object from imported ring
        this.currentDesign = {
            type: 'imported',
            imageUrl: this.importedRing.imageUrl,
            title: 'Your Chosen Ring',
            source: this.importedRing.source
        };

        // Show preview screen
        this.showPreview();
    },

    /**
     * Use imported ring as inspiration for AI design
     * Switches to the design tab with the image as reference
     */
    useAsInspiration() {
        if (!this.importedRing) return;

        // Switch to design tab
        this.switchTab('design');

        // Clear import view
        this.clearImport();

        // Pre-fill with a helpful prompt
        const textarea = document.getElementById('ringDescription');
        if (textarea) {
            textarea.value = 'I love this ring! Create something similar with ';
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            document.getElementById('charCount').textContent = textarea.value.length;
        }

        // Show a hint
        this.showUrlStatus('Describe what you love about this ring, or what changes you\'d like!', 'success');
    },

    /**
     * Clear the imported ring preview
     */
    clearImport() {
        this.importedRing = null;

        const preview = document.getElementById('importedRingPreview');
        const urlImportSection = document.getElementById('urlImportSection');
        const designConversation = document.getElementById('designConversation');

        if (preview) preview.style.display = 'none';
        if (urlImportSection) urlImportSection.style.display = 'block';
        if (designConversation) designConversation.style.display = 'block';

        // Clear URL status
        this.showUrlStatus('', '');

        // Reset live preview
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const previewImage = document.getElementById('livePreviewImage');
        const previewCaption = document.getElementById('previewCaption');

        if (previewPlaceholder) {
            previewPlaceholder.innerHTML = `
                <span class="placeholder-icon">💍</span>
                <p>Your ring preview will appear here</p>
            `;
            previewPlaceholder.style.display = 'block';
        }
        if (previewImage) previewImage.style.display = 'none';
        if (previewCaption) previewCaption.style.display = 'none';
    },

    /**
     * Insert term into active input field AND show live preview
     * Toggles selection state - click again to remove
     */
    insertTerm(term) {
        const textarea = document.getElementById('ringDescription');
        const refinementInput = document.getElementById('refinementText');

        // Find the clicked chip button
        const chips = document.querySelectorAll('.guide-chip');
        let clickedChip = null;
        chips.forEach(chip => {
            if (chip.textContent.trim() === term) {
                clickedChip = chip;
            }
        });

        // Check if already selected (toggle behavior)
        const isSelected = clickedChip?.classList.contains('selected');

        // Determine which field is active or visible
        const activeField = refinementInput && refinementInput.offsetParent !== null
            ? refinementInput
            : textarea;

        if (activeField) {
            if (isSelected) {
                // Remove term from text
                const termLower = term.toLowerCase();
                let value = activeField.value;
                // Remove with various separators
                value = value.replace(new RegExp(`,\\s*${termLower}`, 'gi'), '');
                value = value.replace(new RegExp(`${termLower},\\s*`, 'gi'), '');
                value = value.replace(new RegExp(`^${termLower}$`, 'gi'), '');
                activeField.value = value.trim();
            } else {
                // Add term to text
                const currentValue = activeField.value;
                const separator = currentValue.length > 0 && !currentValue.endsWith(' ') ? ', ' : '';
                activeField.value = currentValue + separator + term.toLowerCase();
            }

            activeField.focus();

            // Update char counter if textarea
            if (activeField === textarea) {
                document.getElementById('charCount').textContent = activeField.value.length;
            }
        }

        // Toggle selected state on chip
        if (clickedChip) {
            clickedChip.classList.toggle('selected');
        }

        // Show live preview for this term (only when selecting, not deselecting)
        if (!isSelected) {
            this.showTermPreview(term);
        }
    },

    /**
     * Show live preview image for a selected term
     * Uses AI-generated images with Firebase caching
     */
    async showTermPreview(term) {
        const previewContainer = document.getElementById('livePreviewContainer');
        const previewImage = document.getElementById('livePreviewImage');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const previewCaption = document.getElementById('previewCaption');

        if (!previewContainer) return;

        const category = this.getTermCategory(term);
        const caption = `${term} Engagement Ring`;

        // Check if we have a cached AI-generated preview
        if (this.termPreviewCache[term]?.imageUrl) {
            this.displayPreview(this.termPreviewCache[term].imageUrl, caption);
            return;
        }

        // Check if already generating this term
        if (this.termGenerating[term]) {
            console.log(`⏳ Already generating: ${term}`);
            return;
        }

        // Show loading state
        if (previewPlaceholder) {
            previewPlaceholder.innerHTML = `
                <span class="placeholder-icon">✨</span>
                <p>Generating ${term} preview...</p>
            `;
            previewPlaceholder.style.display = 'block';
        }
        if (previewImage) previewImage.style.display = 'none';
        if (previewCaption) previewCaption.style.display = 'none';

        // Mark as generating
        this.termGenerating[term] = true;

        try {
            // Generate the preview using AI
            const result = await FalAPI.generateTermPreview(term, category);

            if (result.success && result.imageUrl) {
                // Cache in memory
                this.termPreviewCache[term] = {
                    imageUrl: result.imageUrl,
                    caption: caption
                };

                // Cache in Firebase for persistence
                FirebaseClient.saveTermPreview(term, result.imageUrl, caption);

                // Display the generated image
                this.displayPreview(result.imageUrl, caption);

                console.log(`✨ Generated and cached: ${term}`);
            } else {
                // Fallback to static image if generation fails
                const fallback = CONFIG.TERM_EXAMPLES?.[term];
                if (fallback) {
                    this.displayPreview(fallback.image, fallback.caption);
                } else {
                    this.showPreviewError(term);
                }
            }
        } catch (error) {
            console.error(`Preview generation failed for ${term}:`, error);
            // Fallback to static image
            const fallback = CONFIG.TERM_EXAMPLES?.[term];
            if (fallback) {
                this.displayPreview(fallback.image, fallback.caption);
            }
        } finally {
            this.termGenerating[term] = false;
        }
    },

    /**
     * Display a preview image
     */
    displayPreview(imageUrl, caption) {
        const previewContainer = document.getElementById('livePreviewContainer');
        const previewImage = document.getElementById('livePreviewImage');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const previewCaption = document.getElementById('previewCaption');

        if (previewPlaceholder) previewPlaceholder.style.display = 'none';
        if (previewImage) {
            previewImage.src = imageUrl;
            previewImage.style.display = 'block';
            previewImage.alt = caption;
        }
        if (previewCaption) {
            previewCaption.textContent = caption;
            previewCaption.style.display = 'block';
        }

        // Add animation
        if (previewContainer) {
            previewContainer.classList.add('preview-updated');
            setTimeout(() => previewContainer.classList.remove('preview-updated'), 300);
        }
    },

    /**
     * Show error state in preview
     */
    showPreviewError(term) {
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        if (previewPlaceholder) {
            previewPlaceholder.innerHTML = `
                <span class="placeholder-icon">💎</span>
                <p>Couldn't load ${term} preview</p>
            `;
            previewPlaceholder.style.display = 'block';
        }
    },

    /**
     * Navigate between screens
     */
    showScreen(screenId) {
        console.log(`Navigating to: ${screenId}`);

        // Hide current screen
        const currentScreen = document.getElementById(this.currentScreen);
        if (currentScreen) {
            currentScreen.classList.remove('active');
        }

        // Show new screen
        const newScreen = document.getElementById(screenId);
        if (newScreen) {
            newScreen.classList.add('active');
            this.previousScreen = this.currentScreen;
            this.currentScreen = screenId;

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    /**
     * Go back to previous screen
     */
    goBack() {
        if (this.previousScreen === 'designerScreen') {
            this.showScreen('designerScreen');
        } else {
            this.showScreen('landingScreen');
        }
    },

    /**
     * Setup character counter for textarea
     */
    setupCharCounter() {
        const textarea = document.getElementById('ringDescription');
        const charCount = document.getElementById('charCount');

        if (textarea && charCount) {
            textarea.addEventListener('input', () => {
                charCount.textContent = textarea.value.length;
            });
        }
    },

    /**
     * Fill textarea with example prompt
     */
    fillExample(index) {
        const textarea = document.getElementById('ringDescription');
        if (textarea && CONFIG.EXAMPLE_PROMPTS[index]) {
            textarea.value = CONFIG.EXAMPLE_PROMPTS[index];
            document.getElementById('charCount').textContent = textarea.value.length;
        }
    },

    /**
     * Generate ring using AI (initial generation)
     */
    async generateRing() {
        const textarea = document.getElementById('ringDescription');
        const description = textarea.value.trim();

        // Validate description
        const validation = FalAPI.validateDescription(description);
        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        // Show loading overlay
        this.showLoading(true);

        try {
            // Call fal.ai API
            const result = await FalAPI.generateRingImage(description);

            if (result.success) {
                console.log('💎 Ring generated successfully');

                // Reset conversation and start fresh
                this.conversation.history = [];
                this.conversation.iteration = 1;
                this.conversation.currentImage = result.imageUrl;

                // Add to conversation history
                this.conversation.history.push({
                    prompt: description,
                    imageUrl: result.imageUrl,
                    iteration: 1
                });

                // Store as current design
                this.currentDesign = {
                    type: 'custom',
                    imageUrl: result.imageUrl,
                    description: description,
                    prompt: result.prompt,
                    title: 'Your Custom Design',
                    conversationHistory: [...this.conversation.history]
                };

                // Switch to conversation mode
                this.showConversationMode();

            } else {
                throw new Error(result.error || 'Generation failed');
            }

        } catch (error) {
            console.error('Generation error:', error);
            alert(`Sorry, something went wrong: ${error.message}. Please try again.`);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Refine the current design with additional instructions
     */
    async refineDesign() {
        const refinementInput = document.getElementById('refinementText');
        const refinement = refinementInput.value.trim();

        if (!refinement) {
            alert('Please describe how you\'d like to refine the design.');
            return;
        }

        if (!this.conversation.currentImage) {
            alert('No current design to refine. Please generate a design first.');
            return;
        }

        // Show loading
        this.showLoading(true);

        try {
            // Build the full context prompt including previous design
            const previousPrompts = this.conversation.history.map(h => h.prompt).join('. ');
            const fullPrompt = `Based on this engagement ring design: "${previousPrompts}". Now make this modification: ${refinement}`;

            // Generate refined version
            const result = await FalAPI.generateRingImage(fullPrompt, this.conversation.currentImage);

            if (result.success) {
                console.log('💎 Design refined successfully');

                // Update conversation
                this.conversation.iteration++;
                this.conversation.currentImage = result.imageUrl;

                // Add to history
                this.conversation.history.push({
                    prompt: refinement,
                    imageUrl: result.imageUrl,
                    iteration: this.conversation.iteration
                });

                // Update current design
                this.currentDesign.imageUrl = result.imageUrl;
                this.currentDesign.description += ` | Refinement: ${refinement}`;
                this.currentDesign.conversationHistory = [...this.conversation.history];

                // Update the conversation display
                this.updateConversationDisplay();

                // Clear refinement input
                refinementInput.value = '';

            } else {
                throw new Error(result.error || 'Refinement failed');
            }

        } catch (error) {
            console.error('Refinement error:', error);
            alert(`Sorry, couldn't refine the design: ${error.message}. Please try again.`);
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Switch UI to conversation mode after first generation
     */
    showConversationMode() {
        // Hide initial prompt
        document.getElementById('initialPrompt').style.display = 'none';

        // Show conversation history and refinement input
        document.getElementById('conversationHistory').style.display = 'flex';
        document.getElementById('refinementInput').style.display = 'block';

        // Update the display
        this.updateConversationDisplay();
    },

    /**
     * Update the conversation display with all history
     */
    updateConversationDisplay() {
        const container = document.getElementById('conversationHistory');

        container.innerHTML = this.conversation.history.map((item, index) => `
            <div class="conversation-message">
                <div class="message-prompt">${item.prompt}</div>
                <div class="message-image">
                    <img src="${item.imageUrl}" alt="Design iteration ${item.iteration}">
                </div>
                <div class="message-iteration">Version ${item.iteration}${index === this.conversation.history.length - 1 ? ' (Current)' : ''}</div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    /**
     * Select the current design and proceed to preview
     */
    selectCurrentDesign() {
        if (!this.currentDesign) {
            alert('No design selected yet.');
            return;
        }
        this.showPreview();
    },

    /**
     * Start over with a new design
     */
    startOver() {
        // Reset conversation
        this.conversation.history = [];
        this.conversation.currentImage = null;
        this.conversation.iteration = 0;
        this.currentDesign = null;

        // Reset UI
        document.getElementById('initialPrompt').style.display = 'block';
        document.getElementById('conversationHistory').style.display = 'none';
        document.getElementById('refinementInput').style.display = 'none';
        document.getElementById('conversationHistory').innerHTML = '';
        document.getElementById('ringDescription').value = '';
        document.getElementById('charCount').textContent = '0';
    },

    /**
     * Show preview screen with current design
     */
    showPreview() {
        if (!this.currentDesign) {
            console.error('No design selected');
            return;
        }

        // Update preview screen
        const previewImage = document.getElementById('previewImage');
        const previewDescription = document.getElementById('previewDescription');

        previewImage.src = this.currentDesign.imageUrl;
        previewDescription.textContent = this.currentDesign.description;

        // Navigate to preview screen
        this.showScreen('previewScreen');
    },

    /**
     * Confirm the selected design
     */
    async confirmDesign() {
        if (!this.currentDesign) return;

        console.log('Design confirmed:', this.currentDesign);

        // Show loading while saving
        this.showLoading(true);

        // Save to both localStorage and cloud
        await this.saveDesign();

        this.showLoading(false);

        // Show thank you screen
        const finalImage = document.getElementById('finalRingImage');
        finalImage.src = this.currentDesign.imageUrl;

        if (this.currentDesign.type === 'gallery') {
            finalImage.onerror = () => {
                finalImage.src = this.currentDesign.ring.fallbackUrl;
            };
        }

        this.showScreen('thankYouScreen');
    },

    /**
     * Save design to localStorage AND Supabase (cloud)
     */
    async saveDesign() {
        const designData = {
            ...this.currentDesign,
            timestamp: new Date().toISOString()
        };

        // 1. Always save to localStorage (backup)
        try {
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.SELECTED_DESIGN,
                JSON.stringify(designData)
            );
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.DESIGN_TIMESTAMP,
                designData.timestamp
            );
            localStorage.setItem(
                CONFIG.STORAGE_KEYS.DESIGN_TYPE,
                this.currentDesign.type
            );
            console.log('✅ Design saved to localStorage');
        } catch (error) {
            console.error('localStorage save failed:', error);
        }

        // 2. Also save to Firebase (cloud persistence)
        try {
            const cloudResult = await FirebaseClient.saveDesign(this.currentDesign);
            if (cloudResult.success) {
                console.log('✅ Design saved to Firebase cloud!', cloudResult.id);
            } else {
                console.warn('⚠️ Cloud save skipped:', cloudResult.error);
            }
        } catch (error) {
            console.warn('⚠️ Cloud save failed (localStorage backup exists):', error);
        }
    },

    /**
     * Check if there's a previously saved design
     */
    checkSavedDesign() {
        try {
            const savedDesign = localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_DESIGN);
            if (savedDesign) {
                const design = JSON.parse(savedDesign);
                console.log('Found saved design:', design);
                // Could show a notification or allow viewing the saved design
            }
        } catch (error) {
            console.error('Error checking saved design:', error);
        }
    },

    /**
     * Show/hide loading overlay
     */
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// ============================================
// SECRET ADMIN FUNCTIONS
// Press keys to access after proposal
// Only triggers when NOT focused on input fields
// ============================================

document.addEventListener('keydown', async (e) => {
    // Don't trigger shortcuts when typing in input fields
    const activeElement = document.activeElement;
    const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
    );

    if (isTyping) return;

    // Press 'A' - View localStorage design
    if (e.key === 'A' || e.key === 'a') {
        const saved = localStorage.getItem('maria_ring_design');
        if (saved) {
            console.log('📦 LocalStorage Design:', JSON.parse(saved));
            alert('Design found! Check browser console (F12) for details.');
        } else {
            alert('No design saved in localStorage yet.');
        }
    }

    // Press 'S' - Fetch from Firebase cloud
    if (e.key === 'S' || e.key === 's') {
        console.log('☁️ Fetching from Firebase...');
        const result = await FirebaseClient.getLatestDesign();
        if (result.success) {
            console.log('☁️ Cloud Design:', result.data);
            alert(`Found design from cloud!\n\nType: ${result.data.design_type}\nTitle: ${result.data.title}\nSaved: ${result.data.created_at}\n\nCheck console for full details.`);
        } else {
            alert('No designs found in Firebase (or not configured).');
        }
    }

    // Press 'D' - Download design as JSON file
    if (e.key === 'D' || e.key === 'd') {
        const saved = localStorage.getItem('maria_ring_design');
        if (saved) {
            const blob = new Blob([saved], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'marias-ring-design.json';
            a.click();
            URL.revokeObjectURL(url);
            console.log('💾 Design downloaded!');
        } else {
            alert('No design to download yet.');
        }
    }
});
