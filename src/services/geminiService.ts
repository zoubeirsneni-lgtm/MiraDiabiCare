import { GoogleGenAI, Type } from "@google/genai";
import { HealthLog, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MIRA_SYSTEM_INSTRUCTION = `
Tu es Mira, une assistante de santé intelligente et compatissante spécialisée dans le soin du diabète pour les Tunisians.
Tu t'exprimes dans un ton chaleureux et expert, en utilisant le contexte culturel approprié (en faisant référence à la cuisine tunisienne comme le couscous, la mechouia, le lablabi, etc.).

Règle d'or : Tu dois toujours répondre en Français, mais tu peux utiliser quelques mots de dialecte tunisien (par ex: Asslema, Ya3tik esaha) pour la convivialité.

Tes Objectifs :
1. Analyser les tendances glycémiques et les expliquer simplement.
2. Fournir des conseils nutritionnels adaptés à la cuisine tunisienne.
3. Aider les utilisateurs à calculer les doses d'insuline (si le Ratio I/G et le Facteur de Sensibilité sont fournis).
4. Encourager les habitudes stables et avertir sur les risques d'hypo/hyper.

Contexte fourni :
- Profil utilisateur (type de diabète, cibles, ratios).
- Historique récent (glycémies, repas, insuline, activité).

Contraintes :
- Toujours inclure un avertissement médical indiquant que tu es une assistante IA et non un médecin.
- Si une mesure est dangereusement basse (< 70 mg/dL), prioriser les instructions pour traiter l'hypoglycémie (règle des 15g).
- Si une mesure est très haute (> 250 mg/dL), conseiller de vérifier l'acétone et de boire de l'eau.
`;

export async function askMira(
  question: string,
  profile: UserProfile | null,
  recentLogs: HealthLog[]
) {
  const translateType = (t: string) => {
    const m: any = { glucose: 'Glycémie', food: 'Repas', activity: 'Sport', medication: 'Médicament', weight: 'Poids' };
    return m[t] || t;
  };

  const contextText = `
Profil Utilisateur: ${profile ? JSON.stringify(profile) : 'Non fourni'}
Historique Récent (20 derniers):
${recentLogs.map(l => `- [${new Date(l.timestamp?.seconds * 1000).toLocaleString()}] ${translateType(l.type)}: ${l.value} ${l.notes || ''}`).join('\n')}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      { role: 'user', parts: [{ text: `${contextText}\n\nQuestion: ${question}` }] }
    ],
    config: {
      systemInstruction: MIRA_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });

  return response.text;
}

export async function analyzeTunisianMeal(description: string, imageBase64?: string) {
  const parts: any[] = [];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    });
  }
  
  parts.push({ text: `Analyze this Tunisian meal for its glycemic impact: "${description || 'User provided an image of their meal'}"` });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
    config: {
      systemInstruction: "Tu es une experte en nutrition tunisienne. Analyse la charge glycémique, l'estimation des glucides, et suggère des variations plus saines (ex: plus de légumes, grains complets) tout en restant authentiquement tunisien. Si une image est fournie, identifie les plats en premier. Réponds toujours en Français.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING, description: "Name of the dish(es) identified" },
          glycemicLoad: { type: Type.STRING, description: "Low, Medium, or High" },
          estimatedCarbs: { type: Type.NUMBER, description: "Estimated grams of carbs" },
          analysis: { type: Type.STRING, description: "Detailed nutritional analysis" },
          tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tips to make it healthier" }
        },
        required: ["dishName", "glycemicLoad", "estimatedCarbs", "analysis", "tips"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function getExpertDiagnostic(profile: UserProfile, logs: HealthLog[]) {
  const logSummary = logs.map(l => `${l.type} at ${new Date(l.timestamp?.seconds * 1000).toISOString()}: ${l.value}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview", // Higher reasoning for diagnostic
    contents: `Analyze these logs and provide a 7-day stability forecast and health score (0-100):\n${logSummary}`,
    config: {
      systemInstruction: "Tu es un endocrinologue spécialisé dans le diabète. Analyse les données pour détecter des patterns (ex: phénomène de l'aube, hypos liées au sport, pics postprandiaux). Retourne du JSON en Français.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthScore: { type: Type.NUMBER },
          stabilityTrend: { type: Type.STRING, description: "Improving, Stable, or Declining" },
          patternsDetected: { type: Type.ARRAY, items: { type: Type.STRING } },
          forecast: { type: Type.STRING, description: "7-day outlook" },
          topActionableTip: { type: Type.STRING }
        },
        required: ["healthScore", "stabilityTrend", "patternsDetected", "forecast", "topActionableTip"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
