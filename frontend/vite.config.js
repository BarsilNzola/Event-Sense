import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 👇 Load .env from project root (one level up from frontend directory)
  const envDir = '../'; // Go up one level to project root
  const env = loadEnv(mode, envDir);
  
  console.log('🔧 Vite Config: Loading environment variables from', envDir);
  console.log('🔧 Available VITE_* variables:', Object.keys(env).filter(key => key.startsWith('VITE_')));
  
  // Automatically include all VITE_* environment variables
  const envVariables = {};
  Object.keys(env).forEach(key => {
    if (key.startsWith('VITE_')) {
      envVariables[`import.meta.env.${key}`] = JSON.stringify(env[key]);
      console.log(`🔧 Loaded: ${key} = ${env[key] ? '***' : 'undefined'}`);
    }
  });

  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),
    ],
    define: envVariables,
    envDir: envDir, // Explicitly set the env directory
    server: {
      port: 3000,
      open: true, // Automatically open browser
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});