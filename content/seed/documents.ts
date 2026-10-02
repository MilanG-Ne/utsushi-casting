/**
 * Bilingual seed content for the fictional Utsushi Casting studio.
 * Every person, company, production and figure here is invented for this demo.
 */
import { image, keyed, ls, lpt, lt, ref, slug } from "./helpers";

const SERVICE = {
  film: "service.film-and-television",
  commercials: "service.commercials",
  voice: "service.voice-and-localization",
} as const;

const CASE = {
  harbour: "caseStudy.harbour-lights",
  lantern: "caseStudy.the-lantern-keeper",
} as const;

export const siteSettings = {
  _id: "siteSettings",
  _type: "siteSettings",
  name: ls("Utsushi Casting", "ウツシ・キャスティング"),
  tagline: ls("Bilingual casting for screen and voice", "映像と声のバイリンガル・キャスティング"),
  description: lt(
    "Utsushi Casting is a bilingual casting studio with rooms in Tokyo and London. We cast film, television, commercials and voice work in English, Japanese or both, and we specialise in the productions that need both.",
    "ウツシ・キャスティングは、東京とロンドンにスタジオを構えるバイリンガルのキャスティング会社です。映画・ドラマ・広告・吹替のキャスティングを日本語と英語で手がけ、とりわけ両言語を必要とする作品を得意としています。",
  ),
  email: "hello@utsushi-casting.example",
  foundingYear: 2014,
  studios: keyed("studio", [
    { _type: "studioLocation", city: ls("Tokyo", "東京"), area: ls("Nakameguro, Meguro City", "目黒区中目黒"), addressLocality: "Meguro, Tokyo", addressCountry: "JP" },
    { _type: "studioLocation", city: ls("London", "ロンドン"), area: ls("Hackney, East London", "イースト・ロンドン、ハックニー"), addressLocality: "London", addressCountry: "GB" },
  ]),
};

const homePage = {
  _id: "page.home",
  _type: "page",
  key: "home",
  title: ls("Home", "ホーム"),
  eyebrow: ls("Casting studio · Tokyo & London", "キャスティングスタジオ｜東京・ロンドン"),
  heading: ls("The right face for the frame, in English, Japanese or both.", "その役にふさわしい顔を。日本語でも、英語でも、その両方でも。"),
  intro: lt(
    "We are a casting studio for productions that cross languages. From bilingual leads to native-speaker day players and voice casts, we find performers who are as convincing in the room as they are on screen.",
    "私たちは、言語をまたぐ作品のためのキャスティングスタジオです。バイリンガルの主演から、ネイティブスピーカーの端役、吹替キャストまで、オーディションでも画面の中でも説得力のある俳優・声優を見つけ出します。",
  ),
  stats: keyed("stat", [
    { _type: "stat", value: ls("1,400+", "1,400以上"), label: ls("roles cast since 2014", "2014年以来の配役数") },
    { _type: "stat", value: ls("2", "2"), label: ls("studios, in Tokyo and London", "東京とロンドンの拠点") },
    { _type: "stat", value: ls("38", "38"), label: ls("productions in two or more languages", "2言語以上で制作された作品") },
  ]),
  featuredCaseStudies: [ref(CASE.harbour), ref(CASE.lantern)],
  showreel: {
    _type: "video",
    title: ls("Utsushi Casting showreel 2026", "ウツシ・キャスティング ショーリール 2026"),
    description: lt(
      "A 20-second montage of a spotlight moving across an empty stage, made for this demo site. It contains no performers and no audio.",
      "誰もいない舞台をスポットライトが照らす20秒の映像です。このデモサイトのために制作したもので、出演者と音声は含まれていません。",
    ),
    url: "/media/video/showreel.mp4",
    poster: image("showreel-poster", "A single spotlight on an empty stage, with dust drifting through the beam.", "誰もいない舞台に差し込む一筋のスポットライトと、光の中を漂う塵。"),
    durationSeconds: 20,
    uploadDate: "2026-09-15",
    hasAudio: false,
  },
  process: keyed("step", [
    {
      _type: "step",
      title: ls("Read the script in both languages", "両言語で脚本を読み込む"),
      body: lt(
        "Before we open a call, we break down every role with the director in the language it will be performed in, including dialect, register and how much of each language the character needs.",
        "募集を始める前に、監督とともにすべての役柄を、実際に演じる言語で読み解きます。方言や言葉づかい、その人物にそれぞれの言語がどの程度必要かまで洗い出します。",
      ),
    },
    {
      _type: "step",
      title: ls("Search beyond the usual lists", "いつものリストの外まで探す"),
      body: lt(
        "Agencies, drama schools, community theatres and open calls in both countries. For bilingual roles we test language as carefully as performance.",
        "両国の事務所、養成所・演劇学校、地域の劇団、そして公開オーディションまで。バイリンガルの役では、演技と同じくらい丁寧に語学力を確かめます。",
      ),
    },
    {
      _type: "step",
      title: ls("Run sessions that travel", "国境を越えるオーディション"),
      body: lt(
        "Self-tapes with bilingual readers, then in-room or remote callbacks timed for both time zones, with everything shared on one review link.",
        "バイリンガルの相手役と撮るセルフテープから、両国の時差に合わせた対面またはリモートのコールバックまで。すべてを一つの確認用リンクで共有します。",
      ),
    },
    {
      _type: "step",
      title: ls("Close the deals in both markets", "両国の慣習に沿って契約まで"),
      body: lt(
        "We negotiate with agents in Tokyo and London, coordinate availability and travel with your production office, and stay on until the last role is signed.",
        "東京の芸能事務所、ロンドンのエージェントの双方と交渉し、スケジュールや渡航の調整を制作部と連携して進めます。最後の一人の契約が結ばれるまで伴走します。",
      ),
    },
  ]),
  seo: {
    _type: "seo",
    title: ls("Utsushi Casting — Bilingual casting for screen and voice", "ウツシ・キャスティング｜映像と声のバイリンガル・キャスティング"),
    description: lt(
      "Bilingual casting studio in Tokyo and London. Film, television, commercial and voice casting across English and Japanese.",
      "東京とロンドンを拠点とするバイリンガル・キャスティングスタジオ。映画・ドラマ・広告・吹替のキャスティングを日英両言語で手がけます。",
    ),
  },
};

const workPage = {
  _id: "page.work",
  _type: "page",
  key: "work",
  title: ls("Work", "実績"),
  eyebrow: ls("Selected work", "主な実績"),
  heading: ls("Casting that holds up in two languages.", "二つの言語で、確かな説得力を。"),
  intro: lt(
    "A selection of recent productions. Each case study covers the brief, how we searched and what the production got.",
    "最近の作品から一部をご紹介します。それぞれの事例で、ご依頼の内容、探し方、そして制作にもたらした成果をまとめています。",
  ),
  seo: {
    _type: "seo",
    title: ls("Work", "実績"),
    description: lt(
      "Selected casting work by Utsushi Casting: bilingual drama, animated features and campaigns cast across Japan and the UK.",
      "ウツシ・キャスティングの主な実績。日英バイリンガル・ドラマ、長編アニメーション映画、広告キャンペーンなど、日本とイギリスで手がけたキャスティング事例をご紹介します。",
    ),
  },
};

const contactPage = {
  _id: "page.contact",
  _type: "page",
  key: "contact",
  title: ls("Contact", "お問い合わせ"),
  eyebrow: ls("Contact", "お問い合わせ"),
  heading: ls("Tell us about the production.", "作品について、お聞かせください。"),
  intro: lt(
    "Share what you can about roles, languages, dates and locations. A casting director will reply within two working days, in the language you write in.",
    "役柄、使用言語、日程、撮影地など、分かる範囲でお知らせください。2営業日以内に、キャスティングディレクターがお問い合わせいただいた言語でご返信します。",
  ),
  body: lpt(
    "contact",
    `## What happens next

- We read your brief and reply with questions or a short proposal.
- If it is a fit, we set up a call with the director or producer.
- You receive a scoped quote and a casting timeline within a week.`,
    `## お問い合わせ後の流れ

- 内容を拝見し、確認事項または簡単なご提案をお送りします。
- お引き受けできる場合は、監督またはプロデューサーとの打ち合わせを設定します。
- 1週間以内に、お見積りとキャスティングのスケジュールをお送りします。`,
  ),
  seo: {
    _type: "seo",
    title: ls("Contact", "お問い合わせ"),
    description: lt(
      "Start a casting enquiry with Utsushi Casting. We reply within two working days, in English or Japanese.",
      "映画・ドラマ・広告・吹替のキャスティングのご相談はウツシ・キャスティングへ。日本語または英語で、2営業日以内にご返信します。",
    ),
  },
};

const filmService = {
  _id: SERVICE.film,
  _type: "service",
  order: 1,
  title: ls("Film & Television Casting", "映画・ドラマのキャスティング"),
  slug: slug("film-and-television"),
  shortSummary: ls("Series and features, from leads to day players.", "主演から端役まで、映画とドラマのキャスティング。"),
  summary: lt(
    "Casting for series and features, from bilingual leads to native-speaker supporting roles, run from our studios in Tokyo and London.",
    "ドラマシリーズや長編映画のキャスティング。バイリンガルの主演からネイティブスピーカーの脇役まで、東京とロンドンのスタジオから手がけます。",
  ),
  heroImage: image("service-film-and-television", "Soft studio lights glowing out of focus on a dark film set.", "暗い撮影セットで、ぼんやりと光るスタジオ照明。"),
  body: lpt(
    "film",
    `## Built for co-productions

International co-productions rarely need just one casting director. They need someone who can hold a breakdown in two languages, read an agent's email from Tokyo alongside a self-tape from Manchester, and tell which actor will genuinely carry a scene in their second language.

That is most of our work. We cast whole productions, or partner with a lead casting director in one country and take on the other.

## What makes a bilingual role work

Fluency on a CV is not the same as performing in a language. Every bilingual shortlist we send has been heard reading in both languages with a native-speaking reader, and is labelled honestly: native, fluent or coached.`,
    `## 国際共同制作のために

国際共同制作の現場では、キャスティングディレクターが一人では足りないことがほとんどです。二つの言語で役柄表を扱い、東京の事務所からのメールとマンチェスターから届いたセルフテープを並べて確認し、第二言語でも場面を背負える俳優を見極められる存在が必要です。

それが私たちの仕事の大半です。作品全体のキャスティングを担うことも、一方の国のキャスティングディレクターと組み、もう一方の国を担当することもあります。

## バイリンガルの役を成立させるもの

プロフィールに書かれた語学力と、その言語で演じる力は別物です。私たちがお送りするバイリンガルの候補者リストでは、全員についてネイティブの相手役と両言語での読み合わせを行ったうえで、語学レベルを「ネイティブ」「流暢」「要指導」のいずれかで正直に明記しています。`,
  ),
  deliverables: keyed("del", [
    ls("Character breakdowns in English and Japanese", "日英両言語での役柄表（ブレイクダウン）作成"),
    ls("Shortlists with the language level noted for every performer", "俳優ごとの語学レベルを明記した候補者リスト"),
    ls("Self-tape and callback sessions in Tokyo, London and online", "東京・ロンドン・オンラインでのセルフテープ審査とコールバック"),
    ls("Offers, deal memos and agent negotiation in both markets", "両国でのオファー、条件確認書（ディールメモ）の作成、事務所・エージェントとの交渉"),
    ls("Daily casting reports shared on one review link", "一つの確認用リンクで共有する日次キャスティングレポート"),
  ]),
  process: keyed("step", [
    { _type: "step", title: ls("Breakdown", "役柄の整理"), body: lt("We read the script with you and agree how much of each language every role needs.", "脚本を一緒に読み込み、役ごとに必要な言語の範囲をすり合わせます。") },
    { _type: "step", title: ls("Search", "候補者探し"), body: lt("Agency submissions, our own database and targeted open calls in both countries.", "事務所からの推薦、自社データベース、両国での的を絞った公開募集を組み合わせます。") },
    { _type: "step", title: ls("Sessions", "オーディション"), body: lt("Self-tapes first, then callbacks with the director in the room or on a call.", "まずセルフテープで選考し、その後、監督同席の対面またはオンラインでコールバックを行います。") },
    { _type: "step", title: ls("Contracts", "契約"), body: lt("We clear availability, negotiate deals and hand signed paperwork to your production office.", "スケジュールを押さえて出演条件を交渉し、署名済みの書類を制作部にお渡しします。") },
  ]),
  faq: keyed("faq", [
    {
      _type: "faqItem",
      question: ls("Can you cast just the Japanese-speaking roles on a UK production?", "イギリスの作品で、日本語を話す役だけをお願いできますか？"),
      answer: lt(
        "Yes. Partnering with a UK lead casting director is one of the most common ways we work. We take the roles that need Japanese and work to their schedule and systems.",
        "はい、可能です。イギリス側のキャスティングディレクターと組むのは、私たちが特によくお受けする形です。日本語が必要な役を担当し、先方のスケジュールや進め方に合わせて対応します。",
      ),
    },
    {
      _type: "faqItem",
      question: ls("How long does casting a series usually take?", "ドラマシリーズのキャスティングには、通常どのくらいかかりますか？"),
      answer: lt(
        "For an eight-part drama with forty to fifty speaking roles, plan on eight to twelve weeks from breakdown to final offers. Leads can be faster when offers go out directly.",
        "セリフのある役が40〜50ほどある全8話のドラマの場合、役柄表の作成から最終オファーまで8〜12週間が目安です。主演は直接オファーの場合、より短期間で決まることもあります。",
      ),
    },
  ]),
  seo: {
    _type: "seo",
    title: ls("Film & Television Casting", "映画・ドラマのキャスティング"),
    description: lt(
      "Bilingual film and television casting from Tokyo and London: co-productions, bilingual leads and native-speaker supporting roles.",
      "東京とロンドンから手がける映画・ドラマのキャスティング。国際共同制作に強く、バイリンガルの主演からネイティブスピーカーの脇役まで対応します。",
    ),
  },
};

const commercialsService = {
  _id: SERVICE.commercials,
  _type: "service",
  order: 2,
  title: ls("Commercial & Brand Casting", "広告・ブランドのキャスティング"),
  slug: slug("commercials"),
  shortSummary: ls("Campaign casting for screen, print and social.", "映像・グラフィック・SNS広告のキャスティング。"),
  summary: lt(
    "Casting for campaigns that run in Japan, the UK or both: real people, actors and talent, cleared for every market they will appear in.",
    "日本、イギリス、あるいは両国で展開する広告のキャスティング。一般の方から俳優、タレントまで、出稿するすべての市場での権利処理を前提に起用します。",
  ),
  heroImage: image("service-commercials", "A warm, seamless paper backdrop in a photo studio, with a soft shadow on the floor.", "撮影スタジオの温かみのある背景紙と、床に落ちる柔らかな影。"),
  body: lpt(
    "ads",
    `## One campaign, two markets

A campaign that runs in Tokyo and London has to feel local in both. We cast for that from the first brief, so you are not reshooting a Japanese version with a different family three months later.

## Usage, cleared up front

Buyouts work differently in Japan and the UK. We agree media, territory and term with every performer's agent before the shoot and put it in writing in both languages, so the campaign can run wherever it needs to.`,
    `## 一つのキャンペーンを、二つの市場で

東京とロンドンで展開する広告は、どちらの街でも自然に見えなければなりません。私たちは最初のブリーフの段階からそれを前提にキャスティングするため、3か月後に日本版だけ別の家族で撮り直す、といった事態を防げます。

## 使用条件は撮影前に明確に

出演料の買い取り条件は、日本とイギリスで考え方が異なります。撮影前に出演者ごとの所属事務所・エージェントと媒体・地域・期間を取り決め、日英両言語の書面に残すため、必要な場所で安心して広告を展開できます。`,
  ),
  deliverables: keyed("del", [
    ls("Street and social casting for real people", "一般の方を対象としたストリート・SNSキャスティング"),
    ls("Actor and talent casting through agencies in both countries", "両国の事務所を通じた俳優・タレントのキャスティング"),
    ls("Fitting and audition sessions with client viewing links", "クライアント確認用リンク付きのフィッティング・オーディション"),
    ls("Usage and buyout agreements in English and Japanese", "日英両言語での使用条件・買い取り契約書"),
    ls("Model releases checked against every market", "出稿するすべての市場を想定した肖像権使用同意書（モデルリリース）の確認"),
  ]),
  process: keyed("step", [
    { _type: "step", title: ls("Brief", "ブリーフ"), body: lt("We agree the look, the markets and the usage before anyone is approached.", "候補者に声をかける前に、ビジュアルの方向性、出稿市場、使用条件をすり合わせます。") },
    { _type: "step", title: ls("Street and agency search", "ストリートと事務所での候補者探し"), body: lt("Real-people scouting and agency submissions, presented together.", "一般の方のスカウトと事務所からの推薦を、まとめてご提案します。") },
    { _type: "step", title: ls("Casting day", "キャスティング当日"), body: lt("Sessions in Tokyo or London, streamed to the client and the agency.", "東京またはロンドンでオーディションを行い、クライアントと代理店にも配信します。") },
    { _type: "step", title: ls("Clearance", "権利処理"), body: lt("Usage agreed and signed before the shoot day.", "撮影日までに使用条件を合意し、署名を完了させます。") },
  ]),
  faq: keyed("faq", [
    {
      _type: "faqItem",
      question: ls("Do you cast real people as well as actors?", "俳優だけでなく、一般の方のキャスティングもお願いできますか？"),
      answer: lt(
        "Yes. Around half of our commercial work is street and social casting, usually mixed with a smaller number of professional actors for speaking roles.",
        "はい。広告案件の約半数がストリートやSNSでのキャスティングで、セリフのある役には少数のプロの俳優を組み合わせることが多いです。",
      ),
    },
    {
      _type: "faqItem",
      question: ls("Can you handle usage for a global campaign?", "グローバル広告の使用条件にも対応できますか？"),
      answer: lt(
        "We clear Japan and the UK directly and work with partner casting directors in other territories, with one combined usage summary at the end.",
        "日本とイギリスは直接対応し、その他の地域は提携先のキャスティングディレクターと連携します。最終的には、使用条件を一つの一覧にまとめてお渡しします。",
      ),
    },
  ]),
  seo: {
    _type: "seo",
    title: ls("Commercial & Brand Casting", "広告・ブランドのキャスティング"),
    description: lt(
      "Commercial casting for campaigns in Japan and the UK: real people, actors and talent, with usage cleared for every market.",
      "日本とイギリスで展開する広告のキャスティング。一般の方から俳優・タレントまで、出稿する市場ごとの権利処理も含めて対応します。",
    ),
  },
};

const voiceService = {
  _id: SERVICE.voice,
  _type: "service",
  order: 3,
  title: ls("Voice & Localization Casting", "吹替・ローカライズのキャスティング"),
  slug: slug("voice-and-localization"),
  shortSummary: ls("Dubbing, games and bilingual voice talent.", "吹替、ゲーム、バイリンガル声優のキャスティング。"),
  summary: lt(
    "Voice casting for dubbing, animation and games, matching performances across English and Japanese without losing the character.",
    "吹替、アニメーション、ゲームのボイスキャスティング。キャラクターの魅力を損なうことなく、日英の演技をつなぎます。",
  ),
  heroImage: image("service-voice-and-localization", "Two sound waveforms, one red and one white, running side by side.", "赤と白、二本の音声波形が並んで流れる様子。"),
  body: lpt(
    "voice",
    `## Matching a performance, not just a voice

A good dub sounds like the character, not like the original actor. We start from the original performance (rhythm, age, warmth, the breath before a joke) and cast for that in the target language.

## Directors who speak both

Every session we cast can be supported by a bilingual voice director, so notes about intention travel between the languages without being flattened by translation.`,
    `## 声だけでなく、演技を合わせる

優れた吹替は、オリジナルの俳優ではなく、キャラクターそのものに聞こえます。私たちは、リズム、年齢感、温かさ、冗談の前の息づかいといったオリジナルの演技から出発し、それを翻訳先の言語で表現できる声優を探します。

## 両言語を話すディレクター

私たちがキャスティングを担当した収録には、ご希望に応じてバイリンガルのボイスディレクターが立ち会います。演技の意図に関する指示が、翻訳によって平板になることなく、言語の間で伝わります。`,
  ),
  deliverables: keyed("del", [
    ls("Voice matching against the original performance", "オリジナルの演技を踏まえたボイスマッチング"),
    ls("Bilingual demo reels and test reads for every shortlisted actor", "候補者全員分のバイリンガルのデモ音源とテスト収録"),
    ls("English dubs of Japanese originals, and Japanese dubs of English originals", "日本語作品の英語吹替、英語作品の日本語吹替"),
    ls("Game casting for large ensembles, including pickup sessions", "追加収録にも対応する大規模キャストのゲームキャスティング"),
    ls("Bilingual voice directors for recording sessions", "収録に立ち会うバイリンガルのボイスディレクター"),
  ]),
  process: keyed("step", [
    { _type: "step", title: ls("Listen", "聴き込む"), body: lt("We study the original performance scene by scene and write voice briefs in both languages.", "オリジナルの演技を場面ごとに分析し、日英両言語でボイスブリーフを作成します。") },
    { _type: "step", title: ls("Test reads", "テスト収録"), body: lt("Shortlisted actors record the same three scenes, so comparisons are fair.", "候補者には同じ三つの場面を収録してもらい、公平に比較できるようにします。") },
    { _type: "step", title: ls("Match", "マッチング"), body: lt("We present each role with the original clip next to the best two or three reads.", "役ごとに、オリジナルの映像と上位2〜3名のテスト音源を並べてご提案します。") },
    { _type: "step", title: ls("Record", "収録"), body: lt("Booking, scheduling and a bilingual director in the booth if you need one.", "ブッキングとスケジュール調整を行い、必要に応じてバイリンガルのディレクターがブースに立ち会います。") },
  ]),
  faq: keyed("faq", [
    {
      _type: "faqItem",
      question: ls("Do you work with unions and voice agencies?", "組合や声優事務所との取引には対応していますか？"),
      answer: lt(
        "Yes. In the UK we cast under the relevant union agreements where the production requires it, and in Japan we work through established voice agencies.",
        "はい。イギリスでは制作側の要件に応じて該当する組合の協約に基づいてキャスティングし、日本では実績のある声優事務所を通じて起用します。",
      ),
    },
    {
      _type: "faqItem",
      question: ls("Can you cast a game with hundreds of lines?", "セリフ数が数百にのぼるゲームのキャスティングも可能ですか？"),
      answer: lt(
        "Yes. For large ensembles we cast in waves, keep a consistent voice bible and plan pickup sessions from the start.",
        "可能です。大規模なキャストの場合は段階的にキャスティングを進め、一貫したボイスバイブルを管理し、追加収録も当初から計画に組み込みます。",
      ),
    },
  ]),
  seo: {
    _type: "seo",
    title: ls("Voice & Localization Casting", "吹替・ローカライズのキャスティング"),
    description: lt(
      "Voice casting for dubbing, animation and games, matching performances between English and Japanese.",
      "吹替、アニメーション、ゲームのボイスキャスティング。オリジナルの演技を踏まえ、日本語と英語の間で声と演技を丁寧にマッチングします。",
    ),
  },
};

const harbourLights = {
  _id: CASE.harbour,
  _type: "caseStudy",
  order: 1,
  title: ls("Harbour Lights", "ハーバー・ライツ"),
  slug: slug("harbour-lights"),
  client: ls("Saltmarsh Films and Nishikaze Television (fictional)", "ソルトマーシュ・フィルムズ／西風テレビ（架空）"),
  year: 2025,
  format: ls("Eight-part bilingual drama series", "全8話のバイリンガル・ドラマシリーズ"),
  locations: ls("Liverpool and Yokohama", "リバプール・横浜"),
  rolesCast: 46,
  summary: lt(
    "A UK–Japan co-production about two port cities and the family split between them. We cast 46 speaking roles across Liverpool and Yokohama, including four leads who perform in both languages.",
    "二つの港町と、その間で離ればなれになった家族を描く日英共同制作のドラマ。リバプールと横浜でセリフのある46役をキャスティングし、そのうち主演の4人は日英両言語で演じています。",
  ),
  heroImage: image("harbour-lights", "Out-of-focus city lights along a harbour at night, reflected in dark water.", "夜の港に並ぶぼやけた街の灯りと、暗い水面に映るその反射。"),
  video: {
    _type: "video",
    title: ls("Harbour Lights casting reel", "『ハーバー・ライツ』キャスティング映像"),
    description: lt(
      "A 15-second abstract clip of harbour lights reflected on water, made for this demo. No performers and no audio.",
      "水面に映る港の灯りを描いた15秒の抽象映像です。デモ用に制作したもので、出演者と音声は含まれていません。",
    ),
    url: "/media/video/harbour-lights.mp4",
    poster: image("harbour-lights", "Out-of-focus city lights along a harbour at night, reflected in dark water.", "夜の港に並ぶぼやけた街の灯りと、暗い水面に映るその反射。"),
    durationSeconds: 15,
    uploadDate: "2025-11-20",
    hasAudio: false,
  },
  body: lpt(
    "hl",
    `## The brief

Harbour Lights moves between Liverpool and Yokohama across three generations of one family. Roughly 40 percent of the dialogue is in Japanese, half is in English, and the rest switches mid-scene. The four leads had to be completely convincing in both languages, and believable as relatives across two countries.

## How we searched

We ran the search from both studios at once. In London we worked through agencies and Japanese community theatre groups; in Tokyo we focused on actors who had lived or trained in the UK. Every bilingual candidate read the same two scenes with a native-speaking reader in each language, and the producers saw both reads side by side.

For the family resemblance, we cast the youngest generation first and built the older generations around them, using photo boards across all three timelines.

## What the production got

- Four bilingual leads, two cast from London and two from Tokyo
- 42 supporting and featured roles, all native speakers of their scene's language
- A shortlist of dialect coaches for Liverpool and Yokohama speech, booked through our network

> “We stopped worrying about the language scenes in week two.” — Producer, Saltmarsh Films (fictional)`,
    `## ご依頼の内容

『ハーバー・ライツ』は、ある一家の三世代を通して、リバプールと横浜を行き来する物語です。セリフのおよそ4割が日本語、5割が英語で、残りの1割は場面の途中で言語が切り替わります。主演の4人には、どちらの言語でも説得力のある芝居ができること、そして二つの国にまたがる家族として自然に見えることが求められました。

## 探し方

候補者探しは両方のスタジオで同時に進めました。ロンドンでは事務所に加え、日系コミュニティの劇団にも声をかけ、東京ではイギリスでの生活経験や演技の訓練経験がある俳優を中心に探しました。バイリンガルの候補者全員に、それぞれの言語のネイティブの相手役と同じ二つの場面を演じてもらい、プロデューサーには両方の読み合わせを並べて確認していただきました。

家族らしい面影が出るよう、まず最も若い世代を決め、そこから上の世代を組み立てていきました。検討には、三つの時代すべてを並べた写真ボードを使っています。

## 制作にもたらしたもの

- バイリンガルの主演4名（ロンドンから2名、東京から2名）
- 42名の脇役・端役。全員がその場面の言語のネイティブスピーカー
- リバプール訛りと横浜言葉の方言指導者の候補リスト。私たちのネットワークを通じて手配

> 「2週目にはもう、言語面の心配はなくなっていました」——ソルトマーシュ・フィルムズ プロデューサー（架空）`,
  ),
  outcomes: keyed("out", [
    { _type: "stat", value: ls("46", "46"), label: ls("speaking roles cast", "セリフのある役") },
    { _type: "stat", value: ls("4", "4"), label: ls("bilingual leads", "バイリンガルの主演") },
    { _type: "stat", value: ls("9 weeks", "9週間"), label: ls("from breakdown to final offers", "役柄表から最終オファーまで") },
  ]),
  credits: keyed("cr", [
    { _type: "credit", role: ls("Casting director, London", "キャスティングディレクター（ロンドン）"), name: ls("Hannah Ellery", "ハンナ・エラリー") },
    { _type: "credit", role: ls("Casting director, Tokyo", "キャスティングディレクター（東京）"), name: ls("Natsume Arisawa", "有沢なつめ") },
    { _type: "credit", role: ls("Casting associate", "キャスティングアソシエイト"), name: ls("Kenta Oribe", "織部健太") },
  ]),
  services: [ref(SERVICE.film)],
  seo: {
    _type: "seo",
    title: ls("Harbour Lights: bilingual drama casting", "『ハーバー・ライツ』バイリンガル・ドラマのキャスティング"),
    description: lt(
      "How we cast 46 speaking roles and four bilingual leads for Harbour Lights, a UK–Japan drama co-production set in Liverpool and Yokohama.",
      "リバプールと横浜を舞台にした日英共同制作ドラマ『ハーバー・ライツ』で、セリフのある46役とバイリンガルの主演4人をキャスティングした事例です。",
    ),
  },
};

const lanternKeeper = {
  _id: CASE.lantern,
  _type: "caseStudy",
  order: 2,
  title: ls("The Lantern Keeper", "ともしびの番人"),
  slug: slug("the-lantern-keeper"),
  client: ls("Studio Kazahana (fictional)", "スタジオ風花（架空）"),
  year: 2026,
  format: ls("Animated feature, English dub", "長編アニメーション映画（英語吹替版）"),
  locations: ls("Tokyo and London, remote sessions", "東京・ロンドン（リモート収録）"),
  rolesCast: 18,
  summary: lt(
    "An English dub of a Japanese animated feature. We matched 18 voice roles to the original performances, including a lead who ages from eleven to sixty over the course of the film.",
    "日本の長編アニメーション映画の英語吹替版。オリジナルの演技に合わせて18役をキャスティングしました。その中には、物語の中で11歳から60歳まで年を重ねる主人公も含まれます。",
  ),
  heroImage: image("lantern-keeper", "Warm lantern lights floating above layered mountain ridges at dusk.", "夕暮れの山並みの上に浮かぶ、温かな灯籠の光。"),
  video: {
    _type: "video",
    title: ls("The Lantern Keeper voice casting reel", "『ともしびの番人』ボイスキャスティング映像"),
    description: lt(
      "A 15-second abstract clip of drifting lantern light over mountains, made for this demo. No performers and no audio.",
      "山並みの上を漂う灯籠の光を描いた15秒の抽象映像です。デモ用に制作したもので、出演者と音声は含まれていません。",
    ),
    url: "/media/video/lantern-keeper.mp4",
    poster: image("lantern-keeper", "Warm lantern lights floating above layered mountain ridges at dusk.", "夕暮れの山並みの上に浮かぶ、温かな灯籠の光。"),
    durationSeconds: 15,
    uploadDate: "2026-06-10",
    hasAudio: false,
  },
  body: lpt(
    "lk",
    `## The brief

The Lantern Keeper follows a girl who inherits her grandmother's job lighting the lanterns of a mountain village, and grows old doing it. The Japanese original was praised for its restraint. The distributor wanted an English dub that kept that quietness instead of explaining it.

## Voice matching

We broke the original into 64 reference clips and wrote a voice brief for each role in English and Japanese. Shortlisted actors recorded the same three scenes, and the director heard every read next to the original clip.

The lead was the hardest call: one actor for the character's whole life, or two? We tested both. A single actor with a light, unforced voice held the film together, and the director chose her.

## What the production got

- 18 roles cast in five weeks, with no recasting after the first session
- A bilingual voice director in every recording session
- Test reads archived for the distributor's sequel planning`,
    `## ご依頼の内容

『ともしびの番人』は、山あいの村で灯籠をともす祖母の仕事を受け継ぎ、その仕事とともに年を重ねていく少女の物語です。日本語版はその抑制の効いた表現が高く評価されていました。配給会社が求めたのは、その静けさを説明で埋めるのではなく、そのまま保った英語吹替版でした。

## ボイスマッチング

オリジナルを64の参考クリップに分け、役ごとに日英両言語でボイスブリーフを作成しました。候補者には同じ三つの場面を収録してもらい、監督にはすべてのテスト音源をオリジナルのクリップと並べて聴いていただきました。

最も難しかったのは主人公の配役です。生涯を一人の声優が演じるべきか、二人で分けるべきか。両方を試した結果、軽やかで力みのない声を持つ一人の声優が作品全体をまとめられると分かり、監督は彼女を選びました。

## 制作にもたらしたもの

- 5週間で18役のキャスティングを完了。初回収録後の再キャスティングはなし
- すべての収録にバイリンガルのボイスディレクターが立ち会い
- 配給会社の続編企画に向けて、テスト音源をアーカイブ`,
  ),
  outcomes: keyed("out", [
    { _type: "stat", value: ls("18", "18"), label: ls("voice roles cast", "キャスティングした役") },
    { _type: "stat", value: ls("5 weeks", "5週間"), label: ls("from brief to final cast", "ブリーフからキャスト決定まで") },
    { _type: "stat", value: ls("0", "0"), label: ls("recasts after the first session", "初回収録後の再キャスティング") },
  ]),
  credits: keyed("cr", [
    { _type: "credit", role: ls("Voice casting director", "ボイスキャスティングディレクター"), name: ls("Rhys Calloway", "リース・キャロウェイ") },
    { _type: "credit", role: ls("Voice casting, Tokyo", "ボイスキャスティング（東京）"), name: ls("Natsume Arisawa", "有沢なつめ") },
    { _type: "credit", role: ls("Bilingual voice director", "バイリンガル・ボイスディレクター"), name: ls("Mika Sorensen", "ミカ・ソレンセン") },
  ]),
  services: [ref(SERVICE.voice)],
  seo: {
    _type: "seo",
    title: ls("The Lantern Keeper: English dub voice casting", "『ともしびの番人』英語吹替版のボイスキャスティング"),
    description: lt(
      "How we matched 18 English voice roles to the original Japanese performances in The Lantern Keeper, an animated feature.",
      "長編アニメーション映画『ともしびの番人』で、オリジナルの日本語の演技に合わせて英語吹替の18役をキャスティングした事例です。",
    ),
  },
};

export const seedDocuments = [
  siteSettings,
  homePage,
  workPage,
  contactPage,
  filmService,
  commercialsService,
  voiceService,
  harbourLights,
  lanternKeeper,
] as const;

export type SeedDocument = (typeof seedDocuments)[number];
