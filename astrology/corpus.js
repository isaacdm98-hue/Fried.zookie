
/* Aqau Pluto - content layer (strict ES5).
   Astrology archetypes in a grounded, behavioural, element-first voice
   (pragmatic Debra-Silverman influence: a mirror, not a fate).
   Tarot card meanings: Rider-Waite-Smith tradition keyword sets.
   Spreads: Labyrinthos / Biddy Tarot standard layouts (cited in UI).
   This is the offline fallback substance; the live model composes richer
   readings on top of the genuine computed chart. */
var DATA = (function () {

  var PLANETS = {
    sun:     { glyph: '\u2609\uFE0E', name: 'Sun',     fn: 'your core identity and what you came here to develop' },
    moon:    { glyph: '\u263D\uFE0E', name: 'Moon',    fn: 'your emotional needs, instincts and what makes you feel safe' },
    mercury: { glyph: '\u263F\uFE0E', name: 'Mercury', fn: 'how you think, talk, learn and process information' },
    venus:   { glyph: '\u2640\uFE0E', name: 'Venus',   fn: 'what you value, how you love and what you find beautiful' },
    mars:    { glyph: '\u2642\uFE0E', name: 'Mars',    fn: 'your drive, anger and how you go after what you want' },
    jupiter: { glyph: '\u2643\uFE0E', name: 'Jupiter', fn: 'where you expand, take risks and look for meaning' },
    saturn:  { glyph: '\u2644\uFE0E', name: 'Saturn',  fn: 'where you meet limits, do the work and build something real' },
    uranus:  { glyph: '\u2645\uFE0E', name: 'Uranus',  fn: 'where you break the rules and need freedom' },
    neptune: { glyph: '\u2646\uFE0E', name: 'Neptune', fn: 'where you dissolve, dream and look for the transcendent' },
    pluto:   { glyph: '\u2647\uFE0E', name: 'Pluto',   fn: 'where you face power, loss and deep transformation' },
    node:    { glyph: '\u260A\uFE0E', name: 'N. Node', fn: 'the direction of growth that feels unfamiliar but right' },
    trueNode:  { glyph: '\u260A\uFE0E', name: 'True Node', fn: 'the growth edge, tracked to the Moon\u2019s real orbit' },
    southNode: { glyph: '\u260B\uFE0E', name: 'S. Node',   fn: 'the old comfort and habit you\u2019re here to move beyond' },
    lilith:    { glyph: '\u26B8\uFE0E', name: 'Lilith',    fn: 'the wild, untamed, unapologetic part of you' },
    pof:       { glyph: '\u2297\uFE0E', name: 'Fortune',   fn: 'where ease, flow and a sense of luck gather' },
    chiron:    { glyph: '\u26B7\uFE0E', name: 'Chiron',    fn: 'the deep wound that becomes your gift for healing others' },
    ceres:     { glyph: '\u26B3\uFE0E', name: 'Ceres',     fn: 'how you nurture and are nurtured: care, food, loss and return' },
    pallas:    { glyph: '\u26B4\uFE0E', name: 'Pallas',    fn: 'your pattern-sense, strategy and creative intelligence' },
    juno:      { glyph: '\u26B5\uFE0E', name: 'Juno',      fn: 'what you need in commitment and long-term partnership' },
    vesta:     { glyph: '\u26B6\uFE0E', name: 'Vesta',     fn: 'where you focus, devote and tend your sacred flame' }
  };
  var PLANET_ORDER = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto','node'];

  var SIGNS = [
    { name: 'Aries',       glyph: '\u2648\uFE0E', element: 'fire',  modality: 'cardinal', ruler: 'Mars',    style: 'directness, courage and a need to start things' },
    { name: 'Taurus',      glyph: '\u2649\uFE0E', element: 'earth', modality: 'fixed',    ruler: 'Venus',   style: 'steadiness, the senses and a refusal to be rushed' },
    { name: 'Gemini',      glyph: '\u264A\uFE0E', element: 'air',   modality: 'mutable',  ruler: 'Mercury', style: 'curiosity, words and a mind that moves quickly' },
    { name: 'Cancer',      glyph: '\u264B\uFE0E', element: 'water', modality: 'cardinal', ruler: 'Moon',    style: 'feeling, memory and the instinct to protect' },
    { name: 'Leo',         glyph: '\u264C\uFE0E', element: 'fire',  modality: 'fixed',    ruler: 'Sun',     style: 'warmth, pride and the need to be seen' },
    { name: 'Virgo',       glyph: '\u264D\uFE0E', element: 'earth', modality: 'mutable',  ruler: 'Mercury', style: 'precision, usefulness and a critical eye' },
    { name: 'Libra',       glyph: '\u264E\uFE0E', element: 'air',   modality: 'cardinal', ruler: 'Venus',   style: 'fairness, relationship and a search for balance' },
    { name: 'Scorpio',     glyph: '\u264F\uFE0E', element: 'water', modality: 'fixed',    ruler: 'Pluto',   style: 'intensity, depth and a need to get to the truth' },
    { name: 'Sagittarius', glyph: '\u2650\uFE0E', element: 'fire',  modality: 'mutable',  ruler: 'Jupiter', style: 'freedom, the big picture and a hunger for experience' },
    { name: 'Capricorn',   glyph: '\u2651\uFE0E', element: 'earth', modality: 'cardinal', ruler: 'Saturn',  style: 'ambition, structure and the long game' },
    { name: 'Aquarius',    glyph: '\u2652\uFE0E', element: 'air',   modality: 'fixed',    ruler: 'Uranus',  style: 'independence, ideas and a need to be different' },
    { name: 'Pisces',      glyph: '\u2653\uFE0E', element: 'water', modality: 'mutable',  ruler: 'Neptune', style: 'imagination, empathy and porous boundaries' }
  ];

  // Dedicated headline text (grounded, behavioural voice)
  var SUN_IN_SIGN = [
    'You are wired to initiate. The work of a lifetime is learning to finish what you start, and to slow down enough to bring people with you. You were not built to wait your turn.',
    'You are built to value and to endure. Your job is to enjoy what you have without gripping it so hard nothing new can arrive. What you keep, keeps you; choose it well.',
    'You came here to connect ideas and people. Watch the habit of using words to stay one step ahead of your own feelings. Curiosity is your form of loyalty.',
    'You lead with feeling and memory. Your task is to care for others without making your moods the weather everyone else lives in. You remember for people who forget themselves.',
    'You are here to shine and to give. The growth edge is needing the applause a little less, and creating because it is yours. Warmth is your argument; you rarely need another.',
    'You are here to be useful and to refine. Your challenge is to let "good enough" exist, and to turn the critical eye into kindness. Perfection is not the goal; it is the compass.',
    'You are built for relationship and fairness. The work is having your own opinion before you ask for everyone else\u2019s. Fairness, in your hands, is a kind of beauty.',
    'You came to go deep and to transform. Your task is to trust people with the truth rather than controlling what they see. You would rather have the truth than the comfort, every time.',
    'You are here to explore and to mean it. The growth edge is staying long enough for the meaning to actually land. The horizon is not a destination; it is your address.',
    'You are built to climb and to build. Your work is to let the ambition serve a life, not replace one. You build slowly because you build for weather.',
    'You came here to think for yourself and to be free. The challenge is staying close to people while keeping your independence. You belong everywhere by belonging to no one’s script.',
    'You are here to imagine and to feel everything. Your task is to give the dreaming a form, and to keep some boundaries intact. You feel the sea the rest of us only stand beside.'
  ];
  var MOON_IN_SIGN = [
    'You feel safe when you can act. Sitting with an emotion, rather than discharging it, is the skill to build.',
    'You feel safe with steadiness and comfort. Notice when "I\u2019m fine" is really "please don\u2019t move anything".',
    'You process feeling by talking and naming. Make sure you also let yourself feel it before you explain it away.',
    'You feel safe when you are needed and close to home. Watch the tide of moods, and let people in before you retreat.',
    'You feel safe when you are appreciated. The work is asking for warmth directly instead of performing for it.',
    'You feel safe when things are in order and you are helping. Let yourself be cared for, not only useful.',
    'You feel safe in harmony and partnership. Practise tolerating a little conflict without managing everyone\u2019s comfort.',
    'You feel deeply and privately. Trusting one person with the real thing settles you more than controlling the room.',
    'You feel safe when you are free and moving. Staying present with a feeling, rather than escaping into the next plan, is the growth.',
    'You feel safe with control and competence. Let yourself need people; it isn\u2019t weakness.',
    'You feel safe with space and rationality. Naming the feeling, not just analysing it, is where the warmth is.',
    'You feel everything, including what isn\u2019t yours. Boundaries are a form of self-care, not a betrayal of your empathy.'
  ];
  var RISING_IN_SIGN = [
    'People meet a direct, energetic front. You come across more forceful than you feel; soften the entrance and people relax.',
    'People meet a calm, grounded presence. You seem unshakeable, which can hide how much you actually feel.',
    'People meet a quick, curious, talkative surface. You can charm your way past intimacy; let some pauses happen.',
    'People meet a soft, protective, slightly guarded front. You read others fast and reveal yourself slowly.',
    'People meet warmth and presence. You light up a room and sometimes hide behind the performance of being fine.',
    'People meet a tidy, modest, observant front. You notice everything and undersell yourself; let yourself be seen.',
    'People meet charm and diplomacy. You adapt to be liked; the work is letting people meet the unpolished you.',
    'People meet a private, magnetic intensity. You give little away and watch closely; trust lets the guard down.',
    'People meet an open, enthusiastic, frank presence. You say the honest thing; tact is the muscle to build.',
    'People meet a serious, capable, reserved front. You seem older and in control; warmth is what people are waiting for.',
    'People meet someone original and a little detached. You stand slightly apart; closeness is the growth edge.',
    'People meet a gentle, dreamy, impressionable surface. You absorb the mood of the room; protect your own signal.'
  ];

  // Dedicated planet-in-sign corpus for the personal & social planets (behavioural, classical-tradition voice).
  // delineate() routes through these so each placement reads specifically, never from a generic template.
  var MERCURY_IN_SIGN = [
    'a fast, blunt, decisive mind. You think out loud and argue to win; the skill is the pause before the point.',
    'a slow, deliberate, practical mind. You decide once and stay put, and you learn by doing rather than theorising.',
    'a quick, versatile, restless mind at home in itself. A brilliant connector of ideas, if you finish the thought before chasing the next.',
    'a mind that thinks through feeling and memory. Intuitive and retentive, though you can take words personally and reason by mood.',
    'a confident, persuasive, big-stroke mind. You think in headlines and dislike being corrected; warmth carries your point.',
    'a precise, analytical mind at home in itself. An editor’s eye for detail, with a tendency to over-correct and worry the small print.',
    'a mind that weighs every side: diplomatic and fair, sometimes stuck deciding; you think best out loud, with someone.',
    'a penetrating, investigative mind. You read the subtext and say little while knowing a lot; research is your gift.',
    'a big-picture, philosophical, frank mind. You love the idea and skip the footnotes; honesty outruns tact.',
    'a structured, strategic, serious mind. Slow but it builds knowledge that lasts, with a dry, deadpan wit.',
    'an original, inventive, objective mind. You see the whole system at a glance and can be coolly, cleverly contrarian.',
    'an imaginative, associative, impressionable mind. You think in images and atmospheres; facts blur, but the intuition is uncanny.'
  ];
  var VENUS_IN_SIGN = [
    'you love by pursuing: direct, ardent, quick to want and quick to cool; the chase thrills you more than the catch.',
    'you love sensually and loyally, at home in yourself. Touch, comfort and constancy matter; you hold on, sometimes too tight.',
    'you love through wit and words: you need a mental spark and variety, and commitment only once your mind is kept interested.',
    'you love through care and feeding. Tender, protective, loyal; when insecure you cling, when safe you nourish everyone.',
    'you love generously and dramatically. Warm, romantic, proud; you want to be adored and you give your whole heart.',
    'you show love through usefulness and small precise acts. Modest and a little picky, quietly afraid you’re not quite enough.',
    'you love partnership itself, at home in yourself. Charming, romantic, harmony-seeking; the risk is dissolving into the other.',
    'you love with all-or-nothing intensity. Magnetic, deep, jealous; you merge completely or withhold completely.',
    'you love freedom and honesty: warm and adventurous, needing room; routine and clinging cool you fast.',
    'you love seriously and durably: committed, loyal, status-aware; you guard the heart and warm slowly but for keeps.',
    'you love as a friend first: unconventional, needing space, drawn to the unusual; cool on the surface, steady underneath.',
    'you love compassionately and idealistically, lifted here. Romantic to the point of self-sacrifice; boundaries are the lesson.'
  ];
  var MARS_IN_SIGN = [
    'a raw, fast, courageous drive at home in itself. You act first and forgive fast, with a hot, short-lived temper.',
    'a slow-to-rouse, immovable drive. Stamina over speed; once you’re moving nothing stops you, and the stubbornness is real.',
    'a mental, restless, scattered drive. You fight with words and start many things; the work is following one through.',
    'a defensive, indirect, moody drive. You protect fiercely and anger sideways; learn to want things out loud.',
    'a proud, dramatic, sustained drive. You perform courage and burn steadily; you sulk when the effort goes unseen.',
    'an efficient, precise, hard-working drive. Anger turns into criticism; your effort is meticulous and tireless.',
    'a drive that works through other people and avoids open conflict. Charm and strategy over force; own your anger directly.',
    'a relentless, controlled, strategic drive. You never forget and rarely show your hand; a deep, simmering power.',
    'an enthusiastic, blunt, adventurous drive. You fight for the principle; aim before you fire.',
    'a disciplined, ambitious, enduring drive lifted here. Cold efficiency and the long campaign; you win by outlasting.',
    'a rebellious, erratic, principle-led drive. You fight the system in sudden bursts; detached but unshakeable once decided.',
    'a diffuse, indirect, easily-drained drive. You fight hardest for the helpless; give it a clear channel or it leaks away.'
  ];
  var JUPITER_IN_SIGN = [
    'you grow through bold action: luck favours your nerve, and the trap is overreaching.',
    'you grow through patience and building something solid. Luck in resources, with a pull toward over-indulgence.',
    'you grow through learning and connection. Luck through words and variety, if you don’t spread too thin.',
    'you grow through care, home and feeling, lifted here. Luck through family and nurture, with a habit of over-protecting.',
    'you grow through creativity and generosity. Luck on a stage, with a flair for the over-dramatic.',
    'you grow through service and skill. Luck in the details, if you don’t shrink the vision to fit them.',
    'you grow through relationship and fairness. Luck arrives through other people, at the cost of over-accommodating.',
    'you grow through depth and transformation. Luck found in crisis, with an appetite that can turn obsessive.',
    'you grow through travel, study and belief, at home here. Big luck and a big appetite, sometimes a touch preachy.',
    'you grow through discipline and structure. Luck you earn rather than receive, capped only by your own caution.',
    'you grow through ideas, community and reform. Luck in groups, with a streak of utopian overreach.',
    'you grow through compassion and imagination, at home here. Luck through faith and surrender, needing boundaries.'
  ];
  var SATURN_IN_SIGN = [
    'your lesson is patience and measured action. Restraint learned early hardens into controlled courage.',
    'your lesson is security through endurance. An early fear of lack becomes slow, lasting, real worth.',
    'your lesson is disciplined thought. Doubt about your own mind matures into genuine, hard-won expertise.',
    'your lesson is emotional security the hard way. Guarded feeling, learned young, becomes the home you build.',
    'your lesson is humble, earned authority. A fear of not mattering matures into disciplined creative work.',
    'your lesson is useful mastery: a harsh inner critic, met honestly, becomes reliable, respected craft.',
    'your lesson is committed, fair relationship, lifted here. You take duty and justice seriously, and that is your backbone.',
    'your lesson is power through letting go. A fear of powerlessness forges an almost unbreakable resilience.',
    'your lesson is grounded belief: doubt about meaning matures into a disciplined, kept-promise kind of faith.',
    'your lesson is mature authority, at home here. Heavy responsibility carried early is the very thing you end up mastering.',
    'your lesson is responsible freedom, at home here. A real duty to the collective gives your independence its structure.',
    'your lesson is giving form to the formless. A fear of dissolving matures into disciplined compassion.'
  ];
  // Outer planets move slowly — these are generational signatures, coloured personally by house & aspect.
  var URANUS_IN_SIGN = [
    'a generational charge of bold, pioneering rebellion, freedom taken through action.',
    'a generation that overturns money, values and our relationship to the earth, freedom by stripping back to essentials.',
    'a generation that rewires how we talk, learn and connect, restless, inventive thinking.',
    'a generation that breaks open home, family and what “security” even means, unconventional roots.',
    'a generation that rebels through self-expression. The insisted-on right to be uniquely yourself.',
    'a generation that reinvents work, health and craft, new methods, new systems.',
    'a generation that rewrites partnership and fairness, new templates for how we relate.',
    'a generation drawn to taboo, depth and the radical transformation of power and intimacy.',
    'a generation that overturns belief, education and the freedom to think for itself.',
    'a generation that tears down and rebuilds institutions, authority and structure.',
    'a generation of humanitarian, technological, future-shaping rebellion, at home in itself.',
    'a generation that dissolves old boundaries, spiritual and imaginative upheaval.'
  ];
  var NEPTUNE_IN_SIGN = [
    'a generational dream of the heroic, self-made self.',
    'a generational longing to spiritualise value, beauty and the senses.',
    'a generational haze around ideas and information, imaginative, slippery, poetic.',
    'a generational idealising of home, mother and belonging.',
    'a generational romance with self-expression, glamour and the golden image.',
    'a generational dream of perfect service and health, work as devotion.',
    'a generational idealising of love, union and the perfect partner.',
    'a generational fascination with the hidden, the taboo and transcendence through intensity.',
    'a generational spiritual seeking: idealised belief and far horizons.',
    'a generational dissolving and re-dreaming of authority and structure.',
    'a generational utopian, collective, technological dreaming.',
    'a generational boundlessness: empathy, mysticism and the dream itself, at home here.'
  ];
  var PLUTO_IN_SIGN = [
    'a generation that transforms through raw will, the self forged in fire.',
    'a generation that overturns money, resources and the body.',
    'a generation that transforms through information and the word.',
    'a generation that churns family, security and emotional roots to the foundations.',
    'a generation that transforms self-expression, ego and creative power.',
    'a generation that purifies through work, health and relentless analysis.',
    'a generation that transforms relationship, justice and balance.',
    'a generation of total depth, intensity and regeneration through crisis, at home here.',
    'a generation that transforms belief, truth and the search for meaning.',
    'a generation that tears down and rebuilds power, authority and institutions.',
    'a generation that transforms community, technology and the collective.',
    'a generation of dissolution and rebirth through the spiritual and the unconscious.'
  ];
  var PLANET_SIGN_TEXT = { mercury: MERCURY_IN_SIGN, venus: VENUS_IN_SIGN, mars: MARS_IN_SIGN, jupiter: JUPITER_IN_SIGN, saturn: SATURN_IN_SIGN, uranus: URANUS_IN_SIGN, neptune: NEPTUNE_IN_SIGN, pluto: PLUTO_IN_SIGN };

  var HOUSES = [
    { name: 'House 1', title: 'Self & Body', meaning: 'how you show up, your appearance and first instinct.' },
    { name: 'House 2', title: 'Money & Worth', meaning: 'what you earn, own and how you value yourself.' },
    { name: 'House 3', title: 'Mind & Siblings', meaning: 'thinking, talking, learning, neighbours and short trips.' },
    { name: 'House 4', title: 'Home & Roots', meaning: 'family, the past, your private base and where you come from.' },
    { name: 'House 5', title: 'Creativity & Play', meaning: 'romance, children, art and what you make for the joy of it.' },
    { name: 'House 6', title: 'Work & Health', meaning: 'daily routine, the body, service and the craft of getting things done.' },
    { name: 'House 7', title: 'Partnership', meaning: 'committed relationships, business partners and open enemies.' },
    { name: 'House 8', title: 'Depth & Sharing', meaning: 'intimacy, other people\u2019s money, death, and what transforms you.' },
    { name: 'House 9', title: 'Meaning & Travel', meaning: 'belief, higher study, distant places and the big picture.' },
    { name: 'House 10', title: 'Career & Public Life', meaning: 'reputation, vocation and what you are known for.' },
    { name: 'House 11', title: 'Friends & Future', meaning: 'community, networks, hopes and the groups you belong to.' },
    { name: 'House 12', title: 'The Hidden', meaning: 'the unconscious, solitude, what is behind the scenes, and what you release.' }
  ];

  var ASPECTS = [
    { key: 'conjunction', glyph: '\u260C\uFE0E', angle: 0,   orb: 8, quality: 'fusion',     phrase: 'fused together, amplifying and complicating each other' },
    { key: 'opposition',  glyph: '\u260D\uFE0E', angle: 180, orb: 8, quality: 'tension',    phrase: 'pulling in opposite directions, asking to be balanced' },
    { key: 'trine',       glyph: '\u25B3\uFE0E', angle: 120, orb: 7, quality: 'flow',       phrase: 'flowing easily, a natural talent you can take for granted' },
    { key: 'square',      glyph: '\u25A1\uFE0E', angle: 90,  orb: 7, quality: 'friction',   phrase: 'grinding against each other, the friction that makes you grow' },
    { key: 'sextile',     glyph: '\u26B9\uFE0E', angle: 60,  orb: 5, quality: 'opportunity',phrase: 'offering an opportunity if you choose to use it' }
  ];
  // minor aspects \u2014 Astro.com-style, only added to the natal grid when "Minor aspects" is on (kept out of transits to avoid noise)
  var MINOR_ASPECTS = [
    { key: 'quincunx',        glyph: '\u26BB\uFE0E', angle: 150, orb: 2.5, quality: 'tension',    phrase: 'an awkward 150\u00B0: two parts of you that never quite fit, needing constant small adjustments', minor: true },
    { key: 'sesquiquadrate',  glyph: '\u26BC\uFE0E', angle: 135, orb: 2,   quality: 'friction',   phrase: 'a 135\u00B0 irritation that flares under pressure', minor: true },
    { key: 'semisquare',      glyph: '\u2220',       angle: 45,  orb: 2,   quality: 'friction',   phrase: 'a 45\u00B0 friction: a low, nagging tension', minor: true },
    { key: 'semisextile',     glyph: '\u26BA\uFE0E', angle: 30,  orb: 1.5, quality: 'opportunity', phrase: 'a mild 30\u00B0 link between neighbouring areas of life', minor: true }
  ];

  var ELEMENTS = {
    fire:  { name: 'Fire',  signs: 'Aries, Leo, Sagittarius', high: 'enthusiasm, courage, momentum', low: 'impatience, burnout, running over people', need: 'You need action and inspiration. Too much and you scorch; too little and you go cold and flat.' },
    earth: { name: 'Earth', signs: 'Taurus, Virgo, Capricorn', high: 'reliability, patience, results', low: 'rigidity, materialism, stuckness', need: 'You need the practical and the tangible. Too much and you calcify; too little and nothing gets grounded.' },
    air:   { name: 'Air',   signs: 'Gemini, Libra, Aquarius', high: 'ideas, perspective, communication', low: 'overthinking, detachment, talking instead of feeling', need: 'You need ideas and exchange. Too much and you live in your head; too little and you struggle to step back and see.' },
    water: { name: 'Water', signs: 'Cancer, Scorpio, Pisces', high: 'empathy, depth, intuition', low: 'moodiness, merging, drowning in feeling', need: 'You need feeling and connection. Too much and you flood; too little and you go numb and brittle.' }
  };
  var MODALITIES = {
    cardinal: { name: 'Cardinal', signs: 'Aries, Cancer, Libra, Capricorn', note: 'You start things. The gift is initiative; the trap is beginning more than you finish.' },
    fixed:    { name: 'Fixed',    signs: 'Taurus, Leo, Scorpio, Aquarius',  note: 'You sustain things. The gift is loyalty and follow-through; the trap is stubbornness.' },
    mutable:  { name: 'Mutable',  signs: 'Gemini, Virgo, Sagittarius, Pisces', note: 'You adapt. The gift is flexibility; the trap is scattering and never quite landing.' }
  };

  // ---- TAROT (Rider-Waite-Smith tradition) ----
  function c(name, arc, num, up, rev, ess) {
    return { name: name, arcana: arc, num: num, up: up, rev: rev, ess: ess };
  }
  var MAJORS = [
    c('The Fool', 'major', 0, ['beginnings','innocence','a leap of faith'], ['recklessness','hesitation','naivety'], 'A new start and a step into the unknown.'),
    c('The Magician', 'major', 1, ['will','skill','manifestation'], ['manipulation','scattered energy','untapped talent'], 'You have the tools; focus the will.'),
    c('The High Priestess', 'major', 2, ['intuition','the unconscious','secrets'], ['blocked intuition','withdrawal','hidden agendas'], 'Listen inward; not everything is meant to be spoken yet.'),
    c('The Empress', 'major', 3, ['abundance','nurturing','the senses'], ['smothering','creative block','dependence'], 'Fertility, care and earthly pleasure.'),
    c('The Emperor', 'major', 4, ['structure','authority','stability'], ['control','rigidity','domination'], 'Order, boundaries and the father principle.'),
    c('The Hierophant', 'major', 5, ['tradition','teaching','belonging'], ['rebellion','dogma','non-conformity'], 'Established wisdom and shared belief.'),
    c('The Lovers', 'major', 6, ['union','choice','values'], ['disharmony','misalignment','avoidance'], 'A meaningful choice, often about love or values.'),
    c('The Chariot', 'major', 7, ['drive','willpower','victory'], ['loss of control','aggression','no direction'], 'Hold the reins and move forward.'),
    c('Strength', 'major', 8, ['courage','gentle power','patience'], ['self-doubt','rawness','forcing it'], 'Strength is soft control, not brute force.'),
    c('The Hermit', 'major', 9, ['solitude','inner search','guidance'], ['isolation','loneliness','withdrawal'], 'Step back and find your own light.'),
    c('Wheel of Fortune', 'major', 10, ['cycles','change','fate'], ['bad luck','resistance','holding on'], 'The wheel turns; ride the cycle.'),
    c('Justice', 'major', 11, ['fairness','truth','cause and effect'], ['unfairness','dishonesty','avoidance'], 'Accountability and clear consequence.'),
    c('The Hanged Man', 'major', 12, ['surrender','new perspective','pause'], ['stalling','martyrdom','resistance'], 'Let go; see it a different way.'),
    c('Death', 'major', 13, ['endings','transformation','release'], ['clinging','stagnation','fear of change'], 'An ending that clears the ground. Rarely literal.'),
    c('Temperance', 'major', 14, ['balance','moderation','blending'], ['excess','imbalance','impatience'], 'Mix the opposites; find the middle path.'),
    c('The Devil', 'major', 15, ['attachment','shadow','bondage'], ['release','awareness','breaking free'], 'What binds you, and the chains you can remove.'),
    c('The Tower', 'major', 16, ['sudden change','revelation','collapse'], ['fear of change','delaying disaster','averted crisis'], 'A shock that breaks a false structure.'),
    c('The Star', 'major', 17, ['hope','renewal','faith'], ['despair','disconnection','doubt'], 'Healing and quiet hope after the storm.'),
    c('The Moon', 'major', 18, ['illusion','fear','the subconscious'], ['confusion lifting','truth revealed','release of fear'], 'Things are not what they seem; trust instinct.'),
    c('The Sun', 'major', 19, ['joy','success','clarity'], ['temporary down','low energy','blocked joy'], 'Warmth, vitality and the truth in the open.'),
    c('Judgement', 'major', 20, ['reckoning','awakening','renewal'], ['self-doubt','avoiding the call','harsh judgement'], 'A wake-up call and a chance to rise.'),
    c('The World', 'major', 21, ['completion','wholeness','integration'], ['unfinished business','delay','near-miss'], 'A cycle complete; the whole picture.')
  ];
  var SUIT_KW = {
    Wands:     { el: 'Fire',  theme: 'energy, passion, ambition, creativity' },
    Cups:      { el: 'Water', theme: 'emotion, love, relationship, intuition' },
    Swords:    { el: 'Air',   theme: 'mind, conflict, truth, communication' },
    Pentacles: { el: 'Earth', theme: 'money, work, body, the material world' }
  };
  // Minor arcana keyword sets (RWS tradition), compact per rank within each suit
  var MINOR_DEF = {
    Wands: [
      ['Ace', ['inspiration','a spark','new energy'], ['delay','no direction','a false start'], 'A creative spark; potential to act.'],
      ['Two', ['planning','first steps','foresight'], ['fear of change','playing safe','bad planning'], 'Looking ahead and weighing the world.'],
      ['Three', ['expansion','progress','foresight'], ['delays','setbacks','holding back'], 'Plans set in motion; ships coming in.'],
      ['Four', ['celebration','home','harmony'], ['tension at home','instability','cancelled plans'], 'A milestone and a moment of stability.'],
      ['Five', ['competition','conflict','friction'], ['avoiding conflict','tension released','inner conflict'], 'Scrappy disagreement; everyone wants the floor.'],
      ['Six', ['victory','recognition','progress'], ['ego','no recognition','a fall from grace'], 'Public success and well-earned pride.'],
      ['Seven', ['defending','perseverance','standing firm'], ['overwhelm','giving up','worn down'], 'Hold your ground against pressure.'],
      ['Eight', ['speed','movement','swift action'], ['delays','chaos','slowing down'], 'Things moving fast; news in the air.'],
      ['Nine', ['resilience','last stand','boundaries'], ['exhaustion','paranoia','defensiveness'], 'Tired but still standing; almost there.'],
      ['Ten', ['burden','responsibility','overload'], ['letting go','delegation','collapse'], 'Carrying too much; time to put some down.'],
      ['Page', ['curiosity','a messenger','enthusiasm'], ['flakiness','bad news','restlessness'], 'A spark of an idea; eager beginnings.'],
      ['Knight', ['action','adventure','impulsiveness'], ['recklessness','haste','frustration'], 'Charging ahead, sometimes too fast.'],
      ['Queen', ['confidence','warmth','independence'], ['insecurity','demanding','jealousy'], 'Magnetic, sociable, sure of herself.'],
      ['King', ['vision','leadership','boldness'], ['impulsiveness','domineering','ruthlessness'], 'A natural leader with big ideas.']
    ],
    Cups: [
      ['Ace', ['new love','emotion','intuition'], ['blocked feeling','emptiness','repression'], 'An open heart; feeling begins to flow.'],
      ['Two', ['partnership','attraction','connection'], ['imbalance','break-up','tension'], 'A meeting of two; mutual regard.'],
      ['Three', ['friendship','community','celebration'], ['gossip','overindulgence','isolation'], 'Good company and shared joy.'],
      ['Four', ['apathy','contemplation','re-evaluation'], ['new openness','accepting an offer','moving on'], 'Discontent; missing the cup in front of you.'],
      ['Five', ['loss','grief','disappointment'], ['acceptance','recovery','moving forward'], 'Mourning what spilled; two cups still stand.'],
      ['Six', ['nostalgia','memory','innocence'], ['stuck in the past','moving on','idealising'], 'Sweetness from the past; childhood.'],
      ['Seven', ['choices','fantasy','wishful thinking'], ['clarity','decision','overwhelm'], 'Many options, not all real; choose.'],
      ['Eight', ['walking away','seeking more','departure'], ['avoidance','fear of change','drifting'], 'Leaving what no longer fulfils you.'],
      ['Nine', ['satisfaction','contentment','a wish'], ['smugness','unfulfilment','overindulgence'], 'The wish card; emotional comfort.'],
      ['Ten', ['harmony','family','fulfilment'], ['broken harmony','disconnection','strain'], 'Lasting happiness; the rainbow.'],
      ['Page', ['a message of the heart','wonder','creativity'], ['emotional immaturity','moodiness','blocked feeling'], 'A gentle, imaginative spark.'],
      ['Knight', ['romance','charm','following the heart'], ['moodiness','unrealistic','jealousy'], 'The romantic, bearing a cup.'],
      ['Queen', ['compassion','emotional security','intuition'], ['over-giving','insecurity','martyrdom'], 'Deeply caring and intuitive.'],
      ['King', ['emotional balance','calm','diplomacy'], ['volatility','coldness','manipulation'], 'Master of feeling; steady under pressure.']
    ],
    Swords: [
      ['Ace', ['clarity','breakthrough','truth'], ['confusion','misuse of force','clouded judgement'], 'A clear thought cuts through.'],
      ['Two', ['stalemate','hard choice','avoidance'], ['indecision lifting','information','tension'], 'Blindfolded; a decision postponed.'],
      ['Three', ['heartbreak','painful truth','grief'], ['recovery','releasing pain','forgiveness'], 'The hard truth that hurts.'],
      ['Four', ['rest','recovery','retreat'], ['restlessness','burnout','re-entry'], 'Pause and recover your strength.'],
      ['Five', ['conflict','winning at a cost','defeat'], ['reconciliation','moving on','regret'], 'A hollow victory; count the cost.'],
      ['Six', ['transition','moving on','recovery'], ['stuck','resistance','unfinished business'], 'Leaving troubled waters for calmer ones.'],
      ['Seven', ['strategy','stealth','getting away with it'], ['being caught','conscience','coming clean'], 'Cunning; acting alone, perhaps deceptively.'],
      ['Eight', ['feeling trapped','restriction','self-limiting'], ['freedom','new perspective','release'], 'Bound by your own thinking; the way out is open.'],
      ['Nine', ['anxiety','worry','sleepless nights'], ['relief','facing fear','hope returning'], 'The nightmare card; fear at 3am.'],
      ['Ten', ['painful ending','rock bottom','betrayal'], ['recovery','the worst is over','resisting the end'], 'An ending; nowhere to go but up.'],
      ['Page', ['curiosity','vigilance','new ideas'], ['gossip','scattered thoughts','deception'], 'A sharp, watchful mind.'],
      ['Knight', ['ambition','drive','rushing in'], ['impatience','aggression','no follow-through'], 'Fast, focused, sometimes blunt.'],
      ['Queen', ['clear thinking','honesty','independence'], ['coldness','bitterness','cruelty'], 'Perceptive and direct; no nonsense.'],
      ['King', ['intellect','authority','truth'], ['manipulation','harshness','misuse of power'], 'Clear, principled, judicial mind.']
    ],
    Pentacles: [
      ['Ace', ['opportunity','prosperity','a new venture'], ['lost chance','scarcity','bad investment'], 'A tangible new beginning; a seed of wealth.'],
      ['Two', ['balance','juggling','adaptability'], ['overwhelm','disorganisation','dropped balls'], 'Keeping several things in the air.'],
      ['Three', ['teamwork','skill','collaboration'], ['poor work','no teamwork','lack of skill'], 'Building together; craftsmanship.'],
      ['Four', ['security','saving','holding on'], ['greed','letting go','instability'], 'Keeping hold; sometimes too tightly.'],
      ['Five', ['hardship','insecurity','feeling left out'], ['recovery','help arriving','end of hardship'], 'Material lack; warmth is nearby if you look.'],
      ['Six', ['generosity','giving and receiving','support'], ['strings attached','imbalance','debt'], 'The flow of giving and receiving.'],
      ['Seven', ['patience','assessment','long-term view'], ['impatience','poor return','frustration'], 'Tending the crop; waiting for growth.'],
      ['Eight', ['craft','diligence','mastery'], ['perfectionism','no motivation','cutting corners'], 'Dedicated work; honing the skill.'],
      ['Nine', ['independence','luxury','self-sufficiency'], ['over-reliance','showiness','financial setback'], 'Earned comfort; enjoying your own garden.'],
      ['Ten', ['wealth','legacy','family security'], ['instability','loss','family conflict'], 'Lasting prosperity across generations.'],
      ['Page', ['ambition','study','a new opportunity'], ['procrastination','distraction','missed chance'], 'A grounded, studious beginning.'],
      ['Knight', ['reliability','routine','hard work'], ['boredom','stagnation','laziness'], 'Steady, methodical, dependable.'],
      ['Queen', ['nurturing','practical','resourceful'], ['self-neglect','smothering','work-life imbalance'], 'Down-to-earth, caring, capable.'],
      ['King', ['abundance','security','provider'], ['greed','materialism','controlling'], 'Successful, stable, generous master of the material.']
    ]
  };
  function buildTarot() {
    var deck = MAJORS.slice();
    var suits = ['Wands', 'Cups', 'Swords', 'Pentacles'];
    for (var s = 0; s < suits.length; s++) {
      var suit = suits[s], defs = MINOR_DEF[suit];
      for (var i = 0; i < defs.length; i++) {
        var d = defs[i];
        deck.push(c(d[0] + ' of ' + suit, suit, i + 1, d[1], d[2], d[3]));
      }
    }
    return deck;
  }
  var TAROT = buildTarot();

  // ---- SPREADS (Labyrinthos / Biddy Tarot standard layouts) ----
  // x,y are normalised 0..1 inside the layout board; rot in degrees.
  var SPREADS = [
    {
      name: 'One Card', cards: 1, use: 'A daily focus or a single clear question.',
      positions: [ { n: 1, t: 'The Message', m: 'The single most important thing to know right now.', x: 0.5, y: 0.5, rot: 0 } ]
    },
    {
      name: 'Three Card', cards: 3, use: 'Past / Present / Future: or Situation / Action / Outcome.',
      positions: [
        { n: 1, t: 'Past', m: 'What led here: the root or recent influence.', x: 0.2, y: 0.5, rot: 0 },
        { n: 2, t: 'Present', m: 'The heart of the matter as it stands now.', x: 0.5, y: 0.5, rot: 0 },
        { n: 3, t: 'Future', m: 'Where this is heading if nothing changes.', x: 0.8, y: 0.5, rot: 0 }
      ]
    },
    {
      name: 'Five-Card Cross', cards: 5, use: 'A focused look at a single decision or problem.',
      positions: [
        { n: 1, t: 'The Heart', m: 'The core of the situation.', x: 0.5, y: 0.5, rot: 0 },
        { n: 2, t: 'The Past', m: 'What is behind it.', x: 0.22, y: 0.5, rot: 0 },
        { n: 3, t: 'The Future', m: 'What is approaching.', x: 0.78, y: 0.5, rot: 0 },
        { n: 4, t: 'The Cause', m: 'The reason or foundation beneath.', x: 0.5, y: 0.82, rot: 0 },
        { n: 5, t: 'The Potential', m: 'The best possible outcome.', x: 0.5, y: 0.18, rot: 0 }
      ]
    },
    {
      name: 'Horseshoe', cards: 7, use: 'A broad reading of a situation and how to move through it.',
      positions: [
        { n: 1, t: 'Past', m: 'Past influences still in play.', x: 0.12, y: 0.72, rot: 0 },
        { n: 2, t: 'Present', m: 'The current situation.', x: 0.26, y: 0.4, rot: 0 },
        { n: 3, t: 'Hidden', m: 'Unseen forces and influences.', x: 0.4, y: 0.2, rot: 0 },
        { n: 4, t: 'Obstacle', m: 'The main challenge to face.', x: 0.5, y: 0.13, rot: 0 },
        { n: 5, t: 'External', m: 'Other people and the environment.', x: 0.6, y: 0.2, rot: 0 },
        { n: 6, t: 'Advice', m: 'The recommended approach.', x: 0.74, y: 0.4, rot: 0 },
        { n: 7, t: 'Outcome', m: 'The likely result.', x: 0.88, y: 0.72, rot: 0 }
      ]
    },
    {
      name: 'Celtic Cross', cards: 10, use: 'The classic deep dive: a 360\u00B0 view of any situation.',
      positions: [
        { n: 1, t: 'Present', m: 'The heart of the matter: the current situation.', x: 0.32, y: 0.5, rot: 0 },
        { n: 2, t: 'Challenge', m: 'The immediate obstacle, laid across the first.', x: 0.32, y: 0.5, rot: 90 },
        { n: 3, t: 'Foundation', m: 'The root and distant past beneath it.', x: 0.32, y: 0.78, rot: 0 },
        { n: 4, t: 'Past', m: 'The recent past, now receding.', x: 0.14, y: 0.5, rot: 0 },
        { n: 5, t: 'Conscious', m: 'Your goal: what is on your mind, the best outcome.', x: 0.32, y: 0.22, rot: 0 },
        { n: 6, t: 'Future', m: 'What is approaching in the near future.', x: 0.5, y: 0.5, rot: 0 },
        { n: 7, t: 'Your Approach', m: 'How you see yourself: your advice to take.', x: 0.78, y: 0.8, rot: 0 },
        { n: 8, t: 'External', m: 'Your environment and the people around you.', x: 0.78, y: 0.6, rot: 0 },
        { n: 9, t: 'Hopes & Fears', m: 'What you most hope for: and most fear.', x: 0.78, y: 0.4, rot: 0 },
        { n: 10, t: 'Outcome', m: 'The likely result if you stay on this path.', x: 0.78, y: 0.2, rot: 0 }
      ]
    },
    {
      name: 'Year Ahead', cards: 12, use: 'One card per month: a wheel for the year, echoing the houses.',
      positions: (function () {
        var arr = [], i, ang, r = 0.4;
        for (i = 0; i < 12; i++) {
          ang = (-90 + i * 30) * Math.PI / 180;
          arr.push({ n: i + 1, t: 'Month ' + (i + 1), m: 'The theme and weather of month ' + (i + 1) + '.',
            x: 0.5 + r * Math.cos(ang), y: 0.5 + r * Math.sin(ang), rot: 0 });
        }
        return arr;
      })()
    }
  ];

  // ---- Compact city DB for offline birth-place lookup ----
  // [name, country, lat, lon, iana_tz]
  var CITIES = [
    ['London','UK',51.5074,-0.1278,'Europe/London'],['Bristol','UK',51.4545,-2.5879,'Europe/London'],['Manchester','UK',53.4808,-2.2426,'Europe/London'],
    ['Birmingham','UK',52.4862,-1.8904,'Europe/London'],['Leeds','UK',53.8008,-1.5491,'Europe/London'],['Glasgow','UK',55.8642,-4.2518,'Europe/London'],
    ['Edinburgh','UK',55.9533,-3.1883,'Europe/London'],['Liverpool','UK',53.4084,-2.9916,'Europe/London'],['Cardiff','UK',51.4816,-3.1791,'Europe/London'],
    ['Belfast','UK',54.5973,-5.9301,'Europe/London'],['Sheffield','UK',53.3811,-1.4701,'Europe/London'],['Newcastle','UK',54.9783,-1.6178,'Europe/London'],
    ['Nottingham','UK',52.9548,-1.1581,'Europe/London'],['Brighton','UK',50.8225,-0.1372,'Europe/London'],['Oxford','UK',51.7520,-1.2577,'Europe/London'],
    ['Cambridge','UK',52.2053,0.1218,'Europe/London'],['Braintree','UK',51.8780,0.5500,'Europe/London'],['Colchester','UK',51.8959,0.8919,'Europe/London'],
    ['Bath','UK',51.3811,-2.3590,'Europe/London'],['Norwich','UK',52.6309,1.2974,'Europe/London'],['Exeter','UK',50.7184,-3.5339,'Europe/London'],
    ['Plymouth','UK',50.3755,-4.1427,'Europe/London'],['Southampton','UK',50.9097,-1.4044,'Europe/London'],['Portsmouth','UK',50.8198,-1.0880,'Europe/London'],
    ['Dublin','Ireland',53.3498,-6.2603,'Europe/Dublin'],['Cork','Ireland',51.8985,-8.4756,'Europe/Dublin'],
    ['Paris','France',48.8566,2.3522,'Europe/Paris'],['Lyon','France',45.7640,4.8357,'Europe/Paris'],['Marseille','France',43.2965,5.3698,'Europe/Paris'],
    ['Berlin','Germany',52.5200,13.4050,'Europe/Berlin'],['Munich','Germany',48.1351,11.5820,'Europe/Berlin'],['Hamburg','Germany',53.5511,9.9937,'Europe/Berlin'],
    ['Madrid','Spain',40.4168,-3.7038,'Europe/Madrid'],['Barcelona','Spain',41.3851,2.1734,'Europe/Madrid'],['Lisbon','Portugal',38.7223,-9.1393,'Europe/Lisbon'],
    ['Rome','Italy',41.9028,12.4964,'Europe/Rome'],['Milan','Italy',45.4642,9.1900,'Europe/Rome'],['Naples','Italy',40.8518,14.2681,'Europe/Rome'],
    ['Amsterdam','Netherlands',52.3676,4.9041,'Europe/Amsterdam'],['Brussels','Belgium',50.8503,4.3517,'Europe/Brussels'],
    ['Zurich','Switzerland',47.3769,8.5417,'Europe/Zurich'],['Vienna','Austria',48.2082,16.3738,'Europe/Vienna'],['Prague','Czechia',50.0755,14.4378,'Europe/Prague'],
    ['Copenhagen','Denmark',55.6761,12.5683,'Europe/Copenhagen'],['Stockholm','Sweden',59.3293,18.0686,'Europe/Stockholm'],['Oslo','Norway',59.9139,10.7522,'Europe/Oslo'],
    ['Helsinki','Finland',60.1699,24.9384,'Europe/Helsinki'],['Warsaw','Poland',52.2297,21.0122,'Europe/Warsaw'],['Athens','Greece',37.9838,23.7275,'Europe/Athens'],
    ['Istanbul','Turkey',41.0082,28.9784,'Europe/Istanbul'],['Moscow','Russia',55.7558,37.6173,'Europe/Moscow'],['Kyiv','Ukraine',50.4501,30.5234,'Europe/Kyiv'],
    ['New York','USA',40.7128,-74.0060,'America/New_York'],['Los Angeles','USA',34.0522,-118.2437,'America/Los_Angeles'],['Chicago','USA',41.8781,-87.6298,'America/Chicago'],
    ['Houston','USA',29.7604,-95.3698,'America/Chicago'],['Phoenix','USA',33.4484,-112.0740,'America/Phoenix'],['San Francisco','USA',37.7749,-122.4194,'America/Los_Angeles'],
    ['Seattle','USA',47.6062,-122.3321,'America/Los_Angeles'],['Boston','USA',42.3601,-71.0589,'America/New_York'],['Miami','USA',25.7617,-80.1918,'America/New_York'],
    ['Atlanta','USA',33.7490,-84.3880,'America/New_York'],['Denver','USA',39.7392,-104.9903,'America/Denver'],['Austin','USA',30.2672,-97.7431,'America/Chicago'],
    ['Washington','USA',38.9072,-77.0369,'America/New_York'],['Las Vegas','USA',36.1699,-115.1398,'America/Los_Angeles'],['New Orleans','USA',29.9511,-90.0715,'America/Chicago'],
    ['Toronto','Canada',43.6532,-79.3832,'America/Toronto'],['Vancouver','Canada',49.2827,-123.1207,'America/Vancouver'],['Montreal','Canada',45.5019,-73.5674,'America/Toronto'],
    ['Mexico City','Mexico',19.4326,-99.1332,'America/Mexico_City'],['Sao Paulo','Brazil',-23.5505,-46.6333,'America/Sao_Paulo'],['Rio de Janeiro','Brazil',-22.9068,-43.1729,'America/Sao_Paulo'],
    ['Buenos Aires','Argentina',-34.6037,-58.3816,'America/Argentina/Buenos_Aires'],['Lima','Peru',-12.0464,-77.0428,'America/Lima'],['Bogota','Colombia',4.7110,-74.0721,'America/Bogota'],
    ['Santiago','Chile',-33.4489,-70.6693,'America/Santiago'],
    ['Tokyo','Japan',35.6762,139.6503,'Asia/Tokyo'],['Osaka','Japan',34.6937,135.5023,'Asia/Tokyo'],['Seoul','South Korea',37.5665,126.9780,'Asia/Seoul'],
    ['Beijing','China',39.9042,116.4074,'Asia/Shanghai'],['Shanghai','China',31.2304,121.4737,'Asia/Shanghai'],['Hong Kong','China',22.3193,114.1694,'Asia/Hong_Kong'],
    ['Singapore','Singapore',1.3521,103.8198,'Asia/Singapore'],['Bangkok','Thailand',13.7563,100.5018,'Asia/Bangkok'],['Jakarta','Indonesia',-6.2088,106.8456,'Asia/Jakarta'],
    ['Manila','Philippines',14.5995,120.9842,'Asia/Manila'],['Mumbai','India',19.0760,72.8777,'Asia/Kolkata'],['Delhi','India',28.7041,77.1025,'Asia/Kolkata'],
    ['Bangalore','India',12.9716,77.5946,'Asia/Kolkata'],['Chennai','India',13.0827,80.2707,'Asia/Kolkata'],['Kolkata','India',22.5726,88.3639,'Asia/Kolkata'],
    ['Dubai','UAE',25.2048,55.2708,'Asia/Dubai'],['Tel Aviv','Israel',32.0853,34.7818,'Asia/Jerusalem'],['Cairo','Egypt',30.0444,31.2357,'Africa/Cairo'],
    ['Johannesburg','South Africa',-26.2041,28.0473,'Africa/Johannesburg'],['Cape Town','South Africa',-33.9249,18.4241,'Africa/Johannesburg'],
    ['Lagos','Nigeria',6.5244,3.3792,'Africa/Lagos'],['Nairobi','Kenya',-1.2921,36.8219,'Africa/Nairobi'],['Casablanca','Morocco',33.5731,-7.5898,'Africa/Casablanca'],
    ['Sydney','Australia',-33.8688,151.2093,'Australia/Sydney'],['Melbourne','Australia',-37.8136,144.9631,'Australia/Melbourne'],['Brisbane','Australia',-27.4698,153.0251,'Australia/Brisbane'],
    ['Perth','Australia',-31.9505,115.8605,'Australia/Perth'],['Auckland','New Zealand',-36.8485,174.7633,'Pacific/Auckland'],['Wellington','New Zealand',-41.2865,174.7762,'Pacific/Auckland'],
    ['Leicester','UK',52.6369,-1.1398,'Europe/London'],['Coventry','UK',52.4068,-1.5197,'Europe/London'],['Hull','UK',53.7676,-0.3274,'Europe/London'],
    ['Stoke-on-Trent','UK',53.0027,-2.1794,'Europe/London'],['Wolverhampton','UK',52.5870,-2.1288,'Europe/London'],['Derby','UK',52.9228,-1.4763,'Europe/London'],
    ['Swansea','UK',51.6214,-3.9436,'Europe/London'],['Aberdeen','UK',57.1497,-2.0943,'Europe/London'],['Dundee','UK',56.4620,-2.9707,'Europe/London'],
    ['Reading','UK',51.4543,-0.9781,'Europe/London'],['York','UK',53.9600,-1.0873,'Europe/London'],['Bournemouth','UK',50.7192,-1.8808,'Europe/London'],
    ['Milton Keynes','UK',52.0406,-0.7594,'Europe/London'],['Bradford','UK',53.7960,-1.7594,'Europe/London'],['Sunderland','UK',54.9069,-1.3838,'Europe/London'],
    ['Preston','UK',53.7632,-2.7031,'Europe/London'],['Blackpool','UK',53.8175,-3.0357,'Europe/London'],['Middlesbrough','UK',54.5742,-1.2350,'Europe/London'],
    ['Ipswich','UK',52.0567,1.1482,'Europe/London'],['Gloucester','UK',51.8642,-2.2380,'Europe/London'],['Inverness','UK',57.4778,-4.2247,'Europe/London'],
    ['Galway','Ireland',53.2707,-9.0568,'Europe/Dublin'],['Limerick','Ireland',52.6638,-8.6267,'Europe/Dublin'],
    ['Toulouse','France',43.6047,1.4442,'Europe/Paris'],['Nice','France',43.7102,7.2620,'Europe/Paris'],['Nantes','France',47.2184,-1.5536,'Europe/Paris'],
    ['Strasbourg','France',48.5734,7.7521,'Europe/Paris'],['Bordeaux','France',44.8378,-0.5792,'Europe/Paris'],['Lille','France',50.6292,3.0573,'Europe/Paris'],
    ['Cologne','Germany',50.9375,6.9603,'Europe/Berlin'],['Frankfurt','Germany',50.1109,8.6821,'Europe/Berlin'],['Stuttgart','Germany',48.7758,9.1829,'Europe/Berlin'],
    ['Dusseldorf','Germany',51.2277,6.7735,'Europe/Berlin'],['Dortmund','Germany',51.5136,7.4653,'Europe/Berlin'],['Leipzig','Germany',51.3397,12.3731,'Europe/Berlin'],
    ['Dresden','Germany',51.0504,13.7373,'Europe/Berlin'],['Nuremberg','Germany',49.4521,11.0767,'Europe/Berlin'],
    ['Valencia','Spain',39.4699,-0.3763,'Europe/Madrid'],['Seville','Spain',37.3891,-5.9845,'Europe/Madrid'],['Bilbao','Spain',43.2630,-2.9350,'Europe/Madrid'],
    ['Malaga','Spain',36.7213,-4.4214,'Europe/Madrid'],['Zaragoza','Spain',41.6488,-0.8891,'Europe/Madrid'],
    ['Turin','Italy',45.0703,7.6869,'Europe/Rome'],['Florence','Italy',43.7696,11.2558,'Europe/Rome'],['Venice','Italy',45.4408,12.3155,'Europe/Rome'],
    ['Bologna','Italy',44.4949,11.3426,'Europe/Rome'],['Palermo','Italy',38.1157,13.3615,'Europe/Rome'],['Genoa','Italy',44.4056,8.9463,'Europe/Rome'],
    ['Rotterdam','Netherlands',51.9244,4.4777,'Europe/Amsterdam'],['The Hague','Netherlands',52.0705,4.3007,'Europe/Amsterdam'],['Utrecht','Netherlands',52.0907,5.1214,'Europe/Amsterdam'],
    ['Antwerp','Belgium',51.2194,4.4025,'Europe/Brussels'],['Ghent','Belgium',51.0543,3.7174,'Europe/Brussels'],
    ['Geneva','Switzerland',46.2044,6.1432,'Europe/Zurich'],['Basel','Switzerland',47.5596,7.5886,'Europe/Zurich'],['Bern','Switzerland',46.9480,7.4474,'Europe/Zurich'],
    ['Graz','Austria',47.0707,15.4395,'Europe/Vienna'],['Salzburg','Austria',47.8095,13.0550,'Europe/Vienna'],['Porto','Portugal',41.1579,-8.6291,'Europe/Lisbon'],
    ['Krakow','Poland',50.0647,19.9450,'Europe/Warsaw'],['Wroclaw','Poland',51.1079,17.0385,'Europe/Warsaw'],['Gdansk','Poland',54.3520,18.6466,'Europe/Warsaw'],
    ['Thessaloniki','Greece',40.6401,22.9444,'Europe/Athens'],['Budapest','Hungary',47.4979,19.0402,'Europe/Budapest'],['Bucharest','Romania',44.4268,26.1025,'Europe/Bucharest'],
    ['Sofia','Bulgaria',42.6977,23.3219,'Europe/Sofia'],['Belgrade','Serbia',44.7866,20.4489,'Europe/Belgrade'],['Zagreb','Croatia',45.8150,15.9819,'Europe/Zagreb'],
    ['Bratislava','Slovakia',48.1486,17.1077,'Europe/Bratislava'],['Ljubljana','Slovenia',46.0569,14.5058,'Europe/Ljubljana'],['Tallinn','Estonia',59.4370,24.7536,'Europe/Tallinn'],
    ['Riga','Latvia',56.9496,24.1052,'Europe/Riga'],['Vilnius','Lithuania',54.6872,25.2797,'Europe/Vilnius'],['Reykjavik','Iceland',64.1466,-21.9426,'Atlantic/Reykjavik'],
    ['Luxembourg','Luxembourg',49.6116,6.1319,'Europe/Luxembourg'],['Valletta','Malta',35.8989,14.5146,'Europe/Malta'],['Sarajevo','Bosnia',43.8563,18.4131,'Europe/Sarajevo'],
    ['Tirana','Albania',41.3275,19.8187,'Europe/Tirane'],['Minsk','Belarus',53.9006,27.5590,'Europe/Minsk'],
    ['Saint Petersburg','Russia',59.9311,30.3609,'Europe/Moscow'],['Novosibirsk','Russia',55.0084,82.9357,'Asia/Novosibirsk'],['Yekaterinburg','Russia',56.8389,60.6057,'Asia/Yekaterinburg'],
    ['Kharkiv','Ukraine',49.9935,36.2304,'Europe/Kyiv'],['Odesa','Ukraine',46.4825,30.7233,'Europe/Kyiv'],['Lviv','Ukraine',49.8397,24.0297,'Europe/Kyiv'],
    ['Riyadh','Saudi Arabia',24.7136,46.6753,'Asia/Riyadh'],['Jeddah','Saudi Arabia',21.4858,39.1925,'Asia/Riyadh'],['Doha','Qatar',25.2854,51.5310,'Asia/Qatar'],
    ['Abu Dhabi','UAE',24.4539,54.3773,'Asia/Dubai'],['Kuwait City','Kuwait',29.3759,47.9774,'Asia/Kuwait'],['Manama','Bahrain',26.2285,50.5860,'Asia/Bahrain'],
    ['Muscat','Oman',23.5880,58.3829,'Asia/Muscat'],['Amman','Jordan',31.9454,35.9284,'Asia/Amman'],['Beirut','Lebanon',33.8938,35.5018,'Asia/Beirut'],
    ['Baghdad','Iraq',33.3152,44.3661,'Asia/Baghdad'],['Tehran','Iran',35.6892,51.3890,'Asia/Tehran'],['Jerusalem','Israel',31.7683,35.2137,'Asia/Jerusalem'],
    ['Ankara','Turkey',39.9334,32.8597,'Europe/Istanbul'],
    ['Guangzhou','China',23.1291,113.2644,'Asia/Shanghai'],['Shenzhen','China',22.5431,114.0579,'Asia/Shanghai'],['Chengdu','China',30.5728,104.0668,'Asia/Shanghai'],
    ['Wuhan','China',30.5928,114.3055,'Asia/Shanghai'],['Xian','China',34.3416,108.9398,'Asia/Shanghai'],['Hangzhou','China',30.2741,120.1551,'Asia/Shanghai'],
    ['Tianjin','China',39.3434,117.3616,'Asia/Shanghai'],
    ['Nagoya','Japan',35.1815,136.9066,'Asia/Tokyo'],['Sapporo','Japan',43.0618,141.3545,'Asia/Tokyo'],['Fukuoka','Japan',33.5904,130.4017,'Asia/Tokyo'],
    ['Kyoto','Japan',35.0116,135.7681,'Asia/Tokyo'],['Yokohama','Japan',35.4437,139.6380,'Asia/Tokyo'],['Kobe','Japan',34.6901,135.1955,'Asia/Tokyo'],
    ['Busan','South Korea',35.1796,129.0756,'Asia/Seoul'],['Incheon','South Korea',37.4563,126.7052,'Asia/Seoul'],
    ['Hyderabad','India',17.3850,78.4867,'Asia/Kolkata'],['Ahmedabad','India',23.0225,72.5714,'Asia/Kolkata'],['Pune','India',18.5204,73.8567,'Asia/Kolkata'],
    ['Jaipur','India',26.9124,75.7873,'Asia/Kolkata'],['Surat','India',21.1702,72.8311,'Asia/Kolkata'],['Lucknow','India',26.8467,80.9462,'Asia/Kolkata'],
    ['Kochi','India',9.9312,76.2673,'Asia/Kolkata'],
    ['Karachi','Pakistan',24.8607,67.0011,'Asia/Karachi'],['Lahore','Pakistan',31.5204,74.3587,'Asia/Karachi'],['Islamabad','Pakistan',33.6844,73.0479,'Asia/Karachi'],
    ['Dhaka','Bangladesh',23.8103,90.4125,'Asia/Dhaka'],['Colombo','Sri Lanka',6.9271,79.8612,'Asia/Colombo'],['Kathmandu','Nepal',27.7172,85.3240,'Asia/Kathmandu'],
    ['Chiang Mai','Thailand',18.7883,98.9853,'Asia/Bangkok'],['Ho Chi Minh City','Vietnam',10.8231,106.6297,'Asia/Ho_Chi_Minh'],['Hanoi','Vietnam',21.0285,105.8542,'Asia/Ho_Chi_Minh'],
    ['Kuala Lumpur','Malaysia',3.1390,101.6869,'Asia/Kuala_Lumpur'],['Surabaya','Indonesia',-7.2575,112.7521,'Asia/Jakarta'],['Bandung','Indonesia',-6.9175,107.6191,'Asia/Jakarta'],
    ['Denpasar','Indonesia',-8.6705,115.2126,'Asia/Makassar'],['Cebu','Philippines',10.3157,123.8854,'Asia/Manila'],['Davao','Philippines',7.1907,125.4553,'Asia/Manila'],
    ['Taipei','Taiwan',25.0330,121.5654,'Asia/Taipei'],['Kaohsiung','Taiwan',22.6273,120.3014,'Asia/Taipei'],['Yangon','Myanmar',16.8409,96.1735,'Asia/Yangon'],
    ['Phnom Penh','Cambodia',11.5564,104.9282,'Asia/Phnom_Penh'],['Almaty','Kazakhstan',43.2220,76.8512,'Asia/Almaty'],['Tashkent','Uzbekistan',41.2995,69.2401,'Asia/Tashkent'],
    ['Ulaanbaatar','Mongolia',47.8864,106.9057,'Asia/Ulaanbaatar'],
    ['Accra','Ghana',5.6037,-0.1870,'Africa/Accra'],['Addis Ababa','Ethiopia',9.0300,38.7400,'Africa/Addis_Ababa'],['Dar es Salaam','Tanzania',-6.7924,39.2083,'Africa/Dar_es_Salaam'],
    ['Kampala','Uganda',0.3476,32.5825,'Africa/Kampala'],['Kigali','Rwanda',-1.9441,30.0619,'Africa/Kigali'],['Dakar','Senegal',14.7167,-17.4677,'Africa/Dakar'],
    ['Abidjan','Ivory Coast',5.3600,-4.0083,'Africa/Abidjan'],['Tunis','Tunisia',36.8065,10.1815,'Africa/Tunis'],['Algiers','Algeria',36.7538,3.0588,'Africa/Algiers'],
    ['Khartoum','Sudan',15.5007,32.5599,'Africa/Khartoum'],['Harare','Zimbabwe',-17.8252,31.0335,'Africa/Harare'],['Lusaka','Zambia',-15.3875,28.3228,'Africa/Lusaka'],
    ['Maputo','Mozambique',-25.9692,32.5732,'Africa/Maputo'],['Luanda','Angola',-8.8390,13.2894,'Africa/Luanda'],['Kinshasa','DR Congo',-4.4419,15.2663,'Africa/Kinshasa'],
    ['Durban','South Africa',-29.8587,31.0218,'Africa/Johannesburg'],['Pretoria','South Africa',-25.7479,28.2293,'Africa/Johannesburg'],['Marrakesh','Morocco',31.6295,-7.9811,'Africa/Casablanca'],
    ['Rabat','Morocco',34.0209,-6.8416,'Africa/Casablanca'],['Tripoli','Libya',32.8872,13.1913,'Africa/Tripoli'],
    ['Philadelphia','USA',39.9526,-75.1652,'America/New_York'],['San Diego','USA',32.7157,-117.1611,'America/Los_Angeles'],['Dallas','USA',32.7767,-96.7970,'America/Chicago'],
    ['San Jose','USA',37.3382,-121.8863,'America/Los_Angeles'],['Jacksonville','USA',30.3322,-81.6557,'America/New_York'],['San Antonio','USA',29.4241,-98.4936,'America/Chicago'],
    ['Columbus','USA',39.9612,-82.9988,'America/New_York'],['Charlotte','USA',35.2271,-80.8431,'America/New_York'],['Indianapolis','USA',39.7684,-86.1581,'America/Indiana/Indianapolis'],
    ['Detroit','USA',42.3314,-83.0458,'America/Detroit'],['Nashville','USA',36.1627,-86.7816,'America/Chicago'],['Memphis','USA',35.1495,-90.0490,'America/Chicago'],
    ['Portland','USA',45.5152,-122.6784,'America/Los_Angeles'],['Oklahoma City','USA',35.4676,-97.5164,'America/Chicago'],['Milwaukee','USA',43.0389,-87.9065,'America/Chicago'],
    ['Sacramento','USA',38.5816,-121.4944,'America/Los_Angeles'],['Kansas City','USA',39.0997,-94.5786,'America/Chicago'],['Minneapolis','USA',44.9778,-93.2650,'America/Chicago'],
    ['Cleveland','USA',41.4993,-81.6944,'America/New_York'],['Tampa','USA',27.9506,-82.4572,'America/New_York'],['Pittsburgh','USA',40.4406,-79.9959,'America/New_York'],
    ['Cincinnati','USA',39.1031,-84.5120,'America/New_York'],['St. Louis','USA',38.6270,-90.1994,'America/Chicago'],['Orlando','USA',28.5383,-81.3792,'America/New_York'],
    ['Salt Lake City','USA',40.7608,-111.8910,'America/Denver'],['Raleigh','USA',35.7796,-78.6382,'America/New_York'],['Richmond','USA',37.5407,-77.4360,'America/New_York'],
    ['Buffalo','USA',42.8864,-78.8784,'America/New_York'],['Honolulu','USA',21.3069,-157.8583,'Pacific/Honolulu'],['Anchorage','USA',61.2181,-149.9003,'America/Anchorage'],
    ['Albuquerque','USA',35.0844,-106.6504,'America/Denver'],['Tucson','USA',32.2226,-110.9747,'America/Phoenix'],['El Paso','USA',31.7619,-106.4850,'America/Denver'],
    ['Baltimore','USA',39.2904,-76.6122,'America/New_York'],['Louisville','USA',38.2527,-85.7585,'America/New_York'],['Providence','USA',41.8240,-71.4128,'America/New_York'],
    ['Calgary','Canada',51.0447,-114.0719,'America/Edmonton'],['Ottawa','Canada',45.4215,-75.6972,'America/Toronto'],['Edmonton','Canada',53.5461,-113.4938,'America/Edmonton'],
    ['Winnipeg','Canada',49.8951,-97.1384,'America/Winnipeg'],['Quebec City','Canada',46.8139,-71.2080,'America/Toronto'],['Halifax','Canada',44.6488,-63.5752,'America/Halifax'],
    ['Victoria','Canada',48.4284,-123.3656,'America/Vancouver'],['Hamilton','Canada',43.2557,-79.8711,'America/Toronto'],['St. Johns','Canada',47.5615,-52.7126,'America/St_Johns'],
    ['Guadalajara','Mexico',20.6597,-103.3496,'America/Mexico_City'],['Monterrey','Mexico',25.6866,-100.3161,'America/Monterrey'],['Puebla','Mexico',19.0414,-98.2063,'America/Mexico_City'],
    ['Tijuana','Mexico',32.5149,-117.0382,'America/Tijuana'],['Cancun','Mexico',21.1619,-86.8515,'America/Cancun'],['Merida','Mexico',20.9674,-89.5926,'America/Merida'],
    ['Guatemala City','Guatemala',14.6349,-90.5069,'America/Guatemala'],['San Salvador','El Salvador',13.6929,-89.2182,'America/El_Salvador'],['Panama City','Panama',8.9824,-79.5199,'America/Panama'],
    ['San Jose','Costa Rica',9.9281,-84.0907,'America/Costa_Rica'],['Havana','Cuba',23.1136,-82.3666,'America/Havana'],['Kingston','Jamaica',17.9712,-76.7936,'America/Jamaica'],
    ['Santo Domingo','Dominican Republic',18.4861,-69.9312,'America/Santo_Domingo'],['San Juan','Puerto Rico',18.4655,-66.1057,'America/Puerto_Rico'],['Port-au-Prince','Haiti',18.5944,-72.3074,'America/Port-au-Prince'],
    ['Nassau','Bahamas',25.0443,-77.3504,'America/Nassau'],['Port of Spain','Trinidad',10.6596,-61.5086,'America/Port_of_Spain'],
    ['Brasilia','Brazil',-15.7939,-47.8828,'America/Sao_Paulo'],['Salvador','Brazil',-12.9777,-38.5016,'America/Bahia'],['Fortaleza','Brazil',-3.7319,-38.5267,'America/Fortaleza'],
    ['Belo Horizonte','Brazil',-19.9167,-43.9345,'America/Sao_Paulo'],['Manaus','Brazil',-3.1190,-60.0217,'America/Manaus'],['Curitiba','Brazil',-25.4284,-49.2733,'America/Sao_Paulo'],
    ['Recife','Brazil',-8.0476,-34.8770,'America/Recife'],['Porto Alegre','Brazil',-30.0346,-51.2177,'America/Sao_Paulo'],['Cordoba','Argentina',-31.4201,-64.1888,'America/Argentina/Cordoba'],
    ['Rosario','Argentina',-32.9468,-60.6393,'America/Argentina/Cordoba'],['Mendoza','Argentina',-32.8895,-68.8458,'America/Argentina/Mendoza'],['Medellin','Colombia',6.2476,-75.5658,'America/Bogota'],
    ['Cali','Colombia',3.4516,-76.5320,'America/Bogota'],['Cartagena','Colombia',10.3910,-75.4794,'America/Bogota'],['Caracas','Venezuela',10.4806,-66.9036,'America/Caracas'],
    ['Quito','Ecuador',-0.1807,-78.4678,'America/Guayaquil'],['Guayaquil','Ecuador',-2.1894,-79.8891,'America/Guayaquil'],['La Paz','Bolivia',-16.4897,-68.1193,'America/La_Paz'],
    ['Asuncion','Paraguay',-25.2637,-57.5759,'America/Asuncion'],['Montevideo','Uruguay',-34.9011,-56.1645,'America/Montevideo'],['Cusco','Peru',-13.5320,-71.9675,'America/Lima'],
    ['Valparaiso','Chile',-33.0472,-71.6127,'America/Santiago'],
    ['Adelaide','Australia',-34.9285,138.6007,'Australia/Adelaide'],['Canberra','Australia',-35.2809,149.1300,'Australia/Sydney'],['Gold Coast','Australia',-28.0167,153.4000,'Australia/Brisbane'],
    ['Hobart','Australia',-42.8821,147.3272,'Australia/Hobart'],['Darwin','Australia',-12.4634,130.8456,'Australia/Darwin'],['Cairns','Australia',-16.9186,145.7781,'Australia/Brisbane'],
    ['Christchurch','New Zealand',-43.5321,172.6362,'Pacific/Auckland'],['Suva','Fiji',-18.1248,178.4501,'Pacific/Fiji']
  ];

  // The lineage behind the meanings — accurate citations of the classical tradition in our own words,
  // plus a few genuinely public-domain maxims (kept short, attributed). Modern astrologers' books are
  // copyrighted, so their teaching is summarised, never reproduced.
  var TRADITION = {
    general: [
      { q: 'As above, so below.', src: 'the Hermetic maxim (Emerald Tablet tradition)' },
      { q: 'Astra inclinant, sed non obligant, the stars incline, they do not compel.', src: 'a traditional astrological maxim' },
      { q: 'Character is destiny.', src: 'Alan Leo (1860–1917)' }
    ],
    elements: 'The four elements descend from Empedocles and the Greek physicians’ four humours. Fire (choleric), earth (melancholic), air (sanguine) and water (phlegmatic), the oldest map of temperament in the West.',
    signs: 'Each sign blends an element with a mode (cardinal, fixed, mutable). A scheme set down in Ptolemy’s Tetrabiblos and later systematised for modern readers by Alan Leo.',
    planets: 'Ptolemy’s Tetrabiblos fixes each planet’s core significations. Mars heat and action, Venus union and pleasure, Saturn limit and time, the root beneath every modern keyword.',
    houses: 'The twelve houses are the Hellenistic “places” (topoi), each a department of life: from the 1st (the body and self) to the 12th (the hidden, the undoing, what is behind the scenes).',
    aspects: 'These are the Ptolemaic aspects: conjunction, sextile, square, trine and opposition. The geometric angles Ptolemy held to carry real force between two planets.'
  };
  // Per-planet traditional significations (our own words) paired with a genuinely public-domain line.
  // lightly modernised, ellipses marking omission. The outer planets postdate the classical canon — said so plainly.
  var PLANET_TRAD = {
    sun: { sig: 'Vitality, the will, the heart and the essential self. The father, the sovereign, and what you were born to shine at. One of the two Lights, the chart’s source of life.', q: 'The active influence of the Sun is found to be heating and, in a certain degree, drying.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    moon: { sig: 'The body’s instincts, the tides of mood and memory, the mother and what makes you feel safe. The receptive Light that mirrors, carries and tends.', q: 'The Moon’s power consists chiefly in moistening, being near the earth and disposed to the humours thereof.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    venus: { sig: 'Love, pleasure, beauty, art and union. What and whom you value, and the urge to make peace and to delight. Traditionally the Lesser Fortune.', q: 'The power of Venus is temperate… and chiefly disposed to moisture.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    mars: { sig: 'Drive, courage, anger and desire. The cutting edge, the will to act and to fight. The Lesser Infortune: heat that must be well aimed.', q: 'The power of Mars is principally to dry and to burn, conformably to his fiery colour.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    jupiter: { sig: 'Growth, faith, abundance, wisdom and generosity. The wider horizon and the urge to expand and to bless. The Greater Fortune.', q: 'The power of Jupiter is temperate… and is consequently fructifying.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    saturn: { sig: 'Time, limit, structure and fear. The slow discipline that endures, and the weight that makes you grow up. The Greater Infortune, keeper of boundaries.', q: 'The power of Saturn is principally to cool, and moderately to dry.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    uranus: { sig: 'Freedom, shock, genius and revolt. The break for independence and the lightning that overturns. Unknown to the classical authors (discovered 1781); its meaning is a modern reading.' },
    neptune: { sig: 'Dreams, longing, compassion and dissolving edges, the mystic, the artist and the escape. Unknown to the ancients (discovered 1846); a modern signification.' },
    pluto: { sig: 'Power, depth, death and rebirth. What is buried, what is shared under pressure, and what is utterly transformed. Unknown to the tradition (discovered 1930); a modern reading.' }
  };
  var HOUSE_TRAD = [
    { sig: 'The body and the life itself: your appearance, vitality, temperament and the way you meet the world.' },
    { sig: 'What you own and what you’re worth. Money, possessions, resources, and the things you can move and use.' },
    { sig: 'Brothers and sisters, neighbours and everyday talk. Short journeys, letters, messages and the near world.' },
    { sig: 'Home, family roots and the father. Land, inheritance, and the ground you come from and return to.' },
    { sig: 'Children, romance, creativity and play. Pleasure, delight and everything you make for joy.' },
    { sig: 'Work, health and daily service. The body’s upkeep, routines, and those who labour with and for you.' },
    { sig: 'Partnership and marriage: the close other, open enemies, contracts and what you meet face to face.' },
    { sig: 'Death and inheritance, what is shared and what is hidden, other people’s resources, and deep change.' },
    { sig: 'The far horizon: long journeys, religion, philosophy, learning and dreams; the search for meaning.' },
    { sig: 'Career, calling and public standing. Honour, authority, reputation and what you’re known for.' },
    { sig: 'Friends, allies and community. Hopes, wishes and the wider circle that carries you forward.' },
    { sig: 'The hidden and the undone: solitude, retreat, secrets, self-undoing, and what works behind the scenes.' }
  ];
  return {
    PLANETS: PLANETS, PLANET_ORDER: PLANET_ORDER, SIGNS: SIGNS, TRADITION: TRADITION,
    PLANET_TRAD: PLANET_TRAD, HOUSE_TRAD: HOUSE_TRAD,
    SUN_IN_SIGN: SUN_IN_SIGN, MOON_IN_SIGN: MOON_IN_SIGN, RISING_IN_SIGN: RISING_IN_SIGN, PLANET_SIGN_TEXT: PLANET_SIGN_TEXT,
    HOUSES: HOUSES, ASPECTS: ASPECTS, MINOR_ASPECTS: MINOR_ASPECTS, ELEMENTS: ELEMENTS, MODALITIES: MODALITIES,
    TAROT: TAROT, SUIT_KW: SUIT_KW, SPREADS: SPREADS, CITIES: CITIES
  };
})();


// ===== THE TELLS: behaviour-level lines, one per chart fact. Written to be
// recognised in a mirror, not admired on a poster. =====
DATA.TELLS = {
  house: {
    sun: {
      1: 'people can describe you accurately after thirty seconds; hiding was never really on the table',
      2: 'you do not feel settled until something is owned, saved or built; browsing is never idle for you',
      3: 'you become yourself mid-conversation; the errand, the sibling call, the corner shop all feed you',
      4: 'you are the keeper of the family story, even if you moved the furthest away from it',
      5: 'you make things constantly and call none of it art; everyone else calls it exactly that',
      6: 'your identity lives in the doing: skip the useful work for a week and you feel like a stranger',
      7: 'you find out what you think by watching yourself react to one particular person',
      8: 'small talk exhausts you in minutes; one honest crisis conversation can feed you for a week',
      9: 'you are always half-enrolled in something: a course, a country, a conviction',
      10: 'strangers ask you what you do before they ask your name, and some part of you likes it',
      11: 'you are the one who turns a group of acquaintances into a named group chat with plans',
      12: 'you recharge only alone, and the people who love you have learned to stop taking it personally'
    },
    moon: {
      1: 'your face broadcasts the feeling a full sentence before you decide whether to share it',
      2: 'when shaken you count things: savings, tins in the cupboard, exits; counting calms you',
      3: 'you process feelings by narrating them: the voice note to a friend IS the therapy',
      4: 'one particular chair, mug or corner of home resets you; guests never understand why it matters',
      5: 'your moods want an audience of at least one; joy uncelebrated barely counts for you',
      6: 'you tidy when sad; a made bed at midnight is your version of a deep breath',
      7: 'you do not fully know what you feel until you have watched it land on someone you trust',
      8: 'you feel underneath what people say; the words never fooled you, even as a child',
      9: 'homesickness works backwards in you: you get it for places you have not been yet',
      10: 'you cry in the car, then walk in composed; almost no colleague has ever seen the car version',
      11: 'your friends are your emergency service and you are theirs; family found out later',
      12: 'you need one secret hour a day nobody can account for, or the week quietly collapses'
    },
    mercury: {
      1: 'you think out loud, at speed, and people mistake your first draft for your verdict',
      2: 'you can recite prices from years ago; your memory files everything under what it cost',
      3: 'you text in bursts of five; one message was never going to be enough',
      4: 'your best thinking happens at the kitchen table long after everyone else went to bed',
      5: 'you cannot explain anything without performing it a little, and the bit always lands',
      6: 'you keep lists about your lists, and losing the notebook is a genuine emergency',
      7: 'your ideas only finish in dialogue; alone they circle, with one good listener they land',
      8: 'you ask the question everyone was avoiding, quietly, at exactly the wrong dinner',
      9: 'every conversation with you ends two subjects away from where it began, uphill',
      10: 'you write the summary email nobody asked for and everybody ends up using',
      11: 'you collect people who know things: your contacts list reads like a reference library',
      12: 'your clearest thoughts arrive just before sleep and dissolve if not written down at once'
    },
    venus: {
      1: 'you cannot help making things around you slightly nicer: the table, the sentence, the mood',
      2: 'you buy fewer, better things and can defend every single one like a curator',
      3: 'you fall a little in love with anyone who makes you laugh in a queue',
      4: 'your idea of romance peaks at a full table in your own kitchen with nobody checking the time',
      5: 'you flirt with life itself: waiters, dogs, strangers, the weather; it is not personal, it is policy',
      6: 'love, to you, is remembering how they take their coffee and never asking again',
      7: 'you are built for the duet; even your solitude has a chair pulled out for someone',
      8: 'you would rather be known completely by one person than adored vaguely by fifty',
      9: 'you fall for accents, airports and anyone who makes the world feel wider',
      10: 'people flirt with your competence first; the rest of you they discover later',
      11: 'half your closest friendships began as someone you technically dated, or nearly did',
      12: 'you love hardest in private, and the person concerned may take years to fully find out'
    },
    mars: {
      1: 'you walk faster than the group without noticing, and lead without checking who followed',
      2: 'threaten your stuff or your savings and the calmest person in the room disappears',
      3: 'you fight in messages: drafted, edited, devastating, and occasionally, wisely, unsent',
      4: 'your temper only truly leaves the holster at home, which the outside world never believes',
      5: 'you compete at board games like the family name depends on it, because somehow it does',
      6: 'irritation turns you productive: your angriest days produce your cleanest kitchens',
      7: 'you discover your own strength mainly in collisions with one specific person',
      8: 'you go quiet when others go loud; your endurance in a crisis unsettles people',
      9: 'you will argue a principle to the end of the earth but forgive a person in a minute',
      10: 'you work like the deadline is a rival; rest feels like conceding a point to someone',
      11: 'you fight hardest for the group, and last for yourself',
      12: 'your anger goes underground for weeks, then surfaces as one perfectly final sentence'
    },
    jupiter: {
      1: 'your default answer is yes, and your calendar spends its life paying for it',
      2: 'money arrives when you stop worrying about it, which you refuse to accept as a method',
      3: 'you turn a trip to the post office into a story with three acts and a stranger in it',
      4: 'your home expands to fit whoever shows up; the table has never once been too small',
      5: 'your hobbies escalate: the sketchbook becomes a class becomes a small exhibition',
      6: 'you overbook your days out of optimism and somehow deliver most of it anyway',
      7: 'you marry, befriend and hire optimists; doom does not get a seat at your table',
      8: 'other people\u2019s crises bring out your biggest self; you grow where it is darkest',
      9: 'you have a five-year plan involving another country and you are not joking',
      10: 'your career moves in lucky leaps that were, on inspection, years of quiet preparation',
      11: 'you know someone useful for every situation, and you connect them for free, for joy',
      12: 'something has always caught you just before the fall, often enough that you almost trust it'
    },
    saturn: {
      1: 'people read you as older than you are, and always have, since the playground',
      2: 'you have known your exact bank balance since you were about nine',
      3: 'you weigh words before spending them; your one-line texts read like contracts',
      4: 'you became the responsible one at home early, and part of you is still on duty',
      5: 'fun does not come naturally; it gets scheduled, earned, and then thoroughly enjoyed',
      6: 'your routines are load-bearing: touch the morning ritual and the whole week wobbles',
      7: 'you take promises literally, which is why you make so few and keep them all',
      8: 'you plan for the worst so thoroughly that when it comes, you are strangely calm',
      9: 'you distrust easy answers on principle; your beliefs were all stress-tested first',
      10: 'the ladder was longer for you than for others, which is why the top will hold your weight',
      11: 'you keep three friends per decade and every one of them would help you move house',
      12: 'your harshest critic broadcasts from inside, on a frequency nobody else can hear'
    },
    uranus: {
      1: 'no two people describe you the same way, and every description annoys you slightly',
      2: 'your income has never once fit a form with a single box for occupation',
      3: 'you say the thing that stops the dinner table, then genuinely wonder why it went quiet',
      4: 'you rearrange the furniture the way other people go on holiday',
      5: 'your taste arrives five years early; you liked it before it was likeable, provably',
      6: 'you cannot hold a routine, so you invented a system of rotating ones, and it works',
      7: 'you need a partner who can watch you leave for the airport without asking why',
      8: 'your life splits into clear befores and afters; you count at least three so far',
      9: 'your beliefs update overnight when the evidence lands; loyalty to old opinions is not your vice',
      10: 'every job title you have held needed a follow-up sentence to explain',
      11: 'you collect outsiders; your birthday party is the strangest, warmest room of the year',
      12: 'your intuition arrives as sudden static: you know before you can say how you know'
    },
    neptune: {
      1: 'people project onto you constantly: everyone is sure you are someone they used to know',
      2: 'money evaporates around you by kindness: rounds bought, causes backed, loans forgotten',
      3: 'you speak in images; people quote your accidental one-liners back at you for years',
      4: 'the home you are homesick for may never quite have existed, and you know it, and it still pulls',
      5: 'you fall in love with potential so vividly the actual person can feel like an interruption',
      6: 'your body keeps the score of every mood; healers and naps do more for you than pills',
      7: 'you see who someone could be so clearly that you occasionally date the forecast, not the weather',
      8: 'you dream other people\u2019s dreams sometimes, and have learned not to mention it at breakfast',
      9: 'you believe six impossible things sincerely and none of them dogmatically',
      10: 'people sense what you are FOR before they can say what you do',
      11: 'strangers with heavy bags, literal and otherwise, find you in every crowd',
      12: 'the veil is thin for you: music, water and sleep are not hobbies, they are doors'
    },
    pluto: {
      1: 'you have been called intense by every second person who ever got close enough to say it',
      2: 'losing things does not scare you the normal amount; you have rebuilt from zero before',
      3: 'your casual questions are never casual, and the perceptive eventually notice',
      4: 'your family has a story nobody tells at dinner, and you are the one who carries it',
      5: 'you love like it is a matter of life and death, because to you it has never been a game',
      6: 'you purge: inboxes, wardrobes, habits; renewal by controlled demolition is your health plan',
      7: 'your closest bonds transform you or end you a little; there is no polite middle',
      8: 'you are the person others call when the truth is too heavy for anyone else',
      9: 'when a belief dies in you it dies completely; conversions in either direction are total',
      10: 'power arrives in your life whether requested or not; the work is holding it lightly',
      11: 'you can leave a whole social world overnight and never look back; you have',
      12: 'you do your dying and being reborn in private; even those closest see only the after'
    }
  },
  sign2: {
    sun: {
      Aries: 'you have started more things this year than most people start in five, and finished the ones that mattered',
      Taurus: 'you cannot be hurried into anything, including agreeing that you cannot be hurried',
      Gemini: 'you are two equally real people, and both of them think the other one is the act',
      Cancer: 'you never fully leave a place or a person; everyone you loved still has a room in you',
      Leo: 'you check whether the room is happy the way others check the weather, and take it personally',
      Virgo: 'you see the flaw first, in everything, always; the kindness is in what you choose not to say',
      Libra: 'you have strong opinions about fairness and weak ones about lunch, and the lunch thing is a decoy',
      Scorpio: 'you decide about people once, deeply, and appeals take years to reach the court',
      Sagittarius: 'your honesty arrives before your tact; people keep you anyway, for exactly that reason',
      Capricorn: 'you relax by achieving something smaller; the hammock has never once worked on you',
      Aquarius: 'you agree with the group right up until everyone agrees, then something in you objects',
      Pisces: 'your kindness has no working filter, so your boundaries had to be built by hand, from kits'
    },
    jupiter: {
      Aries: 'your luck shows up when you move first; waiting has never once paid you',
      Taurus: 'what you grow slowly holds: money, gardens, trust; your compounding is quiet and total',
      Gemini: 'doors open for you mid-conversation; your net worth is measured in interesting acquaintances',
      Cancer: 'generosity flows through your home: beds offered, soups delivered, keys copied for friends',
      Leo: 'fortune finds you on stage: the moment you stop hiding, the room starts helping',
      Virgo: 'your growth is in the craft: mastery arrives from ten thousand small corrections',
      Libra: 'your luck is other people, full stop; every big break in your life has a name attached',
      Scorpio: 'you profit where others will not look: crises, taboos, and the neglected deep end',
      Sagittarius: 'your risks pay because they are faith with homework; double luck, honestly earned',
      Capricorn: 'your expansions are engineered, not wished for; slower than others, but nothing collapses',
      Aquarius: 'your wildest bets are on people the world overlooked, and your hit rate is uncanny',
      Pisces: 'help reaches you through side doors: dreams, hunches, and strangers who owe you nothing'
    },
    saturn: {
      Aries: 'your lesson is patience, assigned to the one person who ordered urgency',
      Taurus: 'security took you longer to build than most, which is why yours is earthquake-proof',
      Gemini: 'you were slow to trust your own voice; now every word you say has been through quality control',
      Cancer: 'you learned early that feelings need containers; yours are handmade and they hold',
      Leo: 'applause took years to accept; you rehearse even your spontaneity, and it shows as grace',
      Virgo: 'your standards were a cage until you made them a craft; the difference took a decade',
      Libra: 'you take partnership as seriously as law, because for you it is one',
      Scorpio: 'your control was armour first; learning when to take it off is the life\u2019s work',
      Sagittarius: 'you had to earn your optimism the long way, so no one can talk you out of it',
      Capricorn: 'discipline is your native language; the work was learning that rest is not a foreign one',
      Aquarius: 'your independence was won, not given, and you can produce the receipts',
      Pisces: 'your task was building banks for an ocean; the ones you built hold ships now'
    }
  },
  micro2: {
    moon: {
      Aries: 'your bad mood has a half-life of about forty minutes, and apologising after still feels heroic',
      Taurus: 'change of plans lands on you like weather damage; give you a day and the roof is fixed',
      Gemini: 'you have narrated your own feelings to yourself in the second person; sometimes it helps',
      Cancer: 'you keep the ticket stubs; the shoebox is a reliquary and everyone in it is safe',
      Leo: 'a genuine compliment can carry you for a week; you pretend it cannot',
      Virgo: 'you feel loved when someone remembers the small specific thing; grand gestures make you audit them',
      Libra: 'conflict in the room raises your pulse even when it is not yours; you referee by reflex',
      Scorpio: 'you forgive, eventually, completely; you just also never delete the file',
      Sagittarius: 'your sadness books flights; three of your best trips began as escapes',
      Capricorn: 'you grieve on a schedule, privately, efficiently, and years later than the event',
      Aquarius: 'you explain your feelings like a documentary narrator, accurate and one step outside',
      Pisces: 'you cry at adverts and deny it, then cry at the denial, then laugh; the weather passes'
    },
    mercury: {
      Aries: 'your best comebacks arrive on time, which is rarer than people know',
      Taurus: 'you say it once; repeating yourself feels like being taxed twice',
      Gemini: 'you have three browsers of the mind open and can quote from all of them mid-sentence',
      Cancer: 'you never forget a kindness said aloud; word-for-word, decades later',
      Leo: 'you talk with your hands and the hands are usually right',
      Virgo: 'a typo in your own message physically hurts; you have corrected one at 2am',
      Libra: 'you soften every no until it sounds like a maybe; the no was real though',
      Scorpio: 'people leave conversations with you having said far more than they planned',
      Sagittarius: 'your tangents have tangents, and somehow land the plane anyway',
      Capricorn: 'your humour is so dry that half the room only laughs on the drive home',
      Aquarius: 'you ask the question that reframes the whole meeting, then go quiet again',
      Pisces: 'you answer the emotional content of the question rather than the question, correctly'
    },
    venus: {
      Aries: 'you have never once played hard to get; the concept offends your schedule',
      Taurus: 'your affection is a standing order, not a surprise; reliability IS the romance',
      Gemini: 'your longest relationship is with the person you never ran out of things to say to',
      Cancer: 'you love people by remembering their mother\u2019s name and their worst week',
      Leo: 'you keep every card anyone ever wrote you; the archive is love, itemised',
      Virgo: 'your care is preventative: the umbrella packed for someone else\u2019s forecast',
      Libra: 'you match your surroundings to the person you are with, instinctively, always',
      Scorpio: 'your loyalty is subterranean: invisible for years, then suddenly the whole ground',
      Sagittarius: 'your love needs a passport and hates a curfew, and thrives when given both freedoms',
      Capricorn: 'you show devotion in logistics: the lift booked, the form filled, the future planned',
      Aquarius: 'you keep loving people as friends long after the label changed; the love did not',
      Pisces: 'you have loved people you never told; those loves count, and shaped you'
    },
    mars: {
      Aries: 'you would rather lose fast than wait slow; the sprint is the point',
      Taurus: 'your fury has a fuse measured in months and an explosion nobody forgets',
      Gemini: 'in an argument you quote the other person accurately, which is somehow the most brutal move',
      Cancer: 'you defend your people like territory; your own corner you leave strangely unguarded',
      Leo: 'you fight best with an audience of exactly one: yourself, watching',
      Virgo: 'your rage alphabetises; the spice rack has absorbed arguments no one ever heard',
      Libra: 'you rehearse the confrontation until it becomes a fair trial, then hold it calmly',
      Scorpio: 'you do not do warning shots; by the time it is visible, it is finished',
      Sagittarius: 'your temper is a passing storm over a huge landscape; nothing structural moves',
      Capricorn: 'you weaponise competence: the best revenge you know is the annual report',
      Aquarius: 'you get combative on behalf of principles that will not benefit you at all',
      Pisces: 'pushed far enough you simply vanish, and the vanishing says everything'
    },
    rising: {
      Aries: 'you have been told to slow down by every group you ever walked with',
      Taurus: 'your calm is contagious; rooms settle when you sit down, and no one knows why',
      Gemini: 'you mirror accents within minutes and deny it while doing it',
      Cancer: 'you host by instinct: at other people\u2019s parties you still end up in the kitchen helping',
      Leo: 'photos find you; you are somehow lit correctly in other people\u2019s candids',
      Virgo: 'people hand you the tangled cable, the broken plan, the crying friend: you have the face of solutions',
      Libra: 'you are everyone\u2019s favourite plus-one; hosts relax when you accept',
      Scorpio: 'your resting expression has been called a lie detector; people straighten up near you',
      Sagittarius: 'you give off the air of just arriving from somewhere better, and about to leave for same',
      Capricorn: 'waiters bring you the card reader; the table simply assumes',
      Aquarius: 'you are the person people say their weird thing to, relieved, at last',
      Pisces: 'you seem to be listening to something behind the conversation, and you are'
    }
  }
};

// aspect tells: fuse = conjunction, hard = square/opposition, soft = trine/sextile
DATA.TELLS.aspect = {
  'sun-moon': { fuse: 'what you want and what you need agree, which makes you decisive and occasionally blind to other options', hard: 'your head votes one way and your gut the other on schedule; big choices need both signatures', soft: 'you rarely have to choose between wanting and needing; people envy how little you argue with yourself' },
  'sun-mercury': { fuse: 'you ARE your opinions; disagreement can feel oddly personal until you notice that', hard: 'you say it, hear it, and revise it; your second sentence is usually the true one', soft: 'you explain yourself easily; what you mean and what you say arrive together' },
  'sun-venus': { fuse: 'charm is not something you do, it is something you are; discounts happen to you', hard: 'you want to be liked AND to be right, and on loud days those bills both come due', soft: 'you make being yourself look pleasant; rooms warm a degree when you commit to them' },
  'sun-mars': { fuse: 'your will and your engine share a pedal: from decision to motion in one beat', hard: 'you pick fights with your own plans; the enemy is often last month\u2019s version of you', soft: 'effort feels natural to you; you cannot fully understand people who circle the pool' },
  'sun-jupiter': { fuse: 'you carry weather with you: rooms get more optimistic when you arrive, including unwisely', hard: 'you promise a size too big, then grow into it barely on time; somehow it keeps working', soft: 'doors open a beat before you knock; you call it luck out of politeness' },
  'sun-saturn': { fuse: 'you were born with a supervisor installed; achievements register only after inspection', hard: 'a voice says not good enough on a loop; your life\u2019s work is retiring that voice with honours', soft: 'you build slowly and keep everything you build; your word is architecture' },
  'sun-uranus': { fuse: 'you are the exception to rules you have not heard yet; forms were not drafted with you in mind', hard: 'the moment life stabilises you feel an itch to tip it; learn to renovate instead of detonate', soft: 'you update yourself without crisis; reinvention is your maintenance schedule' },
  'sun-neptune': { fuse: 'your edges blur into whatever room you are in; solitude returns you to yourself', hard: 'you oscillate between the dream and the deadline; the trick is building the dream a desk', soft: 'imagination runs through your identity like water through a valley: quietly shaping everything' },
  'sun-pluto': { fuse: 'you do nothing lightly; even your small talk has a basement', hard: 'you and power circle each other for life: drawn, wary, and repeatedly transformed', soft: 'you regenerate: every few years a deeper version of you walks out wearing the same name' },
  'moon-mercury': { fuse: 'your feelings arrive pre-worded; you can caption a mood while still inside it', hard: 'what you feel and what you can say run on different clocks; write it before you speak it', soft: 'you talk your heart fluently; friends borrow your sentences for their own feelings' },
  'moon-venus': { fuse: 'comfort and affection are one substance to you: feeding people IS the feeling', hard: 'what soothes you and what pleases others diverge; stop invoicing yourself for having needs', soft: 'you are easy to be near; your presence reads as furniture in the best sense: restful, made well' },
  'moon-mars': { fuse: 'your feelings arrive with their coats already on, ready to act; waiting is the hard part', hard: 'irritation and hurt swap costumes on you; count to ten to see which one it actually is', soft: 'you defend your people the moment it is needed, without theatre; they sleep better for it' },
  'moon-jupiter': { fuse: 'your moods are weather systems with generous rainfall: big, warm, and briefly everywhere', hard: 'you soothe yourself in sizes too large: the cart, the plate, the promise; small also works', soft: 'your inner weather trends fair; people shelter in your mood on their bad days' },
  'moon-saturn': { fuse: 'you ration your own comfort like a wartime clerk; the audit of feelings can end, truly', hard: 'you learned early to need less; unlearning that is allowed now, and overdue', soft: 'your calm is load-bearing; people build things on your steadiness and they hold' },
  'moon-uranus': { fuse: 'your moods change like channels, and somewhere along the way you got the remote back', hard: 'closeness and freedom take turns pulling your sleeve; tell people which one is winning today', soft: 'you feel differently and early: the emotional early-warning system of every group you join' },
  'moon-neptune': { fuse: 'you are porous: songs, strangers and weather all get in; choose your inputs like meals', hard: 'you idealise, then invoice reality for the difference; meet people at their actual address', soft: 'your empathy is telepathic-adjacent; you knew before they called, again' },
  'moon-pluto': { fuse: 'you feel in depths most people only visit; surfacing politely is a skill you had to learn', hard: 'trust builds in you by ordeal: tested, broken once, rebuilt permanent', soft: 'people hand you their secrets unprompted; you were built with vault space' },
  'mercury-venus': { fuse: 'you cannot write an ugly sentence; even your shopping lists have cadence', hard: 'truth or tact, pick two: your life\u2019s edit is making honesty land kindly', soft: 'you negotiate like it is a dance; both sides leave believing they led' },
  'mercury-mars': { fuse: 'your words carry blades they did not order; sharpness is your factory setting', hard: 'you interrupt because your brain finished early; let the room catch up and you win twice', soft: 'you think in decisions; meetings end when you finally speak' },
  'mercury-jupiter': { fuse: 'you cannot tell a small story; details grow in your keeping, and improve', hard: 'you oversell, then over-deliver to cover it; exhausting, magnificent, optional', soft: 'you teach without meaning to; people leave conversations with you knowing more' },
  'mercury-saturn': { fuse: 'every sentence you release passed inspection; people quote you in writing', hard: 'you doubted your own intelligence long after the evidence cleared you; the evidence stands', soft: 'your thinking has foundations; fads wash past you like weather past a lighthouse' },
  'mercury-uranus': { fuse: 'your mind skips steps and lands right; showing the working was always the hard part', hard: 'your best ideas arrive rude and early, interrupting; park them, they keep', soft: 'you connect dots across whole rooms of thought; the word is insight and you mass-produce it' },
  'mercury-neptune': { fuse: 'you think in images and translate on the fly; poetry is your first language, prose the second', hard: 'facts and impressions blur at speed; write things down, your notes are your anchor', soft: 'you say the thing sideways and it lands truer than the straight version would' },
  'mercury-pluto': { fuse: 'you cannot un-see subtext; every conversation has a second transcript only you hold', hard: 'your words can cut to the studs; you know exactly which sentence not to say, so do not', soft: 'you find the buried lede in everything: conversations, contracts, people' },
  'venus-mars': { fuse: 'desire and affection share one engine in you; lukewarm is not in the range', hard: 'you want what unsettles you and unsettle what you want; the spark IS the argument, managed', soft: 'warmth and pursuit cooperate in you; your relationships start naturally and age well' },
  'venus-jupiter': { fuse: 'your heart over-caters as policy; there is always room, always more, always dessert', hard: 'you promise your affection widely and your calendar narrowly; pick where the love lands', soft: 'you are generous without keeping books, and somehow the books balance anyway' },
  'venus-saturn': { fuse: 'you treat love as a craft: fewer pieces, joinery that outlives fashion', hard: 'you tested affection for weight limits before standing on it; some bridges were sound, are sound', soft: 'your loves last; you do maintenance on relationships other people only decorate' },
  'venus-uranus': { fuse: 'your taste and your affections arrive without precedent; you loved it before it had a name', hard: 'closeness triggers your exits and distance triggers your longing; name the pattern to retire it', soft: 'you keep loves and friendships alive across years and cities without a schedule; they just hold' },
  'venus-neptune': { fuse: 'you love the glow around people, sometimes more than the person; check the wattage source', hard: 'you have loved mirages and paid real tolls; your compass improved at full price', soft: 'you see the best in people so consistently that they start attending to it themselves' },
  'venus-pluto': { fuse: 'you bond at depths where casual cannot breathe; your people are FEW and permanent', hard: 'love and control traded masks on you once; you know the difference now at a glance', soft: 'your affection transforms people quietly; exes and old friends credit you years later' },
  'mars-jupiter': { fuse: 'your effort comes in surplus; you do not do small pushes, only campaigns', hard: 'you bet the whole tank on the first mile; ration the fire and you win the distance', soft: 'action and luck cooperate for you; momentum, once started, brings friends' },
  'mars-saturn': { fuse: 'your drive runs through a governor: slower than rage, more final than enthusiasm', hard: 'you accelerate and brake at once, then wonder about the smoke; alternate the pedals', soft: 'your effort is metered and relentless; you outlast everyone who out-sprinted you' },
  'mars-uranus': { fuse: 'your actions arrive without preamble; even your patience ends suddenly', hard: 'your restlessness picks fights with your plans; give it a physical job before it freelances', soft: 'you act on the new thing while others are still forwarding the article' },
  'mars-neptune': { fuse: 'your drive needs a cause with a soul; money alone cannot get you out of bed', hard: 'your energy leaks through vagueness; a written goal doubles your horsepower, measurably', soft: 'you pursue dreams with practical footwork: the rare mystic with laced boots' },
  'mars-pluto': { fuse: 'your will has a second, deeper tank most people never find in themselves', hard: 'you do not lose arguments so much as postpone victories; check the cost sheet sometimes', soft: 'your persistence is geological; you move obstacles by out-existing them' },
  'jupiter-saturn': { fuse: 'you are the accelerator and the brake in one body: rare, and employable anywhere', hard: 'optimism and caution alternate custody of your plans; let them co-sign instead', soft: 'you grow inside structures and structure your growth; institutions secretly run on people like you' },
  'jupiter-uranus': { fuse: 'your breakthroughs cluster: nothing for a year, then three doors in a week', hard: 'freedom and more-of-everything egg each other on; pick which revolution gets funded', soft: 'your luck favours the unconventional route; the shortcut exists and you keep finding it' },
  'jupiter-neptune': { fuse: 'your hope is oceanic and occasionally needs a lighthouse; anchor the visions to a date', hard: 'you believe big and check small, or forget to; a sceptical friend is worth gold to you', soft: 'your faith in life is contagious in the best way; cynics make exceptions for you' },
  'jupiter-pluto': { fuse: 'you do not want success so much as transformation with receipts; scale finds you', hard: 'your ambitions resurrect: every time you bury one politely, it returns bigger', soft: 'you rebuild broken things at scale: careers, houses, people; it is a calling' },
  'saturn-uranus': { fuse: 'you break rules methodically: revolution with agendas, minutes and a rota', hard: 'the traditionalist and the rebel share your desk and swap chairs mid-project; schedule them', soft: 'you modernise without demolition; old systems survive you improved, not offended' },
  'saturn-neptune': { fuse: 'you give dreams load-bearing walls; imagination employed, insured and open to the public', hard: 'doubt fogs your finest visions on schedule; build one small real corner of it anyway', soft: 'you make the ideal practical without killing it; churches and studios need your kind' },
  'saturn-pluto': { fuse: 'you endure what flattens others and rebuild in bedrock; your second houses always hold', hard: 'control was your answer to chaos once; strength now includes putting the clipboard down', soft: 'your resilience is quiet infrastructure; whole families and firms rest on it unaware' },
  'uranus-neptune': { fuse: 'your generation rewired dream and disruption together; you personally get ideas from both sockets', hard: 'vision and rebellion argue over your steering wheel on long trips; let the road decide', soft: 'you channel the strange new thing into forms people can actually use' },
  'uranus-pluto': { fuse: 'you carry change at depth: when you finally move, tectonic is the only word', hard: 'upheaval visits you in eras, not events; you have a before and after most people lack', soft: 'you transform quietly and completely while appearing merely busy' },
  'neptune-pluto': { fuse: 'you sense the collective tide turning years out; useless at parties, priceless in decades', hard: 'the depths and the mists trade your attention; keep one lamp lit in the real', soft: 'you compost the culture: what dies in the world becomes soil in your work' }
};

// transit season-tells: what this stretch looks like in an ordinary week
DATA.TELLS.transit = {
  'jupiter-sun': { hard: 'the season\u2019s tell: you say yes to one thing too many and it turns out to be the important one anyway', soft: 'the season\u2019s tell: people keep offering you the bigger version of what you asked for' },
  'jupiter-moon': { hard: 'the tell: your appetite grows for everything at once: food, company, reassurance; feed the real hunger first', soft: 'the tell: home gets fuller this season: more chairs, more soup, more staying late' },
  'jupiter-mercury': { hard: 'the tell: your inbox doubles and so do your opinions; draft big, send small', soft: 'the tell: your ideas find audiences this season without you chasing them' },
  'jupiter-venus': { hard: 'the tell: you fall for the deluxe version of everything; wait three days before buying or kissing', soft: 'the tell: social luck runs warm: invitations, introductions, someone lovely knowing someone lovely' },
  'jupiter-mars': { hard: 'the tell: your foot finds the accelerator in every domain at once; pick two lanes', soft: 'the tell: effort pays at better rates than usual: same push, more distance' },
  'jupiter-jupiter': { hard: 'the tell: your own optimism needs a co-signer this season; enthusiasm is not a budget', soft: 'the tell: a new twelve-year chapter opens quietly; what you plant now compounds' },
  'jupiter-saturn': { hard: 'the tell: growth argues with the rules you built; renovate the rules, keep the walls', soft: 'the tell: your structures get room to grow: promotions, extensions, second floors' },
  'jupiter-uranus': { hard: 'the tell: the wild idea and the big budget arrive the same week; sleep before signing', soft: 'the tell: lucky accidents cluster: wrong trains to right places' },
  'jupiter-neptune': { hard: 'the tell: your faith inflates past the facts; keep one accountant friend on call', soft: 'the tell: meaning arrives in ordinary clothes this season: a book, a stranger, a coastline' },
  'jupiter-pluto': { hard: 'the tell: ambition swells to imperial sizes; audit what the crown actually costs', soft: 'the tell: deep projects find funding and allies; rebuild something big while this lasts' },
  'saturn-sun': { hard: 'the tell: everything takes three drafts and the third one is permanent; this is the good version of slow', soft: 'the tell: authority starts fitting you; people wait for your call and you notice yourself making it' },
  'saturn-moon': { hard: 'the tell: comfort thins for a season; keep the routines that hold and let the mood weather pass', soft: 'the tell: your feelings organise themselves; the inner house gets load-bearing walls' },
  'saturn-mercury': { hard: 'the tell: your words face inspection: contracts, edits, misread texts; write slow, sign slower', soft: 'the tell: your thinking matures visibly; people start keeping your emails' },
  'saturn-venus': { hard: 'the tell: relationships face the weight test; what holds after this holds for decades', soft: 'the tell: love gets practical in the best way: keys, plans, shared calendars' },
  'saturn-mars': { hard: 'the tell: the engine runs against the brake: delays, gyms, gritted teeth; strength is built exactly here', soft: 'the tell: your effort becomes structure: training plans, habits that finally stick' },
  'saturn-jupiter': { hard: 'the tell: budgets meet dreams and both revise; the surviving plan is the real one', soft: 'the tell: growth gets a spine this season; expansion you can actually stand on' },
  'saturn-saturn': { hard: 'the tell: life audits you gently but thoroughly; pay what is owed and keep the receipts', soft: 'the tell: a maturity instalment arrives; things that used to rattle you simply do not' },
  'saturn-uranus': { hard: 'the tell: the old structure and the new impulse grind; schedule the demolition, do not improvise it', soft: 'the tell: you modernise something without breaking it; rare and quietly impressive' },
  'saturn-neptune': { hard: 'the tell: the dream meets the invoice; the vision that survives costing is the calling', soft: 'the tell: the vague thing becomes a plan with dates; fog condenses into water you can drink' },
  'saturn-pluto': { hard: 'the tell: what was already hollow gets leaned on and creaks; rebuild in stone this time', soft: 'the tell: deep foundations set this season; you will build on them for twenty years' },
  'uranus-sun': { hard: 'the tell: you startle yourself: sudden haircuts, resignations drafted at midnight; change WAS due, choose its door', soft: 'the tell: you get braver by increments; the new version of you arrives without a crisis' },
  'uranus-moon': { hard: 'the tell: moods arrive without forwarding addresses; ground through the body, not the feed', soft: 'the tell: emotional habits unhook quietly; you stop flinching at an old bell' },
  'uranus-mercury': { hard: 'the tell: your attention strobes; capture ideas fast, decide slow', soft: 'the tell: insights arrive like weather fronts: sudden, clarifying, free' },
  'uranus-venus': { hard: 'the tell: the settled thing feels tight and the wrong person fascinating; wait out the static before rewiring', soft: 'the tell: affection surprises you from a flank: unlikely people, sudden ease' },
  'uranus-mars': { hard: 'the tell: impatience sparks off metal: traffic, tools, tempers; burn it as exercise early', soft: 'the tell: you act on the brave thing without the usual committee meeting in your head' },
  'uranus-jupiter': { hard: 'the tell: freedom and more argue for your signature; fund one revolution properly', soft: 'the tell: doors open sideways: the odd route pays, the plan B outperforms the A' },
  'uranus-saturn': { hard: 'the tell: your rules meet your restlessness; renovate the cage into a frame', soft: 'the tell: you change a structure calmly that others would have detonated' },
  'uranus-uranus': { hard: 'the tell: the life audit of the age arrives; keep what is yours, release what was borrowed', soft: 'the tell: you surprise yourself pleasantly; the experiment works' },
  'uranus-neptune': { hard: 'the tell: strange dreams, glitching plans; write it down, decide later', soft: 'the tell: intuition and invention cooperate; trust the odd hunch with small money' },
  'uranus-pluto': { hard: 'the tell: change asks for depth, not speed; transform the root, not the paint', soft: 'the tell: a deep pattern releases almost casually; note the date, it matters later' },
  'neptune-sun': { hard: 'the tell: your outline softens: flattery sticks, boundaries slip; verify before you sign or sacrifice', soft: 'the tell: meaning seeps into ordinary days; music sounds better for a year' },
  'neptune-moon': { hard: 'the tell: you absorb every room you enter; salt baths, closed doors, early nights are medicine', soft: 'the tell: your compassion deepens without cost; you forgive something old in your sleep' },
  'neptune-mercury': { hard: 'the tell: details dissolve: double-book, misread, misplace; lists are your lifeboat this season', soft: 'the tell: your words gain water: people say you should write, and they are right' },
  'neptune-venus': { hard: 'the tell: the glow around someone may be projector light: check who is holding the projector', soft: 'the tell: beauty ambushes you: art, faces, weather; the heart\u2019s aperture opens a stop' },
  'neptune-mars': { hard: 'the tell: your drive mists over; smaller goals, written down, restore the engine', soft: 'the tell: you act on ideals smoothly; the cause and the energy finally in one body' },
  'neptune-jupiter': { hard: 'the tell: hope inflates beyond the facts; enjoy the balloon, keep a hand on the string', soft: 'the tell: faith returns without a reason; the reason arrives later, on foot' },
  'neptune-saturn': { hard: 'the tell: the fog rolls over your rulebook; steer by instruments: routines, dates, honest friends', soft: 'the tell: you make peace with imperfect structures; grace enters the schedule' },
  'neptune-uranus': { hard: 'the tell: visions arrive faster than forms; sketch everything, build one', soft: 'the tell: the collective mood moves your way; your odd idea suddenly has a public' },
  'neptune-neptune': { hard: 'the tell: an old dream dissolves to make room; grieve it properly, travel light after', soft: 'the tell: the spiritual tide rises gently; practices you abandoned come back improved' },
  'neptune-pluto': { hard: 'the tell: the depths get misty; move slowly around big feelings and bigger promises', soft: 'the tell: quiet transformation through surrender; what you stop gripping starts growing' },
  'pluto-sun': { hard: 'the tell: life applies pressure exactly where you were pretending; the diamond process has begun', soft: 'the tell: your presence gains weight without volume; rooms reorganise around you quietly' },
  'pluto-moon': { hard: 'the tell: feelings surface with subtitles from childhood; this excavation pays for the whole renovation', soft: 'the tell: emotional deadwood clears itself; you feel lighter without dieting the heart' },
  'pluto-mercury': { hard: 'the tell: your mind grips subjects and will not release; aim the obsession at something that pays', soft: 'the tell: your words gain depth-charge; you say the true thing and rooms change course' },
  'pluto-venus': { hard: 'the tell: love runs at archaeological depth: intense, revealing, occasionally with skeletons', soft: 'the tell: a relationship deepens past a level you did not know it had' },
  'pluto-mars': { hard: 'the tell: your will meets an immovable object and discovers it is one too; pick worthy battles only', soft: 'the tell: your stamina doubles below deck; you finish things that used to finish you' },
  'pluto-jupiter': { hard: 'the tell: the empire urge visits; measure the throne against the actual chair you need', soft: 'the tell: power arrives in usable sizes; you rebuild something and it stays rebuilt' },
  'pluto-saturn': { hard: 'the tell: the foundations get pressure-tested; what stands after this stands forever', soft: 'the tell: your discipline goes bedrock; commitments made now have geological patience' },
  'pluto-uranus': { hard: 'the tell: the deep change and the sudden change compare notes; you are the notes', soft: 'the tell: liberation happens at the root; an old cage simply is not there one morning' },
  'pluto-neptune': { hard: 'the tell: the dream and the depth negotiate; keep a journal, this era writes in it', soft: 'the tell: quiet spiritual composting; next decade\u2019s soil is being made now' },
  'pluto-pluto': { hard: 'the tell: the generational reckoning stops at your address too; travel through, not around', soft: 'the tell: power settles in you at a depth that no longer needs an audience' }
};
// nodes, phases, dignities, retrogrades, degrees, gathering-places, element blends, callings
DATA.TELLS.node = {
  house: { 1: 'your growth points at standing alone and visible; the group project of you needs a lead', 2: 'your growth points at your own money, your own values, your own two feet', 3: 'your growth points at the near and the spoken: the sibling, the neighbourhood, the small true sentence', 4: 'your growth points home: the making of one, not the missing of one', 5: 'your growth points at making things and being seen making them; hiding is the old habit', 6: 'your growth points at the daily: the body, the craft, the useful hour', 7: 'your growth points at real partnership; solo was the comfort zone, duet is the curriculum', 8: 'your growth points into the deep end: shared resources, real intimacy, honest power', 9: 'your growth points over the horizon: the far place, the long study, the bigger frame', 10: 'your growth points up and public: the work with your name on it', 11: 'your growth points at the many: the group, the cause, the future built with others', 12: 'your growth points inward: retreat, spirit, the unseen work that finishes you' },
  sign: { Aries: 'the lesson is wanting things first-person; your compromise reflex is the past, not the path', Taurus: 'the lesson is enough: building slow, keeping yours, trusting the ground', Gemini: 'the lesson is curiosity over certainty: ask, learn, stay for the answer', Cancer: 'the lesson is tending: home, feelings, the ones in your care, including you', Leo: 'the lesson is taking the stage you keep offering others', Virgo: 'the lesson is the craft of the ordinary: details, service, the honest checklist', Libra: 'the lesson is the other person: balance, listening, the shared decision', Scorpio: 'the lesson is depth: merging, trusting, letting the transformation take', Sagittarius: 'the lesson is the leap: belief, distance, the story bigger than the facts', Capricorn: 'the lesson is the mountain: responsibility carried until it becomes authority', Aquarius: 'the lesson is the many: your gift belongs to a future wider than your circle', Pisces: 'the lesson is release: faith over control, the open hand over the ledger' }
};
DATA.TELLS.phase = {
  0: 'born under a New Moon: you begin things by instinct and explain them later, if ever',
  1: 'born under a Crescent: you build against resistance by nature; easy never convinced you',
  2: 'born under a First Quarter: you manage crises well because a mild one is always running',
  3: 'born Gibbous: you refine; almost-finished is your natural habitat and your gift',
  4: 'born under a Full Moon: you live in relationship, mirrored; objectivity is your superpower and your homesick feeling',
  5: 'born Disseminating: you must share what you learn or it spoils; teaching is digestion',
  6: 'born at Last Quarter: you question systems on contact; reform is a reflex',
  7: 'born Balsamic: you are an ending-tender; old souls and last chapters find you'
};
DATA.TELLS.dignity = {
  sun: { dom: 'your Sun rules its own sky: your confidence needs no imported fuel', exa: 'your Sun runs exalted: your vitality leads and doors notice', det: 'your Sun works away from home: your shine is negotiated, and richer for it', fal: 'your Sun runs in fall: your light needed building, and built light lasts' },
  moon: { dom: 'your Moon is at home: your feelings feed you, a working kitchen inside', exa: 'your Moon is exalted: steadiness is your emotional factory setting', det: 'your Moon far from home: comfort took study; you know exactly what soothes because you had to learn', fal: 'your Moon in fall: feelings arrive at depth and get processed like ore: slowly, valuably' },
  mercury: { dom: 'your Mercury on home ground: language obeys you', exa: 'your Mercury exalted: precision is native; you measure twice by instinct', det: 'your Mercury abroad: your mind takes scenic routes and finds what highways miss', fal: 'your Mercury in fall: you think in tides, not lines; the insight is worth the wait' },
  venus: { dom: 'your Venus at home: affection and taste run without effort', exa: 'your Venus exalted: your care has depth-perception; you love what lasts', det: 'your Venus works abroad: you love against the grain, and originally', fal: 'your Venus in fall: love is edited where you keep it; what survives your standards is real' },
  mars: { dom: 'your Mars at home: your drive is clean fuel, no additives needed', exa: 'your Mars exalted: your discipline could run academies', det: 'your Mars abroad: your force works diplomatically, which confuses your rivals nicely', fal: 'your Mars in fall: you fight sideways and win late; nobody sees you coming, ever' },
  jupiter: { dom: 'your Jupiter at home: growth is your grammar', exa: 'your Jupiter exalted: your generosity nourishes; luck through care', det: 'your Jupiter abroad: your luck hides in details others skip', fal: 'your Jupiter in fall: your faith was earned in strict rooms, and it holds weight' },
  saturn: { dom: 'your Saturn at home: structure comes naturally; you are your own institution', exa: 'your Saturn exalted: your judgment balances; people bring you disputes', det: 'your Saturn abroad: rules chafe you into inventing better ones', fal: 'your Saturn in fall: authority sat wrong until you rebuilt it warm; now yours is the kind people trust' }
};
DATA.TELLS.retro = {
  mercury: 'Mercury retrograde at birth: your thinking runs inward first; you re-read, re-draft, and your second thoughts are your best',
  venus: 'Venus retrograde at birth: you love on a private frequency; your affections mature like cellared wine',
  mars: 'Mars retrograde at birth: your drive aims inward; you conquer yourself before anything else, and it shows',
  jupiter: 'Jupiter retrograde at birth: your faith is homemade; no church issued it and none can revoke it',
  saturn: 'Saturn retrograde at birth: the rules outside never convinced you; you built your own and keep them harder',
  uranus: 'Uranus retrograde at birth: your rebellion is interior; you look conventional and think like a heretic',
  neptune: 'Neptune retrograde at birth: your mysticism is private practice; you doubt loudly and believe quietly',
  pluto: 'Pluto retrograde at birth: your transformations happen underground; even close friends only meet the after'
};
DATA.TELLS.degree = {
  ana: { sun: 'your Sun at the final degree: identity as last exam; you carry a mastery you did not enrol for', moon: 'your Moon at the final degree: feelings arrive urgent, as if time were short; they are wiser than they are calm', mercury: 'your Mercury at the final degree: your mind summarises whole subjects; people get your conclusions and miss the working', venus: 'your Venus at the final degree: you love like a closing chapter: fully, and with an eye on the whole story', mars: 'your Mars at the final degree: your actions carry deadline energy always; brilliant in crises, restless in peace', jupiter: 'your Jupiter at the final degree: your growth completes cycles others abandon', saturn: 'your Saturn at the final degree: an old mastery of limits; you were born already tired of excuses, including yours', uranus: 'your Uranus at the final degree: your generation\u2019s change concludes in you; you close doors that needed closing', neptune: 'your Neptune at the final degree: the dream is ending and you can feel the house lights; you translate for both sides', pluto: 'your Pluto at the final degree: deep endings are your inheritance; you compost eras' },
  zero: { sun: 'your Sun at zero degrees: raw first-day energy; you meet your sign like wet paint, all potential, no manual', moon: 'your Moon at zero degrees: your feelings are newborn each time: undiluted, unprecedented, honest', mercury: 'your Mercury at zero degrees: beginner\u2019s mind, permanently; your questions embarrass experts usefully', venus: 'your Venus at zero degrees: you love like the first person to ever try it; conventions arrive later, if at all', mars: 'your Mars at zero degrees: your drive fires on fresh ignition: no scar tissue on the courage', jupiter: 'your Jupiter at zero degrees: your optimism is unqualified: the good kind of naive, repeatedly proven right', saturn: 'your Saturn at zero degrees: you build from first principles; inherited blueprints never fit you', uranus: 'your Uranus at zero degrees: you are an early edition of your generation\u2019s change', neptune: 'your Neptune at zero degrees: the new dream starts near you; artists downstream will drink this water', pluto: 'your Pluto at zero degrees: a new depth begins in your cohort, and you are close to the source' }
};
DATA.TELLS.stellium = { 1: 'a crowd gathers in your 1st house: you arrive in rooms like a delegation', 2: 'a crowd in your 2nd: your relationship with security is a full-time cabinet meeting', 3: 'a crowd in your 3rd: your mind is a busy junction; the local IS your universe', 4: 'a crowd in your 4th: home is your parliament; every mood of the house sits in you', 5: 'a crowd in your 5th: you were built for making things; unexpressed weeks turn toxic', 6: 'a crowd in your 6th: the daily grind is your orchestra; routines play you like scores', 7: 'a crowd in your 7th: your life happens in twos; every mirror is a person', 8: 'a crowd in your 8th: intensity is your address; you live where others visit', 9: 'a crowd in your 9th: you are mid-pilgrimage at all times, even at your desk', 10: 'a crowd in your 10th: your calling recruited extra staff; ambition is a house guest that pays rent', 11: 'a crowd in your 11th: your people are your project; the future is a group assignment you accepted', 12: 'a crowd in your 12th: your inner life outnumbers your outer; solitude is a crowded, productive room' };
DATA.TELLS.blend = {
  'fire-fire': 'wanting and feeling both burn in you: quick to light, quick to warm a room, quick to scorch a schedule',
  'fire-earth': 'you want like fire and need like earth: launch, then land; your best life has both a spark and a shed',
  'fire-air': 'wanting fans feeling in you: ideas catch instantly; your enthusiasm is legible from space',
  'fire-water': 'you run steam-powered: passion heats feeling until it moves; storms pass through you fast and leave gardens',
  'earth-fire': 'you build like earth and feel like fire: the calm exterior houses a furnace; people are always surprised',
  'earth-earth': 'you want and need the same solid things: rare congruence; your life compounds quietly',
  'earth-air': 'you build what you think: hands and theory on one workbench; the practical intellectual',
  'earth-water': 'you are garden soil: feeling waters what wanting plants; things grow around you almost unfairly',
  'air-fire': 'thought sparks appetite in you: you talk yourself into adventures, accurately',
  'air-earth': 'you think in blueprints: the idea is not finished for you until something stands',
  'air-air': 'you live at conversational altitude: feelings arrive as ideas; grounding is a discipline, not a default',
  'air-water': 'you think in weather: logic and feeling co-author everything; your letters read like tides',
  'water-fire': 'you feel first and ignite second: slow fuse, real flame; your loyalty burns hotter than most passion',
  'water-earth': 'you feel like water and need like earth: emotion with a savings account; deep AND sensible',
  'water-air': 'you feel in currents and speak in maps: the translator between hearts and heads at every table',
  'water-water': 'you are entirely sea: enormous feeling, tidal memory; boundaries are your one imported good'
};
DATA.TELLS.mc = { Aries: 'your public work wants a frontier: first, fastest, founding', Taurus: 'your public work wants to build things that outlast the applause', Gemini: 'your public work is connective: words, bridges, the space between people', Cancer: 'your public work shelters someone: rooms, tables, teams that feel like kitchens', Leo: 'your public work needs a stage and deserves one; visibility is the job', Virgo: 'your public work is precision: the craft no one notices until it is missing', Libra: 'your public work balances things: deals, designs, disputes, rooms', Scorpio: 'your public work goes where others will not: depths, crises, transformations', Sagittarius: 'your public work teaches or travels, ideally both; horizon is a job requirement', Capricorn: 'your public work climbs: slow, structural, summit-bound', Aquarius: 'your public work serves the future: systems, communities, the not-yet', Pisces: 'your public work heals or dreams for people who cannot; art and care are your industries' };

// ===== The archetypes: the figures under the signs, from the working literature =====
// Named after the lineages astrologers actually cite: Liz Greene (The Astrology of Fate),
// Dane Rudhyar (The Pulse of Life), Howard Sasportas, and the myths the signs are named for.
// Each figure carries three modern rooms: the boardroom (work), the open field (play),
// and the candlelit table (rite) - so one chart speaks to a CEO, a wanderer and a witch.
DATA.ARCH = {
  sign: {
    Aries: { n: 'The Warrior', core: 'the one who goes first: instinct before strategy, courage as a reflex rather than a decision', work: 'best given the frontier: new markets, first calls, turnarounds; wasted on maintenance and slowly poisoned by committees', play: 'peace, for you, is earned through the body: sweat, open sky, a summit or a finish line; you cannot sit your way into calm', rite: 'light one candle and name, out loud, the one fight actually worth having this season; snuff it yourself, on purpose' },
    Taurus: { n: 'The Builder', core: 'the one who makes it real: slow hands, long patience, and a body that knows before the mind agrees', work: 'the compounding asset: give this person anything worth tending, land, brand, craft, capital, then get out of the way', play: 'pleasure practised honestly is your religion: food grown or cooked slowly, music felt in the chest, one perfect unhurried afternoon', rite: 'keep an altar of things with weight: stone, seed, salt, wood; touch it once a day and hurry absolutely nothing' },
    Gemini: { n: 'The Messenger', core: 'the one who carries word between worlds: curiosity as a metabolism, two of everything running inside', work: 'the connector and the translator: sales, story, the bridge between silos; the value is made in between, and so is the money', play: 'you refuel on novelty and conversation; one more question, one more street, one more stranger is your actual version of rest', rite: 'at each new moon write three true sentences and release one of them into the world; words are your spellwork' },
    Cancer: { n: 'The Keeper', core: 'the one who holds: memory, tide, table and threshold; belonging is both your work and your weapon', work: 'you build harbours: teams, brands and rooms people stay loyal to for decades; culture is your balance sheet', play: 'you restore by feeding people and being near water; let nostalgia be a room you visit, not the house you live in', rite: 'moon water on the sill, one photograph honoured with a minute of attention, one boundary drawn plainly at the doorstep' },
    Leo: { n: 'The Sovereign', core: 'the one who shines so others dare to: generous heat, an unashamed heart, and a court to raise up around you', work: 'front of house and standard-setter: people perform above themselves in your light; hire the bookkeeping, never outsource the warmth', play: 'your play needs an audience of at least one; making things is not your hobby, it is your pulse, and applause is honest fuel', rite: 'sun on your face at first light once a week, and one act of real generosity done in secret, to keep the crown honest' },
    Virgo: { n: 'The Craftsman', core: 'the one who perfects: discernment as devotion, service as the highest use of a fine mind', work: 'quality is the franchise: systems, standards, the flaw found before it gets expensive; the audit nobody else has the stomach for', play: 'order restores you where excitement drains you: a cleaned bench, a mended seam, a weeded bed; small rightness is real medicine', rite: 'ten minutes a day tending one living thing, done exactly and offered to no one; the tending is the prayer' },
    Libra: { n: 'The Judge', core: 'the one who weighs: beauty and fairness as a single instinct, peace made by design rather than by avoidance', work: 'the dealmaker and the taste-setter: negotiation, partnership, anything where balance itself is the product being sold', play: 'harmony is your oxygen: good rooms, good light, conversation that lands like music; ugliness genuinely tires you', rite: 'once a moon, hold the scales: name one imbalance in your life out loud, then correct it somewhere real within three days' },
    Scorpio: { n: 'The Alchemist', core: 'the one who transforms: nothing taken at face value, power read fluently, endings survived and put to use', work: 'crisis is the specialty: turnarounds, research, other people\u2019s money, the conversation everyone else is avoiding', play: 'depth is your leisure: one friend for six hours over six friends for one; intensity is not a mood, it is your resting state', rite: 'write down what has to die this season and burn the paper; keep a pinch of the ash somewhere you will see it' },
    Sagittarius: { n: 'The Seeker', core: 'the one who aims past the fence: meaning as fuel, the long shot taken on principle, the border crossed to see what the map missed', work: 'vision and evangelism: the big thesis, the foreign market, teaching at scale; hire an editor and a brake, keep the aim', play: 'the horizon is your therapist: travel, wilderness, the laugh that scatters pigeons; small rooms make you smaller', rite: 'once a season go somewhere you have never been, even one street over, and ask it a question you cannot answer yet' },
    Capricorn: { n: 'The Architect', core: 'the one who builds to outlast: time treated as a material, mastery as a debt honourably repaid', work: 'the institution-builder: strategy, structure, succession; the adult in the room that the money quietly trusts', play: 'your rest is ascent at a kinder gradient: mountains, craft, old cities, long histories; even your idleness wants a summit', rite: 'tend the ancestors: one name remembered aloud, one duty done in their style, one stone kept on the desk' },
    Aquarius: { n: 'The Awakener', core: 'the one who sees the future early: pattern over persons, every rule questioned politely on arrival', work: 'systems and second-order effects: innovation, networks, reform; most valuable when paid to think sideways on purpose', play: 'your tribe is chosen, odd and loyal; you rest inside ideas the way other people rest in hammocks', rite: 'keep one heresy alive: write down the opinion nobody around you holds yet, date it, and reread it every solstice' },
    Pisces: { n: 'The Mystic', core: 'the one who dissolves the wall: compassion without a customs check, imagination working as a sense organ', work: 'the imagination is the asset: brand, story, design, mercy built into the machine; guard the edges with process, not with guilt', play: 'water, music and unscheduled hours; you refuel by leaking out of clock-time entirely, and that is maintenance, not laziness', rite: 'sit by water once a week and let the mind\u2019s silt settle; carry a little of it home in a jar for the windowsill' }
  },
  planet: {
    sun: { n: 'The Sovereign', line: 'the chart is run from the throne room: identity first, and everything else in service of becoming someone in particular' },
    moon: { n: 'The Keeper of Tides', line: 'the chart is run from the kitchen at midnight: need decides first, and mood is a kind of law' },
    mercury: { n: 'The Messenger', line: 'the chart is run from the crossroads: word, wit and route-finding come before everything else' },
    venus: { n: 'The Lover', line: 'the chart is run from the garden: taste, bond and beauty make the decision before logic arrives to explain it' },
    mars: { n: 'The Warrior', line: 'the chart is run from the field: motion first, appetite honest, courage cheap to summon and expensive to aim' },
    jupiter: { n: 'The Teacher', line: 'the chart is run from a library with the doors propped open: growth, meaning and more of everything worth having' },
    saturn: { n: 'The Timekeeper', line: 'the chart is run from the clocktower: structure first, promises kept, every due paid on schedule and remembered' },
    uranus: { n: 'The Lightning-Bearer', line: 'the chart is run from the observatory roof: the future arrives at this address first and knocks loudly' },
    neptune: { n: 'The Dreamer', line: 'the chart is run from the tide line: the invisible is load-bearing here, and always has been' },
    pluto: { n: 'The Underworld Guide', line: 'the chart is run from the vault: depth, power and rebirth working on a geological clock' }
  }
};

// ===== Oddly specific: the small, concrete, spooky life-details the chart implies.
// Not traits. Habits, tastes, tells. The "how did it know" layer. Sign-indexed
// (Aries..Pisces) per body, written to be startlingly specific rather than safe.
DATA.QUIRK = {
  venus: [
    'you eat fast, you like it hot and a bit too spicy, and you have genuinely walked out over slow service',
    'you would rather have one excellent meal than three cheap ones, and there is a "good" snack in your house you do not share',
    'you get menu envy, you order the thing you have never tried, and you text someone about what to get',
    'you have a comfort meal tied to a specific person, and food someone made for you beats the same dish anywhere',
    'you pick the place with the good lighting, you photograph the plate, and you over-tip when you feel seen',
    'you notice the sticky table, you have opinions about how things are plated, and you fix other people\u2019s arrangements in your head',
    'you cannot choose the restaurant, you will happily eat whatever your date is having, and presentation genuinely changes the taste for you',
    'you like it intense: dark chocolate, strong coffee, and you remember exactly what you ate on the important nights',
    'you will try the strange street food abroad, you like a big shared table, and you have one cuisine you discovered travelling and now evangelise',
    'you have a "usual", you rate places by whether they were worth it, and you quietly judge overpriced small plates',
    'you have an oddly specific food rule, you love the place nobody has heard of, and you will eat cereal for dinner with zero shame',
    'you eat by mood, you are the one who says "let\u2019s just get pizza", and comfort food does more for you than it probably should'
  ],
  moon: [
    'you slam a cupboard when you are upset and feel almost fine again after moving your body',
    'you have a specific spot on the sofa, a blanket you are territorial about, and a snack that fixes most bad moods',
    'you cannot settle until you have talked or texted it out, and you fall asleep better with background noise',
    'you have a mug that is yours, you keep things for who gave them to you, and you cook or clean when you are stressed',
    'your home has at least one deliberately dramatic thing in it, and a dull, grey room genuinely lowers your mood',
    'you tidy when you are anxious, you cannot fully relax in a messy room, and you have a system nobody else understands',
    'you need the room to feel balanced before you can rest, you hate eating alone, and an unresolved argument keeps you up',
    'you have a private space or ritual nobody gets access to, and you need real solitude, not company, to actually recharge',
    'you get twitchy staying in too long, and you feel most at home somewhere you could leave at any moment',
    'you calm yourself by getting one thing done, and you find it genuinely hard to rest while a list is unfinished',
    'you need a good chunk of alone time, your setup is a little unconventional, and you retreat into your head when overwhelmed',
    'you reset with water, music or a nap, you cry more easily than you admit, and you soak up the mood of whatever room you are in'
  ],
  mars: [
    'you walk fast, you hate waiting for the kettle, and you finish other people\u2019s sentences',
    'you are slow to start but nearly impossible to stop once you go, and being rushed makes you dig in harder',
    'you do three things at once, you lose interest the moment it gets boring, and you argue for fun',
    'you go quiet and clipped rather than loud when you are angry, and you defend your people faster than yourself',
    'you need it to be a bit of a performance, you hate being ignored, and your energy fills whatever room you walk into',
    'you channel stress into a task, you are precise under pressure, and half your anger is really just frustration at a mess',
    'you avoid the direct fight, you win by being reasonable, and passive tension bothers you more than an open row',
    'you do not forget, you play a long game, and your calm surface has a very deep engine under it',
    'you say the blunt thing then apologise for the delivery not the content, and you cannot sit still on a good idea',
    'you pace yourself, you outlast people who sprinted, and you get quietly competitive about things that "do not matter"',
    'you act on the new idea while others are still forwarding the article, and you rebel most against being told to hurry',
    'your drive runs on mood and meaning, a written goal doubles your output, and you procrastinate then finish in one intense burst'
  ],
  mercury: [
    'you think out loud, you talk fast, and your second sentence is usually the true one',
    'you take a beat before you answer, you hate being hurried mid-thought, and once you learn a thing it is yours for good',
    'you have a lot of tabs open right now, literally, and you interrupt because your brain finished early',
    'you remember conversations by how they felt, you take things personally that were not meant that way, and you talk to family in a private shorthand',
    'you tell it as a story with yourself as narrator, you are generous with detail, and you cannot resist a good tangent',
    'you reread your texts before sending, you notice everyone\u2019s typos, and you keep lists you mostly do not look at',
    'you soften the hard sentence, you weigh how it will land before you say it, and you can argue either side too well',
    'you say little then say the one thing that reframes it, you read subtext everyone missed, and you research things obsessively before deciding',
    'you overshoot the point then circle back, you love the big idea, and you have been told you sound more certain than you are',
    'you say the dry, final line, you think before you speak, and you quote things you read years ago',
    'your mind jumps steps and lands right, you struggle to show the working, and you have strong opinions about how things "should" be organised',
    'you think in pictures and feelings, you say things sideways and land truer, and you write things down so they stop drifting'
  ],
  rising: [
    'people read you as more confident and more up-for-it than you feel, and strangers ask you to go first',
    'you come across calm and hard to rush, people find you steadying, and they comment on your voice or your taste',
    'you seem younger and quicker than your age, people talk to you easily, and they never quite know which version they will get',
    'you give off a soft, approachable, look-after-you energy, and strangers tell you their problems unprompted',
    'you walk into a room and it registers, people assume you are the confident one, and you dress with at least one bold choice',
    'you read as neat, capable and a little reserved, people bring you their problems to fix, and they underestimate how funny you are',
    'people find you easy on the eye and easy to be around, you are the diplomatic one, and you are better at first impressions than you think',
    'you come across as intense and slightly unreadable, people feel you clock them, and they either trust you fast or not at all',
    'you seem open, lucky and game for the adventure, people relax around your optimism, and you look like you are about to travel',
    'you read as older, competent and quietly in charge even when young, and people give you responsibility you did not ask for',
    'you come across as a bit different on purpose, people find you interesting before they find you warm, and you are the friend with the unusual take',
    'you seem gentle, dreamy and hard to pin down, people project onto you, and strangers, stray cats and sad friends all find you without a map'
  ]
};

// Combinatorial shading for the oddly-specific lines: each planet's quirk is coloured by
// its tightest aspect (to a social/outer planet) or its retrograde, so the same sign reads
// differently on different charts. sign(12) x modifier(7) x five bodies => the output is
// effectively unique per chart.
DATA.QUIRK_MOD = {
  venus: { saturn: 'though you are quietly frugal about it and hate feeling overcharged', jupiter: 'and you always over-order, then happily finish it', mars: 'and you eat faster than everyone else at the table', uranus: 'and your taste swerves somewhere nobody quite expects', neptune: 'and what you fancy changes completely with your mood', pluto: 'and when a flavour gets you, you go all the way in on it', retro: 'and you keep circling back to the same handful of orders' },
  moon: { saturn: 'and you soothe yourself by getting something done more than by being comforted', jupiter: 'and you comfort yourself in slightly-too-large portions', mars: 'and you have to move or do something with your hands before you can settle', uranus: 'and your moods change channels faster than anyone can follow', neptune: 'and you soak up the room so completely you lose track of what is yours', pluto: 'and you feel things at a depth you rarely let anyone actually see', retro: 'and old feelings resurface long after you thought they were filed away' },
  mars: { saturn: 'though there is a governor on it: you burn slow and you finish', jupiter: 'and once you commit you go big, sometimes bigger than the plan', uranus: 'and it fires without warning, even to you', neptune: 'and it runs on mood and meaning rather than on orders', pluto: 'and underneath the surface there is a second, far deeper tank', retro: 'and you would rather redo a thing properly than push a new one out' },
  mercury: { saturn: 'and you doubt it, edit it, then turn out to have been right', jupiter: 'and you genuinely cannot tell a short version of anything', mars: 'and your words carry an edge you did not always mean to send', uranus: 'and your best thoughts arrive sideways and a beat too early', neptune: 'and you think in images, so the literal version comes out second', pluto: 'and you cannot un-see the subtext once you have caught it', retro: 'and you rehearse conversations, both before and long after' },
  rising: { saturn: 'though people also clock a seriousness it takes them a while to get past', jupiter: 'and you seem luckier and more expansive than you feel inside', mars: 'and there is a directness people feel off you before you speak', uranus: 'and something about you reads as slightly unplaceable', neptune: 'and you are strangely easy for people to project onto', pluto: 'and people sense there is a great deal you are not showing' }
};

// ===== 130+ oddly-specific placement reads: the "a rising Gemini often means..." library.
// Position-indexed so any chart pulls its own specific set. Signs 0..11, houses 1..12.
DATA.SPOOKY = {
  rising: [
    'your life keeps handing you situations where you have to go first, act alone, or start over, whether you asked to or not',
    'you build slowly and hate losing what you have built; big change arrives only after you have resisted it for a long time',
    'you live several lives at once and get bored fast; your story has more chapters and more restarts than most people you know',
    'you carry home with you, you protect fiercely, and your family story is a bigger character in your life than you let on',
    'you were meant to be seen; life keeps putting you in front of people, and you shrink in any role that asks you to be invisible',
    'you are here to be useful and to get it right; you spot the flaw first, and you are hardest on yourself by a distance',
    'you become yourself through other people; you meet who you are in the mirror of relationships, and being alone teaches you the most',
    'you go through real deaths and rebirths; nothing in your life stays surface-level for long, and people feel the depth before you speak',
    'you need room and meaning; your life bends toward travel, teaching or belief, and a cage of any kind slowly kills you',
    'you matured early and carried weight young; your life is a long climb that pays off later than everyone else\u2019s and lasts longer',
    'you never quite fit the mould and you stopped trying; your life takes an unconventional shape and your people are chosen, not given',
    'the boundary between you and the world is thin; you absorb everything, drift between roles, and find yourself through art, spirit or service'
  ],
  moonSign: [
    'you feel fast and hot, you get over things quicker than people expect, and you need a physical outlet or the heat turns inward',
    'you need security you can touch; you settle through the body and the familiar, and you do not release people or grudges easily',
    'you process by talking, you need mental stimulation to feel okay, and your feelings shift the moment you put them into words',
    'your moods run deep and tidal, you remember every emotional detail, and you feel safest when you are the one doing the caring',
    'you need to feel special to someone; your feelings are generous and a little dramatic, and you sulk visibly when you feel unseen',
    'you handle feelings by fixing and tidying, you worry as a form of love, and you rarely feel you have done quite enough',
    'your peace depends on the room being harmonious; you struggle to sit with conflict, and you know yourself best through a partner',
    'you feel everything at maximum, you do not do casual, and you quietly test people before you trust them with the real you',
    'you need freedom to feel safe, you cheer yourself up by planning an escape, and you go cold the second someone fences you in',
    'you learned young to need less and cope alone; you self-soothe by achieving, and letting yourself be looked after is the hard lesson',
    'you need space to feel close, you watch your own feelings from a step back, and you care most about the group, the cause, the friends',
    'you feel the whole room, you cannot always tell your feelings from other people\u2019s, and you need solitude and water to find yourself again'
  ],
  moonHouse: [
    'you wear your feelings on the surface; people read your mood instantly, and your sense of self rises and falls with how you feel',
    'you feel safe when money and home comforts are steady; you soothe yourself materially, and you hold on to what is yours',
    'you settle by talking it out; siblings and daily conversations shape your inner weather more than you realise',
    'home and family are the emotional centre of your whole life; you are deeply private, and where you live matters enormously to you',
    'you feel most yourself creating, performing or in love; you need play and attention, and children loom large in your emotional life',
    'you process feelings through routine, work and the body; a tidy day steadies you, and your health tracks your mood closely',
    'you find emotional home in one-to-one bonds; you need a significant other to feel settled, and single stretches are where you grow',
    'you bond intensely or not at all; you are drawn to depth, crisis and other people\u2019s secrets, and trust is slow and tested',
    'you feel free and safe on the move; travel, study or belief is your comfort, and staying still too long makes you low',
    'your emotional life is tangled with your public role; you need to feel you are getting somewhere, and a parent looms large',
    'your friends are your family; you feel safest inside a group or a cause, and your hopes for the future are a real anchor',
    'you need solitude to reset, you feel things you cannot name, and you carry an emotional inheritance older than this life'
  ],
  venusSign: [
    'you fall fast and hard, you chase what you want, and you cool the moment it becomes too easy or too available',
    'you love slowly, loyally and physically; you show love through comfort and touch, and you are almost impossible to win back once done',
    'you need to be talked to and made to laugh; wit turns you on more than looks, and you flirt even when you do not mean to',
    'you love by caring and being cared for; you are tender and a little guarded, and food, home and safety are how you say I love you',
    'you love with your whole chest and need to be adored back; you are generous, loyal and a bit high-maintenance about attention',
    'you show love through small useful acts, you notice everything, and you struggle to believe you are lovable exactly as you are',
    'you are in love with love, you need partnership to feel whole, and beauty, fairness and being wanted matter enormously to you',
    'you love all the way in or not at all; you need depth and loyalty, and jealousy is a language you have to keep an eye on',
    'you need a lover who is also a co-adventurer; freedom is non-negotiable, and you fall for people who make your world bigger',
    'you take love seriously and slowly; you show it through reliability, and you are far warmer underneath than your surface lets on',
    'you need friendship first and space always; you love the unusual, resist the script, and prize independence inside closeness',
    'you love with no edges and you idealise; you are drawn to rescue or be rescued, and the work is loving the real person, not the dream'
  ],
  venusHouse: [
    'you have natural charm and people are drawn to your look; you soften a room simply by walking into it',
    'you value comfort, quality and beautiful things you can keep; you attract money through charm, and your taste and your worth are linked',
    'you charm through words, you love learning and local beauty, and a sibling or neighbour plays a sweet role in your life',
    'you make your home beautiful and love from within it; your heart lives at home, and you need a nest to feel at ease',
    'romance, creativity and play are central to you; you love being in love, you make beautiful things, and you flirt with life itself',
    'you show love through service and craft, you find beauty in the well-made, and you can genuinely meet a partner through work',
    'partnership is where your heart truly lives; you are made for one-to-one, and you attract partners who mirror your own charm back',
    'you love deeply and privately, you are drawn to intensity, and money often reaches you through others or through partnership',
    'you fall for the foreign, the wise or the far-away; travel turns you on, and your great loves often come from elsewhere',
    'your charm is part of your public role; you attract opportunity through likeability, and love and career keep getting tangled',
    'love often begins as friendship for you; you are drawn to your community, and your hopes for the future include the right person',
    'you love secretly and tenderly, sometimes at a cost; you are drawn to the hidden or unavailable, and compassion is your deepest love'
  ],
  marsSign: [
    'you act on impulse and ask questions later; you are brave and impatient, and you would rather do the wrong thing than nothing',
    'you are slow to anger and impossible to move once set; you work with steady, stubborn force and you finish what you start',
    'your energy is mental and scattered; you fight with words, start ten things, and lose interest unless it stays interesting',
    'you act to protect and go sideways rather than head-on; your anger shows up as moods, withdrawal, or fierce defence of your people',
    'you act with pride and flair and need your effort seen; your anger is loud, brief and dramatic rather than cold',
    'you drive through precision and hard work; you criticise when you are angry, and you wear yourself out chasing the right detail',
    'you struggle to act alone and avoid open conflict; your anger leaks out as tension until it finally, reasonably, erupts',
    'you act with controlled, relentless force; you do not forget, you strike when ready, and your will is the strongest thing about you',
    'you act on belief and enthusiasm and fight for the cause; you are blunt to the point of tactless when your principles are touched',
    'you act with discipline and patience and channel anger into achievement; you are the one still standing when everyone else burned out',
    'you act on principle and rebellion, your anger goes cold and detached, and you fight for the idea more than for yourself',
    'your drive runs on feeling and inspiration; you dodge direct confrontation, and anger turns into escape, art or quiet resentment'
  ],
  marsHouse: [
    'you come at life head-first; you are physically direct, quick to act, and people feel your energy the second you arrive',
    'you put real drive into earning and fight for security; you are competitive about money and you defend what is yours',
    'you have a sharp, quick, combative mind; you argue for sport, you drive fast, and your words can cut before you mean them to',
    'your drive is rooted at home; there is heat in the family story, and you put fierce energy into your base and its people',
    'you go after romance, creativity and pleasure hard; you are competitive at play and you pour real force into what you make',
    'you are a workhorse; you put relentless energy into the daily grind and your health, and inefficiency makes you irritable',
    'your energy comes alive with a partner or an opponent; you attract fiery relationships and you fight and make up with equal heat',
    'you have deep, driving intensity around sex, power and shared money; you go all in, and crisis brings out your real strength',
    'you chase meaning, travel and truth with a crusader\u2019s energy; you fight for what you believe and you need a cause to aim at',
    'you are visibly ambitious; you go hard for status and career, and you clash with any authority you do not respect',
    'you put your fight into groups, causes and the future; you mobilise the friends, and you battle for what should be',
    'your drive is hidden and indirect, sometimes turned against yourself; you fight best behind the scenes and for others'
  ],
  mercurySign: [
    'you think fast and speak first; you are blunt and decisive, and you would rather be wrong quickly than right slowly',
    'you think slowly and thoroughly; once decided you will not be moved, and you say less but you mean all of it',
    'your mind never stops; you are curious, quick and a little scattered, and you know a little about almost everything',
    'you think with your feelings; you remember by emotion, take words to heart, and your intuition is smarter than your logic',
    'you think in headlines and speak with warmth; you are persuasive, proud of your ideas, and you hate being corrected',
    'you have a precise, error-catching mind; you notice every mistake, you overthink, and you are usually right about the small stuff',
    'you think in comparisons and weigh every side; you are diplomatic, a little indecisive, and you can argue any position well',
    'your mind digs beneath the surface; you are perceptive and a touch suspicious, and you research obsessively before committing',
    'you think big-picture and say it bluntly; you love ideas and philosophy, and details bore you into skipping them',
    'you think structurally and strategically; you are serious and realistic, and you do not speak until you can back it up',
    'you think in systems and sudden leaps; you are original and contrarian, and you reach the answer by a route no one else took',
    'you think in images and impressions; you are imaginative and hazy on facts, and you say the true thing sideways'
  ],
  sunHouse: [
    'you are here to become fully yourself; identity is the whole project, and people know exactly who you are the moment you arrive',
    'you build identity through what you make, earn and value; self-worth is the lifelong lesson, and security runs deep for you',
    'you shine through your voice, ideas and curiosity; you are a communicator, and a sibling or your local world shaped who you are',
    'your real self lives at home and in private; your identity is rooted in family, and you come into your own later, from the inside out',
    'you are here to create, perform and love out loud; self-expression is oxygen, and you shine most when you are making something',
    'you find yourself through work, service and craft; you shine in the doing and the details, and being useful is core to who you are',
    'you become yourself through others; partnership is your arena, and you meet your identity in the mirror of your relationships',
    'you are here to transform; your identity is forged through crisis, intimacy and rebirth, and you are never the same person for long',
    'you shine through meaning, travel and teaching; you are here to widen your world, and a big belief or a far place made you who you are',
    'you are built for the public world; career and reputation are central to your identity, and you are meant to be visible and to lead',
    'you find yourself in groups, causes and the future; your identity is bound up with your people and your hopes, not just yourself',
    'your truest self is the hidden one; you shine behind the scenes, through spirit, art or service, and you spend a life meeting the unseen you'
  ],
  saturnHouse: [
    'you took yourself seriously young and may have felt awkward in your own skin; self-acceptance is the long, real lesson',
    'money and self-worth are where you feel the pressure; you fear scarcity, you build slowly, and security comes late but lasts',
    'you doubted your own mind or voice early; you learned to speak carefully, and you become an authority through years of quiet work',
    'the home or family carried weight and limitation; you build your own foundations the hard way, and belonging is the long lesson',
    'you hold back on play, romance or creativity, fearing you are not good enough to make or to love; this loosens beautifully with age',
    'you carry the weight of duty and health; you overwork, you fear being useless, and mastering the daily grind is your teacher',
    'commitment is serious and a little frightening for you; your partnerships teach through testing, and the right one deepens later',
    'you fear loss of control, debt or dependence; intimacy and shared money are where you grow up, and you master what most people avoid',
    'you were sceptical of easy belief; you build your worldview the hard way, and you become the teacher you once needed',
    'the world is where you feel the pressure to prove yourself; career comes slow and heavy, and you reach real authority later and keep it',
    'friendship and belonging did not come easily; you are careful with your people, and you build a chosen circle slowly and for keeps',
    'you carry a private, hard-to-name fear; you do your deepest work unseen, and you make peace with what you cannot control'
  ],
  jupiterHouse: [
    'doors tend to open through simply being yourself; you have natural optimism, and people give you the benefit of the doubt',
    'money and resources tend to find you; you have a knack for earning and a generous relationship with what you own',
    'your luck runs through words, learning and connections; you pick things up fast, and a sibling or neighbour brings real good fortune',
    'home and family are a source of luck and growth; you may have a big-hearted home life, and you flourish from a secure base',
    'romance, creativity and children are where life is generous to you; you have a lucky, joyful streak in love and in making things',
    'you grow through work and service; the daily grind is oddly lucky for you, and you find opportunity in being useful',
    'partnership brings your biggest luck; the right people expand your life, and collaboration or marriage lifts you',
    'you gain through other people\u2019s resources: inheritance, investment, partnership money; you grow through depth and transformation',
    'you are the classic lucky traveller and learner; foreign places, higher study and big beliefs are where your life expands most',
    'career and public life are where fortune favours you; you rise through visibility, and opportunity arrives through your reputation',
    'your friends, networks and causes bring you luck; your hopes tend to come true through the group, and community lifts you',
    'your luck is quiet and behind the scenes; you grow through solitude, spirit and compassion, and unseen help arrives when you need it'
  ]
};
