# 六组指标与三类上线门

## 指标组

| 指标组 | 定义 | 阶段 | 指标 | 分析维度 | 禁止用途 |
| --- | --- | --- | --- | --- | --- |
| MET-GROUP-USER-CLOSURE 用户闭环 | 学生、教师和学校能否在正常与异常路径中完成各自核心任务。 | `PHASE-1`、`PHASE-2`、`PHASE-3` | `MET-002`、`MET-005` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 不得用于学生、教师或学校的公开排名和惩罚。 |
| MET-GROUP-FACT-RELIABILITY 事实可靠性 | 身份、关系、权限、提交、版本和历史是否完整、准确、可恢复且可追溯。 | `PHASE-1`、`PHASE-2`、`PHASE-3` | `MET-006` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 不得通过降低校验门槛或忽略失败记录提高表面成功率。 |
| MET-GROUP-AI-TEACHING-QUALITY AI 教学质量 | AI 评定、反馈、视频和理解验证是否正确、可解释并产生有效下一步。 | `PHASE-2`、`PHASE-3` | `MET-003` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 不得单向压低无法判断率，也不得以覆盖率掩盖错误结论。 |
| MET-GROUP-SAFETY-DATA-RIGHTS 安全与数据权利 | 未成年人保护、授权、纠正、导出、迁移、删除和外部处理是否成立。 | `PHASE-1`、`PHASE-2`、`PHASE-3` | `MET-004` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 任何增长或效率指标都不得抵消越权、身份错绑、事实丢失或安全伤害。 |
| MET-GROUP-FAIRNESS-ACCESSIBILITY 公平与可及 | 小学与初中、语数英、不同输入、弱网和无障碍场景是否获得可用的基本学习帮助。 | `PHASE-1`、`PHASE-2`、`PHASE-3` | `MET-007` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 不得依据公开排名、永久弱项标签或家庭付费能力剥夺基本帮助。 |
| MET-GROUP-TEACHER-SCHOOL-EFFICIENCY 教师与学校效率 | 产品是否减少人工分析和日常评定负担，同时没有把工作转嫁给学生、教师或平台支持。 | `PHASE-1`、`PHASE-2`、`PHASE-3` | `MET-001` | `SCHOOL_STAGE`、`SUBJECT`、`TASK_TYPE`、`INPUT_METHOD`、`NETWORK_CONDITION`、`ACCESSIBILITY_CONTEXT` | 不得只计算局部点击或教师时间而忽略纠错、学生负担和平台支持总成本。 |

## 上线门

| 上线门 | 类型 | Owner | 阶段 | 阻断条件 | 证据要求 |
| --- | --- | --- | --- | --- | --- |
| GATE-ZERO-TOLERANCE 零容忍硬不变量 | ZERO_TOLERANCE | ROLE-PLATFORM-OPS | `PHASE-1`、`PHASE-2`、`PHASE-3` | `跨学校、关系、对象、用途或期限的数据越权`、`学生、教师或监护人身份错绑`、`原始答案、媒体、提交或历史版本被覆盖或丢失`、`删除、转学、取消或归档后无权数据重新参与业务或搜索`、`AI 或平台故障导致学生被判错、迟交、能力下降或失去已发布活动履约`、`未授权外部训练、复用、转交或公共内容晋升`、`必要权限、安全、隐私、权利或教学正确性检查失败后仍发布` | `每个硬不变量有可复现的正向、拒绝和恢复场景`、`审计记录能够证明主体、对象、用途、版本、结果和修复闭环`、`发现一个可复现实例即阻断对应阶段上线，不允许用平均指标抵消` |
| GATE-QUALITY-THRESHOLD 阈值型质量门 | QUALITY_THRESHOLD | ROLE-ACADEMIC | `PHASE-1`、`PHASE-2`、`PHASE-3` | `阶段适用的识别、评定、视频、可及性、闭环或效率指标低于试点前冻结的最低阈值`、`阈值未按学段、学科、任务类型、输入方式、弱网和无障碍场景分层`、`在看到试点结果后倒推刚好通过的阈值或删除失败样本` | `试点前冻结指标定义、分母、分层、采集方式、观察窗口、样本要求、目标、护栏和未达标动作`、`第一阶段只应用事实底座、闭环、可及性和效率阈值，不因尚未启用的 AI 指标被阻塞`、`第二、第三阶段分别增加其 AI 教学和长期认知质量阈值` |
| GATE-EVIDENCE-COMPLETENESS 证据完整门 | EVIDENCE_COMPLETENESS | ROLE-SCHOOL-ADMIN | `PHASE-1`、`PHASE-2`、`PHASE-3` | `关键角色、端到端流程、越权、失败恢复、转学、删除、弱网、无障碍或套餐变化场景缺少证据`、`用页面清单、接口数量、AI 可调用或演示视频替代真实角色验收`、`历史、权限、数据权利或异常路径无法在界面与审计事实中得到证明` | `真实角色完成正常、边界和失败端到端场景`、`权限和数据归属同时具有正向与越权证据`、`失败、超时、重复请求、恢复和版本冲突作为正式验收场景`、`阶段声明只覆盖已通过证据的能力，不把规划合同表述为已上线` |
