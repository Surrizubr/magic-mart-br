import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { Camera, Images, X, Loader2, Check, Plus, ArrowLeft, Package, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseReceipt, ParsedItem, ParsedReceipt } from '@/lib/receiptParser';
import Tesseract from 'tesseract.js';

type ScanMode = 'choose' | 'single' | 'multi';
type ScanStep = 'capture' | 'processing' | 'results';

interface ScannerPageProps {
  onBack?: () => void;
}

export function ScannerPage({ onBack }: ScannerPageProps) {
  const [mode, setMode] = useState<ScanMode>('choose');
  const [step, setStep] = useState<ScanStep>('capture');
  const [images, setImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<ParsedReceipt | null>(null);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode('choose');
    setStep('capture');
    setImages([]);
    setProgress(0);
    setProgressMsg('');
    setResult(null);
    setSaved(false);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImages(prev => [...prev, dataUrl]);
        if (mode === 'single') {
          // auto-process single photo
          processImages([dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  }, [mode]);

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const processImages = async (imgs: string[]) => {
    setStep('processing');
    setProgress(0);
    setProgressMsg('Preparando OCR...');

    const ocrTexts: string[] = [];
    for (let i = 0; i < imgs.length; i++) {
      setProgressMsg(`Lendo imagem ${i + 1} de ${imgs.length}...`);
      try {
        const res = await Tesseract.recognize(imgs[i], 'por', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const singleProgress = (i + (m.progress || 0)) / imgs.length;
              setProgress(Math.round(singleProgress * 100));
            }
          },
        });
        ocrTexts.push(res.data.text);
      } catch {
        ocrTexts.push('');
      }
    }

    setProgressMsg('Analisando cupom fiscal...');
    setProgress(100);

    const parsed = parseReceipt(ocrTexts);
    setResult(parsed);
    setStep('results');
  };

  const handleSave = () => {
    if (!result) return;
    // Save to localStorage as pending stock/history entries
    const existing = JSON.parse(localStorage.getItem('scanner_pending') || '[]');
    existing.push({
      ...result,
      saved_at: new Date().toISOString(),
    });
    localStorage.setItem('scanner_pending', JSON.stringify(existing));
    setSaved(true);
  };

  const updateItem = (id: string, field: keyof ParsedItem, value: string | number) => {
    if (!result) return;
    setResult({
      ...result,
      items: result.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
      total: field === 'total_price'
        ? result.items.reduce((s, i) => s + (i.id === id ? Number(value) : i.total_price), 0)
        : result.total,
    });
  };

  const removeItem = (id: string) => {
    if (!result) return;
    const newItems = result.items.filter(i => i.id !== id);
    setResult({ ...result, items: newItems, total: newItems.reduce((s, i) => s + i.total_price, 0) });
  };

  // Mode selection screen
  if (mode === 'choose') {
    return (
      <div className="pb-20">
        <PageHeader title="Scanner" subtitle="Digitalize cupons fiscais" onBack={onBack} />
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Escaneie seus cupons fiscais para adicionar produtos automaticamente ao estoque e histórico.
          </p>
          <p className="text-xs text-center text-primary font-medium">
            ✨ 100% offline — funciona sem internet
          </p>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setMode('single')}
            className="w-full bg-card rounded-lg shadow-card p-5 flex items-center gap-4 text-left hover:shadow-elevated transition-shadow"
          >
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Foto Única</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para cupons pequenos que cabem em uma única foto
              </p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setMode('multi')}
            className="w-full bg-card rounded-lg shadow-card p-5 flex items-center gap-4 text-left hover:shadow-elevated transition-shadow"
          >
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Images className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Múltiplas Fotos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para cupons longos — tire várias fotos e o app consolida tudo
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // Processing screen
  if (step === 'processing') {
    return (
      <div className="pb-20">
        <PageHeader title="Scanner" subtitle="Processando..." />
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">{progressMsg}</p>
            <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden mx-auto">
              <motion.div
                className="h-full gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{progress}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (step === 'results' && result) {
    return (
      <div className="pb-20">
        <PageHeader
          title="Resultado"
          subtitle={`${result.items.length} itens encontrados`}
          action={
            <button onClick={reset} className="text-sm text-primary font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Novo
            </button>
          }
        />
        <div className="p-4 space-y-4">
          {/* Store & date info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-lg shadow-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <input
                value={result.store_name}
                onChange={e => setResult({ ...result, store_name: e.target.value })}
                className="text-sm font-semibold text-card-foreground bg-transparent outline-none flex-1 border-b border-transparent focus:border-primary/30"
              />
            </div>

            {/* Date confirmation */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">📅 Data da compra:</span>
                {result.date === new Date().toISOString().slice(0, 10) ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                    Data não encontrada no cupom
                  </span>
                ) : (
                  <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                    Extraída do cupom — confirme abaixo
                  </span>
                )}
              </div>
              <input
                type="date"
                value={result.date}
                onChange={e => setResult({ ...result, date: e.target.value })}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 ring-primary/30"
              />
              <p className="text-[10px] text-muted-foreground">
                {result.date === new Date().toISOString().slice(0, 10)
                  ? 'Não foi possível extrair a data. Por favor, insira a data de compra.'
                  : 'Verifique se a data está correta e ajuste se necessário.'}
              </p>
            </div>

            <div className="flex items-center justify-end">
              <p className="text-lg font-bold text-primary">R$ {result.total.toFixed(2)}</p>
            </div>
          </motion.div>

          {/* Items */}
          <div className="space-y-2">
            {result.items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card rounded-lg shadow-card p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input
                      value={item.product_name}
                      onChange={e => updateItem(item.id, 'product_name', e.target.value)}
                      className="text-sm font-medium text-card-foreground bg-transparent outline-none w-full border-b border-transparent focus:border-primary/30"
                    />
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-medium">{item.category}</span>
                      <span>{item.quantity} {item.unit}</span>
                      <span>× R$ {item.unit_price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">R$ {item.total_price.toFixed(2)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {result.items.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">Nenhum item encontrado no cupom.</p>
              <p className="text-xs text-muted-foreground mt-1">Tente fotografar com melhor iluminação.</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            {!saved ? (
              <Button
                onClick={handleSave}
                className="w-full gradient-primary text-primary-foreground border-0 h-11"
                disabled={result.items.length === 0}
              >
                <Package className="w-4 h-4 mr-2" />
                Salvar no Estoque e Histórico
              </Button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-primary/10 rounded-lg p-4 text-center"
              >
                <Check className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-primary">Salvo com sucesso!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.items.length} itens adicionados ao estoque e histórico
                </p>
              </motion.div>
            )}
            <Button variant="outline" onClick={reset} className="w-full">
              Escanear outro cupom
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Capture screen (single or multi)
  return (
    <div className="pb-20">
      <PageHeader
        title={mode === 'single' ? 'Foto Única' : 'Múltiplas Fotos'}
        subtitle={mode === 'single' ? 'Tire uma foto do cupom' : `${images.length} foto(s) adicionada(s)`}
        action={
          <button onClick={reset} className="text-sm text-primary font-medium flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={mode === 'multi'}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="p-4 space-y-4">
        {/* Image previews */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4"
            >
              {images.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="relative shrink-0"
                >
                  <img src={img} alt={`Foto ${i + 1}`} className="w-24 h-32 object-cover rounded-lg shadow-card" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-foreground/70 text-background text-[10px] px-1 rounded">
                    {i + 1}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Capture buttons */}
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-card rounded-lg shadow-card p-8 flex flex-col items-center gap-3 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors"
          >
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-card-foreground">
                {images.length === 0 ? 'Fotografar Cupom' : 'Adicionar Mais Fotos'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Toque para tirar foto ou selecionar da galeria
              </p>
            </div>
          </button>

          {mode === 'multi' && images.length > 0 && (
            <div className="bg-accent/50 rounded-lg p-3">
              <p className="text-xs text-accent-foreground text-center">
                💡 Tire fotos de todas as partes do cupom. O app vai unir e consolidar automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Process button */}
        {images.length > 0 && (mode === 'multi' || images.length > 0) && mode === 'multi' && (
          <Button
            onClick={() => processImages(images)}
            className="w-full gradient-primary text-primary-foreground border-0 h-11"
          >
            <Check className="w-4 h-4 mr-2" />
            Processar {images.length} foto(s)
          </Button>
        )}
      </div>
    </div>
  );
}
