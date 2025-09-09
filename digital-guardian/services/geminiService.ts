import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { URLSafetyReport, ImageAnalysisReport, VideoAnalysisReport, ChatMessage, PdfAnalysisReport } from '../types';
import { SafetyLevel } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const urlResponseSchema = {
  type: Type.OBJECT,
  properties: {
    safetyLevel: { type: Type.STRING, enum: Object.values(SafetyLevel) },
    summary: { type: Type.STRING },
    threats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["type", "description"]
      }
    },
    trustScore: { type: Type.INTEGER, description: "A score from 0 (very untrustworthy) to 100 (very trustworthy)." },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of 3-4 key findings."}
  },
  required: ["safetyLevel", "summary", "threats", "trustScore", "keyPoints"]
};

const imageResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the findings." },
        deepfakeConfidence: { type: Type.NUMBER, description: "A confidence score (0-100) on whether the image is a deepfake." },
        aiGeneratedConfidence: { type: Type.NUMBER, description: "A confidence score (0-100) on whether the image is AI-generated." },
        manipulationSigns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of observed manipulation signs (e.g., 'Unnatural lighting', 'Distorted background')."},
        trustScore: { type: Type.INTEGER, description: "A score from 0 (likely manipulated) to 100 (likely authentic)." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of 3-4 key findings about the image's authenticity."},
        visualCues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "A brief text description of what is suspicious about this area." },
                    area: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: "A bounding box for the suspicious area, represented as [topLeftX, topLeftY, width, height]. All values are percentages (0-100) relative to the image dimensions."
                    }
                },
                required: ["description", "area"]
            },
            description: "A list of specific areas on the image that show signs of manipulation. Return an empty array if none are found."
        }
    },
    required: ["summary", "deepfakeConfidence", "aiGeneratedConfidence", "manipulationSigns", "trustScore", "keyPoints", "visualCues"]
};

const videoResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the video analysis findings." },
        deepfakeConfidence: { type: Type.NUMBER, description: "A confidence score (0-100) on whether the video content is a deepfake." },
        manipulationSigns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of observed visual manipulation signs (e.g., 'Unnatural facial movements', 'Blurry artifacts around edges')."},
        trustScore: { type: Type.INTEGER, description: "An overall score from 0 (likely manipulated) to 100 (likely authentic)." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of 3-4 key findings about the video's authenticity."},
        audioAnalysisSummary: { type: Type.STRING, description: "A summary of the audio track analysis, noting any signs of tampering, mismatched lip sync, or synthetic speech. Since you can't hear audio, base this on visual cues like lip sync." },
        temporalInconsistencies: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of inconsistencies observed over time in the video (e.g., 'Objects disappearing', 'Inconsistent lighting changes between frames')."},
        visualCues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "A brief text description of what is suspicious about this area." },
                    timestamp: { type: Type.NUMBER, description: "The approximate timestamp in seconds where the suspicious event occurs, inferred from the frame sequence." },
                    area: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: "A bounding box for the suspicious area, represented as [topLeftX, topLeftY, width, height]. All values are percentages (0-100) relative to the video frame dimensions."
                    }
                },
                required: ["description", "timestamp", "area"]
            },
            description: "A list of specific areas in the video that show signs of manipulation. Return an empty array if none are found."
        }
    },
    required: ["summary", "deepfakeConfidence", "manipulationSigns", "trustScore", "keyPoints", "audioAnalysisSummary", "temporalInconsistencies", "visualCues"]
};

const pdfCombinedResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "A brief summary of the PDF analysis findings, starting with a clear conclusion." },
        trustScore: { type: Type.INTEGER, description: "An overall score from 0 (likely malicious) to 100 (likely safe)." },
        detectedLinks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    url: { type: Type.STRING },
                    risk: { type: Type.STRING, enum: ['High', 'Medium', 'Low', 'Unknown'] }
                },
                required: ["url", "risk"]
            },
            description: "A list of all URLs found in the PDF and their assessed risk level."
        },
        malwareIndicators: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of observed signs of potential malware (e.g., 'Obfuscated scripts')."},
        socialEngineeringTactics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of observed psychological manipulation tactics (e.g., 'Urgent language', 'Impersonation')." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A bulleted list of 3-4 key findings about the PDF's safety."},
        visualCues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: "A brief text description of what is suspicious about this visual element." },
                    page: { type: Type.INTEGER, description: "The page number where the suspicious element appears." },
                    area: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: "A bounding box for the suspicious area, represented as [topLeftX, topLeftY, width, height]. All values are percentages (0-100) relative to the page dimensions."
                    }
                },
                required: ["description", "page", "area"]
            },
            description: "A list of specific visual elements in the PDF that appear suspicious. Return an empty array if none are found."
        }
    },
    required: ["summary", "trustScore", "detectedLinks", "malwareIndicators", "socialEngineeringTactics", "keyPoints", "visualCues"]
};


export async function analyzeUrl(url: string, language: string): Promise<URLSafetyReport> {
  const prompt = `Act as a senior cybersecurity analyst. Analyze the URL: ${url}. Check for phishing, malware, domain reputation, SSL, and other risks. Provide a JSON response based on the schema. The summary should be particularly clear and educational for a non-technical user, avoiding jargon and explaining the 'why' behind the safety assessment. The keyPoints should be actionable advice or critical warnings. IMPORTANT: Only populate the 'threats' array if you identify a specific, credible threat. If the URL is safe regarding a certain category (e.g., phishing), do not add an entry to the 'threats' array for it. The 'threats' array must be empty if no threats are found. Your entire response MUST be in this language: ${language}.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: urlResponseSchema }
    });
    const parsedData = JSON.parse(response.text.trim()) as URLSafetyReport;
    if (!parsedData.safetyLevel || !parsedData.summary) throw new Error("Invalid AI response structure.");
    return parsedData;
  } catch (error) {
    console.error("Error analyzing URL with Gemini:", error);
    throw new Error("Failed to get a valid analysis from the AI service.");
  }
}

async function analyzeImageMultiModel(
    imageDataBase64: string,
    mimeType: string,
    language: string,
    onProgress: (message: string) => void
): Promise<ImageAnalysisReport> {
    onProgress('Initiating enhanced multi-model analysis...');

    const baseInstruction = `You MUST provide a JSON response based on the schema. For each identified area of concern, you MUST provide a bounding box and a brief description in the 'visualCues' array. Bounding box coordinates (topLeftX, topLeftY, width, height) MUST be percentages (0-100). If no suspicious areas are found, return an empty 'visualCues' array. Your entire response, including all text descriptions, MUST be in this language: ${language}.`;

    const forensicPrompt = `Act as a world-class digital image forensics expert with a highly skeptical eye. Your primary directive is to find any evidence of digital alteration. Analyze this image with extreme scrutiny for signs of manipulation, deepfakes, or AI generation. Assume it could be altered and look for proof. Focus on:
- **Light & Shadow Physics:** Are there multiple light sources that don't make sense? Do shadows fall correctly? Look at reflections in eyes and on surfaces like glasses. Are they consistent with the environment?
- **Anatomy & Physics:** Are there subtle anatomical impossibilities (e.g., strange hands, ears, teeth)? Is hair behaving naturally?
- **Texture & Focus:** Examine skin texture, fabric weaves, and background details. Look for unnatural smoothness, repetitive patterns, or areas that are inexplicably in or out of focus.
- **AI Artifacts:** Hunt for tell-tale signs like waxy skin, overly perfect symmetry, distorted backgrounds, or garbled text.
- **Bounding Box Precision:** The bounding box MUST be as tight as possible around the visual anomaly. This box will be used to draw a highlighting ellipse, so its accuracy is paramount.
${baseInstruction} If you find nothing, your trust score should still be cautious, not 100%, and you should explain why some elements appear 'too perfect'.`;

    const provenancePrompt = `Act as an AI image historian and provenance analyst. Your task is to determine if this image was created by a known AI model. Analyze its stylistic and compositional elements. Does it have the 'fingerprint' of a generator like Midjourney, DALL-E, or Stable Diffusion? Consider:
- **Stylistic Tropes:** Does it feature common AI art themes (e.g., hyper-realism mixed with fantasy elements)? Is the color palette, composition, or lighting style characteristic of a particular AI model?
- **Uncanny Valley:** Are there elements that are almost perfect but feel subtly 'off'? This includes eyes that don't quite focus, expressions that are slightly unnatural, or poses that a human wouldn't hold.
- **Contextual Clues:** Does the scene depicted make logical sense? AI often creates scenes that are visually plausible but contextually bizarre.
${baseInstruction} Your analysis is crucial for determining if the image's origin is synthetic. Highlight any stylistic choices that are common AI indicators in 'manipulationSigns'.`;
    
    const integrityPrompt = `Act as a data integrity analyst. Disregard the image content and focus solely on the underlying digital data. Analyze for evidence of software tampering. Your task is to find non-visual clues. Look for:
- **Compression Anomalies:** Are there parts of the image with different compression levels, suggesting splicing (Error Level Analysis)?
- **Noise Inconsistencies:** Is the digital noise pattern uniform across the image? Inconsistencies can reveal areas that have been added or altered.
- **Metadata Clues:** Examine the EXIF data (or lack thereof). Does it contain traces of editing software like Photoshop, or is it suspiciously clean?
${baseInstruction} Your goal is to find purely technical evidence of tampering. Report your findings in the 'manipulationSigns' and 'summary' fields. A lack of metadata or unusual compression should lower the trust score.`;

    const imagePart = { inlineData: { data: imageDataBase64, mimeType } };

    const generate = (prompt: string) => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: imageResponseSchema }
    });

    try {
        onProgress('Dispatching to specialist AIs...');
        const forensicPromise = generate(forensicPrompt);
        const provenancePromise = generate(provenancePrompt);
        const integrityPromise = generate(integrityPrompt);

        onProgress('Analyzing Forensic, Provenance, and Integrity data...');
        const responses = await Promise.all([forensicPromise, provenancePromise, integrityPromise]);
        
        onProgress('Synthesizing specialist reports with Lead Analyst AI...');

        const specialistReportsJson = responses.map(res => res.text.trim());
        
        const leadAnalystPrompt = `Act as a Lead Digital Forensics Analyst. You have received three JSON reports from your specialist AIs: a Forensics Expert, a Provenance Expert, and a Data Integrity Expert. Your job is to synthesize their findings into a single, conclusive report in JSON format.
- **Synthesize Summaries:** Create a clear, insightful summary for a non-technical user. Start with a definitive statement about the image's likely authenticity (e.g., "This image shows strong evidence of AI generation," or "This image appears to be an authentic photograph."). Then, elaborate on the combined evidence from your specialists that led to this conclusion.
- **Resolve Conflicts:** If specialists disagree, use your judgment to make a final determination.
- **Prioritize Threats:** The final trust score MUST be the LOWEST score provided by any specialist. One red flag outweighs multiple green flags.
- **Aggregate Evidence:** Combine all unique 'manipulationSigns', 'keyPoints', and 'visualCues' from the specialist reports. Do not duplicate findings.
- **Final Confidence:** The final 'deepfakeConfidence' and 'aiGeneratedConfidence' MUST be the HIGHEST scores from any specialist.
- **Output:** Your final output MUST be a single JSON object that strictly adheres to the provided schema. The entire response must be in this language: ${language}.

Here are the specialist reports:
Forensic Report:
${specialistReportsJson[0]}

Provenance Report:
${specialistReportsJson[1]}

Integrity Report:
${specialistReportsJson[2]}`;

        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: leadAnalystPrompt,
            config: { responseMimeType: "application/json", responseSchema: imageResponseSchema }
        });

        const finalReport = JSON.parse(finalResponse.text.trim()) as ImageAnalysisReport;

        onProgress('Analysis complete.');
        return finalReport;

    } catch (error) {
        console.error("Error during multi-model image analysis:", error);
        throw new Error("Failed to get a valid multi-model image analysis from the AI service.");
    }
}

export async function analyzeImage(
    imageDataBase64: string, 
    mimeType: string, 
    language: string,
    rigor: 'standard' | 'deep' = 'standard',
    onProgress: (message: string) => void = () => {}
): Promise<ImageAnalysisReport> {
    if (rigor === 'deep') {
        return analyzeImageMultiModel(imageDataBase64, mimeType, language, onProgress);
    }

    onProgress('Analyzing image with standard model...');
    const prompt = `Act as a digital image forensics expert. Analyze this image for signs of manipulation, deepfakes, or AI generation. Focus on clear and obvious signs like unnatural textures, inconsistent shadows, distorted objects, or malformed hands. For each identified area of concern, you MUST provide a bounding box and a brief description in the 'visualCues' array. The bounding box MUST be as tight as possible to the anomaly. Bounding box coordinates (topLeftX, topLeftY, width, height) MUST be percentages (0-100). If no suspicious areas are found, return an empty 'visualCues' array. Provide a JSON response based on the schema. Your entire response MUST be in this language: ${language}.`;
    const imagePart = { inlineData: { data: imageDataBase64, mimeType } };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json", responseSchema: imageResponseSchema }
        });
        const parsedData = JSON.parse(response.text.trim()) as ImageAnalysisReport;
        if (parsedData.deepfakeConfidence == null || parsedData.visualCues == null) {
            throw new Error("Invalid AI response structure for image analysis.");
        }
        onProgress('Analysis complete.');
        return parsedData;
    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("Failed to get a valid image analysis from the AI service.");
    }
}

export async function analyzeVideo(
    videoFrames: string[],
    videoDuration: number,
    onProgress: (message: string) => void,
    language: string
): Promise<VideoAnalysisReport> {
    onProgress(`Analyzing ${videoFrames.length} video frames... This may take a moment.`);
    const prompt = `Act as a senior digital video forensics expert. You have been provided with a sequence of ${videoFrames.length} frames sampled evenly from a video with a total duration of ${videoDuration.toFixed(1)} seconds. Your task is to analyze these frames for any signs of deepfakes, manipulation, or synthetic generation.
- **Visual Analysis:** Look for unnatural facial movements, inconsistent blinking, awkward expressions, edge artifacts, blurring, and inconsistent lighting across frames.
- **Temporal Analysis:** Critically compare the frames to each other. Look for inconsistencies that emerge over time, such as objects appearing/disappearing, backgrounds warping, or lighting that changes unnaturally between frames.
- **Enhanced Summary:** Provide a highly detailed and insightful summary that connects all your findings. Explain the potential impact of any detected manipulation in simple terms for a non-technical user.
- **Audio Analysis (Inferred):** You cannot hear audio, but you can infer issues. Note any poor lip sync across the frames.
- **Visual Cues & Timestamp Accuracy:** For each identified visual anomaly, you MUST provide a 'visualCues' entry. This must include a description and a bounding box area. Crucially, you must provide an accurate timestamp. Calculate it precisely using this formula: timestamp = (frame_index / ${videoFrames.length}) * ${videoDuration.toFixed(1)}. The 'frame_index' is the zero-based index of the frame in the sequence where the anomaly is first clearly visible. The timestamp must be a number in seconds.
- **Bounding Box Precision:** The bounding box MUST be as tight as possible around the visual anomaly. This box will be used to draw a highlighting ellipse, so its accuracy is critical for the user experience.
Provide a single, consolidated JSON response based on the schema. Be thorough and objective. Your entire JSON response, including all summaries and descriptions, MUST be in this language: ${language}.`;
    
    const imageParts = videoFrames.map(frameData => ({
        inlineData: {
            data: frameData,
            mimeType: 'image/jpeg'
        }
    }));
    const contentParts = [...imageParts, { text: prompt }];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: contentParts },
            config: { responseMimeType: "application/json", responseSchema: videoResponseSchema }
        });
        const parsedData = JSON.parse(response.text.trim()) as VideoAnalysisReport;
        if (parsedData.deepfakeConfidence == null || !parsedData.summary) {
            throw new Error("Invalid AI response structure for video analysis.");
        }
        onProgress('Analysis complete.');
        return parsedData;
    } catch (error) {
        console.error("Error analyzing video with Gemini:", error);
        throw new Error("Failed to get a valid video analysis from the AI service.");
    }
}

async function analyzePdfMultiModel(
    pdfDataBase64: string,
    language: string,
    onProgress: (message: string) => void
): Promise<PdfAnalysisReport> {
    onProgress('Initiating comprehensive PDF analysis...');

    const baseInstruction = `You MUST provide a JSON response that strictly adheres to the provided schema. Your entire response, including all text fields, MUST be in this language: ${language}.`;

    const malwarePrompt = `Act as a cybersecurity analyst specializing in malware and malicious link detection. Your sole focus is on the technical threats within this PDF.
- **Extract ALL hyperlinks:** Identify every single link, visible or hidden.
- **Assess Link Risk:** For each link, determine its risk level (High, Medium, Low, Unknown).
- **Find Malware Indicators:** Scrutinize the document for signs of obfuscated scripts, macros, or other potential malware vectors.
- **Populate Fields:** Your primary goal is to populate the \`detectedLinks\` and \`malwareIndicators\` fields. You must return an empty array if none are found. Other fields in your response can be minimal.
${baseInstruction}`;

    const socialEngineeringPrompt = `Act as a psychological operations expert specializing in detecting social engineering. Your entire focus is on the language, tone, and persuasive tactics used in this PDF.
- **Analyze Text:** Examine the text for urgent or threatening language, deceptive calls-to-action, impersonation of authority (e.g., banks, government), and attempts to elicit sensitive information.
- **Identify Tactics:** Note any psychological manipulation tactics used.
- **Populate Field:** Your primary goal is to populate the \`socialEngineeringTactics\` field. You must return an empty array if none are found. Other fields in your response can be minimal.
${baseInstruction}`;

    const forgeryPrompt = `Act as a world-class digital document forgery expert with extreme attention to detail. Your sole focus is the visual integrity and authenticity of this PDF. Your reputation depends on your precision.
- **Scrutinize Visuals:** Examine logos for pixelation or incorrect colors. Check fonts for inconsistencies. Verify alignment of text and graphical elements. Look for signs of edited or forged signatures. Treat every element with suspicion.
- **Identify Visual Cues & Bounding Box Rules (CRITICAL):**
    1.  Your primary goal is to find visual inconsistencies that suggest forgery.
    2.  For EVERY distinct visual flaw, you MUST provide ONLY ONE visual cue in the \`visualCues\` array.
    3.  **PRECISION IS PARAMOUNT:** The bounding box MUST be surgically precise and tightly enclose ONLY the relevant anomaly. Do NOT create large, vague boxes around a general area.
        - GOOD EXAMPLE: If a signature is inconsistent with a printed name, the box must enclose BOTH the signature and the name to provide context for the mismatch.
        - BAD EXAMPLE: Do NOT create two separate boxes for the signature and the name.
        - BAD EXAMPLE: Do NOT create a large box around the entire signature block if only the signature itself is flawed. Box only the signature.
    4.  **NO DUPLICATES:** Do NOT create multiple, overlapping boxes for the same logical issue. Combine related elements into one precise box. A single forgery attempt (e.g., a bad signature) gets ONE box.
- **Populate Field:** Your main task is to populate the \`visualCues\` field. You must return an empty array if none are found. Other fields can be minimal.
${baseInstruction}`;

    const pdfPart = { inlineData: { data: pdfDataBase64, mimeType: 'application/pdf' } };

    const generate = (prompt: string) => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [pdfPart, { text: prompt }] },
        config: { responseMimeType: "application/json", responseSchema: pdfCombinedResponseSchema }
    });

    try {
        onProgress('Dispatching to specialist AIs...');
        const malwarePromise = generate(malwarePrompt);
        const socialEngPromise = generate(socialEngineeringPrompt);
        const forgeryPromise = generate(forgeryPrompt);

        onProgress('Analyzing malware, social engineering, and forgery aspects...');
        const responses = await Promise.all([malwarePromise, socialEngPromise, forgeryPromise]);
        
        onProgress('Synthesizing specialist reports...');
        const specialistReportsJson = responses.map(res => res.text.trim());

        const leadAnalystPrompt = `Act as a Lead Digital Forensics Analyst. You have received three JSON reports from your specialist AIs: a Malware Analyst, a Social Engineering Expert, and a Document Forgery Expert. Your job is to synthesize their findings into a single, conclusive report in JSON format.
- **Synthesize Summaries:** Create a clear, insightful summary for a non-technical user. Start with a definitive statement about the PDF's likely safety (e.g., "This document contains high-risk phishing links and should not be trusted."). Then, elaborate on the combined evidence.
- **Prioritize Threats:** The final trust score MUST be the LOWEST score provided by any specialist. One high-risk link or clear forgery sign should result in a very low score.
- **AGGRESSIVELY DE-DUPLICATE EVIDENCE:** Combine all findings from the specialist reports. Your most critical task is to eliminate redundancy.
    - For \`visualCues\`, you MUST analyze all cues from the specialist reports and MERGE any that refer to the same logical issue. For example, if one report flags a signature and another flags the name next to it as a mismatch, these are ONE issue. Combine them into a single, comprehensive cue with one bounding box that covers both elements. Be critical; do not allow multiple markers for what a human would perceive as a single problem. Choose the most descriptive explanation.
    - For text-based findings (\`detectedLinks\`, \`malwareIndicators\`, \`socialEngineeringTactics\`), combine unique points and rephrase to avoid redundancy.
- **Key Points:** Create a new, synthesized list of 3-4 key points that highlight the most critical findings for the user.
- **Output:** Your final output MUST be a single JSON object that strictly adheres to the provided schema. The entire response must be in this language: ${language}.

Here are the specialist reports:
Malware Report:
${specialistReportsJson[0]}

Social Engineering Report:
${specialistReportsJson[1]}

Forgery Report:
${specialistReportsJson[2]}`;
        
        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: leadAnalystPrompt,
            config: { responseMimeType: "application/json", responseSchema: pdfCombinedResponseSchema }
        });

        const finalReport = JSON.parse(finalResponse.text.trim()) as PdfAnalysisReport;
        onProgress('Analysis complete.');
        return finalReport;

    } catch (error) {
        console.error("Error during multi-model PDF analysis:", error);
        throw new Error("Failed to get a valid PDF analysis from the AI service.");
    }
}

export async function analyzePdf(
    pdfDataBase64: string,
    language: string,
    onProgress: (message: string) => void
): Promise<PdfAnalysisReport> {
    return analyzePdfMultiModel(pdfDataBase64, language, onProgress);
}


export function startChat(language: string, mode: 'Detailed' | 'Concise'): Chat {
    const modeInstruction = mode === 'Detailed'
        ? "Your responses should be comprehensive, in-depth, and educational. Use headings, lists, and bold text to structure the information clearly. Assume the user wants to learn."
        : "Your responses should be concise, to-the-point, and summarized. Get straight to the answer without extra detail unless absolutely necessary.";

    const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are 'Digital Guardian', an elite AI Cybersecurity Analyst. Your primary function is to provide expert-level analysis, advice, and education on all matters of digital security to a non-technical audience.
- **Response Style:** ${modeInstruction}
- **Expert Analysis:** When a user provides text, images, videos, PDFs, or a combination, analyze them thoroughly. Explain complex topics like phishing, malware, deepfakes, and scams in simple, clear terms. If media files are provided, analyze them for signs of manipulation or malicious intent and incorporate your findings into your response.
- **Mandatory Search & Sourcing:** You MUST ALWAYS use your search tool to find current, verifiable information. Your goal is to provide between 4 and 8 high-quality sources for every answer. Your sources should be a diverse mix of reputable websites and relevant YouTube videos.
- **Formatting and Citation Rules:**
    1.  Your main response MUST be well-formatted using markdown, including headings (e.g., '### Heading'), bold text, and lists for readability.
    2.  You MUST NOT include any URLs or links directly in your main response body.
    3.  All sources MUST be provided exclusively through the tool's grounding capabilities. The user's interface will automatically display a "Sources" section with clickable links based on this data.
    4.  Therefore, you MUST NOT write "Sources:", "References:", or any similar heading followed by a list of your sources in your main text response.
- **Language and Region:** The user is speaking ${language}. Your entire response, including summaries and explanations, MUST be in this language. Prioritize search results and sources that are also in ${language} or from that geographical region if possible.
- **Important:** You cannot return or edit images/videos/PDFs. Your entire response must be text-based, including your media analysis.`,
            tools: [{googleSearch: {}}],
        },
    });
    return chatSession;
}