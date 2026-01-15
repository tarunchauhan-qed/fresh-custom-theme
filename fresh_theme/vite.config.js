import { defineConfig } from 'vite';
import { resolve, relative } from 'path';
import { readdirSync, existsSync, cpSync, mkdirSync } from 'fs';
import tailwindcss from '@tailwindcss/vite';
import { moveComponentFilesPlugin } from './vite-plugins/moveComponentFiles.js';

// Changing server port implies changing the port in theme settings.
const serverPort = 3000;
const serverProtocol = 'https';

// Override with the domain of your site for specific origins.
// let serverOriginHost = 'https://my-drupal-site.ddev.site';
let serverOriginHost = null;

// Try to deduce server host from most known drupal local infrastructures.
if (serverOriginHost == null) {
  let serverHostEnvVarCandidates = [
    'DDEV_HOSTNAME',
    'VIRTUAL_HOST',
  ];

  for (let serverHostEnvVarIndex in serverHostEnvVarCandidates) {
    let serverHostEnvVar = serverHostEnvVarCandidates[serverHostEnvVarIndex];
    if (process.env[serverHostEnvVar] != null) {
      serverOriginHost = process.env[serverHostEnvVar];
      break;
    }
  }

}

const componentsDir = 'components';
let inputDeclaration = [];
let components = {};

// Plugin to copy multiple folders from node_modules to dist/vendor/
function copyVendorFoldersPlugin(folderNames = []) {
  return {
    name: 'copy-vendor-folders',
    writeBundle() {
      const nodeModulesPath = resolve(__dirname, 'node_modules');
      const vendorPath = resolve(__dirname, 'dist/vendor');

      // Ensure vendor directory exists
      mkdirSync(vendorPath, { recursive: true });

      folderNames.forEach(folderName => {
        const sourcePath = resolve(nodeModulesPath, folderName);
        const destPath = resolve(vendorPath, folderName);

        if (existsSync(sourcePath)) {
          try {
            cpSync(sourcePath, destPath, { recursive: true });
            console.log(`Copied ${folderName} to dist/vendor/`);
          } catch (error) {
            console.error(`Error copying ${folderName}:`, error);
          }
        } else {
          console.warn(`Warning: ${folderName} not found in node_modules`);
        }
      });
    }
  };
}

// Components can be built using global or main vite build or isolated.
// Que diferencia hay entre añadir un fichero dentro o fuera de src?
readdirSync(componentsDir).forEach((dir) => {
  let paths = [
    resolve(__dirname, componentsDir, dir, 'src', `${dir}.ts`),
    resolve(__dirname, componentsDir, dir, 'src', `${dir}.js`),
    resolve(__dirname, componentsDir, dir, 'src', `${dir}.css`),
  ];
  paths.forEach((path) => {
    if (existsSync(path)) {
      inputDeclaration.push(path);
      components[dir] = dir;
    }
  });
});

export default defineConfig(({ command, mode }) => {
  const basePath = '/' + relative(__dirname.split('/themes/')[0], __dirname + '/');

  // Check if we're in watch mode
  const isWatchMode = process.argv.includes('--watch');

  return {
    base: basePath,
    publicDir: 'assets/',
    resolve: {
      alias: {
        '@src': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './components'),
        '@daisyui': resolve(__dirname, './src/daisyui'),
        '@swiper': resolve(__dirname, './node_modules/swiper'),
      }
    },

    server: {
      host: true,
      port: serverPort,
      allowedHosts: true,
      strictPort: true,
      cors: true,
      origin: serverProtocol + '://' + serverOriginHost + ':' + serverPort
    },
    plugins: [
      tailwindcss(),
      moveComponentFilesPlugin(),
      copyVendorFoldersPlugin(['heroicons'])
    ],
    build: {
      assetsInlineLimit: 0,
      manifest: true,
      outDir: 'dist',
      ...(isWatchMode && {
        watch: {
          // Also ignore in build watch mode
          exclude: [
            'components/*/*.js',
            'components/*/*.css'
          ]
        }
      }),
      rollupOptions: {
        input: [
          resolve(__dirname, 'src/main.ts'),
          resolve(__dirname, 'src/main.css'),
          resolve(__dirname, 'src/ckeditor.css'),
          ...inputDeclaration
        ],
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.facadeModuleId && chunkInfo.facadeModuleId.includes('/components/')) {
              const componentName = chunkInfo.facadeModuleId.split('/components/')[1].split('/')[0];
              return `components/${componentName}/${componentName}.js`;
            }
            return `[name].js`;
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name && chunkInfo.name.startsWith('vendor/')) {
              return `${chunkInfo.name}.js`;
            }
            return `chunks/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.source && assetInfo.names && assetInfo.names[0]) {
              const fileName = assetInfo.names[0];
              for (const componentName in components) {
                if (fileName.includes(componentName)) {
                  const ext = fileName.split('.').pop();
                  return `components/${componentName}/${componentName}.${ext}`;
                }
              }
            }
            return `[name].[ext]`;
          },
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return 'vendor/' + id.toString().split('node_modules/')[1].toString().replace('/', '_').split('/')[0].toString().replace('.js', '');
            }
          }
        }
      },
      emptyOutDir: false
    }
  };
});
