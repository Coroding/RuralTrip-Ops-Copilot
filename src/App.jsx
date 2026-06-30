import React, { useMemo, useState } from "react";

const assets = {
  village: "https://www.figma.com/api/mcp/asset/3ab5c426-dca8-4e42-836d-a20f1f4b5b4b",
  cropChart: "https://www.figma.com/api/mcp/asset/e8d5f2fe-be6c-4909-b022-a80251ccbade",
  aiLogo: "https://www.figma.com/api/mcp/asset/894aa46e-2386-4662-a5ba-c75de329a3a6",
  robot: "https://www.figma.com/api/mcp/asset/6a0f3841-6f68-44e8-8daa-332221f5b889",
  publishPreview: "https://www.figma.com/api/mcp/asset/87d0caa4-0e31-4335-9b8c-97fb38cc79f6",
  projectA: "https://www.figma.com/api/mcp/asset/f20890ff-e620-4be5-a8c5-7baac1c069c0",
  projectB: "https://www.figma.com/api/mcp/asset/008b57c1-ef92-4475-9e54-65cf7278233b",
  projectC: "https://www.figma.com/api/mcp/asset/022cfe02-4adc-42ea-b050-52c69810a90d"
};

const screenList = [
  { id: "guide", label: "系统指引" },
  { id: "upload", label: "资料上传" },
  { id: "overview", label: "资源概览" },
  { id: "analysis", label: "数据分析" },
  { id: "report", label: "报告输出" },
  { id: "publish", label: "项目发布" },
  { id: "manage", label: "项目管理" },
  { id: "progress", label: "项目进度" },
  { id: "services", label: "商业服务" },
  { id: "messages", label: "消息" },
  { id: "course", label: "参与课程" }
];

const bottomNav = [
  { id: "overview", label: "地块详情", mark: "M" },
  { id: "analysis", label: "方案生成", mark: "AI" },
  { id: "publish", label: "项目发布", mark: "+" },
  { id: "manage", label: "项目监控", mark: "O" },
  { id: "messages", label: "我的", mark: "U" }
];

const defaultProject = {
  villageName: "崇明镇竖新村",
  idleLand: "23.58ha",
  recentProjects: "3个",
  resourceSummary: "竖新村生态资源丰富，具备发展花卉精油、特色餐饮和婚庆宴席的基础，但当前产业链条短、配套服务不完善，缺乏统一品牌和市场推广。",
  resources: "闲置土地、花卉种植基础、乡村院落、生态景观",
  constraints: "产业链条短、接待能力不足、品牌弱、交通导览不完善",
  targetIndustry: "花卉精油生态产业园",
  fundingSource: "镇村政府",
  expectedOutcome: "建设50亩花卉种植基地，打造精油加工小型工坊与乡村花坊体验馆。",
  resourceImage: assets.village,
  chartImage: assets.cropChart,
  previewImage: assets.publishPreview
};

const apiBase = window.location.protocol === "file:" ? "http://127.0.0.1:8787" : "";

async function askDeepSeek({ topic, project }) {
  const response = await fetch(`${apiBase}/api/deepseek/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      temperature: 0.6,
      projectContext: { ...project, targetIndustry: topic || project.targetIndustry },
      userPrompt: "请按照模板输出完整规划建议。"
    })
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.detail?.message || "DeepSeek 调用失败");
  }
  return data.content;
}

function App() {
  const initialScreen = new URLSearchParams(window.location.search).get("screen");
  const [active, setActive] = useState(screenList.some((item) => item.id === initialScreen) ? initialScreen : "guide");
  const [toast, setToast] = useState("");
  const [projectData, setProjectData] = useState(defaultProject);
  const title = useMemo(() => screenList.find((item) => item.id === active)?.label || "系统指引", [active]);

  function go(screen) {
    setActive(screen);
    const url = new URL(window.location.href);
    url.searchParams.set("screen", screen);
    window.history.replaceState(null, "", url);
    window.setTimeout(() => {
      document.querySelector(".phone-content")?.scrollTo({ top: 0, behavior: "smooth" });
    }, 30);
  }

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1600);
  }

  return (
    <div className="min-h-screen bg-[#e9ecea] px-4 py-5 text-[#1f2926] lg:flex lg:items-center lg:justify-center lg:gap-7">
      <aside className="mx-auto mb-4 max-w-[480px] rounded-2xl bg-white/90 p-4 shadow-soft lg:mx-0 lg:w-64">
        <h1 className="text-lg font-bold">commercial planning</h1>
        <p className="mt-1 text-sm text-[#687772]">智链青乡交互原型</p>
        <div className="mt-4 grid grid-cols-3 gap-2 lg:grid-cols-1">
          {screenList.map((screen) => (
            <button
              key={screen.id}
              className={`rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                active === screen.id ? "bg-[#206754] text-white shadow-soft" : "bg-white text-[#4f615c] hover:bg-[#eef7f4]"
              }`}
              onClick={() => go(screen.id)}
            >
              {screen.label}
            </button>
          ))}
        </div>
      </aside>

      <section aria-label={title} className="relative mx-auto w-fit">
        <PhoneShell active={active} go={go} darkStatus={["guide", "overview"].includes(active)} withBottom={!["guide", "upload", "analysis", "report", "publish", "manage"].includes(active)}>
          <div key={active} className="screen-page">
            {active === "guide" && <GuideScreen go={go} />}
            {active === "upload" && <UploadScreen go={go} projectData={projectData} setProjectData={setProjectData} />}
            {active === "overview" && <OverviewScreen go={go} projectData={projectData} />}
            {active === "analysis" && <AnalysisScreen go={go} />}
            {active === "report" && <ReportScreen go={go} projectData={projectData} />}
            {active === "publish" && <PublishScreen go={go} showToast={showToast} projectData={projectData} />}
            {active === "manage" && <ManageScreen go={go} projectData={projectData} />}
            {active === "progress" && <ProgressScreen go={go} projectData={projectData} />}
            {active === "services" && <ServicesScreen go={go} projectData={projectData} />}
            {active === "messages" && <MessagesScreen go={go} />}
            {active === "course" && <CourseScreen go={go} />}
          </div>
        </PhoneShell>
        {toast && <div className="absolute left-1/2 top-8 z-50 -translate-x-1/2 rounded-full bg-black/75 px-5 py-2 text-white">{toast}</div>}
      </section>
    </div>
  );
}

function PhoneShell({ active, go, children, darkStatus = false, withBottom = true }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <main className="phone-screen">
        <StatusBar dark={darkStatus} />
        <div className={`phone-content ${withBottom ? "with-bottom" : ""}`}>{children}</div>
        {withBottom && <BottomNav active={active} go={go} />}
      </main>
    </div>
  );
}

function StatusBar({ dark }) {
  return (
    <div className={`status-bar ${dark ? "text-white" : "text-black"}`}>
      <span>9:30</span>
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-current opacity-30" />
        <span className="h-5 w-1 rounded-full bg-current opacity-50" />
        <span className="h-6 w-1 rounded-full bg-current opacity-70" />
        <span className="h-4 w-9 rounded border-2 border-current">
          <span className="block h-full w-7 rounded-sm bg-current opacity-60" />
        </span>
      </div>
    </div>
  );
}

function Header({ title, onBack, dark = false, right = true }) {
  return (
    <div className={`sticky top-0 z-10 flex h-14 items-center justify-between px-6 backdrop-blur ${dark ? "text-white" : "text-[#202020]"}`}>
      <button className="grid h-10 w-10 place-items-center text-4xl leading-none" onClick={onBack} aria-label="返回">
        ‹
      </button>
      <h2 className="max-w-[300px] truncate text-center text-xl font-extrabold">{title}</h2>
      {right ? <span className="h-7 w-7 rounded-full border-[5px] border-current" /> : <span className="h-7 w-7" />}
    </div>
  );
}

function BottomNav({ active, go }) {
  return (
    <nav className="bottom-nav">
      {bottomNav.map((item) => {
        const selected = active === item.id || (active === "progress" && item.id === "manage") || (active === "services" && item.id === "overview");
        return (
          <button key={item.id} className={`bottom-item ${selected ? "active" : ""} ${item.id === "publish" ? "publish" : ""}`} onClick={() => go(item.id)}>
            <span>{item.mark}</span>
            <small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}

function GuideScreen({ go }) {
  const steps = [
    ["1", "资料上传", "上传地块图片、图表和村情信息。"],
    ["2", "资源识别", "查看闲置土地、人口、产业和建筑风貌。"],
    ["3", "智能分析", "AI 计算适宜方向，输出产业建议。"],
    ["4", "报告生成", "按固定模板形成完整研判报告。"]
  ];

  return (
    <div className="guide-bg min-h-full px-7 pb-8 pt-4 text-white">
      <div className="mt-7 border-b border-white/20 pb-5">
        <h2 className="text-3xl font-extrabold">智链青乡</h2>
        <p className="mt-2 text-sm text-white/85">乡村资源价值释放助手</p>
      </div>
      <section className="mt-7">
        <p className="text-sm text-white/70">系统指引</p>
        <h1 className="mt-3 text-[34px] font-semibold leading-tight">从资源盘点到项目落地的一站式规划流程</h1>
      </section>
      <div className="mt-7 space-y-3">
        {steps.map(([num, title, desc]) => (
          <button key={num} className="guide-step" onClick={() => go(num === "1" ? "upload" : num === "2" ? "overview" : num === "3" ? "analysis" : "report")}>
            <span>{num}</span>
            <div>
              <strong>{title}</strong>
              <p>{desc}</p>
            </div>
          </button>
        ))}
      </div>
      <button className="mt-8 w-full rounded-2xl bg-white px-6 py-4 text-xl font-semibold text-[#226555] shadow-soft" onClick={() => go("upload")}>
        开始体验
      </button>
    </div>
  );
}

function UploadScreen({ go, projectData, setProjectData }) {
  function updateField(name, value) {
    setProjectData((current) => ({ ...current, [name]: value }));
  }

  function uploadImage(name, file) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateField(name, url);
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        setProjectData((current) => ({ ...current, ...parsed }));
      } catch {
        alert("JSON 格式不正确，请参考 data/examples/project-context.example.json");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  return (
    <div className="min-h-full bg-[#f5f5f5] px-6 pb-8 pt-2">
      <Header title="资料上传" onBack={() => go("guide")} />
      <section className="rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-[#2b6757]">项目基础信息</h2>
        <FormInput label="村庄/地块名称" value={projectData.villageName} onChange={(value) => updateField("villageName", value)} />
        <FormInput label="闲置土地面积" value={projectData.idleLand} onChange={(value) => updateField("idleLand", value)} />
        <FormInput label="近期改造项目" value={projectData.recentProjects} onChange={(value) => updateField("recentProjects", value)} />
        <FormInput label="目标产业方向" value={projectData.targetIndustry} onChange={(value) => updateField("targetIndustry", value)} />
        <FormInput label="资金/主体" value={projectData.fundingSource} onChange={(value) => updateField("fundingSource", value)} />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-[#2b6757]">研判文本</h2>
        <TextArea label="资源描述" value={projectData.resourceSummary} onChange={(value) => updateField("resourceSummary", value)} />
        <TextArea label="特色资源" value={projectData.resources} onChange={(value) => updateField("resources", value)} />
        <TextArea label="现状问题" value={projectData.constraints} onChange={(value) => updateField("constraints", value)} />
        <TextArea label="预期成果" value={projectData.expectedOutcome} onChange={(value) => updateField("expectedOutcome", value)} />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-[#2b6757]">图片与图表</h2>
        <UploadBox label="资源照片" image={projectData.resourceImage} onChange={(file) => uploadImage("resourceImage", file)} />
        <UploadBox label="图表图片" image={projectData.chartImage} onChange={(file) => uploadImage("chartImage", file)} />
        <UploadBox label="项目预览图" image={projectData.previewImage} onChange={(file) => uploadImage("previewImage", file)} />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-soft">
        <h2 className="text-xl font-semibold text-[#2b6757]">批量导入</h2>
        <p className="mt-2 text-sm leading-6 text-[#6f7d79]">可以上传 JSON 文件，字段参考 data/examples/project-context.example.json。</p>
        <input className="mt-3 w-full text-sm" type="file" accept="application/json,.json" onChange={(event) => importJson(event.target.files?.[0])} />
      </section>

      <button className="mt-5 w-full rounded-2xl bg-[#2b6757] px-6 py-4 text-lg text-white" onClick={() => go("overview")}>
        保存并进入资源概览
      </button>
    </div>
  );
}

function FormInput({ label, value, onChange }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm text-[#6f7d79]">{label}</span>
      <input className="mt-1 w-full rounded-xl bg-[#f3f6f5] px-3 py-3 outline-none focus:ring-2 focus:ring-[#2b6757]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm text-[#6f7d79]">{label}</span>
      <textarea className="mt-1 min-h-24 w-full resize-y rounded-xl bg-[#f3f6f5] px-3 py-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-[#2b6757]" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function UploadBox({ label, image, onChange }) {
  return (
    <label className="mt-3 block rounded-xl border border-dashed border-[#91b8ae] p-3">
      <span className="text-sm text-[#6f7d79]">{label}</span>
      <div className="mt-2 flex items-center gap-3">
        <img className="h-20 w-28 rounded-lg object-cover" src={image} alt="" />
        <input className="min-w-0 flex-1 text-sm" type="file" accept="image/*" onChange={(event) => onChange(event.target.files?.[0])} />
      </div>
    </label>
  );
}

function OverviewScreen({ go, projectData }) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#226555_0%,#2d7565_30%,#f8f8f8_66%)] px-7 pb-7 pt-4">
      <div className="border-b border-white/20 pb-4 text-white">
        <h2 className="text-2xl font-extrabold">智链青乡</h2>
        <p className="mt-1 text-sm">{projectData.villageName}资源价值释放助手</p>
      </div>
      <h3 className="mt-5 text-xl font-medium text-white">资源概览</h3>
      <MetricCard projectData={projectData} />
      <h3 className="mt-6 text-xl text-[#464444]">地块详情</h3>
      <section className="mt-3 grid grid-cols-2 gap-4 rounded-xl bg-white p-4 shadow-soft">
        {[
          ["土地资源", "闲置土地、低效用地"],
          ["人口追踪", "常住/外来人口，比例"],
          ["产业管理", "投资绩效、员工数量"],
          ["建筑风貌", "建筑质量、建筑年限"]
        ].map(([title, desc]) => (
          <button key={title} className="flex items-start gap-3 text-left" onClick={() => go("services")}>
            <span className="mt-1 h-5 w-5 rounded-full bg-[#2d7565]" />
            <span>
              <strong className="block text-lg font-normal">{title}</strong>
              <small className="text-[#828282]">{desc}</small>
            </span>
          </button>
        ))}
      </section>
      <button className="mt-4 w-full rounded-xl bg-[#e2e5eb] p-4 text-left" onClick={() => go("analysis")}>
        <span className="flex justify-between text-lg font-bold text-[#7e7e7e]">
          数据分析 <em className="not-italic text-sm font-normal text-[#00779e]">查看更多</em>
        </span>
        <p className="mt-2 text-sm leading-6 text-[#787878]">{projectData.resourceSummary}</p>
      </button>
      <button className="mt-4 w-full rounded-2xl bg-[#226555] px-5 py-4 text-lg text-white" onClick={() => go("analysis")}>
        进入智能分析
      </button>
    </div>
  );
}

function MetricCard({ projectData }) {
  return (
    <section className="mt-5 rounded-[22px] bg-white p-5 shadow-soft">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-base text-[#2d2d2d]">闲置土地面积</p>
          <p className="mt-3 text-lg font-semibold">{projectData.idleLand}</p>
        </div>
        <div>
          <p className="text-base text-[#2d2d2d]">近期改造项目</p>
          <p className="mt-3 text-lg font-semibold">{projectData.recentProjects}</p>
        </div>
      </div>
      <div className="relative mt-4 overflow-hidden rounded-lg">
        <img className="h-[164px] w-full object-cover" src={projectData.resourceImage} alt="" />
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {Array.from({ length: 7 }).map((_, index) => (
            <span key={index} className={`h-2 w-2 rounded-full ${index === 1 ? "bg-white" : "bg-[#6d7774]"}`} />
          ))}
        </div>
      </div>
      <img className="mt-3 h-[120px] w-full rounded-md object-cover" src={projectData.chartImage} alt="" />
    </section>
  );
}

function AnalysisScreen({ go }) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#62b893_0%,#dff8f1_47%,#fff_100%)] px-7 pb-8 pt-3">
      <Header title="数据分析" onBack={() => go("overview")} dark />
      <section className="mt-5 rounded-lg bg-[#206754] p-5 text-white">
        <p className="text-sm">当前宜发展</p>
        <h2 className="mt-6 text-center text-4xl font-light">婚庆、精油、餐饮</h2>
      </section>
      <h3 className="mt-8 text-base">土地资源</h3>
      <section className="mt-3 rounded-2xl bg-white/70 p-4 shadow-soft">
        <div className="grid grid-cols-[1fr_150px] gap-4">
          <div className="pie-chart" />
          <div className="space-y-4 pt-8 text-sm text-[#7c8b86]">
            {["山：15%", "水：20%", "林：40%", "田：25%", "湖：5%", "草：5%"].map((item) => <p key={item}>{item}</p>)}
          </div>
        </div>
      </section>
      <h3 className="mt-6 text-base">气候分析</h3>
      <section className="mt-3 rounded-2xl bg-[#bfead7] p-5 shadow-soft">
        <MiniChart title="风速" value="适中" color="#d98f75" />
        <MiniChart title="降水" value="较多" color="#44a6de" />
        <MiniChart title="温度" value="适宜" color="#b54476" />
      </section>
      <button className="mx-auto mt-7 block w-[300px] rounded-full bg-[#7d0812] py-4 text-xl text-white" onClick={() => go("report")}>
        查看报告
      </button>
    </div>
  );
}

function MiniChart({ title, value, color }) {
  return (
    <div className="flex items-center border-b border-white/80 py-4 last:border-b-0">
      <span className="mr-5 h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-16 font-bold text-[#8e706b]">{title}</span>
      <svg className="h-8 flex-1" viewBox="0 0 120 32" aria-hidden="true">
        <polyline fill="none" stroke={color} strokeWidth="4" points="0,22 16,14 28,20 45,9 60,20 75,13 90,24 106,12 120,18" />
      </svg>
      <strong className="ml-5 text-[#8e706b]">{value}</strong>
    </div>
  );
}

function ReportScreen({ go, projectData }) {
  const [topic, setTopic] = useState(projectData.targetIndustry || "花卉精油");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  async function generateAdvice() {
    setAiLoading(true);
    setAiError("");
    try {
      const content = await askDeepSeek({ topic, project: projectData });
      setAiText(content);
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-[#fafafe] px-5 pb-8 pt-2">
      <Header title={`${projectData.villageName}--报告输出`} onBack={() => go("analysis")} />
      <div className="mt-8 flex items-center justify-center gap-8">
        <img className="h-[88px] w-[88px] rounded-2xl" src={assets.aiLogo} alt="" />
        <p className="text-xl text-[#6d6d6d]">AI专业模型计算中......(1/2)</p>
      </div>
      <section className="mt-8 rounded-t-[56px] bg-[linear-gradient(180deg,#387061,#ecf7f3)] px-5 pb-6 pt-7 text-white">
        <h2 className="text-center text-3xl">报告详情</h2>
        <p className="mt-2 text-center text-sm">4月30日 17:05</p>
        <ReportBlock title="村情描述">
          {projectData.resourceSummary}
        </ReportBlock>
        <div className="mt-7 rounded-[24px] bg-[#f8f8f8] p-5 text-[#6d6d6d]">
          <h3 className="text-2xl">报告信息</h3>
          <div className="mt-5 flex justify-between gap-2">
            {["婚宴庆典", "花卉精油", "特色餐饮"].map((item) => (
              <button key={item} onClick={() => setTopic(item)} className={`flex-1 rounded-lg py-2 text-white ${topic === item ? "bg-[#f2b17b] ring-4 ring-white" : "bg-[#ffd5b3]"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="relative mt-4 rounded-2xl bg-[linear-gradient(180deg,#f2b17b,#f8f8f8)] p-4 pl-20 text-[#3c3c3c]">
            <img className="absolute left-4 top-5 h-12 w-12" src={assets.robot} alt="" />
            <p className="text-sm leading-6">
              {projectData.villageName}如果想发展{topic}，可以结合本地资源、市场需求和可持续发展来制定战略。建议打造完整产业链，推动品牌化发展，形成农文旅融合示范。
            </p>
          </div>
        </div>
      </section>
      <section className="mt-5 rounded-[24px] bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-[#2b6757]">DeepSeek 智能补充</h3>
            <p className="mt-1 text-sm text-[#7f8f8a]">根据当前选中的“{topic}”方向生成项目优化建议。</p>
          </div>
          <button
            className="shrink-0 rounded-xl bg-[#2b6757] px-4 py-3 text-sm text-white disabled:opacity-60"
            disabled={aiLoading}
            onClick={generateAdvice}
          >
            {aiLoading ? "生成中" : "生成"}
          </button>
        </div>
        {aiError && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700">{aiError}</p>}
        {aiText && <p className="mt-4 whitespace-pre-wrap rounded-xl bg-[#eef7f4] p-4 text-sm leading-6 text-[#2f4b43]">{aiText}</p>}
      </section>
      <button className="mt-5 w-full rounded-2xl bg-[#2b6757] px-6 py-4 text-lg text-white" onClick={() => go("publish")}>
        进一步生成项目方案
      </button>
    </div>
  );
}

function ReportBlock({ title, children }) {
  return (
    <div className="mt-6 rounded-[24px] bg-[#f8f8f8] p-5 text-[#6d6d6d]">
      <h3 className="text-2xl">{title}</h3>
      <p className="mt-3 rounded-2xl bg-[#eadfdf] p-4 text-sm leading-6 text-black/70">{children}</p>
    </div>
  );
}

function PublishScreen({ go, showToast, projectData }) {
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f9f9f9,#7a9f96)] px-5 pb-8 pt-2">
      <Header title="项目发布" onBack={() => go("report")} />
      <FormRow label="标题：" value={projectData.targetIndustry} />
      <section className="mt-3 rounded-2xl bg-white p-4">
        <h3 className="text-xl">描述：</h3>
        <p className="mt-2 text-sm leading-6 text-[#919d99]">
          {projectData.resourceSummary}
        </p>
        <div className="mt-3 flex items-end justify-between">
          <button className="grid h-16 w-16 place-items-center rounded-2xl bg-[#ececec] text-5xl">+</button>
          <img className="h-[92px] w-[150px] rounded border-2 border-dashed border-[#3db0a1] object-cover" src={projectData.previewImage} alt="" />
        </div>
      </section>
      <FormRow label="资金支持：" value={projectData.fundingSource} />
      <FormRow label="分类：" value="乡村文旅融合类" />
      <section className="mt-3 rounded-2xl bg-white p-4">
        <h3 className="text-xl">预期成果：</h3>
        <p className="mt-2 text-sm leading-6 text-[#497d6f]">
          {projectData.expectedOutcome}
        </p>
      </section>
      <FormRow label="同步到联络站：" value="上海崇明工作站" />
      <div className="mt-8 flex justify-around text-white">
        <ActionButton label="保存" mark="S" onClick={() => showToast("已保存草稿")} />
        <ActionButton label="发布" mark="P" active onClick={() => { showToast("项目已发布"); go("manage"); }} />
        <ActionButton label="取消" mark="X" onClick={() => go("report")} />
      </div>
    </div>
  );
}

function FormRow({ label, value }) {
  return (
    <div className="mt-3 flex items-center rounded-2xl bg-white p-4 text-xl">
      <span>{label}</span>
      <strong className="ml-6 font-medium text-[#2b6757]">{value}</strong>
    </div>
  );
}

function ActionButton({ label, mark, active = false, onClick }) {
  return (
    <button className="flex flex-col items-center gap-2" onClick={onClick}>
      <span className={`grid h-[88px] w-[88px] place-items-center rounded-full text-4xl shadow-soft ${active ? "bg-[linear-gradient(180deg,#fff,#ffc354)] text-white" : "bg-white/40"}`}>{mark}</span>
      <span>{label}</span>
    </button>
  );
}

function ManageScreen({ go, projectData }) {
  return (
    <div className="min-h-full bg-[#f5f5f5] px-7 pb-8 pt-2">
      <Header title="项目管理" onBack={() => go("publish")} />
      <h2 className="mt-3 text-3xl">舒明琦|共创设计师</h2>
      <p className="text-sm">项目工作时长·2025年1月8日至4月5日</p>
      <section className="mt-5 rounded-t-[56px] bg-[linear-gradient(180deg,#8fb7aa,#f5f5f5_58%)] p-7">
        <p className="text-xl">历史共参与 <span className="mx-2 text-5xl">7</span> 个项目</p>
        <p className="mt-3">系统排名第7名</p>
        <AreaChart />
      </section>
      <div className="mt-2 flex items-center gap-7 rounded-2xl bg-white p-5 text-2xl">
        <span>项目平均收益率</span>
        <strong>30%</strong>
        <span className="text-red-500">↑</span>
      </div>
      <button className="mt-8 flex w-full items-center justify-between text-left text-2xl" onClick={() => go("progress")}>
        过往项目 <span className="text-5xl">›</span>
      </button>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[projectData.resourceImage, projectData.previewImage, assets.projectC].map((src) => (
          <img key={src} className="h-[150px] rounded-2xl border-4 border-white object-cover" src={src} alt="" />
        ))}
      </div>
    </div>
  );
}

function AreaChart() {
  return (
    <svg className="mt-8 h-[330px] w-full" viewBox="0 0 360 260" aria-label="项目趋势图">
      <defs>
        <linearGradient id="blueArea" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#72b8e8" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
        <linearGradient id="greenArea" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#c9e3bf" />
          <stop offset="1" stopColor="#fff" />
        </linearGradient>
      </defs>
      <text x="30" y="28" fontSize="18" fontWeight="700">2024下半年</text>
      <text x="30" y="58" fontSize="12">项目参与量</text>
      <text x="31" y="78" fill="#6992bd" fontSize="16" fontWeight="700">5个</text>
      <text x="90" y="58" fontSize="12">项目浏览量</text>
      <text x="91" y="78" fill="#7eb872" fontSize="16" fontWeight="700">13个</text>
      <path d="M0 230 L0 145 L70 152 L140 70 L220 70 L300 50 L360 10 L360 230 Z" fill="url(#blueArea)" />
      <path d="M0 230 L0 130 L80 125 L145 105 L220 25 L295 -25 L360 -40 L360 230 Z" fill="url(#greenArea)" opacity=".72" />
      <polyline points="0,145 70,152 140,70 220,70 300,50 360,10" fill="none" stroke="#75addd" />
      <polyline points="0,130 80,125 145,105 220,25 295,-25 360,-40" fill="none" stroke="#70aa6d" />
    </svg>
  );
}

function ProgressScreen({ go, projectData }) {
  const [percent, setPercent] = useState(45);
  return (
    <div className="min-h-full bg-[linear-gradient(180deg,#f5f5f5_0%,#b8ccc6_16%,#f5f5f5_68%)] px-6 pb-7 pt-2">
      <Header title="项目管理" onBack={() => go("manage")} />
      <button className="mt-2 rounded-2xl bg-white/80 px-5 py-3 text-base">我的项目</button>
      <div className="mt-4 grid grid-cols-3 gap-3">
          {[projectData.resourceImage, projectData.previewImage, assets.projectC].map((src) => (
          <img key={src} className="h-[118px] rounded-xl border-4 border-white object-cover" src={src} alt="" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[assets.projectA, assets.cropChart, assets.projectB, assets.projectC].map((src) => (
          <img key={src} className="h-[120px] rounded-xl object-cover" src={src} alt="" />
        ))}
      </div>
      <section className="mt-8 rounded-[26px] bg-[#328d78] p-6 text-white">
        <p className="text-lg">项目进度　开始时间：2024年5月20日</p>
        <div className="mt-8 flex items-end justify-center gap-4">
          <span>已整合</span>
          <strong className="text-7xl">{percent}%</strong>
          <span>闲置土地</span>
        </div>
        <div className="mt-8 flex items-end justify-center gap-4">
          <span>已建设</span>
          <strong className="text-5xl">1256m²</strong>
        </div>
        <input className="mt-8 w-full accent-white" type="range" min="20" max="80" value={percent} onChange={(event) => setPercent(event.target.value)} />
        <p className="mt-5 text-3xl">已消耗资金 14520元</p>
      </section>
    </div>
  );
}

function ServicesScreen({ go, projectData }) {
  const [tab, setTab] = useState("商业服务");
  const tabs = ["村宅改造", "商业服务", "乡民服务站", "共创工坊"];
  const cards = [
    [projectData.resourceImage, projectData.targetIndustry],
    [projectData.previewImage, projectData.villageName],
    [assets.projectB, "项目名称"],
    [assets.projectA, "项目名称"],
    [assets.cropChart, "项目名称"],
    [assets.projectC, "项目名称"]
  ];
  return (
    <div className="min-h-full bg-[#f5f5f5] px-5 pb-7 pt-4">
      <div className="flex items-center gap-2">
        <button onClick={() => go("overview")} className="text-4xl">‹</button>
        <div className="flex flex-1 items-center justify-around text-base">
          {tabs.map((item) => (
            <button key={item} onClick={() => setTab(item)} className={tab === item ? "text-xl font-semibold text-black" : "text-[#8f8f8f]"}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-5 flex h-10 items-center rounded-full bg-[#d9d9d9] px-4 text-[#9a9a9a]">
        <span className="mr-2">Search</span><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="搜索内容" />
      </label>
      <section className="mt-5 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#7c8b86]">当前分类</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#2b6757]">{tab}</h2>
          </div>
          <button className="rounded-xl bg-[#eef7f4] px-4 py-2 text-sm text-[#2b6757]" onClick={() => go("upload")}>更新资料</button>
        </div>
        <p className="mt-3 text-sm leading-6 text-[#6f7d79]">
          系统依据上传资料推荐适合转化为商业服务的空间与资源，点击卡片可进入项目进度管理。
        </p>
      </section>
      <div className="mt-5 grid grid-cols-2 gap-4">
        {cards.map(([src, title], index) => (
          <button key={`${src}-${index}`} className="overflow-hidden rounded-2xl bg-white text-left shadow-soft" onClick={() => go("progress")}>
            <div className="relative h-[158px]">
              <img className="h-full w-full object-cover" src={src} alt="" />
              <span className="absolute left-2 top-2 rounded-full bg-[#0f6758] px-3 py-1 text-xs text-white">标题标签</span>
              <span className="absolute bottom-2 left-3 rounded-full bg-[#0f6758] px-3 text-xs text-white">5分</span>
            </div>
            <p className="p-3">{title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessagesScreen({ go }) {
  const people = [
    ["青小乡", "智链青乡APP机器人", "欢迎注册智链青乡！"],
    ["陈日辰", "上海崇明联络站村支书", "您好，规划村民宿项目有关想了解......"],
    ["周亦大", "上海崇明联络站村支书", "我们这边的花卉精油项目可以合作......"],
    ["赖木风", "", "我们已经相互关注了，开始聊天吧......"],
    ["王月", "", "我们已经相互关注了，开始聊天吧......"],
    ["王圣喆", "", "我们已经相互关注了，开始聊天吧......"],
    ["舒晓玲", "", "哈哈哈"]
  ];
  return (
    <div className="min-h-full bg-white px-6 pb-7 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">消息</h1>
        <button className="text-3xl" onClick={() => go("guide")}>↩</button>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {["赞和收藏", "新增关注", "评论和@"].map((item) => (
          <button key={item} className="rounded-2xl bg-[#b7cbc5] p-4 text-center text-sm shadow-soft">
            <span className="mx-auto mb-2 block h-10 w-10 rounded-xl bg-white/80" />
            {item}
          </button>
        ))}
      </div>
      <label className="mt-6 flex h-10 items-center rounded-full bg-[#d9d9d9] px-4 text-[#9a9a9a]">
        <span className="mr-2">Search</span><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="搜索内容" />
      </label>
      <div className="mt-5 divide-y divide-[#8bb5ac]">
        {people.map(([name, badge, desc], index) => (
          <button key={name} className="flex w-full items-center gap-4 py-4 text-left">
            <span className={`grid h-14 w-14 place-items-center rounded-full text-lg font-semibold ${index % 2 ? "bg-[#e6f0ff]" : "bg-[#f1e6ff]"}`}>{name.slice(0, 1)}</span>
            <span>
              <strong className="text-lg font-normal">{name}</strong>
              {badge && <em className="ml-2 text-xs not-italic text-[#5a9ee8]">{badge}</em>}
              <small className="mt-2 block text-[#8d8d8d]">{desc}</small>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CourseScreen() {
  const courses = [
    ["乡村振兴工作法", "03/03", "已完成 80%"],
    ["共创设计基础", "03/04", "已完成 45%"],
    ["村庄商业策划", "03/05", "已完成 30%"],
    ["项目运营入门", "03/06", "已完成 25%"],
    ["空间更新案例", "03/07", "已完成 60%"],
    ["联络站协同", "03/08", "已完成 15%"]
  ];
  return (
    <div className="min-h-full bg-[#f5f5f5] px-5 pb-7 pt-5">
      <div className="flex items-center justify-around text-base">
        {["参与竞赛", "参与课程", "乡村联盟"].map((item) => (
          <button key={item} className={item === "参与课程" ? "text-xl font-semibold text-black" : "text-[#8f8f8f]"}>
            {item}
          </button>
        ))}
      </div>
      <label className="mt-6 flex h-10 items-center rounded-full bg-[#d9d9d9] px-4 text-[#9a9a9a]">
        <span className="mr-2">Search</span><input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="搜索内容" />
      </label>
      <div className="mt-8 grid grid-cols-2 gap-5">
        {courses.map(([title, date, progress]) => (
          <button key={title} className="text-left">
            <span className="mb-3 inline-block rounded-full bg-[#0f6758] px-4 py-1 text-xs text-white">标题标签</span>
            <div className="h-[110px] rounded-lg bg-[linear-gradient(135deg,#9bd7c7,#4dcad3)] p-3 text-white shadow-soft">
              <p className="text-xs">{title}</p>
              <p className="mt-5 text-right text-sm font-bold">{date}</p>
            </div>
            <span className="mt-2 inline-block rounded-full bg-[#0f6758] px-3 text-xs text-white">{progress}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
