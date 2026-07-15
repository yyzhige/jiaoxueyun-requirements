# REPORT-001 第二阶段扩展登记

| 属性 | 值 |
| --- | --- |
| 模块标题 | Future Extended Reporting Contract |
| 阶段 | 2 |
| 优先级 | P1 |
| 合同类型 | TASK8_REPORT_FUTURE_METADATA |
| 目标 | Register unresolved future reporting dependencies without exposing executable behavior |

## 扩展边界

- 本文件只登记未来产品问题、依赖、角色和治理复用关系。
- 可执行 Action 数量：0。
- 可执行 Page 数量：0。
- 第一阶段验收 Scenario 数量：0。
- 在产品决策、权限、数据治理和交付入口完成评审前，不生成第一阶段行为。

## 未来对象元数据

| Object ID | 对象 | 状态 | 字段 |
| --- | --- | --- | --- |
| REPORT-OBJ-FUTURE-CONTRACT | Future Reporting Contract Metadata | metadata-only | metadata-only |

## 元数据属性（保留原始键名）

| Object ID | 属性键 | 值 |
| --- | --- | --- |
| REPORT-OBJ-FUTURE-CONTRACT | dataSubject | "FUTURE_REPORTING_CONTRACT" |
| REPORT-OBJ-FUTURE-CONTRACT | controlSubject | "SCHOOL" |
| REPORT-OBJ-FUTURE-CONTRACT | producerRef | "ROLE-ACADEMIC" |
| REPORT-OBJ-FUTURE-CONTRACT | ownerRef | "ROLE-SCHOOL-ADMIN" |
| REPORT-OBJ-FUTURE-CONTRACT | confirmerRef | "ROLE-SCHOOL-ADMIN" |
| REPORT-OBJ-FUTURE-CONTRACT | stewardRef | "ROLE-SCHOOL-ADMIN" |
| REPORT-OBJ-FUTURE-CONTRACT | lifecyclePolicyId | "LIFE-006" |
| REPORT-OBJ-FUTURE-CONTRACT | sensitivityId | "S2" |
| REPORT-OBJ-FUTURE-CONTRACT | futureActors | ["ROLE-ACADEMIC","ROLE-SCHOOL-ADMIN","DUTY-SUBJECT-TEACHER"] |
| REPORT-OBJ-FUTURE-CONTRACT | dependencies | ["approved report product scope","approved retention and delivery policy"] |
| REPORT-OBJ-FUTURE-CONTRACT | requiredPermissions | ["school-controlled report scope","audited sensitive-data access"] |
| REPORT-OBJ-FUTURE-CONTRACT | reuseModuleIds | ["DGV-001"] |
| REPORT-OBJ-FUTURE-CONTRACT | unresolvedProductDecisions | ["whether future reports are snapshots or live views","which delivery destinations schools may approve"] |
