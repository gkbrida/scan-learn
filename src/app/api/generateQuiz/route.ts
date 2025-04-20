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
    const { ficheId, vectorStoreId, language, matiereId, userId } = await request.json();

    if (!ficheId || !vectorStoreId || !language || !matiereId || !userId) {
      console.error('❌ Données manquantes:', { ficheId, vectorStoreId, language, matiereId, userId });
      return NextResponse.json(
        { error: 'ficheId, vectorStoreId, language, matiereId et userId sont requis' },
        { status: 400 }
      );
    }

    console.log('📝 Génération du quiz pour:', { ficheId, vectorStoreId, language, matiereId, userId });

    // Création de l'assistant
    console.log('🤖 Création de l\'assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Expert en Quiz",
      instructions: `
Tu es un assistant IA spécialisé dans la création de quiz pédagogiques QCM à partir d'un document (cours, article, rapport…).
Ton objectif est de générer un très grand nombre de questions à choix multiple (QCM) de qualité, claires, variées, couvrant tout le contenu du document sans rien oublier.

⸻

🛠️ INSTRUCTIONS
	•	Lis l'intégralité du document fourni
	•	Génére un grand nombre de questions pertinentes et variées
	•	Aucune connaissance externe ne doit être utilisée : uniquement le document
	•	Chaque quiz doit inclure :
	•	question : une question claire, concise
	•	options : 3 ou 4 choix maximum
	•	réponse : la bonne réponse, parmi les options proposées
	•	Les questions doivent être équilibrées :
	•	📅 Dates
	•	🧠 Définitions
	•	⚖️ Comparaisons
	•	🧪 Formules (sous forme de QCM)
	•	📘 Concepts-clés
	•	🔍 Détails précis du contenu

⸻

🎯 EXIGENCES
	•	Les questions doivent être bien formulées, sans ambiguïté
	•	Les distracteurs (mauvaises réponses) doivent sembler crédibles
	•	Rédaction dans la langue ${language}

⸻

📤 FORMAT DE SORTIE

Tu dois retourner uniquement une liste JSON, chaque élément respectant ce format précis :

[
  {
    "question": "Quelle est la date de début de la Première Guerre mondiale ?",
    "options": {
      "A": "1914 - 1918",
      "B": "1919 - 1930",
      "C": "1911 - 1918",
      "D": "1913 - 1918"
    },
    "réponse": "A"
  },
  {
    "question": "Que signifie le concept d'énergie cinétique ?",
    "options": {
      "A": "L'énergie liée à la température",
      "B": "L'énergie du mouvement",
      "C": "L'énergie potentielle d'un corps",
      "D": "L'énergie produite par l'électricité"
    },
    "réponse": "B"
  }
  // ...
]

⚠️ Le retour ne doit contenir aucun texte explicatif, ni en-tête, ni commentaire, juste la liste JSON complète.
`,
      model: "gpt-4-turbo-preview",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStoreId]
        }
      }
    });

    // Création du thread
    console.log('🧵 Création du thread...');
    const thread = await openai.beta.threads.create();

    // Ajout du message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Analyse ce document et crée un quiz interactif et pédagogique., faire plus de 20 questions"
    });

    // Lancement du run
    console.log('🚀 Lancement de l\'analyse...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Vérification de l'état du run
    let statusRun = false;
    let maxAttempts = 60;
    while (!statusRun && maxAttempts > 0) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      
      if (runStatus.status === 'completed') {
        statusRun = true;
        console.log('✅ Génération du quiz terminée');
        break;
      }
      
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
        console.error('❌ Erreur lors de la génération du quiz');
        return NextResponse.json(
          { error: 'Erreur lors de la génération du quiz' },
          { status: 500 }
        );
      }
      
      maxAttempts--;
      if (maxAttempts <= 0) {
        return NextResponse.json(
          { error: 'Délai dépassé pour la génération du quiz' },
          { status: 500 }
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Récupération des messages
    console.log('📝 Récupération du quiz...');
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length === 0) {
      return NextResponse.json(
        { error: 'Aucun quiz généré' },
        { status: 404 }
      );
    }

    // Extraction du contenu HTML
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
        { error: 'Contenu invalide' },
        { status: 400 }
      );
    }

    const cleanJsonContent = (content: string | null) => {
      if (!content) return '';
      return content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    };
    // Parser le contenu JSON
    let questions;
    try {
      questions = JSON.parse(cleanJsonContent(content));
    } catch (error) {
      console.error('❌ Erreur lors du parsing du JSON:', error);
      return NextResponse.json(
        { error: 'Format de quiz invalide' },
        { status: 400 }
      );
    }

    // Vérifier que questions est un tableau
    if (!Array.isArray(questions)) {
      console.error('❌ Le contenu n\'est pas un tableau de questions');
      return NextResponse.json(
        { error: 'Format de quiz invalide' },
        { status: 400 }
      );
    }

    // Sauvegarde dans Supabase
    console.log('💾 Sauvegarde des questions... questions', questions);
    const { error: saveError } = await supabase
      .from('qcm')
      .upsert(questions.map(q => ({
        fiche_id: ficheId,
        matiere_id: matiereId,
        user_id: userId,
        question: q.question,
        options: q.options,
        reponse: q.réponse
      })));

    if (saveError) {
      console.error('❌ Erreur lors de la sauvegarde:', saveError);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde des questions' },
        { status: 500 }
      );
    }

    console.log('✅ Questions sauvegardées avec succès');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 