
import React, { useEffect, useState } from "react";

const API_URL = "https://dummyjson.com/quotes/random";
const starterQuotes = [
  { id: "local-1", quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { id: "local-2", quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { id: "local-3", quote: "Great things are done by a series of small things brought together.", author: "Vincent van Gogh" },
  { id: "local-4", quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { id: "local-5", quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" }
];

function readFavourites() {
  try {
    return JSON.parse(localStorage.getItem("quote-favourites") || "[]");
  } catch {
    return [];
  }
}

export default function App() {
  const [quote, setQuote] = useState(starterQuotes[0]);
  const [favourites, setFavourites] = useState(readFavourites);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getRandomQuote(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    localStorage.setItem("quote-favourites", JSON.stringify(favourites));
  }, [favourites]);

  async function getRandomQuote(signal) {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(API_URL, { signal });
      if (!response.ok) throw new Error("The quote service is temporarily unavailable.");
      const data = await response.json();
      if (!data.quote || !data.author) throw new Error("The API returned an unexpected response.");
      setQuote({ id: `api-${data.id ?? Date.now()}`, quote: data.quote, author: data.author });
    } catch (err) {
      if (err.name === "AbortError") return;
      // Keep the app useful even when the network/API is unavailable.
      const alternatives = starterQuotes.filter(item => item.quote !== quote.quote);
      const fallback = alternatives[Math.floor(Math.random() * alternatives.length)] || starterQuotes[0];
      setQuote(fallback);
      setError(`${err.message} Showing a saved sample quote instead.`);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  function toggleFavourite(item) {
    const exists = favourites.some(fav => fav.quote === item.quote && fav.author === item.author);
    setFavourites(current => exists
      ? current.filter(fav => !(fav.quote === item.quote && fav.author === item.author))
      : [{ ...item, id: `${item.id}-${Date.now()}` }, ...current]);
    setNotice(exists ? "Removed from favourites." : "Added to favourites.");
  }

  async function copyQuote() {
    const text = `“${quote.quote}” — ${quote.author}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Quote copied to clipboard!");
    } catch {
      setNotice("Clipboard access was blocked. Please copy the quote manually.");
    }
  }

  const isFavourite = favourites.some(item => item.quote === quote.quote && item.author === quote.author);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brand-mark">✦</span> Daily Quote Studio</a>
        <span className="top-note">A little inspiration, every day</span>
      </header>

      <section className="hero">
        <p className="eyebrow">PAUSE. READ. REFLECT.</p>
        <h1>A thought worth<br /><span>remembering.</span></h1>
        <p className="intro">Find a little inspiration for whatever today brings.</p>

        <article className="quote-card">
          <div className="quote-symbol">“</div>
          {loading ? (
            <div className="loading"><span className="spinner" /> Finding your next quote...</div>
          ) : (
            <>
              <blockquote>{quote.quote}</blockquote>
              <p className="author"><span /> {quote.author}</p>
            </>
          )}
          {error && <p className="message error" role="alert">{error}</p>}
          {notice && <p className="message success" role="status">{notice}</p>}
          <div className="actions">
            <button className="primary-btn" onClick={() => getRandomQuote()} disabled={loading}>
              {loading ? "Loading..." : "↻  New quote"}
            </button>
            <button className={`icon-btn ${isFavourite ? "active" : ""}`} onClick={() => toggleFavourite(quote)} aria-label="Toggle favourite" title="Save to favourites">
              {isFavourite ? "♥" : "♡"} <span>{isFavourite ? "Saved" : "Favourite"}</span>
            </button>
            <button className="icon-btn" onClick={copyQuote} title="Copy quote">▢ <span>Copy</span></button>
          </div>
        </article>
        <p className="source-note">Quotes are fetched live from DummyJSON. Sample quotes appear if the service is unavailable.</p>
      </section>

      <section className="favourites-section">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR COLLECTION</p><h2>Favourite quotes <span>({favourites.length})</span></h2></div>
          <span className="heart-badge">♥</span>
        </div>
        {favourites.length === 0 ? (
          <div className="empty-state"><span>♡</span><p>No favourites yet</p><small>Save a quote you love and it will appear here.</small></div>
        ) : (
          <div className="favourites-grid">
            {favourites.map(item => (
              <article className="favourite-card" key={item.id}>
                <p className="small-quote">“{item.quote}”</p>
                <div className="favourite-footer"><span>{item.author}</span><button onClick={() => toggleFavourite(item)} aria-label="Remove favourite" title="Remove">×</button></div>
              </article>
            ))}
          </div>
        )}
      </section>
      <footer>Made for curious minds <span>✦</span></footer>
    </main>
  );
}
