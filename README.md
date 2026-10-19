# BENDREX.AFFILATE

Sito gaming con estetica cyberpunk minimale: palette neon, tipografia monospace, responsive PC/mobile.

## Sezioni
- **Build PC** — configurazioni Economy / Media / Ultra (`build-pc.html`)
- **Blog / Forum** — news, guide e discussioni (`blog.html`)
- **Eventi Live** — calendario esports/gaming (`eventi.html`)

## Stack
Sito **statico** (HTML + CSS + JS senza dipendenze): nessuna build necessaria. Pronto per essere migrato in seguito ad Astro/Next.js se servirà un backend per forum e feed eventi.

## Come vederlo / testarlo (locale)

1. Clona il repo:
   ```bash
   git clone https://github.com/Ladronet/bendrex-affilate.git
   cd bendrex-affilate
   ```
2. Apri `index.html` direttamente nel browser, oppure servi la cartella:
   ```bash
   # Python
   python -m http.server 8080
   # Node
   npx serve .
   ```
   poi apri `http://localhost:8080`.

## Stato
- Contenuti dimostrativi (build, articoli, eventi) segnati come **esempio**.
- **Nota:** `git`, `node`, `npm` non sono disponibili sull'ambiente dell'agente: il push è avvenuto via API (GitHub, tramite Composio).

## Da decidere (non eseguito)
- Stack definitivo (statico vs Astro/Next).
- Deploy (Vercel) e dominio `bendrex.it` — richiedono conferma esplicita.
- Backend per forum e feed eventi.
