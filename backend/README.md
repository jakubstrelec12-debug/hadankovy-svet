# Hádankový svět – AI backend (Cloudflare Worker)

Tato serverová část přijímá destinaci, typ příběhu, věk a obtížnost dětí a vytváří **skutečné AI dobrodružství** přes OpenAI Responses API. Hlavní hra zůstává na GitHub Pages. Náklady OpenAI API hradí provozovatel podle využití.

## Postup prvního nasazení

1. V Cloudflare vytvořte účet. Na počítači nainstalujte Node.js, otevřete terminál ve složce `backend` a spusťte `npx wrangler login`.
2. Spusťte `npx wrangler deploy`. Cloudflare vytvoří Worker `hadankovy-ai` a zobrazí URL ve tvaru `https://hadankovy-ai.<subdomain>.workers.dev`.
3. V Cloudflare vytvořte KV namespace a ve Workeru přidejte binding s přesným názvem **LIMITS**. Bez tohoto kroku se generování záměrně nespustí, aby nedošlo k neomezené spotřebě API.
4. Přidejte secret: v adresáři backend spusťte `npx wrangler secret put OPENAI_API_KEY` a bezpečně vložte vlastní OpenAI API klíč. **Nikdy klíč nedávejte do HTML, GitHub repozitáře, veřejných nastavení ani chatu.**
5. Ve veřejném souboru `ai-config.js` změňte pouze hodnotu `endpoint` na HTTPS URL Workeru. GitHub Pages pak bude AI automaticky používat pro všechny návštěvníky. Do té doby si provozovatel může nastavit URL v aplikaci v sekci *AI připojení* jen na svém zařízení.
6. Otevřete Hádankový svět a zkuste například `Čertův kámen, Lodhéřov`. Zkontrolujte bezpečnost a konkrétní místní detaily; AI je může navrhnout nepřesně.

### Bezpečnost a provoz

- API klíč je jen na serveru. Worker používá strukturované JSON odpovědi a nastavuje `store:false`.
- Povolena je jen origin adresa `https://jakubstrelec12-debug.github.io`. Není to však plnohodnotné ověření identity: HTTP Origin lze mimo prohlížeč napodobit.
- Worker má **denní limit na IP** přes KV. Pro veřejné nasazení se větším provozem přidejte Cloudflare Turnstile, ochranu proti botům, účetní limity a monitoring nákladů. KV není atomická kontrola při souběžných požadavcích.
- Poloha je text zadaný rodičem. Vyhledávání Wikipedie je pouze orientační; AI **nemůže garantovat přesnou existenci objektů, cest či pověstí**. Uživatel musí úkoly posoudit.
- Profily a uložené výpravy zůstávají v localStorage telefonu. Server dostává jen věk/obtížnost (nikoliv jména), cíl a nepovinný popis.
- Offline lze používat již uloženou výpravu; vytvoření nové vyžaduje internet.
- Částka za každé generování závisí na aktuálním ceníku OpenAI API a použitých tokenech.

## Zdrojové soubory

`worker.js` – veřejné HTTPS API `POST /generate`
`wrangler.toml` – konfigurace Cloudflare Workeru
`../ai-config.js` – veřejná URL backendu (bez tajných hodnot)
