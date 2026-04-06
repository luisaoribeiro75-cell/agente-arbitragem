import { useState, useCallback } from "react";

const PRECO_MIN = 500;
const PRECO_MAX = 2000;

const CATEGORIAS = {
  "Eletrodomesticos": "MLB1574",
  "Eletronicos": "MLB1648",
  "Celulares": "MLB1051",
  "Ferramentas": "MLB1039",
};

function calcularScore(item) {
  const preco = item.price;
  const vendidos = item.sold_quantity || 0;
  const frete = item.shipping && item.shipping.free_shipping ? 1 : 0;
  const scorePreco = Math.max(0, 1 - (preco - PRECO_MIN) / (PRECO_MAX - PRECO_MIN));
  const scoreVendas = Math.min(vendidos / 100, 1);
  return Math.round((scorePreco * 0.5 + scoreVendas * 0.3 + frete * 0.2) * 100);
}

function estimarRevenda(preco) {
  const margemMin = Math.round(preco * 1.3);
  const margemMax = Math.round(preco * 1.6);
  return { margemMin, margemMax, lucroMin: margemMin - preco, lucroMax: margemMax - preco };
}

function ScoreBadge({ score }) {
  const cor = score >= 70 ? "#00e676" : score >= 45 ? "#ffab40" : "#ef5350";
  const label = score >= 70 ? "QUENTE" : score >= 45 ? "BOM" : "REGULAR";
  return (
    <span style={{
      background: cor + "22", color: cor,
      border: "1px solid " + cor + "55", borderRadius: 6,
      padding: "2px 8px", fontSize: 10, fontWeight: 700,
      letterSpacing: 1, fontFamily: "monospace", whiteSpace: "nowrap",
    }}>{label} {score}pts</span>
  );
}

function CardProduto({ item }) {
  const score = calcularScore(item);
  const revenda = estimarRevenda(item.price);
  const [expandido, setExpandido] = useState(false);
  return (
    <div
      onClick={() => setExpandido(!expandido)}
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        border: "1px solid #0f3460", borderRadius: 14,
        padding: "16px 18px", marginBottom: 10, cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {item.thumbnail && (
          <img src={item.thumbnail.replace("-I.jpg", "-O.jpg")} alt=""
            onError={e => e.target.style.display = "none"}
            style={{ width: 60, height: 60, objectFit: "contain", borderRadius: 8, background: "#ffffff10", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 13, color: "#e0e0e0", lineHeight: 1.4, flex: 1 }}>{item.title}</p>
            <ScoreBadge score={score} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 1 }}>COMPRAR POR</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#e94560", fontFamily: "monospace" }}>
                R$ {item.price.toLocaleString("pt-BR")}
              </div>
            </div>
            <div style={{ borderLeft: "1px solid #0f3460", paddingLeft: 12 }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 1 }}>REVENDER POR</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#00e676" }}>
                R$ {revenda.margemMin.toLocaleString("pt-BR")} - {revenda.margemMax.toLocaleString("pt-BR")}
              </div>
              <div style={{ fontSize: 11, color: "#aaa" }}>lucro: +R$ {revenda.lucroMin}-{revenda.lucroMax}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {item.shipping && item.shipping.free_shipping && (
              <span style={{ fontSize: 11, color: "#64b5f6", background: "#64b5f622", padding: "2px 7px", borderRadius: 4 }}>Frete gratis</span>
            )}
            {item.condition === "used" && (
              <span style={{ fontSize: 11, color: "#ffab40", background: "#ffab4022", padding: "2px 7px", borderRadius: 4 }}>Usado</span>
            )}
            {item.sold_quantity > 0 && (
              <span style={{ fontSize: 11, color: "#ce93d8", background: "#ce93d822", padding: "2px 7px", borderRadius: 4 }}>{item.sold_quantity} vendidos</span>
            )}
          </div>
        </div>
      </div>
      {expandido && item.permalink && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #0f3460" }}>
          <a href={item.permalink} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "inline-block", background: "#e94560", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            Ver no Mercado Livre
          </a>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Eletrodomesticos");
  const [condicao, setCondicao] = useState("used");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState("");
  const [ordenar, setOrdenar] = useState("score");

  const buscarProdutos = useCallback(async () => {
    if (!busca.trim()) return;
    setLoading(true);
    setErro("");
    setResultados([]);
    const catId = CATEGORIAS[categoria];
    const q = encodeURIComponent(busca.trim());
    const url = "https://api.mercadolibre.com/sites/MLB/search?q=" + q + "&category=" + catId + "&condition=" + condicao + "&price_min=" + PRECO_MIN + "&price_max=" + PRECO_MAX + "&limit=20";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data.results || !data.results.length) setErro("Nenhum produto encontrado. Tente outro termo.");
      else setResultados(data.results);
    } catch (e) {
      setErro("Erro ao buscar. Verifique sua conexao.");
    } finally {
      setLoading(false);
    }
  }, [busca, categoria, condicao]);

  const ordenados = [...resultados].sort((a, b) => {
    if (ordenar === "score") return calcularScore(b) - calcularScore(a);
    if (ordenar === "preco_asc") return a.price - b.price;
    if (ordenar === "vendidos") return (b.sold_quantity || 0) - (a.sold_quantity || 0);
    return 0;
  });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#e0e0e0" }}>
      <style>{"* { box-sizing: border-box; } input:focus, select:focus { outline: none; border-color: #e94560 !important; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }"}</style>
      <div style={{ background: "#0d1b2aee", borderBottom: "1px solid #e9456022", padding: "18px 20px 14px" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#fff" }}>Agente de Arbitragem</h1>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#e94560", letterSpacing: 2, fontFamily: "monospace" }}>MERCADO LIVRE - R${PRECO_MIN}-R${PRECO_MAX}</p>
      </div>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "18px 14px 60px" }}>
        <div style={{ background: "#1a1a2e", border: "1px solid #0f3460", borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            <input value={busca} onChange={e => setBusca(e.target.value)} onKeyDown={e => e.key === "Enter" && buscarProdutos()}
              placeholder="Ex: iPhone, furadeira, geladeira..."
              style={{ flex: 1, minWidth: 150, background: "#0d1b2a", border: "1px solid #0f3460", borderRadius: 8, padding: "10px 12px", color: "#e0e0e0", fontSize: 14 }} />
            <select value={categoria} onChange={e => setCategoria(e.target.value)}
              style={{ background: "#0d1b2a", border: "1px solid #0f3460", borderRadius: 8, padding: "10px 8px", color: "#e0e0e0", fontSize: 13 }}>
              {Object.keys(CATEGORIAS).map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={condicao} onChange={e => setCondicao(e.target.value)}
              style={{ background: "#0d1b2a", border: "1px solid #0f3460", borderRadius: 8, padding: "10px 8px", color: "#e0e0e0", fontSize: 13 }}>
              <option value="used">Usado</option>
              <option value="new">Novo</option>
              <option value="">Todos</option>
            </select>
          </div>
          <button onClick={buscarProdutos} disabled={loading || !busca.trim()}
            style={{ width: "100%", background: loading || !busca.trim() ? "#2a2a3e" : "linear-gradient(90deg, #e94560, #c0392b)", border: "none", borderRadius: 8, padding: "12px", color: loading || !busca.trim() ? "#555" : "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !busca.trim() ? "not-allowed" : "pointer" }}>
            {loading ? "Buscando..." : "Buscar Oportunidades"}
          </button>
        </div>
        {resultados.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {[{ v: "score", l: "Melhor oportunidade" }, { v: "preco_asc", l: "Menor preco" }, { v: "vendidos", l: "Mais vendidos" }].map(o => (
              <button key={o.v} onClick={() => setOrdenar(o.v)}
                style={{ background: ordenar === o.v ? "#e94560" : "#1a1a2e", border: "1px solid " + (ordenar === o.v ? "#e94560" : "#0f3460"), borderRadius: 6, padding: "5px 10px", color: "#e0e0e0", fontSize: 12, cursor: "pointer" }}>
                {o.l}
              </button>
            ))}
            <span style={{ marginLeft: "auto", fontSize: 12, color: "#555" }}>{resultados.length} produtos</span>
          </div>
        )}
        {erro && <div style={{ background: "#e9456011", border: "1px solid #e9456033", borderRadius: 10, padding: "14px 16px", color: "#e94560", fontSize: 14, marginBottom: 12 }}>{erro}</div>}
        {loading && [1, 2, 3].map(i => <div key={i} style={{ background: "#1a1a2e", borderRadius: 14, height: 110, marginBottom: 10, animation: "pulse 1.2s ease infinite", border: "1px solid #0f3460" }} />)}
        {!loading && ordenados.map((item, i) => <CardProduto key={item.id || i} item={item} />)}
        {!loading && resultados.length === 0 && !erro && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "#444" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>*</div>
            <p style={{ fontSize: 14 }}>Digite um produto e busque oportunidades de revenda</p>
          </div>
        )}
      </div>
    </div>
  );
}
