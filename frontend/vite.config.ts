import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// Enable bundle analysis when ANALYZE env var is set
const isAnalyze = process.env.ANALYZE === 'true';

/**
 * Vite плагин для трансформации proto-сгенерированных JS файлов.
 * Добавляет polyfill для Google Closure Library (goog) и jspb.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function protobufPlugin(): any {
  return {
    name: 'protobuf-plugin',
    transform(code: string, id: string) {
      try {
        if (id.indexOf('_pb.js') !== -1) {
          const transformedCode = code
            .replace(/var jspb = require\('google-protobuf'\);?/g, "// var jspb = require('google-protobuf');")
            .replace(/var goog = jspb;?/g, 'var goog = globalThis.goog; var jspb = globalThis.jspb;');

          const polyfill = `
import * as jspb from 'google-protobuf';

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

if (typeof globalThis.goog === 'undefined') {
  globalThis.goog = {
    exportSymbol: function(name, value, scope) {
      // Create nested namespace path (e.g., 'proto.project.Project')
      const parts = name.split('.');
      let current = scope || globalThis;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
    },
    inherits: function(child, parent) {
      child.prototype = Object.create(parent.prototype);
      child.prototype.constructor = child;
    },
    DEBUG: false
  };
}

if (typeof globalThis.jspb === 'undefined') {
  globalThis.jspb = jspb;
}

if (typeof globalThis.proto === 'undefined') {
  const protoNamespace = { auth: {}, user: {}, admin: {} };
  globalThis.proto = protoNamespace;
}

// Ensure all jspb methods are available
try {
  if (globalThis.jspb && globalThis.jspb.BinaryReader && globalThis.jspb.BinaryReader.prototype) {
    const reader = globalThis.jspb.BinaryReader.prototype;
    if (reader && !reader.readStringRequireUtf8 && reader.readString) {
      reader.readStringRequireUtf8 = reader.readString;
    }
  }
} catch (error) {
  console.warn('Failed to setup jspb polyfill:', error);
}

const goog = globalThis.goog;
const global = globalThis.global;
const COMPILED = false;
`;
          return { code: polyfill + transformedCode };
        }
        return null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Protobuf transform error:', { error: errorMessage, file: id });
        return null;
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    protobufPlugin(),
    // Gzip compression for JS and CSS files
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      filter: /\.(js|css)$/i,
    }),
    // Brotli compression for JS and CSS files
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      filter: /\.(js|css)$/i,
    }),
    // Bundle visualizer - generates stats.html when ANALYZE=true
    isAnalyze &&
    visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      app: path.resolve(__dirname, './src/app'),
      pages: path.resolve(__dirname, './src/pages'),
      widgets: path.resolve(__dirname, './src/widgets'),
      features: path.resolve(__dirname, './src/features'),
      entities: path.resolve(__dirname, './src/entities'),
      shared: path.resolve(__dirname, './src/shared'),
    },
  },
  envDir: './src/shared/config',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:44044',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 500, // 500 KB warning threshold
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui-core': ['@mui/material'],
          'vendor-mui-icons': ['@mui/icons-material'],
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          'vendor-grpc': ['google-protobuf', 'grpc-web'],
        },
        // Deterministic chunk naming for consistent caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
