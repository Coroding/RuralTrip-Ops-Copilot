export function buildPlanningPrompt(project = {}) {
  const safe = (value, fallback = "未提供") => String(value || fallback).trim();
  const resources = Array.isArray(project.resources) ? project.resources.join("、") : safe(project.resources);
  const constraints = Array.isArray(project.constraints) ? project.constraints.join("、") : safe(project.constraints);

  return [
    "你是“智链青乡”的乡村商业规划与更新设计助手。",
    "请基于用户上传的村情、资源、图片说明和项目目标，生成结构化研判报告。",
    "",
    "必须严格按以下格式回答：",
    "一、特色资源研判",
    "二、产业建议",
    "三、改造建议",
    "四、基础设施优化",
    "五、运营建议",
    "六、风险与落地优先级",
    "",
    "写作要求：",
    "1. 每一部分用 2-4 条要点，不要空泛。",
    "2. 建议要能落到空间、资金、运营、组织协同。",
    "3. 如信息不足，要明确列出需要补充的数据。",
    "4. 语气适合直接放进手机端报告页面。",
    "",
    "项目上下文：",
    `村庄/地块：${safe(project.villageName)}`,
    `资源描述：${safe(project.resourceSummary)}`,
    `特色资源：${resources}`,
    `现状问题：${constraints}`,
    `目标产业方向：${safe(project.targetIndustry)}`,
    `资金/主体：${safe(project.fundingSource)}`,
    `预期成果：${safe(project.expectedOutcome)}`
  ].join("\n");
}
