import { GoogleGenAI, Type } from "@google/genai";
import { HealthLog, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MIRA_SYSTEM_INSTRUCTION = `
Tu es Mira, une assistante de santé intelligente et compatissante spécialisée dans le soin du diabète pour les Tunisiens.
Tu t'exprimes dans un ton chaleureux, expert et rassurant.

IDENTITÉ : 
- Tu es une experte de la culture et de la cuisine tunisienne (Couscous, Mechouia, Lablabi, Fricassé, etc.).
- Tu utilises le contexte culturel pour donner des conseils pratiques.
- Langue : Français (principal) avec des touches de Derja Tunisienne (Asslema, Yaatik esaha, Labes, etc.).

ANALYSE CLINIQUE :
- Tu as accès aux cibles glycémiques personnalisées de l'utilisateur. 
- Toujours comparer les mesures récentes aux cibles de l'utilisateur (Min/Max).
- Détecter les tendances (ex: glycémies toujours hautes après le dîner).

CONSEILS NUTRITIONNELS :
- Proposer des alternatives tunisiennes à index glycémique bas.
- Exemple : Remplacer le pain blanc par du pain complet ou de l'orge (Malthouth).
- Expliquer l'impact de l'huile d'olive et des épices.

RÈGLES DE SÉCURITÉ :
1. Avertissement médical obligatoire : "Je suis une IA, consulte ton médecin pour toute décision médicale."
2. Hypoglycémie (< cible min) : Appliquer la règle des 15/15 (15g de sucre, 15 min d'attente).
3. Hyperglycémie (> cible max) : Conseiller l'hydratation et le repos.
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

export async function getLifestylePlan(profile: UserProfile, logs: HealthLog[]) {
  const contextText = `
Profil: ${JSON.stringify(profile)}
Historique Glycémique: ${logs.filter(l => l.type === 'glucose').slice(0, 15).map(l => `${l.value} (${l.timing})`).join(', ')}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Génère un plan "Régime & Vie" personnalisé pour cet utilisateur diabétique en Tunisie.
${contextText}

Le plan doit être strictement adapté à la cuisine tunisienne (ex: Couscous complet, Ojja, Salata Mechouia, pain Tabouna modéré).
Donne des conseils de vie basés sur ses glycémies récentes.
Utilise un ton chaleureux de "Mira" avec quelques mots de Derja (Asslema, Yaatik esaha).`,
    config: {
      systemInstruction: "Tu es Mira, experte en nutrition tunisienne et diabète. Tu dois retourner un JSON structuré en Français.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nutrition: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                meal: { type: Type.STRING, description: "Petit-déjeuner, Déjeuner, Dîner, ou Collation" },
                suggestion: { type: Type.STRING, description: "Description du plat tunisien sain" },
                alternative: { type: Type.STRING, description: "Alternative si l'utilisateur n'aime pas le plat" },
                why: { type: Type.STRING, description: "Pourquoi ce choix pour son diabète" }
              }
            }
          },
          lifestyle: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "Activité, Sommeil, Stress" },
                tip: { type: Type.STRING },
                impact: { type: Type.STRING, description: "Impact sur la glycémie" }
              }
            }
          },
          intro: { type: Type.STRING, description: "Message d'accueil chaleureux de Mira" }
        },
        required: ["nutrition", "lifestyle", "intro"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
