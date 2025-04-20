# Contexte Technique

## Stack Technique
- **Frontend**: Next.js avec TypeScript
- **Backend**: Next.js API Routes
- **Base de données**: Supabase
- **AI**: OpenAI API
- **Styling**: Tailwind CSS

## Dépendances Principales
- Next.js
- React
- OpenAI Node.js SDK
- Supabase Client
- TypeScript
- Tailwind CSS

## Configuration Requise
- Node.js
- Variables d'environnement pour OpenAI et Supabase
- Configuration Supabase

## Patterns TypeScript
```typescript
// Interfaces principales
interface Message {
  id: string;
  role: string;
  content: string;
}

interface ThreadResultsProps {
  threadId: string;
}
```

## Gestion des États
- États UI avec React hooks
- États persistants avec useRef
- États asynchrones avec polling

## Sécurité
- Validation des entrées utilisateur
- Gestion sécurisée des clés API
- Timeouts pour les opérations longues

## Performance
- Polling optimisé (10s)
- Limite de tentatives (3 max)
- Nettoyage des ressources
- Gestion de la mémoire 