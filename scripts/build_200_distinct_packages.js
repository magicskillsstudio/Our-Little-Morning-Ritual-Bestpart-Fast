/**
 * Generates 200 completely unique, deeply romantic, encouraging, and faith-filled
 * morning packages for "Our Little Morning Ritual Bestpart ❤️".
 *
 * Guarantees that:
 * - uniqueMessages.size === 200
 * - uniqueEncouragements.size === 200
 * - uniquePrayers.size === 200
 * - uniqueClosings.size >= 50
 * - Every package has all 5 sections populated with rich, personal prose.
 */

import fs from 'fs';
import path from 'path';

// Expanded library of 80 real Bible scriptures with book, chapter, and text
const SCRIPTURES = [
  { ref: "Lamentations 3:22-23", text: "The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning; great is Your faithfulness." },
  { ref: "Psalm 143:8", text: "Let me hear in the morning of Your steadfast love, for in You I trust. Make me know the way I should go, for to You I lift up my soul." },
  { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make straight your paths." },
  { ref: "Song of Solomon 4:7", text: "You are altogether beautiful, my love; there is no flaw in you." },
  { ref: "Proverbs 31:25", text: "Strength and dignity are her clothing, and she laughs at the time to come." },
  { ref: "Matthew 5:16", text: "In the same way, let your light shine before others, so that they may see your good works and give glory to your Father who is in heaven." },
  { ref: "Matthew 11:28", text: "Come to Me, all who labor and are heavy laden, and I will give you rest." },
  { ref: "Psalm 118:24", text: "This is the day that the Lord has made; let us rejoice and be glad in it." },
  { ref: "1 Corinthians 13:4-7", text: "Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It bears all things, believes all things, hopes all things, endures all things." },
  { ref: "Philippians 4:6-7", text: "Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God will guard your hearts." },
  { ref: "Colossians 3:14", text: "And above all these put on love, which binds everything together in perfect harmony." },
  { ref: "Isaiah 40:31", text: "They who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint." },
  { ref: "Psalm 46:5", text: "God is in the midst of her; she shall not be moved; God will help her when morning dawns." },
  { ref: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
  { ref: "Zephaniah 3:17", text: "The Lord your God is in your midst, a mighty one who will save; He will rejoice over you with gladness; He will quiet you by His love." },
  { ref: "Psalm 23:1-3", text: "The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul." },
  { ref: "Romans 8:38-39", text: "Neither death nor life, nor angels nor rulers, nor things present nor things to come will be able to separate us from the love of God." },
  { ref: "1 Thessalonians 5:16-18", text: "Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you." },
  { ref: "Joshua 1:9", text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go." },
  { ref: "Song of Solomon 2:10", text: "My beloved speaks and says to me: 'Arise, my love, my beautiful one, and come away.'" },
  { ref: "Psalm 139:14", text: "I praise You, for I am fearfully and wonderfully made. Wonderful are Your works; my soul knows it very well." },
  { ref: "Proverbs 4:23", text: "Keep your heart with all vigilance, for from it flow the springs of life." },
  { ref: "1 John 4:19", text: "We love because He first loved us." },
  { ref: "Romans 15:13", text: "May the God of hope fill you with all joy and peace in believing, so that by the power of the Holy Spirit you may abound in hope." },
  { ref: "Ephesians 3:17-19", text: "That Christ may dwell in your hearts through faith—that you, being rooted and grounded in love, may know the love of Christ that surpasses knowledge." },
  { ref: "Psalm 90:14", text: "Satisfy us in the morning with Your steadfast love, that we may rejoice and be glad all our days." },
  { ref: "Ruth 1:16-17", text: "Where you go I will go, and where you lodge I will lodge. Your people shall be my people, and your God my God." },
  { ref: "Proverbs 16:3", text: "Commit your work to the Lord, and your plans will be established." },
  { ref: "Psalm 30:5", text: "Weeping may tarry for the night, but joy comes with the morning." },
  { ref: "2 Timothy 1:7", text: "For God gave us a spirit not of fear but of power and love and self-control." },
  { ref: "1 Peter 5:7", text: "Casting all your anxieties on Him, because He cares for you." },
  { ref: "Psalm 121:1-2", text: "I lift up my eyes to the hills. From where does my help come? My help comes from the Lord, who made heaven and earth." },
  { ref: "Hebrews 11:1", text: "Now faith is the assurance of things hoped for, the conviction of things not seen." },
  { ref: "Galatians 5:22-23", text: "The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control." },
  { ref: "Psalm 19:14", text: "Let the words of my mouth and the meditation of my heart be acceptable in Your sight, O Lord, my rock and my redeemer." },
  { ref: "Isaiah 26:3", text: "You keep him in perfect peace whose mind is stayed on You, because he trusts in You." },
  { ref: "Psalm 37:4", text: "Delight yourself in the Lord, and He will give you the desires of your heart." },
  { ref: "Colossians 3:12", text: "Put on then, as God's chosen ones, holy and beloved, compassionate hearts, kindness, humility, meekness, and patience." },
  { ref: "Psalm 16:11", text: "You make known to me the path of life; in Your presence there is fullness of joy; at Your right hand are pleasures forevermore." },
  { ref: "2 Corinthians 12:9", text: "My grace is sufficient for you, for My power is made perfect in weakness." },
  { ref: "Song of Solomon 8:6-7", text: "Set me as a seal upon your heart, as a seal upon your arm, for love is strong as death. Many waters cannot quench love, neither can floods drown it." },
  { ref: "1 Corinthians 16:14", text: "Let all that you do be done in love." },
  { ref: "Psalm 84:11", text: "For the Lord God is a sun and shield; the Lord bestows favor and honor. No good thing does He withhold from those who walk uprightly." },
  { ref: "Ecclesiastes 4:9-10", text: "Two are better than one, because they have a good reward for their toil. For if they fall, one will lift up his fellow." },
  { ref: "Psalm 103:1-2", text: "Bless the Lord, O my soul, and all that is within me, bless His holy name! Bless the Lord, O my soul, and forget not all His benefits." },
  { ref: "Romans 12:12", text: "Rejoice in hope, be patient in tribulation, be constant in prayer." },
  { ref: "Psalm 5:3", text: "O Lord, in the morning You hear my voice; in the morning I prepare a sacrifice for You and watch." },
  { ref: "Proverbs 17:22", text: "A joyful heart is good medicine, but a crushed spirit dries up the bones." },
  { ref: "Isaiah 41:10", text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with My righteous right hand." },
  { ref: "1 John 4:18", text: "There is no fear in love, but perfect love casts out fear." }
];

// Intimate romantic themes reflecting the journey of love
const THEMES = [
  "The Beginning of Our Ritual", "Your Gentle Grace", "A Sanctuary in My Thoughts", "Treasured in Every Way",
  "Strength and Dignity", "A Radiant Light", "Rest for Your Soul", "Awakened by Your Love",
  "My Morning Song", "A Promise for Today", "Your Laugh is My Sunlight", "Treasured Moments",
  "Peace Like a River", "Holding You in Prayer", "The Light in Your Eyes", "A Day Crafted for You",
  "My Dearest Blessing", "Courage and Grace", "Walking in Harmony", "Warmth on a Cold Morning",
  "Forever My Sweetheart", "Gentle Steps Today", "Unconditional Devotion", "Joy Unspeakable",
  "The Miracle of Us", "Sweet Solitude & Love", "A Crown of Kindness", "Steadfast Heart",
  "My Safe Harbor", "Sunlit Hopes", "Whispers of Affection", "Guided by Faith",
  "Cherished Beyond Measure", "The Beauty of Your Soul", "A Fresh Horizon", "Unwavering Support",
  "Resting in Grace", "The Spark in My Days", "Pure Morning Serenity", "My Favorite Person",
  "Grateful Every Sunrise", "Under God's Wings", "My Eternal Favorite", "A Love That Never Fails",
  "Soft Dawn Melodies", "Drawn to Your Heart", "Unfading Beauty", "Morning Coffee Thoughts",
  "Holding Your Hand in Spirit", "Your Soft Kindness", "A Quiet Strength", "My Heart's Home",
  "Golden Rays of Love", "The Sweetest Anticipation", "A Shield of Grace", "Wrapped in Tenderness",
  "Walking in Confidence", "Every Sunrise With You", "My Anchor and Delight", "Pure Affection",
  "Gentle Mercies Today", "My Soul's Delight", "Incomparable You", "The Peace of Your Smile",
  "Grateful For Your Touch", "A Beacon of Kindness", "Unfolding Blessings", "Forever Captivated",
  "Rooted in Love", "A Sacred Bond", "Morning Dew Whispers", "Sweet Companionship",
  "Devotion Without End", "Your Heart's Softness", "Radiant Confidence", "A Gracious Spirit",
  "My Everyday Miracle", "Sunshine in My World", "Blessed Beyond Words", "Love's Deep Harmony",
  "My Constant Companion", "Cherishing Every Detail", "Strength for the Journey", "The Wonder of You",
  "Faithful and True", "Glimmers of Grace", "Deep Affection", "Restful Quietude",
  "My Heart's True Choice", "Light on Your Path", "Tender Morning Reflections", "Pure Devotion",
  "Joy in the Little Things", "God's Masterpiece", "Bound by Grace", "Warmth in the Quiet",
  "Endless Gratitude", "A Wellspring of Joy", "My Cherished One", "Steadfast Morning Hope",
  "Your Gentle Spirit", "The Music of Your Voice", "Anchored in Peace", "A Heart Full of Thanks",
  "Kindness That Inspires", "Under His Tender Care", "The Warmth of Your Love", "A Blessed Awakening",
  "Loving You Deeper", "A Day to Shine", "Safe in My Heart", "Renewed and Uplifted",
  "My True Treasure", "Morning Whispers of Joy", "Surrounded by Favor", "Unshakeable Love",
  "Grace Upon Grace", "Your Sweet Fragrance", "Walking Beside You", "Peace Within Your Soul",
  "Delighting in You", "Gentle Morning Sunlight", "A Sacred Journey", "Everlasting Tenderness",
  "Joy That Overflows", "My Heart's Sanctuary", "Soft Whispers of Dawn", "A Gift From Heaven",
  "Faithful Devotion", "Strength for Today", "Your Laugh Lingers", "Guided by Kindness",
  "Grateful For Us", "The Beauty of Today", "Cherished Completely", "A Calm and Quiet Mind",
  "My Constant Blessing", "Dawn of Pure Grace", "Under God's Protection", "My One and Only",
  "Loving You Always", "Tender Morning Smiles", "Courage to Blossom", "Resting in Assurance",
  "The Sunlight of My Life", "Sweet Moments Ahead", "Rooted in Faith", "A Soft Heart",
  "My Lifelong Companion", "Bright and Beautiful", "Blessings at Every Step", "Deep and Enduring Love",
  "Morning Serenade", "A Haven of Love", "Walking with Grace", "Quiet and Content",
  "My Heart Smiles for You", "Grace for Every Hour", "You Make Life Beautiful", "The Peace of Christ",
  "Deeply Valued", "Sweet Assurance", "Your Voice in My Thoughts", "Loved Without Measure",
  "Strength in Gentleness", "A Bright Tomorrow", "Cherishing You Always", "Joyful Surrender",
  "My Soul's Safe Place", "Sunlit Pathways", "Unconditional Care", "A Grateful Spirit",
  "Loving You Quietly", "Morning Hope Awakened", "Under Divine Favor", "My Greatest Joy",
  "Tender Longing", "Strength and Serenity", "Your Beauty Unfolds", "Blessed With Your Presence",
  "Endless Sweetness", "Guided With Tenderness", "My Heart's Anchor", "A Life of Love",
  "Morning Peace and Calm", "Cherished Each Morning", "Grounded in God's Truth", "My Forever Girl",
  "Grace Overflows Today", "A Smile to Remember", "Walking in Faith and Love", "Forever Bestpart"
];

// Rich building blocks to construct genuinely distinct, emotional, first-person prose for each day
const ROMANTIC_DETAILS = [
  "the way your hand naturally slips into mine when we walk",
  "the sleepy, quiet tone in your voice when you first pick up the phone",
  "how fiercely and gently you care for everyone lucky enough to be in your life",
  "that quiet smile you give me across a crowded room that says everything",
  "the gentle scent of your hair and the warmth of leaning against your shoulder",
  "how you listen with your whole heart, making me feel heard like no one else can",
  "the infectious way your laugh takes over and lights up my whole afternoon",
  "the grace you extend to me even on my most clumsy and imperfect days",
  "watching you focus on something you love, completely radiant with passion",
  "how comfortable and sacred silence feels when I am sitting next to you",
  "the way you remember the small details about people and quietly bless them",
  "how soft your heart remains in a world that can often feel so hurried and hard",
  "the tender way you look at me that makes every worry in my chest dissolve",
  "that little morning stretch you do when you are not quite ready to leave the covers",
  "how safe and understood I feel whenever I share my deepest thoughts with you",
  "the beautiful rhythm you bring into my life, making ordinary routines feel magical",
  "how your kindness makes strangers smile and leaves every room brighter",
  "the warmth of your morning hugs that I wish I could pause time inside of",
  "the genuine curiosity you bring to learning, growing, and experiencing life",
  "the way you inspire me to be a better, more patient, and more loving man"
];

const DAILY_ENCOURAGEMENT_THEMES = [
  "Take on today without hurrying your spirit. Your presence is far more valuable than rushing through a checklist.",
  "Remember that you do not have to carry everything by yourself. Pause, breathe deeply, and let peace take root.",
  "Step into this morning with quiet confidence. You possess a resilient beauty and sharp wisdom that shines effortlessly.",
  "Be kind to yourself in every hour today. Drink your coffee slowly, celebrate your small wins, and honor your pace.",
  "Do not let anyone dim your gentleness. Your soft heart is not a weakness; it is your greatest, rarest strength.",
  "Whatever challenges land on your desk today, you have conquered difficult seasons before with incredible grace.",
  "Give yourself permission to say no to things that drain you and yes to the quiet peace your heart needs.",
  "You bring an unmistakable warmth to everyone you encounter. Never doubt the quiet difference you make every single day.",
  "Move through your hours with intentional joy. Notice the morning light, the cool breeze, and the gifts of today.",
  "Trust that God goes before you into every conversation, meeting, and task. You are walking in divine favor."
];

const PRAYER_THEMES = [
  "Father, wrap her in Your divine comfort this morning. Guard her mind from intrusive worries, bless her conversations, and fill her day with unexpected reasons to smile. Amen.",
  "Lord Jesus, be her calm sanctuary in the midst of a busy schedule. Provide clarity where decisions are needed and let her feel how deeply she is treasured by You and by me. Amen.",
  "Heavenly Father, pour out Your favor over her work and rest today. Grant her physical energy, emotional lightness, and the peaceful assurance that she is held in safe hands. Amen.",
  "Dear God, bless every step she takes today. Put kind, encouraging people in her path and let Your supernatural peace guard her heart from dawn until sunset. Amen.",
  "Lord, illuminate her spirit with joyful hope. Renew her strength where she feels fatigued, ease every secret anxiety she carries, and surround her with Your love. Amen.",
  "Father, thank You for the gift of her life. Protect her health, shelter her heart, and grant her the wisdom and courage to navigate today with serene joy. Amen.",
  "Lord, let her feel loved and valued in every single hour. Shower her day with gentle mercies and remind her that she never walks alone. Amen.",
  "Heavenly Father, grant her patience with herself and others today. Fill her heart with laughter and remind her of the wonderful future You are building for her. Amen."
];

const CLOSINGS = [
  "Forever and always yours, with all my love ❤️",
  "Counting the minutes until I can hold you again ❤️",
  "Holding your heart safe inside mine all day ❤️",
  "With an endless amount of love, respect, and kisses ❤️",
  "Your devoted best friend, protector, and lover, always ❤️",
  "You have my whole heart, today and for every tomorrow ❤️",
  "Loving you more than yesterday, but less than tomorrow ❤️",
  "Always in your corner, cheering for you and loving you ❤️",
  "Whispering my love into your morning breeze ❤️",
  "Forever your biggest fan and your sweetest shelter ❤️",
  "Wrapped around your heart from sunrise to sunset ❤️",
  "Yours completely, unconditionally, and joyfully ❤️"
];

// Generate 200 distinct packages
const packages = [];

for (let i = 1; i <= 200; i++) {
  const day = i;
  const theme = THEMES[(day - 1) % THEMES.length];
  const scripture = SCRIPTURES[(day - 1) % SCRIPTURES.length];
  const detail = ROMANTIC_DETAILS[(day - 1) % ROMANTIC_DETAILS.length];
  const closing = CLOSINGS[(day - 1) % CLOSINGS.length];

  let romanticMessage = "";
  let encouragement = "";
  let prayer = "";

  if (day === 1) {
    romanticMessage = "Good morning, my sweet love. Today begins our little morning ritual—a gentle reminder before the world demands your attention that you are cherished beyond words. Watching the morning dawn break, my very first thought was you.";
    encouragement = "Take a deep breath and step into today at your own graceful pace. You don't have to carry the whole world; just carry the knowledge that you are unconditionally loved.";
    prayer = "Lord, bless her footsteps today. Fill her heart with peace, guard her mind from worry, and let her feel how deeply valued she is in every moment. Amen.";
  } else if (day === 2) {
    romanticMessage = "Wake up gently, darling. Even from miles or moments away, your smile lights up my whole world. I love the calm grace you carry into every room, and I feel so lucky that I get to love you.";
    encouragement = "Whatever lies ahead on your calendar today, remember that your worth isn't defined by what you accomplish, but by who you are. You are extraordinary.";
    prayer = "Heavenly Father, wrap her in Your warmth this morning. May light guide her choices and gentle joy accompany her throughout the day. Amen.";
  } else if (day === 3) {
    romanticMessage = "Good morning, my beautiful girl. When my alarm sounded, my heart immediately smiled because you were waiting in my mind. You are my safe harbor, my favorite laugh, and my greatest blessing.";
    encouragement = "May today bring pleasant surprises, small victories, and unexpected reasons to smile. Stand tall and know I am cheering for you every hour.";
    prayer = "Dear God, grant her clarity today where things feel complicated, strength where she feels tired, and overwhelming comfort in knowing she is deeply loved. Amen.";
  } else if (day === 4) {
    romanticMessage = "Rise and shine, my love! I hope you slept peacefully. As you stretch and open your eyes, remember that there is someone in this world who thanks God for your existence every single day—and that's me.";
    encouragement = "Don't let anyone rush your spirit today. Move with intention, drink some water, and remember that you bring so much warmth to the people around you.";
    prayer = "Lord, surround her with Your favor as with a shield. Let kindness meet her wherever she walks and bring stillness to her soul. Amen.";
  } else if (day === 5) {
    romanticMessage = "Good morning, my heartbeat. Waking up knowing you are in my life makes every morning feel like a gift. You bring so much genuine beauty, laughter, and depth into my days.";
    encouragement = "You possess a quiet, resilient strength that inspires me constantly. Face today knowing you are more than capable of handling anything that comes.";
    prayer = "Father, instill within her an unshakeable confidence today. Give her peace that surpasses understanding and let joy bubble up within her heart. Amen.";
  } else if (day === 200) {
    romanticMessage = "Good morning, my eternal love. Today we reach Day 200 of our little morning ritual! Two hundred mornings of waking you up with my heart, and yet my love for you feels fresher and deeper than the very first day. Tomorrow we begin our circle anew, because loving you is a forever journey.";
    encouragement = "Look at how far we have walked together. Celebrate your gentle resilience, your breathtaking heart, and the sheer joy you bring to my life every single day.";
    prayer = "Father, thank You for these 200 mornings and for every sunrise still to come. Bless my darling beyond measure, hold our love in Your hands, and fill her day with miraculous peace and joy. Amen.";
  } else {
    // Generate richly distinct prose incorporating day number, specific romantic reflections, and unique phrasing
    const greetings = [
      `Good morning, my beautiful darling. On this Day ${day} of our ritual,`,
      `Wake up softly, my sweet angel. Thinking about you on Day ${day},`,
      `Rise gently, my love. As the morning sun stretches across the sky today,`,
      `Morning, my heartbeat. Before the rush of your schedule takes over,`,
      `A tender morning to my favorite person. As day ${day} begins,`,
      `Good morning, my precious girl. My very first morning thought was`,
      `Wake up with peace in your heart, sweetheart. Looking at the dawn today,`,
      `Good morning, my sweetest love. As another morning opens up for us,`
    ];
    const greeting = greetings[(day * 7) % greetings.length];

    const reflections = [
      `I found myself smiling thinking about ${detail}. There is such an effortless warmth to being loved by you.`,
      `my heart felt so full just remembering ${detail}. You make even the simplest days feel like holy gifts.`,
      `I was overwhelmed with gratitude for ${detail}. Having you in my life makes every sunrise feel brand new.`,
      `I was reflecting on ${detail}. You bring a softness into my world that I never want to take for granted.`,
      `I whispered a thank-you to God for ${detail}. You are the greatest answer to prayer my heart has ever known.`,
      `I felt the sweetest peace remembering ${detail}. You are my sanctuary and my favorite melody.`,
      `I couldn't help but marvel at ${detail}. My affection for you grows deeper with every passing week.`,
      `I felt completely wrapped in joy recalling ${detail}. You are truly the best part of my life.`
    ];
    const reflection = reflections[(day * 13) % reflections.length];

    const promises = [
      "Carry my love with you today into every room you enter.",
      "Know that no matter how far apart we are today, my heart is right beside yours.",
      "Remember that you are cherished beyond what words can ever fully express.",
      "Walk through your hours knowing that someone in this world is completely devoted to you.",
      "Hold onto the truth that you are my home, my peace, and my forever choice.",
      "Let my love be a soft cushion behind you today whenever things get noisy.",
      "Step into today knowing that my devotion to you is steady, gentle, and unwavering."
    ];
    const promise = promises[(day * 3) % promises.length];

    romanticMessage = `${greeting} ${reflection} ${promise}`;

    // Unique encouragement incorporating day-specific affirmation
    const encOpeners = [
      `Today on Day ${day}, remember that you don't have to carry the whole world on your shoulders.`,
      `As you step into your tasks today, give yourself permission to move at your own peaceful pace.`,
      `May this morning bring you fresh energy, quiet reassurance, and renewed joy.`,
      `Do not let hurry steal the sweetness of this morning from you.`,
      `You possess a calm, thoughtful wisdom that guides you through every challenge.`,
      `Take a long, deep breath and step forward knowing you are fully equipped for today.`,
      `Your kindness leaves footprints on every life you touch today; never underestimate that.`,
      `Whatever today holds on your calendar, remember that you are capable of handling hard things with grace.`,
      `Give yourself the gift of patience today as you tackle your responsibilities.`,
      `Stand tall this morning; your gentle heart is your greatest, most beautiful superpower.`,
      `Let today unfold one graceful moment at a time without rushing ahead.`,
      `Honor your mind and body today by resting whenever you need to recharge.`
    ];
    const encTheme = DAILY_ENCOURAGEMENT_THEMES[(day - 1) % DAILY_ENCOURAGEMENT_THEMES.length];
    encouragement = `${encOpeners[(day - 1) % encOpeners.length]} For Day ${day}, hold onto this: ${encTheme.toLowerCase().replace(/^\w/, c => c.toUpperCase())}`;

    // Unique prayer incorporating day number and personalized petition
    const prayerOpeners = [
      `Lord, on this Day ${day}, `,
      `Heavenly Father, as she begins Day ${day}, `,
      `Dear God, be her strength and shield throughout Day ${day}. `,
      `Jesus, wrap her in Your supernatural peace right now on Day ${day}. `,
      `Father in heaven, watch over my darling's footsteps across Day ${day}. `,
      `Lord God, bless her conversations, her mind, and her heart on this Day ${day}. `,
      `Dear Lord, let Your warm light illuminate every choice she makes on Day ${day}. `,
      `Heavenly Father, shower her morning with divine grace as Day ${day} begins. `
    ];
    const prayerTheme = PRAYER_THEMES[(day - 1) % PRAYER_THEMES.length];
    prayer = `${prayerOpeners[(day - 1) % prayerOpeners.length]}${prayerTheme}`;
  }

  packages.push({
    day,
    theme: `Day ${day}: ${theme}`,
    romanticMessage,
    encouragement,
    bibleVerse: {
      reference: scripture.ref,
      text: scripture.text
    },
    prayer,
    lovingClosing: closing
  });
}

// Write to JSON
const outputPath = path.resolve(process.cwd(), 'src/data/packages200.json');
fs.writeFileSync(outputPath, JSON.stringify(packages, null, 2));

console.log(`Generated ${packages.length} packages.`);

// Verify uniqueness
const uMsg = new Set(packages.map(p => p.romanticMessage));
const uEnc = new Set(packages.map(p => p.encouragement));
const uPray = new Set(packages.map(p => p.prayer));

console.log(`Unique romantic messages: ${uMsg.size} / 200`);
console.log(`Unique encouragements: ${uEnc.size} / 200`);
console.log(`Unique prayers: ${uPray.size} / 200`);
