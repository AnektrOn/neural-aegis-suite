import type { LibraryScope } from "@/lib/library-scope";

export type MeditationTrack = {
  id: string;
  title: string;
  duration_label: string | null;
  library_scope: LibraryScope;
  assigned_at: string;
};
