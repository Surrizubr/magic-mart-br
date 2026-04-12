import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'pt' | 'en' | 'es';

const currencyByLang: Record<Lang, string> = {
  pt: 'R$',
  en: 'US$',
  es: '$',
};

const translations: Record<string, Record<Lang, string>> = {
  hello: { pt: 'Olá', en: 'Hello', es: 'Hola' },
  user: { pt: 'Usuário', en: 'User', es: 'Usuario' },
  home: { pt: 'Início', en: 'Home', es: 'Inicio' },
  lists: { pt: 'Listas', en: 'Lists', es: 'Listas' },
  stock: { pt: 'Estoque', en: 'Stock', es: 'Stock' },
  savings: { pt: 'Economizar', en: 'Savings', es: 'Ahorros' },
  history: { pt: 'Histórico', en: 'History', es: 'Historial' },
  reports: { pt: 'Relatórios', en: 'Reports', es: 'Informes' },
  scanner: { pt: 'Scanner', en: 'Scanner', es: 'Escáner' },
  themes: { pt: 'Temas', en: 'Themes', es: 'Temas' },
  languages: { pt: 'Idiomas', en: 'Languages', es: 'Idiomas' },
  preferences: { pt: 'Preferências', en: 'Preferences', es: 'Preferencias' },
  about: { pt: 'Sobre', en: 'About', es: 'Acerca de' },
  logout: { pt: 'Sair', en: 'Logout', es: 'Salir' },
  resetAll: { pt: 'Reset Geral', en: 'Reset All', es: 'Restablecer Todo' },
  deleteAccount: { pt: 'Excluir Conta', en: 'Delete Account', es: 'Eliminar Cuenta' },
  light: { pt: 'Claro', en: 'Light', es: 'Claro' },
  dark: { pt: 'Escuro', en: 'Dark', es: 'Oscuro' },
  largeText: { pt: 'Letras Grandes', en: 'Large Text', es: 'Texto Grande' },
  themeDesc: { pt: 'Aparência do aplicativo', en: 'App appearance', es: 'Apariencia de la app' },
  langDesc: { pt: 'Escolher idioma do app', en: 'Choose app language', es: 'Elegir idioma' },
  prefDesc: { pt: 'Ajustes gerais', en: 'General settings', es: 'Ajustes generales' },
  aboutDesc: { pt: 'Informações do aplicativo', en: 'App information', es: 'Información de la app' },
  logoutDesc: { pt: 'Fazer logout da conta', en: 'Log out of account', es: 'Cerrar sesión' },
  resetDesc: { pt: 'Apagar todos as listas, histórico e estoques', en: 'Delete all lists, history and stock', es: 'Borrar listas, historial y stock' },
  deleteDesc: { pt: 'Apaga permanentemente a conta', en: 'Permanently delete account', es: 'Eliminar cuenta permanentemente' },
  stockExpiry: { pt: 'Dias para excluir item do estoque', en: 'Days to delete stock item', es: 'Días para eliminar del stock' },
  days: { pt: 'dias', en: 'days', es: 'días' },
  developedBy: { pt: 'Desenvolvido por ID Apps 2026', en: 'Developed by ID Apps 2026', es: 'Desarrollado por ID Apps 2026' },
  termsText: { pt: 'Ao usar este app você aceita os termos de uso e privacidade em:', en: 'By using this app you accept the terms of use and privacy at:', es: 'Al usar esta app aceptas los términos de uso y privacidad en:' },
  login: { pt: 'Entrar', en: 'Sign In', es: 'Iniciar Sesión' },
  loginWithGoogle: { pt: 'Entrar com Google', en: 'Sign in with Google', es: 'Iniciar con Google' },
  loginWithEmail: { pt: 'Entrar com E-mail', en: 'Sign in with Email', es: 'Iniciar con E-mail' },
  email: { pt: 'E-mail', en: 'Email', es: 'Correo' },
  password: { pt: 'Senha', en: 'Password', es: 'Contraseña' },
  signUp: { pt: 'Criar conta', en: 'Sign Up', es: 'Crear cuenta' },
  noAccount: { pt: 'Não tem conta?', en: "Don't have an account?", es: '¿No tienes cuenta?' },
  hasAccount: { pt: 'Já tem conta?', en: 'Already have an account?', es: '¿Ya tienes cuenta?' },
  confirmReset: { pt: 'Tem certeza? Isso apagará todas as listas, histórico e estoque.', en: 'Are you sure? This will delete all lists, history and stock.', es: '¿Estás seguro? Esto eliminará listas, historial y stock.' },
  confirmDelete: { pt: 'Tem certeza? Sua conta será apagada permanentemente.', en: 'Are you sure? Your account will be permanently deleted.', es: '¿Estás seguro? Tu cuenta será eliminada permanentemente.' },
  confirm: { pt: 'Confirmar', en: 'Confirm', es: 'Confirmar' },
  cancel: { pt: 'Cancelar', en: 'Cancel', es: 'Cancelar' },
  newList: { pt: 'Nova Lista', en: 'New List', es: 'Nueva Lista' },
  createList: { pt: 'Criar lista de compras', en: 'Create shopping list', es: 'Crear lista de compras' },
  goShopping: { pt: 'Fazer Mercado', en: 'Go Shopping', es: 'Ir al Mercado' },
  addProducts: { pt: 'Adicionar produtos na cesta', en: 'Add products to basket', es: 'Agregar productos' },
  scan: { pt: 'Escanear', en: 'Scan', es: 'Escanear' },
  receipt: { pt: 'Nota fiscal', en: 'Receipt', es: 'Recibo' },
  share: { pt: 'Compartilhar', en: 'Share', es: 'Compartir' },
  activeLists: { pt: 'Listas ativas', en: 'Active lists', es: 'Listas activas' },
  cheapDays: { pt: 'Dias de compras mais baratos', en: 'Cheapest shopping days', es: 'Días de compras más baratos' },
  alerts: { pt: 'Alertas', en: 'Alerts', es: 'Alertas' },
  items: { pt: 'Itens', en: 'Items', es: 'Ítems' },
  active: { pt: 'Ativas', en: 'Active', es: 'Activas' },
  currentMonth: { pt: 'Mês Atual', en: 'Current Month', es: 'Mes Actual' },
  daysLeft: { pt: 'dias restantes', en: 'days left', es: 'días restantes' },
  clear: { pt: 'Limpar', en: 'Clear', es: 'Limpiar' },
  seeAll: { pt: 'Ver todas', en: 'See all', es: 'Ver todas' },
  menu: { pt: 'Menu', en: 'Menu', es: 'Menú' },
  geminiApiKey: { pt: 'Chave API Gemini', en: 'Gemini API Key', es: 'Clave API Gemini' },
  geminiApiKeyDesc: { pt: 'Chave pessoal para funções de IA', en: 'Personal key for AI features', es: 'Clave personal para funciones de IA' },
  geminiApiKeySaved: { pt: 'Chave salva com sucesso!', en: 'Key saved successfully!', es: '¡Clave guardada!' },
  geminiApiKeyDeleted: { pt: 'Chave removida.', en: 'Key removed.', es: 'Clave eliminada.' },
  geminiPaste: { pt: 'Colar', en: 'Paste', es: 'Pegar' },
  geminiDelete: { pt: 'Apagar', en: 'Delete', es: 'Borrar' },
  geminiSave: { pt: 'Salvar', en: 'Save', es: 'Guardar' },
  geminiPlaceholder: { pt: 'Cole sua chave API aqui', en: 'Paste your API key here', es: 'Pegue su clave API aquí' },
  geminiConfigured: { pt: 'Configurada', en: 'Configured', es: 'Configurada' },
  geminiNotConfigured: { pt: 'Não configurada', en: 'Not configured', es: 'No configurada' },
  geminiHelpTitle: { pt: 'Como obter sua chave API Gemini', en: 'How to get your Gemini API Key', es: 'Cómo obtener tu clave API Gemini' },
  geminiHelpSteps: {
    pt: '1. Acesse aistudio.google.com\n2. Faça login com sua conta Google\n3. Clique em "Get API Key" no menu\n4. Clique em "Create API Key"\n5. Copie a chave gerada\n6. Cole aqui no app e salve',
    en: '1. Go to aistudio.google.com\n2. Sign in with your Google account\n3. Click "Get API Key" in the menu\n4. Click "Create API Key"\n5. Copy the generated key\n6. Paste it here in the app and save',
    es: '1. Accede a aistudio.google.com\n2. Inicia sesión con tu cuenta Google\n3. Haz clic en "Get API Key" en el menú\n4. Haz clic en "Create API Key"\n5. Copia la clave generada\n6. Pégala aquí en la app y guarda',
  },
  scannerApiKeyInfo: {
    pt: 'Para escanear cupons, configure sua chave API Gemini no menu de configurações.',
    en: 'To scan receipts, set up your Gemini API key in the settings menu.',
    es: 'Para escanear recibos, configura tu clave API Gemini en el menú de ajustes.',
  },
  scannerApiKeyConfigured: {
    pt: 'Chave API Gemini configurada. Para trocar a chave, acesse o menu de configurações.',
    en: 'Gemini API key configured. To change it, go to the settings menu.',
    es: 'Clave API Gemini configurada. Para cambiarla, accede al menú de ajustes.',
  },
  scannerGoToSettings: {
    pt: 'Abrir Configurações',
    en: 'Open Settings',
    es: 'Abrir Ajustes',
  },
};

function formatNumber(value: number, curr: string): string {
  if (curr === 'US$') {
    // American: dot decimal, comma thousands
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  // Brazilian/European: comma decimal, dot thousands
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  currency: string;
  formatCurrency: (value: number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'pt',
  setLang: () => {},
  t: (k) => k,
  currency: 'R$',
  formatCurrency: (v) => `R$ ${v.toFixed(2)}`,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('app-lang') as Lang) || 'pt'
  );
  const [isEurope, setIsEurope] = useState<boolean>(() => {
    return localStorage.getItem('app-region') === 'europe';
  });

  // Detect if user is in Europe on mount
  useEffect(() => {
    const cached = localStorage.getItem('app-region');
    if (cached) return; // already detected

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`,
              { headers: { 'User-Agent': 'MagicmartAI/1.0' } }
            );
            const data = await res.json();
            const country = data?.address?.country_code?.toLowerCase() || '';
            const europeanCountries = [
              'at','be','bg','hr','cy','cz','dk','ee','fi','fr','de','gr','hu',
              'ie','it','lv','lt','lu','mt','nl','pl','pt','ro','sk','si','es',
              'se','gb','no','ch','is'
            ];
            const inEurope = europeanCountries.includes(country);
            localStorage.setItem('app-region', inEurope ? 'europe' : 'other');
            setIsEurope(inEurope);
          } catch {
            localStorage.setItem('app-region', 'other');
          }
        },
        () => {
          localStorage.setItem('app-region', 'other');
        },
        { timeout: 5000 }
      );
    }
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem('app-lang', l);
    setLangState(l);
  };

  const t = (key: string) => translations[key]?.[lang] || key;

  // Currency: pt/es in Europe → €, otherwise default by lang
  const currency = (lang === 'pt' || lang === 'es') && isEurope ? '€' : currencyByLang[lang];

  const fc = (value: number) => `${currency} ${formatNumber(value, currency)}`;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, currency, formatCurrency: fc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
