-- Seed Kybalion: 7 principes + 3 cartes prototype (FR/EN).

INSERT INTO public.aegis_rune_principles (code, name_i18n, quote_i18n, bg_class, text_class, sort_order, pulses_to_unlock)
VALUES
  (
    'MENTALISM',
    '{"fr": "Le Mentalisme", "en": "Mentalism"}'::jsonb,
    '{"fr": "Le Tout est Esprit ; l''Univers est Mental.", "en": "The All is Mind; the Universe is Mental."}'::jsonb,
    'from-slate-900 to-[#0a0f18]',
    'text-slate-200',
    1,
    3
  ),
  (
    'CORRESPONDENCE',
    '{"fr": "La Correspondance", "en": "Correspondence"}'::jsonb,
    '{"fr": "Ce qui est en Haut est comme ce qui est en Bas.", "en": "As above, so below."}'::jsonb,
    'from-[#0a1120] to-slate-950',
    'text-slate-200',
    2,
    3
  ),
  (
    'VIBRATION',
    '{"fr": "La Vibration", "en": "Vibration"}'::jsonb,
    '{"fr": "Rien ne repose ; tout remue ; tout vibre.", "en": "Nothing rests; everything moves; everything vibrates."}'::jsonb,
    'from-[#0f1115] to-black',
    'text-slate-200',
    3,
    3
  ),
  (
    'POLARITY',
    '{"fr": "La Polarité", "en": "Polarity"}'::jsonb,
    '{"fr": "Tout est Double ; toute chose possède des pôles.", "en": "Everything is dual; everything has poles."}'::jsonb,
    'from-slate-900 to-black',
    'text-slate-200',
    4,
    3
  ),
  (
    'RHYTHM',
    '{"fr": "Le Rythme", "en": "Rhythm"}'::jsonb,
    '{"fr": "Tout s''écoule, au dedans et au dehors.", "en": "Everything flows, out and in."}'::jsonb,
    'from-[#081016] to-slate-950',
    'text-slate-200',
    5,
    3
  ),
  (
    'CAUSE_EFFECT',
    '{"fr": "Cause & Effet", "en": "Cause & Effect"}'::jsonb,
    '{"fr": "Toute Cause a son Effet ; tout Effet a sa Cause.", "en": "Every cause has its effect; every effect has its cause."}'::jsonb,
    'from-[#110a0a] to-black',
    'text-slate-200',
    6,
    3
  ),
  (
    'GENDER',
    '{"fr": "Le Genre", "en": "Gender"}'::jsonb,
    '{"fr": "Il y a un genre en toutes choses.", "en": "Gender is in everything; everything has its masculine and feminine principles."}'::jsonb,
    'from-[#100a12] to-slate-950',
    'text-slate-200',
    7,
    3
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.aegis_synapse_cards (
  principle_id,
  external_key,
  title_i18n,
  problem_i18n,
  bullets_i18n,
  format_i18n,
  course_content_i18n,
  time_label,
  sort_order
)
SELECT
  p.id,
  v.external_key,
  v.title_i18n,
  v.problem_i18n,
  v.bullets_i18n,
  v.format_i18n,
  v.course_content_i18n,
  v.time_label,
  v.sort_order
FROM (VALUES
  (
    'MENTALISM',
    'synapse_mentalism_filter',
    '{"fr": "Le Filtre de la Réalité", "en": "The Reality Filter"}'::jsonb,
    '{"fr": "Pourquoi deux personnes vivent la même journée mais l''une est heureuse et l''autre misérable ?", "en": "Why do two people live the same day yet one is happy and the other miserable?"}'::jsonb,
    '{"fr": ["Le cerveau supprime 90% des infos.", "Le rôle du Système Réticulé Activateur."], "en": ["The brain filters out 90% of information.", "The role of the Reticular Activating System."]}'::jsonb,
    '{"fr": "MICRO-CONCEPT", "en": "MICRO-CONCEPT"}'::jsonb,
    '{"fr": {"hook": "Ton cerveau est comme un videur de boîte de nuit très strict.", "concept": "À chaque seconde, des millions d''informations bombardent tes sens. Si ton cerveau traitait tout, il grillerait. Il utilise donc un ''filtre'' (le SRA) basé sur tes croyances. Si tu es convaincu que ''la journée va être pourrie'', ton videur intérieur ne laissera entrer que les preuves qui confirment cela (le métro en retard, le café renversé), et ignorera le reste.", "action": "Aujourd''hui, pirate ton videur : donne-lui l''ordre strict de trouver 3 choses positives, même minuscules. Note-les ce soir."}, "en": {"hook": "Your brain is like a very strict nightclub bouncer.", "concept": "Every second, millions of signals hit your senses. If your brain processed everything, it would overload. It uses a ''filter'' (the RAS) shaped by your beliefs. If you are convinced ''today will be awful'', your inner bouncer only lets in evidence that confirms it (late train, spilled coffee) and ignores the rest.", "action": "Today, hack your bouncer: give it a strict order to find 3 positive things, however small. Write them down tonight."}}'::jsonb,
    '2 MIN',
    1
  ),
  (
    'POLARITY',
    'synapse_polarity_emotions',
    '{"fr": "Le curseur des émotions", "en": "The emotion slider"}'::jsonb,
    '{"fr": "Comment arrêter de se sentir paralysé par la peur avant de passer à l''action ?", "en": "How do you stop feeling paralyzed by fear before taking action?"}'::jsonb,
    '{"fr": ["Peur et Excitation : même énergie, pôle différent.", "La technique du glissement mental."], "en": ["Fear and excitement: same energy, different pole.", "The mental sliding technique."]}'::jsonb,
    '{"fr": "HACK MENTAL", "en": "MENTAL HACK"}'::jsonb,
    '{"fr": {"hook": "Ton corps ne fait pas la différence entre la peur et l''excitation.", "concept": "Rythme cardiaque qui s''accélère, mains moites, papillons dans le ventre... Les symptômes physiques de la peur et de l''excitation extrême sont exactement les mêmes. La seule différence est l''étiquette mentale que tu colles dessus. La loi de la Polarité dit que ce sont les deux extrémités de la même ligne.", "action": "La prochaine fois que tu as le trac, arrête de te dire ''J''ai peur''. Dis à haute voix : ''Wow, je suis vraiment excité par ce qui va se passer !''. Le cerveau va changer de pôle."}, "en": {"hook": "Your body cannot tell fear from excitement.", "concept": "Racing heart, sweaty palms, butterflies... The physical symptoms of fear and extreme excitement are exactly the same. The only difference is the mental label you attach. The law of Polarity says they are two ends of the same line.", "action": "Next time you feel stage fright, stop saying ''I''m afraid''. Say out loud: ''Wow, I''m really excited about what''s coming!'' Your brain will shift poles."}}'::jsonb,
    '1 MIN',
    2
  ),
  (
    'VIBRATION',
    'synapse_vibration_media_diet',
    '{"fr": "La Diète Médiatique", "en": "The Media Diet"}'::jsonb,
    '{"fr": "Tu te sens souvent vidé de ton énergie après avoir scrollé sur ton téléphone ?", "en": "Do you often feel drained after scrolling on your phone?"}'::jsonb,
    '{"fr": ["Les pensées ont une signature vibratoire.", "L''impact des ''Doomscrolling''."], "en": ["Thoughts have a vibrational signature.", "The impact of doomscrolling."]}'::jsonb,
    '{"fr": "DÉFI EXPRESS", "en": "EXPRESS CHALLENGE"}'::jsonb,
    '{"fr": {"hook": "L''information que tu consommes est la nourriture de ton esprit.", "concept": "La loi de la vibration implique que tu t''accordes à la fréquence de ce que tu observes. Regarder des drames, des clashs ou des actualités anxiogènes abaisse mécaniquement ta propre fréquence. Tu deviens un récepteur pour la négativité ambiante.", "action": "Règle des 24h : Désabonne-toi de 3 comptes qui te font te sentir mal, en colère ou insuffisant. Remplace-les par 1 compte qui te fait rire ou t''inspire."}, "en": {"hook": "The information you consume is food for your mind.", "concept": "The law of vibration means you tune to the frequency of what you observe. Watching drama, conflict, or anxiety-inducing news mechanically lowers your own frequency. You become a receiver for ambient negativity.", "action": "24-hour rule: Unfollow 3 accounts that make you feel bad, angry, or inadequate. Replace them with 1 account that makes you laugh or inspires you."}}'::jsonb,
    '3 MIN',
    3
  )
) AS v(principle_code, external_key, title_i18n, problem_i18n, bullets_i18n, format_i18n, course_content_i18n, time_label, sort_order)
JOIN public.aegis_rune_principles p ON p.code = v.principle_code
ON CONFLICT (external_key) DO NOTHING;
