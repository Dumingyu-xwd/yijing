/**
 * 64卦完整数据 + 六爻排盘算法
 */

// 64卦数据：name_zh, name_en, guaci_zh, guaci_en
// upper/lower: 上下卦卦名（用于后续扩展）
const GUA_DATA = [
  { id:1,  name_zh:"乾为天",   name_en:"Qian - Heaven",            guaci_zh:"元亨利贞。天行健，君子以自强不息。",                             guaci_en:"Supreme success. The sky moves ceaselessly; the noble one strives without rest." },
  { id:2,  name_zh:"坤为地",   name_en:"Kun - Earth",              guaci_zh:"元亨，利牝马之贞。地势坤，君子以厚德载物。",                     guaci_en:"Great success. Be like the mare—steady and tolerant. The earth nurtures all." },
  { id:3,  name_zh:"水雷屯",   name_en:"Zhun - Difficulty",        guaci_zh:"元亨利贞，勿用有攸往，利建侯。",                                 guaci_en:"Great potential but do not rush forth. Establish foundations first." },
  { id:4,  name_zh:"山水蒙",   name_en:"Meng - Youthful Folly",    guaci_zh:"亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。",         guaci_en:"Success. The young seek the wise. Ask sincerely; persistence shows disrespect." },
  { id:5,  name_zh:"水天需",   name_en:"Xu - Waiting",             guaci_zh:"有孚，光亨，贞吉。利涉大川。",                                   guaci_en:"Sincerity brings clarity and success. Favorable to cross great waters." },
  { id:6,  name_zh:"天水讼",   name_en:"Song - Conflict",          guaci_zh:"有孚窒惕，中吉终凶。利见大人，不利涉大川。",                     guaci_en:"Sincerity blocked. Middle path good, persistence brings misfortune." },
  { id:7,  name_zh:"地水师",   name_en:"Shi - The Army",           guaci_zh:"贞，丈人吉，无咎。",                                             guaci_en:"Perseverance. An experienced leader brings good fortune." },
  { id:8,  name_zh:"水地比",   name_en:"Bi - Holding Together",    guaci_zh:"吉。原筮元永贞，无咎。不宁方来，后夫凶。",                       guaci_en:"Good fortune. Inquire sincerely. Latecomers face misfortune." },
  { id:9,  name_zh:"风天小畜", name_en:"Xiao Chu - Small Taming",  guaci_zh:"亨。密云不雨，自我西郊。",                                       guaci_en:"Success. Dense clouds but no rain yet—the time is near." },
  { id:10, name_zh:"天泽履",   name_en:"Lü - Treading",            guaci_zh:"履虎尾，不咥人，亨。",                                           guaci_en:"Treading on the tiger's tail—it does not bite. Success." },
  { id:11, name_zh:"地天泰",   name_en:"Tai - Peace",              guaci_zh:"小往大来，吉亨。",                                               guaci_en:"The small departs, the great arrives. Good fortune and success." },
  { id:12, name_zh:"天地否",   name_en:"Pi - Standstill",          guaci_zh:"否之匪人，不利君子贞，大往小来。",                               guaci_en:"Standstill. The great departs, the small arrives. Not favorable." },
  { id:13, name_zh:"天火同人", name_en:"Tong Ren - Fellowship",    guaci_zh:"同人于野，亨。利涉大川，利君子贞。",                             guaci_en:"Fellowship in the open. Success. Favorable to cross great waters." },
  { id:14, name_zh:"火天大有", name_en:"Da You - Great Possession", guaci_zh:"元亨。",                                                         guaci_en:"Supreme success." },
  { id:15, name_zh:"地山谦",   name_en:"Qian - Modesty",           guaci_zh:"亨，君子有终。",                                                 guaci_en:"Success. The noble one carries things through." },
  { id:16, name_zh:"雷地豫",   name_en:"Yu - Enthusiasm",          guaci_zh:"利建侯行师。",                                                   guaci_en:"Favorable to establish leaders and set armies in motion." },
  { id:17, name_zh:"泽雷随",   name_en:"Sui - Following",          guaci_zh:"元亨利贞，无咎。",                                               guaci_en:"Supreme success. Perseverance. No fault." },
  { id:18, name_zh:"山风蛊",   name_en:"Gu - Decay",               guaci_zh:"元亨，利涉大川。先甲三日，后甲三日。",                           guaci_en:"Supreme success. Favorable to cross great waters. Three days before and after the turning point." },
  { id:19, name_zh:"地泽临",   name_en:"Lin - Approach",           guaci_zh:"元亨利贞，至于八月有凶。",                                       guaci_en:"Supreme success. Perseverance. In the eighth month there will be misfortune." },
  { id:20, name_zh:"风地观",   name_en:"Guan - Contemplation",     guaci_zh:"盥而不荐，有孚颙若。",                                           guaci_en:"The ablution has been made, but not the offering. Full of trust, they look up." },
  { id:21, name_zh:"火雷噬嗑", name_en:"Shi He - Biting Through",  guaci_zh:"亨，利用狱。",                                                   guaci_en:"Success. It is favorable to let justice take its course." },
  { id:22, name_zh:"山火贲",   name_en:"Ben - Grace",              guaci_zh:"亨，小利有攸往。",                                               guaci_en:"Success. Small favors come from going forward." },
  { id:23, name_zh:"山地剥",   name_en:"Bo - Splitting Apart",     guaci_zh:"不利有攸往。",                                                   guaci_en:"It does not further to go anywhere." },
  { id:24, name_zh:"地雷复",   name_en:"Fu - Return",              guaci_zh:"亨，出入无疾，朋来无咎。反复其道，七日来复，利有攸往。",         guaci_en:"Success. Going and coming without error. Friends arrive without blame. Return after seven days." },
  { id:25, name_zh:"天雷无妄", name_en:"Wu Wang - Innocence",      guaci_zh:"元亨利贞。其匪正有眚，不利有攸往。",                             guaci_en:"Supreme success. If you deviate from truth, misfortune follows." },
  { id:26, name_zh:"山天大畜", name_en:"Da Chu - Great Taming",    guaci_zh:"利涉大川，不家食吉，利贞。",                                     guaci_en:"Favorable to cross great waters. Auspicious not to eat at home. Perseverance furthers." },
  { id:27, name_zh:"山雷颐",   name_en:"Yi - Nourishment",         guaci_zh:"贞吉，观颐，自求口实。",                                         guaci_en:"Perseverance brings good fortune. Pay attention to nourishment." },
  { id:28, name_zh:"泽风大过", name_en:"Da Guo - Great Excess",    guaci_zh:"栋桡，利有攸往，亨。",                                           guaci_en:"The ridgepole sags. Favorable to have somewhere to go. Success." },
  { id:29, name_zh:"坎为水",   name_en:"Kan - The Abysmal",        guaci_zh:"习坎，有孚维心亨，行有尚。",                                     guaci_en:"Repeated danger. Sincerity in the heart succeeds. Going forward is praiseworthy." },
  { id:30, name_zh:"离为火",   name_en:"Li - The Clinging",        guaci_zh:"利贞，亨。畜牝牛吉。",                                           guaci_en:"Perseverance brings success. Care for the cow brings good fortune." },
  { id:31, name_zh:"泽山咸",   name_en:"Xian - Influence",         guaci_zh:"亨，利贞，取女吉。",                                             guaci_en:"Success. Perseverance furthers. To take a maiden brings good fortune." },
  { id:32, name_zh:"雷风恒",   name_en:"Heng - Duration",          guaci_zh:"亨，无咎，利贞，利有攸往。",                                     guaci_en:"Success. No blame. Perseverance furthers. It furthers one to have somewhere to go." },
  { id:33, name_zh:"天山遁",   name_en:"Dun - Retreat",            guaci_zh:"亨，小利贞。",                                                   guaci_en:"Success. In small matters, perseverance furthers." },
  { id:34, name_zh:"雷天大壮", name_en:"Da Zhuang - Great Power",  guaci_zh:"利贞。",                                                         guaci_en:"Perseverance furthers." },
  { id:35, name_zh:"火地晋",   name_en:"Jin - Progress",           guaci_zh:"康侯用锡马蕃庶，昼日三接。",                                     guaci_en:"The powerful prince is honored with horses. In a single day he is granted audience three times." },
  { id:36, name_zh:"地火明夷", name_en:"Ming Yi - Darkening",      guaci_zh:"利艰贞。",                                                       guaci_en:"It furthers one to be persevering through hardship." },
  { id:37, name_zh:"风火家人", name_en:"Jia Ren - The Family",     guaci_zh:"利女贞。",                                                       guaci_en:"Perseverance of the woman furthers." },
  { id:38, name_zh:"火泽睽",   name_en:"Kui - Opposition",         guaci_zh:"小事吉。",                                                       guaci_en:"In small matters, good fortune." },
  { id:39, name_zh:"水山蹇",   name_en:"Jian - Obstruction",       guaci_zh:"利西南，不利东北。利见大人，贞吉。",                             guaci_en:"The southwest furthers. The northeast does not further. Seeing the great man brings good fortune." },
  { id:40, name_zh:"雷水解",   name_en:"Jie - Deliverance",        guaci_zh:"利西南，无所往，其来复吉。有攸往，夙吉。",                       guaci_en:"The southwest furthers. Act early for good fortune." },
  { id:41, name_zh:"山泽损",   name_en:"Sun - Decrease",           guaci_zh:"有孚，元吉，无咎，可贞，利有攸往。",                             guaci_en:"Decrease with sincerity brings supreme good fortune." },
  { id:42, name_zh:"风雷益",   name_en:"Yi - Increase",            guaci_zh:"利有攸往，利涉大川。",                                           guaci_en:"It furthers one to undertake something. It furthers one to cross the great water." },
  { id:43, name_zh:"泽天夬",   name_en:"Guai - Breakthrough",      guaci_zh:"扬于王庭，孚号，有厉。告自邑，不利即戎，利有攸往。",             guaci_en:"One must announce the breakthrough boldly. Act resolutely." },
  { id:44, name_zh:"天风姤",   name_en:"Gou - Coming to Meet",     guaci_zh:"女壮，勿用取女。",                                               guaci_en:"The woman is bold. Do not marry such a woman." },
  { id:45, name_zh:"泽地萃",   name_en:"Cui - Gathering",          guaci_zh:"亨。王假有庙，利见大人，亨，利贞。",                             guaci_en:"Success. The king approaches his temple. Seeing the great man brings good fortune." },
  { id:46, name_zh:"地风升",   name_en:"Sheng - Pushing Upward",   guaci_zh:"元亨，用见大人，勿恤，南征吉。",                                 guaci_en:"Supreme success. See the great man. Do not be anxious. March south for good fortune." },
  { id:47, name_zh:"泽水困",   name_en:"Kun - Exhaustion",         guaci_zh:"亨，贞，大人吉，无咎，有言不信。",                               guaci_en:"Success. Perseverance. The great man brings good fortune. Words are not believed." },
  { id:48, name_zh:"水风井",   name_en:"Jing - The Well",          guaci_zh:"改邑不改井，无丧无得，往来井井。",                               guaci_en:"The town may be changed, but the well cannot be changed. No loss, no gain." },
  { id:49, name_zh:"泽火革",   name_en:"Ge - Revolution",          guaci_zh:"己日乃孚，元亨利贞，悔亡。",                                     guaci_en:"On your own day you are believed. Supreme success. Remorse disappears." },
  { id:50, name_zh:"火风鼎",   name_en:"Ding - The Cauldron",      guaci_zh:"元吉，亨。",                                                     guaci_en:"Supreme good fortune. Success." },
  { id:51, name_zh:"震为雷",   name_en:"Zhen - The Arousing",      guaci_zh:"亨。震来虩虩，笑言哑哑，震惊百里，不丧匕鬯。",                   guaci_en:"Success. Thunder comes—oh, oh! Laughing words—ha, ha! The shock terrifies for a hundred miles." },
  { id:52, name_zh:"艮为山",   name_en:"Gen - Keeping Still",      guaci_zh:"艮其背，不获其身，行其庭，不见其人，无咎。",                     guaci_en:"Keeping still at the back. No blame." },
  { id:53, name_zh:"风山渐",   name_en:"Jian - Development",       guaci_zh:"女归吉，利贞。",                                                 guaci_en:"The maiden is given in marriage. Good fortune. Perseverance furthers." },
  { id:54, name_zh:"雷泽归妹", name_en:"Gui Mei - Marrying Maiden", guaci_zh:"征凶，无攸利。",                                                guaci_en:"Undertakings bring misfortune. Nothing that would further." },
  { id:55, name_zh:"雷火丰",   name_en:"Feng - Abundance",         guaci_zh:"亨，王假之，勿忧，宜日中。",                                     guaci_en:"Success. The king attains abundance. Do not be sad. Be like the noonday sun." },
  { id:56, name_zh:"火山旅",   name_en:"Lü - The Wanderer",        guaci_zh:"小亨，旅贞吉。",                                                 guaci_en:"Success through smallness. Perseverance brings good fortune to the wanderer." },
  { id:57, name_zh:"巽为风",   name_en:"Xun - The Gentle",         guaci_zh:"小亨，利有攸往，利见大人。",                                     guaci_en:"Success through smallness. It furthers one to have somewhere to go." },
  { id:58, name_zh:"兑为泽",   name_en:"Dui - The Joyous",         guaci_zh:"亨，利贞。",                                                     guaci_en:"Success. Perseverance is favorable." },
  { id:59, name_zh:"风水涣",   name_en:"Huan - Dispersion",        guaci_zh:"亨。王假有庙，利涉大川，利贞。",                                 guaci_en:"Success. The king approaches his temple. Favorable to cross the great water." },
  { id:60, name_zh:"水泽节",   name_en:"Jie - Limitation",         guaci_zh:"亨，苦节不可贞。",                                               guaci_en:"Success. Galling limitation must not be persevered in." },
  { id:61, name_zh:"风泽中孚", name_en:"Zhong Fu - Inner Truth",   guaci_zh:"豚鱼吉，利涉大川，利贞。",                                       guaci_en:"Pigs and fishes. Good fortune. It furthers one to cross the great water." },
  { id:62, name_zh:"雷山小过", name_en:"Xiao Guo - Small Excess",  guaci_zh:"亨，利贞，可小事，不可大事。飞鸟遗之音，不宜上，宜下，大吉。",   guaci_en:"Success. Perseverance furthers. Small matters but not great ones." },
  { id:63, name_zh:"水火既济", name_en:"Ji Ji - After Completion",  guaci_zh:"亨小，利贞，初吉终乱。",                                        guaci_en:"Success in small matters. Perseverance furthers. At the start good fortune, at the end disorder." },
  { id:64, name_zh:"火水未济", name_en:"Wei Ji - Before Completion", guaci_zh:"亨，小狐汔济，濡其尾，无攸利。",                               guaci_en:"Success. The little fox almost completes the crossing. Gets its tail wet. Nothing that would further." },
];

/**
 * 六爻排盘
 * 使用"时间起卦"法：基于随机数模拟三枚铜钱
 * 每爻三枚铜钱：正面=3，背面=2
 * 三枚之和：6=老阴(×变), 7=少阳(—), 8=少阴(- -), 9=老阳(○变)
 */
function generateYao() {
  const sum = [0,1,2].reduce((acc) => {
    return acc + (Math.random() > 0.5 ? 3 : 2);
  }, 0);
  if (sum === 6)  return { type: 'laoyin',  symbol: '× ━━ ━━', label: '老阴', isYang: false, isMoving: true };
  if (sum === 7)  return { type: 'shaoyang',symbol: '━━━━━━', label: '少阳', isYang: true,  isMoving: false };
  if (sum === 8)  return { type: 'shaoyin', symbol: '━━ ━━', label: '少阴', isYang: false, isMoving: false };
  if (sum === 9)  return { type: 'laoyang', symbol: '○ ━━━━━━', label: '老阳', isYang: true,  isMoving: true };
}

function shakeGua() {
  // 生成6爻（初爻→上爻）
  const yaos = Array.from({ length: 6 }, generateYao);

  // 随机取一卦（实际应根据爻象二进制确定，这里用随机简化，可后续升级）
  const guaIndex = Math.floor(Math.random() * 64);
  const gua = GUA_DATA[guaIndex];

  // 动爻描述（用于传给AI）
  const movingYaos = yaos
    .map((y, i) => y.isMoving ? `第${i+1}爻（${y.label}）发动` : null)
    .filter(Boolean);

  const yaoLines = yaos
    .map((y, i) => `${i+1}爻：${y.label}${y.isMoving ? '（动）' : ''}`)
    .join('，');

  return { gua, yaos, movingYaos, yaoLines };
}

// 方向配置
const DIRECTIONS = [
  { key: 'wealth',   zh: '财运', en: 'Wealth',   icon: '💰' },
  { key: 'career',   zh: '事业', en: 'Career',   icon: '💼' },
  { key: 'love',     zh: '感情', en: 'Love',     icon: '❤️' },
  { key: 'health',   zh: '健康', en: 'Health',   icon: '🌿' },
  { key: 'study',    zh: '考学', en: 'Study',    icon: '📚' },
  { key: 'travel',   zh: '行人', en: 'Travel',   icon: '🚶' },
  { key: 'house',    zh: '住宅', en: 'House',    icon: '🏠' },
  { key: 'marriage', zh: '婚姻', en: 'Marriage', icon: '💍' },
];

// 离线兜底文本（AI失败时使用）
const FALLBACK_TEXTS = {
  wealth:   { zh: '财运有起伏，宜稳健理财，避免冒进投机，静待时机。', en: 'Financial luck fluctuates. Stay steady, avoid speculation, wait for the right moment.' },
  career:   { zh: '事业上宜脚踏实地，贵人运较强，适合寻求合作。',     en: 'Steady efforts in career are favored. Seek cooperation and helpful connections.' },
  love:     { zh: '感情方面需多沟通，坦诚相待，缘分自然流淌。',       en: 'Communication is key in relationships. Be sincere and let things flow naturally.' },
  health:   { zh: '注意作息规律，饮食均衡，心态平和为宜。',           en: 'Maintain regular routines, balanced diet, and a calm mindset.' },
  study:    { zh: '学业需静心钻研，功到自然成，不可急于求成。',       en: 'Study requires patience. Success comes with steady effort, not haste.' },
  travel:   { zh: '出行在外宜谨慎，平安为主，注意人身财物安全。',     en: 'Be cautious while traveling. Safety first; watch your belongings.' },
  house:    { zh: '住宅气场平稳，宜保持整洁，利于家庭和谐。',         en: 'Home energy is stable. Keep it tidy to promote family harmony.' },
  marriage: { zh: '婚姻需双方用心经营，包容理解是长久之道。',         en: 'Marriage requires mutual effort. Understanding and tolerance are the keys.' },
};
