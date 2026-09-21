# TheTotal web/PWA — vaihe 1

Hyväksytty chatissa 2026-09-21. Tavoite: TheTotal toimii selaimessa ja kotinäytölle asennettuna (PWA) Vercelissä, jotta sen voi jakaa tutuille linkillä. Sama koodipohja palvelee edelleen natiivisovellusta.

## Päätökset

- **Sama koodipohja**: Expo SDK 54:n web-tuki (react-native-web, Metro). Ei erillistä web-sovellusta.
- **Supporter/RevenueCat poistetaan kokonaan**: `lib/purchases.ts`, `components/profile/SupporterCard.tsx`, `react-native-purchases`-riippuvuus, `supabase/functions/revenuecat-webhook`, `supabase/add-supporter.sql`, `is_supporter`-kenttä (tyyppi, kyselyt, BadgeRow-merkki), `supporter.*`- ja `profile.support*`-tekstit, RevenueCat-kohdat `.env`-mallista ja `TODO_JULKAISU.md`:stä. Tuotantokannassa ei ole `is_supporter`-saraketta, joten `app/user/[id].tsx`:n kysely on tällä hetkellä rikki — poisto korjaa sen.
- **Ilmoitukset**: webissä ei rekisteröidä push-tunnusta (vaihe 2 tuo web-pushin). Natiivin käytös ennallaan.
- **Alert**: react-native-webin `Alert.alert` ei tee mitään. Kaikki `Alert.alert`-kutsut korvataan `lib/alert.ts`:n `showAlert`-funktiolla: natiivissa sama kuin `Alert.alert`, webissä sovelluksen oma modaali (`components/ui/AlertHost.tsx`), joka tukee otsikkoa, viestiä ja 0–n nappia (`style: 'cancel' | 'destructive' | 'default'`).
- **Kuvan jakaminen** (rank-kortti, PR-kortti): webissä kortti kaapataan kuvaksi ja jaetaan `navigator.share({ files })`:lla, tai ladataan PNG:nä jos tiedostojen jako ei ole tuettu. Natiivi ennallaan.
- **Datan vienti**: webissä JSON ladataan tiedostona `thetotal-data.json`. Natiivi ennallaan.
- **Haptiikka**: webissä ei tehdä mitään (ei virheitä).
- **Asennettavuus**: nimi "TheTotal", tumma teema (`#0d0d1a`), kuvake `assets/icon.png`, `display: standalone`, iOS-kotinäyttötuki (apple-touch-icon, status bar). SPA-reititys Vercelissä (kaikki polut → `index.html`).
- **Kirjautuminen**: Supabase Authin Site URL ja sallitut uudelleenohjaukset asetetaan Vercel-osoitteeseen.
- **Julkaisu**: Vercel CLI, oma projekti `thetotal`. Natiivin EAS-julkaisu tapahtuu vasta kun `feature/web` yhdistetään masteriin (git-koukku julkaisee vain masterista).

## Rajattu pois (vaihe 2+)

Web-push, kutsulinkki, offline-tila, erillinen työpöytäasettelu (sovellus näytetään puhelinlevyisenä sarakkeena myös leveällä näytöllä).

## Hyväksymiskriteerit

- `npx tsc --noEmit` ja `npx jest` menevät läpi.
- `npx expo export -p web` tuottaa toimivan staattisen sivuston.
- Tuotanto-URL:ssa voi rekisteröityä, kirjautua, tehdä treenin, nähdä edistyksen, profiilin, sosiaalisen välilehden ja toisen käyttäjän profiilin puhelinkokoisella näytöllä ilman konsolivirheitä; vahvistusdialogit toimivat.
- Natiivikoodipolut eivät muutu käyttäytymiseltään (Platform-haarat).
