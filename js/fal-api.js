// Ring Designer API Client
// Calls our secure backend (which calls fal.ai)
const FalAPI = {
    /**
     * Generate a ring image via our secure backend
     * @param {string} description - User's ring description
     * @param {string} referenceImage - Optional URL of previous design for refinement
     * @returns {Promise<object>} - Generated image data
     */
    async generateRingImage(description, referenceImage = null) {
        const apiUrl = CONFIG.API_URL;

        // Validate API URL is configured
        if (!apiUrl || apiUrl === 'YOUR_RENDER_URL') {
            throw new Error('Backend API not configured. Please set API_URL in config.js');
        }

        const isRefinement = !!referenceImage;
        console.log(`${isRefinement ? '🔄 Refining' : '✨ Generating'}: ${description.substring(0, 50)}...`);

        try {
            const requestBody = {
                prompt: description
            };

            // Include reference image for refinement (backend will use this context)
            if (referenceImage) {
                requestBody.referenceImage = referenceImage;
                requestBody.isRefinement = true;
            }

            const response = await fetch(`${apiUrl}/api/generate-ring`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API request failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(`${isRefinement ? '🔄 Refinement' : '✨ Generation'} successful!`);

            if (result.success && result.imageUrl) {
                return {
                    success: true,
                    imageUrl: result.imageUrl,
                    prompt: result.prompt,
                    description: description,
                    isRefinement: isRefinement
                };
            } else {
                throw new Error(result.error || 'No image generated');
            }

        } catch (error) {
            console.error('Ring generation error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Retry image generation with the same description
     * @param {string} description - Ring description
     * @returns {Promise<object>} - Generated image data
     */
    async retryGeneration(description) {
        console.log('Retrying generation...');
        return this.generateRingImage(description);
    },

    /**
     * Validate user description before generation
     * @param {string} description - User's ring description
     * @returns {object} - Validation result
     */
    validateDescription(description) {
        const trimmed = description.trim();

        if (!trimmed) {
            return {
                valid: false,
                message: 'Please describe your dream ring'
            };
        }

        if (trimmed.length < 10) {
            return {
                valid: false,
                message: 'Please provide more details (at least 10 characters)'
            };
        }

        if (trimmed.length > 500) {
            return {
                valid: false,
                message: 'Description is too long (max 500 characters)'
            };
        }

        return {
            valid: true,
            message: 'Description is valid'
        };
    }
};
