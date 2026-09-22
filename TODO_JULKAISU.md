# TheTotal — tehtävät ennen julkaisua

Supporter-osto poistettu 2026-09-21; sovellus on ilmainen.

Tämä lista on koottu kesäkuussa 2026. Koodi on valmis; alla on **manuaaliset asiat**
jotka vaativat sinun kauppa-/Supabase-tilisi.

---

## A. App Store / Play -julkaisuvalmius

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

## B. Jo tehty (ei toimenpiteitä)
- Pitkän treenin tallennusbugi (token-expiry) korjattu
- Jaa saavutus -bugi (päällekkäiset modaalit) korjattu + oma PR-jakokortti
- Liikevalitsimen ryhmäotsikot kääntyvät kielen mukaan
- Voimamies-liikkeet lisätty (SQL ajettu)
