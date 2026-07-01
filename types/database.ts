export type Database = {
  public: {
    Tables: {
      centres: {
        Row: { id: string; name: string; created_at: string };
        Insert: { id?: string; name: string; created_at?: string };
        Update: { id?: string; name?: string; created_at?: string };
      };
      profiles: {
        Row: {
          id: string;
          centre_id: string;
          display_name: string;
          role: "teacher" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          centre_id: string;
          display_name: string;
          role?: "teacher" | "admin";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      students: {
        Row: {
          id: string;
          centre_id: string;
          name: string;
          grade_level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id: string;
          name: string;
          grade_level?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      grading_results: {
        Row: {
          id: string;
          centre_id: string;
          student_id: string;
          created_by: string | null;
          question_number: string;
          sub_question_blank: string | null;
          subject: string;
          student_answer: string | null;
          correct_answer: string | null;
          is_correct: boolean;
          explanation_cantonese: string | null;
          topic_tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          centre_id: string;
          student_id: string;
          created_by?: string | null;
          question_number: string;
          sub_question_blank?: string | null;
          subject: string;
          student_answer?: string | null;
          correct_answer?: string | null;
          is_correct: boolean;
          explanation_cantonese?: string | null;
          topic_tags?: string[];
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["grading_results"]["Insert"]
        >;
      };
    };
  };
};

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type GradingResultRow =
  Database["public"]["Tables"]["grading_results"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
