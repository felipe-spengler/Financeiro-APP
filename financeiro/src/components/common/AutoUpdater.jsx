import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Download, RefreshCw, Wallet } from 'lucide-react';
import { apiClient } from '@/api/base44Client';

export default function AutoUpdater() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'checking' | 'updating' | 'ready'
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Iniciar checagem
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      setStatus('checking');
      
      // Obter versão local (padrão é 1.0.0 na primeira instalação)
      let localVersion = localStorage.getItem('app_version') || '1.0.0';
      
      // Buscar versão mais recente do backend VPS
      const res = await apiClient.get('/version');
      const backendVersion = res.data.version;

      console.log(`[AutoUpdater] Versão Local: ${localVersion} | Versão Servidor: ${backendVersion}`);

      if (localVersion !== backendVersion) {
        console.log('[AutoUpdater] Nova versão encontrada! Iniciando download...');
        setStatus('updating');
        
        // Simular o progresso de download/descompactação de pacotes
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 5;
          setProgress(Math.min(currentProgress, 95));
          if (currentProgress >= 95) {
            clearInterval(interval);
          }
        }, 150);

        // Se houver Service Worker ativo, pedir para atualizar
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
          }
        }

        // Aguardar o download simulado e atualizar
        setTimeout(() => {
          setProgress(100);
          setStatus('ready');
          localStorage.setItem('app_version', backendVersion);
          
          setTimeout(() => {
            // Recarregar a aplicação para aplicar os arquivos atualizados
            window.location.reload();
          }, 800);
        }, 3200);
      } else {
        setStatus('idle');
      }
    } catch (err) {
      console.error('[AutoUpdater] Erro ao verificar atualizações:', err);
      setStatus('idle');
    }
  };

  if (status === 'idle') return null;

  return (
    <AnimatePresence>
      {(status === 'updating' || status === 'ready' || status === 'checking') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6"
        >
          {/* Animated Glow Background */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-purple-500/10 blur-[80px] animate-pulse delay-500" />
          </div>

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl relative z-10 overflow-hidden"
          >
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

            {/* Rotating Wallet Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-xl shadow-primary/20 mb-6 relative">
              <motion.div
                animate={status === 'updating' ? { rotate: 360 } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <Wallet className="w-8 h-8 text-white" />
              </motion.div>
              {status === 'updating' && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
                </span>
              )}
            </div>

            {/* Title / Description */}
            <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight flex items-center justify-center gap-1.5">
              {status === 'checking' && 'Buscando atualizações...'}
              {status === 'updating' && 'Atualizando seu App'}
              {status === 'ready' && 'Tudo Pronto!'}
            </h3>
            
            <p className="text-xs text-slate-400 max-w-[260px] mx-auto mb-6">
              {status === 'checking' && 'Verificando se há uma nova versão do app disponível na nuvem...'}
              {status === 'updating' && 'Baixando, descompactando e instalando novos arquivos de forma 100% automática.'}
              {status === 'ready' && 'Instalação concluída com sucesso! Inicializando...'}
            </p>

            {/* Progress Bar / Loader */}
            {status === 'checking' ? (
              <div className="flex justify-center py-2">
                <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[2px] border border-slate-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeInOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3 text-primary animate-bounce" /> {progress}% baixado
                  </span>
                  <span>v{localStorage.getItem('app_version') || '1.0.0'} ➔ Nova</span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
