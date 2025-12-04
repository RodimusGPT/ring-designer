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

    // Reference image for AI generation
    referenceImage: null,  // {imageUrl, source}

    // Saved ring collection
    savedRings: [],  // Array of {id, imageUrl, prompt, type, timestamp, isTheOne}

    /**
     * Initialize the application
     */
    async init() {
        console.log('💎 Maria\'s Ring Designer initialized');

        // Setup text area character counter
        this.setupCharCounter();

        // Setup ring terminology guide with live preview
        this.setupRingGuide();

        // Setup layout toggle and tabbed navigation
        this.setupLayoutToggle();
        this.setupRingGuideTabs();

        // Setup file upload handler
        this.setupFileUpload();

        // Load cached term previews from Firebase
        await this.loadCachedPreviews();

        // Load saved ring collection from Firebase
        await this.loadCollection();

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
     * Setup ring terminology guide with clickable chips (both layouts)
     */
    setupRingGuide() {
        if (!CONFIG.RING_GUIDE) return;

        const guide = CONFIG.RING_GUIDE;

        // Helper to generate chip HTML
        const createChips = (items) => items.map(item =>
            `<button class="guide-chip" onclick="app.insertTerm('${item.name}')" title="${item.desc}">${item.name}</button>`
        ).join('');

        // Populate CLASSIC layout
        const shapesContainer = document.getElementById('guideShapes');
        if (shapesContainer && guide.diamondShapes) {
            shapesContainer.innerHTML = createChips(guide.diamondShapes);
        }

        const settingsContainer = document.getElementById('guideSettings');
        if (settingsContainer && guide.settings) {
            settingsContainer.innerHTML = createChips(guide.settings);
        }

        const metalsContainer = document.getElementById('guideMetals');
        if (metalsContainer && guide.metals) {
            metalsContainer.innerHTML = createChips(guide.metals);
        }

        const accentsContainer = document.getElementById('guideAccents');
        if (accentsContainer && guide.accents) {
            accentsContainer.innerHTML = createChips(guide.accents);
        }

        // Populate TABBED layout
        const shapesTabsContainer = document.getElementById('guideShapesTabs');
        if (shapesTabsContainer && guide.diamondShapes) {
            shapesTabsContainer.innerHTML = createChips(guide.diamondShapes);
        }

        const settingsTabsContainer = document.getElementById('guideSettingsTabs');
        if (settingsTabsContainer && guide.settings) {
            settingsTabsContainer.innerHTML = createChips(guide.settings);
        }

        const metalsTabsContainer = document.getElementById('guideMetalsTabs');
        if (metalsTabsContainer && guide.metals) {
            metalsTabsContainer.innerHTML = createChips(guide.metals);
        }

        const accentsTabsContainer = document.getElementById('guideAccentsTabs');
        if (accentsTabsContainer && guide.accents) {
            accentsTabsContainer.innerHTML = createChips(guide.accents);
        }
    },

    /**
     * Setup layout toggle between Classic and Tabbed views
     */
    setupLayoutToggle() {
        const toggleContainer = document.getElementById('guideLayoutToggle');
        if (!toggleContainer) return;

        const buttons = toggleContainer.querySelectorAll('.layout-btn');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const layout = btn.dataset.layout;
                this.setGuideLayout(layout);

                // Update active button
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Restore saved layout preference
        const savedLayout = localStorage.getItem('ringGuideLayout') || 'classic';
        this.setGuideLayout(savedLayout);

        // Update button state
        buttons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === savedLayout);
        });
    },

    /**
     * Switch between Classic and Tabbed layouts
     */
    setGuideLayout(layout) {
        const classicLayout = document.getElementById('ringGuideClassic');
        const tabbedLayout = document.getElementById('ringGuideTabs');

        if (classicLayout) {
            classicLayout.style.display = layout === 'classic' ? 'block' : 'none';
        }
        if (tabbedLayout) {
            tabbedLayout.style.display = layout === 'tabbed' ? 'block' : 'none';
        }

        localStorage.setItem('ringGuideLayout', layout);
    },

    /**
     * Setup tab switching for tabbed layout
     */
    setupRingGuideTabs() {
        const tabs = document.querySelectorAll('.guide-tab');
        const panels = document.querySelectorAll('.guide-panel');

        if (tabs.length === 0) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;

                // Update tab states
                tabs.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');

                // Update panel visibility
                panels.forEach(panel => {
                    const isTarget = panel.id === `panel-${category}`;
                    panel.classList.toggle('active', isTarget);
                    panel.hidden = !isTarget;
                });
            });

            // Keyboard navigation
            tab.addEventListener('keydown', (e) => {
                const tabList = Array.from(tabs);
                const currentIndex = tabList.indexOf(tab);
                let newIndex;

                switch (e.key) {
                    case 'ArrowLeft':
                        newIndex = currentIndex === 0 ? tabList.length - 1 : currentIndex - 1;
                        break;
                    case 'ArrowRight':
                        newIndex = currentIndex === tabList.length - 1 ? 0 : currentIndex + 1;
                        break;
                    case 'Home':
                        newIndex = 0;
                        break;
                    case 'End':
                        newIndex = tabList.length - 1;
                        break;
                    default:
                        return;
                }

                e.preventDefault();
                tabList[newIndex].click();
                tabList[newIndex].focus();
            });
        });
    },

    /**
     * Update tab badges to show selection count per category
     */
    updateTabBadges() {
        const categories = {
            diamond: ['guideShapes', 'guideShapesTabs'],
            setting: ['guideSettings', 'guideSettingsTabs'],
            metal: ['guideMetals', 'guideMetalsTabs'],
            accents: ['guideAccents', 'guideAccentsTabs']
        };

        Object.entries(categories).forEach(([category, containerIds]) => {
            const badge = document.getElementById(`badge-${category}`);
            if (!badge) return;

            // Count selected chips from either layout (they're synced)
            let selectedCount = 0;
            for (const containerId of containerIds) {
                const container = document.getElementById(containerId);
                if (container) {
                    selectedCount = container.querySelectorAll('.guide-chip.selected').length;
                    if (selectedCount > 0) break;
                }
            }

            if (selectedCount > 0) {
                badge.textContent = selectedCount;
                badge.classList.add('visible');
            } else {
                badge.textContent = '';
                badge.classList.remove('visible');
            }
        });
    },

    /**
     * Sync chip selection between Classic and Tabbed layouts
     */
    syncChipSelection(term, isSelected) {
        // Find all chips with this term across both layouts
        const allChips = document.querySelectorAll('.guide-chip');
        allChips.forEach(chip => {
            if (chip.textContent.trim() === term) {
                chip.classList.toggle('selected', isSelected);
            }
        });
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
     * Setup file upload handler
     */
    setupFileUpload() {
        const fileInput = document.getElementById('ringFileInput');
        if (!fileInput) return;

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
    },

    /**
     * Handle uploaded file - convert to data URL and set as reference
     */
    async handleFileUpload(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Image is too large. Please use an image under 10MB.');
            return;
        }

        this.showLoading(true);

        try {
            // Convert to data URL
            const dataUrl = await this.fileToDataUrl(file);

            console.log('📷 Reference image uploaded:', file.name);

            // Set as reference image
            this.setReferenceImage(dataUrl, 'uploaded');

        } catch (error) {
            console.error('Upload error:', error);
            alert('Could not process image. Please try again.');
        } finally {
            this.showLoading(false);
            // Clear file input for future uploads
            const fileInput = document.getElementById('ringFileInput');
            if (fileInput) fileInput.value = '';
        }
    },

    /**
     * Convert file to data URL
     */
    fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    },

    // ============================================
    // REFERENCE IMAGE SECTION
    // ============================================

    /**
     * Set reference image and update UI
     */
    setReferenceImage(imageUrl, source) {
        this.referenceImage = { imageUrl, source };

        // Update preview
        const preview = document.getElementById('referencePreview');
        const options = document.getElementById('referenceOptions');
        const refImage = document.getElementById('referenceImage');

        if (refImage) refImage.src = imageUrl;
        if (preview) preview.style.display = 'flex';
        if (options) options.style.display = 'none';

        // Also show in main preview panel
        this.displayPreview(imageUrl, 'Your inspiration');

        console.log('✨ Reference image set');
    },

    /**
     * Clear reference image
     */
    clearReference() {
        this.referenceImage = null;

        const preview = document.getElementById('referencePreview');
        const options = document.getElementById('referenceOptions');
        const refImage = document.getElementById('referenceImage');

        if (refImage) refImage.src = '';
        if (preview) preview.style.display = 'none';
        if (options) options.style.display = 'block';

        // Reset main preview
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

        console.log('🗑️ Reference cleared');
    },

    /**
     * Insert term into active input field AND show live preview
     * Toggles selection state - click again to remove
     * Mutual exclusivity: Diamond/Setting/Metal allow only ONE selection each
     * Accents allow multiple selections (can combine features)
     */
    insertTerm(term) {
        const textarea = document.getElementById('ringDescription');
        const refinementInput = document.getElementById('refinementText');

        // Find the clicked chip button and its category container
        const chips = document.querySelectorAll('.guide-chip');
        let clickedChip = null;
        let categoryContainer = null;

        chips.forEach(chip => {
            if (chip.textContent.trim() === term) {
                clickedChip = chip;
                categoryContainer = chip.closest('.guide-chips');
            }
        });

        // Check if already selected (toggle behavior)
        const isSelected = clickedChip?.classList.contains('selected');

        // Determine if this category allows multiple selections
        // Accents (guideAccents or guideAccentsTabs) allows multiple, others are mutually exclusive
        const categoryId = categoryContainer?.id;
        const allowMultiple = categoryId === 'guideAccents' || categoryId === 'guideAccentsTabs';

        // Determine which field is active or visible
        const activeField = refinementInput && refinementInput.offsetParent !== null
            ? refinementInput
            : textarea;

        if (activeField) {
            // If NOT allowing multiple and NOT already selected, deselect others in same category first
            if (!allowMultiple && !isSelected && categoryContainer) {
                const siblingsSelected = categoryContainer.querySelectorAll('.guide-chip.selected');
                siblingsSelected.forEach(sibling => {
                    // Remove sibling's term from text
                    const siblingTerm = sibling.textContent.trim().toLowerCase();
                    let value = activeField.value;
                    value = value.replace(new RegExp(`,\\s*${siblingTerm}`, 'gi'), '');
                    value = value.replace(new RegExp(`${siblingTerm},\\s*`, 'gi'), '');
                    value = value.replace(new RegExp(`^${siblingTerm}$`, 'gi'), '');
                    activeField.value = value.trim();
                    // Deselect visually
                    sibling.classList.remove('selected');
                });
            }

            if (isSelected) {
                // Remove term from text (deselecting)
                const termLower = term.toLowerCase();
                let value = activeField.value;
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

        // Toggle selected state on clicked chip
        if (clickedChip) {
            clickedChip.classList.toggle('selected');
        }

        // Sync selection across both layouts (Classic and Tabbed)
        this.syncChipSelection(term, !isSelected);

        // Update tab badges to reflect selection count
        this.updateTabBadges();

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
            // Get reference image if available
            const referenceUrl = this.referenceImage?.imageUrl || null;

            // Call fal.ai API with optional reference image
            const result = await FalAPI.generateRingImage(description, referenceUrl);

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

                // Update the main preview with the new design
                this.displayPreview(result.imageUrl, `Version ${this.conversation.iteration}`);

                // Update the conversation display (past versions)
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
        // Hide design flow, show conversation mode
        const designFlow = document.getElementById('designFlow');
        const conversationMode = document.getElementById('conversationMode');

        if (designFlow) designFlow.style.display = 'none';
        if (conversationMode) conversationMode.style.display = 'block';

        // Update the main preview to show current design
        if (this.currentDesign) {
            this.displayPreview(this.currentDesign.imageUrl, `Version ${this.conversation.iteration}`);
        }

        // Update the conversation history (past versions only)
        this.updateConversationDisplay();
    },

    /**
     * Update the conversation display - only show PAST versions as thumbnails
     * Current version is shown in the main preview panel
     */
    updateConversationDisplay() {
        const container = document.getElementById('conversationHistory');
        if (!container) return;

        // Only show past versions (not the current one)
        const pastVersions = this.conversation.history.slice(0, -1);

        if (pastVersions.length === 0) {
            container.innerHTML = '<p class="no-history">This is your first design. Refine it or save it!</p>';
        } else {
            container.innerHTML = `
                <p class="history-label">Previous versions:</p>
                <div class="history-thumbnails">
                    ${pastVersions.map((item) => `
                        <div class="history-thumb" onclick="app.displayPreview('${item.imageUrl}', 'Version ${item.iteration}')">
                            <img src="${item.imageUrl}" alt="Version ${item.iteration}">
                            <span>V${item.iteration}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
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
        this.referenceImage = null;

        // Reset UI - show design flow, hide conversation mode
        const designFlow = document.getElementById('designFlow');
        const conversationMode = document.getElementById('conversationMode');
        const conversationHistory = document.getElementById('conversationHistory');

        if (designFlow) designFlow.style.display = 'block';
        if (conversationMode) conversationMode.style.display = 'none';
        if (conversationHistory) conversationHistory.innerHTML = '';

        // Reset form
        const textarea = document.getElementById('ringDescription');
        const charCount = document.getElementById('charCount');
        if (textarea) textarea.value = '';
        if (charCount) charCount.textContent = '0';

        // Clear any selected chips (from both layouts)
        document.querySelectorAll('.guide-chip.selected').forEach(chip => {
            chip.classList.remove('selected');
        });

        // Reset tab badges
        this.updateTabBadges();

        // Clear reference image
        this.clearReference();
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
    },

    // ============================================
    // RING COLLECTION MANAGEMENT
    // ============================================

    collectionExpanded: false,

    /**
     * Load saved collection from Firebase on init
     */
    async loadCollection() {
        try {
            const result = await FirebaseClient.getCollection();
            if (result.success) {
                this.savedRings = result.data;
                this.updateCollectionDisplay();
                console.log(`💎 Loaded ${this.savedRings.length} saved rings`);
            }
        } catch (error) {
            console.warn('Could not load collection:', error);
        }
    },

    /**
     * Toggle collection visibility
     */
    toggleCollection() {
        this.collectionExpanded = !this.collectionExpanded;
        const gallery = document.getElementById('collectionGallery');
        const toggleText = document.getElementById('collectionToggleText');

        if (gallery) {
            gallery.style.display = this.collectionExpanded ? 'block' : 'none';
        }
        if (toggleText) {
            toggleText.textContent = this.collectionExpanded ? 'Hide' : 'Show';
        }
    },

    /**
     * Save current AI-generated design to collection
     */
    async saveCurrentToCollection() {
        if (!this.currentDesign || !this.currentDesign.imageUrl) {
            alert('No design to save. Generate a ring first!');
            return;
        }

        this.showLoading(true);

        try {
            const ring = {
                imageUrl: this.currentDesign.imageUrl,
                prompt: this.currentDesign.description || '',
                type: 'generated'
            };

            const result = await FirebaseClient.saveToCollection(ring);

            if (result.success) {
                // Refresh collection
                await this.loadCollection();

                // Show success feedback
                this.showSaveSuccess('Ring saved to collection!');

                // Expand collection to show the new ring
                if (!this.collectionExpanded) {
                    this.toggleCollection();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Save to collection failed:', error);
            alert('Could not save ring. Please try again.');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Show brief success message
     */
    showSaveSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'save-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * Update the collection display
     */
    updateCollectionDisplay() {
        const grid = document.getElementById('collectionGrid');
        const empty = document.getElementById('collectionEmpty');
        const count = document.getElementById('collectionCount');

        if (count) {
            count.textContent = `(${this.savedRings.length})`;
        }

        if (!grid) return;

        if (this.savedRings.length === 0) {
            grid.style.display = 'none';
            if (empty) empty.style.display = 'flex';
            return;
        }

        grid.style.display = 'grid';
        if (empty) empty.style.display = 'none';

        // Render collection cards
        grid.innerHTML = this.savedRings.map(ring => `
            <div class="collection-card ${ring.isTheOne ? 'is-the-one' : ''}" data-ring-id="${ring.id}">
                <div class="collection-card-image">
                    <img src="${ring.imageUrl}" alt="Saved ring" loading="lazy">
                    ${ring.isTheOne ? '<div class="the-one-badge">💕 The One</div>' : ''}
                </div>
                <div class="collection-card-info">
                    <span class="ring-type ${ring.type}">${ring.type === 'imported' ? '🔗 Imported' : '✨ Generated'}</span>
                    <span class="ring-date">${this.formatDate(ring.createdAt)}</span>
                </div>
                <div class="collection-card-actions">
                    ${!ring.isTheOne ? `
                        <button class="btn-the-one" onclick="app.markAsTheOne('${ring.id}')" title="Mark as The One">
                            💕 This Is The One!
                        </button>
                    ` : `
                        <button class="btn-the-one selected" disabled>
                            💕 The One
                        </button>
                    `}
                    <button class="btn-remove" onclick="app.removeFromCollection('${ring.id}')" title="Remove from collection">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    /**
     * Mark a ring as "The One"
     */
    async markAsTheOne(ringId) {
        this.showLoading(true);

        try {
            const result = await FirebaseClient.markAsTheOne(ringId);

            if (result.success) {
                // Refresh collection to show updated state
                await this.loadCollection();
                this.showSaveSuccess('💕 Marked as The One!');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Mark as The One failed:', error);
            alert('Could not mark ring. Please try again.');
        } finally {
            this.showLoading(false);
        }
    },

    /**
     * Remove ring from collection
     */
    async removeFromCollection(ringId) {
        if (!confirm('Remove this ring from your collection?')) {
            return;
        }

        this.showLoading(true);

        try {
            const result = await FirebaseClient.removeFromCollection(ringId);

            if (result.success) {
                // Refresh collection
                await this.loadCollection();
                this.showSaveSuccess('Ring removed');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Remove from collection failed:', error);
            alert('Could not remove ring. Please try again.');
        } finally {
            this.showLoading(false);
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
