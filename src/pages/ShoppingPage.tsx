import { useState, useRef } from 'react';
import { recalculateAllConsumptionRates } from '@/lib/consumptionCalculator';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/PageHeader';
import { ArrowLeft, ListChecks, Camera, Search, MapPin, X, Plus, Minus, ShoppingCart, XCircle, CheckCircle } from 'lucide-react';
import { TabId } from '@/types';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

type ShoppingMode = null | 'list' | 'register' | 'category';

interface ShoppingItem {
  id: string;
  product_name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
}

const categories = [
  'Frutas', 'Verduras', 'Carnes', 'Laticínios', 'Padaria',
  'Bebidas', 'Limpeza', 'Higiene', 'Grãos', 'Temperos', 'Outros'
];

interface ShoppingPageProps {
  onNavigate: (tab: TabId) => void;
  onBack?: () => void;
}

export function ShoppingPage({ onNavigate, onBack }: ShoppingPageProps) {
  const { currency, formatCurrency: fc } = useLanguage();
  const [mode, setMode] = useState<ShoppingMode>(null);
  const [storeName, setStoreName] = useState('');
  const [storeSet, setStoreSet] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newUnit, setNewUnit] = useState('un');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('Outros');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleGeoLocation = () => {
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'pt-BR' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const road = addr.road || addr.pedestrian || addr.street || '';
          const number = addr.house_number || '';
          const shop = addr.shop || addr.supermarket || addr.building || addr.commercial || '';
          let name = '';
          if (shop) name = shop + ' - ';
          name += road;
          if (number) name += ', ' + number;
          if (!name.trim()) name = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
          setStoreName(name.trim());
          setStoreSet(true);
          toast.success('Localização obtida!');
        } catch {
          setStoreName(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
          setStoreSet(true);
          toast.info('Coordenadas salvas.');
        }
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        toast.error('Não foi possível obter localização');
      },
      { enableHighAccuracy: true }
    );
  };

  const confirmStore = () => {
    if (!storeName.trim()) {
      toast.error('Informe o local de compras');
      return;
    }
    setStoreSet(true);
  };

  const addItem = () => {
    if (!newName.trim()) return;
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      product_name: newName.trim(),
      category: newCategory,
      quantity: newQty,
      unit: newUnit,
      price: parseFloat(newPrice) || 0,
    }]);
    setNewName('');
    setNewQty(1);
    setNewPrice('');
    setNewCategory('Outros');
    setShowAddForm(false);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, delta: number) => {
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const finishShopping = () => {
    if (items.length === 0) {
      toast.error('Nenhum item adicionado');
      return;
    }
    // Save to stock
    const existing: any[] = JSON.parse(localStorage.getItem('stock_items') || '[]');
    items.forEach(item => {
      const idx = existing.findIndex((e: any) => e.product_name.toLowerCase() === item.product_name.toLowerCase());
      if (idx >= 0) {
        existing[idx].quantity += item.quantity;
        existing[idx].last_price = item.price;
      } else {
        existing.push({
          id: crypto.randomUUID(),
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          min_quantity: 1,
          daily_consumption_rate: 0.1,
          status: 'ok',
          last_price: item.price,
        });
      }
    });
    localStorage.setItem('stock_items', JSON.stringify(existing));
    recalculateAllConsumptionRates();

    // Save to history
    const history: any[] = JSON.parse(localStorage.getItem('purchase_history') || '[]');
    items.forEach(item => {
      history.push({
        id: crypto.randomUUID(),
        product_name: item.product_name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        total_price: item.price * item.quantity,
        store_name: storeName,
        purchase_date: new Date().toISOString(),
      });
    });
    localStorage.setItem('purchase_history', JSON.stringify(history));

    toast.success(`${items.length} itens adicionados ao estoque`);
    onNavigate('home');
  };

  const cancelShopping = () => {
    setItems([]);
    setMode(null);
    setStoreSet(false);
    setStoreName('');
    onNavigate('home');
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      toast.error('Não foi possível acessar a câmera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const captureAndRecognize = () => {
    // Simulated recognition - in real app would use OCR/AI
    const recognized = ['Arroz', 'Feijão', 'Macarrão', 'Azeite'][Math.floor(Math.random() * 4)];
    setNewName(recognized);
    setShowAddForm(true);
    stopCamera();
    toast.info(`Produto reconhecido: ${recognized}`);
  };

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="pb-20">
        <PageHeader
          title="Fazer Mercado"
          subtitle="Escolha como registrar suas compras"
          onBack={onBack}
        />
        <div className="px-4 pt-4 space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => onNavigate('lists')}
            className="w-full bg-card rounded-xl border border-border p-5 text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Com Lista</p>
              <p className="text-xs text-muted-foreground">Abrir listas ativas para fazer compras</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setMode('register')}
            className="w-full bg-card rounded-xl border border-border p-5 text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Registrar</p>
              <p className="text-xs text-muted-foreground">Usar câmera para reconhecer produtos</p>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => setMode('category')}
            className="w-full bg-card rounded-xl border border-border p-5 text-left flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Search className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Por Categoria</p>
              <p className="text-xs text-muted-foreground">Buscar produto por categoria</p>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  // Store name input (before adding items)
  if (!storeSet) {
    return (
      <div className="pb-20">
        <PageHeader
          title={mode === 'register' ? 'Registrar Compra' : 'Compra por Categoria'}
          subtitle="Informe o local de compras"
          onBack={() => setMode(null)}
        />
        <div className="px-4 pt-6 space-y-4">
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <label className="text-sm font-medium text-foreground">Nome do mercado</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Supermercado Extra"
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">ou</span>
              <button
                onClick={handleGeoLocation}
                disabled={geoLoading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-accent text-primary text-xs font-medium"
              >
                <MapPin className="w-3.5 h-3.5" />
                {geoLoading ? 'Obtendo...' : 'Usar localização'}
              </button>
            </div>
          </div>
          <button
            onClick={confirmStore}
            className="w-full p-3 rounded-xl gradient-primary text-primary-foreground text-sm font-bold"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // Active shopping session
  return (
    <div className="pb-20">
      <PageHeader
        title="Compras em andamento"
        subtitle={storeName}
        onBack={() => { setStoreSet(false); setMode(null); }}
      />

      {/* Total bar */}
      <div className="px-4 pt-3">
        <div className="bg-card rounded-xl border border-primary/30 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">{items.length} itens</span>
          </div>
          <span className="text-lg font-bold text-primary">{fc(total)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 pt-3 flex gap-2">
        <button onClick={finishShopping} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold">
          <CheckCircle className="w-4 h-4" /> Encerrar Compras
        </button>
        <button onClick={cancelShopping} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-xs font-bold">
          <XCircle className="w-4 h-4" /> Cancelar Compras
        </button>
      </div>

      {/* Camera section for register mode */}
      {mode === 'register' && (
        <div className="px-4 pt-3">
          {!cameraActive ? (
            <button onClick={startCamera} className="w-full bg-card rounded-xl border border-border p-4 flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Abrir câmera</span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover bg-black" />
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                <button onClick={captureAndRecognize} className="px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-bold">
                  Capturar
                </button>
                <button onClick={stopCamera} className="px-4 py-2 rounded-lg bg-card border border-border text-foreground text-xs font-bold">
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category filter for category mode */}
      {mode === 'category' && (
        <div className="px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? 'gradient-primary text-primary-foreground' : 'bg-card border border-border text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add item button */}
      <div className="px-4 pt-3">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-card rounded-xl border border-dashed border-primary/40 p-3 flex items-center justify-center gap-2 text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar item</span>
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Novo item</span>
              <button onClick={() => setShowAddForm(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do produto"
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(Math.max(1, Number(e.target.value)))}
                className="w-16 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm text-center"
              />
              <select
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="g">g</option>
                <option value="ml">ml</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={`${currency} 0,00`}
                className="w-24 p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
              />
            </div>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={addItem} className="w-full p-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold">
              Adicionar
            </button>
          </motion.div>
        )}
      </div>

      {/* Items list */}
      <div className="px-4 pt-3 space-y-2">
        <AnimatePresence>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                <p className="text-xs text-muted-foreground">{item.category} · {fc(item.price)}/{item.unit}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <Minus className="w-3 h-3 text-foreground" />
                </button>
                <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                  <Plus className="w-3 h-3 text-foreground" />
                </button>
              </div>
              <button onClick={() => removeItem(item.id)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
