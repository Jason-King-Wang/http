export type TarotCard = {
  roman: string;
  name: string;
  image: string;
  upright: string;
  reversed: string;
  love: string;
  career: string;
  score: number;
};

export type Spread = {
  slug: string;
  key: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  prompt: string;
  button: string;
  cardCount: number;
  positions: string[];
  intro: string[];
  faqs: { question: string; answer: string }[];
};

export const tarotCards: TarotCard[] = [
  { roman: "0", name: "愚者", image: "fool.webp", upright: "新的可能正在打開，先用好奇心踏出一小步。", reversed: "衝動可能遮住風險，先確認現實條件再行動。", love: "讓關係自然發展，不必急著替彼此下定義。", career: "適合嘗試新方法，但先設定可承受的試錯範圍。", score: 1 },
  { roman: "I", name: "魔術師", image: "magician.webp", upright: "你已有足夠資源，下一步是把想法變成行動。", reversed: "注意說得比做得多，回到可驗證的進度。", love: "主動表達有幫助，但真誠比技巧更重要。", career: "整合手上的工具與人脈，先完成最小可行版本。", score: 1 },
  { roman: "II", name: "女祭司", image: "high-priestess.webp", upright: "答案還在醞釀，安靜觀察會比急著回應更清楚。", reversed: "別讓猜測取代資訊，釐清事實後再判斷。", love: "有些感受尚未說出口，先給彼此安全的空間。", career: "留意未明說的訊息，同時避免只憑直覺做重大決定。", score: 0 },
  { roman: "III", name: "皇后", image: "empress.webp", upright: "照顧好身體與環境，創意會在穩定中成長。", reversed: "舒服不等於前進，別把照顧變成拖延。", love: "溫柔、穩定與實際照顧比逼問更有效。", career: "適合培養品牌、內容或長期關係，重視品質。", score: 1 },
  { roman: "IV", name: "皇帝", image: "emperor.webp", upright: "建立規則與優先順序，穩定結構能讓事情前進。", reversed: "過度控制會讓局面僵化，保留調整空間。", love: "安全感需要承諾，也需要尊重彼此的自主性。", career: "先定責任、期限與標準，再推進複雜工作。", score: 1 },
  { roman: "V", name: "教皇", image: "hierophant.webp", upright: "成熟的方法與可信任的建議能幫你少走彎路。", reversed: "傳統做法未必適合現在，理解原則後再調整。", love: "確認雙方對承諾、價值與關係形式的期待。", career: "適合尋求導師、標準流程或專業認證。", score: 0 },
  { roman: "VI", name: "戀人", image: "lovers.webp", upright: "重要選擇需要價值一致，而不只是當下感受。", reversed: "猶豫可能來自內外不一致，先說清真正想要的。", love: "誠實討論選擇與界線，關係才有清楚方向。", career: "合作機會值得評估，關鍵是目標與利益是否一致。", score: 1 },
  { roman: "VII", name: "戰車", image: "chariot.webp", upright: "聚焦方向並保持節奏，你有能力把局面往前推。", reversed: "速度太快容易失控，先校正方向再加速。", love: "積極可以，但不要把關係變成輸贏。", career: "把資源集中在最重要的里程碑，避免多線失焦。", score: 1 },
  { roman: "VIII", name: "力量", image: "strength.webp", upright: "柔韌與耐心比硬碰硬更能處理眼前問題。", reversed: "自我懷疑正在消耗能量，先縮小任務再重建信心。", love: "用穩定的態度面對情緒，不必壓抑也不必爆發。", career: "耐心處理阻力，真正的影響力來自持續與可信任。", score: 1 },
  { roman: "IX", name: "隱者", image: "hermit.webp", upright: "暫時退一步整理思緒，獨處能帶來更清楚的判斷。", reversed: "別讓沉思變成孤立，必要時找可信任的人討論。", love: "需要空間不代表拒絕，記得清楚說明你的需要。", career: "適合研究、複盤與深度工作，不宜被雜訊牽著走。", score: 0 },
  { roman: "X", name: "命運之輪", image: "wheel-of-fortune.webp", upright: "環境正在變化，抓住可控的部分順勢調整。", reversed: "不確定性升高，保留資源與備案會更安全。", love: "互動節奏可能改變，先觀察變化而不是急著定論。", career: "市場或組織變動帶來機會，也要求更快調整策略。", score: 1 },
  { roman: "XI", name: "正義", image: "justice.webp", upright: "回到事實、責任與公平，清楚標準會帶來答案。", reversed: "偏見或資訊不完整可能影響判斷，先補齊證據。", love: "坦白討論付出、責任與界線，避免只看單方面感受。", career: "合約、數字與規則需要仔細核對，別靠模糊承諾。", score: 0 },
  { roman: "XII", name: "吊人", image: "hanged-man.webp", upright: "暫停不是失敗，換個角度可能看見原本忽略的選項。", reversed: "長期等待若沒有新資訊，就需要重新設定期限。", love: "先停止拉扯，理解彼此立場後再決定下一步。", career: "短暫停下重新定義問題，比勉強推進更有效。", score: -1 },
  { roman: "XIII", name: "死神", image: "death.webp", upright: "一個階段正在結束，清理舊結構才能讓新事物進來。", reversed: "抗拒改變會延長消耗，先接受已經無法維持的部分。", love: "關係需要明確轉變；可能是更新模式，也可能是告別。", career: "停止低效做法，重新配置時間與資源。", score: -1 },
  { roman: "XIV", name: "節制", image: "temperance.webp", upright: "把不同需求調成可持續的比例，事情會逐步穩定。", reversed: "失衡正在累積，先調整時間、情緒或資源分配。", love: "用小步溝通修復節奏，不必一次解決所有問題。", career: "適合整合流程、協調團隊與建立長期節奏。", score: 1 },
  { roman: "XV", name: "惡魔", image: "devil.webp", upright: "看見讓你上癮、恐懼或被綁住的模式，選擇權才會回來。", reversed: "你已開始辨認束縛，下一步是建立替代行動。", love: "留意控制、依賴與不對等，不把強烈吸引當成安全。", career: "警覺沉沒成本與短期誘惑，重新檢查真正代價。", score: -1 },
  { roman: "XVI", name: "高塔", image: "tower.webp", upright: "舊有假設受到衝擊，先處理安全與事實，再談重建。", reversed: "問題已露出裂縫，主動修正能降低後續損失。", love: "突發真相需要誠實面對，避免用否認維持表面和平。", career: "準備應變方案，先保護關鍵資料、現金與核心工作。", score: -1 },
  { roman: "XVII", name: "星星", image: "star.webp", upright: "希望正在恢復，保持真誠並持續做小而穩定的行動。", reversed: "暫時看不到成果不代表沒有進展，回到可量化的小步驟。", love: "願意坦露真實感受，關係有機會重新建立信任。", career: "適合長期品牌、創作與願景工作，避免只追短期數字。", score: 1 },
  { roman: "XVIII", name: "月亮", image: "moon.webp", upright: "情緒與未知放大了不安，先分辨感受和事實。", reversed: "迷霧正在散去，但仍需查證，不要急著做最壞解讀。", love: "曖昧與猜測增加，直接而溫和的溝通很重要。", career: "資訊可能不透明，重大承諾前要做盡職確認。", score: -1 },
  { roman: "XIX", name: "太陽", image: "sun.webp", upright: "局面較為清楚，適合公開成果、合作與向前推進。", reversed: "好消息仍在，但期待過高可能忽略細節。", love: "坦率與共同活動能增加連結，讓快樂回到關係裡。", career: "成果容易被看見，適合展示、提案與建立信任。", score: 1 },
  { roman: "XX", name: "審判", image: "judgement.webp", upright: "過去經驗正在召喚你做出更成熟的選擇。", reversed: "自責會妨礙改變，檢討之後要轉成具體行動。", love: "需要誠實回顧舊模式，再決定是否重新開始。", career: "適合複盤、轉型與做出重要職涯決定。", score: 0 },
  { roman: "XXI", name: "世界", image: "world.webp", upright: "一個循環逐漸完成，適合收尾、整合並準備下一階段。", reversed: "還有少數未完成事項，整理清單後逐一關閉。", love: "關係進入較完整的階段，適合確認共同方向。", career: "專案接近完成，重視交付品質、紀錄與成果擴散。", score: 1 },
];

export const spreads: Spread[] = [
  { slug: "daily-tarot", key: "daily", title: "每日一張塔羅牌", shortTitle: "每日塔羅", eyebrow: "一天一張", description: "抽一張大阿爾克那牌，整理今天的提醒、注意事項與一個可執行的小步驟。", prompt: "今天我最需要留意什麼？", button: "抽今日塔羅", cardCount: 1, positions: ["今日提醒"], intro: ["每日塔羅適合用來整理注意力，不是預測一整天必然發生的事情。", "抽牌後先讀牌義，再選一個今天能完成的小行動；晚上可以回來檢查哪些部分真的與你有關。"], faqs: [{ question: "每天可以抽很多次嗎？", answer: "可以，但反覆抽到滿意答案容易失去參考價值。建議同一問題一天一次。" }, { question: "抽到負向牌就是壞事嗎？", answer: "不是。它通常比較像風險提示，讓你提早看見需要調整的地方。" }] },
  { slug: "yes-no-tarot", key: "yesno", title: "是或否塔羅占卜", shortTitle: "是或否", eyebrow: "快速整理", description: "輸入一個具體問題，抽一張牌理解目前偏向、條件與需要留意的限制。", prompt: "在目前條件下，我適合採取這個行動嗎？", button: "抽一張答案牌", cardCount: 1, positions: ["目前傾向"], intro: ["塔羅不適合替你做不可逆的重大決策，但可以幫你看見支持條件與阻力。", "把問題寫成可行動、可調整的句子，會比問固定命運得到更有用的答案。"], faqs: [{ question: "牌會直接回答是或否嗎？", answer: "這裡會提供偏向可以、條件未明或先暫停的解讀，同時保留現實條件。" }, { question: "能問健康、法律或投資嗎？", answer: "不建議把占卜當專業意見；相關決策請諮詢合格專業人士。" }] },
  { slug: "love-tarot", key: "love", title: "感情塔羅三張牌", shortTitle: "感情三張", eyebrow: "關係整理", description: "用三張牌整理你的狀態、關係線索與下一步，適合曖昧、溝通與相處問題。", prompt: "這段關係現在最需要我看見什麼？", button: "抽感情三張牌", cardCount: 3, positions: ["我的狀態", "關係線索", "下一步建議"], intro: ["感情牌陣的價值在於釐清自己的感受、界線與可採取的行動，而不是猜測對方腦中唯一的答案。", "如果關係涉及暴力、威脅或控制，請優先尋求可信任的人與專業資源協助。"], faqs: [{ question: "可以看復合嗎？", answer: "可以用來整理復合需要哪些條件，但不能保證對方的選擇或未來結果。" }, { question: "要把對方名字輸入嗎？", answer: "不用，也不建議輸入可識別他人的個人資料。" }] },
  { slug: "three-card-tarot", key: "three", title: "過去現在未來塔羅三張牌", shortTitle: "過去現在未來", eyebrow: "經典三張", description: "從過去影響、目前局面與接下來的可能走向，快速整理一件事的脈絡。", prompt: "這件事從哪裡來，現在在哪裡，下一步會怎麼發展？", button: "抽三張牌", cardCount: 3, positions: ["過去影響", "現在狀態", "可能走向"], intro: ["三張牌最適合界線清楚、時間範圍不太長的問題。", "第三張呈現的是目前條件延續下的可能走向，不是不可改變的結局。"], faqs: [{ question: "未來牌一定會發生嗎？", answer: "不一定。行動與環境改變時，結果也會改變。" }, { question: "問題要設定多久？", answer: "建議設定數週到三個月，範圍越清楚越容易形成可行動的解讀。" }] },
  { slug: "career-tarot", key: "career", title: "事業工作塔羅三張牌", shortTitle: "工作塔羅", eyebrow: "職涯整理", description: "整理目前局勢、主要阻力與下一步行動，適合工作、接案、轉職與合作問題。", prompt: "我目前的工作局面，下一步最值得做什麼？", button: "抽工作三張牌", cardCount: 3, positions: ["目前局勢", "阻力與資源", "下一步行動"], intro: ["工作塔羅可以協助整理思考，但薪資、合約、投資與轉職仍要回到具體資訊。", "把牌義轉成一項可驗證的行動，例如蒐集職缺、更新作品集或確認合作條款。"], faqs: [{ question: "可以問要不要離職嗎？", answer: "可以整理考量因素，但請同時評估財務緩衝、職缺與合約等現實條件。" }, { question: "可以預測收入嗎？", answer: "不適合預測精確收入。請用實際數字、合約與市場資料評估。" }] },
  { slug: "five-card-tarot", key: "five", title: "五張牌深入塔羅牌陣", shortTitle: "五張牌", eyebrow: "深入拆解", description: "拆開現況、根源、隱藏影響、可採取行動與可能走向。", prompt: "這件事真正卡住的原因是什麼？", button: "抽五張牌", cardCount: 5, positions: ["現況", "根本原因", "隱藏影響", "可採取行動", "可能走向"], intro: ["五張牌比三張牌提供更多結構，適合已經思考一段時間但仍卡住的議題。", "解讀時先看每個位置，再找重複主題；不要把每張牌拆成互不相關的預言。"], faqs: [{ question: "五張牌適合新手嗎？", answer: "可以。依照位置逐張閱讀，最後只整理一到兩個主要主題即可。" }, { question: "結果互相矛盾怎麼辦？", answer: "矛盾通常代表不同層次或不同條件，先分清內在感受、外在現況與可控行動。" }] },
  { slug: "love-five-card-tarot", key: "loveFive", title: "感情塔羅五張牌", shortTitle: "感情五張", eyebrow: "關係深入", description: "整理你的心態、互動狀態、關係阻礙、可修正之處與短期走向。", prompt: "這段關係的核心問題與可改善之處是什麼？", button: "抽感情五張牌", cardCount: 5, positions: ["我的心態", "互動狀態", "關係阻礙", "可修正之處", "短期走向"], intro: ["五張牌適合比三張牌更複雜的關係問題，例如反覆爭執、冷淡或界線不清。", "它不能替對方承諾，也不應用來監控或推測他人的私密資訊。"], faqs: [{ question: "可以看第三者嗎？", answer: "不建議用塔羅查證他人的私密行為。若有信任問題，應回到事實與直接溝通。" }, { question: "抽到很多逆位代表會分手嗎？", answer: "不代表必然分手，較可能表示溝通、信任或行動條件需要處理。" }] },
  { slug: "seven-card-tarot", key: "seven", title: "七張牌完整塔羅牌陣", shortTitle: "七張牌", eyebrow: "完整視角", description: "從表面、深層、環境、阻礙、資源、建議與短期走向，完整整理一個局面。", prompt: "這個局面有哪些我看見與尚未看見的因素？", button: "抽七張牌", cardCount: 7, positions: ["表面狀態", "深層動機", "外在環境", "主要阻礙", "可用資源", "行動建議", "短期走向"], intro: ["七張牌適合牽涉多個因素的局面，但問題仍要保持單一主題。", "牌越多不代表越準；請把結果收斂成幾個可驗證的觀察與行動。"], faqs: [{ question: "一次可以問兩件事嗎？", answer: "不建議。把問題拆開，才能看清每個局面的因果與行動。" }, { question: "多久可以再抽一次？", answer: "等到條件或行動有實質改變後再抽，通常比立即重抽更有價值。" }] },
  { slug: "celtic-cross-tarot", key: "celtic", title: "凱爾特十字塔羅", shortTitle: "凱爾特十字", eyebrow: "經典十張", description: "用十張牌整理核心現況、阻礙、根基、過去、目標、近未來與可能結果。", prompt: "我需要如何完整理解並處理這個重要議題？", button: "抽凱爾特十字", cardCount: 10, positions: ["核心現況", "交叉阻礙", "深層根基", "近期過去", "意識目標", "近未來", "你的立場", "外在環境", "希望與恐懼", "可能結果"], intro: ["凱爾特十字適合重要且複雜的議題，不適合只想快速得到是或否。", "先讀核心與阻礙，再看過去到未來的時間線，最後把個人立場、環境與結果整合。"], faqs: [{ question: "凱爾特十字越多牌越準嗎？", answer: "它提供的是更完整的分析框架，不代表能精確預測未來。" }, { question: "結果牌不好怎麼辦？", answer: "把它視為目前條件的風險訊號，回頭找可調整的位置與資源。" }] },
  { slug: "yearly-tarot", key: "yearly", title: "年度十二個月塔羅", shortTitle: "年度十二張", eyebrow: "年度節奏", description: "一次抽十二張牌，為未來十二個月建立提醒、觀察重點與回顧節奏。", prompt: "未來十二個月，我每個月最值得留意什麼？", button: "抽年度十二張牌", cardCount: 12, positions: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"], intro: ["年度牌陣適合做回顧與計畫提示，不應取代財務、健康或人生規劃。", "建議保存每月一個關鍵字，月底再回來核對實際經驗，而不是提前把牌義當成事件預告。"], faqs: [{ question: "一定要一月才能抽嗎？", answer: "不用。也可以從當月開始，把十二張依序視為接下來十二個月。" }, { question: "可以用年度牌陣選投資嗎？", answer: "不建議。投資需要風險評估與合格專業意見，塔羅只能作為自我整理。" }] },
];

export function getSpread(slug: string) {
  return spreads.find((spread) => spread.slug === slug);
}
