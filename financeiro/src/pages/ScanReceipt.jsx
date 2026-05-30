// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CATEGORIES } from '@/lib/constants';
import useSpeechToText from '@/hooks/useSpeechToText';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Check,
  X,
  CreditCard as CardIcon,
  Circle,
  Building,
  User,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function ScanReceipt() {
  const [step, setStep] = useState('voice'); // voice, processing, review
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Lista de cartões para vincular se for Cartão de Crédito
  const [creditCards, setCreditCards] = useState([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    category: 'outros',
    description: '',
    paymentMethod: 'money_pix', // 'money_pix', 'credit_card'
    flowType: 'pessoal', // 'pessoal', 'empresa'
    type: 'saida', // 'entrada', 'saida'
    linkedCardId: '',
    currency: 'BRL',
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Custom hook de voz
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechToText();

  // Ref e Effect para detectar fim automático da fala e enviar pra processar
  const wasListening = useRef(false);

  useEffect(() => {
    if (isListening) {
      wasListening.current = true;
    } else if (wasListening.current) {
      wasListening.current = false;
      if (transcript.trim()) {
        processVoiceText(transcript);
      }
    }
  }, [isListening, transcript]);

  // Carregar cartões de crédito disponíveis do usuário
  useEffect(() => {
    async function loadCards() {
      try {
        const cards = await base44.entities.CreditCard.list();
        setCreditCards(cards);
        if (cards.length > 0 && !formData.linkedCardId) {
          setFormData(prev => ({ ...prev, linkedCardId: cards[0].id }));
        }
      } catch (err) {
        console.error("Erro ao carregar cartões:", err);
      }
    }
    loadCards();
  }, []);

  // Monitora a finalização da fala e envia para o backend
  const handleStopRecording = async () => {
    stopListening();
  };

  const processVoiceText = async (textToParse) => {
    setStep('processing');
    setIsProcessing(true);

    try {
      // Envia a fala transcrevida para a inteligência artificial do backend
      const result = await base44.integrations.Core.ParseVoice(textToParse);
      
      setFormData((prev) => ({
        ...prev,
        amount: result.amount || '',
        type: result.type || 'saida',
        flowType: result.flowType || 'pessoal',
        paymentMethod: result.paymentMethod || 'money_pix',
        merchant: result.merchant || '',
        category: result.category || 'outros',
        date: result.date || prev.date,
        description: result.description || '',
      }));

      toast({ title: 'Comando processado!', description: 'Extraímos os dados da sua fala com sucesso.' });
      setStep('review');
    } catch (e) {
      toast({ 
        title: 'Falha no processamento', 
        description: 'Não foi possível interpretar a fala automaticamente. Insira os dados manualmente ou tente de novo.', 
        variant: 'destructive' 
      });
      setStep('review'); // Permite preenchimento manual
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Expense.create({
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        linkedCardId: formData.paymentMethod === 'credit_card' ? formData.linkedCardId : null
      });

      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Transação salva!', description: 'Seu controle financeiro foi atualizado.' });
      navigate('/');
    } catch (err) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto min-h-[80vh] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          🎙️ Assistente de Voz <span className="text-[10px] bg-primary/20 text-primary py-0.5 px-2 rounded-full uppercase font-mono">IA</span>
        </h1>
        {step !== 'voice' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep('voice');
              resetTranscript();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-1 animate-spin-hover" /> Tentar de Novo
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col justify-between py-6"
          >
            {/* Bloco de ajuda */}
            <div className="bg-accent/20 border border-accent/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-primary mb-2 font-semibold text-sm">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Experimente falar naturalmente:</span>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground list-disc pl-4 leading-relaxed">
                <li><span className="text-foreground italic">"Gastei 55 reais de almoço pessoal no cartão"</span></li>
                <li><span className="text-foreground italic">"Recebi 1200 reais de vendas da empresa hoje"</span></li>
                <li><span className="text-foreground italic">"Comprei 120 reais de combustível na empresa"</span></li>
              </ul>
            </div>

            {/* Onda Animada de Áudio & Botão central de gravação */}
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <div className="relative flex items-center justify-center">
                {/* Ondas animadas ao redor do botão */}
                {isListening && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-28 h-28 bg-primary/20 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 2.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-28 h-28 bg-primary/10 rounded-full"
                    />
                    <div className="absolute flex gap-1 items-center justify-center">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: isListening ? [10, h * 12, 10] : 10 }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                          className="w-1.5 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Botão de gravação principal */}
                <button
                  onClick={isListening ? handleStopRecording : startListening}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4 ${
                    isListening 
                      ? 'bg-destructive border-destructive/20 text-white shadow-destructive/30 scale-105' 
                      : 'bg-primary border-primary/20 text-primary-foreground shadow-primary/30 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10 animate-pulse" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>

              <div className="text-center mt-8">
                <p className="text-base font-bold text-foreground">
                  {isListening ? 'Ouvindo você...' : 'Toque para falar'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[250px] mx-auto leading-relaxed">
                  {isListening ? 'Fale a transação de forma natural. Ao terminar, toque no botão novamente.' : 'A nossa inteligência artificial processará o valor, categoria e tipo de carteira.'}
                </p>
              </div>
            </div>

            {/* Transcrição ao vivo */}
            <div className="min-h-[100px] bg-card border border-border rounded-2xl p-4 flex flex-col justify-between">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Transcrição em Tempo Real</Label>
              <p className={`text-sm mt-2 leading-relaxed ${transcript ? 'text-foreground font-medium' : 'text-muted-foreground italic'}`}>
                {transcript || 'Sua voz aparecerá aqui...'}
              </p>
              {error && (
                <span className="text-xs text-destructive mt-2 flex items-center gap-1">
                  ⚠️ Erro de microfone: {error}
                </span>
              )}
            </div>

            <div className="mt-4">
              <Button
                variant="ghost"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setStep('review')}
              >
                Digitar dados manualmente
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center py-16"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-lg font-extrabold text-foreground">Processando com Gemini...</p>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed mb-6">
              A nossa IA está dividindo os caixas, entendendo a moeda e formatando a sua transação.
            </p>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </motion.div>
        )}

        {step === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 space-y-4 py-2"
          >
            {/* Banner Informativo */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
              <p className="text-xs text-foreground font-medium">
                {formData.amount 
                  ? 'Transação extraída! Por favor, revise as informações e salve.' 
                  : 'Fale seu gasto no microfone ou preencha as informações abaixo.'}
              </p>
            </div>

            {/* Alternador Rápido de Tipo de Transação */}
            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
              <button
                type="button"
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.type === 'saida'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => updateField('type', 'saida')}
              >
                🔴 Despesa / Saída
              </button>
              <button
                type="button"
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  formData.type === 'entrada'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => updateField('type', 'entrada')}
              >
                🟢 Receita / Entrada
              </button>
            </div>

            {/* Seletor CPF vs CNPJ (Pessoal vs Empresa) */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => updateField('flowType', 'pessoal')}
                className={`border rounded-xl p-3 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] ${
                  formData.flowType === 'pessoal' 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.flowType === 'pessoal' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Pessoal</p>
                  <p className="text-[9px] text-muted-foreground">Carteira CPF</p>
                </div>
              </div>
              <div 
                onClick={() => updateField('flowType', 'empresa')}
                className={`border rounded-xl p-3 flex items-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] ${
                  formData.flowType === 'empresa' 
                    ? 'border-purple-500 bg-purple-500/5 shadow-sm' 
                    : 'border-border bg-card'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.flowType === 'empresa' ? 'bg-purple-500/20 text-purple-500' : 'bg-muted text-muted-foreground'}`}>
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Empresa</p>
                  <p className="text-[9px] text-muted-foreground">Carteira CNPJ</p>
                </div>
              </div>
            </div>

            {/* Valor & Data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  className="mt-1.5 h-11 text-base font-semibold"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="mt-1.5 h-11 text-xs"
                />
              </div>
            </div>

            {/* Estabelecimento */}
            <div>
              <Label className="text-xs font-bold">Estabelecimento / Origem</Label>
              <Input
                placeholder="Nome do local ou da fonte"
                value={formData.merchant}
                onChange={(e) => updateField('merchant', e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>

            {/* Categoria & Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
                  <SelectTrigger className="mt-1.5 h-11 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-bold">Forma de Pagamento</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => updateField('paymentMethod', v)}
                >
                  <SelectTrigger className="mt-1.5 h-11 text-xs">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="money_pix" className="text-xs">💵 PIX / Dinheiro</SelectItem>
                    <SelectItem value="credit_card" className="text-xs">💳 Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seleção do Cartão se for Cartão de Crédito */}
            {formData.paymentMethod === 'credit_card' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <CardIcon className="w-3 h-3 text-primary" /> Vincular ao Cartão
                </Label>
                {creditCards.length > 0 ? (
                  <Select
                    value={formData.linkedCardId}
                    onValueChange={(v) => updateField('linkedCardId', v)}
                  >
                    <SelectTrigger className="h-11 text-xs">
                      <SelectValue placeholder="Selecionar cartão..." />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((card) => (
                        <SelectItem key={card.id} value={card.id} className="text-xs">
                          {card.name} (Fechamento: dia {card.closingDay})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="border border-dashed border-border rounded-xl p-2.5 flex items-center justify-between text-xs bg-muted/40">
                    <span className="text-muted-foreground">Nenhum cartão cadastrado.</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/projects')} // Onde cadastramos os cartões/projetos
                      className="h-7 text-[10px] gap-1 font-bold text-primary"
                    >
                      <Plus className="w-3 h-3" /> Criar Cartão
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Descrição */}
            <div>
              <Label className="text-xs font-bold">Descrição Opcional</Label>
              <Textarea
                placeholder="Ex: compra de suprimentos para o escritório..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="mt-1.5 text-xs"
                rows={2}
              />
            </div>

            {/* Botão de Gravação Principal */}
            <div className="pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.amount}
                className="w-full h-12 rounded-xl text-base font-bold gap-2 shadow-lg shadow-primary/10 active:scale-95 transition-transform"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Confirmar e Salvar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}