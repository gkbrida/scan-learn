export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      fiches: {
        Row: {
          id: string;
          created_at: string;
          titre: string;
          contenu: string;
          matiere_id: string;
          user_id: string;
          vector_store_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          titre: string;
          contenu: string;
          matiere_id: string;
          user_id: string;
          vector_store_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          titre?: string;
          contenu?: string;
          matiere_id?: string;
          user_id?: string;
          vector_store_id?: string | null;
        };
      };
      matieres: {
        Row: {
          id: string;
          created_at: string;
          nom: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          nom: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          nom?: string;
          user_id?: string;
        };
      };
      qcm: {
        Row: {
          id: string;
          created_at: string;
          question: string;
          options: Json;
          reponse: string;
          fiche_id: string;
          user_id: string;
          matiere_id: string;
          resultat: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          question: string;
          options: Json;
          reponse: string;
          fiche_id: string;
          user_id: string;
          matiere_id: string;
          resultat?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          question?: string;
          options?: Json;
          reponse?: string;
          fiche_id?: string;
          user_id?: string;
          matiere_id?: string;
          resultat?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
} 