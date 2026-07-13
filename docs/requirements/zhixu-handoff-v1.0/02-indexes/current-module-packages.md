# 当前模块包索引

| 序号 | 模块 ID | 模块 | 端 | 优先级 | 当前状态 | 核心 Prototype |
|---|---|---|---|---|---|---|
| 01 | ACC-001 | 学校入口、登录与身份上下文 | Web / App | P0 | 产品评审稿 | ACC-P01~P04 |
| 02 | TEA-001 | 教师工作台 | 教师 Web | P0 | 产品评审稿 | TEA-P01~P03 |
| 03 | PREP-001 | 备课与课堂授课 | 教师 Web | P1 | 概念边界稿 | PREP-P01~P04 |
| 04 | HW-001 | 作业创建与发布 | 教师 Web | P0 | 产品评审稿 | HW-P01~P05 |
| 05 | SUB-001 | 学生在线与拍照提交 | 学生 App | P0 | 产品评审稿 | SUB-P01~P05 |
| 06 | GRD-001 | AI 初评与教师复核 | 教师 Web | P0 | 产品评审稿 | GRD-P01~P05 |
| 07 | PUB-001 | 成绩与反馈发布、修正 | 教师 Web / 学生 App | P0 | 产品评审稿 | PUB-P01~P04 |
| 08 | SCO-001 | 基础成绩册 | 教师 / 教务 Web | P0 | 产品评审稿 | SCO-P01~P04 |
| 09 | EXM-001 | 考试与综合成绩管理 | 教务 / 教师 Web | P1 | 概念边界稿 | EXM-P01~P05 |
| 10 | STU-001 | 教师学生管理与学生详情 | 教师 Web | P0 | 产品评审稿 | STU-P01~P05 |
| 11 | INS-001 | 知识点证据与学情判断 | 教师 Web / 学生 App | P0 | 产品评审稿 | INS-P01~P04 |
| 12 | PLN-001 | 个性化提升与学科协同 | 教师 Web / 学生 App | P0 | 产品评审稿 | PLN-P01~P06 |
| 13 | APP-001 | 学生今日学习首页 | 学生 App | P0 | 产品评审稿 | APP1-P01~P03 |
| 14 | APP-002 | 反馈、错题与订正 | 学生 App / 教师 Web | P0 | 产品评审稿 | APP2-P01~P05 |
| 15 | ORG-001 | 学校组织与成员导入 | 管理 Web | P0 | 产品评审稿 | ORG-P01~P05 |
| 16 | SCH-001 | 教务辅助排课 | 教务 Web | P2 | 概念边界稿 | SCH-P01~P06 |
| 17 | AI-001 | AI 指令中心与连续对话 | Web / App | P0 | 产品评审稿 | AI-P01~P06 |
| 18 | GOV-001 | 权限、数据范围与操作审计 | 管理 Web / 全端 | P0 | 产品评审稿 | GOV-P01~P04 |
| 19 | CLI-001 | 管理员 CLI | CLI | P3 | 概念边界稿 | CLI-P01~P04 |

## P0 主闭环

```text
ACC-001
→ TEA-001
→ HW-001
→ SUB-001
→ GRD-001
→ PUB-001
→ SCO-001 / STU-001 / INS-001
→ PLN-001
→ APP-001 / APP-002
```

ORG-001 提供学校、班级、成员和任课关系基线；AI-001 提供受权限约束的自然语言入口；GOV-001 为全部模块提供权限与审计护栏。

## 跨模块数据合同

- 数据 Owner：`../07-structured-requirements/data-ownership-matrix.md`
- 字段与选项：`../07-structured-requirements/field-option-catalog.md`
- 对象状态：`../07-structured-requirements/core-object-state-model.md`
- 数据流转：`../07-structured-requirements/data-flow-catalog.md`

每份模块 PRD 的“数据责任与选择型字段合同”章节登记适用 Data ID 和 Field ID，“数据流转合同”章节登记适用 Flow ID。派生视图不分配新的业务 Owner，必须追溯源对象和源版本。
