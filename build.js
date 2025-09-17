#!/usr/bin/env node

// build.js - Script personalizado para build
const { build } = require('electron-builder');
const path = require('path');

async function buildApp() {
  console.log('🔨 Iniciando build do aplicativo...');
  
  try {
    // Configurações específicas do build
    const config = {
      config: {
        appId: 'com.gbsistemas.prefeitura',
        productName: 'GB Sistemas - Prefeitura',
        directories: {
          output: 'dist',
          buildResources: 'assets'
        },
        files: [
          '**/*',
          '!**/node_modules/**/{CHANGELOG.md,README.md,readme.md,test,__tests__,tests,powered-test,example,examples}',
          '!**/node_modules/*.d.ts',
          '!tests/**/*',
          '!.github/**/*'
        ],
        win: {
          target: [
            { target: 'nsis', arch: ['x64'] },
            { target: 'portable', arch: ['x64'] }
          ],
          icon: 'assets/icon.ico'
        },
        mac: {
          target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
          icon: 'assets/icon.icns'
        },
        linux: {
          target: [
            { target: 'AppImage', arch: ['x64'] },
            { target: 'deb', arch: ['x64'] }
          ],
          icon: 'assets/icons'
        }
      }
    };

    // Detecta a plataforma atual
    const platform = process.platform;
    let targets;
    
    switch (platform) {
      case 'win32':
        targets = 'win';
        console.log('🪟 Building para Windows...');
        break;
      case 'darwin':
        targets = 'mac';
        console.log('🍎 Building para macOS...');
        break;
      case 'linux':
        targets = 'linux';
        console.log('🐧 Building para Linux...');
        break;
      default:
        targets = platform;
    }

    // Executa o build
    const result = await build({
      targets: targets,
      config: config.config,
      publish: 'never' // Não publica automaticamente
    });

    console.log('✅ Build concluído com sucesso!');
    console.log('📦 Arquivos gerados em: ./dist/');
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro durante o build:', error);
    process.exit(1);
  }
}

// Função para limpar diretório dist
async function cleanDist() {
  const fs = require('fs').promises;
  const distPath = path.join(process.cwd(), 'dist');
  
  try {
    await fs.rmdir(distPath, { recursive: true });
    console.log('🧹 Diretório dist limpo');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.log('⚠️  Não foi possível limpar o diretório dist:', error.message);
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    await cleanDist();
  }
  
  await buildApp();
}

// Executa se for chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { buildApp, cleanDist };