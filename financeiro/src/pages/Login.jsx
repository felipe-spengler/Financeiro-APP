import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Mail, User, Wallet, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [backendVersion, setBackendVersion] = useState('...');
  
  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setBackendVersion(data.version))
      .catch(() => setBackendVersion('offline'));
  }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const { checkAppState } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o e-mail e a senha.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister ? { email, password, name } : { email, password };
      
      const response = await apiClient.post(endpoint, payload);
      const { token } = response.data;
      
      // Salvar token e atualizar estado global de autenticação
      localStorage.setItem('token', token);
      await checkAppState();
      
      toast({
        title: isRegister ? "Conta criada com sucesso!" : "Bem-vindo de volta!",
        description: "Acessando seu painel financeiro inteligente..."
      });
    } catch (err) {
      console.error(err);
      toast({
        title: isRegister ? "Erro no cadastro" : "Erro no login",
        description: err.response?.data?.error || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary to-purple-500" />
          
          <CardHeader className="space-y-2 text-center pt-8">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
              <Wallet className="w-6 h-6 text-white animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-extrabold tracking-tight text-white">
              FinanceiroApp
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Controle de contas duplas por voz com inteligência artificial
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="space-y-1.5"
                  >
                    <Label htmlFor="name" className="text-xs font-bold text-slate-300">Seu Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input
                        id="name"
                        placeholder="Como deseja ser chamado"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-10 bg-slate-950/50 border-slate-800 focus:border-primary text-slate-200"
                        required={isRegister}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold text-slate-300">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-slate-950/50 border-slate-800 focus:border-primary text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-300">Senha</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 bg-slate-950/50 border-slate-800 focus:border-primary text-slate-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-bold rounded-xl mt-4 gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {isRegister ? "Criar Conta Grátis" : "Entrar no App"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 pb-8 pt-2">
            <div className="text-center text-xs text-slate-400">
              {isRegister ? "Já possui uma conta?" : "Novo por aqui?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setEmail('');
                  setPassword('');
                  setName('');
                }}
                className="font-bold text-primary hover:underline hover:text-primary-hover"
              >
                {isRegister ? "Faça login" : "Crie uma conta"}
              </button>
            </div>
            <div className="text-[10px] text-slate-600 font-mono tracking-wider">
              Versão {localStorage.getItem('app_version') || '1.0.0'} (Servidor: {backendVersion})
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
