import { deepFreeze } from "../model.mjs";

const ALL_PHASES = ["PHASE-1", "PHASE-2", "PHASE-3"];
const ANALYSIS_DIMENSIONS = [
  "SCHOOL_STAGE",
  "SUBJECT",
  "TASK_TYPE",
  "INPUT_METHOD",
  "NETWORK_CONDITION",
  "ACCESSIBILITY_CONTEXT",
];

export const metricGroups = deepFreeze([
  {
    id: "MET-GROUP-USER-CLOSURE",
    label: "用户闭环",
    definition: "学生、教师和学校能否在正常与异常路径中完成各自核心任务。",
    phaseIds: ALL_PHASES,
    metricIds: ["MET-002", "MET-005"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "不得用于学生、教师或学校的公开排名和惩罚。",
  },
  {
    id: "MET-GROUP-FACT-RELIABILITY",
    label: "事实可靠性",
    definition: "身份、关系、权限、提交、版本和历史是否完整、准确、可恢复且可追溯。",
    phaseIds: ALL_PHASES,
    metricIds: ["MET-006"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "不得通过降低校验门槛或忽略失败记录提高表面成功率。",
  },
  {
    id: "MET-GROUP-AI-TEACHING-QUALITY",
    label: "AI 教学质量",
    definition: "AI 评定、反馈、视频和理解验证是否正确、可解释并产生有效下一步。",
    phaseIds: ["PHASE-2", "PHASE-3"],
    metricIds: ["MET-003"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "不得单向压低无法判断率，也不得以覆盖率掩盖错误结论。",
  },
  {
    id: "MET-GROUP-SAFETY-DATA-RIGHTS",
    label: "安全与数据权利",
    definition: "未成年人保护、授权、纠正、导出、迁移、删除和外部处理是否成立。",
    phaseIds: ALL_PHASES,
    metricIds: ["MET-004"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "任何增长或效率指标都不得抵消越权、身份错绑、事实丢失或安全伤害。",
  },
  {
    id: "MET-GROUP-FAIRNESS-ACCESSIBILITY",
    label: "公平与可及",
    definition: "小学与初中、语数英、不同输入、弱网和无障碍场景是否获得可用的基本学习帮助。",
    phaseIds: ALL_PHASES,
    metricIds: ["MET-007"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "不得依据公开排名、永久弱项标签或家庭付费能力剥夺基本帮助。",
  },
  {
    id: "MET-GROUP-TEACHER-SCHOOL-EFFICIENCY",
    label: "教师与学校效率",
    definition: "产品是否减少人工分析和日常评定负担，同时没有把工作转嫁给学生、教师或平台支持。",
    phaseIds: ALL_PHASES,
    metricIds: ["MET-001"],
    analysisDimensions: ANALYSIS_DIMENSIONS,
    prohibitedUse: "不得只计算局部点击或教师时间而忽略纠错、学生负担和平台支持总成本。",
  },
]);

export const launchGates = deepFreeze([
  {
    id: "GATE-ZERO-TOLERANCE",
    label: "零容忍硬不变量",
    gateType: "ZERO_TOLERANCE",
    ownerRef: "ROLE-PLATFORM-OPS",
    phaseIds: ALL_PHASES,
    metricGroupIds: [
      "MET-GROUP-FACT-RELIABILITY",
      "MET-GROUP-SAFETY-DATA-RIGHTS",
      "MET-GROUP-FAIRNESS-ACCESSIBILITY",
    ],
    blockingConditions: [
      "跨学校、关系、对象、用途或期限的数据越权",
      "学生、教师或监护人身份错绑",
      "原始答案、媒体、提交或历史版本被覆盖或丢失",
      "删除、转学、取消或归档后无权数据重新参与业务或搜索",
      "AI 或平台故障导致学生被判错、迟交、能力下降或失去已发布活动履约",
      "未授权外部训练、复用、转交或公共内容晋升",
      "必要权限、安全、隐私、权利或教学正确性检查失败后仍发布",
    ],
    evidenceRequirements: [
      "每个硬不变量有可复现的正向、拒绝和恢复场景",
      "审计记录能够证明主体、对象、用途、版本、结果和修复闭环",
      "发现一个可复现实例即阻断对应阶段上线，不允许用平均指标抵消",
    ],
  },
  {
    id: "GATE-QUALITY-THRESHOLD",
    label: "阈值型质量门",
    gateType: "QUALITY_THRESHOLD",
    ownerRef: "ROLE-ACADEMIC",
    phaseIds: ALL_PHASES,
    metricGroupIds: [
      "MET-GROUP-USER-CLOSURE",
      "MET-GROUP-AI-TEACHING-QUALITY",
      "MET-GROUP-FAIRNESS-ACCESSIBILITY",
      "MET-GROUP-TEACHER-SCHOOL-EFFICIENCY",
    ],
    blockingConditions: [
      "阶段适用的识别、评定、视频、可及性、闭环或效率指标低于试点前冻结的最低阈值",
      "阈值未按学段、学科、任务类型、输入方式、弱网和无障碍场景分层",
      "在看到试点结果后倒推刚好通过的阈值或删除失败样本",
    ],
    evidenceRequirements: [
      "试点前冻结指标定义、分母、分层、采集方式、观察窗口、样本要求、目标、护栏和未达标动作",
      "第一阶段只应用事实底座、闭环、可及性和效率阈值，不因尚未启用的 AI 指标被阻塞",
      "第二、第三阶段分别增加其 AI 教学和长期认知质量阈值",
    ],
  },
  {
    id: "GATE-EVIDENCE-COMPLETENESS",
    label: "证据完整门",
    gateType: "EVIDENCE_COMPLETENESS",
    ownerRef: "ROLE-SCHOOL-ADMIN",
    phaseIds: ALL_PHASES,
    metricGroupIds: [
      "MET-GROUP-USER-CLOSURE",
      "MET-GROUP-FACT-RELIABILITY",
      "MET-GROUP-AI-TEACHING-QUALITY",
      "MET-GROUP-SAFETY-DATA-RIGHTS",
      "MET-GROUP-FAIRNESS-ACCESSIBILITY",
      "MET-GROUP-TEACHER-SCHOOL-EFFICIENCY",
    ],
    blockingConditions: [
      "关键角色、端到端流程、越权、失败恢复、转学、删除、弱网、无障碍或套餐变化场景缺少证据",
      "用页面清单、接口数量、AI 可调用或演示视频替代真实角色验收",
      "历史、权限、数据权利或异常路径无法在界面与审计事实中得到证明",
    ],
    evidenceRequirements: [
      "真实角色完成正常、边界和失败端到端场景",
      "权限和数据归属同时具有正向与越权证据",
      "失败、超时、重复请求、恢复和版本冲突作为正式验收场景",
      "阶段声明只覆盖已通过证据的能力，不把规划合同表述为已上线",
    ],
  },
]);
