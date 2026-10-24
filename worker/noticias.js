// Cloudflare Worker que convierte Google Noticias (RSS) en JSON con CORS abierto.
// Uso en la página: window.NEWS_ENDPOINT = "https://TU-WORKER.workers.dev";
// La página llama a NEWS_ENDPOINT?q=<búsqueda> y espera [{t, url, fecha, fuente}].
export default {
  async fetch(req) {
    const u = new URL(req.url);
    const q = u.searchParams.get("q") || '("Niño costero" OR "fenómeno El Niño") Perú when:7d';
    const rss = "https://news.google.com/rss/search?q=" + encodeURIComponent(q) + "&hl=es-419&gl=PE&ceid=PE:es-419";
    const xml = await (await fetch(rss)).text();
    const campo = (bloque, tag) => {
      const m = bloque.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">"));
      return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
    };
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 15).map(m => {
      const fuente = campo(m[1], "source");
      let t = campo(m[1], "title");
      if (fuente && t.endsWith(" - " + fuente)) t = t.slice(0, -(fuente.length + 3));
      return { t, url: campo(m[1], "link"), fecha: campo(m[1], "pubDate"), fuente };
    });
    return new Response(JSON.stringify(items), {
      headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "public, max-age=600" }
    });
  }
};
