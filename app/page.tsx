"use client";

import { useMemo, useRef, useState } from "react";

type Task = { title: string; lines: string[]; warning?: boolean };
type Phase = { number: string; title: string; caption: string; tasks: Task[] };

const phases: Phase[] = [
  {
    number: "01",
    title: "型号识别",
    caption: "登记、核对并确认检测范围",
    tasks: [
      { title: "登记设备", lines: [] },
      { title: "确认检测范围", lines: ["显示本次可检查的项目。", "用户阅读说明并授权检测。"] },
    ],
  },
  {
    number: "02",
    title: "外观扫描",
    caption: "摆放、连接并完成多角度拍摄",
    tasks: [
      { title: "放入憨憨并连接电源", lines: ["将憨憨放在毛绒垫中央，整理四肢和毛绒。", "接好 Type-C 电源线并关闭透明盖，点击查看操作提示。"] },
      { title: "拍摄四周", lines: ["毛绒垫与线缆外圈同步转动，摄像头分角度拍照。", "记录污渍、掉毛、破损、开裂和零件缺失。"] },
      { title: "人工翻面补拍", lines: ["停止旋转、断开供电后开盖，必要时拔线。", "人工调整姿势，让顶部和底部分别朝向摄像头。", "关盖后转动补拍；遮住的部分再次调整。"], warning: true },
    ],
  },
  {
    number: "03",
    title: "安全检查",
    caption: "安全检查、限流通电与功能测试",
    tasks: [
      { title: "安全检查", lines: ["检查外观、接口及温度，发现鼓包、漏液、烧焦、潮湿或异常发热等情况，停止测试并交由工作人员处理。"], warning: true },
      { title: "低功率通电", lines: ["恢复正常坐姿，确认插头插稳、线缆未受压。按型号要求限压限流供电；过流、异常发热或反复断连时立即断电。"], warning: true },
      { title: "功能测试", lines: ["检查开机、显示、声音、互动、充电及支持的连接功能，逐项记录“正常／异常／无法测试”。无反应不直接判定整机损坏。"] },
    ],
  },
  {
    number: "04",
    title: "数据检查",
    caption: "先授权，再检查，并保留数据边界",
    tasks: [
      { title: "单独确认授权", lines: ["告知用户需要读取哪些信息。", "未授权时跳过，不默认查看私人内容。"], warning: true },
      { title: "检查可访问的信息", lines: ["检查设备标识、系统版本及可读取的数据状态。", "引导用户在 App 中确认账号绑定与云端记录。"] },
      { title: "询问记忆处理意愿", lines: ["选择保留、备份，或后续清除。", "不在检查阶段自动删除。"] },
      { title: "标明检查边界", lines: ["无法访问的内容标注“未确认”。", "不把本地重置视为云端数据也已删除。"] },
    ],
  },
  {
    number: "05",
    title: "人工复核",
    caption: "复核异常、补充检查并确认结论",
    tasks: [
      { title: "核对异常", lines: ["工作人员查看照片与测试记录。", "排除毛绒遮挡、姿势不当或线缆松动造成的误判。"] },
      { title: "补充检查", lines: ["重新拍摄模糊部位。", "重测结果不明确的功能。"] },
      { title: "确认结论", lines: ["区分已确认故障与待进一步检查的问题。", "安全异常未排除前，不恢复通电。"], warning: true },
    ],
  },
  {
    number: "06",
    title: "生成状态卡",
    caption: "汇总设备、检测、数据与处理建议",
    tasks: [
      { title: "设备基本信息", lines: ["型号、检测日期、设备编号。"] },
      { title: "外观与功能结果", lines: ["展示破损位置、功能状态及相关照片。", "保留“无法测试”和“未确认”的项目。"] },
      { title: "数据状态", lines: ["记录授权范围、绑定确认情况和备份意愿。", "如后续执行清除，另行记录执行结果。"] },
      { title: "处理建议", lines: ["给出继续使用、维修、转赠或回收建议。", "用户扫码保存状态卡。"] },
    ],
  },
  {
    number: "07",
    title: "用户选择去向",
    caption: "由用户决定设备的下一步",
    tasks: [
      { title: "继续使用", lines: ["查看保养建议，断开线缆后取回设备。"] },
      { title: "维修", lines: ["查看需要维修的部位，选择是否交由维修人员处理。"] },
      { title: "转赠", lines: ["完成清洁、账号解绑及用户确认的数据处理。", "将状态卡交给下一位使用者。"] },
      { title: "正规回收", lines: ["确认记忆保留或清除意愿。", "交给合适的回收渠道，获取交接凭证。"] },
      { title: "暂不决定", lines: ["保存检测结果，取回设备，之后再选择。"] },
    ],
  },
];

const destinations = ["继续使用", "维修", "转赠", "正规回收", "暂不决定"];
const petColors = [
  { id: "gray", name: "灰色", image: "/hanhan-gray.png" },
  { id: "yellow", name: "黄色", image: "/hanhan-yellow.png" },
  { id: "blue", name: "蓝色", image: "/hanhan-blue.png" },
] as const;
type PetColor = (typeof petColors)[number]["id"];
const taskKey = (phaseIndex: number, taskIndex: number) => `${phaseIndex}-${taskIndex}`;

export default function Home() {
  const [activePhase, setActivePhase] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [destination, setDestination] = useState("暂不决定");
  const [selectedColor, setSelectedColor] = useState<PetColor | null>(null);
  const [repairHistory, setRepairHistory] = useState<"yes" | "no" | null>(null);
  const [repairDetails, setRepairDetails] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const agreementDialog = useRef<HTMLDialogElement>(null);
  const placementDialog = useRef<HTMLDialogElement>(null);
  const placementCompleted = completed.has(taskKey(1, 0));
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const scopeAuthorized = completed.has(taskKey(0, 1));
  const current = phases[activePhase];
  const totalTasks = phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const progress = Math.round((completed.size / totalTasks) * 100);
  const phaseDone = useMemo(() => phases.map((phase, phaseIndex) => phase.tasks.every((_, taskIndex) => completed.has(taskKey(phaseIndex, taskIndex)))), [completed]);

  function openAgreement() {
    setAgreementAccepted(scopeAuthorized);
    agreementDialog.current?.showModal();
  }

  function authorizeInspection() {
    if (!agreementAccepted) return;
    setCompleted((previous) => new Set(previous).add(taskKey(0, 1)));
    agreementDialog.current?.close();
  }

  function completePlacement() {
    setCompleted((previous) => new Set(previous).add(taskKey(1, 0)));
    placementDialog.current?.close();
  }

  function toggleTask(taskIndex: number) {
    if (activePhase === 0 && taskIndex === 0 && !selectedColor) return;
    const key = taskKey(activePhase, taskIndex);
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <main className="page-shell" id="home">
      <section className="app-canvas" aria-label="电子宠物检测工作台">
        <header className="app-topbar">
          <a className="brand-block" href="#home" aria-label="憨憨护理首页"><span className="brand-mark">h.</span><span>憨憨<span className="brand-dot">•</span>护理所<small>HANHAN CARE LAB</small></span></a>
          <div className="topbar-right"><span className="session-state"><i />检测进行中</span><a className="round-link" href="#care-notes" aria-label="查看护理须知"><Icon name="heart" /></a></div>
        </header>

        <nav className="phase-list phase-tabs-top" aria-label="检测流程">{phases.map((phase, index) => <button className={`phase-button ${index === activePhase ? "active" : ""} ${phaseDone[index] ? "done" : ""}`} key={phase.number} onClick={() => { setActivePhase(index); document.getElementById("phase-title")?.scrollIntoView({ block: "start" }); }} type="button" aria-current={index === activePhase ? "step" : undefined}><span className="phase-number">{phaseDone[index] ? "✓" : phase.number}</span><span>{phase.title}</span>{index === activePhase && <span className="phase-arrow" aria-hidden="true">↗</span>}</button>)}</nav>

        <section className="welcome-section" aria-labelledby="welcome-title">
          <div className="welcome-copy"><p className="eyebrow">A LITTLE CARE, A LOT OF LOVE</p><h1 id="welcome-title">好好检查，<br />继续<span className="love-word">陪伴<svg viewBox="0 0 200 15" aria-hidden="true"><path d="M3 11 Q90 0 195 8" /></svg></span>。<span className="heading-spark" aria-hidden="true">✳︎</span></h1></div>
          <div className="pet-scene"><div className="pet-heading"><span>MEET YOUR LITTLE FRIEND</span><span className="pet-tag">正在被好好照顾 <Icon name="heart" /></span></div><span className="scene-spark spark-one" aria-hidden="true">✧</span><span className="scene-spark spark-two" aria-hidden="true">✳︎</span><div className="pet-halo" /><img className="hero-pet" src="/hanhan-ui.png" alt="毛茸茸的黄色憨憨，长着蓝色晶体眼睛" /><span className="pet-bubble">今天也请多多关照 ♡</span><div className="pet-name"><strong>憨憨<span>hanhan</span></strong><span>型号待确认 · 已接收设备</span></div><div className="pet-sticker" aria-hidden="true">100%<small>值得被爱</small></div></div>
        </section>

        <section className="inspection-section" id="inspection" aria-labelledby="inspection-title">
          <div className="section-heading"><div><span className="eyebrow">THE CARE JOURNEY</span><h2 id="inspection-title">憨憨的检查之旅 <span>↘</span></h2></div><span className="device-id">设备编号 <b>HH-2026-0918</b></span></div>


          <div className="workspace-grid">
            <section className="detail-panel" aria-labelledby="phase-title">
              <div className="stack-tab"><Icon name="spark" /><span>每一步，都是对它的在意</span><span>CARE WITH LOVE</span></div>
              <div className="detail-inner"><div className="detail-heading"><div><p className="eyebrow">STEP {current.number} / 07</p><h2 id="phase-title">{current.title}</h2><p>{current.caption}</p></div>{activePhase !== 0 && <span className="detail-symbol" aria-hidden="true"><Icon name={activePhase === 3 ? "shield" : "heart"} /></span>}</div>
              <div className="task-list">{current.tasks.map((task, index) => {
                const isDone = completed.has(taskKey(activePhase, index));
                if (activePhase === 1 && index === 0) {
                  return <button className={`task-card scope-card ${isDone ? "complete" : ""}`} key={task.title} type="button" onClick={() => placementDialog.current?.showModal()} aria-haspopup="dialog" aria-controls="placement-instructions" aria-labelledby="placement-card-title" aria-describedby="placement-card-description">
                    <span className="task-check" aria-hidden="true">{isDone ? <Icon name="check" /> : "01"}</span>
                    <span className="task-content"><span className="scope-card-title" id="placement-card-title">{task.title}</span><span className="scope-card-description" id="placement-card-description">{isDone ? "已完成放入与连接，点击可查看操作提示。" : task.lines.map((line) => <span className="placement-description-line" key={line}>{line}</span>)}</span></span>
                    <span className="task-arrow" aria-hidden="true">↗</span>
                  </button>;
                }
                if (activePhase === 0 && index === 1) {
                  return <button className={`task-card scope-card ${isDone ? "complete" : ""}`} key={task.title} type="button" onClick={openAgreement} aria-haspopup="dialog" aria-controls="inspection-agreement" aria-labelledby="scope-card-title" aria-describedby="scope-card-description">
                    <span className="task-check" aria-hidden="true">{isDone ? <Icon name="check" /> : "02"}</span>
                    <span className="task-content"><span className="scope-card-title" id="scope-card-title">{task.title}{isDone && <span className="authorized-tag">已授权</span>}</span><span className="scope-card-description" id="scope-card-description">{isDone ? "已阅读说明并授权检测，点击可查看协议。" : <>显示本次可检查的项目。<br />用户阅读说明并授权检测。</>}</span></span>
                    <span className="task-arrow" aria-hidden="true">↗</span>
                  </button>;
                }
                return <article className={`task-card ${activePhase === 0 && index === 0 ? "registration-card" : ""} ${isDone ? "complete" : ""} ${task.warning ? "caution" : ""}`} key={task.title}><button className="task-check" type="button" onClick={() => toggleTask(index)} disabled={activePhase === 0 && index === 0 && !selectedColor} aria-pressed={isDone} aria-label={`${isDone ? "取消完成" : "标记完成"}：${task.title}`}>{isDone ? <Icon name="check" /> : <span>{String(index + 1).padStart(2, "0")}</span>}</button><div className="task-content"><div className="task-title-row"><h3>{task.title}</h3>{task.warning && <span className="safety-tag">安全要点</span>}</div>{task.lines.length > 0 && <ul>{task.lines.map((line) => <li key={line}>{line}</li>)}</ul>}
                    {activePhase === 0 && index === 0 && (
                      <>
                      <fieldset className="color-picker">
                        <legend className="visually-hidden">选择憨憨颜色</legend>
                        <div className="color-options">
                          {petColors.map((color) => (
                            <label className={`color-option ${selectedColor === color.id ? "is-selected" : ""}`} key={color.id}>
                              <input type="radio" name="hanhan-color" value={color.id} checked={selectedColor === color.id} onChange={() => setSelectedColor(color.id)} />
                              <span className={`color-photo color-photo-${color.id}`}>
                                <img src={color.image} alt={`${color.name}憨憨`} />
                                <span className="color-check" aria-hidden="true">{selectedColor === color.id && <Icon name="check" />}</span>
                              </span>
                              <span className="color-label"><i className={`color-swatch swatch-${color.id}`} aria-hidden="true" />{color.name}</span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <div className="registration-fields">
                        <fieldset className="repair-history-field">
                          <legend>是否有维修经历</legend>
                          <div className="repair-options">
                            <label className={repairHistory === "yes" ? "repair-option selected" : "repair-option"}>
                              <input type="radio" name="repair-history" value="yes" checked={repairHistory === "yes"} onChange={() => setRepairHistory("yes")} />
                              <span>是</span>
                            </label>
                            <label className={repairHistory === "no" ? "repair-option selected" : "repair-option"}>
                              <input type="radio" name="repair-history" value="no" checked={repairHistory === "no"} onChange={() => setRepairHistory("no")} />
                              <span>否</span>
                            </label>
                          </div>
                            <div className="registration-field repair-details-field">
                              <label htmlFor="repair-details">维修了哪些方面</label>
                              <textarea id="repair-details" name="repair-details" rows={3} placeholder="请填写维修内容，例如更换电池、维修充电接口" value={repairDetails} onChange={(event) => setRepairDetails(event.target.value)} />
                            </div>
                        </fieldset>
                        <div className="registration-field">
                          <label htmlFor="serial-number">序列号</label>
                          <input id="serial-number" name="serial-number" type="text" placeholder="请输入序列号" autoComplete="off" autoCapitalize="off" spellCheck={false} value={serialNumber} onChange={(event) => setSerialNumber(event.target.value)} />
                        </div>
                      </div>
                      </>
                    )}
                  </div><span className="task-arrow" aria-hidden="true">{isDone ? "♡" : "↗"}</span></article>;
              })}</div>
              <div className="detail-actions"><button type="button" className="secondary-button" onClick={() => setActivePhase((value) => Math.max(0, value - 1))} disabled={activePhase === 0}><span aria-hidden="true">←</span> 上一步</button><span className="task-count" aria-live="polite">已完成 {current.tasks.filter((_, index) => completed.has(taskKey(activePhase, index))).length} / {current.tasks.length} 项</span><button type="button" className="primary-button" onClick={() => setActivePhase((value) => Math.min(phases.length - 1, value + 1))} disabled={activePhase === phases.length - 1}>下一阶段 <span aria-hidden="true">↗</span></button></div></div>
            </section>

            <aside className="context-panel" aria-label="设备状态与去向">
              <section className="progress-card"><div className="section-title"><span><Icon name="heart" />关怀进度</span><strong>{progress}<small>%</small></strong></div><div className="heart-progress" aria-hidden="true">{phases.map((phase, i) => <span className={phaseDone[i] ? "filled" : ""} key={phase.number}>♥</span>)}</div><div className="progress-track" role="progressbar" aria-label="检测完成度" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><i style={{width: `${progress}%`}} /></div><p>{completed.size === totalTasks ? "所有步骤已勾选，记得核对检测结果。" : `已经完成 ${completed.size} 项检查，一点一点更安心。`}</p></section>
              <section className="status-preview" id="status-card"><div className="section-title"><span><Icon name="card" />状态卡预览</span><span className="draft-tag">草稿</span></div><div className="status-grid">{[["外观", "待扫描"], ["功能", "待测试"], ["数据", "待授权"], ["结论", "未确认"]].map(([name, status]) => <div className="status-item" key={name}><span>{name}</span><b>{status}</b></div>)}</div><p className="card-note">步骤勾选仅记录进度，检测结果待人工确认。</p></section>
            </aside>
          </div>
          <div className="care-bottom"><section className="guard-card" id="care-notes"><div className="section-title"><span><Icon name="shield" />温柔照顾，也认真守护</span><span className="small-label">护理须知</span></div><ul><li>安全异常未排除前，不恢复通电</li><li>私人数据未经单独授权，不查看</li><li>无法测试与未确认的项目，原样保留</li></ul></section><section className="destination-card" id="destination"><div className="section-title"><span><Icon name="sun" />下一站，也要被好好爱</span><span className="small-label">用户选择去向</span></div><div className="destination-grid">{destinations.map((item) => <button key={item} type="button" className={destination === item ? "selected" : ""} onClick={() => setDestination(item)} aria-pressed={destination === item}>{item}{destination === item && <span aria-hidden="true"> ↗</span>}</button>)}</div></section></div>
        </section>
        <footer className="page-footer"><span>HANHAN CARE LAB</span><p>让陪伴，久一点。<span aria-hidden="true"> ♡</span></p><span>MADE WITH CARE</span></footer>

      </section>
      <dialog className="inspection-agreement" id="inspection-agreement" ref={agreementDialog} aria-labelledby="agreement-title" aria-describedby="agreement-intro" onClose={() => setAgreementAccepted(false)}>
        <div className="agreement-header"><div><p className="eyebrow">HANHAN CARE LAB</p><h2 id="agreement-title">检测范围与授权协议</h2></div><button className="agreement-close" type="button" aria-label="关闭检测协议" onClick={() => agreementDialog.current?.close()}>×</button></div>
        <div className="agreement-body">
          <p id="agreement-intro">请阅读本次可检查的项目及说明，确认后授权检测。</p>
          <section aria-labelledby="agreement-items-title"><h3 id="agreement-items-title">本次可检查的项目</h3><ul className="agreement-items">
            <li><strong>外观扫描</strong><p>多角度拍摄设备外观，记录污渍、掉毛、破损、开裂和零件缺失，必要时人工翻面补拍。</p></li>
            <li><strong>安全检查</strong><p>检查设备外观、接口及温度，识别鼓包、漏液、烧焦、潮湿和异常发热等情况。</p></li>
            <li><strong>通电与功能测试</strong><p>安全检查通过后，按型号要求限压限流供电，检查开机、显示、声音、互动、充电及设备支持的连接功能。</p></li>
            <li><strong>人工复核与状态卡</strong><p>核对异常、补充检查，并汇总外观、功能结果及处理建议。</p></li>
          </ul></section>
          <section className="agreement-notes" aria-labelledby="agreement-notes-title"><h3 id="agreement-notes-title">检测说明</h3><ul>
            <li>具体项目以设备支持的功能及实际状态为准。无法测试或结果不明确的项目，会标注“无法测试”或“未确认”。</li>
            <li>发现安全异常时停止测试，交由工作人员处理；安全异常未排除前，不恢复通电。</li>
            <li>数据检查需另行说明读取范围并单独取得授权。本次授权不包含查看私人内容、备份、清除数据或账号解绑。</li>
            <li>检测完成后，由用户选择继续使用、维修、转赠或回收；本次授权仅用于上述检测。</li>
          </ul></section>
        </div>
        <div className="agreement-footer"><label className="agreement-consent"><input type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} /><span>我已阅读并理解以上检测项目与说明，同意授权本次检测。</span></label><div className="agreement-actions"><button type="button" className="secondary-button" onClick={() => agreementDialog.current?.close()}>{scopeAuthorized ? "关闭" : "暂不授权"}</button><button type="button" className="primary-button" disabled={!agreementAccepted} onClick={authorizeInspection}>{scopeAuthorized ? "完成" : "同意并授权检测"}</button></div></div>
      </dialog>
      <dialog className="inspection-agreement" id="placement-instructions" ref={placementDialog} aria-labelledby="placement-title" aria-describedby="placement-intro">
        <div className="agreement-header"><div><p className="eyebrow">操作提示</p><h2 id="placement-title">放入憨憨并连接电源</h2></div><button className="agreement-close" type="button" aria-label="关闭操作提示" onClick={() => placementDialog.current?.close()}>×</button></div>
        <div className="agreement-body">
          <p id="placement-intro">完成以下操作后，点击“已完成”，本步骤会自动打勾。</p>
          <ol className="placement-instructions-list">
            <li>将憨憨放在毛绒垫中央，整理四肢和毛绒，避免遮住眼睛和接口。</li>
            <li>确认接口干燥、没有明显损坏后，插入 Type-C 电源线，暂不通电。</li>
            <li>将线沿垫子外侧放好，确认线缆未受压，关闭透明盖。</li>
          </ol>
          <p className="placement-power-note">通电测试将在安全检查通过后进行。</p>
        </div>
        <div className="agreement-footer"><div className="agreement-actions"><button type="button" className="secondary-button" onClick={() => placementDialog.current?.close()}>{placementCompleted ? "关闭" : "稍后操作"}</button><button type="button" className="primary-button" onClick={completePlacement}>已完成</button></div></div>
      </dialog>
    </main>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
    scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4M3 12h18" /><path d="M8 8h8v8H8z" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>,
    card: <><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  };
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.heart}</svg>;
}
