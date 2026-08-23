import React, { useState, useMemo, useEffect } from 'react';
import {
  Globe,
  DollarSign,
  Smartphone,
  Sparkles,
  ShoppingBag,
  ShoppingCart,
  Search,
  Sliders,
  Settings,
  Code,
  Layers,
  ArrowRight,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Zap,
  Tag,
  Star,
  Eye,
  CreditCard,
  Bell,
  Fingerprint,
  Cpu,
  BarChart3,
  Copy,
  Check,
  Package,
  Heart,
  Filter,
  X,
  Compass,
  User,
  ShieldCheck,
} from 'lucide-react';
import {
  INITIAL_LANGUAGES,
  INITIAL_CURRENCIES,
  INITIAL_PRODUCTS,
  UI_TRANSLATIONS,
  OdooLanguage,
  OdooCurrency,
  OdooProduct,
  CartItem,
  UserBehaviorEvent,
  RecommendationAlgorithmConfig,
} from '../data/odooEcommerceData';

type SubView = 'storefront' | 'mobile' | 'recommendations' | 'admin' | 'odoo_code';
type MobileOS = 'ios' | 'android';
type MobileTab = 'home' | 'search' | 'cart' | 'recommendations' | 'profile';

export default function OdooEcommerceHub() {
  // Navigation
  const [subView, setSubView] = useState<SubView>('storefront');

  // Multi-Language & Multi-Currency State
  const [languages, setLanguages] = useState<OdooLanguage[]>(INITIAL_LANGUAGES);
  const [currencies, setCurrencies] = useState<OdooCurrency[]>(INITIAL_CURRENCIES);
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en_US');
  const [selectedCurrCode, setSelectedCurrCode] = useState<string>('USD');

  // Products & Storefront State
  const [products, setProducts] = useState<OdooProduct[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProductModal, setActiveProductModal] = useState<OdooProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>([
    { product: INITIAL_PRODUCTS[0], quantity: 1 },
    { product: INITIAL_PRODUCTS[1], quantity: 1 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set(['prod-003']));
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Behavioral Events & Recommendation Engine State
  const [events, setEvents] = useState<UserBehaviorEvent[]>([
    {
      id: 'evt-init-1',
      type: 'view',
      productId: 'prod-001',
      productTitle: 'AeroDesk Pro Motorized Studio Station',
      category: 'Workstations',
      timestamp: new Date(Date.now() - 360000).toLocaleTimeString(),
      sessionId: 'sess-odoo-8921',
      userType: 'authenticated',
    },
    {
      id: 'evt-init-2',
      type: 'cart_add',
      productId: 'prod-001',
      productTitle: 'AeroDesk Pro Motorized Studio Station',
      category: 'Workstations',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      sessionId: 'sess-odoo-8921',
      userType: 'authenticated',
    },
    {
      id: 'evt-init-3',
      type: 'view',
      productId: 'prod-002',
      productTitle: 'TitanFlow Pneumatic Dual Monitor Arm',
      category: 'Accessories',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      sessionId: 'sess-odoo-8921',
      userType: 'authenticated',
    },
    {
      id: 'evt-init-4',
      type: 'cart_add',
      productId: 'prod-002',
      productTitle: 'TitanFlow Pneumatic Dual Monitor Arm',
      category: 'Accessories',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
      sessionId: 'sess-odoo-8921',
      userType: 'authenticated',
    },
  ]);

  const [algoConfig, setAlgoConfig] = useState<RecommendationAlgorithmConfig>({
    collaborativeFilteringWeight: 50,
    contentSimilarityWeight: 30,
    trendingWeight: 10,
    recentCategoryAffinityWeight: 10,
    minCoPurchaseThreshold: 20,
    maxRecommendations: 4,
    includeOutOfStock: false,
    boostDiscounted: true,
  });

  // Mobile App Simulation State
  const [mobileOS, setMobileOS] = useState<MobileOS>('ios');
  const [mobileTab, setMobileTab] = useState<MobileTab>('home');
  const [mobileSearch, setMobileSearch] = useState<string>('');
  const [mobileDetailProduct, setMobileDetailProduct] = useState<OdooProduct | null>(null);
  const [mobileCheckoutStep, setMobileCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'confirmed'>('cart');
  const [mobileToast, setMobileToast] = useState<string | null>(null);

  // Active language and currency objects
  const currentLang = useMemo(
    () => languages.find((l) => l.code === selectedLangCode) || languages[0],
    [languages, selectedLangCode]
  );
  const currentCurr = useMemo(
    () => currencies.find((c) => c.code === selectedCurrCode) || currencies[0],
    [currencies, selectedCurrCode]
  );

  // Helper: Format Price with Currency
  const formatPrice = (baseUSD: number, customCurr?: OdooCurrency) => {
    const curr = customCurr || currentCurr;
    const converted = baseUSD * curr.rate;
    const formattedNum = converted.toLocaleString(undefined, {
      minimumFractionDigits: curr.decimalPlaces,
      maximumFractionDigits: curr.decimalPlaces,
    });
    return curr.symbolPosition === 'before'
      ? `${curr.symbol}${formattedNum}`
      : `${formattedNum} ${curr.symbol}`;
  };

  // Helper: Get Translated Text with Fallback
  const t = (key: string): string => {
    const translationObj = UI_TRANSLATIONS[key];
    if (!translationObj) return key;
    return (translationObj as any)[currentLang.code] || translationObj.en_US;
  };

  // Helper: Log User Behavioral Event
  const logEvent = (
    type: UserBehaviorEvent['type'],
    product?: OdooProduct,
    metadata?: Record<string, string | number>
  ) => {
    const newEvent: UserBehaviorEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      productId: product?.id,
      productTitle: product?.title.en_US,
      category: product?.category,
      timestamp: new Date().toLocaleTimeString(),
      sessionId: 'sess-odoo-8921',
      userType: 'authenticated',
      metadata,
    };
    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
  };

  // Cart Management
  const addToCart = (product: OdooProduct, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    logEvent('cart_add', product, { quantity });
    triggerMobileToast(`${product.title[currentLang.code as keyof typeof product.title] || product.title.en_US} added to cart`);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    if (item) {
      logEvent('cart_remove', item.product);
    }
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
        const p = products.find((prod) => prod.id === productId);
        if (p) logEvent('wishlist', p);
      }
      return next;
    });
  };

  const triggerMobileToast = (msg: string) => {
    setMobileToast(msg);
    setTimeout(() => setMobileToast(null), 3000);
  };

  // Cart Totals
  const cartSubtotalUSD = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.basePriceUSD * item.quantity, 0),
    [cart]
  );
  const cartTaxUSD = cartSubtotalUSD * 0.08; // 8% estimated VAT/Tax
  const cartTotalUSD = cartSubtotalUSD + cartTaxUSD;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered Products for Storefront
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const localizedTitle = p.title[currentLang.code as keyof typeof p.title] || p.title.en_US;
      const matchesSearch =
        searchQuery === '' ||
        localizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery, currentLang]);

  // Recommendation Engine: Collaborative Filtering & Content-Based Calculation
  const getRecommendationsForProduct = (targetProduct: OdooProduct, count = 3) => {
    return products
      .filter((p) => p.id !== targetProduct.id)
      .map((p) => {
        // 1. Co-purchase score from historical orders matrix (0-100)
        const coPurchaseScore = targetProduct.coPurchaseWeight[p.id] || 0;

        // 2. Content similarity score (category match + shared tags)
        const categoryMatch = p.category === targetProduct.category ? 50 : 0;
        const sharedTags = p.tags.filter((t) => targetProduct.tags.includes(t)).length;
        const tagScore = Math.min(sharedTags * 25, 50);
        const contentScore = categoryMatch + tagScore;

        // 3. Trending / Popularity score
        const trendingScore = Math.min((p.viewCount / 8000) * 100, 100);

        // 4. Session affinity score (based on events logged in this session)
        const sessionViews = events.filter((e) => e.productId === p.id && e.type === 'view').length;
        const sessionAffinity = Math.min(sessionViews * 30, 100);

        // Weighted final composite score
        const compositeScore =
          (coPurchaseScore * algoConfig.collaborativeFilteringWeight +
            contentScore * algoConfig.contentSimilarityWeight +
            trendingScore * algoConfig.trendingWeight +
            sessionAffinity * algoConfig.recentCategoryAffinityWeight) /
          100;

        return {
          product: p,
          score: compositeScore,
          coPurchaseScore,
          contentScore,
          trendingScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  };

  // Cross-sell recommendations for Cart Drawer
  const cartRecommendations = useMemo(() => {
    if (cart.length === 0) return [];
    const cartProductIds = new Set(cart.map((item) => item.product.id));
    const recsMap = new Map<string, { product: OdooProduct; score: number }>();

    cart.forEach((item) => {
      const recs = getRecommendationsForProduct(item.product, 3);
      recs.forEach((rec) => {
        if (!cartProductIds.has(rec.product.id)) {
          const current = recsMap.get(rec.product.id);
          if (!current || rec.score > current.score) {
            recsMap.set(rec.product.id, { product: rec.product, score: rec.score });
          }
        }
      });
    });

    return Array.from(recsMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
  }, [cart, products, algoConfig, events]);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div
      className="flex flex-col min-h-screen bg-slate-950 text-slate-100"
      dir={currentLang.direction}
    >
      {/* Top Banner: Odoo E-Commerce Master Navigation Bar */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight">Odoo E-Commerce Suite</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                  v18.0 Multi-Lang/Curr + Mobile + AI Recs
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Global Commerce Engine · Native iOS/Android API Bridge · Collaborative Filtering Matrix
              </p>
            </div>
          </div>

          {/* Sub-view switcher tabs */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setSubView('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                subView === 'storefront'
                  ? 'bg-purple-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Storefront & Switchers
            </button>
            <button
              onClick={() => setSubView('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                subView === 'mobile'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Native Mobile App
            </button>
            <button
              onClick={() => setSubView('recommendations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                subView === 'recommendations'
                  ? 'bg-amber-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Recommendation Engine
            </button>
            <button
              onClick={() => setSubView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                subView === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Admin Controls
            </button>
            <button
              onClick={() => setSubView('odoo_code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                subView === 'odoo_code'
                  ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Odoo Backend Code
            </button>
          </div>

          {/* Quick Language & Currency Switcher Bar (Available Globally) */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs">
              <Globe className="w-3.5 h-3.5 text-purple-400 mr-1.5" />
              <select
                value={selectedLangCode}
                onChange={(e) => setSelectedLangCode(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
              >
                {languages
                  .filter((l) => l.active)
                  .map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                      {lang.flag} {lang.nativeName} ({lang.code})
                    </option>
                  ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <select
                value={selectedCurrCode}
                onChange={(e) => setSelectedCurrCode(e.target.value)}
                className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
              >
                {currencies
                  .filter((c) => c.active)
                  .map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                      {curr.code} ({curr.symbol}) {curr.isBase ? '• Base' : `• ×${curr.rate}`}
                    </option>
                  ))}
              </select>
            </div>

            {/* Cart Button with Counter */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 bg-purple-600/90 hover:bg-purple-600 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-md transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{formatPrice(cartTotalUSD)}</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Areas based on selected sub-view */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ========================================================================= */}
        {/* VIEW 1: STOREFRONT & MULTI-LANG/CURRENCY EXPERIENCE                       */}
        {/* ========================================================================= */}
        {subView === 'storefront' && (
          <div className="space-y-6">
            {/* Storefront Hero Bar with Active Locale Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[11px] font-semibold flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {currentLang.flag} {currentLang.name} ({currentLang.direction.toUpperCase()})
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {currentCurr.code} ({currentCurr.symbol}) · Rate: {currentCurr.rate}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {t('recommendationEngineBadge')}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {t('storefrontTitle')}
                  </h1>
                  <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                    Enterprise hardware & ergonomic workstations powered by Odoo E-Commerce. Real-time multi-currency conversion, multilingual catalog, and behavioral AI recommendations.
                  </p>
                </div>

                {/* Live Currency Conversions Pill Box */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5 min-w-[220px]">
                  <div className="text-slate-400 font-semibold flex items-center justify-between border-b border-slate-800 pb-1">
                    <span>Live Exchange Monitor</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Odoo Pricelist Sync
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div>1 USD = 0.92 EUR</div>
                    <div>1 USD = 155.4 JPY</div>
                    <div>1 USD = 0.79 GBP</div>
                    <div>1 USD = 3.67 AED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Product Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const localizedTitle = product.title[currentLang.code as keyof typeof product.title] || product.title.en_US;
                const localizedDesc = product.description[currentLang.code as keyof typeof product.description] || product.description.en_US;
                const localizedCategory = product.categoryLocalized[currentLang.code as keyof typeof product.categoryLocalized] || product.category;
                const isWishlisted = wishlist.has(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl overflow-hidden shadow-lg transition-all duration-300 flex flex-col group"
                  >
                    {/* Image Container */}
                    <div className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer" onClick={() => {
                      setActiveProductModal(product);
                      logEvent('view', product);
                    }}>
                      <img
                        src={product.imageUrl}
                        alt={localizedTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="bg-slate-950/80 backdrop-blur text-purple-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-purple-500/30">
                          {localizedCategory}
                        </span>
                        <span className="bg-emerald-950/80 backdrop-blur text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                          {t('inStock')} ({product.stock})
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWishlist(product.id);
                        }}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur transition-colors ${
                          isWishlisted
                            ? 'bg-rose-500/90 text-white'
                            : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="font-mono text-[11px] text-slate-500">{product.sku}</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span className="font-bold text-slate-200">{product.rating}</span>
                            <span className="text-slate-500 text-[10px]">({product.reviewCount})</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => {
                            setActiveProductModal(product);
                            logEvent('view', product);
                          }}
                          className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1 cursor-pointer"
                        >
                          {localizedTitle}
                        </h3>

                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {localizedDesc}
                        </p>
                      </div>

                      {/* Pricing & Actions */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-xs text-slate-500">Odoo Pricelist Rate</div>
                          <div className="text-lg font-extrabold text-emerald-400">
                            {formatPrice(product.basePriceUSD)}
                          </div>
                          {currentCurr.code !== 'USD' && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              (${product.basePriceUSD.toFixed(2)} USD base)
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setActiveProductModal(product);
                              logEvent('view', product);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                            title="Inspect Specs & Recommendations"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => addToCart(product, 1)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {t('addToCart')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: NATIVE MOBILE APPLICATION (iOS & Android) SIMULATOR               */}
        {/* ========================================================================= */}
        {subView === 'mobile' && (
          <div className="space-y-6">
            {/* Architecture Overview & Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold">
                    Native Mobile Architecture
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                    Odoo JSON-RPC / REST 2.0
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Native iOS & Android Odoo Storefront Client
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Streamlined mobile purchasing experience with 1-Tap Biometric Checkout (Apple Pay / Google Pay), offline-first SQLite cache, real-time push notifications, and multilingual/currency sync.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    onClick={() => setMobileOS('ios')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      mobileOS === 'ios' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍎 Apple iOS 18 (SwiftUI)
                  </button>
                  <button
                    onClick={() => setMobileOS('android')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                      mobileOS === 'android' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🤖 Android Material 3 (Compose)
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Simulator & Architecture Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Phone Frame Simulator (Center Column) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[360px] h-[720px] bg-slate-950 rounded-[44px] border-[10px] border-slate-800 shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-slate-700/50">
                  {/* Dynamic Island / Notch / Status Bar */}
                  <div className="bg-slate-950 px-6 pt-3 pb-2 flex items-center justify-between text-slate-400 text-[11px] font-medium z-30">
                    <span>9:41</span>
                    {mobileOS === 'ios' ? (
                      <div className="w-24 h-5 bg-black rounded-full mx-auto flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
                        <span className="text-[9px] text-slate-400 font-mono">Odoo Sync</span>
                      </div>
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-800" />
                    )}
                    <div className="flex items-center gap-1.5">
                      <span>5G</span>
                      <div className="w-4 h-2 border border-slate-400 rounded-sm p-0.5">
                        <div className="w-full h-full bg-emerald-400 rounded-2xs" />
                      </div>
                    </div>
                  </div>

                  {/* Toast Notification Container */}
                  {mobileToast && (
                    <div className="absolute top-14 left-4 right-4 bg-emerald-500 text-slate-950 px-3 py-2 rounded-lg text-xs font-bold shadow-xl z-50 flex items-center justify-between animate-bounce">
                      <span>{mobileToast}</span>
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  )}

                  {/* Mobile Screen Body */}
                  <div className="flex-1 bg-slate-900 overflow-y-auto p-4 space-y-4 text-slate-100 flex flex-col">
                    {/* Mobile Top Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                          Odoo Mobile Store
                        </div>
                        <h4 className="text-sm font-extrabold text-white">
                          {t('storefrontTitle')}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {currentCurr.code} ({currentCurr.symbol})
                        </span>
                      </div>
                    </div>

                    {/* Mobile Search & Barcode Bar */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products or scan barcode..."
                        value={mobileSearch}
                        onChange={(e) => setMobileSearch(e.target.value)}
                        className="w-full pl-8 pr-12 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={() => triggerMobileToast('Barcode Scanner initialized')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300"
                        title="Scan Barcode"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Active Screen Tab Router */}
                    {mobileTab === 'home' && (
                      <div className="space-y-4 flex-1">
                        {/* Mobile Promo Banner */}
                        <div className="bg-gradient-to-r from-purple-900/60 to-indigo-900/60 border border-purple-500/30 rounded-xl p-3">
                          <div className="text-[10px] text-purple-300 font-semibold">
                            🔥 AI Recommendation Highlight
                          </div>
                          <div className="text-xs font-bold text-white mt-0.5">
                            Bundle & Save 15% on Studio Stations
                          </div>
                          <div className="text-[10px] text-slate-300 mt-1">
                            Odoo Price conversion: {formatPrice(799 * 0.85)} (Save {formatPrice(799 * 0.15)})
                          </div>
                        </div>

                        {/* Category Quick Scroller */}
                        <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-2.5 py-1 rounded-full whitespace-nowrap font-medium ${
                                selectedCategory === cat
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Product Cards in Mobile Layout */}
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                            <span>Featured Hardware ({filteredProducts.length})</span>
                            <span className="text-[10px] text-purple-400 font-mono">Real-time Stock</span>
                          </div>

                          {filteredProducts.slice(0, 4).map((p) => {
                            const title = p.title[currentLang.code as keyof typeof p.title] || p.title.en_US;
                            return (
                              <div
                                key={p.id}
                                className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-2.5 flex gap-3 items-center"
                              >
                                <img
                                  src={p.imageUrl}
                                  alt={title}
                                  className="w-16 h-16 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[10px] text-purple-400 font-mono">{p.sku}</div>
                                  <h5 className="text-xs font-bold text-white truncate">{title}</h5>
                                  <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
                                    {formatPrice(p.basePriceUSD)}
                                  </div>
                                </div>
                                <button
                                  onClick={() => addToCart(p, 1)}
                                  className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center flex-shrink-0 shadow"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {mobileTab === 'cart' && (
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="text-xs font-bold text-white flex items-center justify-between">
                            <span>Your Cart ({cart.length} items)</span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Odoo Checkout Bridge
                            </span>
                          </div>

                          {cart.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                              Cart is empty. Add products to test checkout.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {cart.map((item) => (
                                <div
                                  key={item.product.id}
                                  className="bg-slate-800/80 p-2 rounded-lg flex items-center justify-between gap-2 border border-slate-700"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-white truncate">
                                      {item.product.title[currentLang.code as keyof typeof item.product.title] || item.product.title.en_US}
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-mono">
                                      {formatPrice(item.product.basePriceUSD)} × {item.quantity}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => updateQuantity(item.product.id, -1)}
                                      className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold px-1">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.product.id, 1)}
                                      className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Mobile Checkout Section */}
                        {cart.length > 0 && (
                          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>Subtotal</span>
                              <span className="font-mono">{formatPrice(cartSubtotalUSD)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                              <span>Tax (8%)</span>
                              <span className="font-mono">{formatPrice(cartTaxUSD)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white border-t border-slate-700 pt-1.5">
                              <span>Total ({currentCurr.code})</span>
                              <span className="text-emerald-400 font-mono">{formatPrice(cartTotalUSD)}</span>
                            </div>

                            {/* 1-Tap Biometric Pay Button */}
                            <button
                              onClick={() => {
                                setCheckoutSuccess(true);
                                logEvent('purchase', cart[0]?.product, { orderTotal: cartTotalUSD });
                                triggerMobileToast(
                                  mobileOS === 'ios'
                                    ? 'Apple Pay authorized via FaceID!'
                                    : 'Google Pay authorized via Fingerprint!'
                                );
                                setTimeout(() => setCheckoutSuccess(false), 4000);
                              }}
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                            >
                              <Fingerprint className="w-4 h-4" />
                              {mobileOS === 'ios' ? '1-Tap Apple Pay (FaceID)' : '1-Tap Google Pay (Biometrics)'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {mobileTab === 'recommendations' && (
                      <div className="space-y-3 flex-1">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Personalized For You</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Real-time suggestions calculated from your {events.length} session interactions.
                        </p>

                        <div className="space-y-2">
                          {products.slice(0, 3).map((prod) => (
                            <div
                              key={prod.id}
                              className="bg-slate-800 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between gap-2"
                            >
                              <div>
                                <div className="text-xs font-bold text-white">
                                  {prod.title[currentLang.code as keyof typeof prod.title] || prod.title.en_US}
                                </div>
                                <div className="text-[10px] text-emerald-400 font-mono">
                                  {formatPrice(prod.basePriceUSD)} · 96% Match
                                </div>
                              </div>
                              <button
                                onClick={() => addToCart(prod, 1)}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-bold"
                              >
                                Add +
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {mobileTab === 'profile' && (
                      <div className="space-y-3 flex-1 text-xs">
                        <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                          <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white">
                            JC
                          </div>
                          <div>
                            <div className="font-bold text-white">Joshua Coleman</div>
                            <div className="text-[10px] text-slate-400">Odoo Enterprise Customer #4410</div>
                          </div>
                        </div>
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-2 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Preferred Language:</span>
                            <span className="text-white font-medium">{currentLang.nativeName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Billing Currency:</span>
                            <span className="text-white font-medium">{currentCurr.code} ({currentCurr.symbol})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Biometrics Security:</span>
                            <span className="text-emerald-400 font-medium">Enforced (Hardware Enclave)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Bottom Tab Bar */}
                  <div className="bg-slate-950 border-t border-slate-800 px-4 py-2.5 flex items-center justify-around z-30">
                    <button
                      onClick={() => setMobileTab('home')}
                      className={`flex flex-col items-center gap-0.5 text-[9px] font-medium ${
                        mobileTab === 'home' ? 'text-purple-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Home
                    </button>
                    <button
                      onClick={() => setMobileTab('cart')}
                      className={`relative flex flex-col items-center gap-0.5 text-[9px] font-medium ${
                        mobileTab === 'cart' ? 'text-purple-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Cart
                      {cart.length > 0 && (
                        <span className="absolute -top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-bold w-3 h-3 rounded-full flex items-center justify-center">
                          {cart.reduce((s, i) => s + i.quantity, 0)}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setMobileTab('recommendations')}
                      className={`flex flex-col items-center gap-0.5 text-[9px] font-medium ${
                        mobileTab === 'recommendations' ? 'text-amber-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Picks
                    </button>
                    <button
                      onClick={() => setMobileTab('profile')}
                      className={`flex flex-col items-center gap-0.5 text-[9px] font-medium ${
                        mobileTab === 'profile' ? 'text-purple-400 font-bold' : 'text-slate-500'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Native App Core Architecture & Engineering Blueprint (Right Column) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Architecture Highlights */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-indigo-400" />
                    Native App Technical Specifications (iOS & Android)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        iOS Stack (SwiftUI 6)
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        • Declarative SwiftUI with Swift 6 Concurrency (Actors, async/await).<br/>
                        • Apple Pay PassKit tokenized checkout.<br/>
                        • CoreData / SwiftData local offline catalog cache.<br/>
                        • Dynamic Island live delivery tracking.
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        Android Stack (Jetpack Compose)
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        • Jetpack Compose with Material 3 Adaptive Layouts.<br/>
                        • Google Pay API integration with BiometricPrompt.<br/>
                        • Room Database + Kotlin StateFlow offline sync.<br/>
                        • Firebase Cloud Messaging (FCM) push alerts.
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" />
                        Odoo Backend Connector
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        • JSON-RPC 2.0 / REST API over HTTPS with JWT session auth.<br/>
                        • Pricelist currency translation on `res.currency`.<br/>
                        • Dynamic translation loader mapping `ir.translation`.<br/>
                        • Real-time stock reservation on `stock.quant`.
                      </p>
                    </div>

                    <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Edge Recommendation Cache
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        • Pre-computed co-purchase weights stored locally.<br/>
                        • On-device clickstream tracker for instant personalization.<br/>
                        • Sub-10ms recommendation retrieval on cold start.<br/>
                        • Automatic background delta sync with Odoo server.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interactive API Sandbox */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" />
                      Live Odoo Mobile Endpoint Inspector
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      HTTP 200 OK
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                    <div className="text-slate-500">// GET /api/v1/mobile/storefront?lang={selectedLangCode}&currency={selectedCurrCode}</div>
                    <pre className="mt-1 text-[11px] text-slate-300">
{`{
  "status": "success",
  "locale": { "lang": "${selectedLangCode}", "direction": "${currentLang.direction}" },
  "currency": { "code": "${selectedCurrCode}", "symbol": "${currentCurr.symbol}", "rate": ${currentCurr.rate} },
  "cart_count": ${cart.length},
  "cart_total": "${formatPrice(cartTotalUSD)}",
  "recommendations_enabled": true,
  "server_time": "${new Date().toISOString()}"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: BEHAVIORAL RECOMMENDATION ENGINE                                   */}
        {/* ========================================================================= */}
        {subView === 'recommendations' && (
          <div className="space-y-6">
            {/* Header / Engine KPIs */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Collaborative Filtering + Content Match
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
                      Live User Behavior Stream
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Odoo Behavioral Product Recommendation Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Analyzes real-time clickstream events (views, cart additions, purchases) and calculates item-to-item co-occurrence scores from historical Odoo sales orders (`sale.order.line`).
                  </p>
                </div>

                {/* Conversion Lift KPIs */}
                <div className="flex gap-3">
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400 font-medium">CTR Uplift</div>
                    <div className="text-base font-extrabold text-emerald-400">+18.4%</div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400 font-medium">AOV Lift</div>
                    <div className="text-base font-extrabold text-purple-400">+${(42.5 * currentCurr.rate).toFixed(0)}</div>
                  </div>
                  <div className="bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400 font-medium">Cart CVR</div>
                    <div className="text-base font-extrabold text-amber-400">+24.1%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Algorithm Weights Tuner & Event Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Algorithm Controls (Left Column) */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Recommendation Weight Matrix
                  </h3>
                  <button
                    onClick={() =>
                      setAlgoConfig({
                        collaborativeFilteringWeight: 50,
                        contentSimilarityWeight: 30,
                        trendingWeight: 10,
                        recentCategoryAffinityWeight: 10,
                        minCoPurchaseThreshold: 20,
                        maxRecommendations: 4,
                        includeOutOfStock: false,
                        boostDiscounted: true,
                      })
                    }
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  {/* Weight 1: Collaborative Filtering */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Co-Purchase Collaborative Filtering</span>
                      <span className="text-purple-400 font-mono">{algoConfig.collaborativeFilteringWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={algoConfig.collaborativeFilteringWeight}
                      onChange={(e) =>
                        setAlgoConfig((prev) => ({
                          ...prev,
                          collaborativeFilteringWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500">
                      "Customers who bought this also bought..." based on past Odoo sales orders.
                    </div>
                  </div>

                  {/* Weight 2: Content Similarity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Content / Category Similarity</span>
                      <span className="text-indigo-400 font-mono">{algoConfig.contentSimilarityWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={algoConfig.contentSimilarityWeight}
                      onChange={(e) =>
                        setAlgoConfig((prev) => ({
                          ...prev,
                          contentSimilarityWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                    <div className="text-[10px] text-slate-500">
                      Matches products with identical tags, category specs, and hardware tier.
                    </div>
                  </div>

                  {/* Weight 3: Trending & Views */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Trending / High Velocity Views</span>
                      <span className="text-amber-400 font-mono">{algoConfig.trendingWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={algoConfig.trendingWeight}
                      onChange={(e) =>
                        setAlgoConfig((prev) => ({
                          ...prev,
                          trendingWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Weight 4: Session Affinity */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-300">Real-time Session Clickstream Affinity</span>
                      <span className="text-emerald-400 font-mono">{algoConfig.recentCategoryAffinityWeight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={algoConfig.recentCategoryAffinityWeight}
                      onChange={(e) =>
                        setAlgoConfig((prev) => ({
                          ...prev,
                          recentCategoryAffinityWeight: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-slate-300 text-xs">Boost Bundle Discounted Items (+15% score)</span>
                      <input
                        type="checkbox"
                        checked={algoConfig.boostDiscounted}
                        onChange={(e) =>
                          setAlgoConfig((prev) => ({ ...prev, boostDiscounted: e.target.checked }))
                        }
                        className="rounded accent-purple-600"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Behavioral Event Stream (Right Column) */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Live Behavioral Clickstream Log
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Events generated in this session dynamically feed the recommendation vector.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const randomProd = products[Math.floor(Math.random() * products.length)];
                      logEvent('view', randomProd);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Simulate View Event
                  </button>
                </div>

                {/* Event list */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {events.map((evt) => {
                    let badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                    let icon = <Eye className="w-3 h-3" />;
                    if (evt.type === 'cart_add') {
                      badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
                      icon = <ShoppingCart className="w-3 h-3" />;
                    } else if (evt.type === 'purchase') {
                      badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                      icon = <CheckCircle className="w-3 h-3" />;
                    } else if (evt.type === 'wishlist') {
                      badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                      icon = <Heart className="w-3 h-3" />;
                    }

                    return (
                      <div
                        key={evt.id}
                        className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono gap-3"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold flex items-center gap-1 ${badgeColor}`}>
                            {icon} {evt.type.toUpperCase()}
                          </span>
                          <span className="text-white font-sans font-medium truncate">
                            {evt.productTitle || 'Catalog Browse'}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[10px] whitespace-nowrap">
                          {evt.timestamp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Recommendation Output Showcase */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Live Co-Occurrence Recommendation Output for: "{products[0].title.en_US}"
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {getRecommendationsForProduct(products[0], 3).map((rec) => (
                  <div
                    key={rec.product.id}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-purple-400 font-mono text-[10px]">{rec.product.category}</span>
                        <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px]">
                          Match: {rec.score.toFixed(0)}%
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        {rec.product.title[currentLang.code as keyof typeof rec.product.title] || rec.product.title.en_US}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {rec.product.description[currentLang.code as keyof typeof rec.product.description] || rec.product.description.en_US}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                      <div className="font-bold text-emerald-400 text-sm">
                        {formatPrice(rec.product.basePriceUSD)}
                      </div>
                      <button
                        onClick={() => addToCart(rec.product, 1)}
                        className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: ADMIN MANAGEMENT CONSOLE (LANGUAGES & CURRENCIES)                  */}
        {/* ========================================================================= */}
        {subView === 'admin' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white">
                Odoo E-Commerce Localization & Currency Admin Console
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Define supported storefront languages, right-to-left formatting, base currencies, and live exchange rate providers mapping directly to Odoo's `res.lang` and `res.currency` models.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Language Manager */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    Supported Storefront Languages ({languages.length})
                  </h3>
                  <span className="text-xs text-purple-400 font-mono">res.lang</span>
                </div>

                <div className="space-y-3">
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            <span>{lang.name}</span>
                            {lang.isDefault && (
                              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                                DEFAULT
                              </span>
                            )}
                            <span className="text-slate-500 font-mono text-[10px]">({lang.code})</span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                            <span>Direction: <strong>{lang.direction.toUpperCase()}</strong></span>
                            <span>•</span>
                            <span>Coverage: <strong>{lang.translationCoverage}%</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={lang.active}
                            onChange={(e) => {
                              setLanguages((prev) =>
                                prev.map((l) =>
                                  l.code === lang.code ? { ...l, active: e.target.checked } : l
                                )
                              );
                            }}
                            className="rounded accent-purple-600"
                          />
                          <span className="text-slate-300 font-medium">Active</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency Manager */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Storefront Currencies & Rates ({currencies.length})
                  </h3>
                  <button
                    onClick={() => {
                      setCurrencies((prev) =>
                        prev.map((c) => ({
                          ...c,
                          lastUpdated: 'Just Now (Synced)',
                        }))
                      );
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" /> Sync Bank Feeds
                  </button>
                </div>

                <div className="space-y-3">
                  {currencies.map((curr) => (
                    <div
                      key={curr.code}
                      className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl flex items-center justify-between gap-4 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center font-mono font-bold text-emerald-300">
                            {curr.symbol}
                          </span>
                          <span>{curr.name}</span>
                          <span className="text-slate-400 font-mono">({curr.code})</span>
                          {curr.isBase && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              BASE CURRENCY
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1 font-mono flex items-center gap-2">
                          <span>Rate: 1 USD = <strong>{curr.rate}</strong> {curr.code}</span>
                          <span>•</span>
                          <span>Position: <strong>{curr.symbolPosition}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!curr.isBase && (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-slate-500">Rate:</span>
                            <input
                              type="number"
                              step="0.01"
                              value={curr.rate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  setCurrencies((prev) =>
                                    prev.map((c) =>
                                      c.code === curr.code ? { ...c, rate: val } : c
                                    )
                                  );
                                }
                              }}
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-white font-mono text-xs text-right"
                            />
                          </div>
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={curr.active}
                            onChange={(e) => {
                              setCurrencies((prev) =>
                                prev.map((c) =>
                                  c.code === curr.code ? { ...c, active: e.target.checked } : c
                                )
                              );
                            }}
                            className="rounded accent-emerald-600"
                          />
                          <span className="text-slate-300 font-medium">Active</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: ODOO BACKEND PYTHON MODULE CODE GENERATOR                         */}
        {/* ========================================================================= */}
        {subView === 'odoo_code' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Code className="w-5 h-5 text-cyan-400" />
                Production Odoo 17/18 Backend Module Implementation
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Ready-to-deploy Python models for Odoo E-Commerce, handling multi-language translation caching, currency pricelists, behavioral recommendation engines, and REST/JSON-RPC mobile endpoints.
              </p>
            </div>

            {/* Code Snippets */}
            <div className="space-y-6">
              {/* Snippet 1: Recommendation Engine ORM Model */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400" />
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      odoo_ecommerce_ai/models/product_recommendation.py
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyCode(
                        `# -*- coding: utf-8 -*-
from odoo import models, fields, api
import numpy as np

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    co_purchase_ids = fields.Many2many(
        'product.template',
        'product_co_purchase_rel',
        'product_id',
        'recommended_id',
        string='Customers Who Bought This Also Bought'
    )
    
    @api.model
    def compute_collaborative_recommendations(self, product_id, limit=4):
        """
        Computes item-to-item collaborative filtering co-occurrence matrix 
        from historical confirmed sales orders (sale.order.line).
        """
        query = """
            SELECT l2.product_id, COUNT(*) as frequency
            FROM sale_order_line l1
            JOIN sale_order_line l2 ON l1.order_id = l2.order_id
            JOIN sale_order o ON l1.order_id = o.id
            WHERE l1.product_id = %s 
              AND l2.product_id != %s
              AND o.state IN ('sale', 'done')
            GROUP BY l2.product_id
            ORDER BY frequency DESC
            LIMIT %s;
        """
        self.env.cr.execute(query, (product_id, product_id, limit))
        results = self.env.cr.fetchall()
        recommended_ids = [r[0] for r in results]
        return self.env['product.product'].browse(recommended_ids)
`,
                        'code-py-rec'
                      )
                    }
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1 rounded text-cyan-300 transition-colors"
                  >
                    {copiedCodeId === 'code-py-rec' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed">
{`# -*- coding: utf-8 -*-
from odoo import models, fields, api

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    co_purchase_ids = fields.Many2many(
        'product.template',
        'product_co_purchase_rel',
        'product_id',
        'recommended_id',
        string='Customers Who Bought This Also Bought'
    )
    
    @api.model
    def compute_collaborative_recommendations(self, product_id, limit=4):
        """
        Computes item-to-item collaborative filtering co-occurrence matrix 
        from historical confirmed sales orders (sale.order.line).
        """
        query = """
            SELECT l2.product_id, COUNT(*) as frequency
            FROM sale_order_line l1
            JOIN sale_order_line l2 ON l1.order_id = l2.order_id
            JOIN sale_order o ON l1.order_id = o.id
            WHERE l1.product_id = %s 
              AND l2.product_id != %s
              AND o.state IN ('sale', 'done')
            GROUP BY l2.product_id
            ORDER BY frequency DESC
            LIMIT %s;
        """
        self.env.cr.execute(query, (product_id, product_id, limit))
        results = self.env.cr.fetchall()
        recommended_ids = [r[0] for r in results]
        return self.env['product.product'].browse(recommended_ids)`}
                </pre>
              </div>

              {/* Snippet 2: Mobile REST / JSON-RPC Controller */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-slate-850 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      odoo_ecommerce_ai/controllers/mobile_api.py
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      copyCode(
                        `# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
import json

class MobileStorefrontController(http.Controller):

    @http.route('/api/v1/mobile/storefront', type='json', auth='public', methods=['POST'], csrf=False)
    def get_storefront_data(self, **kwargs):
        lang = kwargs.get('lang', 'en_US')
        currency_code = kwargs.get('currency', 'USD')
        
        # Switch session context dynamically
        request.context = dict(request.context, lang=lang)
        currency = request.env['res.currency'].search([('name', '=', currency_code)], limit=1)
        
        products = request.env['product.template'].search([('website_published', '=', True)], limit=20)
        
        payload = []
        for p in products:
            price_converted = p.currency_id._convert(
                p.list_price, currency, request.env.company, fields.Date.today()
            )
            payload.append({
                'id': p.id,
                'name': p.name,
                'price': price_converted,
                'currency_symbol': currency.symbol,
                'image_url': f'/web/image/product.template/{p.id}/image_1024',
                'recommendations': [r.id for r in p.compute_collaborative_recommendations(p.id, limit=3)]
            })
            
        return {
            'status': 'success',
            'locale': lang,
            'currency': currency_code,
            'products': payload
        }
`,
                        'code-py-ctrl'
                      )
                    }
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1 rounded text-emerald-300 transition-colors"
                  >
                    {copiedCodeId === 'code-py-ctrl' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed">
{`# -*- coding: utf-8 -*-
from odoo import http, fields
from odoo.http import request

class MobileStorefrontController(http.Controller):

    @http.route('/api/v1/mobile/storefront', type='json', auth='public', methods=['POST'], csrf=False)
    def get_storefront_data(self, **kwargs):
        lang = kwargs.get('lang', 'en_US')
        currency_code = kwargs.get('currency', 'USD')
        
        # Switch session context dynamically
        request.context = dict(request.context, lang=lang)
        currency = request.env['res.currency'].search([('name', '=', currency_code)], limit=1)
        
        products = request.env['product.template'].search([('website_published', '=', True)], limit=20)
        
        payload = []
        for p in products:
            price_converted = p.currency_id._convert(
                p.list_price, currency, request.env.company, fields.Date.today()
            )
            payload.append({
                'id': p.id,
                'name': p.name,
                'price': price_converted,
                'currency_symbol': currency.symbol,
                'image_url': f'/web/image/product.template/{p.id}/image_1024',
                'recommendations': [r.id for r in p.compute_collaborative_recommendations(p.id, limit=3)]
            })
            
        return {
            'status': 'success',
            'locale': lang,
            'currency': currency_code,
            'products': payload
        }`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* PRODUCT DETAIL & RECOMMENDATION MODAL                                     */}
      {/* ========================================================================= */}
      {activeProductModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto shadow-2xl flex flex-col relative">
            <button
              onClick={() => setActiveProductModal(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              {/* Product Header & Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img
                    src={activeProductModal.imageUrl}
                    alt={activeProductModal.title.en_US}
                    className="w-full h-80 object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-purple-400 font-mono mb-1">
                      <span>{activeProductModal.sku}</span>
                      <span>•</span>
                      <span>{activeProductModal.category}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {activeProductModal.title[currentLang.code as keyof typeof activeProductModal.title] || activeProductModal.title.en_US}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="font-bold text-slate-200 text-sm ml-1">{activeProductModal.rating}</span>
                      </div>
                      <span className="text-slate-500 text-xs">({activeProductModal.reviewCount} verified reviews)</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activeProductModal.description[currentLang.code as keyof typeof activeProductModal.description] || activeProductModal.description.en_US}
                  </p>

                  <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Technical Specifications
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs text-slate-300">
                      {Object.entries(activeProductModal.specs).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-slate-800/60">
                          <span className="text-slate-500">{key}:</span>
                          <span className="font-medium text-white">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Price in {currentCurr.code}</div>
                      <div className="text-2xl font-extrabold text-emerald-400">
                        {formatPrice(activeProductModal.basePriceUSD)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(activeProductModal, 1);
                        setActiveProductModal(null);
                      }}
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t('addToCart')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Behavioral Recommendation Section 1: "Customers Who Bought This Also Bought" */}
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      {t('customersWhoBoughtThis')}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Computed via Item-to-Item Collaborative Filtering from Odoo `sale.order` co-purchases.
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-mono">
                    Algorithm: Co-Occurrence
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {getRecommendationsForProduct(activeProductModal, 3).map((rec) => (
                    <div
                      key={rec.product.id}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3">
                        <img
                          src={rec.product.imageUrl}
                          alt={rec.product.title.en_US}
                          className="w-14 h-14 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">
                            {rec.product.title[currentLang.code as keyof typeof rec.product.title] || rec.product.title.en_US}
                          </h4>
                          <div className="text-xs font-extrabold text-emerald-400 mt-1">
                            {formatPrice(rec.product.basePriceUSD)}
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                            Co-Purchase Freq: {rec.coPurchaseScore}%
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addToCart(rec.product, 1)}
                        className="w-full py-1.5 rounded-lg bg-slate-700 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER CART DRAWER WITH DYNAMIC CROSS-SELL RECOMMENDATIONS             */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full flex flex-col shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white text-base">{t('cartDrawerTitle')}</h3>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                  {cart.length}
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Item List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Your cart is empty. Browse the storefront to add items.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3 flex gap-3 items-center justify-between"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.title.en_US}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.product.title[currentLang.code as keyof typeof item.product.title] || item.product.title.en_US}
                      </h4>
                      <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
                        {formatPrice(item.product.basePriceUSD)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-xs text-white"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}

              {/* Dynamic Cart Cross-sell Recommendations */}
              {cartRecommendations.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Frequently Bought With Cart Items
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">1-Click Bundle</span>
                  </div>

                  {cartRecommendations.map((rec) => (
                    <div
                      key={rec.product.id}
                      className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate">
                          {rec.product.title[currentLang.code as keyof typeof rec.product.title] || rec.product.title.en_US}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold">
                          {formatPrice(rec.product.basePriceUSD * 0.9)} <span className="line-through text-slate-500 text-[10px]">{formatPrice(rec.product.basePriceUSD)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(rec.product, 1)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap"
                      >
                        + Add 10% Off
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>{t('subtotal')}</span>
                    <span className="font-mono">{formatPrice(cartSubtotalUSD)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>{t('taxVat')}</span>
                    <span className="font-mono">{formatPrice(cartTaxUSD)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white border-t border-slate-800 pt-2">
                    <span>{t('total')} ({currentCurr.code})</span>
                    <span className="text-emerald-400 font-mono text-base">{formatPrice(cartTotalUSD)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCheckoutSuccess(true);
                    logEvent('purchase', cart[0]?.product, { totalUSD: cartTotalUSD });
                    setTimeout(() => {
                      setCheckoutSuccess(false);
                      setIsCartOpen(false);
                    }, 3000);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {t('checkoutWithOdoo')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
