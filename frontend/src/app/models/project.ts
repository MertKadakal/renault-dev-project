export interface Project {
  id: number;
  uygulamaAdi: string;
  sektorluk: string;
  tanimUygulamaAciklama?: string | null;
  canliUrl: string;
  testUrl: string;
  aktifPasif: string;
  frontend: string;
  feVersion?: string | null;
  backend: string;
  beVersion?: string | null;
  databaseType: string;
  platform: string;
  deSorumlu: string;
  stSorumlu?: string | null;
  complexity: string;
  customFields?: Record<string, string>;
  createdAt: string; 
}