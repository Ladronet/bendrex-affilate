# BENDREX.AFFILATE

Sito gaming con estetica cyberpunk minimale: palette neon, tipografia monospace, responsive PC/mobile.

## Live
- GitHub Pages: https://ladronet.github.io/bendrex-affilate/

## Sezioni
- Build PC: configurazioni Economy / Media / Ultra (build-pc.html)
- Blog / Forum: news, guide e discussioni (blog.html)
- Eventi Live: calendario esports/gaming (eventi.html)

## Stack
Sito statico (HTML + CSS + JS senza dipendenze): nessuna build necessaria. Pronto per essere migrato ad Astro/Next.js se servira un backend per forum e feed eventi.

## Come vederlo / testarlo (locale)

1. Clona il repo: git clone https://github.com/Ladronet/bendrex-affilate.git poi cd bendrex-affilate
2. Apri index.html nel browser, oppure servi la cartella con python -m http.server 8080 e apri http://localhost:8080

## Stato
- Contenuti dimostrativi (build, articoli, eventi) segnati come esempio.
- Nota: git, node, npm non sono disponibili sull'ambiente dell'agente: il push e avvenuto via API (GitHub, tramite Composio).

## Da decidere (non eseguito)
- Stack definitivo (statico vs Astro/Next).
- Deploy (Vercel) e dominio bendrex.it: richiedono conferma esplicita.
- Backend per forum e feed eventi.
