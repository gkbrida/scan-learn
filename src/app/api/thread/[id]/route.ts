import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Validation des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  timeout: 10000, // 10 secondes de timeout
});

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Types pour la gestion des statuts
type RunStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired';

interface ThreadMessage {
  role: string;
  content: any[];
  file_ids?: string[];
  assistant_id?: string;
  run_id?: string;
  thread_id?: string;
  created_at?: number;
}

interface ThreadResponse {
  messages: ThreadMessage[];
  hasResponse: boolean;
  runStatus: RunStatus;
  error?: string;
}

interface OpenAIRun {
  id: string;
  status: RunStatus;
  thread_id: string;
  assistant_id: string;
}

interface OpenAIMessageList {
  data: ThreadMessage[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ThreadResponse>> {
  const startTime = Date.now();

  try {
    // ✅ CORRECTION : on récupère correctement l'ID depuis context.params
    const { id: threadId } = await context.params;

    if (!threadId) {
      console.error('❌ ID du thread manquant dans la requête');
      return NextResponse.json(
        { error: 'ID du thread manquant', messages: [], hasResponse: false, runStatus: 'failed' },
        { status: 400 }
      );
    }

    console.log(`🔍 Vérification du thread ${threadId}`);

    // 1. Récupération des informations depuis Supabase
    const { data: threadData, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .eq('thread_id', threadId)
      .single();

    if (threadError) {
      console.error('❌ Erreur Supabase:', threadError);
      if (threadError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Thread non trouvé', messages: [], hasResponse: false, runStatus: 'failed' },
          { status: 404 }
        );
      }
      throw new Error(`Erreur de base de données: ${threadError.message}`);
    }

    if (!threadData) {
      console.error('❌ Thread non trouvé dans Supabase');
      return NextResponse.json(
        { error: 'Thread non trouvé', messages: [], hasResponse: false, runStatus: 'failed' },
        { status: 404 }
      );
    }

    // 2. Récupération des messages OpenAI avec timeout
    let messages: OpenAIMessageList;
    try {
      messages = await Promise.race([
        openai.beta.threads.messages.list(threadId) as Promise<OpenAIMessageList>,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout OpenAI')), 8000)
        )
      ]);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des messages:', error);
      if (error.message === 'Timeout OpenAI') {
        return NextResponse.json(
          { error: 'Délai d\'attente dépassé', messages: [], hasResponse: false, runStatus: 'failed' },
          { status: 504 }
        );
      }
      throw error;
    }

    const assistantMessages = messages.data.filter(msg => msg.role === 'assistant');
    const hasResponse = assistantMessages.length > 0;

    console.log(`📨 ${messages.data.length} messages trouvés, dont ${assistantMessages.length} de l'assistant`);

    if (hasResponse) {
      console.log('✅ Réponse de l\'assistant trouvée');
      
      // Sauvegarde de la réponse dans la table lecons
      const assistantResponse = assistantMessages[0].content[0].text.value;
      
      // Récupération des informations du fichier depuis la requête
      const searchParams = new URL(request.url).searchParams;
      const ficheName = searchParams.get('ficheName');
      
      if (ficheName && threadData) {
        console.log('💾 Sauvegarde de la réponse dans la table lecons...');
        const { error: insertError } = await supabase
          .from('lecons')
          .insert({
            nom: ficheName,
            matiere_id: threadData.matiere_id,
            contenu: assistantResponse,
            assistant_id: threadData.assistant_id,
            vector_store_id: threadData.vector_store_id
          });

        if (insertError) {
          
          console.error('⚠️ Erreur lors de la sauvegarde dans lecons:', insertError);
          
        } else {
          console.log('✅ Réponse sauvegardée avec succès dans la table lecons');
        }
      }

      return NextResponse.json({
        messages: messages.data,
        hasResponse: true,
        runStatus: 'completed'
      });
    }

    if (!threadData.run_id) {
      console.error('❌ Pas de run_id trouvé');
      return NextResponse.json({
        error: 'Configuration incomplète',
        messages: messages.data,
        hasResponse: false,
        runStatus: 'failed'
      }, { status: 500 });
    }

    let run: OpenAIRun;
    try {
      run = await Promise.race([
        openai.beta.threads.runs.retrieve(threadId, threadData.run_id) as Promise<OpenAIRun>,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout OpenAI')), 8000)
        )
      ]);
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération du run:', error);
      if (error.message === 'Timeout OpenAI') {
        return NextResponse.json(
          { error: 'Délai d\'attente dépassé', messages: [], hasResponse: false, runStatus: 'failed' },
          { status: 504 }
        );
      }
      throw error;
    }

    if (run.status !== threadData.status) {
      console.log(`📝 Mise à jour du statut: ${threadData.status} -> ${run.status}`);
      
      const { error: updateError } = await supabase
        .from('threads')
        .update({ 
          status: run.status,
          updated_at: new Date().toISOString()
        })
        .eq('thread_id', threadId);

      if (updateError) {
        console.error('⚠️ Erreur lors de la mise à jour du statut:', updateError);
      }
    }

    if (run.status === 'failed') {
      console.error('❌ Le run a échoué');
      return NextResponse.json({
        error: 'L\'analyse du document a échoué',
        messages: messages.data,
        hasResponse: false,
        runStatus: 'failed'
      }, { status: 500 });
    }

    if (run.status === 'cancelled') {
      console.error('⚠️ Le run a été annulé');
      return NextResponse.json({
        error: 'L\'analyse du document a été annulée',
        messages: messages.data,
        hasResponse: false,
        runStatus: 'cancelled'
      }, { status: 400 });
    }

    if (run.status === 'expired') {
      console.error('⚠️ Le run a expiré');
      return NextResponse.json({
        error: 'L\'analyse a expiré',
        messages: messages.data,
        hasResponse: false,
        runStatus: 'expired'
      }, { status: 400 });
    }

    const executionTime = Date.now() - startTime;
    if (executionTime > 25000) {
      console.warn('⚠️ Temps d\'exécution long:', executionTime, 'ms');
    }

    return NextResponse.json({
      messages: messages.data,
      hasResponse: false,
      runStatus: run.status
    });

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    
    if (error.status === 404) {
      return NextResponse.json({
        error: 'Thread OpenAI non trouvé',
        messages: [],
        hasResponse: false,
        runStatus: 'failed'
      }, { status: 404 });
    }
    
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Limite de requêtes OpenAI atteinte',
        messages: [],
        hasResponse: false,
        runStatus: 'failed'
      }, { status: 429 });
    }

    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      return NextResponse.json({
        error: 'La requête a expiré',
        messages: [],
        hasResponse: false,
        runStatus: 'failed'
      }, { status: 504 });
    }

    return NextResponse.json(
      { error: error.message || 'Une erreur inattendue est survenue', messages: [], hasResponse: false, runStatus: 'failed' },
      { status: 500 }
    );
  }
}