import { useState, useEffect, useRef } from 'react';

export default function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBase64, setAudioBase64] = useState(null);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const isWebSpeechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (isWebSpeechSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'pt-BR';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
        setAudioBase64(null);
      };

      rec.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [isWebSpeechSupported]);

  const startListening = async () => {
    setError(null);
    setTranscript('');
    setAudioBase64(null);

    if (isWebSpeechSupported) {
      try {
        recognitionRef.current.start();
        return;
      } catch (e) {
        console.warn('WebSpeech already started, falling back to MediaRecorder:', e);
      }
    }

    // Fallback: Gravação de Áudio via MediaRecorder (100% compatível com celulares)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Data = reader.result;
          setAudioBase64(base64Data);
          setTranscript('Áudio gravado com sucesso! Processando com IA...');
        };

        // Parar todos os tracks para liberar o microfone
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      console.error('Microfone indisponível no dispositivo:', err);
      setError('Permissão de microfone negada ou não suportada.');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (isWebSpeechSupported && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        return;
      } catch (e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('MediaRecorder stop error:', e);
      }
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setAudioBase64(null);
  };

  return {
    isListening,
    transcript,
    audioBase64,
    error,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition: true, // Sempre suportado via Gravação Multimodal
  };
}
