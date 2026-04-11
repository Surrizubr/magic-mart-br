import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { Camera, Images, X, Loader2, Check, ArrowLeft, Package, MapPin, Trash2, AlertTriangle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type ScanMode = 'choose' | 'single' | 'multi';
type ScanStep = 'capture' | 'processing' | 'results';

interface ReceiptItem {
  id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  discount_amount: number;
  discounted_price: number;
  category: string;
}

interface AIReceiptResult {
  store_name: string;
  store_address?: string;
  date: string;
  items: ReceiptItem[];
  receipt_total: number;
  items_sum: number;
  discounted_sum: number;
  discount?: number;
  difference: number;
  notes?: string;
}

interface ScannerPageProps {
  onBack?: () => void;
}

export function ScannerPage({ onBack }: ScannerPageProps) {
  const [mode, setMode] = useState<ScanMode>('choose');
  const [step, setStep] = useState<ScanStep>('capture');
  const [images, setImages] = useState<string[]>([]);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<AIReceiptResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode('choose');
    setStep('capture');
    setImages([]);
    setProgressMsg('');
    setResult(null);
    setSaved(false);
    setEditingItem(null);
    setError(null);
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImages(prev => {
          const next = [...prev, dataUrl];
          if (mode === 'single') {
            processImages([dataUrl]);
          }
          return next;
        });
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
    setProgressMsg('Enviando imagens para análise com IA...');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-receipt', {
        body: { images: imgs },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao analisar cupom');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Add IDs to items
      const items: ReceiptItem[] = (data.items || []).map((item: any, i: number) => ({
        ...item,
        id: `ai-${i + 1}`,
        discount_amount: item.discount_amount || 0,
        discounted_price: item.discounted_price ?? item.total_price,
      }));

      const itemsSum = items.reduce((s: number, i: ReceiptItem) => s + i.total_price, 0);
      const discountedSum = items.reduce((s: number, i: ReceiptItem) => s + i.discounted_price, 0);

      setResult({
        ...data,
        items,
        items_sum: itemsSum,
        discounted_sum: discountedSum,
        difference: Math.abs((data.receipt_total || 0) - discountedSum),
      });
      setStep('results');
    } catch (err: any) {
      console.error('AI analysis error:', err);
      setError(err.message || 'Erro ao analisar cupom fiscal');
      setStep('capture');
    }
  };

  const handleSave = () => {
    if (!result) return;
    const existing = JSON.parse(localStorage.getItem('scanner_pending') || '[]');
    existing.push({
      store_name: result.store_name,
      store_address: result.store_address,
      date: result.date,
      items: result.items,
      total: result.receipt_total,
      saved_at: new Date().toISOString(),
    });
    localStorage.setItem('scanner_pending', JSON.stringify(existing));
    setSaved(true);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: string | number) => {
    if (!result) return;
    const newItems = result.items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        updated.total_price = Number(updated.quantity) * Number(updated.unit_price);
        updated.discounted_price = updated.total_price - updated.discount_amount;
      }
      if (field === 'discount_amount') {
        updated.discounted_price = updated.total_price - Number(value);
      }
      return updated;
    });
    const newSum = newItems.reduce((s, i) => s + i.total_price, 0);
    const newDiscountedSum = newItems.reduce((s, i) => s + i.discounted_price, 0);
    setResult({
      ...result,
      items: newItems,
      items_sum: newSum,
      discounted_sum: newDiscountedSum,
      difference: Math.abs(result.receipt_total - newDiscountedSum),
    });
  };

  const removeItem = (id: string) => {
    if (!result) return;
    const newItems = result.items.filter(i => i.id !== id);
    const newSum = newItems.reduce((s, i) => s + i.total_price, 0);
    const newDiscountedSum = newItems.reduce((s, i) => s + i.discounted_price, 0);
    setResult({
      ...result,
      items: newItems,
      items_sum: newSum,
      discounted_sum: newDiscountedSum,
      difference: Math.abs(result.receipt_total - newDiscountedSum),
    });
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
            🤖 Análise inteligente com IA — reconhecimento avançado
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
                Para cupons longos — tire várias fotos e a IA consolida tudo
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
        <PageHeader title="Scanner" subtitle="Analisando com IA..." />
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-foreground">{progressMsg}</p>
            <p className="text-xs text-muted-foreground">
              A IA está identificando todos os itens, preços e informações do cupom...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (step === 'results' && result) {
    const hasDifference = result.difference > 0.01;

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
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <input
                value={result.store_name}
                onChange={e => setResult({ ...result, store_name: e.target.value })}
                className="text-sm font-semibold text-card-foreground bg-transparent outline-none flex-1 border-b border-transparent focus:border-primary/30"
              />
            </div>

            {result.store_address && (
              <p className="text-xs text-muted-foreground pl-6">{result.store_address}</p>
            )}

            {/* Date */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">📅 Data da compra:</span>
                {result.date === new Date().toISOString().slice(0, 10) ? (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium">
                    Data não encontrada
                  </span>
                ) : (
                  <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                    Extraída do cupom
                  </span>
                )}
              </div>
              <input
                type="date"
                value={result.date}
                onChange={e => setResult({ ...result, date: e.target.value })}
                className="w-full p-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 ring-primary/30"
              />
            </div>

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Soma dos itens (original):</span>
                <span className="text-sm font-semibold text-foreground">R$ {result.items_sum.toFixed(2)}</span>
              </div>
              {result.discount != null && result.discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Desconto aplicado:</span>
                  <span className="text-sm font-semibold text-green-600">- R$ {result.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Soma com desconto:</span>
                <span className="text-sm font-bold text-primary">R$ {result.discounted_sum.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span className="text-xs font-medium text-foreground">Total do cupom:</span>
                <span className="text-sm font-bold text-primary">R$ {result.receipt_total.toFixed(2)}</span>
              </div>
              {hasDifference && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 mt-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-400">
                    Diferença de R$ {result.difference.toFixed(2)} entre o total do cupom e a soma com desconto
                  </span>
                </div>
              )}
            </div>

            {result.notes && (
              <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded p-2">
                📝 {result.notes}
              </p>
            )}
          </motion.div>

          {/* Items */}
          <div className="space-y-2">
            {result.items.map((item, i) => {
              const isEditing = editingItem === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="bg-card rounded-lg shadow-card p-3"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={item.product_name}
                        onChange={e => updateItem(item.id, 'product_name', e.target.value)}
                        className="text-sm font-medium text-card-foreground bg-background border border-border rounded px-2 py-1.5 w-full outline-none focus:ring-2 ring-primary/30"
                        placeholder="Nome do produto"
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Qtd</label>
                          <input
                            type="number"
                            step="0.001"
                            value={item.quantity}
                            onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="text-xs bg-background border border-border rounded px-2 py-1.5 w-full outline-none focus:ring-2 ring-primary/30"
                          />
                        </div>
                        <div className="w-16">
                          <label className="text-[10px] text-muted-foreground">Un</label>
                          <select
                            value={item.unit}
                            onChange={e => updateItem(item.id, 'unit', e.target.value)}
                            className="text-xs bg-background border border-border rounded px-2 py-1.5 w-full outline-none"
                          >
                            {['un', 'kg', 'lt', 'l', 'ml', 'g', 'pc', 'pct', 'cx', 'dz'].map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-muted-foreground">Preço un.</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={e => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="text-xs bg-background border border-border rounded px-2 py-1.5 w-full outline-none focus:ring-2 ring-primary/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          Total: R$ {item.total_price.toFixed(2)}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)} className="h-7 text-xs">
                          <Check className="w-3 h-3 mr-1" /> OK
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-card-foreground">{item.product_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px] font-medium">{item.category}</span>
                          <span>{item.quantity} {item.unit}</span>
                          <span>× R$ {item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">R$ {item.total_price.toFixed(2)}</span>
                        <button onClick={() => setEditingItem(item.id)} className="text-muted-foreground hover:text-primary p-0.5">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive p-0.5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
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

  // Capture screen
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
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-destructive font-medium">Erro na análise</p>
              <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-destructive" />
            </button>
          </motion.div>
        )}

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
                💡 Tire fotos de todas as partes do cupom. A IA vai unir e consolidar automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Process button */}
        {mode === 'multi' && images.length > 0 && (
          <Button
            onClick={() => processImages(images)}
            className="w-full gradient-primary text-primary-foreground border-0 h-11"
          >
            <Check className="w-4 h-4 mr-2" />
            Processar {images.length} foto(s) com IA
          </Button>
        )}
      </div>
    </div>
  );
}
