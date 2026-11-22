# Hádankový svět – AI generátor s Google Gemini

Backend běží jako Cloudflare Worker a generuje tematické výpravy ze skutečného Gemini API. Statická aplikace dál běží na GitHub Pages. Výstup má stejnou strukturu, jakou už hra používá (název, příběh, úkoly, nápovědy, těžší varianty).

## Jak spustit (jednorázové nastavení)

1. Otevřete [Google AI Studio – API keys](https://aistudio.google.com/api-keys). Vytvořte klíč v projektu s přístupem k bezplatné úrovni Gemini. Konkrétní model a kvóty ověřte v [AI Studio – Rate limits](https://aistudio.google.com/rate-limit).
2. Vytvořte bezplatný účet [Cloudflare](https://dash.cloudflare.com/). Ve složce `backend` spusťte `npx wrangler login`, následně `npx wrangler deploy`. Tím vznikne veřejná HTTPS adresa Workeru.
3. V Cloudflare v části Workers & Pages → **hadankovy-ai** → Settings → Bindings vytvořte **KV namespace** a připojte ji pod názvem **LIMITS**. Worker bez tohoto úložiště generování z bezpečnostních důvodů odmítá.
4. V adresáři `backend` spusťte `npx wrangler secret put GEMINI_API_KEY` a vložte Gemini API klíč. **Klíč nikam veřejně neposílejte, neukládejte do repozitáře a nevkládejte do nastavení webové hry.**
5. Ve hře otevřete **AI výprava → AI připojení** a vložte URL Workeru, například `https://hadankovy-ai.<vas-subdomain>.workers.dev`. Tak nastavíte AI pro vlastní zařízení. Až budete chtít zpřístupnit AI všem rodičům, zadejte stejnou veřejnou URL do `ai-config.js` jako hodnotu `endpoint`. **Do tohoto souboru patří pouze URL, nikoli API klíč.**
6. Vyzkoušejte v aplikaci destinaci „Čertův kámen, Lodhéřov“. Testujte bezpečnost, návaznost příběhu a správnost místních detailů.

## Model a cena

- Výchozí model: `gemini-3.1-flash-lite`. Změnit ho lze v `wrangler.toml` na `gemini-3.5-flash-lite`, pokud jej máte dostupný. Po změně znovu spusťte `npx wrangler deploy`.
- V cenové dokumentaci Google mají tyto modely bezplatnou úroveň pro textové vstupy a výstupy, ale skutečná dostupnost a **RPM/RPD/TPM** kvóty závisí na projektu a mohou se měnit. Při překročení kvóty aplikace zobrazí chybu; nejde o neomezenou službu.
- Google uvádí, že vstupy z bezplatné úrovně mohou být použity ke zlepšování produktů. Backend proto neposílá jména dětí, pouze věk a obtížnost spolu s destinací a nepovinným popisem.
- Úspěšné generování vyžaduje internet. Dříve uložené výpravy lze používat offline.

## Bezpečnost a omezení

- Cizí rodiče nikdy nepotřebují vlastní API klíč; generování probíhá přes Worker.
- Povoluje se origin `https://jakubstrelec12-debug.github.io`. Origin lze napodobit mimo běžný prohlížeč, proto slouží pouze jako základní ochrana.
- KV binding `LIMITS` omezuje počet generování z jedné IP za den (výchozí 5). KV není atomický zámek, při souběžných požadavcích může dojít k překročení limitu. Před větším veřejným provozem přidejte Turnstile, robustní per-user quota a upozornění na spotřebu.
- Místní informace se snaží odvodit z textu rodiče a volitelného vyhledávání Wikipedie. **Nejde o potvrzení polohy či historických faktů.** Model může vytvořit nepřesné detaily. Vždy zkontrolujte místo a podmínky.
- Strukturovaný JSON výstup je kontrolován v backendu. Profily, výpravy a historie se ukládají v prohlížeči.

## Soubory

- `worker.js` – POST `/generate`, validace, bezpečný přístup k Gemini a limity
- `wrangler.toml` – konfigurace a model
- `../ai-config.js` – volitelná veřejná URL Workeru
- `../ai-adventure.js` – formulář a přehrávání výpravy

Dokumentace: [Gemini API](https://ai.google.dev/gemini-api/docs), [ceny](https://ai.google.dev/gemini-api/docs/pricing), [limity](https://ai.google.dev/gemini-api/docs/rate-limits).
