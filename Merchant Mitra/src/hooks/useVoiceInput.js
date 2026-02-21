import { useState, useEffect, useCallback, useRef } from 'react';

const useVoiceInput = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState('');
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check for SpeechRecognition support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            console.warn('Speech Recognition API is not supported in this browser.');
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsListening(false);
    }, []);

    const startListening = useCallback((langCode = 'en-IN') => {
        console.log('Starting voice input with language:', langCode);

        if (!supported) {
            const errorMsg = 'Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.';
            setError(errorMsg);
            console.error(errorMsg);
            return;
        }

        // Stop any existing recognition
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Clear previous transcript to ensure useEffect triggers on new input
        setTranscript('');
        setError('');

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = langCode;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('Speech recognition started');
                setIsListening(true);
                setError('');
            };

            recognition.onend = () => {
                console.log('Speech recognition ended');
                setIsListening(false);
                recognitionRef.current = null;
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error, event.message);
                let errorMessage = 'Could not hear you. Please try again.';

                switch (event.error) {
                    case 'no-speech':
                        errorMessage = 'No speech detected. Please try again.';
                        break;
                    case 'audio-capture':
                        errorMessage = 'Microphone not found. Please check your microphone.';
                        break;
                    case 'not-allowed':
                        errorMessage = 'Microphone access denied. Please allow microphone access.';
                        break;
                    case 'network':
                        errorMessage = 'Network error. Please check your connection.';
                        break;
                    case 'aborted':
                        errorMessage = 'Speech recognition was aborted.';
                        break;
                    default:
                        errorMessage = `Speech error: ${event.error}`;
                }

                setError(errorMessage);
                setIsListening(false);
                recognitionRef.current = null;
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                const confidence = event.results[0][0].confidence;
                console.log('Speech recognized:', text, 'Confidence:', confidence);
                setTranscript(text);
                processResult(text);
            };

            recognition.start();
            console.log('Recognition.start() called');
        } catch (err) {
            console.error('Speech recognition initialization error:', err);
            setError('Failed to start voice input. Please try again.');
            setIsListening(false);
            recognitionRef.current = null;
        }
    }, [supported]);

    // Simple natural language parsing for transactions
    // "500 rupees from Rahul for Rice" -> { amount: 500, name: "Rahul", note: "Rice", type: "SALE" }
    // "Paid 200 for Petrol" -> { amount: 200, name: "", note: "Petrol", type: "EXPENSE" }
    const processResult = (text) => {
        const lowerText = text.toLowerCase();
        let amount = null;
        let name = '';
        let note = '';
        let type = 'SALE';

        // Extract Amount (searches for numbers)
        const amountMatch = text.match(/[\d,]+/);
        if (amountMatch) {
            amount = parseFloat(amountMatch[0].replace(/,/g, ''));
        }

        // Determine Type
        if (lowerText.includes('paid') || lowerText.includes('expense') || lowerText.includes('spent') || lowerText.includes('given to')) {
            type = 'EXPENSE';
        } else if (lowerText.includes('udhaar') || lowerText.includes('credit')) {
            if (lowerText.includes('given')) {
                type = 'UDHAAR_GIVEN';
            } else if (lowerText.includes('received') || lowerText.includes('back')) {
                type = 'UDHAAR_RECEIVED';
            }
        }

        // Extract Name (simple heuristic: words after 'from' or 'to')
        if (lowerText.includes('from')) {
            const parts = text.split(/from/i);
            if (parts.length > 1) {
                // Take the immediate next few words as name, stop at 'for'
                let namePart = parts[1].trim();
                if (namePart.toLowerCase().includes(' for ')) {
                    namePart = namePart.split(/ for /i)[0];
                }
                name = capitalizeFirstLetter(namePart).replace(/[^\w\s]/gi, '');
            }
        }

        // Extract Note (words after 'for')
        if (lowerText.includes('for')) {
            const parts = text.split(/for/i);
            if (parts.length > 1) {
                note = parts[1].trim();
            }
        }

        // Return parsed data structure
        return {
            originalText: text,
            parsed: {
                amount,
                customerName: name,
                note: note || text, // Fallback note to full text if no specific note found
                type
            }
        };
    };

    const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        parseVoiceCommand: processResult,
        isSupported: supported
    };
};

export default useVoiceInput;
