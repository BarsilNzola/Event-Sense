/// <reference types="vite/client" />

interface ImportMetaEnv {
    // AI/ML Services
    VITE_WALLETCONNECT_PROJECT_ID: string;
}
  
interface ImportMeta {
    readonly env: ImportMetaEnv;
}