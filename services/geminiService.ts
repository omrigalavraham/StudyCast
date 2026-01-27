import { GoogleGenAI, Modality } from "@google/genai";
import { SummaryData, ProcessingMode, ScriptLine } from "../types";

const PRICING = {
  'gemini-3-flash-preview': { input: 0.30, output: 2.50 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'audio-generation': { per_min: 0.06 }
};

const logTokenUsage = (label: string, model: string, usage: any) => {
  if (!usage) return;
  const input = usage.promptTokenCount || 0;
  const output = usage.candidatesTokenCount || 0;

  const pricingConfig = PRICING[model as keyof typeof PRICING];
  const price = (pricingConfig && 'input' in pricingConfig)
    ? pricingConfig
    : { input: 0, output: 0 };

  const costUSD = ((input / 1_000_000) * price.input) + ((output / 1_000_000) * price.output);
  const costNIS = costUSD * 3.6;

  console.group(`💰 Real Cost Check: ${label}`);
  console.log(`Model: ${model}`);
  console.log(`Input Tokens: ${input.toLocaleString()}`);
  console.log(`Output Tokens: ${output.toLocaleString()}`);
  console.log(`Total Tokens: ${(input + output).toLocaleString()}`);
  console.log(`%cCost: $${costUSD.toFixed(6)} / ₪${costNIS.toFixed(4)}`, 'color: lime; font-weight: bold; font-size: 12px');
  console.groupEnd();
};

/**
 * Step 1: Analyze the presentation and generate a Summary AND a Script.
 */
export const analyzePresentation = async (
  apiKey: string,
  base64Data: string,
  mimeType: string,
  mode: ProcessingMode,
  userName?: string,
  userGender?: 'male' | 'female' | null
): Promise<SummaryData> => {
  // Determine the student name and host based on gender
  const studentName = userName || 'סטודנט';
  // If user is male, they talk with a female host. If female, with male host.
  const hostName = userGender === 'female' ? 'דניאל' : 'נועה';
  const hostGenderHe = userGender === 'female' ? 'הוא' : 'היא';

  // Initialize client with user's key
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  let specificInstructions = "";

  if (mode === 'FULL_LECTURE') {
    specificInstructions = `
    המצגת הזו היא **הרצאה גולמית** (Raw Slides).
    1. קרא את כל השקפים, זהה מושגים, תהליכים ודוגמאות.
    2. השלם פערים לוגיים שהמרצה היה אומר בעל פה.
    3. בנה סיכום מקיף מאוד שנוגע בכל הנקודות הקריטיות למבחן.
    `;
  } else {
    specificInstructions = `
    המצגת הזו היא כבר **סיכום מוכן**.
    1. שמור על המבנה המקורי של הסיכום.
    2. וודא שכל הנקודות שהסטודנט כתב מופיעות בצורה ברורה.
    `;
  }

  const prompt = `
  תפקידך הוא להיות מורה פרטי ברמה עולמית ועורך תוכן פדגוגי.
  ${specificInstructions}

  המשימה שלך היא ליצור שני דברים שמקושרים זה לזה בקשר הדוק:
  1. "summaryPoints": רשימה של כרטיסיות ידע (Concepts). עליך לפרק את החומר לנקודות מפתח ברורות.
  2. "script": תסריט לפודקאסט לימודי בין "${studentName}" (הסטודנט${userGender === 'female' ? 'ית' : ''}) ו"${hostName}" (המנח${userGender === 'female' ? 'ה' : 'ה'} שמסביר${userGender === 'female' ? '' : 'ה'}).

  **חשוב מאוד - התאמת מגדר:**
  - ${studentName} הוא ${userGender === 'female' ? 'נקבה' : 'זכר'}. השתמש בפניות מתאימות (${userGender === 'female' ? 'את, לך, שלך' : 'אתה, לך, שלך'}).
  - ${hostName} הוא ${userGender === 'female' ? 'זכר' : 'נקבה'}. השתמש בפניות מתאימות.

  חוקים קריטיים לתסריט (Script Rules):
  1. **כיסוי מלא (Total Coverage):** עליך לעבור על רשימת ה-"summaryPoints" שיצרת **אחת אחרי השנייה**. אסור לדלג על שום נקודה! הפודקאסט חייב ללמד את הכל.
  2. **מבנה השיחה:**
     - התחל בפתיח קצר (${hostName} פונה ל${studentName} בשמו/ה).
     - עבור נקודה-נקודה: ${studentName} שואל${userGender === 'female' ? 'ת' : ''} או מציג${userGender === 'female' ? 'ה' : ''} נושא, ו${hostName} מסביר${userGender === 'female' ? '' : 'ה'} (או להפך).
     - וודא שהם מזכירים את המושגים בשמם.
  3. **קישוריות (Linking):** לכל שורת דיאלוג, עליך לציין לאיזה אינדקס ב-"summaryPoints" היא מתייחסת (שדה relatedPointIndex).
     - אם הם מדברים על הנקודה הראשונה, relatedPointIndex = 0.
     - אם הם מדברים על הנקודה השניה, relatedPointIndex = 1.
     - אם זה סמול-טוק או מעבר, relatedPointIndex = -1.

  פורמט JSON חובה:
  {
    "summary": "פתיח קצר (2-3 משפטים) שנותן את ה-Big Picture.",
    "summaryPoints": [
      { "point": "שם המושג", "details": "הסבר מפורט ומעמיק..." }
    ],
    "script": [
      {
        "speaker": "${hostName}",
        "text": "היי ${studentName}, ${userGender === 'female' ? 'מוכנה' : 'מוכן'} ללמוד על...",
        "relatedPointIndex": -1
      },
      {
        "speaker": "${studentName}",
        "text": "כן בטח! ${userGender === 'female' ? 'בואי' : 'בוא'} נתחיל עם המושג הראשון...",
        "relatedPointIndex": 0
      }
    ]
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    // @ts-ignore - Usage metadata might be missing in type definitions but present in response
    logTokenUsage("Analyze Presentation", modelId, response.usageMetadata);

    const jsonResponse = JSON.parse(response.text || "{}");

    if (!jsonResponse.script || !Array.isArray(jsonResponse.script)) {
      throw new Error("Invalid response structure from Gemini");
    }

    return {
      summary: jsonResponse.summary || "סיכום זמין",
      summaryPoints: jsonResponse.summaryPoints || [],
      script: jsonResponse.script,
    };
  } catch (error) {
    console.error("Error analyzing presentation:", error);
    throw error;
  }
};

/**
 * Step 2: Generate Audio from the Structured Script
 */
// Helper to merge base64 audio chunks (assuming simplified concatenation works for raw PCM/WAV parts or we handle it properly)
// Since the API returns WAV/MP3, simple concatenation might corrupt headers.
// Ideally we should strip headers if they exist, or rely on raw PCM.
// For this implementation, we will assume the API returns linear PCM or we accept the slight glitch at join points if WAV headers are present.
// Better approach: decoding to AudioBuffer in browser. But we are in "backend" logic here (simulated).
// REAL SOLUTION: We will just concatenate the base64 strings if the format allows, or better:
// We will return the script with timestamps, but we still need one big audio file for the player.
// Let's try to concatenate. If it's a standard container format it might need FFmpeg (too heavy).
// WE WILL USE A TRICK: The App.tsx audio player converts base64 to Blob.
// If we send a LIST of audio chunks to the frontend? No, the player expects one string.
// Let's assume for now we concatenate and hope the browser player handles the stream or we stick to raw PCM if possible.
// Wait, the previous implementation used `createWavUrl`.
// Let's try to simply concatenate the base64 data.

// Helper to calculate exact duration from LINEAR16 PCM (24kHz, 16-bit, Mono)
// 1 sample = 16 bits = 2 bytes.
// Sample Rate = 24000 samples/sec.
// Byte Rate = 24000 * 2 = 48000 bytes/sec.
// Base64 expands binary by 4/3 (~1.33x).
// Duration = (Base64Length * 0.75) / 48000.
// Simplified: Duration = Base64Length / 64000.
const calculateDurationFromPCMBase64 = (base64Len: number) => {
  // We use the exact byte rate for 24kHz 16-bit Mono
  return (base64Len * 0.75) / 48000;
};

// Helper to encode Uint8Array to Base64 (handles binary data correctly)
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid call stack issues
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, Math.min(i + CHUNK_SIZE, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
};

const concatenateBase64 = (base64Parts: string[]): string => {
  if (base64Parts.length === 0) return '';

  // 1. Decode all parts to Uint8Array
  const arrays = base64Parts.map(b64 => {
    // Remove any whitespace just in case
    const cleanB64 = b64.replace(/\s/g, '');
    const bin = atob(cleanB64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  });

  // 2. Calculate total length
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);

  // 3. Merge
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  // 4. Encode back to Base64 properly
  return uint8ArrayToBase64(result);
};

/**
 * Step 2: Generate Audio from the Structured Script (Piecewise for Sync)
 */
export const generatePodcastAudio = async (
  apiKey: string,
  scriptLines: ScriptLine[],
  userName?: string,
  userGender?: 'male' | 'female' | null
): Promise<{ audioBase64: string, uniqueScript: ScriptLine[] }> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash-preview-tts";

  // Determine names and voices based on user gender
  const studentName = userName || 'סטודנט';
  const hostName = userGender === 'female' ? 'דניאל' : 'נועה';

  // Voice selection:
  // - Male voices: Fenrir, Puck, Charon, Kore (Kore can sound neutral)
  // - Female voices: Kore, Aoede, Leda
  // Student gets voice matching their gender, host gets opposite
  const studentVoice = userGender === 'female' ? 'Kore' : 'Fenrir';   // Female student = female voice, Male student = male voice
  const hostVoice = userGender === 'female' ? 'Fenrir' : 'Kore';       // Female student gets male host, Male student gets female host

  let currentTimeOffset = 0;
  const uniqueScript: ScriptLine[] = [];

  // Helper for delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Detect speaker names from the script (first two unique speakers)
  const speakersInScript = [...new Set(scriptLines.map(l => l.speaker).filter(Boolean))];
  const scriptStudentName = speakersInScript.find(s => s === studentName) || speakersInScript[0] || studentName;
  const scriptHostName = speakersInScript.find(s => s === hostName) || speakersInScript.find(s => s !== scriptStudentName) || hostName;

  // Helper to process a single line with retry logic
  const processLine = async (line: ScriptLine, index: number, retryCount = 0): Promise<{ audioChunk: string | null, updatedLine: ScriptLine, duration: number }> => {
    if (!line.text || line.text.trim().length === 0) {
      return { audioChunk: null, updatedLine: line, duration: 0 };
    }

    // Determine if this is the student or host speaking
    // Match against actual names in script OR known host names (נועה/דניאל)
    const knownHostNames = ['נועה', 'דניאל'];
    const isHost = line.speaker === scriptHostName || knownHostNames.includes(line.speaker);
    const isStudent = !isHost;
    const voice = isStudent ? studentVoice : hostVoice;

    const prompt = `Speaker '${isStudent ? 'Student' : 'Host'}' says: "${line.text}"`;
    const MAX_RETRIES = 3;

    try {
      const requestConfig: any = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        },
        audioEncoding: "LINEAR16",
        sampleRateHertz: 24000
      };

      const response = await ai.models.generateContent({
        model: modelId,
        contents: [{ parts: [{ text: prompt }] }],
        config: requestConfig
      });

      // @ts-ignore
      logTokenUsage(`Podcast Segment #${index}`, modelId, response.usageMetadata);

      const chunkBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (chunkBase64) {
        const duration = calculateDurationFromPCMBase64(chunkBase64.length);
        return {
          audioChunk: chunkBase64,
          updatedLine: { ...line }, // Timeline update happens later to enforce order
          duration
        };
      }
    } catch (err: any) {
      // Retry on rate limit (429) with exponential backoff
      if (err?.status === 429 || err?.message?.includes('429')) {
        if (retryCount < MAX_RETRIES) {
          const waitTime = Math.pow(2, retryCount) * 1000 + Math.random() * 1000; // 1s, 2s, 4s + jitter
          console.log(`Rate limited on line ${index}, retrying in ${Math.round(waitTime)}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await delay(waitTime);
          return processLine(line, index, retryCount + 1);
        }
      }
      console.error(`Error generating audio for line ${index}:`, err);
    }

    return { audioChunk: null, updatedLine: line, duration: 0 };
  };

  // Process sequentially (one at a time) to avoid Rate Limits on Gemini TTS
  const DELAY_BETWEEN_REQUESTS = 800; // Wait 800ms between each request
  const results: { audioChunk: string | null, updatedLine: ScriptLine, duration: number }[] = [];

  for (let i = 0; i < scriptLines.length; i++) {
    const result = await processLine(scriptLines[i], i);
    results.push(result);

    // Add delay between requests to avoid rate limiting
    if (i < scriptLines.length - 1) {
      await delay(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Reconstruct in order
  const orderedChunks: string[] = [];

  for (const res of results) {
    if (res.audioChunk) {
      res.updatedLine.startTime = currentTimeOffset;
      res.updatedLine.endTime = currentTimeOffset + res.duration;

      uniqueScript.push(res.updatedLine);
      orderedChunks.push(res.audioChunk);
      currentTimeOffset += res.duration;
    } else {
      uniqueScript.push(res.updatedLine);
    }
  }

  // Stitch the audio chunks properly
  const audioBase64 = concatenateBase64(orderedChunks);

  return { audioBase64, uniqueScript };
};

/**
 * Step 3: Chat with the Lecture Context
 */
export const chatWithLecture = async (
  apiKey: string,
  context: { summary: string, summaryPoints: { point: string, details: string }[] },
  history: { role: 'user' | 'ai', content: string }[],
  question: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-3-flash-preview";

  const contextString = `
   Summary: ${context.summary}
   
   Key Concepts:
   ${context.summaryPoints.map(p => `- ${p.point}: ${p.details}`).join('\n')}
   `;

  const prompt = `
   You are an AI teaching assistant for a student.
   Context of the lecture:
   ${contextString}

   User Question: "${question}"

   Instructions:
   1. Answer the question based on the provided context.
   2. If the answer is found in the context, explain it clearly and simply.
   3. If the answer is NOT in the context:
      - Explicitly state: "זה לא מופיע במצגת, אבל..." (This is not in the presentation, but...).
      - Then provide a correct, general answer to the question using your general knowledge.
   
   Tone: Helpful, encouraging, and educational.
   Language: Hebrew (Ivrit).
   `;

  // We can include history in future iterations for multi-turn context
  // For now, we rely on the single turn with full context

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [{ parts: [{ text: prompt }] }]
    });

    // @ts-ignore
    logTokenUsage("Chat Message", modelId, response.usageMetadata);

    return response.candidates?.[0]?.content?.parts?.[0]?.text || "מצטער, לא הצלחתי לענות על השאלה.";
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
};

/**
 * Step 4: Generate a Quiz from the Lecture Context
 */
import { QuizQuestion, QuizSettings } from "../types";

export const generateQuiz = async (
  apiKey: string,
  context: { summary: string, summaryPoints: { point: string, details: string }[] },
  settings: QuizSettings
): Promise<QuizQuestion[]> => {
  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.0-flash"; // Using the fast model as requested

  const contextString = `
   Summary: ${context.summary}
   
   Key Concepts:
   ${context.summaryPoints.map(p => `- ${p.point}: ${p.details}`).join('\n')}
   `;

  let difficultyInstruction = "";
  if (settings.difficulty === 'EASY') {
    difficultyInstruction = "Focus on basic definitions and simple recall.";
  } else if (settings.difficulty === 'MEDIUM') {
    difficultyInstruction = "Focus on connecting concepts and understanding relationships.";
  } else {
    difficultyInstruction = "Focus on application, scenarios, and 'what if' questions.";
  }

  const prompt = `
   You are an expert exam writer.
   Based on the provided lecture context, generate a Multiple Choice Quiz (MCQ).

   Context:
   ${contextString}

   Requirements:
   1. Generate exactly ${settings.questionCount} questions.
   2. Difficulty Level: ${settings.difficulty}. ${difficultyInstruction}
   3. Language: Hebrew (Ivrit).
   4. Format: JSON Array ONLY.
   5. Each question must be based on one of the Key Concepts listed above.
   6. Each question must have:
      - "text": The question string.
      - "options": Array of 4 strings.
      - "correctOptionIndex": 0-3 (The index of the correct answer).
      - "explanation": A short explanation (in Hebrew) of why the correct answer is correct.
      - "conceptIndex": The 0-based index of the Key Concept this question tests (0 for first concept, 1 for second, etc.)

   JSON Output Structure:
   [
     {
       "id": "q1",
       "text": "...",
       "options": ["...", "...", "...", "..."],
       "correctOptionIndex": 0,
       "explanation": "...",
       "conceptIndex": 0
     }
     ...
   ]
   `;

  try {
    const response = await ai.models.generateContent({
      model: modelId, // Ensure this model is available or fallback to a known one
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    // @ts-ignore
    logTokenUsage("Generate Quiz", modelId, response.usageMetadata);

    const jsonResponse = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || "[]");

    // Validate / Map IDs
    return jsonResponse.map((q: any, idx: number) => ({
      id: `q-${Date.now()}-${idx}`,
      text: q.text,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      conceptIndex: typeof q.conceptIndex === 'number' ? q.conceptIndex : 0
    }));

  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
};