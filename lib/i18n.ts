import { getLocales } from 'expo-localization'
import { create } from 'zustand'

export type Locale = 'fi' | 'en'

function detectLocale(): Locale {
  const locales = getLocales()
  const primary = locales[0]?.languageCode?.toLowerCase()
  return primary === 'fi' ? 'fi' : 'en'
}

interface LocaleState {
  locale: Locale
  setLocale: (l: Locale) => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: detectLocale(),
  setLocale: (l) => set({ locale: l }),
}))

const STRINGS = {
  // Common
  'common.cancel':            { fi: 'Peruuta', en: 'Cancel' },
  'common.save':              { fi: 'Tallenna', en: 'Save' },
  'common.delete':            { fi: 'Poista', en: 'Delete' },
  'common.close':             { fi: 'Sulje', en: 'Close' },
  'common.confirm':           { fi: 'Vahvista', en: 'Confirm' },
  'common.back':              { fi: 'Takaisin', en: 'Back' },
  'common.next':              { fi: 'Seuraava', en: 'Next' },
  'common.send':              { fi: 'Lähetä', en: 'Send' },
  'common.start':             { fi: 'Aloita', en: 'Start' },
  'common.error':             { fi: 'Virhe', en: 'Error' },
  'common.skip':              { fi: 'Ohita', en: 'Skip' },
  'common.edit':              { fi: 'Muokkaa', en: 'Edit' },
  'common.add':               { fi: 'Lisää', en: 'Add' },
  'common.search':            { fi: 'Hae', en: 'Search' },
  'common.loading':           { fi: 'Ladataan...', en: 'Loading...' },
  'common.saving':            { fi: 'Tallennetaan...', en: 'Saving...' },
  'common.you':               { fi: 'sinä', en: 'you' },
  'common.today':             { fi: 'Tänään', en: 'Today' },
  'common.yesterday':         { fi: 'Eilen', en: 'Yesterday' },
  'common.days':              { fi: 'pv', en: 'd' },
  'common.minutes':           { fi: 'min', en: 'min' },
  'common.hours':             { fi: 'h', en: 'h' },
  'common.now':               { fi: 'nyt', en: 'now' },

  // Tabs
  'tabs.home':                { fi: 'Koti', en: 'Home' },
  'tabs.workouts':            { fi: 'Treeni', en: 'Workouts' },
  'tabs.progress':            { fi: 'Kehitys', en: 'Progress' },
  'tabs.friends':             { fi: 'Kaverit', en: 'Friends' },
  'tabs.profile':             { fi: 'Profiili', en: 'Profile' },

  // Auth
  'auth.email':               { fi: 'Sähköposti', en: 'Email' },
  'auth.password':            { fi: 'Salasana', en: 'Password' },
  'auth.username':            { fi: 'Käyttäjänimi', en: 'Username' },
  'auth.login':               { fi: 'Kirjaudu', en: 'Sign in' },
  'auth.signup':              { fi: 'Rekisteröidy', en: 'Sign up' },
  'auth.logout':              { fi: 'Kirjaudu ulos', en: 'Sign out' },

  // Onboarding
  'onboarding.title':         { fi: 'Aseta profiilisi', en: 'Set up your profile' },
  'onboarding.subtitle':      { fi: 'Kaikki kentät valinnaisia. Mitä enemmän annat, sitä tarkempi lähtörankkisi.', en: 'All fields optional. The more you provide, the more accurate your starting rank.' },
  'onboarding.gender':        { fi: 'SUKUPUOLI', en: 'GENDER' },
  'onboarding.male':          { fi: 'Mies', en: 'Male' },
  'onboarding.female':        { fi: 'Nainen', en: 'Female' },
  'onboarding.body':          { fi: 'KEHON MITAT', en: 'BODY' },
  'onboarding.weight':        { fi: 'PAINO (kg)', en: 'WEIGHT (kg)' },
  'onboarding.height':        { fi: 'PITUUS (cm)', en: 'HEIGHT (cm)' },
  'onboarding.bestResults':   { fi: 'PARHAAT TULOKSET (kg)', en: 'BEST LIFTS (kg)' },
  'onboarding.squat':         { fi: 'KYYKKY', en: 'SQUAT' },
  'onboarding.bench':         { fi: 'PENKKIPUNNERRUS', en: 'BENCH PRESS' },
  'onboarding.deadlift':      { fi: 'MAASTAVETO', en: 'DEADLIFT' },
  'onboarding.startingRank':  { fi: 'LÄHTÖRANKKISI', en: 'YOUR STARTING RANK' },
  'onboarding.startAs':       { fi: 'Aloita rankkina', en: 'Start as' },
  'onboarding.startBeginner': { fi: 'Aloita (Aloittelija)', en: 'Start (Beginner)' },
  'onboarding.skip':          { fi: 'Ohita toistaiseksi', en: 'Skip for now' },
  'onboarding.healthWarning': { fi: '⚠ TÄRKEÄÄ TERVEYDESTÄ', en: '⚠ HEALTH IMPORTANT' },
  'onboarding.healthBody':    { fi: 'Voimaharjoittelu on omalla vastuulla. Konsultoi lääkäriä jos sinulla on terveydellisiä rajoitteita. Sovellus ei korvaa ammattilaisvalmennusta. Lopeta harjoittelu välittömästi jos koet kipua.', en: 'Strength training is at your own risk. Consult a doctor if you have health restrictions. The app does not replace professional coaching. Stop training immediately if you feel pain.' },
  'onboarding.acceptPre':     { fi: 'Olen yli 13-vuotias ja hyväksyn', en: 'I am over 13 years old and accept the' },
  'onboarding.acceptTerms':   { fi: 'käyttöehdot', en: 'terms' },
  'onboarding.acceptAnd':     { fi: 'ja', en: 'and' },
  'onboarding.acceptPrivacy': { fi: 'tietosuojaselosteen', en: 'privacy policy' },
  'onboarding.acceptPost':    { fi: ', mukaan lukien suostumus terveystietojen käsittelyyn.', en: ', including consent to processing health data.' },
  'onboarding.acceptRequired':{ fi: 'Hyväksy käyttöehdot', en: 'Accept terms' },
  'onboarding.acceptRequiredBody': { fi: 'Sinun on hyväksyttävä käyttöehdot ja tietosuojaseloste jatkaaksesi.', en: 'You must accept the terms and privacy policy to continue.' },

  // Tutorial
  'tutorial.skip':            { fi: 'Ohita', en: 'Skip' },
  'tutorial.start':           { fi: 'ALOITA', en: 'START' },
  'tutorial.next':            { fi: 'SEURAAVA', en: 'NEXT' },
  'tutorial.s1.title':        { fi: 'Tervetuloa TheTotaliin', en: 'Welcome to TheTotal' },
  'tutorial.s1.body':         { fi: 'Voimaharjoittelun seuranta + sosiaalinen vertailu. SBD-rankkisi perustuu kehonpainoosi nähden lyötyihin painoihin.', en: 'Strength training tracker + social ranking. Your SBD rank is based on lifts relative to your bodyweight.' },
  'tutorial.s2.title':        { fi: 'Aloita treeni', en: 'Start a workout' },
  'tutorial.s2.body':         { fi: 'Paina + nappia alapalkista. Valitse tyhjä treeni, oma ohjelma tai valmis esimerkkiohjelma (Full Body, 5×5, PPL).', en: 'Tap the + button in the bottom bar. Choose blank, your own program, or a preset (Full Body, 5×5, PPL).' },
  'tutorial.s3.title':        { fi: 'Kirjaa sarjat', en: 'Log your sets' },
  'tutorial.s3.body':         { fi: 'Lisää liike, paino ja toistot. Vapaaehtoisesti voit merkitä RPE-rasituksen (5–10) jokaiselle sarjalle. Treenistäsi tallentuu volyymi, ennätykset ja XP.', en: 'Add exercise, weight and reps. Optionally mark RPE (5–10) for each set. Volume, PRs and XP are tracked automatically.' },
  'tutorial.s4.title':        { fi: 'Nouse rankissa', en: 'Climb the ranks' },
  'tutorial.s4.body':         { fi: 'SBD-rankki kasvaa Aloittelijasta Legendaan kun parannat Kyykky + Penkki + Maastaveto -yhteistulosta suhteessa kehonpainoosi. Top 1 % saavuttaa Eliitin.', en: 'Your SBD rank grows from Beginner to Legend as you improve Squat + Bench + Deadlift total relative to bodyweight. Top 1% reaches Elite.' },
  'tutorial.s5.title':        { fi: 'Kaverit ja vahvistukset', en: 'Friends and verification' },
  'tutorial.s5.body':         { fi: 'Lisää kaverit Kaverit-välilehdeltä. Heidän PR:nsä näkyvät etusivun feedissä. Reagoi 🔥💪, kommentoi ja vahvista kavereiden SBD-ennätykset 🤝 — se on luotettavuuden mittari.', en: 'Add friends from the Friends tab. Their PRs appear on the home feed. React 🔥💪, comment, and verify friends\' SBD PRs 🤝 — that\'s the trust mechanism.' },

  // Home
  'home.sbdRank':             { fi: 'SBD RANK', en: 'SBD RANK' },
  'home.nextRank':            { fi: 'SEURAAVA RANK', en: 'NEXT RANK' },
  'home.streak':              { fi: 'päivän putki', en: 'day streak' },
  'home.bodyweightRatio':     { fi: '× kehonpaino', en: '× bodyweight' },
  'home.liftLogGrow':         { fi: 'NOSTA • KIRJAA • KASVA', en: 'LIFT • LOG • GROW' },
  'home.lastWorkout':         { fi: 'VIIMEISIN TREENI', en: 'LAST WORKOUT' },
  'home.volume':              { fi: 'volyymi', en: 'volume' },
  'home.friendPRs':           { fi: 'KAVERIEN ENNÄTYKSET', en: 'FRIENDS\' PRs' },

  // Active workout
  'active.finishWorkout':     { fi: 'FINISH WORKOUT', en: 'FINISH WORKOUT' },
  'active.stop':              { fi: '✕ Lopeta', en: '✕ Stop' },
  'active.stopTitle':         { fi: 'Lopeta treeni', en: 'Stop workout' },
  'active.stopBody':          { fi: 'Haluatko lopettaa treenin? Kaikki sarjat menetetään.', en: 'Stop the workout? All sets will be lost.' },
  'active.addExercise':       { fi: '+ Add Exercise', en: '+ Add Exercise' },
  'active.addSet':            { fi: '+ Lisää sarja', en: '+ Add set' },
  'active.addInterval':       { fi: '+ Lisää erä', en: '+ Add interval' },
  'active.copyLast':          { fi: 'Kopioi edellinen', en: 'Copy last' },
  'active.removeExercise':    { fi: 'Poista liike', en: 'Remove exercise' },
  'active.removeExerciseBody':{ fi: 'Poistetaanko {name}?', en: 'Remove {name}?' },
  'active.lastTime':          { fi: 'Viimeksi:', en: 'Last time:' },
  'active.addExerciseFirst':  { fi: 'Lisää ensin liike', en: 'Add an exercise first' },
  'active.savingError':       { fi: 'Tallennusvirhe', en: 'Save error' },
  'active.setsError':         { fi: 'Sarjojen tallennus epäonnistui', en: 'Failed to save sets' },

  // Workout results
  'results.complete':         { fi: 'TREENI VALMIS', en: 'WORKOUT COMPLETE' },
  'results.xpEarned':         { fi: 'XP ANSAITTU', en: 'XP EARNED' },
  'results.workout':          { fi: 'treeni', en: 'workout' },
  'results.pr':               { fi: 'PR', en: 'PR' },
  'results.streak':           { fi: 'putki', en: 'streak' },
  'results.challenges':       { fi: 'haasteet', en: 'challenges' },
  'results.improvements':     { fi: 'KEHITYSTÄ', en: 'IMPROVEMENTS' },
  'results.challengesDone':   { fi: 'HAASTEET SUORITETTU', en: 'CHALLENGES DONE' },
  'results.continue':         { fi: 'JATKA', en: 'CONTINUE' },
  'results.repsMore':         { fi: 'toistoa', en: 'reps' },

  // Workouts tab
  'workouts.programs':        { fi: 'Ohjelmat', en: 'Programs' },
  'workouts.create':          { fi: 'Luo', en: 'Create' },
  'workouts.noPrograms':      { fi: 'Luo ensimmäinen ohjelmasi', en: 'Create your first program' },
  'workouts.noExercises':     { fi: 'Ei liikkeitä', en: 'No exercises' },
  'workouts.recent':          { fi: 'Viimeisimmät treenit', en: 'Recent workouts' },
  'workouts.noWorkouts':      { fi: 'Ei vielä treenejä.', en: 'No workouts yet.' },

  // Start workout
  'start.title':              { fi: 'Aloita treeni', en: 'Start workout' },
  'start.blank':              { fi: 'Tyhjä treeni', en: 'Blank workout' },
  'start.blankDesc':          { fi: 'Lisää liikkeet itse', en: 'Add exercises yourself' },
  'start.myPrograms':         { fi: 'OMAT OHJELMAT', en: 'MY PROGRAMS' },
  'start.presets':            { fi: 'ESIMERKKIOHJELMAT', en: 'PRESET PROGRAMS' },
  'start.startProgram':       { fi: '▶ Aloita', en: '▶ Start' },
  'start.saveAsOwn':          { fi: '+ Tallenna omaksi', en: '+ Save as own' },
  'start.saved':              { fi: 'Tallennettu', en: 'Saved' },
  'start.savedBody':          { fi: '"{name}" lisätty omiin ohjelmiisi.', en: '"{name}" added to your programs.' },

  // Profile
  'profile.records':          { fi: 'ENNÄTYKSET', en: 'PERSONAL RECORDS' },
  'profile.sbdRecords':       { fi: 'SBD ENNÄTYKSET', en: 'SBD RECORDS' },
  'profile.editPin':          { fi: 'Muokkaa ✎', en: 'Edit ✎' },
  'profile.verified':         { fi: '✓ Vahvistettu', en: '✓ Verified' },
  'profile.notVerified':      { fi: 'ei vahv.', en: 'unverified' },
  'profile.askVerification':  { fi: 'Pyydä kaverin vahvistus', en: 'Ask a friend to verify' },
  'profile.deleteAccount':    { fi: 'Poista tili ja kaikki data', en: 'Delete account and all data' },
  'profile.deleteTitle':      { fi: 'Poista tili', en: 'Delete account' },
  'profile.deleteBody':       { fi: 'Kaikki tietosi poistetaan pysyvästi. Tätä ei voi peruuttaa.', en: 'All your data will be permanently deleted. This cannot be undone.' },
  'profile.terms':            { fi: 'Käyttöehdot', en: 'Terms' },
  'profile.privacy':          { fi: 'Tietosuoja', en: 'Privacy' },
  'profile.repsLabel':        { fi: 'toistoa', en: 'reps' },
  'profile.support':          { fi: 'Tue kehitystä', en: 'Support development' },

  // Ranks (proper nouns - kept similar but with English translations)
  'rank.Aloittelija':         { fi: 'Aloittelija', en: 'Beginner' },
  'rank.Harrastaja':          { fi: 'Harrastaja', en: 'Hobbyist' },
  'rank.Kilpailija':          { fi: 'Kilpailija', en: 'Competitor' },
  'rank.Alueellinen':         { fi: 'Alueellinen', en: 'Regional' },
  'rank.Kansallinen':         { fi: 'Kansallinen', en: 'National' },
  'rank.Kansainvälinen':      { fi: 'Kansainvälinen', en: 'International' },
  'rank.Eliitti':             { fi: 'Eliitti', en: 'Elite' },
  'rank.Mestari':             { fi: 'Mestari', en: 'Master' },
  'rank.Maailmaluokka':       { fi: 'Maailmaluokka', en: 'World Class' },
  'rank.Legenda':             { fi: 'Legenda', en: 'Legend' },

  // Social / Friends
  'friends.title':            { fi: 'Kaverit', en: 'Friends' },
  'friends.searchPlaceholder':{ fi: 'Hae käyttäjänimellä...', en: 'Search by username...' },
  'friends.searchResults':    { fi: 'HAKUTULOKSET', en: 'SEARCH RESULTS' },
  'friends.requests':         { fi: 'KAVERIPYYNNÖT', en: 'FRIEND REQUESTS' },
  'friends.challenges':       { fi: 'HAASTEET', en: 'CHALLENGES' },
  'friends.sentChallenges':   { fi: 'LÄHETETYT HAASTEET', en: 'SENT CHALLENGES' },
  'friends.ranking':          { fi: 'RANKING', en: 'RANKING' },
  'friends.noFriends':        { fi: 'Ei kavereita vielä.\nHae käyttäjänimiä ylhäältä!', en: 'No friends yet.\nSearch usernames above!' },
  'friends.alreadyFriend':    { fi: 'Kaveri ✓', en: 'Friends ✓' },
  'friends.sent':             { fi: 'Lähetetty', en: 'Sent' },
  'friends.accept':           { fi: 'Hyväksy', en: 'Accept' },
  'friends.decline':          { fi: 'Hylkää', en: 'Decline' },

  // Reactions and comments
  'comments.title':           { fi: 'Kommentit', en: 'Comments' },
  'comments.placeholder':     { fi: 'Kirjoita kommentti...', en: 'Write a comment...' },
  'comments.empty':           { fi: 'Ole ensimmäinen kommentoija 💬', en: 'Be the first to comment 💬' },
  'comments.tooLong':         { fi: 'Liian pitkä', en: 'Too long' },
  'comments.maxChars':        { fi: 'Maksimi 500 merkkiä', en: 'Maximum 500 characters' },
  'comments.deleteTitle':     { fi: 'Poista kommentti', en: 'Delete comment' },
  'comments.deleteBody':      { fi: 'Oletko varma?', en: 'Are you sure?' },

  // Moderation
  'mod.report':               { fi: 'Ilmianna sisältö', en: 'Report content' },
  'mod.reportBody':           { fi: 'Miksi tämä on sopimaton?', en: 'Why is this inappropriate?' },
  'mod.thanks':               { fi: 'Kiitos', en: 'Thank you' },
  'mod.thanksBody':           { fi: 'Ilmianto vastaanotettu. Käsittelemme sen 24 tunnin sisällä.', en: 'Report received. We will review it within 24 hours.' },
  'mod.reportUser':           { fi: 'Ilmianna käyttäjä', en: 'Report user' },
  'mod.blockUser':            { fi: 'Estä käyttäjä', en: 'Block user' },
  'mod.blockTitle':           { fi: 'Estä käyttäjä', en: 'Block user' },
  'mod.blockBody':            { fi: 'Haluatko varmasti estää käyttäjän {name}? Et näe enää hänen sisältöään etkä hän sinun. Mahdollinen kaveriyhteys poistetaan.', en: 'Are you sure you want to block {name}? You won\'t see their content and they won\'t see yours. Any friendship will be removed.' },
  'mod.blocked':              { fi: 'Estetty', en: 'Blocked' },
  'mod.blockedBody':          { fi: '{name} on nyt estetty.', en: '{name} is now blocked.' },
  'mod.actions':              { fi: 'Toiminnot', en: 'Actions' },
  'mod.reasonHarassment':     { fi: 'Häirintä tai kiusaaminen', en: 'Harassment or bullying' },
  'mod.reasonHate':           { fi: 'Vihapuhe tai syrjintä', en: 'Hate speech or discrimination' },
  'mod.reasonSpam':           { fi: 'Spämmi', en: 'Spam' },
  'mod.reasonFake':           { fi: 'Väärä tieto / huijaus', en: 'Misinformation / cheating' },
  'mod.reasonSexual':         { fi: 'Seksuaalinen sisältö', en: 'Sexual content' },
  'mod.reasonOther':           { fi: 'Muu sopimaton sisältö', en: 'Other inappropriate content' },

  // RPE
  'rpe.title':                { fi: 'RPE — Rasitusaste', en: 'RPE — Effort level' },
  'rpe.subtitle':             { fi: 'Kuinka raskas sarja oli? 10 = max', en: 'How hard was the set? 10 = max' },
  'rpe.remove':               { fi: 'Poista RPE', en: 'Remove RPE' },

  // Ranks modal
  'ranks.title':              { fi: 'SBD Ranks', en: 'SBD Ranks' },
  'ranks.sbdTotal':           { fi: 'SBD-yhteensä:', en: 'SBD total:' },
  'ranks.bw':                 { fi: 'oma paino', en: 'bodyweight' },
  'ranks.youHere':            { fi: '← sinä', en: '← you' },

  // Verification action
  'verify.action':            { fi: 'Vahvista', en: 'Verify' },
  'verify.verified':          { fi: '✓ Vahvistettu', en: '✓ Verified' },
  'verify.selfReported':      { fi: 'Itse ilmoitettu', en: 'Self-reported' },
  'verify.pushTitle':         { fi: '🤝 {name} vahvisti', en: '🤝 {name} verified' },
  'verify.pushBody':          { fi: '{exercise} {weight}kg PR:si on nyt vahvistettu', en: 'Your {exercise} {weight}kg PR is now verified' },
}

type StringKey = keyof typeof STRINGS

export function t(key: StringKey, params?: Record<string, string | number>): string {
  const locale = useLocaleStore.getState().locale
  const entry = STRINGS[key]
  if (!entry) return key
  let value = entry[locale] ?? entry.fi ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v))
    }
  }
  return value
}

export function useT() {
  const locale = useLocaleStore(s => s.locale)
  return (key: StringKey, params?: Record<string, string | number>) => {
    const entry = STRINGS[key]
    if (!entry) return key
    let value = entry[locale] ?? entry.fi ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v))
      }
    }
    return value
  }
}
