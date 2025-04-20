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

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string;
    const size = formData.get('size') as string;
    const niveauEtude = formData.get('niveauEtude') as string;

    // Validation des données
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    if (!language || !size || !niveauEtude) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Vérification du type de fichier
    if (!file.type.includes('pdf')) {
      return NextResponse.json({ error: 'Format de fichier non supporté. Seuls les PDF sont acceptés.' }, { status: 400 });
    }

    // Vérification de la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 10MB.' }, { status: 400 });
    }

    console.log('📝 Début du traitement du fichier:', file.name);

    // Convertir le fichier en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitiser le nom du fichier
    const sanitizedFileName = sanitizeFileName(file.name);
    console.log('📝 Nom du fichier sanitisé:', sanitizedFileName);

    // Étape 1 : Upload vers Supabase Storage avec retry
    let storageData;
    let uploadError: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await supabase
          .storage
          .from('files')
          .upload(`docs/${Date.now()}-${sanitizedFileName}`, buffer, {
            contentType: file.type,
            upsert: true
          });
        
        if (result.error) throw result.error;
        storageData = result.data;
        console.log('📁 Chemin de stockage:', storageData.path);
        break;
      } catch (error: any) {
        uploadError = error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    if (!storageData || !storageData.path) {
      throw new Error('Échec de l\'upload ou chemin de stockage non défini');
    }

    // Étape 2 : Récupérer l'URL publique
    const { data: publicUrlData } = await supabase
      .storage
      .from('files')
      .getPublicUrl(storageData.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Impossible de générer l'URL publique");
    }

    // Vérifier que l'URL est valide
    try {
      const url = new URL(publicUrlData.publicUrl);
      console.log('🔗 URL publique validée:', url.toString());
    } catch (error) {
      throw new Error("URL publique invalide");
    }

    // Étape 3 : Télécharger le fichier pour OpenAI avec timeout et retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    let downloadError: Error | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(publicUrlData.publicUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/pdf'
          }
        });
        
        console.log(`🔍 Tentative ${attempt + 1}: Statut de la réponse - ${response.status}`);
        console.log(`🔍 Tentative ${attempt + 1}: En-têtes de la réponse -`, response.headers);
        
        if (!response.ok) {
          throw new Error(`Erreur lors du téléchargement: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          throw new Error("Fichier téléchargé vide");
        }

        tempFilePath = join(tmpdir(), `${Date.now()}-${file.name}`);
        await writeFile(tempFilePath, Buffer.from(arrayBuffer));

        console.log('💾 Fichier temporaire créé:', tempFilePath, 'Taille:', arrayBuffer.byteLength);
        downloadError = null;
        break;
      } catch (error: any) {
        downloadError = error;
        console.error(`⚠️ Tentative ${attempt + 1} échouée:`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    if (downloadError) {
      throw new Error(`Échec du téléchargement après 3 tentatives: ${downloadError.message}`);
    }

    // Étape 4 : Traitement OpenAI
    let uploadedFile;
    try {
      uploadedFile = await openai.files.create({
        file: fs.createReadStream(tempFilePath),
        purpose: 'assistants',
      });

      console.log('📄 Fichier uploadé vers OpenAI:', uploadedFile.id);
    } catch (error: any) {
      throw new Error(`Erreur upload OpenAI: ${error.message}`);
    }

    // 2. Création du Vector Store
    console.log('🔄 Création du Vector Store...');
    const vectorStoreResponse = await fetch('https://api.openai.com/v1/vector_stores', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        name: `Documentation ${file.name}`
      })
    });

    if (!vectorStoreResponse.ok) {
      throw new Error(`Erreur création Vector Store: ${vectorStoreResponse.status}`);
    }

    const vectorStore = await vectorStoreResponse.json();
    console.log('✅ Vector Store créé:', vectorStore.id);

    // 3. Ajout du fichier au Vector Store et vérification du statut
    console.log('📎 Ajout du fichier au Vector Store...');
    
    let addFileSuccess = false;
    let addFileAttempts = 0;
    const maxAddFileAttempts = 3;
    
    while (!addFileSuccess && addFileAttempts < maxAddFileAttempts) {
      try {
        addFileAttempts++;
        console.log(`Tentative ${addFileAttempts}/${maxAddFileAttempts} d'ajout du fichier au Vector Store...`);
        
        const addFileResponse = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStore.id}/files`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            file_id: uploadedFile.id
          })
        });

        if (addFileResponse.ok) {
          addFileSuccess = true;
          console.log('✅ Fichier ajouté au Vector Store avec succès');
        } else {
          const errorStatus = addFileResponse.status;
          const errorText = await addFileResponse.text().catch(() => "Pas de détails disponibles");
          console.error(`⚠️ Erreur lors de l'ajout du fichier (${errorStatus}):`, errorText);
          
          // Attendre plus longtemps entre les tentatives pour les erreurs 429 (rate limit)
          const waitTime = errorStatus === 429 ? 5000 : 1000 * Math.pow(2, addFileAttempts);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (error) {
        console.error(`⚠️ Exception lors de l'ajout du fichier (tentative ${addFileAttempts}):`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, addFileAttempts)));
      }
    }
    
    if (!addFileSuccess) {
      throw new Error(`Échec de l'ajout du fichier au Vector Store après ${maxAddFileAttempts} tentatives`);
    }

    // Vérification du statut du Vector Store
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 secondes maximum
    
    console.log('⏳ Vérification du statut du Vector Store...');
    while (!isReady && attempts < maxAttempts) {
      try {
        attempts++;
        const statusResponse = await fetch(
          `https://api.openai.com/v1/vector_stores/${vectorStore.id}/files/${uploadedFile.id}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          }
        );

        if (!statusResponse.ok) {
          const errorStatus = statusResponse.status;
          console.error(`⚠️ Erreur lors de la vérification du statut (${errorStatus}) - tentative ${attempts}/${maxAttempts}`);
          
          // Pour 404 et 429, on attend plus longtemps
          if (errorStatus === 404) {
            // 404 peut signifier que l'indexation n'a pas encore commencé
            console.log('Indexation pas encore commencée, attente...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          } else if (errorStatus === 429) {
            // Rate limit, attente plus longue
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          
          throw new Error(`Erreur vérification statut: ${errorStatus}`);
        }

        const fileStatus = await statusResponse.json();
        console.log(`📊 Statut actuel (${attempts}/${maxAttempts}): ${fileStatus.status}`);
        
        if (fileStatus.status === 'completed') {
          isReady = true;
          console.log('✅ Vector Store prêt !');
        } else if (fileStatus.status === 'failed') {
          throw new Error('Échec de la préparation du Vector Store');
        } else {
          // Attente progressive, commencant par 1s et augmentant graduellement
          const waitTime = Math.min(1000 * (1 + attempts/5), 3000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      } catch (error: any) {
        console.error(`❌ Erreur lors de la vérification (tentative ${attempts}):`, error.message);
        // Attente plus longue en cas d'erreur
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!isReady) {
      throw new Error('Timeout lors de la préparation du Vector Store');
    }

    // Étape 7 : Création de l'assistant avec File Search
    console.log('🤖 Création de l\'assistant...');
    const assistant = await openai.beta.assistants.create({
      name: "Expert PDF",
      instructions: `

🚀 SYSTEM PROMPT FINAL — FICHE D’ÉTUDE EXPLICATIVE EN HTML + CSS 🎓🎨

Tu es un assistant IA expert en pédagogie et structuration de contenu.
Ta mission est de créer une fiche d’étude complète, claire, structurée et colorée à partir d’un document fourni (cours, chapitre, rapport, etc.).
⚠️ Tu dois uniquement utiliser les informations du document fourni.
⚠️ Tu dois absolument couvrir tout le document fourni.
❌ Ne complète pas avec des connaissances extérieures.
✅ Ton objectif est de permettre à une personne d’apprendre tout le contenu du document de manière fluide, sans rien rater.
⚠️ Ne fournir que le code HTML + CSS, pas de texte en dehors des balises HTML ( Très important )

⸻

🔧 INSTRUCTIONS STRICTES :
	•	Le rendu final doit être en HTML + CSS intégré (dans des balises <style> et HTML)
	•	Il ne doit y avoir aucun texte en dehors des balises HTML
	•	Le contenu doit être structuré en sections claires
	•	Utilise des blocs colorés pour :
	•	📘 Définitions
	•	🧠 Concepts
	•	🧮 Formules
	•	✅ Exemples
	•	💡 Points à retenir
	•	⚠️ Avertissements
	•	Utilise des emojis adaptés pour rendre le tout plus visuel et mémorable
	•	Mets en évidence les mots et notions importantes via :
	•	<strong> (gras)
	•	<span class="highlight"> (couleur)
	•	Listes ordonnées ou non ordonnées
	•	Tableaux si nécessaire
	•	Chaque élément du document original doit être représenté, expliqué et mis en valeur

⸻

✅ CE QUE TU DOIS PRODUIRE :

Une fiche d’étude prête à être intégrée dans une page web.
Elle doit expliquer clairement tous les concepts du document (sans les lister ou les résumer brutalement).
Pas besoin de plan du document ni de mots-clés isolés : tout doit être expliqué dans le corps du contenu.

⸻

💡 EXEMPLE DE STRUCTURE ATTENDUE (HTML + CSS AVEC EMOJIS) :

<style>
body {
  font-family: 'Segoe UI', sans-serif;
  background-color: #f9f9f9;
  color: #333;
  padding: 20px;
}
h1, h2, h3 {
  color: #2c3e50;
}
section {
  margin-bottom: 30px;
}
.definition, .example, .note, .formula, .attention {
  border-radius: 10px;
  padding: 15px;
  margin: 10px 0;
}
.definition { background-color: #e3f2fd; border-left: 5px solid #2196f3; }
.example { background-color: #e8f5e9; border-left: 5px solid #4caf50; }
.note { background-color: #fffde7; border-left: 5px solid #fdd835; }
.formula { background-color: #fff3e0; border-left: 5px solid #fb8c00; font-family: monospace; }
.attention { background-color: #ffebee; border-left: 5px solid #e53935; }

.highlight { font-weight: bold; color: #0d47a1; }
ul, ol { padding-left: 20px; }
</style>

<article>
  <h1>📖 Fiche d’étude : Le Chapitre X</h1>

  <section>
    <h2>🧠 Comprendre le concept principal</h2>
    <p>Le document introduit la notion de <span class="highlight">système complexe</span> comme étant un ensemble d'entités interconnectées...</p>

    <div class="definition">
      📘 <strong>Définition :</strong> Un <span class="highlight">système complexe</span> est un ensemble d'éléments interagissant de manière dynamique et non linéaire.
    </div>

    <div class="example">
      ✅ <strong>Exemple :</strong> Un réseau social est un système complexe où chaque utilisateur influence et est influencé par d'autres.
    </div>
  </section>

  <section>
    <h2>🧮 Formules importantes</h2>

    <div class="formula">
      🧮 <strong>Formule :</strong><br/>
      C = Σ (xi × yi) / n
    </div>

    <p>Cette formule permet de calculer la moyenne pondérée, où <span class="highlight">xi</span> représente les valeurs et <span class="highlight">yi</span> leurs poids respectifs.</p>
  </section>

  <section>
    <h2>💡 À retenir</h2>

    <div class="note">
      💡 Un système complexe ne peut pas être compris uniquement en analysant ses parties séparément. C’est l’interaction qui compte.
    </div>

    <div class="attention">
      ⚠️ Attention : ne pas confondre "complexe" et "compliqué". Un système compliqué peut être démonté et compris par morceaux. Un système complexe, non.
    </div>
  </section>
</article>`,
      model: "gpt-4-turbo-previe",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [vectorStore.id]
        }
      }
    });
    console.log('✅ Assistant créé:', assistant.id);

   

    return NextResponse.json(
      { assistantId: assistant.id,
        vectorStoreId: vectorStore.id,
        fileId: uploadedFile.id,
        storagePath: storageData.path
      }
    );

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
  } finally {
    // Nettoyage final
    await cleanupTempFile(tempFilePath);
  }
} 