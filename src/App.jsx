import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Coffee, Bot, ShoppingBag, Star, Send, 
  ChevronRight, ArrowLeft, X, MapPin, ChevronDown, User, 
  CheckCircle, Utensils, Search, BookOpen, LogOut,
  Minus, Plus, Trash2, Palette, Check
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  updateProfile, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, serverTimestamp 
} from 'firebase/firestore';

// --- THEMES DEFINITION ---
const THEMES = [
  { id: 'berry', name: 'Berry Bistro', className: 'theme-berry', preview: '#E05688', dotBg: '#FAF4F6', description: 'Chic Parisian Velvet & Rose' },
  { id: 'terracotta', name: 'Terracotta Sun', className: 'theme-terracotta', preview: '#E05D38', dotBg: '#FAF7F2', description: 'Warm Artisan & Mediterranean Spice' },
  { id: 'emerald', name: 'Emerald Garden', className: 'theme-emerald', preview: '#2A6E50', dotBg: '#F4F7F4', description: 'Lush Botanical Jade & Sage' },
  { id: 'caramel', name: 'Mocha Caramel', className: 'theme-caramel', preview: '#C97A3E', dotBg: '#FAF6F0', description: 'Rich Coffee & Golden Caramel' },
  { id: 'midnight', name: 'Midnight Lounge', className: 'theme-midnight', preview: '#F59E0B', dotBg: '#0F0F12', description: 'Dark Velvet & Golden Neon' }
];

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: "AIzaSyBS1aGZZ2RDx2RKji1jOO-7spiY5QzJjh8",
  authDomain: "auth.karshaksolutions.in",
  databaseURL: "https://m4-spider-default-rtdb.firebaseio.com",
  projectId: "m4-spider",
  storageBucket: "m4-spider.firebasestorage.app",
  messagingSenderId: "154970150789",
  appId: "1:154970150789:web:60796710cacca377edd6ec",
  measurementId: "G-TGTWRTF7EX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'loca-cafe';

// --- INDEXED DB SETUP ---
const DB_NAME = 'loca_cafe_db';
const STORE_NAME = 'cart_store';
const DB_VERSION = 1;

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject(event.target.error);
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveCartToDB = async (cartItems) => {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.clear();
    cartItems.forEach(item => store.put(item));
    return tx.complete;
  } catch (error) {
    console.error('Error saving to IDB:', error);
  }
};

const getCartFromDB = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error fetching from IDB:', error);
    return [];
  }
};

// --- DATA ---
const LOCATIONS = [
  { id: 'kompally', name: 'Kompally, Hyderabad', distance: '0.2 km' },
  { id: 'jubilee', name: 'Jubilee Hills, Hyderabad', distance: '12 km' },
  { id: 'gachibowli', name: 'Gachibowli, Hyderabad', distance: '24 km' },
];

const CATEGORIES = [
  { id: 'coffee', name: 'Coffee', icon: <Coffee />, color: 'bg-amber-100 text-amber-900' },
  { id: 'non-coffee', name: 'Non-Coffee', icon: <Utensils />, color: 'bg-orange-100 text-orange-900' },
  { id: 'breakfast', name: 'Breakfast', icon: <Coffee />, color: 'bg-yellow-100 text-yellow-900' },
  { id: 'snacks', name: 'Snacks & Bites', icon: <Utensils />, color: 'bg-red-100 text-red-900' },
  { id: 'main', name: 'Main Cafe Food', icon: <Utensils />, color: 'bg-emerald-100 text-emerald-900' },
  { id: 'desserts', name: 'Bakery & Desserts', icon: <Star />, color: 'bg-pink-100 text-pink-900' },
  { id: 'cold-drinks', name: 'Cold Drinks', icon: <Coffee />, color: 'bg-blue-100 text-blue-900' },
  { id: 'thick-shakes', name: 'Thick Shakes', icon: <Utensils />, color: 'bg-indigo-100 text-indigo-900' },
  { id: 'special', name: 'Special Items', icon: <Star />, color: 'bg-purple-100 text-purple-900' },
];

const MENU_DATA = {
  coffee: [
    { id: 101, title: 'Espresso', price: 149, description: 'Pure, intense signature shot', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
    { id: 102, title: 'Americano', price: 189, description: 'Espresso with hot water', image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80' },
    { id: 103, title: 'Cappuccino', price: 229, description: 'Perfect balance of milk and foam', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80' },
    { id: 104, title: 'Latte', price: 249, description: 'Creamy espresso and steamed milk', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80' },
    { id: 105, title: 'Flat White', price: 249, description: 'Silky micro-foam over espresso', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80' },
    { id: 106, title: 'Mocha', price: 279, description: 'Chocolate infused latte', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80' },
    { id: 107, title: 'Cold Brew', price: 259, description: '18-hour steeped infusion', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80' },
  ],
  'non-coffee': [
    { id: 201, title: 'Hot Chocolate', price: 219, description: 'Premium Belgian cocoa', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80' },
    { id: 202, title: 'Fresh Orange Juice', price: 199, description: '100% natural and chilled', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80' },
    { id: 203, title: 'Lemonade', price: 149, description: 'Zesty classic refresher', image: 'https://images.unsplash.com/photo-1523472721958-978152f4d69b?auto=format&fit=crop&w=600&q=80' },
  ],
  breakfast: [
    { id: 301, title: 'Pancakes Stack', price: 329, description: 'Honey, butter and blueberries', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=600&q=80' },
    { id: 302, title: 'Belgian Waffles', price: 349, description: 'With maple syrup & whipped cream', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&w=600&q=80' },
    { id: 303, title: 'Sandwich Breakfast', price: 399, description: 'Sourdough, eggs, and greens', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80' },
  ],
  snacks: [
    { id: 401, title: 'Veg Sandwich', price: 249, description: 'Garden fresh veggies & herb mayo', image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?auto=format&fit=crop&w=600&q=80' },
    { id: 402, title: 'Grilled Cheese', price: 299, description: 'Triple cheddar melt', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
    { id: 403, title: 'Crispy Burger', price: 349, description: 'Classic patty with special sauce', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80' },
    { id: 404, title: 'French Fries', price: 179, description: 'Salted golden delight', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80' },
  ],
  main: [
    { id: 501, title: 'Pasta Alfredo', price: 449, description: 'Creamy white sauce with herbs', image: 'https://images.unsplash.com/photo-1608219992759-8d74ed8d76eb?auto=format&fit=crop&w=600&q=80' },
    { id: 502, title: 'Farmhouse Pizza', price: 549, description: 'Thin crust loaded with toppings', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80' },
    { id: 503, title: 'Asian Noodles', price: 399, description: 'Stir fried with seasonal veggies', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80' },
  ],
  desserts: [
    { id: 601, title: 'Chocolate Cake', price: 249, description: 'Moist layers of dark cocoa', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80' },
    { id: 602, title: 'New York Cheesecake', price: 349, description: 'Classic creamy baked cheese', image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80' },
    { id: 603, title: 'Fudge Brownie', price: 199, description: 'Warm and gooey chocolate', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80' },
  ],
  'cold-drinks': [
    { id: 701, title: 'Iced Tea', price: 179, description: 'Peach or Lemon infusion', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },
    { id: 702, title: 'Mocktail Blue', price: 229, description: 'Refreshing citrus lagoon', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
  ],
  'thick-shakes': [
    { id: 801, title: 'Classic Vanilla', price: 249, description: 'Rich vanilla bean shake', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80' },
    { id: 802, title: 'Choco Blast', price: 299, description: 'Thick Belgian chocolate', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80' },
  ],
  special: [
    { id: 901, title: 'Signature Loca Coffee', price: 349, description: 'House secret blend with gold dust', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80' },
    { id: 902, title: 'Chef Special Pasta', price: 499, description: 'Pink sauce tossed with exotic herbs', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80' },
  ]
};

// --- SHARED COMPONENTS ---

const ThemeModal = ({ isOpen, onClose, currentTheme, onSelectTheme }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl shadow-2xl p-6 border border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Palette className="text-[var(--color-accent)]" size={22} />
            <h2 className="text-xl font-bold font-serif text-[var(--color-text)]">Select Cafe Theme</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 hover:text-black transition-colors"><X size={20} /></button>
        </div>
        
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Choose your preferred aesthetic palette for LOCA Cafe.</p>
        
        <div className="space-y-3">
          {THEMES.map(theme => {
            const isSelected = currentTheme.id === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => { onSelectTheme(theme); }}
                className={`p-3.5 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                  isSelected ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)] shadow-sm' : 'border-[var(--color-border)] hover:border-gray-300 bg-[var(--color-surface)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex items-center gap-1.5 p-1 rounded-lg border border-black/10 bg-white/80 shadow-sm">
                    <span className="w-5 h-5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: theme.preview }} />
                    <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: theme.dotBg }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                      {theme.name}
                      {theme.id === 'berry' && <span className="text-[10px] font-normal uppercase bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full">Default</span>}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{theme.description}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={onClose} 
          className="mt-6 w-full py-3 bg-[var(--color-dark)] text-white font-bold rounded-xl text-sm hover:bg-[var(--color-accent)] transition-colors shadow-md"
        >
          Apply Theme
        </button>
      </div>
    </div>
  );
};

const BaristaBot = ({ isDesktop = false }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Brew-tiful day! ☕ Welcome to Loca. Need a recommendation?' }]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');
    setIsLoading(true);
    try {
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const payload = { contents: [{ parts: [{ text: input }] }], systemInstruction: { parts: [{ text: "You are a Barista at 'Loca Cafe'. Use coffee puns, suggest Signature Loca Coffee or Pasta. Be brief." }] } };
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      setMessages(prev => [...prev, { role: 'ai', text: result.candidates?.[0]?.content?.parts?.[0]?.text || "Brew-ing error!" }]);
    } catch (e) { setMessages(prev => [...prev, { role: 'ai', text: "Weak signal, strong coffee. Try again?" }]); }
    finally { setIsLoading(false); }
  };

  return (
    <div className={`flex flex-col ${isDesktop ? 'h-full bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden' : 'absolute inset-0 bg-[var(--color-bg)] p-4 pt-8'}`}>
      <div className={`flex items-center ${isDesktop ? 'p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)]' : 'justify-center mb-6'}`}>
        <Bot className="text-[var(--color-accent)] mr-2" />
        <h1 className={`${isDesktop ? 'text-xl' : 'text-3xl'} font-bold font-serif text-[var(--color-text)]`}>Loca AI</h1>
      </div>
      <div className={`flex-grow overflow-y-auto space-y-4 ${isDesktop ? 'p-4' : 'pb-24 px-2'} hide-scrollbar`}> 
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${msg.role === 'user' ? 'bg-[var(--color-dark)] text-white rounded-br-none' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] rounded-bl-none'}`}>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && <div className="animate-pulse flex space-x-2 p-4 text-xs text-gray-400">Loca Barista typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className={`${isDesktop ? 'p-4 bg-[var(--color-surface-subtle)] border-t border-[var(--color-border)]' : 'fixed bottom-20 left-4 right-4 z-20'}`}>
        <div className="flex items-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full shadow-lg p-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about our artisan Loca blends..." className="flex-grow p-3 outline-none bg-transparent text-[var(--color-text)] placeholder:text-gray-400" />
          <button onClick={handleSend} className="p-3 bg-[var(--color-accent)] text-white rounded-full hover:bg-[var(--color-accent-hover)] transition-colors"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

const CheckoutModal = ({ isOpen, onClose, cartItems, total, onComplete, isProcessing }) => {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const orderId = useRef(`LOCA-${Math.floor(Math.random() * 10000)}`).current;

  useEffect(() => { if (!isProcessing && step === 2) setStep(3); }, [isProcessing, step]);
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--color-surface)] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-subtle)]">
               <h2 className="text-xl font-bold font-serif text-[var(--color-text)]">Checkout</h2>
               <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            {step === 3 ? (
                <div className="flex-grow flex flex-col items-center justify-center p-8 bg-[var(--color-dark)] text-white">
                    <div className="bg-white text-black w-full max-w-sm p-6 rounded-none relative receipt-paper shadow-2xl animate-text-in mb-6">
                        <div className="text-center border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                            <h2 className="text-2xl font-serif font-bold tracking-wider">Loca Cafe</h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Order Receipt</p>
                            <p className="text-xs text-gray-400 mt-1">{orderId}</p>
                        </div>
                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                            {cartItems.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="font-mono truncate max-w-[70%]">{item.qty || 1}x {item.title}</span>
                                    <span className="font-mono">₹{item.price * (item.qty || 1)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t-2 border-dashed border-gray-300 pt-4">
                            <div className="flex justify-between font-bold text-xl"><span>TOTAL</span><span>₹{total}</span></div>
                        </div>
                    </div>
                    <div className="text-center space-y-4">
                       <div className="inline-flex items-center gap-2 text-[#4CAF50] font-bold text-lg bg-[#E8F5E9] px-6 py-2 rounded-full">
                           <CheckCircle size={20} /> Order Placed
                       </div>
                       <p className="text-gray-300 text-sm">Please pick up your order at the counter.</p>
                       <button onClick={onClose} className="text-white underline hover:text-[var(--color-accent)] transition-colors">Close & Continue Ordering</button>
                    </div>
                </div>
            ) : (
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 1 ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-200'}`}>1</div>
                        <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-[var(--color-accent)]' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 2 ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-200'}`}>2</div>
                    </div>
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">Table Number / Delivery Notes</label>
                              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Table 5" className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm outline-none focus:border-[var(--color-accent)] transition-colors" />
                            </div>
                            <button onClick={() => setStep(2)} disabled={!address} className="w-full py-4 bg-[var(--color-dark)] text-white font-bold rounded-xl shadow-lg disabled:opacity-50 hover:bg-[var(--color-accent)] transition-colors">Continue to Payment</button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="font-bold text-lg text-[var(--color-text)]">Select Payment Method</h3>
                            <div className="space-y-3">
                                {['UPI', 'Card', 'Pay at Counter'].map((m) => (
                                  <label key={m} className="flex items-center gap-4 p-4 border border-[var(--color-border)] rounded-xl cursor-pointer hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-all">
                                    <input type="radio" name="pay" className="w-5 h-5 accent-[var(--color-accent)]" defaultChecked={m === 'UPI'} />
                                    <span className="font-medium text-[var(--color-text)]">{m}</span>
                                  </label>
                                ))}
                            </div>
                            <button onClick={() => onComplete(orderId, address)} disabled={isProcessing} className="w-full py-4 bg-[var(--color-dark)] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-3 hover:bg-[var(--color-accent)] transition-colors">
                                {isProcessing ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></span> : 'Confirm & Pay'}
                            </button>
                        </div>
                    )}
                </div>
            )}
          </div>
      </div>
  );
};

// --- MOBILE COMPONENTS ---

const MobileHeader = ({ onHeaderClick, orderType, location, onOpenThemeModal }) => (
    <header className="absolute top-0 left-0 right-0 z-10 p-6 pt-8 flex justify-between items-start">
      <div>
        <button onClick={() => onHeaderClick('toggleOrderType')} className="flex items-center gap-2 cursor-pointer group active:scale-95 transition-transform">
          <h1 className="text-3xl font-bold text-white font-serif tracking-widest drop-shadow-md group-hover:text-[var(--color-accent)] transition-colors">
            {orderType === 'dine_in' ? 'DINE IN' : 'TAKEAWAY'}
          </h1>
          <ChevronDown size={24} className="text-[var(--color-accent)] group-hover:translate-y-1 transition-transform" />
        </button>
        <div className="flex items-center text-[var(--color-accent)] text-xs font-sans tracking-wide mt-1 drop-shadow-sm font-semibold">
          <MapPin size={14} className="mr-1 flex-shrink-0" />
          <span className="uppercase tracking-wider max-w-[160px] truncate">{location.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onOpenThemeModal} 
          className="p-2 rounded-lg bg-white/90 backdrop-blur-sm text-[var(--color-dark)] hover:text-[var(--color-accent)] transition-colors shadow-lg active:scale-95" 
          title="Change Theme"
        >
          <Palette size={18} />
        </button>
        <button 
          onClick={() => onHeaderClick('changeLocation')} 
          className="text-[var(--color-dark)] font-bold text-xs px-3.5 py-2 rounded-lg bg-white hover:bg-[var(--color-accent)] hover:text-white transition-colors shadow-lg uppercase tracking-wider backdrop-blur-sm active:scale-95"
        >
          Change
        </button>
      </div>
    </header>
);

const MobileHeroBanner = ({ onHeaderClick, orderType, location, onOpenThemeModal }) => {
  const slides = [
    { image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80', title: 'Cup. Comfort.', subtitle: 'Connection.' },
    { image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=1200&q=80', title: 'LOCA', subtitle: 'Artisan Roastery & Kitchen' },
    { image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=1200&q=80', title: 'Freshly Baked', subtitle: 'Every Single Morning' },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const slideInterval = setInterval(() => { setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length); }, 1000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  return (
    <div className="relative w-full h-[55vh] overflow-hidden bg-[var(--color-dark)]">
      {slides.map((slide, index) => (
        <img key={index} src={slide.image} alt="Loca Cafe" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-90 ken-burns' : 'opacity-0'}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/20 to-transparent"></div>
      <MobileHeader onHeaderClick={onHeaderClick} orderType={orderType} location={location} onOpenThemeModal={onOpenThemeModal} />
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-6 pt-20">
        <div className="overflow-hidden"><h1 key={`${currentIndex}-title`} className="text-5xl md:text-7xl font-bold font-serif tracking-wide animate-text-in text-white">{slides[currentIndex].title}</h1></div>
        <div className="overflow-hidden mt-4"><p key={`${currentIndex}-subtitle`} className="text-xl md:text-3xl font-sans font-light animate-text-in text-[var(--color-accent)]" style={{ animationDelay: '0.3s' }}>{slides[currentIndex].subtitle}</p></div>
      </div>
    </div>
  );
};

const MobileLayout = (props) => {
  const { 
    activeView, setActiveView, cart, user, orderType, location, lastAddedItem, 
    handleHeaderClick, handleAddToCart, handleUpdateQuantity, handleRemoveItem, 
    setLightboxImage, setShowCheckoutModal, setShowLoginModal, selectedCategory, 
    setSelectedCategory, onOpenThemeModal 
  } = props;
  const total = cart.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
  const tax = total * 0.05;
  const finalTotal = Math.round(total + tax);

  return (
    <div className="w-full h-screen bg-[var(--color-bg)] font-sans flex flex-col overflow-hidden text-[var(--color-text)] relative transition-colors duration-300">
      {lastAddedItem && (
        <div className="fixed top-8 left-4 right-4 z-[100] bg-[var(--color-dark)] text-white p-4 rounded-xl shadow-2xl flex items-center justify-between animate-text-in border border-[var(--color-border)]/20">
           <div className="flex items-center gap-3">
              <img src={lastAddedItem.image} className="w-10 h-10 rounded-md object-cover" />
              <div><p className="font-bold text-sm">Added {lastAddedItem.title}!</p></div>
           </div>
           <button onClick={() => {setActiveView('cart');}} className="bg-[var(--color-accent)] text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors">View Cart</button>
        </div>
      )}
      
      <main className="flex-grow overflow-y-auto relative pb-24">
        {activeView === 'home' && (
          <div className="animate-fade-in">
            <MobileHeroBanner onHeaderClick={handleHeaderClick} orderType={orderType} location={location} onOpenThemeModal={onOpenThemeModal} />
            <div className="p-8 text-center">
              <h2 className="text-3xl font-serif font-bold text-[var(--color-text)]">Welcome to Loca</h2>
              <p className="text-[var(--color-accent)] italic mt-1 text-lg font-medium">Cup. Comfort. Connection.</p>
            </div>
            
            {/* Horizontal Scroll Sections */}
            {[ {t: "Signature Choices ⭐", d: MENU_DATA.special}, {t: "Our Morning Brews ☕", d: MENU_DATA.coffee.slice(0,4)} ].map((sec, idx) => (
                <section key={idx} className="mt-4 pl-6 pb-4">
                  <div className="flex items-baseline justify-between pr-6 mb-4">
                    <h2 className="text-xl font-bold text-[var(--color-text)] font-serif">{sec.t}</h2>
                    <span onClick={() => setActiveView('more')} className="text-[var(--color-accent)] text-xs font-bold cursor-pointer hover:underline">View All</span>
                  </div>
                  <div className="flex overflow-x-auto space-x-5 hide-scrollbar pb-4 pr-6">
                    {sec.d.map((item, index) => (
                      <div key={index} className="flex-shrink-0 w-[180px] bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden group">
                        <div className="h-[140px] overflow-hidden relative cursor-pointer" onClick={() => setLightboxImage(item.image)}>
                          <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute bottom-0 right-0 bg-[var(--color-surface)]/90 backdrop-blur px-3 py-1 rounded-tl-xl text-xs font-bold text-[var(--color-text)] shadow-sm">₹{item.price}</div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-serif font-bold text-md text-[var(--color-text)] leading-tight mb-1">{item.title}</h3>
                          <button onClick={() => handleAddToCart(item)} className="w-full mt-2 py-2 rounded-lg bg-[var(--color-dark)] text-white text-xs font-bold uppercase tracking-wider hover:bg-[var(--color-accent)] transition-colors">Add</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
            ))}

            <div className="p-6">
                <h2 className="text-xl font-bold font-serif mb-4 text-[var(--color-text)]">Quick Categories</h2>
                <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                        <div key={cat.id} onClick={() => { setSelectedCategory(cat.id); setActiveView('more'); }} className={`p-4 rounded-2xl ${cat.color} flex flex-col items-center justify-center text-center cursor-pointer active:scale-95 transition-transform shadow-sm`}>
                            {React.cloneElement(cat.icon, { size: 24 })}
                            <span className="text-[10px] font-bold mt-2 uppercase tracking-tighter leading-none">{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {activeView === 'cart' && (
            <div className="absolute inset-0 bg-[var(--color-bg)] flex flex-col h-full animate-fade-in z-20">
                 <div className="p-6 bg-[var(--color-surface)] shadow-sm z-10 flex justify-between items-center border-b border-[var(--color-border)]">
                    <div><h2 className="text-3xl font-serif font-bold text-[var(--color-text)]">Your Cart 🛒</h2></div>
                    <button onClick={() => setActiveView('home')} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
                 </div>
                 {cart.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full opacity-50 text-[var(--color-text-muted)]"><ShoppingBag size={64} /><p className="mt-4 font-serif text-xl">Cart is empty</p></div>
                 ) : (
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 pb-32">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-4 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                                <img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
                                <div className="flex flex-col justify-between flex-grow">
                                    <div><h3 className="font-bold text-[var(--color-text)] font-serif">{item.title}</h3><p className="text-xs text-[var(--color-text-muted)]">₹{item.price}</p></div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 bg-[var(--color-surface-subtle)] rounded-lg px-2 py-1 border border-[var(--color-border)]">
                                            <button onClick={() => handleUpdateQuantity(idx, -1)} className="text-lg font-bold w-5">-</button>
                                            <span className="text-sm font-bold">{item.qty || 1}</span>
                                            <button onClick={() => handleUpdateQuantity(idx, 1)} className="text-lg font-bold w-5">+</button>
                                        </div>
                                        <button onClick={() => handleRemoveItem(idx)} className="text-red-400 p-1 hover:text-red-600"><X size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] space-y-2 mt-4 shadow-sm">
                             <div className="flex justify-between text-sm text-[var(--color-text-muted)]"><span>Item Total</span><span>₹{total}</span></div>
                             <div className="flex justify-between text-sm text-[var(--color-text-muted)]"><span>Tax (5%)</span><span>₹{Math.round(tax)}</span></div>
                             <div className="border-t border-dashed border-[var(--color-border)] my-2 pt-2 flex justify-between font-bold text-lg text-[var(--color-text)]"><span>Total</span><span>₹{finalTotal}</span></div>
                        </div>
                        <button onClick={() => (user?.displayName ? setShowCheckoutModal(true) : setShowLoginModal(true))} className="w-full py-4 bg-[var(--color-dark)] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] transition-colors">Proceed to Pay <span>₹{finalTotal}</span></button>
                    </div>
                 )}
            </div>
        )}
        
        {activeView === 'spy-ai' && <BaristaBot />}
        {activeView === 'gallery' && (
             <div className="absolute inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto p-6">
                 <div className="flex justify-between items-center mb-8"><h1 className="text-4xl font-serif font-bold text-[var(--color-text)]">Gallery</h1><button onClick={()=>setActiveView('home')} className="p-2 bg-gray-100 rounded-full"><X size={24}/></button></div>
                 <div className="columns-2 gap-4 space-y-4">
                     {Object.values(MENU_DATA).flat().map((item, i) => (
                         <img key={i} src={item.image} className="w-full rounded-xl hover:scale-105 transition-transform cursor-pointer shadow-sm" onClick={() => setLightboxImage(item.image)} />
                     ))}
                 </div>
             </div>
        )}

        {activeView === 'more' && (
             <div className="absolute inset-0 bg-[var(--color-bg)] z-50 overflow-y-auto pb-24">
                 <div className="p-6 sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur z-10 flex justify-between items-center border-b border-[var(--color-border)]">
                     <div className="flex items-center gap-3">
                        {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="p-1"><ArrowLeft size={24}/></button>}
                        <h1 className="text-2xl font-serif font-bold text-[var(--color-text)]">{selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory).name : 'Menu'}</h1>
                     </div>
                     <button onClick={() => {setActiveView('home'); setSelectedCategory(null);}} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                 </div>
                 <div className="p-6">
                     {!selectedCategory ? (
                         <div className="grid grid-cols-2 gap-4">
                             {CATEGORIES.map(cat => (
                                 <div key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`p-6 rounded-3xl ${cat.color} flex flex-col items-start shadow-sm active:scale-95 transition-transform cursor-pointer`}>
                                     <div className="p-3 bg-white/50 rounded-2xl mb-4">{React.cloneElement(cat.icon, { size: 32 })}</div>
                                     <h3 className="text-xl font-bold">{cat.name}</h3>
                                     <p className="text-[10px] opacity-70 uppercase mt-1">{MENU_DATA[cat.id]?.length || 0} Items</p>
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <div className="space-y-4">
                             {MENU_DATA[selectedCategory].map((item, i) => (
                                 <div key={i} className="flex gap-4 p-4 bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)]" onClick={() => setLightboxImage(item.image)}>
                                     <img src={item.image} className="w-24 h-24 rounded-xl object-cover" />
                                     <div className="flex flex-col justify-between flex-grow">
                                          <div><h3 className="font-serif font-bold text-lg text-[var(--color-text)]">{item.title}</h3><p className="text-[10px] text-[var(--color-text-muted)] mt-1 line-clamp-2">{item.description}</p></div>
                                          <div className="flex justify-between items-center"><span className="font-bold text-lg text-[var(--color-text)]">₹{item.price}</span><button onClick={(e)=>{e.stopPropagation(); handleAddToCart(item);}} className="bg-[var(--color-dark)] text-white text-[10px] font-bold px-6 py-2 rounded-full hover:bg-[var(--color-accent)] transition-colors">ADD</button></div>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
        )}
      </main>

      <footer className="fixed bottom-4 left-4 right-4 bg-[var(--color-dark)] rounded-2xl shadow-2xl z-40 border border-white/10">
        <div className="flex justify-around items-center h-16 px-2">
          {[{ id: 'home', icon: <Home size={22} />, label: 'Home' }, { id: 'gallery', icon: <Star size={22} />, label: 'Gallery' }, { id: 'spy-ai', icon: <Bot size={22} />, label: 'Barista' }, { id: 'cart', icon: <ShoppingBag size={22} />, label: 'Cart' }, { id: 'more', icon: <BookOpen size={22} />, label: 'Menu' }].map(item => (
            <button key={item.id} onClick={() => { setActiveView(item.id); setSelectedCategory(null); }} className={`relative flex flex-col items-center transition-all ${activeView === item.id ? 'text-[var(--color-accent)] -translate-y-1' : 'text-white/60 hover:text-white'}`}>
              {item.icon}
              {item.id === 'cart' && cart.length > 0 && <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">{cart.reduce((a,b)=>a+(b.qty||1),0)}</span>}
              <span className="text-[10px] font-sans font-medium mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
};

// --- DESKTOP COMPONENTS (DASHBOARD) ---

const DesktopSidebar = ({ activeView, setActiveView, cartCount, toggleCart }) => {
  const menuItems = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'more', icon: <BookOpen size={24} />, label: 'Menu' },
    { id: 'spy-ai', icon: <Bot size={24} />, label: 'AI Barista' },
    { id: 'gallery', icon: <Star size={24} />, label: 'Gallery' },
  ];

  return (
    <div className="w-20 lg:w-24 h-screen bg-[var(--color-dark)] flex flex-col items-center py-8 z-[60] shadow-2xl fixed left-0 top-0 border-r border-white/10">
      <div className="mb-12 hover:scale-110 transition-transform cursor-pointer" onClick={() => setActiveView('home')} title="LOCA Cafe">
        <Coffee className="text-[var(--color-accent)]" size={32} />
      </div>
      <nav className="flex flex-col gap-8 w-full items-center">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group
              ${activeView === item.id ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/30' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            {item.icon}
            <div className="absolute left-14 bg-[var(--color-dark)] text-white text-xs px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">
               {item.label}
            </div>
          </button>
        ))}
        <div className="w-8 h-[1px] bg-white/15 my-2"></div>
        <button 
          onClick={toggleCart} 
          className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group ${cartCount > 0 ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white'}`}
        >
           <ShoppingBag size={24} />
           {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-[var(--color-accent)] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-md">{cartCount}</span>}
           <div className="absolute left-14 bg-[var(--color-dark)] text-white text-xs px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">
               View Cart
            </div>
        </button>
      </nav>
      <div className="mt-auto flex flex-col gap-4">
          <button className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"><LogOut size={20}/></button>
      </div>
    </div>
  );
};

const DesktopCartDrawer = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onCheckout }) => {
  const total = cartItems.reduce((acc, item) => acc + (item.price * (item.qty || 1)), 0);
  const tax = total * 0.05;
  const finalTotal = Math.round(total + tax);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-[var(--color-surface)] z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col border-l border-[var(--color-border)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-subtle)]">
             <div>
                <h2 className="text-2xl font-serif font-bold text-[var(--color-text)]">Your Order</h2>
                <p className="text-sm text-[var(--color-text-muted)] font-medium">Table 4 • Dine In</p>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
         </div>

         <div className="flex-grow overflow-y-auto p-6 space-y-4">
           {cartItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] opacity-60">
               <div className="bg-gray-100 p-6 rounded-full mb-4"><ShoppingBag size={48} /></div>
               <p className="font-serif text-lg">Cart is empty</p>
               <p className="text-sm">Add some delicious items from LOCA!</p>
             </div>
           ) : (
             cartItems.map((item, idx) => (
               <div key={idx} className="flex gap-4 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow group">
                 <img src={item.image} className="w-16 h-16 rounded-xl object-cover" />
                 <div className="flex-grow flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <h4 className="font-bold text-sm text-[var(--color-text)] line-clamp-1">{item.title}</h4>
                     <button onClick={() => onRemoveItem(idx)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                   </div>
                   <div className="flex justify-between items-center mt-2">
                     <div className="flex items-center gap-2 bg-[var(--color-surface-subtle)] rounded-lg border border-[var(--color-border)] px-2 py-1">
                       <button onClick={() => onUpdateQuantity(idx, -1)} className="text-xs hover:bg-gray-200 p-1 rounded transition-colors"><Minus size={12}/></button>
                       <span className="text-xs font-bold w-4 text-center">{item.qty || 1}</span>
                       <button onClick={() => onUpdateQuantity(idx, 1)} className="text-xs hover:bg-gray-200 p-1 rounded transition-colors"><Plus size={12}/></button>
                     </div>
                     <span className="font-bold text-sm text-[var(--color-text)]">₹{item.price * (item.qty || 1)}</span>
                   </div>
                 </div>
               </div>
             ))
           )}
         </div>

         {cartItems.length > 0 && (
            <div className="p-6 bg-[var(--color-surface)] border-t border-[var(--color-border)] shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm text-[var(--color-text-muted)]"><span>Subtotal</span><span>₹{total}</span></div>
                    <div className="flex justify-between text-sm text-[var(--color-text-muted)]"><span>Tax (5%)</span><span>₹{Math.round(tax)}</span></div>
                    <div className="flex justify-between text-xl font-bold text-[var(--color-text)] pt-4 border-t border-dashed border-[var(--color-border)]"><span>Total</span><span>₹{finalTotal}</span></div>
                </div>
                <button onClick={onCheckout} className="w-full py-4 bg-[var(--color-dark)] text-white font-bold rounded-xl shadow-lg hover:bg-[var(--color-accent)] transition-all active:scale-95 flex items-center justify-center gap-2 group">
                    Checkout <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                </button>
            </div>
         )}
      </div>
    </>
  );
};

const DesktopLayout = (props) => {
  const { 
    activeView, setActiveView, cart, user, handleAddToCart, handleUpdateQuantity, 
    handleRemoveItem, setLightboxImage, setShowCheckoutModal, setShowLoginModal, 
    selectedCategory, setSelectedCategory, currentTheme, onOpenThemeModal 
  } = props;
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [heroSlideIndex, setHeroSlideIndex] = useState(0);

  const desktopHeroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=2000&q=80',
      tag: 'Est. 2026 • Artisan Coffee & Kitchen',
      subtitle: 'Where artisan roasts meet culinary excellence and soulful comfort.'
    },
    {
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=2000&q=80',
      tag: 'Specialty Roastery • Master Crafted',
      subtitle: 'Single-origin beans freshly ground and brewed to perfection.'
    },
    {
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=2000&q=80',
      tag: 'Morning Bakery • Fresh Bakes',
      subtitle: 'Flaky artisanal croissants, handcrafted pastries and decadent desserts.'
    },
    {
      image: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=2000&q=80',
      tag: 'Loca Lounge • Good Vibes Only',
      subtitle: 'Your warm sanctuary for quiet afternoons and lively gatherings.'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIndex(prev => (prev + 1) % desktopHeroSlides.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [desktopHeroSlides.length]);

  const wrappedAddToCart = (item) => {
      handleAddToCart(item);
  };

  const renderContent = () => {
    if (activeView === 'home') {
      return (
        <div className="animate-fade-in pb-20">
            {/* Hero Section with 1s Slideshow */}
            <div className="relative w-full min-h-screen overflow-hidden flex flex-col justify-center">
                {desktopHeroSlides.map((slide, index) => (
                  <img 
                    key={index} 
                    src={slide.image} 
                    alt="Loca Cafe" 
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                      index === heroSlideIndex ? 'opacity-90' : 'opacity-0 pointer-events-none'
                    }`} 
                  />
                ))}
                <div className="absolute inset-0 bg-black/45 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                
                <div className="relative z-10 flex flex-col justify-center pl-16 lg:pl-32 max-w-4xl pt-24">
                   <span key={heroSlideIndex + '-tag'} className="text-[var(--color-accent)] font-bold tracking-widest uppercase mb-4 animate-text-in">
                     {desktopHeroSlides[heroSlideIndex].tag}
                   </span>
                   <h1 className="text-6xl lg:text-8xl text-white font-serif font-bold mb-6 drop-shadow-xl animate-text-in leading-tight">
                     Loca<br/>Cafe
                   </h1>
                   <p key={heroSlideIndex + '-sub'} className="text-xl lg:text-2xl text-gray-200 font-light max-w-xl mb-8 animate-text-in opacity-90">
                     {desktopHeroSlides[heroSlideIndex].subtitle}
                   </p>
                   <div className="flex items-center gap-4">
                     <button onClick={() => setActiveView('more')} className="bg-[var(--color-accent)] text-white px-8 py-4 rounded-full font-bold text-lg w-fit hover:bg-white hover:text-[var(--color-dark)] transition-all transform hover:translate-x-2 shadow-xl">
                       Explore Menu
                     </button>
                     <button onClick={() => setActiveView('gallery')} className="bg-white/15 backdrop-blur-md text-white border border-white/30 px-6 py-4 rounded-full font-bold text-lg w-fit hover:bg-white hover:text-black transition-all">
                       View Gallery
                     </button>
                   </div>
                </div>

                {/* Slide Indicator Dots */}
                <div className="absolute bottom-10 left-16 lg:left-32 z-20 flex items-center gap-3">
                  {desktopHeroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHeroSlideIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-500 cursor-pointer ${
                        idx === heroSlideIndex 
                          ? 'w-10 bg-[var(--color-accent)] shadow-lg' 
                          : 'w-2.5 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 lg:px-12 py-16">
                <div className="flex items-end justify-between mb-12 border-b border-[var(--color-border)] pb-4">
                   <div>
                      <h2 className="text-4xl font-bold text-[var(--color-text)] font-serif mb-2">Signature Selections</h2>
                      <p className="text-[var(--color-text-muted)]">Curated favorites crafted specially at LOCA</p>
                   </div>
                   <button onClick={() => setActiveView('more')} className="text-[var(--color-text)] font-bold underline hover:text-[var(--color-accent)] transition-colors">View Full Menu</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {MENU_DATA.special.concat(MENU_DATA.coffee.slice(0,2)).map((item, i) => (
                        <div key={i} className="group bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer flex flex-col" onClick={() => wrappedAddToCart(item)}>
                            <div className="h-64 overflow-hidden relative">
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                <button onClick={(e) => {e.stopPropagation(); setLightboxImage(item.image);}} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100"><Star size={16}/></button>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl text-[var(--color-text)] font-serif group-hover:text-[var(--color-accent)] transition-colors">{item.title}</h3>
                                    <span className="bg-[var(--color-surface-subtle)] text-sm font-bold px-3 py-1 rounded-full text-[var(--color-text)] border border-[var(--color-border)]">₹{item.price}</span>
                                </div>
                                <p className="text-sm text-[var(--color-text-muted)] mb-6 line-clamp-2 leading-relaxed flex-grow">{item.description}</p>
                                <button className="w-full py-3 bg-[var(--color-dark)] text-white text-sm font-bold rounded-xl uppercase tracking-wider hover:bg-[var(--color-accent)] transition-colors shadow-lg group-hover:shadow-xl translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300">Add to Order</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      );
    }

    if (activeView === 'more') {
        return (
            <div className="min-h-full pb-24 pt-24 px-8 lg:px-12">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-[var(--color-border)] pb-6">
                        <div>
                            <h1 className="text-5xl font-serif font-bold text-[var(--color-text)] mb-2">Our Menu</h1>
                            <p className="text-[var(--color-text-muted)]">Discover flavors crafted with passion at LOCA</p>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 mt-4 md:mt-0 w-full md:w-auto hide-scrollbar">
                            <button onClick={() => setSelectedCategory(null)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${!selectedCategory ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}>All</button>
                            {CATEGORIES.map(cat => (
                                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-2 whitespace-nowrap ${selectedCategory === cat.id ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 pb-24 animate-fade-in">
                        {(selectedCategory ? MENU_DATA[selectedCategory] : Object.values(MENU_DATA).flat()).map((item, i) => (
                            <div key={i} className="bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col h-full">
                                 <div className="h-56 overflow-hidden relative">
                                     <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                     <button onClick={(e) => { e.stopPropagation(); setLightboxImage(item.image); }} className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-black transition-colors"><Star size={14}/></button>
                                     <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm text-black">₹{item.price}</span>
                                 </div>
                                 <div className="p-5 flex flex-col flex-grow">
                                     <h3 className="font-bold text-[var(--color-text)] font-serif text-lg mb-2 leading-tight">{item.title}</h3>
                                     <p className="text-sm text-[var(--color-text-muted)] mb-6 line-clamp-2 leading-relaxed flex-grow">{item.description}</p>
                                     <button onClick={() => wrappedAddToCart(item)} className="w-full py-3 bg-[var(--color-surface)] border border-[var(--color-dark)] text-[var(--color-text)] font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition-all shadow-sm hover:shadow-lg active:scale-95">Add to Cart</button>
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (activeView === 'spy-ai') return <div className="p-8 lg:p-12 h-full flex items-center justify-center bg-[var(--color-bg)]"><div className="w-full max-w-2xl h-[80vh]"><BaristaBot isDesktop={true} /></div></div>;

    if (activeView === 'gallery') return (
        <div className="pt-24 px-8 lg:px-12 h-full overflow-y-auto">
             <div className="max-w-7xl mx-auto">
                <h2 className="text-5xl font-serif font-bold mb-8 text-[var(--color-text)]">Gallery</h2>
                <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
                    {Object.values(MENU_DATA).flat().map((item, i) => (
                        <div key={i} className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-pointer shadow-sm" onClick={() => setLightboxImage(item.image)}>
                            <img src={item.image} className="w-full rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-serif font-bold text-xl">View</div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text)] overflow-hidden transition-colors duration-300">
        <DesktopSidebar activeView={activeView} setActiveView={setActiveView} cartCount={cart.length} toggleCart={() => setIsCartOpen(!isCartOpen)} />
        
        <div className="flex-grow flex flex-col h-full overflow-hidden pl-20 lg:pl-24 transition-all duration-300">
            {/* Minimalist Desktop Header */}
            <header className="h-20 absolute top-0 right-0 left-20 lg:left-24 z-30 flex items-center justify-between px-12 pointer-events-none">
                <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-sm flex items-center gap-2 transition-all focus-within:ring-2 ring-[var(--color-accent)]">
                    <Search size={18} className="text-gray-300" />
                    <input type="text" placeholder="Search Loca menu..." className="bg-transparent outline-none text-sm w-48 placeholder:text-gray-300 text-white" />
                </div>
                <div className="flex items-center gap-4 pointer-events-auto">
                    {/* Theme Switcher Button */}
                    <button 
                      onClick={onOpenThemeModal} 
                      className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-[var(--color-accent)]/40 shadow-sm hover:shadow-md transition-all text-xs font-semibold hover:border-[var(--color-accent)] group"
                      title="Switch Cafe Theme"
                    >
                      <Palette size={16} className="text-[var(--color-accent)] group-hover:rotate-12 transition-transform" />
                      <span className="text-[var(--color-accent)] font-bold hidden lg:inline">{currentTheme.name}</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-inner" style={{ backgroundColor: currentTheme.preview }} />
                    </button>

                    <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-3 bg-black/40 backdrop-blur-md pl-4 pr-2 py-1.5 rounded-full border border-[var(--color-accent)]/40 shadow-sm hover:shadow-md hover:border-[var(--color-accent)] transition-all group">
                        <div className="text-right">
                            <p className="font-bold text-xs text-[var(--color-accent)] transition-colors">Hi, {user?.displayName?.split(' ')[0] || 'Guest'}</p>
                        </div>
                        <div className="w-8 h-8 bg-[var(--color-dark)] rounded-full flex items-center justify-center text-[var(--color-accent)] font-bold text-xs border border-[var(--color-accent)]/30 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                            {user?.displayName ? user.displayName[0] : <User size={14}/>}
                        </div>
                    </button>
                </div>
            </header>

            <main className="flex-grow bg-[var(--color-bg)] overflow-y-auto relative h-full">
                 {renderContent()}
            </main>
        </div>

        {/* Sliding Cart Drawer */}
        <DesktopCartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            cartItems={cart} 
            onUpdateQuantity={handleUpdateQuantity} 
            onRemoveItem={handleRemoveItem}
            onCheckout={() => { setIsCartOpen(false); (user?.displayName ? setShowCheckoutModal(true) : setShowLoginModal(true)); }}
        />
    </div>
  );
};

// --- APP COMPONENT ---

const App = () => {
  const [activeView, setActiveView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState('dine_in');
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isCartInitialized, setIsCartInitialized] = useState(false);

  // Theme State (Berry Bistro default)
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('loca_theme');
      if (!saved || saved === 'terracotta') {
        localStorage.setItem('loca_theme', 'berry');
        return THEMES[0];
      }
      return THEMES.find(t => t.id === saved) || THEMES[0];
    } catch (e) {
      return THEMES[0];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('loca_theme', currentTheme.id);
    } catch (e) {}
    document.documentElement.className = currentTheme.className;
  }, [currentTheme]);

  // Screen resize listener - 768px
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Auth error:", error);
            try { await signInAnonymously(auth); } catch (e) {}
        }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadCart = async () => {
       const savedCart = await getCartFromDB();
       if (savedCart?.length > 0) setCart(savedCart);
       setIsCartInitialized(true);
    };
    loadCart();
  }, []);

  useEffect(() => { if (isCartInitialized) saveCartToDB(cart); }, [cart, isCartInitialized]);

  const handleAddToCart = (item) => {
      const idx = cart.findIndex(c => c.id === item.id);
      if (idx > -1) {
          const newCart = [...cart];
          newCart[idx].qty = (newCart[idx].qty || 1) + 1;
          setCart(newCart);
      } else {
          setCart(prev => [...prev, { ...item, qty: 1 }]);
      }
      setLastAddedItem(item);
      setTimeout(() => setLastAddedItem(null), 4000);
  };

  const handleUpdateQuantity = (idx, change) => {
      const newCart = [...cart];
      const newQty = (newCart[idx].qty || 1) + change;
      if (newQty <= 0) newCart.splice(idx, 1);
      else newCart[idx].qty = newQty;
      setCart(newCart);
  };
  
  const handleRemoveItem = (idx) => {
      const newCart = [...cart];
      newCart.splice(idx, 1);
      setCart(newCart);
  }

  const handleHeaderClick = (action) => {
      if (action === 'toggleOrderType') setOrderType(prev => prev === 'dine_in' ? 'takeaway' : 'dine_in');
      else if (action === 'changeLocation') setShowLocationModal(true);
  };

  const handleCompleteOrder = async (orderId, address) => {
      if (!user) return;
      setIsPaymentProcessing(true);
      setTimeout(async () => {
          try {
              const orderData = { orderId, items: cart, total: cart.reduce((a,b)=>a+(b.price*(b.qty||1)),0), date: serverTimestamp(), status: 'placed', type: orderType, location: location.name, address, userId: user.uid };
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'orders'), orderData);
              setCart([]);
          } catch (e) { console.error("Order error:", e); } finally { setIsPaymentProcessing(false); }
      }, 2000);
  };

  const sharedProps = { 
    activeView, setActiveView, cart, user, orderType, location, lastAddedItem, 
    handleHeaderClick, handleAddToCart, handleUpdateQuantity, handleRemoveItem, 
    setLightboxImage, setShowCheckoutModal, setShowLoginModal, selectedCategory, 
    setSelectedCategory, currentTheme, onOpenThemeModal: () => setShowThemeModal(true) 
  };

  return (
    <div className={currentTheme.className}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
          .font-serif { font-family: 'Playfair Display', serif; }
          .font-sans { font-family: 'Montserrat', sans-serif; }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
          .ken-burns { animation: kenBurns 12s ease-out forwards; }
          @keyframes kenBurns { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
          .animate-text-in { animation: slideUp 0.6s ease-out forwards; }
          @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fadeIn 0.5s ease-out; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {isDesktop ? <DesktopLayout {...sharedProps} /> : <MobileLayout {...sharedProps} />}

      {/* Shared Modals */}
      <ThemeModal 
        isOpen={showThemeModal} 
        onClose={() => setShowThemeModal(false)} 
        currentTheme={currentTheme} 
        onSelectTheme={setCurrentTheme} 
      />

      {lightboxImage && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxImage(null)}>
            <img src={lightboxImage} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
            <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"><X size={32}/></button>
        </div>
      )}
      
      {showLoginModal && (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[var(--color-surface)] rounded-2xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden border border-[var(--color-border)]">
                <button onClick={()=>setShowLoginModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
                <h2 className="text-2xl font-serif font-bold text-[var(--color-text)] mb-6">Welcome to Loca</h2>
                {isLoginLoading ? <div className="py-8 text-center text-[var(--color-text)]"><div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>Signing in...</div> : 
                <form onSubmit={(e)=>{e.preventDefault(); const name = e.target.name.value; if(name.trim()){ setIsLoginLoading(true); updateProfile(auth.currentUser, {displayName:name}).then(()=>{setUser({...auth.currentUser, displayName:name}); setShowLoginModal(false); if(cart.length>0) setShowCheckoutModal(true); setIsLoginLoading(false);}); } }}>
                    <input name="name" type="text" placeholder="Your Name" className="w-full p-3 border border-[var(--color-border)] rounded-lg mb-4 outline-none focus:border-[var(--color-accent)] transition-colors bg-[var(--color-bg)] text-[var(--color-text)]" autoFocus />
                    <button type="submit" className="w-full py-3 bg-[var(--color-dark)] text-white font-bold rounded-lg hover:bg-[var(--color-accent)] transition-colors">Continue</button>
                </form>}
             </div>
        </div>
      )}
      
      {showLocationModal && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-fade-in" onClick={()=>setShowLocationModal(false)}>
            <div className="bg-[var(--color-surface)] w-full md:w-[400px] rounded-t-2xl md:rounded-2xl p-6 shadow-2xl border border-[var(--color-border)]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold font-serif text-[var(--color-text)]">Select Location</h2><button onClick={()=>setShowLocationModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={24}/></button></div>
                <div className="space-y-3">
                    {LOCATIONS.map(loc => (
                        <div key={loc.id} onClick={() => { setLocation(loc); setShowLocationModal(false); }} className={`p-4 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${location.id === loc.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]' : 'border-[var(--color-border)] hover:border-gray-300'}`}>
                            <div className="flex items-center gap-3"><div className={`p-2 rounded-full ${location.id === loc.id ? 'bg-[var(--color-accent)] text-white' : 'bg-gray-100 text-gray-500'}`}><MapPin size={20} /></div><div><p className="font-bold text-[var(--color-text)]">{loc.name}</p><p className="text-xs text-[var(--color-text-muted)]">{loc.distance} away</p></div></div>
                            {location.id === loc.id && <CheckCircle size={20} className="text-[var(--color-accent)]" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      <CheckoutModal isOpen={showCheckoutModal} onClose={() => { setShowCheckoutModal(false); setActiveView('home'); }} cartItems={cart} total={Math.round(cart.reduce((a,b)=>a+(b.price*(b.qty||1)),0) * 1.05)} onComplete={handleCompleteOrder} isProcessing={isPaymentProcessing} />
    </div>
  );
};

export default App;
