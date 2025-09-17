// preload.js
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
// Expõe um objeto 'electronAPI' para a sua página web (dashboard.html)
contextBridge.exposeInMainWorld('electronAPI', {
    // Salvar configurações
    salvarConfiguracoes: async (configuracoes) => {
        return await ipcRenderer.invoke('salvar-configuracoes', configuracoes);
    },
    
    // Carregar configurações
    carregarConfiguracoes: async () => {
        return await ipcRenderer.invoke('carregar-configuracoes');
    },
    
    // Selecionar pasta
    selecionarPasta: async () => {
        return await ipcRenderer.invoke('selecionar-pasta');
    }
});
