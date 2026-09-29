# Radio Italiane per Spotify

Radio in diretta da tutto il mondo in una raccolta integrata nell'interfaccia di Spotify. Puoi scegliere e cercare una nazione, cercare e riordinare le emittenti, vedere il brano in onda e passare alla radio successiva usando i controlli di Spotify. Volume, muto, dissolvenze e normalizzazione seguono Spotify.

![Copertina di Radio Italiane](assets/cover.png)

## Perché ascoltare la radio dentro Spotify?

Spotify è generalmente migliore quando sai quale canzone, album, artista o podcast vuoi ascoltare. La radio offre però un'esperienza diversa: non scegli ogni brano e non puoi mandare avanti la diretta. Una redazione o un conduttore costruisce il flusso, alternando musica, programmi, notizie, sport, cultura e contenuti locali.

Questa app non prova a sostituire il catalogo di Spotify. Serve a riunire nello stesso player due modi complementari di ascoltare:

- **Diretta reale:** ascolti ciò che sta andando in onda in quel momento, insieme agli altri ascoltatori.
- **Scoperta meno prevedibile:** la selezione è fatta dalle emittenti e non dipende soltanto dalla cronologia e dagli algoritmi personali.
- **Voci e programmi:** conduzione, rubriche, interviste, radiocronache e programmi tematici non sempre esistono come contenuti separati su Spotify.
- **Informazione locale e internazionale:** puoi passare rapidamente da una radio della tua zona a un'emittente di un altro paese.
- **Un solo ambiente:** non devi aprire siti diversi, accettare popup o gestire un secondo player; volume, muto e comandi principali restano nell'interfaccia di Spotify.

Se vuoi il pieno controllo della scaletta, Spotify resta la scelta migliore. Quando vuoi una trasmissione in diretta o vuoi lasciare la scelta a qualcun altro, questa raccolta aggiunge ciò che manca al normale catalogo on demand.

## Funzioni principali

- Radio in diretta organizzate per nazione, con ricerca della nazione e dell'emittente.
- Loghi delle radio e copertina dell'app come immagine di riserva.
- Ordinamento personalizzato, salvato separatamente per ogni paese.
- Radio successiva collegata ai comandi precedente e successivo di Spotify.
- Informazioni sulla stazione e, quando disponibili, titolo e artista del brano in onda.
- Volume, muto, dissolvenza e normalizzazione integrati con Spotify.
- Riproduzione continua mentre visiti altre sezioni dell'app.

## Funzionamento

Il servizio locale legge gli indirizzi dei cataloghi internazionali collegati a radio-italiane.it e converte in diretta AAC, HLS e altri formati in MP3. Gli indirizzi si aggiornano all'ascolto e restano in cache per 15 minuti, con indirizzi di riserva nel catalogo.

Non salva file audio: usa buffer limitati in RAM e scarta i dati dopo l'ascolto. Stop e cambio radio chiudono il convertitore. La mappa dei segmenti HLS è limitata a 128 URL per sessione. La conversione usa CPU durante l'ascolto. Node e FFmpeg occupano circa 190 MiB su disco una sola volta; lo spazio non cresce ascoltando.

Il servizio ascolta soltanto su 127.0.0.1, richiede una chiave locale e accetta solo le stazioni del catalogo. Non espone porte sulla rete locale. Node verifica i certificati HTTPS delle emittenti. Questa raccolta è locale al computer e non si sincronizza come playlist dell'account o tramite Spotify Connect.

## Installazione e avvio

### Installazione rapida

Apri PowerShell e incolla questo comando:

```powershell
iwr -useb https://raw.githubusercontent.com/IPokemon54/spicetify-radio-italiane/main/install.ps1 | iex
```

Il comando scarica l'ultima release, esegue l'installer e rimuove automaticamente i file temporanei. Prima di eseguirlo puoi leggere [install.ps1](install.ps1) direttamente nel repository.

### Requisiti

- Windows 10 o Windows 11.
- Applicazione desktop di Spotify.
- Spicetify già installato e funzionante.

### Installazione dalla release

1. Apri la pagina **Releases** del repository e scarica `Radio-Italiane-Windows-v3.zip`.
2. Estrai completamente lo ZIP in una cartella. Non avviare l'installer direttamente dall'archivio compresso.
3. Apri PowerShell nella cartella estratta.
4. Esegui:

```powershell
.\install.ps1
```

5. Attendi il messaggio `Radio Italiane installata`.
6. Se Spotify non si aggiorna automaticamente, chiudilo completamente e riaprilo.
7. Apri **Radio Italiane** dalla raccolta laterale di Spotify.

L'installer copia l'app nella cartella CustomApps di Spicetify, abilita il servizio locale in Esecuzione automatica, lo avvia senza mostrare finestre e verifica la risposta del bridge prima di applicare la configurazione. Il servizio partirà automaticamente ai successivi accessi a Windows.

Se il bridge non parte, l'installer interrompe l'operazione e mostra il percorso del log diagnostico `bridge\service-error.log`. Il file di configurazione viene scritto in UTF-8 senza BOM su Windows PowerShell 5.1 e PowerShell 7; il bridge accetta anche configurazioni create in precedenza con BOM.

Se PowerShell blocca lo script perché proviene da Internet, apri le proprietà di `install.ps1`, seleziona **Sblocca**, conferma e riprova. Non è necessario installare separatamente Node.js o FFmpeg: sono già inclusi nella release.

### Aggiornamento

Scarica la nuova release, estraila in una cartella nuova ed esegui nuovamente `install.ps1`. I file dell'app vengono sostituiti; l'ordine personalizzato delle radio rimane salvato nei dati locali di Spotify.

### Rimozione

Per rimuovere la pagina da Spicetify:

```powershell
spicetify config custom_apps radio-italiane-
spicetify apply
```

Elimina inoltre il collegamento **Radio Italiane** dalla cartella Esecuzione automatica di Windows e la cartella `%APPDATA%\spicetify\CustomApps\radio-italiane`. Per fermare subito il servizio, prima della rimozione esegui `bridge\stop-service.ps1` dalla cartella installata.

## Marketplace

Il repository usa il topic GitHub spicetify-apps e il manifesto nella cartella principale. Il Marketplace può mostrare la scheda dell'app; questa versione richiede comunque l'installer della release perché il bridge locale include Node.js e FFmpeg.

## Verifiche

Sono stati verificati lo streaming del servizio, il controllo degli accessi, la chiusura dei convertitori dopo la disconnessione e il recupero dei loghi dai cataloghi nazionali. La disponibilità futura dipende dalle emittenti.

## Fonti e dipendenze

- Catalogo e stream pubblici: https://www.radio-italiane.it/
- Stream di riserva: https://www.radio-browser.info/
- Spicetify: https://spicetify.app/docs/development/custom-apps
- FFmpeg 9.0.2 essentials, Gyan, GPLv3: https://www.gyan.dev/ffmpeg/builds/
- Sorgente FFmpeg: https://github.com/FFmpeg/FFmpeg/commit/946fcce07b
- Node.js 24.19.0: https://nodejs.org/
- Licenze incluse in bridge/FFMPEG-LICENSE.txt e bridge/NODE-LICENSE.txt.

Integrazione indipendente, non ufficiale.
