import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { GEMINI_MODEL_TEXT, SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini
// Note: In a production environment, ensure API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Define Tools for Smart Home Control
const setLightStateTool: FunctionDeclaration = {
  name: "setLightState",
  description: "Turns a smart light on or off based on room or device name.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      deviceName: { type: Type.STRING, description: "The name of the light or room." },
      state: { type: Type.BOOLEAN, description: "True for ON, False for OFF." },
    },
    required: ["deviceName", "state"],
  },
};

const setThermostatTool: FunctionDeclaration = {
  name: "setThermostat",
  description: "Sets the temperature for the smart thermostat.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      temperature: { type: Type.NUMBER, description: "Target temperature in Fahrenheit." },
    },
    required: ["temperature"],
  },
};

const smartHomeTools: Tool[] = [
  { functionDeclarations: [setLightStateTool, setThermostatTool] },
];

export const sendMessageToNeuna = async (
  message: string | null, 
  history: any[], 
  imagePart?: { inlineData: { data: string; mimeType: string } },
  audioPart?: { inlineData: { data: string; mimeType: string } },
  onToolCall?: (toolCall: any) => Promise<any>,
  customSystemInstruction?: string
) => {
  try {
    const modelId = GEMINI_MODEL_TEXT;
    
    // Construct content parts
    const parts: any[] = [];
    
    // Priority: Audio > Image > Text
    if (audioPart) {
      parts.push(audioPart);
    }
    if (imagePart) {
      parts.push(imagePart);
    }
    if (message) {
      parts.push({ text: message });
    }

    // If we have audio but no text, we need to ensure the model knows to respond to the audio
    if (audioPart && !message) {
      parts.push({ text: "Respond to this audio input in character." });
    }

    const config: any = {
      systemInstruction: customSystemInstruction || SYSTEM_INSTRUCTION,
    };

    // Tools are usually text-based, keep them for text/image queries
    if (!imagePart && !audioPart) {
      config.tools = smartHomeTools;
    }
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: config
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("No response from Neuna.");

    const content = candidates[0].content;
    const textPart = content.parts.find(p => p.text);
    const functionCallPart = content.parts.find(p => p.functionCall);
    const groundingMetadata = candidates[0].groundingMetadata;

    // Handle Tool Calls (Smart Home)
    if (functionCallPart && onToolCall) {
       const functionCall = functionCallPart.functionCall;
       const toolResult = await onToolCall(functionCall);
       
       const secondResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: [
           { role: 'user', parts: [{ text: message || "Perform tool action" }] },
           { role: 'model', parts: [functionCallPart] },
           { 
             role: 'user', 
             parts: [{ 
               functionResponse: {
                 name: functionCall.name,
                 response: { result: toolResult }
               } 
             }] 
           }
         ],
         config: { systemInstruction: SYSTEM_INSTRUCTION }
       });
       
       return {
         text: secondResponse.text,
         grounding: secondResponse.candidates?.[0]?.groundingMetadata
       };
    }

    return {
      text: textPart ? textPart.text : "Task completed silently.",
      grounding: groundingMetadata
    };

  } catch (error) {
    console.error("Neuna Service Error:", error);
    return { text: "I encountered an error processing that request. My sensors might be glitching." };
  }
};

export const generateStudyNotes = async (topic: string) => {
  try {
    const prompt = `
      Create detailed, colorful, and formatted study notes on the topic: "${topic}".
      
      Output Rules:
      1. Return ONLY pure HTML code inside a <div> wrapper. Do not include markdown backticks or \`<html>\` tags.
      2. Use Tailwind CSS classes for styling.
      3. Theme: Dark mode compatible (text-gray-200, bg-transparent).
      4. Use colors: text-blue-400 for main headers, text-purple-400 for subheaders, text-pink-400 for keywords.
      5. Structure:
         - Title
         - Executive Summary
         - Key Concepts (Use bullet points with custom markers if possible)
         - Detailed Breakdown
         - A "Flowchart" or "Process Diagram" section: 
           * Create a visual representation using HTML <div> boxes with borders (border-blue-500), background colors (bg-blue-500/10), and rounded corners.
           * Connect them visually with arrow characters (↓ or →) or lines using styled divs.
           * Make it look like a chart, not just a list.
      6. Make it look professional yet aesthetic like a "Jarvis" interface data dump.
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: { parts: [{ text: prompt }] },
      config: {
        systemInstruction: "You are an advanced data synthesis AI capable of generating structured HTML study materials.",
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Failed to generate notes.");
    
    let cleanHtml = text.replace(/```html/g, '').replace(/```/g, '');
    return cleanHtml;

  } catch (error) {
    console.error("Notes Generation Error:", error);
    return "<p class='text-red-500'>Error generating notes. Please try again.</p>";
  }
};

export const fetchWeather = async (lat: number, lon: number) => {
  try {
    const prompt = `
      Perform a Google Search to find the current real-time weather for coordinates ${lat}, ${lon}.
      
      Once you have the data, output it strictly as a JSON object inside a code block.
      The JSON object must have these exact keys:
      {
        "location": "City, Country",
        "countryCode": "The 2-letter ISO Country Code (e.g. US, IN, JP)",
        "tempC": "Temperature in Celsius (number only, e.g. 22)",
        "tempF": "Temperature in Fahrenheit (number only, e.g. 72)",
        "condition": "Short description (e.g. Partly Cloudy)",
        "humidity": "Percentage (e.g. 45%)",
        "windSpeed": "Speed (e.g. 12 mph NW)",
        "coordinates": "${lat.toFixed(4)}, ${lon.toFixed(4)}",
        "forecast": "A short 1-sentence forecast for the rest of the day."
      }
      
      Do not include any conversational text outside the JSON block.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    // Extract URLs from grounding metadata
    const sources = groundingChunks
      .map((chunk: any) => chunk.web?.uri)
      .filter((uri: string) => uri);

    const uniqueSources = [...new Set(sources)];

    // Parse the JSON from the markdown response
    let weatherData = null;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        // If match group 1 exists (from code block), use it, otherwise use the whole match
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        weatherData = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse weather JSON", e);
      }
    }

    return {
      data: weatherData,
      rawText: text, // Fallback
      sources: uniqueSources
    };

  } catch (error) {
    console.error("Weather Fetch Error:", error);
    throw error;
  }
};