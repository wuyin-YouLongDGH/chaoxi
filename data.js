/* ============================================================
   潮汐 Tide · 数据层
   情绪库 / 触发因素库 / 身体感受库 / 自助关怀方案库
   ============================================================ */

const EMOTIONS = [
  {
    key: 'joy', name: '喜悦', short: '喜', tone: 'pos',
    color: '#E0A03C', soft: '#FBF1DC', icon: '☀',
    items: [
      { key: 'happy',   name: '开心',   note: '事情顺了，心情轻' },
      { key: 'content', name: '满足',   note: '够了，不缺什么' },
      { key: 'expect',  name: '期待',   note: '有件事在等着我' },
      { key: 'moved',   name: '感动',   note: '被谁触到了' },
      { key: 'proud',   name: '自豪',   note: '我做到了' }
    ]
  },
  {
    key: 'calm', name: '平静', short: '静', tone: 'pos',
    color: '#4F9E86', soft: '#E4F3EE', icon: '◍',
    items: [
      { key: 'peace',   name: '平静',   note: '没有波澜，挺好' },
      { key: 'relax',   name: '放松',   note: '身体松下来了' },
      { key: 'focus',   name: '专注',   note: '只在做这一件事' },
      { key: 'blank',   name: '空',     note: '说不上来，像白纸', tone: 'neutral' }
    ]
  },
  {
    key: 'sad', name: '悲伤', short: '悲', tone: 'neg',
    color: '#5B7FB8', soft: '#E6EDF8', icon: '☂',
    items: [
      { key: 'down',     name: '低落',   note: '提不起劲' },
      { key: 'wronged',  name: '委屈',   note: '不是我的错' },
      { key: 'loss',     name: '失落',   note: '少了点什么' },
      { key: 'lonely',   name: '孤独',   note: '没人接着我' },
      { key: 'powerless',name: '无力',   note: '做什么都没用' }
    ]
  },
  {
    key: 'fear', name: '焦虑', short: '焦', tone: 'neg',
    color: '#8A6BB0', soft: '#F0EAF8', icon: '🌀',
    items: [
      { key: 'anxious', name: '焦虑',   note: '脑子里停不下来' },
      { key: 'tense',   name: '紧张',   note: '身体绷着' },
      { key: 'worry',   name: '担忧',   note: '怕某件事发生' },
      { key: 'panic',   name: '恐慌',   note: '快兜不住了' },
      { key: 'uneasy',  name: '不安',   note: '说不清哪里不对' }
    ]
  },
  {
    key: 'anger', name: '愤怒', short: '怒', tone: 'neg',
    color: '#D0684F', soft: '#FAE7E1', icon: '⚡',
    items: [
      { key: 'annoyed', name: '烦躁',   note: '一点就着' },
      { key: 'angry',   name: '生气',   note: '被冒犯了' },
      { key: 'rage',    name: '愤怒',   note: '压不住的火' },
      { key: 'unfair',  name: '不公',   note: '凭什么是我' }
    ]
  },
  {
    key: 'disgust', name: '厌恶', short: '厌', tone: 'neg',
    color: '#8A7F76', soft: '#EFEBE8', icon: '⊘',
    items: [
      { key: 'tired',    name: '厌烦',   note: '腻了，不想再碰' },
      { key: 'reject',   name: '嫌弃',   note: '看着就烦' },
      { key: 'selfhate', name: '自我厌恶', note: '对自己很失望' }
    ]
  }
];

/* 触发因素：分组 + 标签。全部为点击选择，不需要打字 */
const TRIGGERS = [
  { group: '学业 / 工作', key: 'study', items: [
    { key: 'exam',     name: '考试 / 成绩' },
    { key: 'task',     name: '手头的事' },
    { key: 'deadline', name: '截止时间' },
    { key: 'slow',     name: '进度不如预期' },
    { key: 'eval',     name: '被评价 / 考核' }
  ]},
  { group: '人际', key: 'social', items: [
    { key: 'friends',   name: '朋友' },
    { key: 'classmate', name: '同学 / 同事' },
    { key: 'stranger',  name: '陌生人' },
    { key: 'crowd',     name: '社交场合' },
    { key: 'conflict',  name: '被误解 / 冲突' }
  ]},
  { group: '亲密关系', key: 'love', items: [
    { key: 'partner', name: '伴侣 / 暧昧对象' },
    { key: 'breakup', name: '被冷落 / 分开' },
    { key: 'family',  name: '家人' }
  ]},
  { group: '身体状态', key: 'body', items: [
    { key: 'sleepless', name: '睡眠不足' },
    { key: 'sick',      name: '生病 / 不舒服' },
    { key: 'exhaust',   name: '太累了' },
    { key: 'eat',       name: '饮食不规律' }
  ]},
  { group: '自我', key: 'self', items: [
    { key: 'compare',  name: '和别人比较' },
    { key: 'doubt',    name: '怀疑自己' },
    { key: 'looks',    name: '外貌 / 身材' },
    { key: 'future',   name: '对未来迷茫' },
    { key: 'money',    name: '钱' }
  ]},
  { group: '环境', key: 'env', items: [
    { key: 'weather', name: '天气' },
    { key: 'noise',   name: '噪音 / 拥挤' },
    { key: 'screen',  name: '手机 / 屏幕' }
  ]}
];

/* 滋养源标签 —— 记录好情绪时用的另一套。
   上面那套回答的是「什么在压着你」（压力源），这套回答的是「什么在托着你」（滋养源）。
   两者不能混用：问题导向的词放在好情绪场景里既选不出来（选项太少），
   也会污染「好情绪和什么有关」——那一栏要的是"什么事让我状态变好"，不是"什么事让我烦"。
   key 与 TRIGGERS 刻意不重复，因此两套可以共用一个名称查找表。 */
const SPARKS = [
  { group: '学业 / 工作', items: [
    { key: 'done',     name: '完成了一件事' },
    { key: 'progress', name: '事情有进展' },
    { key: 'praise_',  name: '被认可 / 表扬' },
    { key: 'learn',    name: '学到新东西' },
    { key: 'flow',     name: '进入状态了' }
  ]},
  { group: '人际', items: [
    { key: 'connect',    name: '和人聊得来' },
    { key: 'understood', name: '被理解' },
    { key: 'helpother',  name: '帮到了别人' },
    { key: 'hangout',    name: '一起玩了' }
  ]},
  { group: '亲密关系', items: [
    { key: 'cared',   name: '被关心' },
    { key: 'company', name: '有人陪着' },
    { key: 'reached', name: '收到消息 / 有联系' }
  ]},
  { group: '身体状态', items: [
    { key: 'slept', name: '睡够了' },
    { key: 'meal',  name: '吃了顿好的' },
    { key: 'sport', name: '动了动 / 运动' },
    { key: 'rest',  name: '休息够了' }
  ]},
  { group: '自我', items: [
    { key: 'achieve', name: '做成了点什么' },
    { key: 'accept',  name: '对自己满意' },
    { key: 'insight', name: '想通了一件事' },
    { key: 'pause',   name: '慢下来了' }
  ]},
  { group: '环境', items: [
    { key: 'outside', name: '出门了 / 在户外' },
    { key: 'place',   name: '待着舒服的地方' },
    { key: 'media',   name: '音乐 / 书 / 剧' },
    { key: 'quiet',   name: '有独处的时间' }
  ]}
];

const BODY_SIGNS = [
  { key: 'heart',  name: '心跳快' },
  { key: 'breath', name: '呼吸急促' },
  { key: 'chest',  name: '胸口发闷' },
  { key: 'shoulder', name: '肩颈紧绷' },
  { key: 'head',   name: '头痛 / 发胀' },
  { key: 'stomach',name: '胃不舒服' },
  { key: 'weak',   name: '疲惫无力' },
  { key: 'cold',   name: '手脚发凉' },
  { key: 'cry',    name: '想哭' },
  { key: 'fidget', name: '坐立不安' },
  { key: 'light',  name: '身体轻松' },
  { key: 'warm',   name: '暖和踏实' }
];

/* ---------------- 自助关怀方案库 ----------------
   for:  适用的情绪大类
   lv:   适用强度区间 [min, max]
   min:  最短耗时（分钟）
   why:  一句话原理（可溯源，不玄学）
   steps: 可逐步执行的引导
--------------------------------------------------- */
const METHODS = [
  /* ---- 呼吸类：高唤醒负面情绪（焦虑/愤怒/恐慌）---- */
  { id: 'breath478', cat: '呼吸', name: '4-7-8 呼吸', dur: 4,
    for: ['fear', 'anger'], lv: [5, 10],
    why: '延长呼气会激活副交感神经，把身体从「备战」切回「休息」。',
    steps: ['舌尖顶住上颚，用鼻子吸气 4 秒', '屏住 7 秒', '用嘴缓缓吐出 8 秒，像吹蜡烛',
            '重复 4 轮，不用数得特别准，呼气比吸气长就有效'],
    anim: '478' },
  { id: 'box', cat: '呼吸', name: '方块呼吸', dur: 3,
    for: ['fear', 'anger', 'study'], lv: [3, 8],
    why: '固定节奏的呼吸能给混乱的注意力一个可预测的锚点。',
    steps: ['吸气 4 秒', '停 4 秒', '呼气 4 秒', '停 4 秒', '循环 6 次'],
    anim: 'box' },
  { id: 'sigh', cat: '呼吸', name: '生理性叹息', dur: 1,
    for: ['fear', 'anger'], lv: [6, 10],
    why: '两次连吸 + 一次长呼，是身体自带的减压阀，见效最快。',
    steps: ['鼻子吸一口', '不吐气，再补吸一小口', '用嘴长长地呼出去，把气吐干净', '做 3 次'],
    anim: 'sigh' },

  /* ---- 冥想 / 正念 ---- */
  { id: 'scan', cat: '冥想', name: '5 分钟身体扫描', dur: 5,
    for: ['sad', 'fear', 'disgust'], lv: [3, 9],
    why: '把注意力从「想法」搬到「身体」，反刍会自然慢下来。',
    steps: ['躺下或坐稳，闭眼', '注意力放在脚底，感受温度与重量',
            '慢慢向上移到小腿、大腿、腹部、胸口、肩膀、脸',
            '不评价，只陈述：这里紧，这里暖', '到头顶后，整体感受一次身体'] },
  { id: 'loving', cat: '冥想', name: '慈心练习', dur: 4,
    for: ['disgust', 'sad'], lv: [4, 10],
    why: '自我关怀不是纵容，是把自己当作「正在经历困难的人」来对待。这是 Kristin Neff 自我关怀三要素的第一条：自我友善。',
    steps: ['一只手放在胸口，感受掌心的温度',
            '在心里说：这件事很难，我现在很难受',
            '再说：难受是人之常情，不是只有我会这样',
            '最后说：我愿对自己少一点苛责',
            '如果第一句说不出口，可以先换成「我希望有一天我能对你好一点」'] },
  { id: 'observe', cat: '冥想', name: '十分钟只数呼吸', dur: 6,
    for: ['fear'], lv: [2, 7],
    why: '走神不是失败，发现走神再回来，就是一次有效的训练。',
    steps: ['坐直，不追求清空大脑', '呼吸，每次呼气默数 1，数到 10 再从 1 开始',
            '走神了就笑一下，从 1 重新数', '重点不是数对，是「回来」这个动作'] },

  /* ---- 运动 / 身体 ---- */
  { id: 'burst', cat: '运动', name: '3 分钟高强度发泄', dur: 3,
    for: ['anger'], lv: [5, 10],
    why: '愤怒是能量，压下去会转向内。先让它有出口，再谈道理。',
    steps: ['开合跳 / 深蹲 / 原地快跑任选', '30 秒全力，休息 20 秒', '重复 4 轮',
            '结束后大口喘气，感受心跳慢慢降下来'] },
  { id: 'walk', cat: '运动', name: '下楼走 10 分钟', dur: 10,
    for: ['sad', 'disgust'], lv: [3, 8],
    why: '反刍在静止时最强。走路会占用一部分工作记忆，把循环打断。',
    steps: ['不带目的地，手机可以带但别刷', '刻意放慢，注意脚踩到地面的感觉',
            '如果脑子又转起来，就把注意力放回脚步声', '回来时不用「想通了」，走完就够了'] },
  { id: 'stretch', cat: '运动', name: '肩颈与下颌放松', dur: 4,
    for: ['fear', 'anger'], lv: [2, 7],
    why: '情绪紧绷会先落在肩颈和咬肌，松开它们，脑会收到「安全」的信号。',
    steps: ['肩膀耸到耳朵，停 5 秒，突然放下，做 3 次',
            '头缓慢向左倒，停 3 次呼吸，换边', '牙关松开，舌头离开上颚',
            '手掌搓热，捂在眼睛上 20 秒'] },
  { id: 'sun', cat: '运动', name: '去太阳底下站 5 分钟', dur: 5,
    for: ['sad', 'disgust'], lv: [2, 7],
    why: '自然光会调节昼夜节律与血清素水平，对情绪低落的即时改善有稳定证据。',
    steps: ['出门或到阳台，让皮肤接触光线', '别戴墨镜（可以戴帽子）',
            '闭眼抬头 1 分钟，感受热和风', '不用做别的，站着就行'] },

  /* ---- 音乐 / 声音 ---- */
  { id: 'iso', cat: '音乐', name: '先同步，再引导', dur: 15,
    for: ['sad', 'fear', 'anger'], lv: [3, 9],
    why: 'ISO 原理：直接听治愈的歌会「假」，先听贴合当下情绪的音乐，再慢慢过渡到平静的曲目，情绪才跟得上。',
    steps: ['第 1 步（5 分钟）：挑一首和你现在心情同频的歌，循环',
            '第 2 步（5 分钟）：换成节奏稍缓、配器更简单的曲子',
            '第 3 步（5 分钟）：换成纯器乐或环境音',
            '关键是不跳步，让情绪自己走完这段路'] },
  { id: 'noise', cat: '音乐', name: '自然声 / 白噪音', dur: 10,
    for: ['fear', 'disgust'], lv: [2, 8],
    why: '持续、无信息量的声音会降低大脑的威胁扫描频率。',
    steps: ['选雨声、海浪、风扇声中你最不排斥的一个', '音量调到刚好盖过环境噪音',
            '可以同时做身体扫描或准备睡觉'] },

  /* ---- 书写 ---- */
  { id: 'write', cat: '书写', name: '10 分钟表达性书写', dur: 12,
    for: ['sad', 'anger', 'fear'], lv: [4, 10],
    why: 'Pennebaker 的表达性写作研究：连续几天把情绪写成文字，身心指标会改善。写给自己看，不修饰。',
    steps: ['设 10 分钟倒计时', '写下此刻发生的事和你的感受，不用通顺',
            '不评价对错，不找原因，只写「发生了什么、我什么感觉」',
            '时间到就停，不要回读、不要修改'] },
  { id: 'friendletter', cat: '书写', name: '如果这事发生在朋友身上', dur: 8,
    for: ['disgust', 'sad'], lv: [5, 10],
    why: '我们对朋友的语气，总是比自己宽容。用「第三人称」写，能绕过自我攻击的惯性。',
    steps: ['把当前困境写成两句话', '以「如果我最好的朋友遇到这件事，我会对他说……」开头',
            '写满一页，写你能对朋友说出口的那种话', '写完后，把最后一句读给自己听一遍'] },
  { id: 'reframe', cat: '书写', name: '三栏认知表', dur: 10,
    for: ['fear'], lv: [4, 9],
    why: '焦虑常常来自「自动思维」。把它写下来摊在纸上，它就没那么像事实了。',
    steps: ['第一栏：我脑子里的那句话（例：这次一定搞砸了）',
            '第二栏：支持它的证据 / 反对它的证据，各写一条',
            '第三栏：更接近事实的说法（例：我准备得不够，但不等于必然失败）',
            '不要求自己相信第三栏，先让它存在'] },

  /* ---- 感官 / 即刻平复 ---- */
  { id: '54321', cat: '感官', name: '5-4-3-2-1 着陆', dur: 3,
    for: ['fear', 'sad'], lv: [5, 10],
    why: '恐慌或解离时，感官是唯一能把你拉回「此刻」的入口。',
    steps: ['说出你看到的 5 样东西', '摸到的 4 样', '听到的 3 种声音',
            '闻到的 2 种气味', '尝到的 1 种味道', '慢一点，一样一样来'] },
  { id: 'cold', cat: '感官', name: '冷水冲手腕 / 洗脸', dur: 2,
    for: ['anger', 'fear'], lv: [6, 10],
    why: '冷刺激会触发哺乳动物潜水反射，心率下降，用于快速打断情绪飙升。',
    steps: ['打开冷水，冲手腕内侧 30 秒', '或直接捧水洗一把脸',
            '配合缓慢呼气', '身体感到凉意后，先别急着想事情'] },
  { id: 'warmdrink', cat: '感官', name: '慢慢喝一杯热的', dur: 8,
    for: ['fear', 'sad'], lv: [2, 8],
    why: '温热的饮品会带来被照料的体感，是一种低成本的安全信号。',
    steps: ['泡一杯茶、热牛奶或热水，不加糖也行', '双手捧住杯子，感受温度',
            '每一口停 3 秒再咽', '喝完这一杯，再决定接下来做什么'] },
  { id: 'shower', cat: '感官', name: '洗个热水澡并结束今天', dur: 20,
    for: ['sad', 'disgust'], lv: [4, 9],
    why: '给身体一个「今天到此为止」的分界线，比靠意志力停止反刍更省力。',
    steps: ['把水温调得比平时稍高', '什么都不想，只感受水流', '出来擦干，换上干净衣服',
            '对自己说一句：今天结束了，剩下的明天再说'] },

  /* ---- 连接 ---- */
  { id: 'msg', cat: '连接', name: '给一个人发条消息', dur: 5,
    for: ['sad', 'disgust'], lv: [4, 10],
    why: '痛苦时最想做的事是消失。但「说出来」本身就能降低孤独的生理负荷，哪怕对方不解决问题。',
    steps: ['从通讯录里挑一个最不需要你解释的人',
            '不用讲全，发一句现成的话：',
            '「我今天状态不太好，随便陪我聊两句行吗」',
            '「不用安慰我，你在就行」',
            '发出去，然后放下手机等回音'] },
  { id: 'help', cat: '连接', name: '做一件对别人有用的小事', dur: 15,
    for: ['disgust', 'sad'], lv: [2, 8],
    why: '价值感枯竭时，从「被需要」里能最快回来。这是自我价值感的替代来源。',
    steps: ['选一件 15 分钟内能完成的事', '比如帮同学带饭、回答一个求助帖、给家里打个电话',
            '只做这一件，不求回报，也不发朋友圈', '做完注意一下身体的感受'] },

  /* ---- 保持类：状态好的时候，同样需要被照顾 ---- */
  { id: 'savor', cat: '保持', name: '把这一刻的细节写下来', dur: 5,
    for: ['pos'], lv: [1, 10],
    why: '积极体验如果不被加工，几小时内就会衰减。写下具体细节能明显延长它的留存——这是 savoring 研究里最直接的做法。',
    steps: ['写下此刻的三个感官细节：看到什么、听到什么、身上什么感觉',
            '再补一句：这件事让我高兴，是因为 ____',
            '不用发出去，写给自己看'] },
  { id: 'tell', cat: '保持', name: '把这件事讲给一个人听', dur: 6,
    for: ['pos'], lv: [1, 10],
    why: '被讲述过的好事，会被记忆标记为更重要。一个人独享的喜悦，留存时间明显更短。',
    steps: ['挑一个会真心为你高兴、而不是暗自比较的人',
            '不用铺垫，直接说发生了什么', '注意对方回应时，你身体里的感觉'] },
  { id: 'stay', cat: '保持', name: '多待 5 分钟，什么都不做', dur: 5,
    for: ['pos'], lv: [1, 10],
    why: '好情绪也需要被允许存在。很多人会在一阵高兴之后立刻开始担心它消失，那等于提前把它结束掉。',
    steps: ['停下手上的事', '不刷手机、不做计划、不给这件事下总结',
            '就待在这个感觉里 5 分钟', '结束前对自己说一句：这挺好的'] }
];

/* 每日自我关怀引导（按星期轮换，不重复鸡汤） */
const DAILY_NOTES = [
  { t: '情绪不是你的性格', d: '你今天烦躁，不代表你是个暴躁的人。情绪是天气，不是气候。' },
  { t: '难受需要理由吗', d: '「明明没什么大事」——这句话本身就是一种苛责。感受不需要先通过审批。' },
  { t: '和别人比，是拿自己的里子比别人的面子', d: '你看到的是别人剪好的片段，不是全过程。' },
  { t: '你已经在做很难的事了', d: '坚持记录情绪这件事，本身就说明你在照顾自己。' },
  { t: '休息不用先赚到', d: '疲惫不是需要被惩罚的过错，是身体在提要求。' },
  { t: '允许自己今天只是活着', d: '不是每一天都得有产出。有些日子，撑过去就是完成任务。' },
  { t: '你对自己说话的方式，会用来说别人吗', d: '如果不会，那这句话就不该对自己说。' }
];

/* 体验数据生成用的语料（仅用于「一键体验」，不污染真实记录） */
const DEMO_POOL = {
  morning: [
    { e: 'expect', c: 'joy',  i: [4, 7], tg: ['progress', 'learn'], bd: ['light'], n: '今天想先把最难的那块搞完' },
    { e: 'peace',  c: 'calm', i: [5, 7], tg: [], bd: ['warm'], n: '早起状态还行' },
    { e: 'tense',  c: 'fear', i: [3, 6], tg: ['eval', 'task'], bd: ['shoulder'], n: '想到下午的汇报就有点紧' },
    { e: 'down',   c: 'sad',  i: [3, 6], tg: ['sleepless', 'weather'], bd: ['weak'], n: '阴天，起床就觉得沉' },
    { e: 'tired',  c: 'disgust', i: [4, 7], tg: ['sick', 'eat'], bd: ['stomach', 'weak'], n: '胃不舒服，早饭也没吃' },
    { e: 'relax',  c: 'calm', i: [5, 7], tg: ['outside'], bd: ['warm'], n: '太阳很好，出门走了走' }
  ],
  noon: [
    { e: 'focus',  c: 'calm',  i: [5, 8], tg: ['flow'], bd: ['warm'], n: '进状态了' },
    { e: 'annoyed',c: 'anger', i: [3, 6], tg: ['classmate', 'task'], bd: ['head'], n: '沟通起来太费劲' },
    { e: 'powerless', c: 'sad', i: [4, 6], tg: ['sleepless', 'exhaust'], bd: ['weak'], n: '有点撑不住了' },
    { e: 'tense',  c: 'fear',  i: [4, 7], tg: ['crowd', 'stranger'], bd: ['heart', 'fidget'], n: '食堂人太多，只想快点走' },
    { e: 'unfair', c: 'anger', i: [4, 7], tg: ['money', 'task'], bd: ['head', 'shoulder'], n: '临时又加活，还不好意思拒绝' },
    { e: 'content', c: 'joy', i: [5, 7], tg: ['meal'], bd: ['warm'], n: '吃了顿舒服的饭' }
  ],
  afternoon: [
    { e: 'uneasy', c: 'fear',   i: [4, 7], tg: ['compare', 'doubt'], bd: ['chest'], n: '看别人进度比我快' },
    { e: 'tired',  c: 'disgust',i: [4, 7], tg: ['task', 'exhaust'], bd: ['weak'], n: '做不下去了，很腻' },
    { e: 'happy',  c: 'joy',    i: [5, 8], tg: ['done'], bd: ['light'], n: '这东西终于跑通了' },
    { e: 'blank',  c: 'calm',   i: [3, 5], tg: ['screen', 'noise'], bd: [], n: '坐了一下午，说不上干了什么' },
    { e: 'uneasy', c: 'fear',   i: [3, 6], tg: ['looks', 'compare'], bd: ['chest'], n: '照镜子的时候有点烦躁' },
    { e: 'moved',  c: 'joy',    i: [5, 8], tg: ['cared'], bd: ['warm'], n: '我妈突然给我发了条消息' },
    { e: 'relax',  c: 'calm',   i: [5, 7], tg: ['sport', 'quiet'], bd: ['warm'], n: '跑了会儿步，回来人清爽多了' }
  ],
  night: [
    { e: 'anxious', c: 'fear',  i: [6, 9], tg: ['future', 'task', 'compare'], bd: ['heart', 'fidget'], n: '躺下就开始想以后怎么办' },
    { e: 'lonely',  c: 'sad',   i: [5, 9], tg: ['partner', 'friends', 'screen'], bd: ['chest', 'cry'], n: '刷手机刷到不知道在刷什么' },
    { e: 'selfhate',c: 'disgust',i: [5, 9], tg: ['doubt', 'compare', 'slow'], bd: ['chest'], n: '觉得自己这一年白过了' },
    { e: 'wronged', c: 'sad',   i: [4, 8], tg: ['family', 'conflict'], bd: ['chest'], n: '被说了几句，其实不是我的问题' },
    { e: 'relax',   c: 'calm',  i: [5, 8], tg: [], bd: ['warm'], n: '洗完澡舒服多了' },
    { e: 'anxious', c: 'fear',  i: [5, 8], tg: ['exam', 'future'], bd: ['heart', 'shoulder'], n: '想到后面的考试就睡不着' },
    { e: 'loss',    c: 'sad',   i: [5, 8], tg: ['breakup', 'partner'], bd: ['chest', 'cry'], n: '还是会想起以前的一些事' },
    { e: 'panic',   c: 'fear',  i: [7, 9], tg: ['exam', 'deadline'], bd: ['breath', 'heart', 'cold'], n: '半夜突然心慌，喘不上气' },
    { e: 'proud',   c: 'joy',   i: [6, 8], tg: ['praise_'], bd: ['light'], n: '今天汇报讲得比想象中好' },
    { e: 'content', c: 'joy',   i: [5, 8], tg: ['connect'], bd: ['warm'], n: '和朋友聊了很久，心里松了' },
    { e: 'peace',   c: 'calm',  i: [5, 7], tg: ['media'], bd: ['warm'], n: '晚上看了会儿书，没刷手机' }
  ]
};
