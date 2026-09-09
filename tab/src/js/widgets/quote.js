(function () {
  if (typeof WidgetRegistry === "undefined") return;
  const STORAGE_KEY = "ywr-quote-state";
  const QUOTES = [
    "种一棵树最好的时间是十年前，其次是现在。",
    "知不足而奋进，望远山而前行。",
    "把每一件简单的事做好就是不简单。",
    "千里之行，始于足下。",
    "少壮不努力，老大徒伤悲。",
    "不积跬步，无以至千里。",
    "学而不思则罔，思而不学则殆。",
    "博观而约取，厚积而薄发。",
    "天行健，君子以自强不息。",
    "路漫漫其修远兮，吾将上下而求索。",
    "业精于勤，荒于嬉。",
    "锲而不舍，金石可镂。",
    "纸上得来终觉浅，绝知此事要躬行。",
    "千磨万击还坚劲，任尔东西南北风。",
    "会当凌绝顶，一览众山小。",
    "长风破浪会有时，直挂云帆济沧海。",
    "沉舟侧畔千帆过，病树前头万木春。",
    "山重水复疑无路，柳暗花明又一村。",
    "宝剑锋从磨砺出，梅花香自苦寒来。",
    "读书破万卷，下笔如有神。",
    "问渠那得清如许？为有源头活水来。",
    "人生在勤，不索何获。",
    "志当存高远。",
    "不登高山，不知天之高也。",
    "非淡泊无以明志，非宁静无以致远。",
    "老骥伏枥，志在千里。",
    "穷且益坚，不坠青云之志。",
    "不畏浮云遮望眼，自缘身在最高层。",
    "海内存知己，天涯若比邻。",
    "落红不是无情物，化作春泥更护花。",
    "春蚕到死丝方尽，蜡炬成灰泪始干。",
    "山不厌高，海不厌深。",
    "我劝天公重抖擞，不拘一格降人才。",
    "横眉冷对千夫指，俯首甘为孺子牛。",
    "为中华之崛起而读书。",
    "世上无难事，只怕有心人。",
    "失败是成功之母。",
    "时间就是生命，时间就是速度，时间就是力量。",
    "知识就是力量。",
    "书籍是人类进步的阶梯。",
    "天才就是百分之一的灵感加百分之九十九的汗水。",
    "行动胜于言语。",
    "今日事，今日毕。",
    "坚持就是胜利。",
    "细节决定成败。",
    "态度决定高度。",
    "越努力，越幸运。",
    "心若向阳，无谓悲伤。",
    "你若盛开，蝴蝶自来。",
    "生活不止眼前的苟且，还有诗和远方。",
  ];

  const dayIndex = () => {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : {};
      if (state.day !== dayIndex()) return { day: dayIndex(), idx: -1 };
      return state;
    } catch (e) {
      return { day: dayIndex(), idx: -1 };
    }
  };

  const nextIndex = (idx) => {
    const n = QUOTES.length;
    const used = (idx + 1 + Math.floor(Math.random() * (n - 1))) % n;
    return used;
  };

  const render = (slot) => {
    let state = loadState();
    if (state.idx < 0 || state.idx >= QUOTES.length) {
      state.idx = Math.floor(Math.random() * QUOTES.length);
    }
    saveState(state);
    slot.innerHTML = `
      <div class="quote-card">
        <div class="quote-mark">“</div>
        <div class="quote-text">${QUOTES[state.idx]}</div>
        <button class="quote-next" title="换一条">↻</button>
      </div>`;
    const btn = slot.querySelector(".quote-next");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        state = loadState();
        state.idx = nextIndex(state.idx);
        saveState(state);
        render(slot);
      });
    }
  };

  const saveState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  };

  WidgetRegistry.register({
    id: "quote",
    title: "语录",
    icon: "❝",
    zones: ["left"],
    render,
    refresh: render,
  });
})();
