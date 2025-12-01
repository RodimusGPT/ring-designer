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

    /**
     * Initialize the application
     */
    init() {
        console.log('💎 Maria\'s Ring Designer initialized');

        // Load gallery rings
        this.loadGallery();

        // Setup text area character counter
        this.setupCharCounter();

        // Setup ring terminology guide
        this.setupRingGuide();

        // Check if there's a saved design
        this.checkSavedDesign();

        // Show landing screen
        this.showScreen('landingScreen');
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
    },

    /**
     * Toggle ring guide visibility
     */
    toggleGuide() {
        const guide = document.getElementById('ringGuide');
        if (guide) {
            guide.style.display = guide.style.display === 'none' ? 'block' : 'none';
        }
    },

    /**
     * Insert term into active input field
     */
    insertTerm(term) {
        const textarea = document.getElementById('ringDescription');
        const refinementInput = document.getElementById('refinementText');

        // Determine which field is active or visible
        const activeField = refinementInput && refinementInput.offsetParent !== null
            ? refinementInput
            : textarea;

        if (activeField) {
            const currentValue = activeField.value;
            const separator = currentValue.length > 0 && !currentValue.endsWith(' ') ? ', ' : '';
            activeField.value = currentValue + separator + term.toLowerCase();
            activeField.focus();

            // Update char counter if textarea
            if (activeField === textarea) {
                document.getElementById('charCount').textContent = activeField.value.length;
            }
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
        if (this.previousScreen) {
            if (this.previousScreen === 'galleryScreen') {
                this.showScreen('galleryScreen');
            } else if (this.previousScreen === 'designerScreen') {
                this.showScreen('designerScreen');
            } else {
                this.showScreen('choiceScreen');
            }
        } else {
            this.showScreen('choiceScreen');
        }
    },

    /**
     * Load curated ring gallery
     */
    loadGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '';

        CONFIG.CURATED_RINGS.forEach(ring => {
            const card = this.createRingCard(ring);
            galleryGrid.appendChild(card);
        });
    },

    /**
     * Create a ring card element with diamond/style metadata
     */
    createRingCard(ring) {
        const card = document.createElement('div');
        card.className = 'ring-card';
        card.innerHTML = `
            <img
                src="${ring.imageUrl}"
                alt="${ring.title}"
                class="ring-card-image"
                onerror="this.src='${ring.fallbackUrl}'"
            >
            <div class="ring-card-content">
                <h3 class="ring-card-title">${ring.title}</h3>
                <div class="ring-card-tags">
                    <span class="ring-tag diamond">${ring.diamond || 'Diamond'}</span>
                    <span class="ring-tag metal">${ring.metal || 'Platinum'}</span>
                </div>
                <p class="ring-card-description">${ring.description}</p>
                <button class="btn btn-secondary" onclick="app.selectGalleryRing(${ring.id})">
                    Select This Design
                </button>
            </div>
        `;
        return card;
    },

    /**
     * Handle gallery ring selection
     */
    selectGalleryRing(ringId) {
        const ring = CONFIG.CURATED_RINGS.find(r => r.id === ringId);
        if (!ring) return;

        console.log('Gallery ring selected:', ring.title);

        // Store the design
        this.currentDesign = {
            type: 'gallery',
            ring: ring,
            imageUrl: ring.imageUrl,
            description: ring.description,
            title: ring.title
        };

        // Show preview
        this.showPreview();
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

        if (this.currentDesign.type === 'gallery') {
            previewImage.src = this.currentDesign.imageUrl;
            previewImage.onerror = () => {
                previewImage.src = this.currentDesign.ring.fallbackUrl;
            };
            previewDescription.textContent = this.currentDesign.description;
        } else {
            previewImage.src = this.currentDesign.imageUrl;
            previewDescription.textContent = this.currentDesign.description;
        }

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
// ============================================

document.addEventListener('keydown', async (e) => {
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
