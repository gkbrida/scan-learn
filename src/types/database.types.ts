export interface Thread {
  id: number;
  created_at: string;
  thread_id: string;
  run_id: string;
  file_id: string;
  status: string;
}

export interface Database {
  public: {
    Tables: {
      threads: {
        Row: Thread;
        Insert: Omit<Thread, 'id' | 'created_at'>;
        Update: Partial<Omit<Thread, 'id' | 'created_at'>>;
      };
    };
  };
} 