/// <reference types="vite/client" />

interface ImportMetaEnv {
    // AI/ML Services
    readonly VITE_HUGGINGFACE_API_KEY: string;
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}