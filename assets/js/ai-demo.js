/* ===== Agentic AI デモ =====
 * Exastro AIアシスタントの画面を再現したデモ。AI や MCP とは連携せず、
 * シナリオ（data-scenario に指定した JSON）に書いた順に会話が進む。
 * ガイド付きのステップでは、押す場所以外を暗くして説明文を表示する（チュートリアル）。
 *
 * シナリオのステップ（steps[].type）
 *   input     : 入力欄をクリックすると text が入力される
 *   send      : 送信ボタンを押すと、入力欄の内容がユーザの発言になる
 *   wait      : 「思考中」などの待機表示を duration ミリ秒出す
 *   assistant : AIの発言（text。空行で段落、"- " で箇条書き、**太字**、`コード`）
 *   choice    : AIの発言（text）と選択肢（options）。answer 番目を押すと次へ進む
 *   movement  : Movement の実行表示。statuses の順に状態が変わる。
 *               実行中（Executing）は「緊急停止」を押せ、押すと "Emergency stop" になり、
 *               emergencyStop.steps があれば残りのステップの代わりにそちらへ進む（分岐）
 *   guide     : 既存の要素（target）を強調して説明する。「次へ」で進む
 *   end       : 終了画面（text）
 * guide に説明文を書いたステップは、押す場所を強調してから待つ。
 */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ai-demo[data-scenario]").forEach((root) => new AiDemo(root));
});

// 開始・終了画面のボタン用（画面内のアイコンは Exastro のアイコンフォントを使う）
const AI_DEMO_PLAY_ICON = '<svg class="ai-demo__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

// Exastro のドライバー実行ステータス → .movementArea の data-result、.node のクラス、結果の表示
const AI_DEMO_STATUS = {
  Preparing: { result: "ready", node: "ready" },
  Executing: { result: "running", node: "running" },
  Completed: { result: "done", node: "complete", text: "DONE" },
  "Completed (error)": { result: "error", node: "complete", text: "ERROR" },
  "Unexpected error": { result: "error", node: "complete", text: "ERROR" },
  "Emergency stop": { result: "stop", node: "complete", text: "STOP" },
};

// 選択肢の action ごとのボタンの色とアイコン（Exastro と同じ対応）
const AI_DEMO_CHOICE_STYLE = {
  positive: { action: "positive", icon: "check" },
  negative: { action: "negative", icon: "cross" },
  other: { action: "normal", icon: "circle" },
};

// Exastro の fn.html.icon / button / iconButton と同じ HTML を作る
function aiDemoIcon(name, className = "") {
  return `<span class="icon icon-${name}${className ? ` ${className}` : ""}"></span>`;
}

function aiDemoButton(html, className, attrs = "") {
  return `<button type="button" class="${className} button" ${attrs}><span class="inner">${html}</span></button>`;
}

function aiDemoIconButton(icon, text, className, attrs = "") {
  return aiDemoButton(`${aiDemoIcon(icon, "iconButtonIcon")}<span class="iconButtonBody">${text}</span>`, `${className} iconButton`, attrs);
}

function aiDemoEscape(text) {
  return String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// 簡易マークダウン（空行で段落、"- " の行が続けば箇条書き、**太字**、`コード`）
function aiDemoFormat(text) {
  const inline = (s) => aiDemoEscape(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
  return String(text).split(/\n{2,}/).map((block) => {
    const lines = block.split("\n");
    if (lines.every((line) => /^[-*] /.test(line))) {
      return `<ul>${lines.map((line) => `<li>${inline(line.slice(2))}</li>`).join("")}</ul>`;
    }
    return `<p>${lines.map(inline).join("<br>")}</p>`;
  }).join("");
}

function aiDemoAbortError() {
  return new DOMException("Aborted", "AbortError");
}

function aiDemoSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(aiDemoAbortError());
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(aiDemoAbortError());
    }, { once: true });
  });
}

// いずれかの要素がクリックされるまで待つ
function aiDemoWaitClick(elements, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(aiDemoAbortError());
    const cleanup = () => elements.forEach((el) => el.removeEventListener("click", onClick));
    const onClick = (e) => {
      cleanup();
      resolve(e.currentTarget);
    };
    elements.forEach((el) => el.addEventListener("click", onClick));
    signal.addEventListener("abort", () => {
      cleanup();
      reject(aiDemoAbortError());
    }, { once: true });
  });
}

class AiDemo {
  constructor(root) {
    this.root = root;
    this.scenario = null;
    this.controller = null;
    this.spotTarget = null;
    this.spotKey = "";
    this.spotJump = false;
    this.progress = "";
    this.track = this.track.bind(this);
    this.build();
    this.load(root.dataset.scenario);
  }

  build() {
    const menuButton = (icon, text, className, action, attrs = "") => `
      <li class="operationMenuItem">${aiDemoIconButton(icon, text, `itaButton operationMenuButton ${className}`, `data-action="${action}" ${attrs}`).replace("</span></button>", '<span class="buttonMinWidth" style="width:160px"></span></span></button>')}</li>`;
    const footerBlock = (title, itemClass) => `
      <div class="aiAssistantFooterBlock">
        <dl class="aiAssistantFooterList">
          <dt class="aiAssistantFooterTitle"><span class="aiAssistantFooterText">${title}</span></dt>
          <dd class="aiAssistantFooterItem ${itemClass}"></dd>
        </dl>
      </div>`;

    this.root.innerHTML = `
    <div class="ai-demo__window">
      <div class="ai-demo__titlebar">
        <span class="ai-demo__dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="ai-demo__title">Exastro IT Automation ／ AIアシスタント</span>
      </div>
      <div class="ai-demo__screen">
        <div class="aiAssistantContainer">
          <div class="aiAssistantContainerInner">
            <div class="aiAssistantHeader" inert>
              <div class="operationMenu">
                <ul class="operationMenuList operationMenuMain">
                  ${menuButton("edit", "新しいチャット", "aiAssistantNewChatButton", "positive")}
                  ${menuButton("check", "チャット終了", "aiAssistantCloseChatButton", "positive", "disabled")}
                </ul>
                <ul class="operationMenuList operationMenuSub">
                  ${menuButton("gear", "AIサービス設定", "aiAssistantSettingButton", "default")}
                </ul>
              </div>
            </div>
            <div class="aiAssistantBody">
              <div class="aiAssistantBodyInner">
                <div class="aiAssistantChatContainer">
                  <div class="aiAssistantChatInner">
                    <div class="aiAssistantChatBody"></div>
                    <div class="aiAssistantChatFooter">
                      <div class="aiAssistantChatComposer">
                        <div class="aiAssistantInputMessage">
                          <textarea class="aiAssistantInputTextarea" rows="1" readonly placeholder="ご用件を入力してください。" aria-label="メッセージ"></textarea>
                        </div>
                        <div class="aiAssistantInputActions">
                          ${aiDemoButton(aiDemoIcon("plus"), "aiAssistantInputActionsFileButton itaButton", 'data-action="default" tabindex="-1" aria-hidden="true"')}
                          ${aiDemoButton(aiDemoIcon("send"), "aiAssistantInputActionsSendButton itaButton", 'data-action="positive" aria-label="送信"')}
                          ${aiDemoButton(aiDemoIcon("stop"), "aiAssistantInputActionsStopButton itaButton", 'data-action="danger" tabindex="-1" aria-hidden="true"')}
                        </div>
                      </div>
                      <div class="aiAssistantDisclaimerMessage">AIの回答や操作結果は、正確性および完全性を保証するものではありません。AIアシスタントを通じた操作については、実行前に内容と影響範囲を確認し、実行後も結果が意図した状態になっていることをご確認ください。</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="aiAssistantFooter" aria-hidden="true">
              <div class="aiAssistantFooterInner">
                ${footerBlock("AI", "ai-demo__ai-name")}
                ${footerBlock("モデル", "ai-demo__model")}
              </div>
            </div>
          </div>
        </div>
        <div class="ai-demo__shade ai-demo__shade--top"></div>
        <div class="ai-demo__shade ai-demo__shade--bottom"></div>
        <div class="ai-demo__shade ai-demo__shade--left"></div>
        <div class="ai-demo__shade ai-demo__shade--right"></div>
        <div class="ai-demo__ring"></div>
        <div class="ai-demo__tip" role="status">
          <span class="ai-demo__tip-step"></span>
          <p class="ai-demo__tip-text"></p>
          <button type="button" class="ai-demo__tip-next">次へ</button>
        </div>
        <div class="ai-demo__cover is-visible">
          <div class="ai-demo__cover-inner">
            <p class="ai-demo__cover-text">読み込み中…</p>
            <div class="ai-demo__loading" role="progressbar" aria-label="読み込み中"></div>
          </div>
        </div>
      </div>
    </div>`;

    const $ = (selector) => this.root.querySelector(selector);
    this.screen = $(".ai-demo__screen");
    this.body = $(".aiAssistantBody");
    this.bodyInner = $(".aiAssistantBodyInner");
    this.chat = $(".aiAssistantChatBody");
    this.input = $(".aiAssistantInputTextarea");
    this.sendButton = $(".aiAssistantInputActionsSendButton");
    this.closeChatButton = $(".aiAssistantCloseChatButton");
    this.settingButton = $(".aiAssistantSettingButton");
    this.shades = {
      top: $(".ai-demo__shade--top"),
      bottom: $(".ai-demo__shade--bottom"),
      left: $(".ai-demo__shade--left"),
      right: $(".ai-demo__shade--right"),
    };
    this.ring = $(".ai-demo__ring");
    this.tip = $(".ai-demo__tip");
    this.tipStep = $(".ai-demo__tip-step");
    this.tipText = $(".ai-demo__tip-text");
    this.tipNext = $(".ai-demo__tip-next");
    this.cover = $(".ai-demo__cover");

    this.cover.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="start"]')) this.start();
    });
  }

  // シナリオと画面内のアイコンフォントがそろうまでは、開始画面にロードバーを出しておく
  async load(url) {
    const fetchScenario = async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    };
    // フォントが読めなくてもデモは動くので、失敗は無視する
    const loadFont = document.fonts?.load('1em "exastro-ui-icons"').catch(() => {});
    try {
      [this.scenario] = await Promise.all([fetchScenario(), loadFont]);
    } catch (error) {
      console.error("デモのシナリオを読み込めませんでした。", error);
      this.showCover('<p class="ai-demo__cover-text">デモを読み込めませんでした。</p>');
      return;
    }
    this.reset();
    this.showCover(`
      <p class="ai-demo__cover-text">${aiDemoEscape(this.scenario.intro ?? "").replace(/\n/g, "<br>")}</p>
      <button type="button" class="ai-demo__cover-button" data-action="start">${AI_DEMO_PLAY_ICON}デモを体験する</button>`);
  }

  // 新しいチャットの状態（挨拶のみ）に戻す
  reset() {
    this.controller?.abort();
    this.controller = null;
    this.hideSpot();
    this.input.value = "";
    this.list = null;
    this.body.classList.remove("aiAssistantChatNow", "exchangingMessages");
    this.body.classList.add("aiAssistantNewChat");
    this.closeChatButton.disabled = true;
    this.settingButton.disabled = false;
    this.chat.innerHTML = `
      <div class="aiAssistantCharacter">${aiDemoIcon("ai_assistant")}</div>
      <div class="aiAssistantGreetingMessage">${aiDemoEscape(this.scenario?.greeting ?? "").replace(/\n/g, "<br>")}</div>`;
    this.bodyInner.scrollTop = 0;
    this.root.querySelector(".ai-demo__ai-name").innerHTML = `<span class="aiAssistantFooterText">${aiDemoEscape(this.scenario?.footer?.ai ?? "")}</span>`;
    this.root.querySelector(".ai-demo__model").innerHTML = `<div class="modelSelectedName">${aiDemoEscape(this.scenario?.footer?.model ?? "")}</div>`;
  }

  // 応答中（送信ボタンの代わりに停止ボタンを出す）
  setExchanging(exchanging) {
    this.body.classList.toggle("exchangingMessages", exchanging);
  }

  async start() {
    this.reset();
    this.hideCover();

    const controller = new AbortController();
    this.controller = controller;
    const countGuides = (steps) => steps.filter((step) => step.guide).length;
    let steps = this.scenario.steps ?? [];
    let total = countGuides(steps);
    let count = 0;
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (step.guide) count++;
        this.progress = `STEP ${count} / ${total}`;
        const stopped = await this.runStep(step, controller.signal);
        // 緊急停止した場合は、残りのステップの代わりに分岐先のステップへ進む
        const branch = stopped ? step.emergencyStop?.steps : null;
        if (branch) {
          steps = branch;
          total = count + countGuides(branch);
          i = -1;
        }
      }
      this.setExchanging(false);
    } catch (error) {
      if (error.name !== "AbortError") throw error;
    }
  }

  // 緊急停止したかどうかを返す（movement のみ）
  async runStep(step, signal) {
    switch (step.type) {
      case "input":
        this.setExchanging(false);
        await this.guide(this.input, step.guide, signal);
        await this.typeText(step.text ?? "", signal);
        break;

      case "send": {
        await this.guide(this.sendButton, step.guide, signal);
        const text = this.input.value;
        this.input.value = "";
        this.addUser(text);
        this.setExchanging(true);
        await aiDemoSleep(400, signal);
        break;
      }

      case "wait": {
        const item = this.addLoading(step.text ?? "思考中");
        await aiDemoSleep(step.duration ?? 1500, signal);
        item.remove();
        break;
      }

      case "assistant":
        this.addAssistant(step.text ?? "");
        await aiDemoSleep(step.delay ?? 800, signal);
        break;

      case "choice": {
        if (step.text) {
          this.addAssistant(step.text);
          await aiDemoSleep(500, signal);
        }
        const options = step.options ?? [];
        const answer = options[step.answer ?? 0];
        this.setExchanging(false);
        const item = this.addChoice(options);
        const button = item.querySelectorAll(".aiAssistantChatUserChoiceButton")[step.answer ?? 0];
        await aiDemoSleep(300, signal);
        await this.guide(button, step.guide, signal);
        item.remove();
        this.addUser(answer.label, options.map((option) => option.label));
        this.setExchanging(true);
        await aiDemoSleep(400, signal);
        break;
      }

      case "movement":
        return this.runMovement(step, signal);

      case "guide": {
        const target = this.resolveTarget(step.target);
        if (target) await this.guide(target, step.guide, signal);
        break;
      }

      case "end":
        this.setExchanging(false);
        this.showCover(`
          <p class="ai-demo__cover-text">${aiDemoEscape(step.text ?? "").replace(/\n/g, "<br>")}</p>
          <button type="button" class="ai-demo__cover-button" data-action="start">${AI_DEMO_PLAY_ICON}もう一度体験する</button>`);
        break;

      default:
        console.warn("不明なステップです。", step);
    }
  }

  // guide ステップの target 名 → 要素
  resolveTarget(name) {
    const lastMovement = [...this.chat.querySelectorAll(".ai-demo__movement-item")].pop();
    const targets = {
      input: () => this.input,
      send: () => this.sendButton,
      movement: () => lastMovement?.querySelector(".movementArea"),
      statusButton: () => lastMovement?.querySelector(".movementStatusCheckButton"),
      resultButton: () => lastMovement?.querySelector(".movementResultDownloadButton"),
      lastMessage: () => [...this.chat.querySelectorAll(".aiAssistantChatItem")].pop(),
    };
    const target = targets[name]?.() ?? null;
    if (!target) console.warn("ガイドの対象が見つかりません。", name);
    return target;
  }

  // 対象を強調して説明を出し、対象か「次へ」が押されるまで待つ。
  // 説明文がなければ強調せずに待つ。
  async guide(target, text, signal) {
    this.scrollIntoView(target);
    if (text) this.showSpot(target, text, true);
    try {
      await aiDemoWaitClick([target, this.tipNext], signal);
    } finally {
      // デモをやり直して中断した場合は、新しい回のガイドを消さないよう何もしない
      if (!signal.aborted) this.hideSpot();
    }
  }

  async typeText(text, signal) {
    this.input.value = "";
    for (const char of text) {
      this.input.value += char;
      await aiDemoSleep(35, signal);
    }
    await aiDemoSleep(300, signal);
  }

  async runMovement(step, signal) {
    const item = this.addMovement(step);
    await aiDemoSleep(300, signal);
    // 実行中は押す場所がないので、説明だけ出して自動で進める
    if (step.guide) this.showSpot(item.querySelector(".aiAssistantChatAssistantMessageInner"), step.guide, false);
    // 緊急停止ボタン（実行中だけ押せる）が押されたら、残りのステータスを飛ばす
    const stop = new AbortController();
    const onAbort = () => stop.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    const stopButton = item.querySelector(".movementEmergencyStopButton");
    stopButton.addEventListener("click", () => stop.abort(), { once: true });
    let stopped = false;
    try {
      await aiDemoSleep(step.wait ?? 1500, signal);
      try {
        for (const { status, duration } of step.statuses ?? []) {
          this.setMovementStatus(item, status);
          if (duration) await aiDemoSleep(duration, stop.signal);
        }
      } catch (error) {
        if (error.name !== "AbortError" || signal.aborted) throw error;
        stopped = true;
        this.setMovementStatus(item, "Emergency stop");
      }
      await aiDemoSleep(800, signal);
      return stopped;
    } finally {
      signal.removeEventListener("abort", onAbort);
      // デモをやり直して中断した場合は、新しい回のガイドを消さないよう何もしない
      if (!signal.aborted) this.hideSpot();
    }
  }

  /* ----- チャットの要素（Exastro と同じ HTML） ----- */

  addItem(className, html) {
    // 最初の発言で挨拶を消してチャットの一覧に切り替える
    if (!this.list) {
      this.chat.innerHTML = '<ul class="aiAssistantChatList"></ul>';
      this.list = this.chat.firstElementChild;
      this.body.classList.remove("aiAssistantNewChat");
      this.body.classList.add("aiAssistantChatNow");
      this.closeChatButton.disabled = false;
      this.settingButton.disabled = true;
    }
    const item = document.createElement("li");
    item.className = `aiAssistantChatItem ${className}`;
    item.innerHTML = html;
    this.list.append(item);
    this.scrollToBottom();
    return item;
  }

  // choices を渡すと、選択肢への回答として提示された選択肢の一覧（開閉式）を付ける
  addUser(text, choices = null) {
    const item = this.addItem("aiAssistantChatUserMessage", '<div class="aiAssistantChatItemInner aiAssistantChatUserMessageInner"><p></p></div>');
    item.querySelector("p").textContent = text;
    if (choices) {
      const list = choices.map((label) => {
        const selected = label === text;
        return `<li class="aiAssistantChatUserMessageChoiceItem${selected ? " aiAssistantChatUserMessageChoiceItemSelected" : ""}">${aiDemoIcon(selected ? "check" : "minus")}<span class="aiAssistantChatUserMessageChoiceLabel">${aiDemoEscape(label)}</span></li>`;
      }).join("");
      item.querySelector(".aiAssistantChatItemInner").insertAdjacentHTML("beforeend", `
        <details class="aiAssistantChatUserMessageChoices">
          <summary class="aiAssistantChatUserMessageChoicesSummary">${choices.length}件の選択肢から選択</summary>
          <ul class="aiAssistantChatUserMessageChoiceList">${list}</ul>
        </details>`);
    }
    return item;
  }

  addAssistantItem(html, className = "") {
    return this.addItem(`aiAssistantChatAssistantMessage ${className}`, `
      <div class="aiAssistantChatAssistantMessageIcon"></div>
      <div class="aiAssistantChatItemInner aiAssistantChatAssistantMessageInner">${html}</div>`);
  }

  addAssistant(text) {
    return this.addAssistantItem(aiDemoFormat(text));
  }

  loadingHtml(text) {
    const dot = (n) => `<div class="aiAssistantChatItemNowLoading-dot aiAssistantChatItemNowLoading-dot-${n}"></div>`;
    return `
      <div class="aiAssistantChatItemNowLoading">
        ${dot(1)}${dot(2)}${dot(3)}
        <div class="aiAssistantChatItemNowLoadingText">${aiDemoEscape(text)}</div>
        ${dot(4)}${dot(5)}${dot(6)}
      </div>`;
  }

  addLoading(text) {
    return this.addAssistantItem(this.loadingHtml(text), "aiAssistantChatItemLoading");
  }

  addChoice(options) {
    const buttons = options.map((option) => {
      const style = AI_DEMO_CHOICE_STYLE[option.action] ?? AI_DEMO_CHOICE_STYLE.other;
      return `<li class="aiAssistantChatUserChoiceItem">${aiDemoIconButton(style.icon, aiDemoEscape(option.label), "itaButton aiAssistantChatUserChoiceButton", `data-action="${style.action}"`)}</li>`;
    }).join("");
    return this.addItem("aiAssistantChatUserChoice", `
      <div class="aiAssistantChatItemInner aiAssistantChatUserChoiceInner">
        <ul class="aiAssistantChatUserChoiceList">${buttons}</ul>
        <p class="aiAssistantChatUserChoiceNote">回答をボタンで選択するか、下の入力欄に直接ご記入ください。</p>
      </div>`);
  }

  addMovement(step) {
    const menuButton = (icon, text, className, action) => `
      <li class="operationMenuItem">${aiDemoIconButton(icon, text, `itaButton operationMenuButton ${className}`, `data-action="${action}" disabled`)}</li>`;
    const terminal = (className) => `
      <div class="node-terminal ${className} connected">
        <span class="connect-mark"></span>
        <span class="hole"><span class="hole-inner"></span></span>
      </div>`;
    return this.addAssistantItem(`
      <div class="operationMenu">
        <ul class="operationMenuList operationMenuMain">
          ${menuButton("note", "作業状態確認", "movementStatusCheckButton", "default")}
          ${menuButton("download", "結果データ", "movementResultDownloadButton", "default")}
        </ul>
        <ul class="operationMenuList operationMenuSub">
          ${menuButton("stop", "緊急停止", "movementEmergencyStopButton", "danger")}
        </ul>
      </div>
      <div class="movementArea" data-result="">
        <div class="movementAreaInner">
          <div class="node ${aiDemoEscape(step.nodeClass ?? "node-ansible-legacy")} operation">
            <div class="node-main">
              ${terminal("node-in")}
              <div class="node-body">
                <div class="node-circle">
                  <span class="node-gem"><span class="node-gem-inner">${aiDemoEscape(step.gem ?? "")}</span></span>
                  <span class="node-running"></span>
                  <span class="node-result"></span>
                </div>
                <div class="node-type"><span>${aiDemoEscape(step.driver ?? "")}</span></div>
                <div class="node-name"><span>${aiDemoEscape(step.name ?? "")}</span></div>
              </div>
              ${terminal("node-out")}
            </div>
            <div class="node-operation">
              <dl class="node-operation-body">
                <dt class="node-operation-name">OP</dt>
                <dd class="node-operation-data">${aiDemoEscape(step.operation ?? "")}</dd>
              </dl>
              <div class="node-operation-border"></div>
            </div>
          </div>
        </div>
        <div class="movementWaiting">${this.loadingHtml("待機中")}</div>
      </div>`, "ai-demo__movement-item");
  }

  setMovementStatus(item, status) {
    const info = AI_DEMO_STATUS[status];
    if (!info) {
      console.warn("不明なステータスです。", status);
      return;
    }
    item.querySelector(".movementArea").dataset.result = info.result;
    item.querySelector(".node").classList.add(info.node);
    if (info.text) item.querySelector(".node-result").dataset.resultText = info.text;
    item.querySelector(".movementStatusCheckButton").disabled = false;
    item.querySelector(".movementEmergencyStopButton").disabled = info.result !== "running";
    item.querySelector(".movementResultDownloadButton").disabled = !info.text;
  }

  scrollToBottom() {
    this.bodyInner.scrollTo({ top: this.bodyInner.scrollHeight, behavior: "smooth" });
  }

  // チャット内の要素が見えていなければ、見える位置までスクロールする
  scrollIntoView(target) {
    if (!this.chat.contains(target)) return;
    const body = this.bodyInner.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    const margin = 16;
    let delta = 0;
    if (rect.top < body.top + margin || rect.height > body.height - margin * 2) {
      delta = rect.top - body.top - margin;
    } else if (rect.bottom > body.bottom - margin) {
      delta = rect.bottom - body.bottom + margin;
    }
    if (delta) this.bodyInner.scrollBy({ top: delta, behavior: "smooth" });
  }

  /* ----- ガイド（暗幕・強調枠・説明文） ----- */

  showSpot(target, text, next) {
    this.spotTarget = target;
    this.spotKey = "";
    this.spotJump = true;
    this.tipStep.textContent = this.progress;
    this.tipText.textContent = text;
    this.tipNext.hidden = !next;
    this.screen.classList.add("is-guiding");
    requestAnimationFrame(this.track);
  }

  hideSpot() {
    this.spotTarget = null;
    this.screen.classList.remove("is-guiding");
  }

  // 対象はスクロールや発言の追加で動くので、強調中は毎フレーム位置を合わせる
  track() {
    if (!this.spotTarget) return;
    this.layoutSpot();
    requestAnimationFrame(this.track);
  }

  layoutSpot() {
    const PAD = 6;
    const GAP = 10;
    const screen = this.screen.getBoundingClientRect();
    const rect = this.spotTarget.getBoundingClientRect();
    const left = Math.max(0, rect.left - screen.left - PAD);
    const top = Math.max(0, rect.top - screen.top - PAD);
    const right = Math.min(screen.width, rect.right - screen.left + PAD);
    const bottom = Math.min(screen.height, rect.bottom - screen.top + PAD);

    // 説明文は対象の下、入らなければ上、どちらも無理なら画面下端に置く
    const tipWidth = this.tip.offsetWidth;
    const tipHeight = this.tip.offsetHeight;
    let tipTop;
    if (screen.height - bottom >= tipHeight + GAP * 2) tipTop = bottom + GAP;
    else if (top >= tipHeight + GAP * 2) tipTop = top - tipHeight - GAP;
    else tipTop = screen.height - tipHeight - GAP;
    const center = (left + right) / 2;
    const tipLeft = Math.min(Math.max(GAP, center - tipWidth / 2), screen.width - tipWidth - GAP);

    // 変化がなければ書き換えない（transition をやり直させない）
    const key = [left, top, right, bottom, tipLeft, tipTop].map(Math.round).join();
    if (key === this.spotKey) return;
    this.spotKey = key;

    // 出した直後は前回の位置から滑ってこないよう、アニメーションなしで置く
    if (this.spotJump) this.screen.classList.add("is-spot-jump");

    const px = (v) => `${Math.round(v)}px`;
    Object.assign(this.shades.top.style, { left: 0, top: 0, width: "100%", height: px(top) });
    Object.assign(this.shades.bottom.style, { left: 0, top: px(bottom), width: "100%", height: px(screen.height - bottom) });
    Object.assign(this.shades.left.style, { left: 0, top: px(top), width: px(left), height: px(bottom - top) });
    Object.assign(this.shades.right.style, { left: px(right), top: px(top), width: px(screen.width - right), height: px(bottom - top) });
    Object.assign(this.ring.style, { left: px(left), top: px(top), width: px(right - left), height: px(bottom - top) });
    Object.assign(this.tip.style, { left: px(tipLeft), top: px(tipTop) });

    if (this.spotJump) {
      this.spotJump = false;
      void this.screen.offsetWidth; // 位置を確定させてからアニメーションを戻す
      this.screen.classList.remove("is-spot-jump");
    }
  }

  /* ----- 開始・終了画面 ----- */

  showCover(html) {
    this.cover.innerHTML = `<div class="ai-demo__cover-inner">${html}</div>`;
    this.cover.classList.add("is-visible");
  }

  hideCover() {
    this.cover.classList.remove("is-visible");
  }
}
