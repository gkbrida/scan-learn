import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import fs from 'fs';
import { Database } from '@/types/database.types';

// Validation des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is required');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Fonction utilitaire pour nettoyer les fichiers temporaires
async function cleanupTempFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    try {
      await writeFile(filePath, '');
      fs.unlinkSync(filePath);
      console.log('🧹 Fichier temporaire nettoyé:', filePath);
    } catch (error) {
      console.error('⚠️ Erreur lors du nettoyage:', error);
    }
  }
}

// Fonction pour sanitiser le nom du fichier
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Remplace les caractères spéciaux par des underscores
    .replace(/_{2,}/g, '_'); // Évite les underscores multiples
}

export async function POST(request: NextRequest) {
  let tempFilePath = '';
  let textSize = '';

  

  try {
    const formData = await request.formData();
    const assistantId = formData.get('assistantId') as string;
    const fileId = formData.get('fileId') as string;
    const vectorStoreId = formData.get('vectorStoreId') as string;
    const language = formData.get('language') as string;
    const size = formData.get('size') as string;
    const niveauEtude = formData.get('niveauEtude') as string;
    const storageDataPath = formData.get('storageDataPath') as string;
    const matiereId = formData.get('matiereId') as string;
    // Validation des données
    if (!assistantId) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    if (!language || !size || !niveauEtude) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (size === 'court') {
      textSize = 'Le contenu de la fiche doit être court et concis';
    } else if (size === 'moyen') {
      textSize = 'Le contenu de la fiche doit être moyen et détaillé';
    } else if (size === 'long') {
      textSize = 'Le contenu de la fiche doit  être long et très détaillé';
    }


    // Étape 8 : Création et initialisation du thread
    console.log('🧵 Création du thread...');
    const thread = await openai.beta.threads.create();
    
    // Ajout du message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `
      Analyse ce document et crée une fiche de révision complète et pédagogique au **format HTML + CSS intégré** (sans aucun texte hors balises), en utilisant des **couleurs, emojis pertinents, balises sémantiques et mise en forme claire** (gras, listes, blocs colorés…).  
La fiche doit être 100% basée sur le contenu du document (sans ajout extérieur) et conçue pour **faciliter la mémorisation, la compréhension et l’apprentissage autonome**.

🎯 Contraintes :
- Le contenu doit être expliqué de manière claire, précise, fluide, et visuellement engageante
- Tu dois **mettre en évidence** toutes les définitions, concepts clés, formules et points importants via des blocs distincts et emojis adaptés
- Tu ne dois **pas faire de sommaire ni lister les mots-clés séparément** : ils doivent être directement intégrés et expliqués dans le contenu
- La **taille du contenu** : ${textSize} 
- Rédige dans la langue : ${language}
- Adapte le niveau de pédagogie selon : ${niveauEtude}

🎨 Le rendu final doit être :
- **Uniquement en HTML + CSS intégré**
- **Stylé avec des blocs colorés (définitions, formules, exemples, alertes, etc.)**
- **Orné d'emojis pédagogiques** pour chaque type de contenu

🧠 Le but : permettre à un étudiant de **réviser tout le contenu facilement sans rien rater**.

---
      `
    });

    // Lancement de l'exécution
    console.log('🚀 Lancement de l\'analyse...');
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
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

    // Étape 9 : Sauvegarde dans Supabase
    const { error: dbError } = await supabase
      .from('threads')
      .insert({
        thread_id: thread.id,
        assistant_id: assistantId,
        run_id: run.id,
        file_id: fileId,
        vector_store_id: vectorStoreId,
        storage_path: storageDataPath,
        status: run.status,
        matiere_id: matiereId,
      });
      

    if (dbError) throw dbError;

    return NextResponse.json({ threadId: thread.id, runId: run.id });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    
    // Nettoyage en cas d'erreur
    await cleanupTempFile(tempFilePath);

    // Gestion spécifique des erreurs
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Le délai d\'attente a été dépassé' },
        { status: 504 }
      );
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return NextResponse.json(
        { error: 'Erreur de connexion au service' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Une erreur inattendue est survenue' },
      { status: 500 }
    );
  } 
} 