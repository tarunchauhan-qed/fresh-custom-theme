import { resolve, join } from 'path';
import { readdirSync, existsSync, renameSync, rmSync } from 'fs';

/**
 * Vite plugin to move component files after build
 * This plugin moves the compiled component files from dist/components
 * back to their respective component directories
 */
export function moveComponentFilesPlugin() {
  let config;

  return {
    name: 'move-component-files',
    configResolved(resolvedConfig) {
      // Store the resolved config to check if we're in watch mode
      config = resolvedConfig;
    },
    closeBundle() {
      const distComponentsPath = resolve(__dirname, '..', 'dist/components');

      if (existsSync(distComponentsPath)) {
        const componentDirs = readdirSync(distComponentsPath);

        componentDirs.forEach(componentName => {
          const sourceDir = join(distComponentsPath, componentName);
          const targetDir = resolve(__dirname, '..', 'components', componentName);

          const files = readdirSync(sourceDir);

          files.forEach(file => {
            const sourcePath = join(sourceDir, file);
            const targetPath = join(targetDir, file);

            try {
              // In build mode, move the files
              renameSync(sourcePath, targetPath);
              console.log(`Moved: ${file} to components/${componentName}/`);
            } catch (error) {
              console.error(`Error processing ${file}:`, error.message);
            }
          });

        });

        // Only clean up dist/components in build mode (not in watch mode)
        if (config.command === 'build' && !config.build.watch) {
          try {
            rmSync(distComponentsPath, { recursive: true, force: true });
            console.log('Cleaned up dist/components directory');
          } catch (error) {
            console.error('Error removing dist/components directory:', error.message);
          }
        }
      }
    }
  };
}