import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { GEMINI_MODEL_TEXT, SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini
// Note: In a production environment, ensure API_KEY is set.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
  // Adding Google Search for Information Retrieval
  { googleSearch: {} }
];

export const sendMessageToNeuna = async (
  message: string, 
  history: any[], 
  imagePart?: { inlineData: { data: string; mimeType: string } },
  onToolCall?: (toolCall: any) => Promise<any>
) => {
  try {
    const modelId = imagePart ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
    
    // Construct content parts
    const parts: any[] = [];
    if (imagePart) {
      parts.push(imagePart);
    }
    parts.push({ text: message });

    // Config: Only attach tools if NOT using vision model, 
    // as gemini-2.5-flash-image does not support function calling/tools in this context.
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (!imagePart) {
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

    // Handle Tool Calls (Smart Home) - Only possible if we sent tools
    if (functionCallPart && onToolCall) {
       const functionCall = functionCallPart.functionCall;
       const toolResult = await onToolCall(functionCall);
       
       // Send result back to model to get final spoken response
       // Note: We use the text model for the follow-up since the context is now text-based logic
       const secondResponse = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: [
           { role: 'user', parts: [{ text: message }] },
           { role: 'model', parts: [functionCallPart] }, // Original model call
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
    // Return a user-friendly error message that the UI can display
    return { text: "I encountered an error processing that request. My vision sensors might be incompatible with my toolset." };
  }
};