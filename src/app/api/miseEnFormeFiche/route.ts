import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';

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




export async function POST(request: NextRequest) {
  try {
    const { threadId, matiereId, ficheName, vectorStoreId, language } = await request.json();

    if (!threadId || !matiereId || !ficheName) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Récupération des messages du thread
    console.log('📝 Récupération des messages...');
    const messages = await openai.beta.threads.messages.list(threadId);

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

    // Sauvegarde dans Supabase
    console.log('💾 Enregistrement dans la base de données...');
    const { error: dbError } = await supabase
      .from('fiches')
      .insert({
        matiere_id: matiereId,
        nom: ficheName,
        contenu: content,
        thread_id: threadId,
        vector_store_id: vectorStoreId,
        language: language
      });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 