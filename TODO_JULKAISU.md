# TheTotal — tehtävät ennen julkaisua

Tämä lista on koottu kesäkuussa 2026. Koodi on valmis; alla on **manuaaliset asiat**
jotka vaativat sinun kauppa-/RevenueCat-/Supabase-tilisi.

---

## A. Supporter-kertaosto (badge) — saa se toimimaan

1. **Aja SQL Supabase SQL Editorissa:** `supabase/add-supporter.sql`
   - Lisää `users.is_supporter` -sarakkeen
   - Lisää RLS-säännön joka estää käyttäjää väärentämästä tukijastatusta
     (vain webhook/service_role saa muuttaa sitä)

2. **RevenueCat-tili** (https://app.revenuecat.com)
   - Luo projekti "TheTotal"
   - Hae **Public app-specific API keys** (iOS + Android)
   - Laita ne tiedostoon `.env`:
     ```
     EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
     EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
     ```

3. **Luo tuote molempiin kauppoihin** (sama hinta kummassakin)
   - App Store Connect: tyyppi **Non-Consumable**, esim. id `thetotal_supporter`
   - Google Play Console: **one-time product**, sama id

4. **RevenueCatissa kytke tuote**
   - Products → lisää molempien kauppojen tuote
   - Entitlements → luo entitlement nimeltä **`supporter`** (täsmälleen tämä nimi),
     liitä tuotteet siihen
   - Offerings → tee "current" offering johon tuote kuuluu

5. **Webhook (turvallinen, väärentämätön tukijastatus)**
   - Deployaa funktio: `supabase functions deploy revenuecat-webhook`
   - Aseta salaisuus: `supabase secrets set REVENUECAT_WEBHOOK_SECRET=<satunnainen-pitkä-merkkijono>`
   - RevenueCat → Integrations → Webhooks:
     - URL: `https://iixxsojjeaebhwsnzskl.supabase.co/functions/v1/revenuecat-webhook`
     - Authorization-header: **sama arvo** kuin REVENUECAT_WEBHOOK_SECRET

6. **Oikea build** (IAP ei toimi Expo Go:ssa):
   - `eas build --platform ios` ja `eas build --platform android`

> Huom: ilman kohtia 2–6 Supporter-kortti näkyy mutta on "ei saatavilla" -tilassa.
> Se on tarkoituksellista — osto vaatii oikean buildin + RevenueCat-asetukset.

---

## B. App Store / Play -julkaisuvalmius

Koodissa kunnossa: tilin poisto, privacy/terms-linkit, vain sähköposti-login
(ei pakollista Sign in with Applea), ei mainoksia/IAP-ongelmia iOS:llä.

Tehtävää ennen submitia:
1. **Apple Developer -jäsenyys** (99 $/v) + app App Store Connectiin
2. **Google Play Developer -tili** (25 $ kertamaksu) + app Play Consoleen
3. **Demo-tili arvioijalle** (kirjautuminen pakollinen → Apple/Google tarvitsevat testitunnukset)
4. **Privacy-nutrition-labelit** (mitä dataa kerätään: sähköposti, treenidata)
5. **Kuvakaappaukset + kuvaus + ikoni** (varmista että `assets/icon.png` on olemassa)
6. Varmista että `delete-account` poistaa **kaiken** käyttäjädatan (Apple testaa tämän)

---

## C. Jo tehty (ei toimenpiteitä)
- Pitkän treenin tallennusbugi (token-expiry) korjattu
- Jaa saavutus -bugi (päällekkäiset modaalit) korjattu + oma PR-jakokortti
- Liikevalitsimen ryhmäotsikot kääntyvät kielen mukaan
- Voimamies-liikkeet lisätty (SQL ajettu)
