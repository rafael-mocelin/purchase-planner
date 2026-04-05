import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "./supabase";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_CATEGORIES = {
  health:        { label: "Health & Wellbeing",   color: "#2dd4bf" },
  work:          { label: "Work & Game Dev",       color: "#818cf8" },
  content:       { label: "Content Creation",      color: "#f472b6" },
  household:     { label: "Household",             color: "#fb923c" },
  tools:         { label: "Tools & Accessories",   color: "#a78bfa" },
  subscriptions: { label: "Subscriptions",         color: "#38bdf8" },
  growth:        { label: "Growth & Learning",     color: "#4ade80" },
  lifestyle:     { label: "Lifestyle & Fitness",   color: "#f87171" },
  future:        { label: "Future / Not Urgent",   color: "#94a3b8" },
};

const PRESET_COLORS = [
  "#2dd4bf","#818cf8","#f472b6","#fb923c","#a78bfa",
  "#38bdf8","#4ade80","#f87171","#94a3b8","#facc15",
  "#e879f9","#34d399","#f97316","#60a5fa","#c084fc",
];

const CRITERIA = [
  { key: "problem",    label: "Solves Active Problem", desc: "Am I suffering, losing resources, or working around something?",                        weight: 3, emoji: "🔥" },
  { key: "revenue",    label: "Revenue / Opportunity",  desc: "Will this help me earn more or unlock tangible opportunities?",                         weight: 3, emoji: "💰" },
  { key: "urgency",    label: "Time Urgency",           desc: "Deadline, deteriorating situation, or seasonal need?",                                  weight: 2, emoji: "⏰" },
  { key: "daily",      label: "Daily Life Impact",      desc: "Meaningful difference in everyday quality of life?",                                    weight: 1, emoji: "✨" },
  { key: "delay_cost", label: "Cost of Delay",          desc: "What is it costing me right now to NOT have this? Time, money, health, opportunities?", weight: 2, emoji: "📉" },
];

const MAX_SCORE = CRITERIA.reduce((sum, c) => sum + c.weight * 3, 0);

const SEED_ITEMS = [
  { owner: "rafael", name: "Contact Lenses",             category: "health",        price_min: 30,  price_max: 60,   note: "Glasses hurt after 1h+ of use",                                    scores: { problem: 3, revenue: 1, urgency: 2, daily: 3, delay_cost: 2 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Mac Mini / Mac Studio",      category: "work",          price_min: 600, price_max: 2500, note: "For local AI workflows, UE5, Blender. Current MacBook has 8GB RAM",  scores: { problem: 3, revenue: 3, urgency: 2, daily: 3, delay_cost: 2 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "New Mouse",                  category: "tools",         price_min: 30,  price_max: 80,   note: "Current one is annoying",                                           scores: { problem: 2, revenue: 1, urgency: 1, daily: 2, delay_cost: 1 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "New Keyboard",               category: "future",        price_min: 50,  price_max: 150,  note: "Future purchase, don't need now",                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Clay + Sculpting Supplies",  category: "growth",        price_min: 150, price_max: 200,  note: "For modeling/sculpting practice",                                   scores: { problem: 0, revenue: 1, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Vacuum Sealer",              category: "household",     price_min: 13,  price_max: 13,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Screen Cleaner Kit",         category: "household",     price_min: 13,  price_max: 13,   note: "Liquid + cloth",                                                    scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Smart Light Switch (Voice)", category: "household",     price_min: 33,  price_max: 33,   note: "Voice command control",                                             scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Plants",                     category: "household",     price_min: 60,  price_max: 60,   note: "",                                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Vases for Plants",           category: "household",     price_min: 40,  price_max: 40,   note: "",                                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Frames / Paintings",         category: "household",     price_min: 30,  price_max: 100,  note: "",                                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Vacuum Steel Coffee Pot",    category: "household",     price_min: 12,  price_max: 12,   note: "For coffee beans storage",                                          scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Clothing Drawer Organizers", category: "household",     price_min: 15,  price_max: 30,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Egg Organizer (Fridge)",     category: "household",     price_min: 5,   price_max: 15,   note: "Tight fridge space",                                                scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Drill Kit",                  category: "tools",         price_min: 55,  price_max: 55,   note: "Need to disassemble stuff at home.",                                scores: { problem: 2, revenue: 0, urgency: 1, daily: 0, delay_cost: 1 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Italian Espresso Maker",     category: "household",     price_min: 20,  price_max: 45,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 2, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Espresso Cups",              category: "household",     price_min: 10,  price_max: 25,   note: "",                                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "3-in-1 Dock Charger",        category: "tools",         price_min: 23,  price_max: 23,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Kitchen Organizers",         category: "household",     price_min: 20,  price_max: 20,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Electric Grinder",           category: "tools",         price_min: 17,  price_max: 17,   note: "Cut brass tube for sculpting",                                      scores: { problem: 1, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Side Table (Sofa Work)",     category: "tools",         price_min: 15,  price_max: 15,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Reading Light",              category: "tools",         price_min: 2,   price_max: 2,    note: "For reading in the dark",                                           scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Portable Power Bank",        category: "tools",         price_min: 30,  price_max: 40,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "iPhone Smart Cover (MagSafe)", category: "tools",       price_min: 6,   price_max: 6,    note: "For power bank compatibility",                                      scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Wooden Laptop Stand",        category: "tools",         price_min: 30,  price_max: 45,   note: "Desk-on-desk for ergonomics",                                       scores: { problem: 2, revenue: 0, urgency: 0, daily: 2, delay_cost: 1 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Anti-touch Glove",           category: "tools",         price_min: 1,   price_max: 1,    note: "For digital drawing",                                               scores: { problem: 1, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "AI Video Gen Subscription",  category: "subscriptions", price_min: 15,  price_max: 30,   note: "e.g. Higgsfield. Monthly cost.",                                    scores: { problem: 0, revenue: 2, urgency: 1, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "3D Asset AI Subscription",   category: "subscriptions", price_min: 15,  price_max: 30,   note: "e.g. Meshy AI. Monthly cost.",                                      scores: { problem: 1, revenue: 2, urgency: 1, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "UE5 AI Assistant Sub",       category: "subscriptions", price_min: 10,  price_max: 30,   note: "AI tips/copilot for Unreal Engine",                                 scores: { problem: 1, revenue: 2, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Game Design Book",           category: "growth",        price_min: 50,  price_max: 80,   note: "",                                                                   scores: { problem: 0, revenue: 1, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Increase Grocery Budget",    category: "lifestyle",     price_min: 80,  price_max: 80,   note: "From 270 to 350/mo. Monthly increase.",                             scores: { problem: 1, revenue: 0, urgency: 1, daily: 3, delay_cost: 1 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Running Shoes",              category: "lifestyle",     price_min: 80,  price_max: 150,  note: "Can't join Saturday running club without proper gear!",              scores: { problem: 2, revenue: 0, urgency: 3, daily: 2, delay_cost: 3 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Running Long-sleeve Shirt",  category: "lifestyle",     price_min: 25,  price_max: 50,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 2, daily: 1, delay_cost: 2 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Running Shorts + Pants",     category: "lifestyle",     price_min: 40,  price_max: 80,   note: "",                                                                   scores: { problem: 1, revenue: 0, urgency: 2, daily: 1, delay_cost: 2 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "New Bible ESV with Notes",   category: "growth",        price_min: 30,  price_max: 60,   note: "",                                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 1, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Italian Course",             category: "future",        price_min: 100, price_max: 300,  note: "B1 level, want to continue",                                        scores: { problem: 0, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
  { owner: "rafael", name: "Japanese Course (couple)",   category: "future",        price_min: 150, price_max: 400,  note: "For me and wife",                                                   scores: { problem: 0, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcWeightedScore(scores) {
  return CRITERIA.reduce((total, c) => total + (scores[c.key] || 0) * c.weight, 0);
}

function getTier(score) {
  if (score >= 25) return { label: "BUY NOW",  key: "now",   color: "#10b981", bg: "#052e16" };
  if (score >= 15) return { label: "BUY SOON", key: "soon",  color: "#f59e0b", bg: "#451a03" };
  return                   { label: "LATER",   key: "later", color: "#64748b", bg: "#1e293b" };
}

// db helpers — map between app shape and supabase column names
function dbToItem(row) {
  return {
    id: row.id,
    owner: row.owner,
    name: row.name,
    category: row.category,
    priceMin: row.price_min,
    priceMax: row.price_max,
    note: row.note || "",
    scores: row.scores || { problem: 0, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 },
    purchased: row.purchased || false,
    in_cart: row.in_cart || false,
  };
}

function dbToCategory(row) {
  return { key: row.key, label: row.label, color: row.color };
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ score, max }) {
  const pct = (score / max) * 100;
  const tier = getTier(score);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 160 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#1e293b", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 4, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})`, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: tier.color, minWidth: 28, textAlign: "right" }}>{score}</span>
    </div>
  );
}

// ─── ScoreSlider ──────────────────────────────────────────────────────────────

function ScoreSlider({ value, onChange, criterion }) {
  const colors = ["#334155", "#f59e0b", "#fb923c", "#10b981"];
  const labels = ["N/A", "Low", "Med", "High"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.6, minWidth: 18 }}>{criterion.emoji}</span>
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1, 2, 3].map((v) => (
          <button key={v} onClick={() => onChange(v)} style={{
            width: 28, height: 22, borderRadius: 4, border: "none", cursor: "pointer",
            fontSize: 10, fontWeight: 700, fontFamily: "monospace",
            background: value === v ? colors[v] : "#0f172a",
            color: value === v ? (v === 0 ? "#94a3b8" : "#fff") : "#475569",
            transition: "all 0.15s ease",
            outline: value === v ? `2px solid ${colors[v]}44` : "none",
          }}>{labels[v]}</button>
        ))}
      </div>
    </div>
  );
}

// ─── ItemCard ─────────────────────────────────────────────────────────────────

function ItemCard({ item, onUpdateScore, onToggleCart, onDelete, onMarkPurchased, categories, accentColor }) {
  const [expanded, setExpanded] = useState(false);
  const score = calcWeightedScore(item.scores);
  const tier = getTier(score);
  const cat = categories[item.category] || { label: "Other", color: "#94a3b8" };
  const priceLabel = item.priceMin === item.priceMax ? `€${item.priceMin}` : `€${item.priceMin}–€${item.priceMax}`;

  return (
    <div style={{ background: "#0f172a", borderRadius: 12, border: `1px solid ${expanded ? (accentColor || tier.color) + "44" : "#1e293b"}`, transition: "all 0.2s ease", overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, userSelect: "none" }}>
        <button onClick={(e) => { e.stopPropagation(); onToggleCart(item.id, !item.in_cart); }} style={{
          width: 22, height: 22, borderRadius: 6,
          border: `2px solid ${item.in_cart ? (accentColor || "#10b981") : "#334155"}`,
          background: item.in_cart ? (accentColor || "#10b981") : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s ease",
        }}>
          {item.in_cart && <span style={{ color: "#fff", fontSize: 13, fontWeight: 800, lineHeight: 1 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>{item.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: cat.color + "18", color: cat.color, letterSpacing: 0.3 }}>{cat.label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>{priceLabel}</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: "1px 7px", borderRadius: 4, background: tier.bg, color: tier.color, letterSpacing: 0.5 }}>{tier.label}</span>
          </div>
        </div>
        <div style={{ width: 160, flexShrink: 0 }}><ScoreBar score={score} max={MAX_SCORE} /></div>
        <span style={{ fontSize: 14, color: "#475569", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e293b" }}>
          {item.note && <p style={{ fontSize: 12, color: "#94a3b8", margin: "12px 0 8px", fontStyle: "italic", lineHeight: 1.5 }}>"{item.note}"</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", marginTop: 12 }}>
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3, fontWeight: 600 }}>{c.label} <span style={{ opacity: 0.5 }}>({c.weight}x)</span></div>
                <ScoreSlider value={item.scores[c.key] || 0} criterion={c} onChange={(v) => onUpdateScore(item.id, c.key, v)} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => onMarkPurchased(item.id, true)} style={{ fontSize: 11, padding: "5px 14px", borderRadius: 6, border: "1px solid #14532d", background: "transparent", color: "#4ade80", cursor: "pointer", fontWeight: 600 }}>✓ Mark as Purchased</button>
            <button onClick={() => onDelete(item.id)} style={{ fontSize: 11, padding: "5px 14px", borderRadius: 6, border: "1px solid #7f1d1d", background: "transparent", color: "#f87171", cursor: "pointer", fontWeight: 600 }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AddItemForm ──────────────────────────────────────────────────────────────

function AddItemForm({ onAdd, categories, defaultOwner }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("household");
  const [owner, setOwner] = useState(defaultOwner || "rafael");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [note, setNote] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    await onAdd({ name: name.trim(), category, owner, price_min: Number(priceMin) || 0, price_max: Number(priceMax) || Number(priceMin) || 0, note, scores: { problem: 0, revenue: 0, urgency: 0, daily: 0, delay_cost: 0 }, purchased: false, in_cart: false });
    setName(""); setPriceMin(""); setPriceMax(""); setNote(""); setOpen(false);
  };

  const inp = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #1e293b", background: "#0f172a", color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: "100%", padding: 14, borderRadius: 12, border: "2px dashed #1e293b", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
      + Add New Item
    </button>
  );

  return (
    <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #334155", padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Item Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What do you want to buy?" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Add to List</label>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            <option value="rafael">Rafael</option>
            <option value="seela">Seela</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
            {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Price Min (€)</label>
            <input type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} style={inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Price Max (€)</label>
            <input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} style={inp} />
          </div>
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Note (optional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why do you want this?" style={inp} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
        <button onClick={() => setOpen(false)} style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Cancel</button>
        <button onClick={handleAdd} style={{ padding: "7px 20px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Add Item</button>
      </div>
    </div>
  );
}

// ─── CategoryManager ──────────────────────────────────────────────────────────

function CategoryManager({ categories, onAdd, onUpdate, onDelete, onClose }) {
  const [editingKey, setEditingKey] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const inp = { padding: "6px 10px", borderRadius: 6, border: "1px solid #1e293b", background: "#020617", color: "#e2e8f0", fontSize: 12, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

  const ColorPicker = ({ value, onChange }) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {PRESET_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: value === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 24, height: 24, borderRadius: 6, border: "none", padding: 0, cursor: "pointer" }} />
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000aa", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#0f172a", borderRadius: 16, border: "1px solid #334155", width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#e2e8f0" }}>Manage Categories</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", padding: "12px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(categories).map(([key, cat]) => (
            <div key={key} style={{ background: "#020617", borderRadius: 10, border: `1px solid ${editingKey === key ? cat.color + "55" : "#1e293b"}`, overflow: "hidden" }}>
              {editingKey === key ? (
                <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} style={inp} />
                  <ColorPicker value={editColor} onChange={setEditColor} />
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button onClick={() => setEditingKey(null)} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Cancel</button>
                    <button onClick={() => { onUpdate(key, editLabel, editColor); setEditingKey(null); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Save</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{cat.label}</span>
                  <button onClick={() => { setEditingKey(key); setEditLabel(cat.label); setEditColor(cat.color); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "2px 6px" }}>✏️</button>
                  <button onClick={() => { if (confirmDelete !== key) { setConfirmDelete(key); return; } onDelete(key); setConfirmDelete(null); }} style={{ background: confirmDelete === key ? "#7f1d1d" : "none", border: confirmDelete === key ? "1px solid #f87171" : "none", color: confirmDelete === key ? "#f87171" : "#475569", cursor: "pointer", fontSize: 11, padding: "2px 8px", borderRadius: 5, fontWeight: 600 }} onMouseLeave={() => setConfirmDelete(null)}>
                    {confirmDelete === key ? "Confirm?" : "✕"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #1e293b" }}>
          {!addOpen ? (
            <button onClick={() => setAddOpen(true)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "2px dashed #1e293b", background: "transparent", color: "#64748b", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add Category</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Category name..." style={inp} />
              <ColorPicker value={newColor} onChange={setNewColor} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setAddOpen(false)} style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Cancel</button>
                <button onClick={() => { if (!newLabel.trim()) return; onAdd(newLabel.trim(), newColor); setNewLabel(""); setNewColor(PRESET_COLORS[0]); setAddOpen(false); }} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Add</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TierToggle ───────────────────────────────────────────────────────────────

function TierToggle({ active, onChange }) {
  const tiers = [
    { key: "now",   label: "Now",  color: "#10b981" },
    { key: "soon",  label: "Soon", color: "#f59e0b" },
    { key: "later", label: "Later",color: "#64748b" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {tiers.map((t) => {
        const on = active.includes(t.key);
        return (
          <button key={t.key} onClick={() => onChange(on ? active.filter((x) => x !== t.key) : [...active, t.key])} style={{
            padding: "4px 11px", borderRadius: 6,
            border: `1px solid ${on ? t.color + "88" : "#1e293b"}`,
            background: on ? t.color + "22" : "transparent",
            color: on ? t.color : "#475569",
            cursor: "pointer", fontSize: 11, fontWeight: 700, transition: "all 0.15s",
          }}>{t.label}</button>
        );
      })}
    </div>
  );
}

// ─── PersonList ───────────────────────────────────────────────────────────────

function PersonList({ owner, label, isSeela, items, categories, onUpdateScore, onToggleCart, onDelete, onMarkPurchased, addItem, listPrefs, onPrefsChange }) {
  const { sortBy, filterCat, filterTiers } = listPrefs;
  const sel = { padding: "5px 8px", borderRadius: 7, border: "1px solid #1e293b", background: "#0f172a", color: "#94a3b8", fontSize: 11, fontWeight: 600, cursor: "pointer", outline: "none" };

  const activeItems  = items.filter((i) => i.owner === owner && !i.purchased);
  const purchasedItems = items.filter((i) => i.owner === owner && i.purchased);

  const sorted = useMemo(() => {
    let list = [...activeItems];
    if (filterCat !== "all") list = list.filter((i) => i.category === filterCat);
    if (filterTiers.length > 0) list = list.filter((i) => filterTiers.includes(getTier(calcWeightedScore(i.scores)).key));
    if (sortBy === "score")      list.sort((a, b) => calcWeightedScore(b.scores) - calcWeightedScore(a.scores));
    else if (sortBy === "price_low")  list.sort((a, b) => a.priceMin - b.priceMin);
    else if (sortBy === "price_high") list.sort((a, b) => b.priceMax - a.priceMax);
    else if (sortBy === "name")  list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [activeItems, sortBy, filterCat, filterTiers]);

  const tierCounts = useMemo(() => {
    const c = { now: 0, soon: 0, later: 0 };
    activeItems.forEach((i) => { c[getTier(calcWeightedScore(i.scores)).key]++; });
    return c;
  }, [activeItems]);

  const accentColor = isSeela ? "#ec4899" : "#818cf8";
  const gradientText = isSeela ? "linear-gradient(135deg, #f9a8d4, #ec4899)" : "linear-gradient(135deg, #e2e8f0, #94a3b8)";
  const dividerGradient = isSeela ? "linear-gradient(90deg, #ec489966, transparent)" : "linear-gradient(90deg, #81818266, transparent)";

  return (
    <div style={{ marginBottom: 52 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 52, fontWeight: 900, margin: 0, letterSpacing: -3, lineHeight: 1, background: gradientText, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{label}</h2>
        <div style={{ display: "flex", gap: 18, marginTop: 8 }}>
          {[
            { label: "Total",    value: activeItems.length,  color: "#94a3b8" },
            { label: "Buy Now",  value: tierCounts.now,      color: "#10b981" },
            { label: "Buy Soon", value: tierCounts.soon,     color: "#f59e0b" },
            { label: "Later",    value: tierCounts.later,    color: "#64748b" },
          ].map((t) => (
            <div key={t.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: t.color, fontFamily: "monospace", lineHeight: 1 }}>{t.value}</div>
              <div style={{ fontSize: 9, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 }}>{t.label}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 2, borderRadius: 1, marginTop: 14, background: dividerGradient }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>Sort</span>
        <select value={sortBy} onChange={(e) => onPrefsChange({ ...listPrefs, sortBy: e.target.value })} style={sel}>
          <option value="score">Priority Score</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
        <span style={{ fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginLeft: 4 }}>Category</span>
        <select value={filterCat} onChange={(e) => onPrefsChange({ ...listPrefs, filterCat: e.target.value })} style={sel}>
          <option value="all">All</option>
          {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span style={{ fontSize: 10, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginLeft: 4 }}>Tier</span>
        <TierToggle active={filterTiers} onChange={(v) => onPrefsChange({ ...listPrefs, filterTiers: v })} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.length === 0 && <div style={{ textAlign: "center", padding: "28px 0", color: "#334155", fontSize: 13 }}>No items match these filters.</div>}
        {sorted.map((item) => (
          <ItemCard key={item.id} item={item} onUpdateScore={onUpdateScore} onToggleCart={onToggleCart} onDelete={onDelete} onMarkPurchased={onMarkPurchased} categories={categories} accentColor={accentColor} />
        ))}
        <div style={{ marginTop: 8 }}>
          <AddItemForm onAdd={(data) => addItem({ ...data, owner })} categories={categories} defaultOwner={owner} />
        </div>
      </div>

      {purchasedItems.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>Purchased ({purchasedItems.length})</span>
            <div style={{ flex: 1, height: 1, background: "#1e293b" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {purchasedItems.map((item) => {
              const cat = categories[item.category] || { label: "Other", color: "#94a3b8" };
              const priceLabel = item.priceMin === item.priceMax ? `€${item.priceMin}` : `€${item.priceMin}–€${item.priceMax}`;
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", borderRadius: 10, background: "#0a0f1a", border: "1px solid #1e293b", opacity: 0.6 }}>
                  <span style={{ color: "#10b981", fontSize: 12, flexShrink: 0 }}>✓</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#475569", textDecoration: "line-through", textDecorationColor: "#334155" }}>{item.name}</span>
                    <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: cat.color + "12", color: cat.color + "88" }}>{cat.label}</span>
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#334155", fontWeight: 600, flexShrink: 0 }}>{priceLabel}</span>
                  <button onClick={() => onMarkPurchased(item.id, false)} title="Move back to list" style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 13, padding: "2px 4px" }}>↩</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ChartView ────────────────────────────────────────────────────────────────

function ChartView({ items, categories }) {
  const activeItems = items.filter((i) => !i.purchased);

  const tiers = [
    { label: "Buy Now",  key: "now",   color: "#10b981", items: activeItems.filter((i) => getTier(calcWeightedScore(i.scores)).key === "now") },
    { label: "Buy Soon", key: "soon",  color: "#f59e0b", items: activeItems.filter((i) => getTier(calcWeightedScore(i.scores)).key === "soon") },
    { label: "Later",    key: "later", color: "#64748b", items: activeItems.filter((i) => getTier(calcWeightedScore(i.scores)).key === "later") },
  ];
  const top10 = [...activeItems].sort((a, b) => calcWeightedScore(b.scores) - calcWeightedScore(a.scores)).slice(0, 10);
  const catTotals = {};
  activeItems.forEach((i) => {
    if (!catTotals[i.category]) catTotals[i.category] = { count: 0, minTotal: 0, maxTotal: 0 };
    catTotals[i.category].count++;
    catTotals[i.category].minTotal += i.priceMin;
    catTotals[i.category].maxTotal += i.priceMax;
  });
  const rafaelItems = activeItems.filter((i) => i.owner === "rafael");
  const seelaItems  = activeItems.filter((i) => i.owner === "seela");
  const rMin = rafaelItems.reduce((s, i) => s + i.priceMin, 0);
  const sMin = seelaItems.reduce((s, i) => s + i.priceMin, 0);
  const grand = rMin + sMin;

  const Card = ({ children }) => <div style={{ background: "#0f172a", borderRadius: 14, border: "1px solid #1e293b", padding: 20, marginBottom: 20 }}>{children}</div>;
  const STitle = ({ t }) => <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 16 }}>{t}</div>;

  return (
    <div>
      <Card>
        <STitle t="Priority Breakdown" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
          {tiers.map((t) => (
            <div key={t.key} style={{ background: "#020617", borderRadius: 10, padding: "14px 16px", border: `1px solid ${t.color}22` }}>
              <div style={{ fontSize: 30, fontWeight: 900, color: t.color, fontFamily: "monospace" }}>{t.items.length}</div>
              <div style={{ fontSize: 10, color: t.color + "aa", fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>€{t.items.reduce((s,i)=>s+i.priceMin,0)}–€{t.items.reduce((s,i)=>s+i.priceMax,0)}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 10, borderRadius: 5, overflow: "hidden", display: "flex" }}>
          {tiers.map((t) => <div key={t.key} style={{ width: `${activeItems.length ? (t.items.length/activeItems.length)*100 : 0}%`, background: t.color }} />)}
        </div>
      </Card>

      <Card>
        <STitle t="Rafael vs Seela" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[{ name: "RAFAEL", items: rafaelItems, min: rMin, max: rafaelItems.reduce((s,i)=>s+i.priceMax,0), color: "#818cf8" },
            { name: "SEELA",  items: seelaItems,  min: sMin, max: seelaItems.reduce((s,i)=>s+i.priceMax,0),  color: "#ec4899" }].map((p) => (
            <div key={p.name} style={{ background: "#020617", borderRadius: 10, padding: "14px 16px", border: `1px solid ${p.color}22` }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: p.color, fontFamily: "monospace" }}>{p.items.length}</div>
              <div style={{ fontSize: 10, color: p.color + "88", fontWeight: 800, letterSpacing: 1 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>€{p.min}–€{p.max}</div>
            </div>
          ))}
        </div>
        {grand > 0 && (
          <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${(rMin/grand)*100}%`, background: "#818cf8" }} />
            <div style={{ flex: 1, background: "#ec4899" }} />
          </div>
        )}
      </Card>

      <Card>
        <STitle t="Top 10 Priority Items" />
        {top10.map((item, idx) => {
          const score = calcWeightedScore(item.scores);
          const tier = getTier(score);
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: "#334155", fontWeight: 700, minWidth: 18, textAlign: "right" }}>{idx+1}</span>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.owner === "seela" ? "#ec4899" : "#818cf8", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#cbd5e1", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
              <div style={{ width: 110, height: 6, borderRadius: 3, background: "#1e293b", overflow: "hidden", flexShrink: 0 }}>
                <div style={{ width: `${(score/MAX_SCORE)*100}%`, height: "100%", background: tier.color }} />
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 12, color: tier.color, fontWeight: 700, minWidth: 24, textAlign: "right" }}>{score}</span>
            </div>
          );
        })}
      </Card>

      <Card>
        <STitle t="Budget by Category" />
        {(() => {
          const maxMax = Math.max(...Object.values(catTotals).map((c) => c.maxTotal), 1);
          return Object.entries(catTotals).sort((a,b)=>b[1].maxTotal-a[1].maxTotal).map(([key, data]) => {
            const cat = categories[key] || { label: key, color: "#94a3b8" };
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}>{cat.label} <span style={{ color: "#475569", fontWeight: 400 }}>({data.count})</span></span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>€{data.minTotal}–€{data.maxTotal}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#1e293b", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, width: `${(data.maxTotal/maxMax)*100}%`, height: "100%", background: cat.color + "33" }} />
                  <div style={{ position: "absolute", left: 0, top: 0, width: `${(data.minTotal/maxMax)*100}%`, height: "100%", background: cat.color }} />
                </div>
              </div>
            );
          });
        })()}
      </Card>

      <Card>
        <STitle t="Avg Score Per Criteria" />
        {CRITERIA.map((c) => {
          const avg = activeItems.length ? activeItems.reduce((s, i) => s + (i.scores[c.key] || 0), 0) / activeItems.length : 0;
          return (
            <div key={c.key} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>{c.emoji} {c.label}</span>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b" }}>{avg.toFixed(1)}/3</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "#1e293b", overflow: "hidden" }}>
                <div style={{ width: `${(avg/3)*100}%`, height: "100%", background: "linear-gradient(90deg, #38bdf844, #38bdf8)" }} />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [items,      setItems]      = useState([]);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [rafaelPrefs, setRafaelPrefs] = useState({ sortBy: "score", filterCat: "all", filterTiers: [] });
  const [seelaPrefs,  setSeelaPrefs]  = useState({ sortBy: "score", filterCat: "all", filterTiers: [] });
  const [activeTab,  setActiveTab]  = useState("lists");
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [showCart,   setShowCart]   = useState(false);
  const [usePriceMax,setUsePriceMax]= useState(false);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);

  // ── Seed + load ──────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      // Load categories
      const { data: catRows } = await supabase.from("categories").select("*");
      if (catRows && catRows.length > 0) {
        const catMap = {};
        catRows.forEach((r) => { catMap[r.key] = { label: r.label, color: r.color }; });
        setCategories(catMap);
      } else {
        // Seed categories on first run
        const seedCats = Object.entries(INITIAL_CATEGORIES).map(([key, v]) => ({ key, label: v.label, color: v.color }));
        await supabase.from("categories").insert(seedCats);
      }

      // Load items
      const { data: itemRows } = await supabase.from("items").select("*").order("id", { ascending: true });
      if (itemRows && itemRows.length > 0) {
        setItems(itemRows.map(dbToItem));
      } else {
        // Seed items on first run
        const { data: seeded } = await supabase.from("items").insert(SEED_ITEMS).select();
        if (seeded) setItems(seeded.map(dbToItem));
      }

      // Load preferences
      const { data: prefRows } = await supabase.from("preferences").select("*");
      if (prefRows) {
        prefRows.forEach((r) => {
          if (r.owner === "rafael") setRafaelPrefs(r.prefs);
          if (r.owner === "seela")  setSeelaPrefs(r.prefs);
        });
      }

      setLoading(false);
    }
    init();
  }, []);

  // ── Real-time subscriptions ───────────────────────────────────────────────────

  useEffect(() => {
    const itemsSub = supabase.channel("items-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setItems((prev) => {
            if (prev.find((i) => i.id === payload.new.id)) return prev;
            return [...prev, dbToItem(payload.new)];
          });
        }
        if (payload.eventType === "UPDATE") {
          setItems((prev) => prev.map((i) => i.id === payload.new.id ? dbToItem(payload.new) : i));
        }
        if (payload.eventType === "DELETE") {
          setItems((prev) => prev.filter((i) => i.id !== payload.old.id));
        }
      })
      .subscribe();

    const catsSub = supabase.channel("cats-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => {
        supabase.from("categories").select("*").then(({ data }) => {
          if (data) {
            const catMap = {};
            data.forEach((r) => { catMap[r.key] = { label: r.label, color: r.color }; });
            setCategories(catMap);
          }
        });
      })
      .subscribe();

    const prefsSub = supabase.channel("prefs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "preferences" }, (payload) => {
        if (payload.new.owner === "rafael") setRafaelPrefs(payload.new.prefs);
        if (payload.new.owner === "seela")  setSeelaPrefs(payload.new.prefs);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSub);
      supabase.removeChannel(catsSub);
      supabase.removeChannel(prefsSub);
    };
  }, []);

  // ── Prefs persistence ─────────────────────────────────────────────────────────

  const savePrefs = useCallback(async (owner, prefs) => {
    await supabase.from("preferences").upsert({ owner, prefs }, { onConflict: "owner" });
  }, []);

  const handleRafaelPrefs = useCallback((p) => { setRafaelPrefs(p); savePrefs("rafael", p); }, [savePrefs]);
  const handleSeelaPrefs  = useCallback((p) => { setSeelaPrefs(p);  savePrefs("seela",  p); }, [savePrefs]);

  // ── Item operations ───────────────────────────────────────────────────────────

  const addItem = useCallback(async (data) => {
    setSyncing(true);
    await supabase.from("items").insert([data]);
    setSyncing(false);
  }, []);

  const updateScore = useCallback(async (id, key, value) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newScores = { ...item.scores, [key]: value };
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, scores: newScores } : i));
    await supabase.from("items").update({ scores: newScores }).eq("id", id);
  }, [items]);

  const deleteItem = useCallback(async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await supabase.from("items").delete().eq("id", id);
  }, []);

  const toggleCart = useCallback(async (id, val) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, in_cart: val } : i));
    await supabase.from("items").update({ in_cart: val }).eq("id", id);
  }, []);

  const markPurchased = useCallback(async (id, val) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, purchased: val, in_cart: false } : i));
    await supabase.from("items").update({ purchased: val, in_cart: false }).eq("id", id);
  }, []);

  // ── Category operations ───────────────────────────────────────────────────────

  const addCategory = useCallback(async (label, color) => {
    const key = label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!key || categories[key]) return;
    await supabase.from("categories").insert([{ key, label, color }]);
  }, [categories]);

  const updateCategory = useCallback(async (key, label, color) => {
    await supabase.from("categories").update({ label, color }).eq("key", key);
  }, []);

  const deleteCategory = useCallback(async (key) => {
    await supabase.from("categories").delete().eq("key", key);
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const cartItems = useMemo(() => items.filter((i) => i.in_cart && !i.purchased), [items]);
  const cartTotal = useMemo(() => ({
    min: cartItems.reduce((s, i) => s + i.priceMin, 0),
    max: cartItems.reduce((s, i) => s + i.priceMax, 0),
  }), [cartItems]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#020617", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #1e293b", borderTopColor: "#10b981", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "#475569", fontSize: 13, margin: 0 }}>Loading your list...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const sharedListProps = { items, categories, onUpdateScore: updateScore, onToggleCart: toggleCart, onDelete: deleteItem, onMarkPurchased: markPurchased, addItem };

  return (
    <div style={{ minHeight: "100vh", background: "#020617", color: "#e2e8f0", fontFamily: "'Segoe UI', -apple-system, sans-serif", padding: "24px 16px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      {showCatMgr && <CategoryManager categories={categories} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} onClose={() => setShowCatMgr(false)} />}

      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: -0.5, background: "linear-gradient(135deg, #e2e8f0, #64748b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Purchase Priority Planner</h1>
            <p style={{ fontSize: 11, color: "#334155", margin: "3px 0 0" }}>Score items on 5 weighted criteria · Changes sync live for both of you</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {syncing && <span style={{ fontSize: 11, color: "#38bdf8" }}>↑ saving...</span>}
            <button onClick={() => setShowCatMgr(true)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>🏷️ Categories</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid #1e293b" }}>
          {[{ key: "lists", label: "📋  Lists" }, { key: "charts", label: "📊  Charts" }].map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: "9px 22px", borderRadius: "8px 8px 0 0",
              border: "1px solid #1e293b",
              borderBottom: activeTab === t.key ? "1px solid #020617" : "1px solid #1e293b",
              background: activeTab === t.key ? "#0f172a" : "transparent",
              color: activeTab === t.key ? "#e2e8f0" : "#475569",
              cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: -1, transition: "all 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {activeTab === "lists" && (
          <>
            {/* Cart */}
            <div style={{ background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b", marginBottom: 32, overflow: "hidden" }}>
              <div onClick={() => setShowCart(!showCart)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>🛒</span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Purchase Projection</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "#10b98122", color: "#10b981" }}>{cartItems.length} items</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: cartItems.length > 0 ? "#10b981" : "#475569" }}>
                    {cartTotal.min === cartTotal.max ? `€${cartTotal.min}` : `€${cartTotal.min} – €${cartTotal.max}`}
                  </span>
                  <span style={{ fontSize: 14, color: "#475569", transform: showCart ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
                </div>
              </div>
              {showCart && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #1e293b" }}>
                  {cartItems.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#475569", margin: "12px 0 0", textAlign: "center" }}>Check items to add them to your projection</p>
                  ) : (
                    <>
                      <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>Prices:</span>
                        <button onClick={() => setUsePriceMax(false)} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "none", background: !usePriceMax ? "#334155" : "transparent", color: !usePriceMax ? "#e2e8f0" : "#64748b", cursor: "pointer", fontWeight: 600 }}>Min</button>
                        <button onClick={() => setUsePriceMax(true)}  style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, border: "none", background:  usePriceMax ? "#334155" : "transparent", color:  usePriceMax ? "#e2e8f0" : "#64748b", cursor: "pointer", fontWeight: 600 }}>Max</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {[...cartItems].sort((a, b) => calcWeightedScore(b.scores) - calcWeightedScore(a.scores)).map((item) => {
                          const tier = getTier(calcWeightedScore(item.scores));
                          const price = usePriceMax ? item.priceMax : item.priceMin;
                          return (
                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 6, background: "#020617" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ width: 6, height: 6, borderRadius: 3, background: item.owner === "seela" ? "#ec4899" : "#818cf8", flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: "#cbd5e1" }}>{item.name}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ fontFamily: "monospace", fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>€{price}</span>
                                <button onClick={() => toggleCart(item.id, false)} style={{ fontSize: 11, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 2 }}>✕</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "10px", borderRadius: 8, background: "#10b98112", borderTop: "1px solid #10b98133" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#10b981" }}>Total</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: "#10b981" }}>€{usePriceMax ? cartTotal.max : cartTotal.min}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <PersonList owner="rafael" label="RAFAEL" isSeela={false} listPrefs={rafaelPrefs} onPrefsChange={handleRafaelPrefs} {...sharedListProps} />
            <PersonList owner="seela"  label="SEELA"  isSeela={true}  listPrefs={seelaPrefs}  onPrefsChange={handleSeelaPrefs}  {...sharedListProps} />

            {/* Legend */}
            <div style={{ marginTop: 8, padding: 16, background: "#0f172a", borderRadius: 12, border: "1px solid #1e293b" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Scoring Guide</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                {CRITERIA.map((c) => (
                  <div key={c.key} style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{c.emoji} {c.label}</span>
                    <span style={{ color: "#475569" }}> ({c.weight}x)</span>
                    <span style={{ display: "block", fontSize: 11, color: "#475569" }}>{c.desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                <span style={{ color: "#10b981" }}>■ BUY NOW (25+)</span>{" · "}
                <span style={{ color: "#f59e0b" }}>■ BUY SOON (15–24)</span>{" · "}
                <span style={{ color: "#64748b" }}>■ LATER (&lt;15)</span>
                <span style={{ display: "block", marginTop: 4, color: "#334155" }}>Max score: {MAX_SCORE}. Purple = Rafael, pink = Seela in charts.</span>
              </div>
            </div>
          </>
        )}

        {activeTab === "charts" && <ChartView items={items} categories={categories} />}

      </div>
    </div>
  );
}
