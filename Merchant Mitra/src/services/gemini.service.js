import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
// Note: In a real production app, you should proxy requests through your backend 
// to keep your API key secure. For this hackathon/demo, client-side is acceptable 
// but ensure the key is in .env.local
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
}

// Helper: Retry with Exponential Backoff
async function retryWithBackoff(fn, retries = 3, delay = 1000) {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0 || !error.message.includes('503')) throw error;
        console.warn(`Gemini 503 Overloaded. Retrying in ${delay}ms... (${retries} left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 2);
    }
}

// Model Fallback Constant
// Model Fallback Constant
const MODEL_NAME = "gemini-1.5-flash-001"; // Specific version for stability

export const analyzeReceiptImage = async (imageFile, language = 'en-IN') => {
    if (!API_KEY) {
        return {
            success: false,
            error: "Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file."
        };
    }

    try {
        // Convert file to base64
        const base64Data = await fileToGenerativePart(imageFile);

        // Get the model
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Analyze this receipt or handwritten note image. 
        Language Context: The user prefers ${language}.
        
        Extract the following information and return it as a pure JSON object (no markdown formatting):
        {
            "amount": number (total amount found),
            "customerName": string (if a name is mentioned, else empty),
            "note": string (list of items or description, translated to ${language} if possible),
            "type": string (one of: SALE, EXPENSE, UDHAAR_GIVEN, UDHAAR_RECEIVED)
        }
        
        Rules:
        - If it looks like a shop bill/receipt, type is likely 'SALE'.
        - If it's a payment receipt (e.g., petrol, electricity), type is 'EXPENSE'.
        - If it's a handwritten note saying "Given to X", type is 'UDHAAR_GIVEN'.
        - Convert currency to simple number.
        `;

        const result = await retryWithBackoff(() => model.generateContent([prompt, base64Data]));
        const response = await result.response;
        const text = response.text();

        // Clean up the response to ensure valid JSON (remove markdown code blocks if present)
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        return {
            success: true,
            data
        };

    } catch (error) {
        console.error("Gemini analysis error:", error);
        return {
            success: false,
            error: "Failed to analyze image. Please try again."
        };
    }
};

// Generate Business Insights
export const generateBusinessInsights = async (transactions, language = 'en-IN') => {
    if (!API_KEY) {
        return {
            success: false,
            error: "Gemini API Key missing"
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Summarize data for the prompt to save tokens
        const summary = transactions.slice(0, 20).map(t => ({
            date: new Date(t.createdAt).toLocaleDateString(),
            type: t.type,
            amount: t.amount,
            name: t.customerName || 'Unknown',
            status: t.status
        }));

        const prompt = `
        You are a smart business assistant for a small shopkeeper in India ("Merchant Mitra").
        Analyze these recent 20 transactions:
        ${JSON.stringify(summary)}

        Provide ONE single, short, actionable business insight or tip (max 2 sentences).
        IMPORTANT: Respond in this language: "${language} (Indian Context)".
        If Hindi, use Devanagari script.
        
        Focus on:
        - Pending payments (Udhaar) that need collecting.
        - High expenses warning.
        - Sales trends (if doing well).
        - Encouragement.

        Tone: Friendly, professional, encouraging.
        Output: Just the text string of the advice. No JSON.
        `;

        const result = await retryWithBackoff(() => model.generateContent(prompt));
        const response = await result.response;
        const text = response.text();

        return {
            success: true,
            data: text.trim()
        };

    } catch (error) {
        console.error("Gemini insights error:", error);
        return {
            success: false,
            error: "Could not generate insights."
        };
    }
};

// Parse Natural Language Transaction (Multi-lingual)
export const parseTransactionText = async (text, language = 'en-IN') => {
    if (!API_KEY) {
        console.error('Gemini API Key is missing. Check VITE_GEMINI_API_KEY in .env file.');
        return {
            success: false,
            error: "Gemini API Key missing. Please add VITE_GEMINI_API_KEY to .env file."
        };
    }

    if (!text || text.trim().length === 0) {
        return {
            success: false,
            error: "No text to parse"
        };
    }

    console.log('Parsing transaction text with Gemini:', text);

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `
        Extract transaction details from this text. The text might be in English, Hindi, Hinglish, Marathi, or Gujarati.
        Input Text: "${text}"
        Context Language: ${language}
        
        Return a JSON object with:
        {
            "amount": number,
            "customerName": string (The name of the person mentioned for the transaction),
            "note": string (Use exactly this text: "${text}"),
            "type": string (SALE, EXPENSE, UDHAAR_GIVEN, UDHAAR_RECEIVED)
        }

        Rules:
        - Identify the person name mentioned and put it in "customerName".
        - The "note" MUST be exactly the original input text.
        - "Received from X" -> SALE or UDHAAR_RECEIVED
        - "Paid to X" / "Expense for Y" -> EXPENSE
        - "Given to X" / "Udhaar diya" -> UDHAAR_GIVEN
        - "Received back from X" / "Udhaar wapas" -> UDHAAR_RECEIVED
        
        Return ONLY the JSON object, no markdown formatting.
        `;

        const result = await retryWithBackoff(() => model.generateContent(prompt));
        const response = await result.response;
        const responseText = response.text();

        console.log('Gemini response:', responseText);

        const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonString);

        console.log('Parsed data:', data);

        return {
            success: true,
            data
        };

    } catch (error) {
        console.error("Gemini parse error:", error);
        console.error("Error details:", error.message);

        // Fallback: Try simple local parsing
        console.log('Falling back to local parsing...');
        const fallbackData = simpleLocalParse(text);

        if (fallbackData.amount) {
            return {
                success: true,
                data: fallbackData
            };
        }

        return {
            success: false,
            error: `Could not understand text: ${error.message || 'Unknown error'}`
        };
    }
};

// Simple local parsing fallback when Gemini fails
function simpleLocalParse(text) {
    const lowerText = text.toLowerCase();
    let amount = null;
    let customerName = '';
    let note = text; // The transcript itself should be the note
    let type = 'SALE';

    // Extract Amount (searches for numbers)
    const amountMatch = text.match(/[\d,]+/);
    if (amountMatch) {
        amount = parseFloat(amountMatch[0].replace(/,/g, ''));
    }

    // Determine Type
    if (lowerText.includes('paid') || lowerText.includes('expense') || lowerText.includes('spent') || lowerText.includes('given to') || lowerText.includes('kharcha') || lowerText.includes('खर्च')) {
        type = 'EXPENSE';
    } else if (lowerText.includes('udhaar') || lowerText.includes('credit') || lowerText.includes('उधार')) {
        if (lowerText.includes('given') || lowerText.includes('diya') || lowerText.includes('दिया')) {
            type = 'UDHAAR_GIVEN';
        } else if (lowerText.includes('received') || lowerText.includes('back') || lowerText.includes('wapas') || lowerText.includes('वापस')) {
            type = 'UDHAAR_RECEIVED';
        }
    }

    // Extract Name (words after 'from' or 'to' or 'by')
    const nameMatch = text.match(/(?:from|to|by|given to|paid to)\s+([a-zA-Z]+)/i);
    if (nameMatch) {
        customerName = nameMatch[1];
    } else {
        // Simple heuristic: if there's a word that isn't a command/amount/preposition
        const words = text.split(' ').filter(w => w.length > 2);
        if (words.length > 0 && isNaN(words[0])) {
            customerName = words[0]; // Guess the first word as name if nothing else
        }
    }

    return {
        amount,
        customerName: customerName.charAt(0).toUpperCase() + customerName.slice(1),
        note,
        type
    };
}

// Helper: Convert File to Base64/GenerativePart
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // The result is data:image/jpeg;base64,.....
            // We need to strip the prefix for Gemini API if using inlineData (but SDK usually handles this depending on usage)
            // The SDK expects { inlineData: { data: '...', mimeType: '...' } }

            const base64String = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64String,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
