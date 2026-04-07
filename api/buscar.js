export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { q, category, condition } = req.query;
  const url = `https://api.mercadolibre.com/sites/MLB/search?q=${q}&category=${category}&condition=${condition}&price_min=500&price_max=2000&limit=20`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Erro ao buscar" });
  }
}
