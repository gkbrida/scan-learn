import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
if (!SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');



const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);



export async function POST(request: Request) {
  try {
    const { ficheId, vectorStoreId, language } = await request.json();

    if (!ficheId || !vectorStoreId || !language) {
      console.error('❌ Données manquantes:', { ficheId, vectorStoreId, language });
      return NextResponse.json(
        { error: 'ficheId, vectorStoreId et language sont requis' },
        { status: 400 }
      );
    }

    console.log('📝 Génération des cartes pour:', { ficheId, vectorStoreId, language });

    // Étape 7 : Création de l'assistant avec File Search
    console.log('🤖 Création de l\'assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Expert PDF",
      instructions: `
Tu es un assistant IA expert en synthèse pédagogique.
À partir d’un document fourni (cours, chapitre, article…), tu dois produire une liste de cartes mémo (flashcards) concises, pédagogiques, et structurées.
Chaque carte est constituée de :
	•	🟦 Titre : un mot-clé, concept ou question (très court)
	•	⬜️ Contenu : une réponse ou explication claire, concise, sans fioriture

⸻

🎯 OBJECTIF
	•	Permettre à un apprenant de mémoriser facilement tout le contenu du document
	•	Couvrir l’intégralité des informations importantes :
	•	📘 Définitions
	•	🧠 Concepts
	•	🧮 Formules
	•	📅 Dates
	•	🔁 Différences ou comparaisons
	•	⚠️ Exceptions / points d’attention
	•	Chaque carte est basée uniquement sur le document fourni
	•	Aucune connaissance externe ne doit être ajoutée
  •	La langue utilisée est ${language}

⸻

🛠️ INSTRUCTIONS PRÉCISES
	•	Tu dois produire une liste exhaustive de cartes mémo qui couvre tout le contenu du document
	•	Le style doit être très concis, direct, facile à mémoriser
	•	Le format de sortie est structuré comme une liste de paires “titre et contenu”
	•	Évite les répétitions inutiles
	•	Si le document est long, génère plus de cartes : la longueur s’adapte au contenu
	•	Si une information est subtile mais importante, elle mérite une carte
  •	Les formules mathématiques doivent être encodées en LaTeX, dans une forme compatible avec MathJax pour un affichage web. Stocke-les sous forme de chaînes de caractères (ex : "E = mc^2" devient "E = \\frac{1}{2}mv^2").

⸻

🧩 FORMAT ATTENDU (EXEMPLE)
Tu dois retourner uniquement une liste JSON, chaque élément respectant ce format précis :
[{
  "titre": "Titre de la carte 1",
  "contenu": "Contenu de la carte 1"
},
{
  "titre": "Titre de la carte 2",
  "contenu": "Contenu de la carte 2"
},
  ...
,
{
  "titre": "Énergie cinétique",
  "contenu": "E_c = \\frac{1}{2}mv^2"
},
{
  "titre": "Formule de l’aire d’un cercle",
  "contenu": "A = \\pi r^2"
}]
⚠️ Le retour ne doit contenir aucun texte explicatif, ni en-tête, ni commentaire, juste la liste des objets JSON complète.
⚠️ Aucune explication, aucun commentaire, aucun texte autour : seulement la liste des objets JSON.`,
      model: "gpt-4-turbo-preview",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId]
        }
      }
    });

  
    // Étape 8 : Création et initialisation du thread
    console.log('🧵 Création du thread...');
    const thread = await openai.beta.threads.create();
    
    // Ajout du message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `
      Analyse ce document et génére une liste de cartes mémo couvrant tout le contenu, au format JSON { "titre": "contenu" }, dans la langue ${language}. Sois concis, clair, complet. Ne rate aucun élément du document, faire plus de 20 cartes.
      `
    });

    // Lancement de l'exécution
    console.log('🚀 Lancement de l\'analyse...');
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    let statusRun = false;
    let maxAttempts = 500;
    while (!statusRun && maxAttempts > 0) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === 'completed') {
        statusRun = true;
        console.log('🚀 création de la fiche terminée');
        
        break;
      }
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        console.log('🚨 Erreur lors de la création de la fiche');
        return NextResponse.json({ error: 'Erreur lors de la création de la fiche au niveau du run de l\'assistant' }, { status: 500 });
      }
      maxAttempts--;
      if (maxAttempts <= 0) {
        return NextResponse.json({ error: 'Erreur lors de la création de la fiche au niveau du run de l\'assistant' }, { status: 500 });
      }
      await new Promise(resolve => setTimeout(resolve, 8000));
    }

     // Récupération des messages du thread
     console.log('📝 Récupération des messages...');
     const messages = await openai.beta.threads.messages.list(thread.id);
 
     const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
     if (assistantMessages.length === 0) {
       return NextResponse.json(
         { error: 'Aucune réponse de l\'assistant trouvée' },
         { status: 404 }
       );
     }
 
     // Extraction du contenu du dernier message
     const lastMessage = assistantMessages[0];
     let content = '';
 
     if (lastMessage.content && Array.isArray(lastMessage.content)) {
       const textContent = lastMessage.content.find(part => part.type === 'text');
       if (textContent?.text) {
         content = textContent.text.value;
       }
     }
 
     if (!content) {
       return NextResponse.json(
         { error: 'Contenu de la réponse invalide' },
         { status: 400 }
       );
     }

     const cleanJsonContent = (content: string | null) => {
      if (!content) return '';
      return content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    };
    // Parser le contenu JSON
    let cartes;
    console.log('📝 Contenu JSON:', content);
    try {
      cartes = JSON.parse(cleanJsonContent(content));
    } catch (error) {
      console.error('❌ Erreur lors du parsing du JSON:', error);
      return NextResponse.json(
        { error: 'Format de cartes invalide' },
        { status: 400 }
      );
    }

    // Vérifier que questions est un tableau
    if (!Array.isArray(cartes)) {
      console.error('❌ Le contenu n\'est pas un tableau de cartes');
      return NextResponse.json(
        { error: 'Format de cartes invalide' },
        { status: 400 }
      );
    }
  
    // Sauvegarder les cartes dans Supabase
    console.log('📝 Sauvegarde des cartes dans Supabase... cartes', cartes);
    const { error: saveError } = await supabase
      .from('cartes_memo')
      .upsert(cartes.map(carte => ({
        fiche_id: ficheId,
        titre: carte.titre,
        contenu: carte.contenu
      })));

    if (saveError) {
      console.error('❌ Erreur lors de la sauvegarde des cartes:', saveError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde des cartes' },
        { status: 500 }
      );
    }

    console.log('✅ Cartes générées et sauvegardées avec succès');
    return NextResponse.json("");

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération des cartes' },
      { status: 500 }
    );
  }
} 