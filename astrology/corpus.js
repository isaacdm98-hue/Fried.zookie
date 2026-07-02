
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
  // Ptolemy quotes are the Ashmand translation (1822, PD); Lilly is Christian Astrology (1647, PD), spelling
  // lightly modernised, ellipses marking omission. The outer planets postdate the classical canon — said so plainly.
  var PLANET_TRAD = {
    sun: { sig: 'Vitality, the will, the heart and the essential self. The father, the sovereign, and what you were born to shine at. One of the two Lights, the chart’s source of life.', q: 'The active influence of the Sun is found to be heating and, in a certain degree, drying.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    moon: { sig: 'The body’s instincts, the tides of mood and memory, the mother and what makes you feel safe. The receptive Light that mirrors, carries and tends.', q: 'The Moon’s power consists chiefly in moistening, being near the earth and disposed to the humours thereof.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    mercury: { sig: 'The mind, speech, reason, trade and the messenger between people. Quick and adaptable, taking colour from whatever it touches.', q: 'Mercury… presaging a subtle and politic brain, an excellent disputant or logician, arguing with learning and discretion.', src: 'William Lilly, Christian Astrology (1647)' },
    venus: { sig: 'Love, pleasure, beauty, art and union. What and whom you value, and the urge to make peace and to delight. Traditionally the Lesser Fortune.', q: 'The power of Venus is temperate… and chiefly disposed to moisture.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    mars: { sig: 'Drive, courage, anger and desire. The cutting edge, the will to act and to fight. The Lesser Infortune: heat that must be well aimed.', q: 'The power of Mars is principally to dry and to burn, conformably to his fiery colour.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    jupiter: { sig: 'Growth, faith, abundance, wisdom and generosity. The wider horizon and the urge to expand and to bless. The Greater Fortune.', q: 'The power of Jupiter is temperate… and is consequently fructifying.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    saturn: { sig: 'Time, limit, structure and fear. The slow discipline that endures, and the weight that makes you grow up. The Greater Infortune, keeper of boundaries.', q: 'The power of Saturn is principally to cool, and moderately to dry.', src: 'Ptolemy, Tetrabiblos (Ashmand trans., 1822)' },
    uranus: { sig: 'Freedom, shock, genius and revolt. The break for independence and the lightning that overturns. Unknown to the classical authors (discovered 1781); its meaning is a modern reading.' },
    neptune: { sig: 'Dreams, longing, compassion and dissolving edges, the mystic, the artist and the escape. Unknown to the ancients (discovered 1846); a modern signification.' },
    pluto: { sig: 'Power, depth, death and rebirth. What is buried, what is shared under pressure, and what is utterly transformed. Unknown to the tradition (discovered 1930); a modern reading.' }
  };
  // Per-house significations after William Lilly, Christian Astrology (1647, PD) — our summary, then his own line.
  var HOUSE_TRAD = [
    { sig: 'The body and the life itself: your appearance, vitality, temperament and the way you meet the world.', q: 'It signifieth the life of man… the stature, colour, complexion, form and shape of him.' },
    { sig: 'What you own and what you’re worth. Money, possessions, resources, and the things you can move and use.', q: 'It signifieth the estate or fortune of the querent, his wealth or poverty, all moveable goods, money lent.' },
    { sig: 'Brothers and sisters, neighbours and everyday talk. Short journeys, letters, messages and the near world.', q: 'It signifieth brethren, sisters, kinsfolk… short journeys, letters, rumours, messengers.' },
    { sig: 'Home, family roots and the father. Land, inheritance, and the ground you come from and return to.', q: 'It hath signification of fathers… of lands, houses, tenements, inheritances.' },
    { sig: 'Children, romance, creativity and play. Pleasure, delight and everything you make for joy.', q: 'It ruleth children… pleasure, delight, banquets, ale-houses, taverns.' },
    { sig: 'Work, health and daily service. The body’s upkeep, routines, and those who labour with and for you.', q: 'It concerneth sickness… servants, labour, and small cattle.' },
    { sig: 'Partnership and marriage: the close other, open enemies, contracts and what you meet face to face.', q: 'It giveth judgement of marriage… the open enemy, and law-suits.' },
    { sig: 'Death and inheritance, what is shared and what is hidden, other people’s resources, and deep change.', q: 'It signifieth the estate of men deceased, death… dowry, fear and anguish of mind.' },
    { sig: 'The far horizon: long journeys, religion, philosophy, learning and dreams; the search for meaning.', q: 'It hath signification of voyages or long journeys… religion, dreams, and learning.' },
    { sig: 'Career, calling and public standing. Honour, authority, reputation and what you’re known for.', q: 'It signifieth Kings, Princes… honour, preferment, dignity, profession or trade.' },
    { sig: 'Friends, allies and community. Hopes, wishes and the wider circle that carries you forward.', q: 'It signifieth friends… hope, trust, confidence, the praise or dispraise of a man.' },
    { sig: 'The hidden and the undone: solitude, retreat, secrets, self-undoing, and what works behind the scenes.', q: 'It signifieth private enemies… imprisonment, all manner of affliction, and sorrow.' }
  ];
  var TRAD_SRC_LILLY = 'William Lilly, Christian Astrology (1647)';
  return {
    PLANETS: PLANETS, PLANET_ORDER: PLANET_ORDER, SIGNS: SIGNS, TRADITION: TRADITION,
    PLANET_TRAD: PLANET_TRAD, HOUSE_TRAD: HOUSE_TRAD, TRAD_SRC_LILLY: TRAD_SRC_LILLY,
    SUN_IN_SIGN: SUN_IN_SIGN, MOON_IN_SIGN: MOON_IN_SIGN, RISING_IN_SIGN: RISING_IN_SIGN, PLANET_SIGN_TEXT: PLANET_SIGN_TEXT,
    HOUSES: HOUSES, ASPECTS: ASPECTS, MINOR_ASPECTS: MINOR_ASPECTS, ELEMENTS: ELEMENTS, MODALITIES: MODALITIES,
    TAROT: TAROT, SUIT_KW: SUIT_KW, SPREADS: SPREADS, CITIES: CITIES
  };
})();

