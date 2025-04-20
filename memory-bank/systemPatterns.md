# Patterns Système

## Architecture
L'application suit une architecture Next.js moderne avec :
- API Routes pour la logique backend
- Components React pour l'interface utilisateur
- Intégration OpenAI pour l'analyse
- Supabase pour le stockage

## Patterns Clés

### 1. Pattern de Polling
```typescript
// Pattern de polling avec useRef pour la gestion d'état
const intervalRef = useRef<NodeJS.Timeout | null>(null);
const pollingRef = useRef<boolean>(true);

// Logique de polling
intervalRef.current = setInterval(() => {
  if (pollingRef.current) {
    pollThread();
  }
}, 10000);
```

### 2. Gestion d'État
- Utilisation de `useState` pour l'état UI
- `useRef` pour les valeurs persistantes entre les renders
- État de chargement et d'erreur distincts

### 3. Pattern de Nettoyage
```typescript
// Cleanup pattern dans useEffect
return () => {
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
  pollingRef.current = false;
};
```

### 4. Gestion des Erreurs
- Vérification systématique des réponses API
- Messages d'erreur contextuels
- Arrêt propre du polling en cas d'erreur

## Composants Principaux

### ThreadResults
- Gère l'affichage des résultats d'analyse
- Implémente le polling
- Gère les états et erreurs
- Affiche les messages de l'assistant

## Interactions Système
1. Upload de fichier → OpenAI
2. Création d'assistant → OpenAI
3. Création de thread → OpenAI
4. Polling des résultats → API locale
5. Stockage des résultats → Supabase 