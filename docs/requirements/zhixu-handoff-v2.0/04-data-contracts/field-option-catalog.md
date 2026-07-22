# 字段与 Option Set 合同

## Option Set

| Option Set ID | 键 | 名称 | 模式 | 稳定值 / 运行时来源 |
| --- | --- | --- | --- | --- |
| OPT-COM-001 | region | 地区 | STATIC | CN-HEBEI=河北省<br>CN-HEBEI-SHIJIAZHUANG=石家庄市 |
| OPT-COM-002 | school | 学校 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-SCHOOLS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["actorId","regionId"]} |
| OPT-COM-003 | loginRole | 登录角色 | STATIC | ROLE-STUDENT=学生<br>ROLE-GUARDIAN=监护人<br>ROLE-TEACHER=教师<br>ROLE-ACADEMIC=教务<br>ROLE-SCHOOL-ADMIN=学校管理员<br>ROLE-PLATFORM-OPS=平台运营<br>ROLE-PLATFORM-GOVERNANCE=平台治理 |
| OPT-COM-004 | term | 学期 | RUNTIME_QUERY | {"queryId":"QUERY-SCHOOL-TERMS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","actorId"]} |
| OPT-COM-005 | grade | 年级 | RUNTIME_QUERY | {"queryId":"QUERY-SCHOOL-GRADES","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","actorId"]} |
| OPT-COM-006 | class | 班级 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-CLASSES","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","gradeId","roleId","dutyIds"]} |
| OPT-COM-007 | subject | 学科 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-SUBJECTS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","roleId","dutyIds"]} |
| OPT-COM-008 | course | 课程 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-COURSES","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","gradeId","subjectId","roleId","dutyIds"]} |
| OPT-COM-009 | teacher | 教师 | RUNTIME_QUERY | {"queryId":"QUERY-SCHOOL-TEACHERS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","actorId"]} |
| OPT-COM-010 | student | 学生 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-STUDENTS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","classIds","roleId","dutyIds"]} |
| OPT-COM-011 | knowledgePoint | 知识点 | RUNTIME_QUERY | {"queryId":"QUERY-KNOWLEDGE-POINTS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","courseId","subjectId","curriculumVersionId"]} |
| OPT-COM-012 | assignment | 作业 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-ASSIGNMENTS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","classIds","subjectIds","actorId"]} |
| OPT-COM-013 | exam | 考试 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZED-EXAMS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","classIds","subjectIds","actorId"]} |
| OPT-COM-014 | timeRange | 时间范围 | STATIC | TODAY=今日<br>LAST-7-DAYS=最近7天<br>THIS-WEEK=本周<br>THIS-MONTH=本月<br>THIS-TERM=本学期<br>CUSTOM=自定义 |
| OPT-COM-015 | scopeObject | 权限范围对象 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZABLE-SCOPE-OBJECTS","idKind":"OBJECT_ID","valueField":"objectId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","roleId","dutyIds","actionId"]} |
| OPT-COM-016 | authorizableAction | 可授权动作 | RUNTIME_QUERY | {"queryId":"QUERY-AUTHORIZABLE-ACTIONS","idKind":"ACTION_ID","valueField":"actionId","labelField":"displayName","labelSnapshot":true,"filterContext":["schoolId","termId","grantorRoleId","grantorDutyIds","targetDutyId","scopeObjectIds"]} |
| OPT-ENUM-001 | yesNo | 是否 | STATIC | YES=是<br>NO=否 |
| OPT-ENUM-002 | assignmentType | 作业类型 | STATIC | ONLINE=在线<br>PHOTO=拍照<br>MIXED=混合<br>LEARNING_TASK=学习任务 |
| OPT-ENUM-031 | submissionMethod | 提交方式 | STATIC | ONLINE-FORM=在线作答<br>TEXT=文本提交<br>IMAGE-UPLOAD=图片上传<br>FILE-UPLOAD=文件上传<br>MIXED-MEDIA=混合提交 |
| OPT-ENUM-003 | questionType | 题型 | STATIC | SINGLE-CHOICE=单选<br>MULTIPLE-CHOICE=多选<br>TRUE-FALSE=判断<br>FILL-BLANK=填空<br>CALCULATION=计算<br>SHORT-ANSWER=简答<br>ESSAY=作文<br>ATTACHMENT-ANSWER=附件作答<br>LEARNING-TASK=学习任务 |
| OPT-ENUM-032 | latePolicy | 迟交策略 | STATIC | NOT-ALLOWED=不允许迟交<br>ALLOW-WITH-MARK=允许并标记迟交<br>ALLOW-UNTIL-DATE=允许至指定时间<br>NOT-APPLICABLE=不适用 |
| OPT-ENUM-033 | resubmissionPolicy | 重新提交策略 | STATIC | NOT-ALLOWED=不允许重提<br>BEFORE-DEADLINE=截止前允许<br>AFTER-FEEDBACK=反馈后允许<br>AUTHORIZED-REOPENING=经授权重开后允许<br>NOT-APPLICABLE=不适用 |
| OPT-ENUM-004 | feedbackPolicy | 反馈开放策略 | STATIC | WITH-SCORE-PUBLISH=随成绩发布<br>SCHEDULED=指定时间开放<br>AFTER-CORRECTION=订正后开放<br>CLOSED=不开放 |
| OPT-ENUM-005 | aiConfidence | AI置信状态 | STATIC | HIGH=高<br>MEDIUM=中<br>LOW=低<br>UNAVAILABLE=不可用 |
| OPT-ENUM-006 | gradingCorrectionReason | 评分修正原因 | STATIC | RECOGNITION-ERROR=识别错误<br>RUBRIC-NOT-APPLICABLE=评分规则不适用<br>CALCULATION-ERROR=计算错误<br>EVIDENCE-OMITTED=证据遗漏<br>TEACHER-JUDGMENT=教师判断<br>OTHER=其他 |
| OPT-ENUM-007 | scoreState | 成绩状态 | STATIC | UNPUBLISHED=未发布<br>PUBLISHED=已发布<br>MISSING=缺交<br>EXEMPT=免计<br>INVALID=无效<br>CORRECTED=已修正 |
| OPT-ENUM-008 | evidenceStage | 证据阶段 | STATIC | FIRST-ANSWER=首次作答<br>CORRECTION=订正<br>RETEST=再测<br>FORMATIVE=课堂形成性证据 |
| OPT-ENUM-009 | answerResult | 作答结果 | STATIC | CORRECT=正确<br>PARTIAL=部分正确<br>INCORRECT=错误<br>UNDETERMINED=无法判断 |
| OPT-ENUM-010 | errorType | 错误类型 | STATIC | CONCEPT=概念<br>COMPREHENSION=理解<br>CALCULATION=计算<br>STEP=步骤<br>EXPRESSION=表达<br>OVERSIGHT=疏漏<br>NO-ANSWER=未作答<br>OTHER=其他 |
| OPT-ENUM-012 | improvementPriority | 提升优先级 | STATIC | HIGH=高<br>MEDIUM=中<br>LOW=低 |
| OPT-ENUM-013 | improvementTaskType | 提升任务类型 | STATIC | PRACTICE=练习<br>REVIEW=复习<br>CORRECTION=订正<br>READING-RECITATION=阅读背诵<br>INQUIRY=探究<br>TEACHER-CONFERENCE=教师面谈<br>OTHER=其他 |
| OPT-ENUM-034 | completionEvidenceType | 完成证据类型 | STATIC | SYSTEM-RESULT=系统结果<br>STUDENT-SUBMISSION=学生提交<br>TEACHER-CONFIRMATION=教师确认<br>SCORE-IMPROVEMENT=成绩改善<br>STUDENT-REFLECTION=学生反思 |
| OPT-ENUM-014 | reportCadence | 报告周期 | STATIC | AD-HOC=临时<br>DAILY=每日<br>WEEKLY=每周<br>MONTHLY=每月<br>CUSTOM=自定义 |
| OPT-ENUM-035 | reportScheduleTimezone | 报告计划时区 | STATIC | ASIA-SHANGHAI=北京时间 |
| OPT-ENUM-036 | reportScheduleTime | 报告计划时间 | STATIC | 08:00=08:00<br>17:00=17:00<br>CUSTOM-LOCAL-TIME=自定义本地时间 |
| OPT-ENUM-015 | reportRecipientScope | 报告接收范围 | STATIC | SELF=本人<br>SUBJECT-TEACHERS=本学科教师<br>CLASS-HOMEROOM=本班班主任<br>CLASS-TEACHERS=本班任课教师<br>AUTHORIZED-ACADEMIC=授权教务 |
| OPT-ENUM-037 | reportMetric | 报告指标 | STATIC | SUBMISSION-RATE=提交率<br>SCORE-DISTRIBUTION=成绩分布<br>MASTERY=掌握情况<br>IMPROVEMENT-COMPLETION=提升任务完成率<br>RISK-STUDENT=需关注学生 |
| OPT-ENUM-016 | aiCapability | AI能力等级 | STATIC | QUERY=查询<br>ANALYSIS=分析<br>AD-HOC-REPORT=临时报表<br>DRAFT=草稿<br>CONTROLLED-EXECUTION=受控执行<br>SCHEDULED-TASK=定期任务 |
| OPT-ENUM-041 | aiCapabilityDecision | AI能力决策 | STATIC | AUTO_SUPPORTED=支持自动处理<br>SUGGESTION_ONLY=仅提供建议<br>MANDATORY_REVIEW=必须人工复核<br>MANUAL_ONLY=仅人工处理<br>UNAVAILABLE=不可用 |
| OPT-ENUM-038 | aiRisk | AI风险等级 | STATIC | READ-ONLY=只读<br>DRAFT=草稿<br>CONTROLLED-WRITE=受控写入<br>HIGH-IMPACT=高影响 |
| OPT-ENUM-017 | aiTaskStatus | AI任务状态 | STATIC | UNDERSTANDING=理解中<br>NEEDS-CLARIFICATION=待澄清<br>QUERY-COMPLETED=查询完成<br>DRAFT-GENERATED=草稿已生成<br>AWAITING-CONFIRMATION=待确认<br>QUEUED=排队中<br>PROCESSING=处理中<br>MANUAL-FALLBACK=人工兜底<br>SUCCEEDED=成功<br>PARTIALLY-SUCCEEDED=部分成功<br>FAILED=失败<br>CONTEXT-EXPIRED=上下文失效 |
| OPT-ENUM-018 | notificationType | 通知类型 | STATIC | ASSIGNMENT=作业<br>SUBMISSION=提交<br>GRADING=批改<br>PUBLISH=发布<br>CORRECTION=订正<br>IMPROVEMENT=提升<br>REPORT=报告<br>PERMISSION=权限<br>SYSTEM=系统 |
| OPT-ENUM-019 | notificationReadState | 通知阅读状态 | STATIC | UNREAD=未读<br>READ=已读<br>HANDLED=已处理<br>ARCHIVED=已归档 |
| OPT-ENUM-020 | importObject | 导入对象类型 | STATIC | TERM=学期<br>CLASS=班级<br>TEACHER=教师<br>STUDENT=学生<br>TEACHING-ASSIGNMENT=任课关系<br>HOMEROOM-ASSIGNMENT=班主任关系<br>COURSE=课程<br>KNOWLEDGE-POINT=知识点 |
| OPT-ENUM-021 | importAction | 导入处理动作 | STATIC | CREATE=创建<br>UPDATE=更新<br>UNCHANGED=无变化<br>REJECT=拒绝<br>DEACTIVATE=停用 |
| OPT-ENUM-022 | importResult | 导入校验结果 | STATIC | PASSED=通过<br>WARNING=警告<br>ERROR=错误<br>DUPLICATE=重复<br>CONFLICT=冲突 |
| OPT-ENUM-023 | auditAction | 审计动作 | STATIC | QUERY=查询<br>CREATE=创建<br>UPDATE=修改<br>PUBLISH=发布<br>EXPORT=导出<br>GRANT=授权<br>REVOKE=撤销<br>LOGIN=登录<br>AI-EXECUTE=AI执行 |
| OPT-ENUM-024 | auditResult | 审计结果 | STATIC | SUCCEEDED=成功<br>PARTIALLY-SUCCEEDED=部分成功<br>FAILED=失败<br>DENIED=拒绝 |
| OPT-ENUM-025 | accountIdentifier | 账号标识类型 | STATIC | MOBILE=手机号<br>EMAIL=邮箱<br>USERNAME=登录账号 |
| OPT-ENUM-026 | activationMethod | 激活方式 | STATIC | INITIAL-PASSWORD=初始口令<br>ONE-TIME-CODE=一次性验证码<br>ADMIN-CONFIRMATION=管理员确认 |
| OPT-ENUM-027 | imageQuality | 图片质检结果 | STATIC | USABLE=可用<br>BLURRY=模糊<br>INCOMPLETE=不完整<br>GLARE=反光<br>ORIENTATION-ERROR=方向异常<br>UPLOAD-FAILED=上传失败 |
| OPT-ENUM-028 | correctionDecision | 订正判定 | STATIC | PASSED=通过<br>NOT-PASSED=未通过<br>NEEDS-MORE=需补充<br>CLOSED=关闭 |
| OPT-ENUM-029 | schedulingConstraint | 排课约束性质 | STATIC | HARD=硬约束<br>SOFT=软约束 |
| OPT-ENUM-030 | schedulingView | 课表视角 | STATIC | TEACHER=教师<br>CLASS=班级<br>CLASSROOM=教室 |
| OPT-ENUM-039 | scoreRounding | 成绩舍入规则 | STATIC | NONE=不舍入<br>HALF-UP-INTEGER=四舍五入到整数<br>HALF-UP-ONE-DECIMAL=四舍五入到一位小数<br>FLOOR-INTEGER=向下取整 |
| OPT-ENUM-040 | visibilityPolicy | 可见性策略 | STATIC | PRIVATE=仅本人<br>SUBJECT-TEACHERS=对应学科教师<br>HOMEROOM-READ=班主任只读<br>SCHOOL-AUTHORIZED=学校授权角色<br>STUDENT-VISIBLE=学生可见 |
| OPT-ENUM-042 | workDuty | 工作职责 | STATIC | DUTY-SUBJECT-TEACHER=任课教师<br>DUTY-HOMEROOM=班主任<br>DUTY-SUBJECT-LEAD=学科负责人 |
| OPT-ENUM-043 | knowledgeMappingRelation | 知识映射关系 | STATIC | PRIMARY=主要知识点<br>SUPPORTING=辅助知识点<br>PREREQUISITE=前置知识点<br>EXTENSION=拓展知识点 |
| OPT-ENUM-044 | dataRetentionCategory | 数据保留类别 | STATIC | ACCOUNT_IDENTITY=账号与身份<br>ORGANIZATION=组织与成员<br>TEACHING_CONTENT=教学内容<br>STUDENT_WORK=学生作答与提交<br>SCORE_FEEDBACK=成绩与反馈<br>AUDIT_EXPORT=审计与导出 |
| OPT-ENUM-045 | modelTrainingUse | 模型训练使用 | STATIC | DENIED=禁止用于模型训练<br>SEPARATELY_APPROVED=经学校单独批准 |
| OPT-ENUM-046 | teacherWorkspaceView | 教师工作台默认视图 | STATIC | TODAY=今日待办<br>GRADING_QUEUE=批改队列<br>HOMEROOM_OVERVIEW=班主任全科概览<br>REPORTS=报告摘要 |
| OPT-ENUM-047 | notificationChannel | 通知渠道 | STATIC | IN_PRODUCT=站内 |
| OPT-ENUM-048 | reportDataScope | 报告数据范围 | STATIC | SUBJECT_ASSIGNED=任教学科与班级范围<br>HOMEROOM_ASSIGNED_CLASS_AGGREGATE=班主任本班全学科汇总<br>ACADEMIC_AUTHORIZED_AGGREGATE=教务授权范围汇总 |
| OPT-GOV-001 | schoolActivationAxis | 学校启用独立轴 | STATIC | PLATFORM_SUBJECT_REVIEW=平台学校主体审核<br>FIRST_ADMIN_ACCEPTANCE=首位管理员接受授权<br>INITIALIZATION_VALIDATION=初始化完整校验<br>SUBSCRIPTION_READINESS=订阅就绪<br>CLASS_COURSE_READINESS=班级课程就绪<br>TEACHING_ACTIVATION=教学启用 |
| OPT-GOV-002 | authorizationImpact | 授权影响等级 | STATIC | ORDINARY_DELEGABLE=普通可委派<br>CONTROLLED_DELEGABLE=受控委派<br>HIGH_IMPACT=高影响<br>NON_DELEGABLE=不可委派 |
| OPT-GOV-003 | guardianAssistanceStatus | 监护辅助状态 | STATIC | NOT_AUTHORIZED=未授权<br>RELATION_CONFIRMED=监护关系已确认<br>SCHOOL_SCOPE_ACTIVE=学校数据授权有效<br>TASK_SESSION_ACTIVE=任务辅助会话有效<br>EXPIRED=已到期<br>REVOKED=已撤销 |
| OPT-GOV-004 | guardianDisputeStatus | 监护争议状态 | STATIC | NONE=无争议<br>OPEN=争议已提出<br>FROZEN=高影响事项已冻结<br>RESOLVED=争议已解决<br>REJECTED=争议不成立 |
| OPT-GOV-005 | dataRightAction | 数据权利动作 | STATIC | ACCESS=访问<br>CORRECT=纠正<br>EXPORT=导出<br>MIGRATE=迁移<br>DELETE=删除或注销<br>RESTRICT=限制处理<br>PUBLISH_STUDENT_WORK=授权公开学生作品<br>WITHDRAW_PUBLICATION=撤回作品公开授权 |
| OPT-GOV-006 | exportAudience | 导出权主体 | STATIC | STUDENT=学生本人<br>GUARDIAN=已授权监护人<br>TEACHER=教师本人及其对象归属范围<br>SCHOOL=学校自有业务事实范围 |
| OPT-GOV-007 | sharedDeviceCleanupScope | 共享设备产品可控清理范围 | STATIC | PRODUCT_PAGE_STATE=产品页面状态<br>PRODUCT_CACHE=产品缓存<br>PRODUCT_TEMP_FILE=产品临时文件<br>SENSITIVE_NOTIFICATION_PREVIEW=敏感通知预览<br>PRODUCT_DOWNLOAD_PERMISSION=产品内敏感内容普通下载能力 |
| OPT-V2-TL-001 | activityPurpose | 学习活动主要用途 | STATIC | FORMAL_ASSIGNMENT=正式作业<br>DAILY_PRACTICE=日常练习<br>DIAGNOSTIC_ASSESSMENT=诊断测评<br>TEACHING_PRESENTATION=教学呈现 |
| OPT-V2-TL-002 | activityGovernanceStatus | 活动治理状态 | STATIC | DRAFT=草稿<br>VALIDATED=已校验<br>PUBLISHED=已发布<br>CANCELLED=已取消 |
| OPT-V2-TL-003 | activityOpenWindowStatus | 活动开放窗口状态 | STATIC | NOT_OPEN=未开放<br>OPEN=开放中<br>CLOSED=已关闭 |
| OPT-V2-TL-004 | activityArchiveStatus | 活动归档状态 | STATIC | ACTIVE=活动<br>ARCHIVED=已归档 |
| OPT-V2-TL-005 | activityParticipationStatus | 活动参与状态 | STATIC | NOT_STARTED=未开始<br>IN_PROGRESS=进行中<br>SUBMITTED=已提交<br>NO_SUBMISSION_EXPECTED=不产生提交 |
| OPT-V2-TL-006 | activityTimeStatus | 活动时间状态 | STATIC | NOT_DUE=未到截止<br>DUE=已到截止<br>LATE_WINDOW=迟交窗口<br>TIME_NOT_APPLICABLE=不适用 |
| OPT-V2-TL-007 | activityAiProcessingStatus | 活动 AI 处理状态 | STATIC | NOT_REQUESTED=未请求<br>QUEUED=排队中<br>PROCESSING=处理中<br>COMPLETED=已完成<br>UNAVAILABLE=不可用 |
| OPT-V2-TL-008 | intentCredentialStatus | 提交意图凭证状态 | STATIC | ISSUED=已签发<br>COMPLETED=清单已补齐<br>REJECTED=已拒绝<br>EXPIRED=已过期<br>PLATFORM_FAILURE_PROTECTED=系统故障保护 |
| OPT-V2-TL-009 | teachingProblemStatus | 教学问题状态 | STATIC | OPEN=待关注<br>CONFIRMED=已确认<br>DEFERRED=暂缓<br>OBSERVING=观察中<br>RESOLVED=已解决<br>REOPENED=重新打开 |
| OPT-V2-TL-010 | teacherJudgmentType | 教师处理判断 | STATIC | ACCEPT=接受建议<br>MODIFY=修改建议<br>REJECT=驳回建议<br>DEFER=暂缓处理<br>MERGE=合并重复问题 |
| OPT-V2-TL-011 | linkedTeachingActionStatus | 关联教学行动状态 | STATIC | PROPOSED=待安排<br>PLANNED=已安排<br>IN_PROGRESS=进行中<br>COMPLETED=已完成<br>OBSERVING=观察结果<br>CANCELLED=已取消 |
| OPT-V2-TL-012 | studentHomeCompartment | 学生首页区域 | STATIC | SCHOOL_REQUIRED=学校必做<br>STUDENT_PENDING=本人需处理<br>SYSTEM_PROCESSING=系统处理中<br>PERSONAL_OPTIONAL=个人可选学习 |
| OPT-V2-TL-013 | activityCancellationKind | 活动取消原因类别 | STATIC | ADMINISTRATIVE=行政取消<br>CONTENT_RIGHT_ERROR=内容或权利错误<br>REPLACED=已由替代活动承接 |
| OPT-V2-TL-014 | activityCorrectionKind | 活动纠错类别 | STATIC | NON_SEMANTIC=非语义纠错<br>ASSESSMENT_STANDARD=评定标准纠错 |
| OPT-V2-TL-015 | lateEnrolleeWindowPolicy | 发布后新增学生作答窗口策略 | STATIC | FORMAL_SCHOOL_FULL_DURATION=正式作业按学校完整配置时长<br>DIAGNOSTIC_SHARED_WINDOW=诊断测评共享原活动窗口<br>DIAGNOSTIC_INDEPENDENT_WINDOW=诊断测评使用独立窗口<br>NOT_APPLICABLE=不适用 |
| OPT-V2-TL-016 | uploadContentTrustClass | 上传内容信任类别 | STATIC | UNTRUSTED_DATA_ONLY=仅作为不可信待处理数据 |
| OPT-V2-TL-017 | inputQualityFactStatus | 输入质量事实状态 | STATIC | NOT_DETECTED=未发现问题<br>DETECTED=发现问题<br>UNKNOWN=无法检查<br>NOT_APPLICABLE=不适用 |
| OPT-V2-TL-018 | cancelledActivityUnsubmittedHandling | 取消活动的未提交处理 | STATIC | REMOVE_REQUIRED_TASK=移除未提交必做任务<br>BLOCK_FURTHER_SUBMISSION=阻止后续提交<br>REDIRECT_TO_REPLACEMENT=引导至替代活动 |
| OPT-V2-TL-019 | cancelledActivityEvidenceDisposition | 取消活动的既有证据处置 | STATIC | PRESERVE_VALID=保留既有证据有效性<br>INVALIDATE_AFFECTED_ONLY=仅失效受影响证据<br>PRESERVE_WITH_ORIGINAL_ACTIVITY=保留并继续关联原活动 |
| OPT-V2-TL-020 | cancelledActivityDownstreamAction | 取消活动的下游动作 | STATIC | REFRESH_STUDENT_HOME=刷新学生首页<br>REMOVE_UNSUBMITTED_TODOS=移除未提交待办<br>BLOCK_SUBMISSION=阻断活动提交<br>INVALIDATE_AFFECTED_DERIVATIONS=失效受影响派生结果<br>REDIRECT_TO_REPLACEMENT=将未提交待办指向替代活动 |
| OPT-V2-TL-021 | activityHelpMode | 活动帮助模式 | STATIC | NO_HELP=不允许帮助<br>TEACHER_DEFINED=教师定义帮助<br>HINTS_ALLOWED=允许提示<br>AI_TUTOR_ALLOWED=允许 AI 辅导<br>PRESENTATION_SUPPORT=教学呈现辅助 |
| OPT-V2-TL-022 | activityAnswerOpenPolicy | 活动完整答案开放策略 | STATIC | AFTER_SUBMISSION=提交后开放<br>AFTER_CORRECTION=订正后开放<br>AFTER_DEADLINE=截止后开放<br>SCHEDULED=指定时间开放<br>NEVER=不开放<br>NOT_APPLICABLE=不适用 |
| OPT-V2-TL-023 | diagnosticActivityUse | 诊断活动用途边界 | STATIC | INTERNAL_LEARNING_DIAGNOSIS=校内学习诊断<br>NOT_APPLICABLE=不适用 |
| OPT-V2-TL-024 | submissionTimelinessSource | 提交按时判定来源 | STATIC | SERVER_RECEIPT_ACCEPTED_AT=完整内容服务端接收时间<br>COMPLETED_INTENT_CREDENTIAL_ISSUED_AT=已完成提交意图凭证签发时间<br>PLATFORM_FAILURE_INCIDENT_STARTED_AT=平台故障事故开始时间 |
| OPT-TL-001 | questionOrder | 题目顺序 | STATIC | FIXED=固定顺序<br>SHUFFLED=随机顺序 |
| OPT-TL-002 | assignmentNotificationPolicy | 作业通知策略 | STATIC | NONE=不通知<br>IN-APP-IMMEDIATE=产品内立即通知<br>IN-APP-SCHEDULED=产品内定时通知 |
| OPT-TL-003 | subjectFamily | 学科族 | STATIC | CHINESE=语文<br>MATHEMATICS=数学<br>ENGLISH=英语 |
| OPT-TL-004 | recognitionLevel | 识别级别 | STATIC | NONE=不识别<br>METADATA=仅媒体和区域元数据<br>CONTENT=内容识别<br>STRUCTURED=结构化答案识别 |
| OPT-TL-005 | scoringLevel | AI 评定能力级别 | STATIC | AUTO-SCORE=规则自动建议分<br>RULE-SUGGESTION=规则评分建议<br>AI-SUGGESTION=AI评分建议<br>EXCEPTION-ONLY=仅限专业例外复核 |
| OPT-TL-006 | gradingEvidenceRequirement | AI 评定证据要求 | STATIC | ANSWER-PAYLOAD=结构化答案载荷<br>MEDIA=媒体原件<br>REGION-MAP=页题区域映射<br>IMAGE-QUALITY=图片质量结果<br>ITEM-VERSION=题目版本<br>RUBRIC-VERSION=Rubric版本<br>PROFESSIONAL-EXCEPTION-EVIDENCE=专业例外证据 |
| OPT-TL-007 | automatedBatchDeterminationEligibility | 自动批量判定资格 | STATIC | ELIGIBLE=可自动批量判定<br>INELIGIBLE=不可自动批量判定 |
| OPT-TL-008 | unableToDetermineRecovery | 无法判断恢复路径 | STATIC | PROFESSIONAL-EXCEPTION-REVIEW=专业例外复核<br>CONCRETE-SUPPLEMENT-THEN-ALTERNATE-REVIEW=具体补证后替代复核 |
| OPT-TL-009 | publicationEligibility | 发布资格 | STATIC | ELIGIBLE=可发布<br>BLOCKED=阻断发布 |
| OPT-TL-010 | publicationNotificationStatus | 发布通知状态 | STATIC | PENDING=待发送<br>SENT=已发送<br>FAILED=发送失败<br>NOT-REQUIRED=无需发送 |
| OPT-TL-011 | aiAssessmentRoute | AI 评定与完成判定路线 | STATIC | AI-DETERMINATION=AI 形成明确下一步<br>CONCRETE-SUPPLEMENT=请求具体补证<br>PERMITTED-ALTERNATE-REVIEW=采用允许的替代复核<br>PROFESSIONAL-EXCEPTION-REVIEW=进入专业例外复核 |
| OPT-TL-012 | publicationNotificationPolicy | 成绩发布通知策略 | STATIC | NONE=不通知<br>ON-PUBLISH=发布时通知 |
| OPT-EXT-001 | lessonPlanStatus | 教案状态 | STATIC | DRAFT=草稿<br>CONFIRMED=已确认 |
| OPT-EXT-002 | materialLicenseStatus | 素材许可状态 | STATIC | PENDING=待核验<br>VERIFIED=已核验 |
| OPT-EXT-003 | contentAvailability | 内容可用状态 | STATIC | DRAFT=草稿<br>PUBLISHED=已发布 |
| OPT-EXT-004 | examEventStatus | 考试事件状态 | STATIC | DRAFT=草稿<br>PUBLISHED=已发布<br>CORRECTION_OPEN=订正开放 |
| OPT-EXT-005 | scoreImportValidation | 成绩导入校验 | STATIC | PENDING=待校验<br>PASSED=已通过<br>REJECTED=已拒绝 |
| OPT-EXT-006 | scheduleConstraintHardness | 排课约束强度 | STATIC | HARD=硬约束<br>SOFT=软约束 |
| OPT-EXT-007 | scheduleHardConstraintCheck | 硬约束校验结果 | STATIC | PASS=通过<br>FAIL=不通过 |
| OPT-EXT-008 | serviceState | 服务状态 | STATIC | DRAFT=草稿<br>CONFIRMED=学校已确认<br>ACTIVE=服务中 |
| OPT-EXT-026 | servicePlanLifecycleState | 服务计划生命周期状态 | STATIC | DRAFT=草稿<br>CONFIRMED=学校已确认<br>ACTIVE=服务中<br>RESTRICTED=服务受限<br>TERMINATED=合同终止<br>EXPIRED=服务失效<br>SUPERSEDED=已由新版本替代 |
| OPT-EXT-009 | supportCaseStatus | 支持工单状态 | STATIC | OPEN=处理中<br>CLOSED=已关闭 |
| OPT-EXT-010 | contentPermissionScope | 内容权限范围 | STATIC | SCHOOL=全校<br>SUBJECT=学科<br>COURSE=课程 |
| OPT-EXT-011 | contentLicenseStatus | 内容版权状态 | STATIC | DRAFT=待确认<br>ACTIVE=有效 |
| OPT-EXT-012 | activityStatus | 课堂活动状态 | STATIC | PLANNED=已计划<br>RECORDED=已记录 |
| OPT-EXT-013 | assignmentDraftStatus | 作业草稿状态 | STATIC | DRAFT=待任课教师确认<br>READY_FOR_HANDOFF=已确认可转正式作业草稿 |
| OPT-EXT-014 | scheduleCandidateStatus | 排课候选状态 | STATIC | GENERATED=已生成<br>REVIEWED=已复核<br>CONFIRMED=已确认<br>PUBLISHED=已发布<br>STALE=已失效 |
| OPT-EXT-015 | platformCaseStatus | 入驻服务状态 | STATIC | OPEN=处理中<br>SCHOOL_CONFIRMED=学校已确认 |
| OPT-EXT-016 | policyTemplateStatus | 策略模板状态 | STATIC | DRAFT=草稿<br>CONFIRMED=学校已确认<br>ACTIVE=已生效 |
| OPT-EXT-017 | scheduleConstraintKind | 排课约束类型 | STATIC | TEACHER_AVAILABILITY=教师可用时间<br>CLASS_PERIOD=班级时段<br>COURSE_LOAD=课程课时<br>ROOM_CAPACITY=教室容量 |
| OPT-EXT-018 | scoreConfirmationDecision | 学科成绩确认决定 | STATIC | CONFIRM=确认<br>REJECT=驳回 |
| OPT-EXT-019 | schoolCommercialPayerKind | 学校商业付费主体 | STATIC | SCHOOL=学校 |
| OPT-EXT-020 | schoolPackageExpansionScope | 学校套餐可扩展范围 | STATIC | CAPACITY=容量<br>CONCURRENCY=并发<br>ANALYTICS=分析<br>GENERAL_SUPPORT=一般支持 |
| OPT-EXT-021 | schoolCoreAiEntitlement | 学校核心 AI 基础权益 | STATIC | CORE_AI_ASSESSMENT=核心 AI 评定与完成判定<br>MINIMUM_VIDEO_HELP=最低教学视频帮助 |
| OPT-EXT-022 | serviceRestrictionReason | 服务受限原因 | STATIC | ENTITLEMENT_REDUCED=权益范围缩减<br>CONTRACT_RESTRICTED=合同约定受限<br>CONTRACT_TERMINATED=合同终止<br>CONTRACT_EXPIRED=服务失效 |
| OPT-EXT-023 | serviceContinuityOperation | 服务连续性保留操作 | STATIC | COMPLETE_PUBLISHED_ACTIVITY=完成已发布活动<br>HISTORICAL_READ=依法依合同读取历史<br>LEGAL_EXPORT=法定或合同导出<br>TRANSFER=授权迁移<br>DELETION=注销与删除<br>SECURITY_SUPPORT=安全支持 |
| OPT-EXT-024 | serviceContinuityStatus | 服务连续性窗口状态 | STATIC | CAPTURING_PROTECTED_ACTIVITIES=正在捕获已发布活动保护清单<br>ACTIVITY_PROTECTION_OPEN=已发布活动保护窗口开放<br>CAPTURE_FAILED=保护清单捕获失败<br>EXIT_WINDOW_OPEN=退出窗口开放<br>CLOSED=连续性窗口关闭 |
| OPT-EXT-025 | protectedActivityManifestStatus | 保护活动清单状态 | STATIC | CAPTURING=捕获中<br>SEALED=已封存<br>CAPTURE_FAILED=捕获失败 |
| OPT-AI2-001 | aiAssessmentProcessingStatus | AI 评定处理状态 | STATIC | QUEUED=待处理<br>PROCESSING=处理中<br>SUCCEEDED=处理完成<br>FAILED=处理失败 |
| OPT-AI2-002 | aiResultPublicationStatus | AI 结果发布状态 | STATIC | UNPUBLISHED=未发布<br>PENDING_GATES=待闸门检查<br>PUBLISHED=已发布<br>WITHHELD=保持未发布<br>SUPERSEDED=已被新版本替代 |
| OPT-AI2-003 | aiResultDisputeCorrectionStatus | AI 结果质疑与纠正状态 | STATIC | UNCHALLENGED=未质疑<br>CHALLENGED=已质疑<br>EVIDENCE_SUBMITTED=已提交专业证据<br>CORRECTION_PENDING=纠正处理中<br>RESOLVED=质疑已解决 |
| OPT-AI2-004 | aiResultValidityStatus | AI 结果有效性 | STATIC | PENDING_VALIDATION=待验证<br>VALID=当前有效<br>STALE=来源已陈旧<br>INVALIDATED=已失效<br>SUPERSEDED=已被新版本替代 |
| OPT-AI2-005 | aiAssessmentNextStep | AI 评定明确下一步 | STATIC | COMPLETED=完成<br>CORRECTION_REQUIRED=退回订正<br>MORE_INPUT_REQUIRED=需要补充<br>UNABLE_TO_DETERMINE=无法判断<br>EXCEPTION_REVIEW_REQUIRED=待例外复核 |
| OPT-AI2-006 | aiPublicationGateOutcome | AI 发布闸门结果 | STATIC | PASS=通过<br>FAIL=失败<br>TIMEOUT=超时<br>UNAVAILABLE=不可用 |
| OPT-AI2-007 | feedbackLayer | 学生反馈层级 | STATIC | RESULT_AND_ERROR_LOCATION=RESULT_AND_ERROR_LOCATION<br>NON_ANSWER_SCAFFOLD=NON_ANSWER_SCAFFOLD<br>TARGETED_TEACHING=TARGETED_TEACHING<br>COMPLETE_ANSWER_AND_SOLUTION=COMPLETE_ANSWER_AND_SOLUTION |
| OPT-AI2-008 | validAttemptClassification | 有效尝试分类 | STATIC | SUBSTANTIVE_RESPONSE=有实质内容的作答<br>EXPLICIT_DONT_KNOW=明确表示不会<br>BLANK=空白<br>UNRELATED=无关内容<br>PLACEHOLDER=占位提交 |
| OPT-AI2-009 | answerExposureCondition | 作答时答案暴露条件 | STATIC | NOT_EXPOSED=答案未开放<br>ANSWER_EXPOSED=答案或解法已开放<br>UNKNOWN=暴露条件未知 |
| OPT-AI2-010 | assessmentChallengeResolution | 评定质疑处理结果 | STATIC | CORRECTED=已纠正结果版本<br>REPLACED=已创建替代结果版本<br>INVALIDATED=已使结果失效<br>UPHELD=保留原结果版本 |
| OPT-P2-PROG-TARGET-STATUS | phaseTwoTargetStatus | 第二阶段目标状态 | STATIC | NOT_STARTED=未开始<br>IN_PROGRESS=学习中<br>PENDING_COMPLETION_EVIDENCE=待完成证据<br>COMPLETED=已完成<br>PAUSED=已暂停 |
| OPT-P2-PROG-STUDENT-CHOICE | phaseTwoNextTargetChoice | 学生下一目标选择 | STATIC | CONTINUE=继续下一目标<br>NOT_NOW=暂不继续 |
| OPT-P2-VIDEO-REQUEST-KIND | phaseTwoVideoRequestKind | 教学视频请求类型 | STATIC | PROBLEM_DRIVEN=问题驱动<br>PROGRESS_DRIVEN=学习进度驱动 |
| OPT-P2-VIDEO-GATE-STATUS | phaseTwoVideoGateStatus | 教学视频闸门状态 | STATIC | PENDING=待检查<br>PASSED=已通过<br>FAILED=未通过<br>UNAVAILABLE=检查不可用 |
| OPT-P2-VIDEO-DELIVERY-STATUS | phaseTwoVideoDeliveryStatus | 教学视频交付状态 | STATIC | NOT_DELIVERED=未交付<br>DELIVERED=已交付<br>GATE_BLOCKED=闸门阻断<br>RECALLED=已召回 |
| OPT-P2-VIDEO-QUOTA-SOURCE | phaseTwoVideoQuotaSource | 教学视频额度来源 | STATIC | STUDENT_MINIMUM=学生最低保障<br>SCHOOL_OVERFLOW=学校共享溢出池 |
| OPT-P2-VIDEO-QUOTA-PRIORITY | phaseTwoVideoQuotaPriority | 教学视频额度优先级 | STATIC | PROBLEM_REMEDIATION=问题补救<br>PROGRESS_CORE=进度核心学习<br>NONESSENTIAL=非必要生成 |
| OPT-P2-VIDEO-RELEASE-REASON | phaseTwoVideoQuotaReleaseReason | 教学视频额度释放原因 | STATIC | PLATFORM_FAILURE=平台失败<br>GATE_BLOCK=必要闸门阻断<br>CONTENT_RECALL=内容召回<br>AUTOMATIC_RETRY=自动重试 |
| OPT-P2-VIDEO-RECALL-TRIGGER | phaseTwoVideoRecallTrigger | 教学视频召回触发来源 | STATIC | IDENTITY_DELETION=身份注销<br>STUDENT_TRANSFER=学生转学<br>RELATIONSHIP_TERMINATION=学生关系终止<br>SOURCE_RIGHTS_WITHDRAWAL=来源权利撤回<br>CONTENT_RECALL=内容召回 |
| OPT-P2-VIDEO-DOWNLOAD-POLICY | phaseTwoVideoDownloadPolicy | 个性化视频下载策略 | STATIC | BLOCK_PRODUCT_ORDINARY_DOWNLOAD=产品不提供普通文件下载 |
| OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY | phaseTwoVideoExternalRecordingBoundary | 外部录制能力边界 | STATIC | NO_PREVENTION_CLAIM=不承诺阻止外部录屏或拍摄 |
| OPT-P2-VIDEO-REQUESTER-KIND | phaseTwoVideoRequesterKind | 教学视频请求人类型 | STATIC | STUDENT=学生本人<br>SUBJECT_TEACHER=对应任课教师 |
| OPT-P2-VIDEO-SERVICE-AUDIENCE | phaseTwoVideoServiceAudience | 教学视频服务对象类型 | STATIC | INDIVIDUAL_STUDENT=单个学生<br>CLASS=班级<br>STUDENT_GROUP=有界学生群体 |
| OPT-P2-VIDEO-MANAGEMENT-SCOPE | phaseTwoVideoManagementScope | 教学视频管理范围 | STATIC | STUDENT_PERSONAL_LEARNING=学生个人学习资产管理<br>SCHOOL_PRIVATE_TEACHING=学校私有教学资产管理 |
| OPT-P2-VIDEO-ACCESS-DOMAIN | phaseTwoVideoAccessDomain | 教学视频访问域 | STATIC | STUDENT_PERSONAL=学生个人学习访问域<br>SCHOOL_PRIVATE=学校私有教学访问域 |
| OPT-P2-VIDEO-ACCESS-SCOPE | phaseTwoVideoAccessScope | 教学视频访问范围 | STATIC | SERVICED_STUDENT_ONLY=仅服务学生本人<br>AUTHORIZED_CLASS_OR_GROUP=授权班级或学生群体 |
| OPT-P2-VIDEO-VERIFICATION-TARGET-KIND | phaseTwoVideoVerificationTargetKind | 观看后验证目标类型 | STATIC | CONCEPT=概念<br>CAUSAL=因果<br>LOGIC=逻辑<br>METHOD=方法<br>CHARACTER=汉字<br>WORD=单词<br>FIXED_COLLOCATION=固定搭配<br>MECHANICAL_FLUENCY=机械熟练度 |
| OPT-P2-VIDEO-VERIFICATION-STRATEGY | phaseTwoVideoVerificationStrategy | 观看后验证策略 | STATIC | ADAPTIVE_NEW_CONTEXT=目标适配的新情境验证<br>FEYNMAN_ON_DEMAND=按需费曼验证<br>RETRIEVAL_PRACTICE=提取练习<br>SPACED_REVIEW=间隔复习 |
| OPT-P2-VIDEO-VERIFICATION-MODALITY | phaseTwoVideoVerificationModality | 观看后验证方式 | STATIC | TEXT=文字<br>MATH_HANDWRITING=数学手写过程<br>STRUCTURED_QA=结构化问答<br>VARIANT_PRACTICE=变式练习<br>VOICE_OPTIONAL=可选语音 |
| OPT-P2-VIDEO-FIRST-PROMPT-POLICY | phaseTwoVideoFirstPromptPolicy | 首次表达提示策略 | STATIC | NO_ANSWER_HINT_BEFORE_FIRST_EXPRESSION=首次独立表达前不提供答案式提示 |
| OPT-P2-VIDEO-VERIFICATION-RESULT | phaseTwoVideoVerificationResult | 新情境验证结果 | STATIC | DEMONSTRATED_IN_NEW_CONTEXT=在本次新情境中表现出理解<br>NEEDS_RETEACHING=需要返回缺口教学<br>UNDETERMINED=本次无法判断 |
| OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL | phaseTwoVideoNonKnowledgeSignal | 不得直接形成知识缺口的信号 | STATIC | ACCENT=口音<br>FLUENCY=表达流利度<br>SPEECH_RECOGNITION_ERROR=语音识别错误 |
| OPT-PH3-001 | masteryNodeStatus | 能力节点状态 | STATIC | NOT_STARTED=未开始<br>LEARNING=学习中<br>PENDING_VALIDATION=待验证<br>MASTERED=已掌握<br>REVIEW_REQUIRED=需要复习 |
| OPT-PH3-002 | personalLearningPace | 个人学习节奏 | STATIC | ACTIVE=继续学习<br>PAUSED=暂停<br>REVIEWING=回顾 |
| OPT-PH3-003 | classProgressStatus | 班级教学进度状态 | STATIC | DRAFT=草稿<br>ACTIVE=推进中<br>COMPLETED=已完成 |
| OPT-BL2-001 | roleExperienceKind | Role experience kind | STATIC | TEACHER=Teacher<br>SCHOOL_ADMIN=School administrator |
| OPT-BL2-002 | ageStage | Age stage | STATIC | PRIMARY=Primary school<br>MIDDLE=Middle school |
| OPT-BL2-003 | dataNature | Data nature | STATIC | RAW_FACT=Raw fact<br>TEACHING_BASELINE=Teaching baseline<br>AI_DERIVED=AI-derived interpretation<br>SYSTEM_GOVERNANCE=System governance |
| OPT-BL2-004 | dataSubjectKind | Data subject kind | STATIC | STUDENT=Student<br>GUARDIAN=Guardian<br>TEACHER=Teacher<br>SCHOOL=School<br>PLATFORM=Platform<br>MIXED=Multiple subjects |
| OPT-BL2-005 | productManagementScope | Product management scope | STATIC | STUDENT_MEMORY=Student learning memory<br>SCHOOL_PRIVATE=School private layer<br>PLATFORM_PUBLIC=Platform public layer<br>PLATFORM_GOVERNANCE=Platform governance layer |
| OPT-BL2-006 | sourceRightsBasis | Source rights basis | STATIC | ORIGINAL_AUTHOR=Original author right<br>LICENSE=License<br>CONSENT=Verified consent<br>STATUTORY=Statutory basis<br>CONTRACTUAL=Contractual basis<br>UNKNOWN=Unknown and blocked |
| OPT-BL2-007 | dataUsePurpose | Data use purpose | STATIC | TEACHING=Teaching<br>ASSESSMENT=Assessment<br>PERSONALIZATION=Personalization<br>GOVERNANCE=Governance<br>SAFETY=Safety<br>LEGAL_HOLD=Legal or dispute hold |
| OPT-BL2-008 | dataSensitivityAxis | Data sensitivity axis | STATIC | S1=公开信息<br>S2=校内教学业务数据<br>S3=未成年人个人与学习数据<br>S4=高敏身份与安全数据 |
| OPT-BL2-009 | dataPortability | Data portability | STATIC | NON_PORTABLE=Non-portable<br>AUTHORIZED_SUBSET=Authorized subset<br>DEIDENTIFIED_ONLY=Deidentified only<br>PORTABLE=Portable |
| OPT-BL2-010 | dataLifecycleAxis | Data lifecycle axis | STATIC | TEMPORARY=Temporary<br>TERM_BOUND=Term-bound<br>RELATION_BOUND=Relationship-bound<br>LEGAL_RETENTION=Legal retention<br>PERMANENT_DEIDENTIFIED=Permanently deidentified |
| OPT-BL2-011 | governanceActionKind | Governance action kind | STATIC | CORRECT=Correct<br>RESTRICT_ACCESS=Restrict access<br>PHYSICAL_DELETE=Physical delete<br>IRREVERSIBLE_DEIDENTIFY=Irreversibly deidentify |
| OPT-BL2-012 | studentDeletionObjectCategory | Student deletion object category | STATIC | RAW_TEXT=Raw text<br>IMAGE=Image<br>AUDIO=Audio<br>AI_RESULT=AI result<br>LEARNING_PROFILE=Learning profile<br>VIDEO=Video<br>SCHOOL_FACT=School fact<br>SHARED_ASSOCIATION=Shared association<br>LEGAL_HOLD_RECORD=Legal hold record |
| OPT-BL2-013 | studentDeletionOutcome | Student deletion outcome | STATIC | CORRECT=Correct<br>RESTRICT_ACCESS=Restrict access<br>PHYSICAL_DELETE=Physical delete<br>IRREVERSIBLE_DEIDENTIFY=Irreversibly deidentify<br>RETAIN_LEGAL_HOLD=Retain under legal or dispute hold |
| OPT-BL2-014 | deletionExecutionStatus | Deletion execution status | STATIC | PENDING=Pending<br>FROZEN=Frozen by dispute<br>AUTHORIZED=Authorized<br>EXECUTING=Executing<br>COMPLETED=Completed<br>FAILED=Failed |
| OPT-BL2-015 | materialSourceKind | Material source kind | STATIC | PLATFORM_BASELINE=Platform baseline<br>SCHOOL_PRIVATE=School-private material<br>TEACHER_AUTHORED=Teacher-authored material<br>LICENSED_THIRD_PARTY=Licensed third-party material<br>AI_GENERATED=AI-generated material<br>STUDENT_WORK=Student work |
| OPT-BL2-016 | schoolReorganizationKind | School reorganization kind | STATIC | MERGE=Merge<br>SEPARATE=Separate |
| OPT-BL2-017 | catalogControlSubject | Catalog control subject | STATIC | SCHOOL=School-controlled object<br>PLATFORM=Platform-controlled object<br>STUDENT=Student-controlled object |
| OPT-V2-CLS-001 | schoolType | 学校类型 | STATIC | PRIMARY=小学<br>MIDDLE=初中<br>NINE_YEAR=九年一贯制学校 |
| OPT-V2-CLS-002 | aiDataUsePurpose | AI 数据使用目的 | STATIC | ASSESSMENT=AI 评定与完成判定<br>TEACHING_SUPPORT=提示、讲解与针对性教学<br>PERSONALIZATION=个性化学习与进度建议<br>CONTENT_GENERATION=题目、变式与教学内容生成 |
| OPT-V2-CLS-003 | oldSchoolHistoryAccessPurpose | 旧校可识别历史访问目的 | STATIC | ORIGINAL_TEACHING=原教学延续<br>DISPUTE_HANDLING=争议处理<br>LEGAL_OBLIGATION=法定义务 |
| OPT-V2-CLS-004 | sensitiveAccessPurpose | 高敏感访问目的 | STATIC | AUTHORIZED_SUPPORT=经授权的平台支持<br>SCHOOL_LOCKOUT_RECOVERY=学校锁定恢复<br>SECURITY_INCIDENT_RESPONSE=安全事件响应<br>CHILD_SAFETY_RESPONSE=儿童安全响应<br>LEGAL_EMERGENCY_RESPONSE=法定紧急响应 |
| OPT-V2-CLS-005 | teachingAttentionKind | 教学关注事件类型 | STATIC | SUBMISSION_GAP=持续未提交或迟交<br>RECURRING_DIFFICULTY=有连续证据的学习困难<br>ASSESSMENT_OR_EVIDENCE_REVIEW=评定或证据需要复核<br>PROGRESS_OR_WORKLOAD_CONFLICT=进度或学习负荷冲突<br>COORDINATION_REQUIRED=需要教师、班主任或监护协调 |

## 字段引用

| 模块 | Object ID | Field ID | 字段 | 类型 | 值来源 | 必填 | 可变性 | 可见性 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-ID | School ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-SOURCE-REF | School Directory Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-SOURCE-VERSION | School Directory Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-NAME | School Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-REGION | School Region | STRING | OPTION_SET: OPT-COM-001 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-TYPE | School Type | STRING | OPTION_SET: OPT-V2-CLS-001 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-SCHOOL-VERSION | School Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-SERVICE-STATE | Service State | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-GOVERNANCE-BOUNDARY-ID | Independent School Governance Boundary ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL | ACC-SCHOOL-F-LEGAL-SUBJECT-REF | Verified School Legal Subject Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ID | Account Membership ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACCOUNT-ID-TYPE | Account Identifier Type | STRING | OPTION_SET: OPT-ENUM-025 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACCOUNT-ID | Account Identifier Value | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-ID | Membership School ID | STRING | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-ACTIVATION | Activation Method | STRING | OPTION_SET: OPT-ENUM-026 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-STATE | Membership State | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-DIRECTORY-SNAPSHOT-ID | Membership Directory Snapshot ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-DIRECTORY-SNAPSHOT-VERSION | Membership Directory Snapshot Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PLATFORM-IDENTITY-REF | Pinned Platform Identity Reference | ID | OBJECT_REF: ACC-OBJ-PLATFORM-IDENTITY | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PLATFORM-IDENTITY-VERSION | Pinned Platform Identity Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-STUDENT-PROFILE-REF | Student Profile Reference for Student Memberships | ID | OBJECT_REF: ORG-OBJ-STUDENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-PROFILE-REF | Pinned School Profile Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-SCHOOL-PROFILE-VERSION | Pinned School Profile Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TRANSFER-AUTHORIZATION-REF | Pinned Transfer Authorization Reference | ID | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TRANSFER-AUTHORIZATION-VERSION | Pinned Transfer Authorization Version | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PREDECESSOR-REF | Pinned Predecessor Membership Reference | ID | OBJECT_REF: ACC-OBJ-MEMBERSHIP | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-PREDECESSOR-VERSION | Pinned Predecessor Membership Version | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-EFFECTIVE-AT | Membership Effective At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-TERMINATED-AT | Membership Terminated At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-MEMBERSHIP | ACC-MEMBER-F-VERSION | Membership Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-ID | Identity Assignment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-SOURCE-REF | Identity Directory Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-SOURCE-VERSION | Identity Directory Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-ROLE | Login Role | STRING | OPTION_SET: OPT-COM-003 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-DUTIES | Assigned Duties | STRING_ARRAY | OPTION_SET: OPT-ENUM-042 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-SCOPES | Effective Data Scopes | STRING_ARRAY | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-IDENTITY-VERSION | Identity Assignment Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-EFFECTIVE | Effective At | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-IDENTITY | ACC-IDENTITY-F-EXPIRY | Expires At | DATETIME | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-ID | School Activation Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-NAME | Applied School Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBJECT-REF | Verified School Legal Subject Reference | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-FIRST-ADMIN-ID | First Administrator Identity ID | ID | USER_INPUT | required from first-administrator acceptance onward；状态=FIRST_ADMIN_ACCEPTED/INITIALIZATION_VALIDATED/TEACHING_ACTIVE | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-EVIDENCE | Initialization Validation Evidence | JSON | USER_INPUT | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-READY | Subscription Readiness | STRING | OPTION_SET: OPT-ENUM-001 | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-READY | Class and Course Readiness | STRING | OPTION_SET: OPT-ENUM-001 | required before initialization is validated；状态=INITIALIZATION_VALIDATED/TEACHING_ACTIVE | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-COMPLETED-AXES | Independently Completed Activation Axes | STRING_ARRAY | OPTION_SET: OPT-GOV-001 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-STATUS | School Activation Case Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-VERSION | School Activation Case Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-APPLICATION-REF | ACC-OBJ-SCHOOL-APPLICATION-REVIEW Readiness Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL-APPLICATION-REVIEW | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-APPLICATION-VERSION | ACC-OBJ-SCHOOL-APPLICATION-REVIEW Pinned Version | INTEGER | SYSTEM | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-REF | ACC-OBJ-SCHOOL Readiness Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SCHOOL-VERSION | ACC-OBJ-SCHOOL Pinned Version | INTEGER | SYSTEM | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-REF | ACC-OBJ-SCHOOL-INITIALIZATION Readiness Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL-INITIALIZATION | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-INITIALIZATION-VERSION | ACC-OBJ-SCHOOL-INITIALIZATION Pinned Version | INTEGER | SYSTEM | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-REF | ACC-OBJ-SCHOOL-SUBSCRIPTION Readiness Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL-SUBSCRIPTION | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-SUBSCRIPTION-VERSION | ACC-OBJ-SCHOOL-SUBSCRIPTION Pinned Version | INTEGER | SYSTEM | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-REF | ACC-OBJ-CLASS-COURSE-READINESS Readiness Reference | ID | OBJECT_REF: ACC-OBJ-CLASS-COURSE-READINESS | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-ACTIVATION | ACC-ACTIVATION-F-CLASS-COURSE-VERSION | ACC-OBJ-CLASS-COURSE-READINESS Pinned Version | INTEGER | SYSTEM | required only for final teaching activation；状态=TEACHING_ACTIVE；动作=ACC-ACT-ACTIVATE-SCHOOL-TEACHING | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-ID | Platform Identity Number | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-CLAIM-DIGEST | Verified Natural-person Claim Digest | STRING | USER_INPUT | 是 | IMMUTABLE | OWNER_ONLY |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-CREATED-AT | Identity Created At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-LOOKUP-MAPPING-STATUS | Recoverable Identity Lookup Mapping Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-STATUS | Platform Identity Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-VERSION | Platform Identity Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-SUBJECT-KIND | Platform Identity Subject Kind | STRING | OPTION_SET: OPT-BL2-004 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT | Versioned Teaching Facts Requiring Historical Authorship | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-TEACHING-FACT-SNAPSHOT-DIGEST | Canonical Teaching Fact Snapshot Digest | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-EVENT-ID | Teacher Identity Deletion Completion Event ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-EVENT-VERSION | Teacher Identity Deletion Completion Event Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-CASE-REF | Completed Student Deletion Matrix Reference | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | required before final platform identity deletion；状态=DELETED；动作=ACC-ACT-COMPLETE-IDENTITY-DELETION | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-DELETION-CASE-VERSION | Pinned Student Deletion Matrix Version | INTEGER | SYSTEM | required before final platform identity deletion；状态=DELETED；动作=ACC-ACT-COMPLETE-IDENTITY-DELETION | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-ID | High-impact Domain Execution ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-PLATFORM-IDENTITY | ACC-PIDENT-F-HIGH-IMPACT-EXECUTION-VERSION | High-impact Domain Execution Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-ID | Login Account ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-PLATFORM-IDENTITY-ID | Bound Platform Identity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-MOBILE | Bound Mobile Identifier | STRING | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-EMAIL | Bound Email Identifier | STRING | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-USERNAME | Bound Username Identifier | STRING | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-STATUS | Login Account Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-LOGIN-ACCOUNT | ACC-LACCOUNT-F-VERSION | Login Account Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-ID | School Profile ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-PLATFORM-IDENTITY-ID | Platform Identity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-SCHOOL-ID | Profile School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-PROFILE-TYPE | School Profile Type | STRING | OPTION_SET: OPT-COM-003 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-SCHOOL-PERSON-NUMBER | School-local Student or Employee Number | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-EFFECTIVE-START | School Relationship Start | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-EFFECTIVE-END | School Relationship End | DATETIME | USER_INPUT | required when the school relationship ends；状态=ENDED | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-STATUS | School Profile Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-PROFILE | ACC-PROFILE-F-VERSION | School Profile Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-ID | Student Primary-account Relation ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-STUDENT-PROFILE-ID | Student School Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-LOGIN-ACCOUNT-ID | Student Login Account ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-EFFECTIVE-AT | Primary Relation Effective At | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-ENDED-AT | Primary Relation Ended At | DATETIME | SYSTEM | required when the primary relation ends；状态=ENDED | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-STATUS | Student Primary-account Relation Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-STUDENT-PRIMARY-ACCOUNT | ACC-PRIMARY-F-VERSION | Student Primary-account Relation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-ID | Administrator Recovery ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SCHOOL-ID | Recovery School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-REQUESTER-ID | Requesting Administrator ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SINGLE-ADMIN | School Has One Valid Administrator | STRING | OPTION_SET: OPT-ENUM-001 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SENSITIVE-ACTION | Requested Sensitive Action | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-PLATFORM-AUTHORIZER-ID | Independent Platform Governance Authorizer ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-SCHOOL-CONFIRMER-IDS | Distinct School Administrator Confirmer IDs | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-EXPIRY | Recovery Authorization Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-STATUS | Administrator Recovery Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-ADMIN-RECOVERY | ACC-RECOVERY-F-VERSION | Administrator Recovery Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-ID | Work Context ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-SCHOOL-ID | Context School ID | STRING | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-IDENTITY-ID | Context Identity ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-TERM-ID | Context Term ID | STRING | OPTION_SET: OPT-COM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-CREATED | Created At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-EXPIRY | Expires At | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-CONTEXT-VERSION | Context Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CONTEXT | ACC-CONTEXT-F-STATUS | Context Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CAMPUS | ACC-CAMPUS-F-ID | Campus ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CAMPUS | ACC-CAMPUS-F-SCHOOL-ID | Independent School Entity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CAMPUS | ACC-CAMPUS-F-NAME | Campus Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CAMPUS | ACC-CAMPUS-F-VERSION | Campus Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-ID | Education Group ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-NAME | Education Group Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-MEMBER-SCHOOL-IDS | Explicit Member School IDs | STRING_ARRAY | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-DATA-SHARING-AUTHORIZATION-REFS | Explicit Data-sharing Authorization References | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-EDUCATION-GROUP | ACC-GROUP-F-VERSION | Education Group Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-ID | School Name Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-SCHOOL-ID | School Entity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-DISPLAY-NAME | School Display Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-EFFECTIVE-AT | Name Effective Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-NAME-VERSION | ACC-NAME-F-VERSION | School Name Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-ID | School Reorganization Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-KIND | Reorganization Kind | STRING | OPTION_SET: OPT-BL2-016 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-SOURCE-SCHOOL-IDS | Source School Entity IDs | STRING_ARRAY | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-TARGET-SCHOOL-IDS | Target School Entity IDs | STRING_ARRAY | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-DATA-MIGRATION-AUTHORIZATION | Object-level Data Migration Authorization | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-STATUS | Reorganization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-REORGANIZATION | ACC-REORG-F-VERSION | Reorganization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-ID | School Application Review ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-APPLICANT-REF | Applicant Reference | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-LEGAL-SUBJECT-EVIDENCE | Legal Subject Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-DECISION | Application Review Decision | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-APPLICATION-REVIEW | ACC-APPREVIEW-F-VERSION | Application Review Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-ID | School Initialization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-SCHOOL-ID | School Entity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-CHECKLIST-EVIDENCE | Atomic Initialization Checklist Evidence | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-STATUS | Initialization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-INITIALIZATION | ACC-INIT-F-VERSION | Initialization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-ID | School Subscription ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-SCHOOL-ID | School Entity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-CONTRACT-REF | School Contract Reference | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-STATUS | Subscription Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-SCHOOL-SUBSCRIPTION | ACC-SUBSCRIPTION-F-VERSION | Subscription Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-ID | Class and Course Readiness ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-SCHOOL-ID | School Entity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-TERM-ID | Current Term ID | ID | OPTION_SET: OPT-COM-004 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-CLASS-COURSE-EVIDENCE | Class and Course Validation Evidence | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-STATUS | Class and Course Readiness Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ACC-001 | ACC-OBJ-CLASS-COURSE-READINESS | ACC-READINESS-F-VERSION | Class and Course Readiness Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-ID | Term ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-NAME | Term Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-START | Start Date | DATE | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-END | End Date | DATE | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-TERM-VERSION | Term Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TERM | ORG-TERM-F-STATUS | Term Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-GRADE | ORG-GRADE-F-ID | Grade ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-GRADE | ORG-GRADE-F-NAME | Grade Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-GRADE | ORG-GRADE-F-TERM-ID | Term ID | STRING | OPTION_SET: OPT-COM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-GRADE | ORG-GRADE-F-STATUS | Grade Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-CLASS | ORG-CLASS-F-ID | Class ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-CLASS | ORG-CLASS-F-NAME | Class Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-CLASS | ORG-CLASS-F-GRADE-ID | Grade ID | STRING | OPTION_SET: OPT-COM-005 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-CLASS | ORG-CLASS-F-STATUS | Class Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBJECT | ORG-SUBJECT-F-ID | Subject ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBJECT | ORG-SUBJECT-F-NAME | Subject Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBJECT | ORG-SUBJECT-F-STATUS | Subject Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-COURSE | ORG-COURSE-F-ID | Course ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-COURSE | ORG-COURSE-F-NAME | Course Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-COURSE | ORG-COURSE-F-SUBJECT-ID | Subject ID | STRING | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-COURSE | ORG-COURSE-F-TERM-ID | Term ID | STRING | OPTION_SET: OPT-COM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-COURSE | ORG-COURSE-F-STATUS | Course Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHER | ORG-TEACHER-F-ID | Teacher ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHER | ORG-TEACHER-F-NAME | Teacher Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHER | ORG-TEACHER-F-MEMBER-STATE | Member State | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-STUDENT | ORG-STUDENT-F-ID | Student ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-STUDENT | ORG-STUDENT-F-NAME | Student Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-STUDENT | ORG-STUDENT-F-CLASS-ID | Class ID | STRING | OPTION_SET: OPT-COM-006 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-STUDENT | ORG-STUDENT-F-MEMBER-STATE | Member State | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-STUDENT | ORG-STUDENT-F-VERSION | Student School-profile Projection Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-ID | Teaching Assignment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-TEACHER-ID | Teacher ID | STRING | OPTION_SET: OPT-COM-009 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-COURSE-ID | Course ID | STRING | OPTION_SET: OPT-COM-008 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-CLASS-ID | Class ID | STRING | OPTION_SET: OPT-COM-006 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-TEACHING-ASSIGNMENT | ORG-TEACHING-F-EFFECTIVE | Effective Range | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-ID | Homeroom Assignment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-TEACHER-ID | Homeroom Teacher ID | STRING | OPTION_SET: OPT-COM-009 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-CLASS-ID | Homeroom Class ID | STRING | OPTION_SET: OPT-COM-006 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-HOMEROOM-ASSIGNMENT | ORG-HOMEROOM-F-EFFECTIVE | Effective Range | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-ID | Substitute-teaching Relation ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-TEACHER-ID | Substitute Teacher ID | ID | OPTION_SET: OPT-COM-009 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-CLASS-ID | Substitute Class ID | ID | OPTION_SET: OPT-COM-006 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-SUBJECT-ID | Substitute Subject ID | ID | OPTION_SET: OPT-COM-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-DUTY-ID | Substitute Duty ID | STRING | OPTION_SET: OPT-ENUM-042 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-START | Substitute Relation Start | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-END | Mandatory Substitute Relation End | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-STATUS | Substitute Relation Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-SUBSTITUTE-TEACHING-RELATION | ORG-SUBSTITUTE-F-VERSION | Substitute Relation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-ID | Import Batch ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-OBJECT-TYPE | Import Object Type | STRING | OPTION_SET: OPT-ENUM-020 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-TEMPLATE-VERSION | Template Version | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-MAPPING | Field Mapping | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-BATCH-VERSION | Import Batch Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-BATCH | ORG-IMPORT-F-STATUS | Import Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ID | Import Row ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-BATCH-ID | Import Batch ID | STRING | SYSTEM | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ROW-VERSION | Import Row Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-RESULT-TYPE | Object Result Type | STRING | OPTION_SET: OPT-ENUM-021 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-VALIDATION-RESULT | Row Validation Result | STRING | OPTION_SET: OPT-ENUM-022 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ERRORS | Row Errors | STRING_ARRAY | SYSTEM | 否 | READ_ONLY | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFLICTS | Row Conflicts | STRING_ARRAY | SYSTEM | 否 | READ_ONLY | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-OBJECT-ID | Affected Object ID | STRING | SYSTEM | 否 | READ_ONLY | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-ANOMALY-CONFIRMATION | Anomaly Confirmation | STRING | OPTION_SET: OPT-ENUM-001 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| ORG-001 | ORG-OBJ-IMPORT-ROW | ORG-IMPORT-ROW-F-CONFIRMATION-NOTE | Anomaly Confirmation Note | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-ID | Role Policy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-SOURCE-REF | Role Policy Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-SOURCE-VERSION | Role Policy Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-ROLE | Login Role | STRING | OPTION_SET: OPT-COM-003 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-ACTIONS | Allowed Action Set | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-ROLE-POLICY | IAM-ROLE-F-VERSION | Policy Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-ID | Duty Grant ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-GRANTOR-AUTHORITY | Grantor Authority | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-SUBJECT | Subject Account ID | STRING | OPTION_SET: OPT-COM-009 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-DUTY | Duty ID | STRING | OPTION_SET: OPT-ENUM-042 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-SCOPE | Duty Object Scope | JSON | OPTION_SET: OPT-COM-015 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-ACTIONS | Duty Granted Actions | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-EFFECTIVE | Effective At | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-EXPIRY | Expires At | DATETIME | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-REASON | Grant Reason | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-DUTY-GRANT | IAM-DUTY-F-STATUS | Duty Grant Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-ID | Data Scope Grant ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-GRANTOR-AUTHORITY | Scope Grantor Authority | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-SUBJECT | Scope Subject ID | STRING | OPTION_SET: OPT-COM-009 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-DUTY | Target Duty ID | STRING | OPTION_SET: OPT-ENUM-042 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-SCOPE | Granted Object Scope | JSON | OPTION_SET: OPT-COM-015 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-ACTIONS | Granted Actions | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-EFFECTIVE | Scope Effective At | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-EXPIRY | Scope Expires At | DATETIME | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-REASON | Scope Grant Reason | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCOPE-GRANT | IAM-SCOPE-F-STATUS | Scope Grant Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-ID | Permission Decision ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SUBJECT | Decision Subject ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-ACTION | Evaluated Action | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SCOPE | Evaluated Object Scope | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-RESULT | Permission Result | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-REASON | Permission Reason | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-SOURCE-VERSIONS | Permission Source Versions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-PERMISSION-DECISION | IAM-DECISION-F-DECISION-VERSION | Permission Decision Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-ID | Temporary Grant ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-GRANTOR-AUTHORITY | Temporary Grantor Authority | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-SUBJECT | Temporary Subject ID | STRING | OPTION_SET: OPT-COM-009 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-DUTY | Temporary Duty ID | STRING | OPTION_SET: OPT-ENUM-042 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-SCOPE | Temporary Scope | JSON | OPTION_SET: OPT-COM-015 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-ACTIONS | Temporary Actions | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-EFFECTIVE | Temporary Effective At | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-EXPIRY | Mandatory Expiry | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-REASON | Temporary Grant Reason | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TEMP-GRANT | IAM-TEMP-F-STATUS | Temporary Grant Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-ID | Guardian Relation ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-GUARDIAN-ACCOUNT-ID | Guardian Account ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-STUDENT-PROFILE-ID | Student Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-VERIFICATION-EVIDENCE | Guardian Verification Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | OWNER_ONLY |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-ASSISTANCE-STATUS | Guardian Assistance Status | STRING | OPTION_SET: OPT-GOV-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-STATUS | Guardian Relation Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-RELATION | IAM-GREL-F-VERSION | Guardian Relation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-ID | School Data Authorization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-GUARDIAN-RELATION-ID | Confirmed Guardian Relation ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-STUDENT-PROFILE-ID | Authorized Student Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-SCHOOL-ID | Authorizing School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-SCOPE | Minimum School Data and Delegated Task Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-ACTIONS | Authorized Task Assistance Actions | STRING_ARRAY | OPTION_SET: OPT-COM-016 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-EFFECTIVE | School Data Authorization Effective At | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-EXPIRY | School Data Authorization Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-STATUS | School Data Authorization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-SCHOOL-DATA-AUTHORIZATION | IAM-SDAUTH-F-VERSION | School Data Authorization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-ID | Task Assistance Session ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-GUARDIAN-RELATION-ID | Confirmed Guardian Relation ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-SCHOOL-AUTHORIZATION-ID | Active School Data Authorization ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-STUDENT-PROFILE-ID | Selected Child Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-TASK-ID | Selected Current Task ID | ID | OPTION_SET: OPT-COM-012 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-SCOPE | Current Task Minimum Necessary Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-START | Assistance Session Start | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-EXPIRY | Assistance Session Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-GUARDIAN-PARTICIPATION | Recorded Guardian Participation Fact | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-ASSISTANCE-STATUS | Guardian Assistance Status | STRING | OPTION_SET: OPT-GOV-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-STATUS | Task Assistance Session Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-TASK-ASSISTANCE-SESSION | IAM-ASSIST-F-VERSION | Task Assistance Session Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-ID | High-impact Authorization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STUDENT-PROFILE-ID | Affected Student Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-ACTION | Requested Data-right or High-impact Action | STRING | OPTION_SET: OPT-GOV-005 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-IMPACT | Authorization Impact Level | STRING | OPTION_SET: OPT-GOV-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-REQUESTER-ID | High-impact Action Requester ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-VERIFIED-GUARDIAN-BASIS | Verified Guardian Authorization Basis | JSON | USER_INPUT | 是 | IMMUTABLE | OWNER_ONLY |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STUDENT-CONSIDERATION | Student Age and Situation Consideration | JSON | USER_INPUT | 是 | IMMUTABLE | OWNER_ONLY |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-LEGAL-BASIS | Applicable Legal or Contractual Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-DISPUTE-STATUS | Guardian Dispute Status | STRING | OPTION_SET: OPT-GOV-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-EXPIRY | High-impact Authorization Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-STATUS | High-impact Authorization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-VERSION | High-impact Authorization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-SCHOOL-SCOPE | Exact School Scope for High-impact Action | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RELATIONSHIP-SCOPE | Exact Relationship Scope for High-impact Action | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMPTION-KEY | Unique High-impact Authorization Consumption Key | STRING | SYSTEM | required once the authorization version is consumed or reserved for a domain execution；状态=RESERVED/EXECUTED；动作=IAM-ACT-RESERVE-HIGH-IMPACT-AUTHORIZATION/IAM-ACT-EXECUTE-HIGH-IMPACT-ACTION | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-ACTION-ID | Reserved Domain Action ID | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-TARGET-REF | Consumed Domain Target Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-TARGET-VERSION | Consumed Domain Target Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVATION-ID | Authoritative Reservation ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVATION-VERSION | Authoritative Reservation Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-RESERVED-AT | High-impact Authorization Reserved At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-EXECUTION-ID | Consumed Domain Execution ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-EXECUTION-VERSION | Consumed Domain Execution Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | IAM-HIAUTH-F-CONSUMED-AT | High-impact Authorization Consumed At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-ID | Guardian Dispute ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-ID | Disputed High-impact Authorization ID | ID | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-RAISED-BY | Dispute Requester ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-EVIDENCE | Guardian Dispute Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | OWNER_ONLY |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-RESOLUTION | Independent Dispute Resolution | JSON | SYSTEM | required when the dispute is resolved or rejected；状态=RESOLVED/REJECTED | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-STATUS | Guardian Dispute Status | STRING | OPTION_SET: OPT-GOV-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-VERSION | Guardian Dispute Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-GUARDIAN-DISPUTE | IAM-DISPUTE-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-ID | Student School Data Authorization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-STUDENT-PROFILE-REF | Authorized Student Profile Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SCHOOL-ID | Authorized School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-MEMBERSHIP-REF | Pinned Student School Membership Reference | ID | OBJECT_REF: ACC-OBJ-MEMBERSHIP | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-MEMBERSHIP-VERSION | Pinned Membership Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-TRANSFER-REF | Pinned Source Transfer Authorization Reference | ID | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-TRANSFER-VERSION | Pinned Source Transfer Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-TERMINATION-TRANSFER-REF | Pinned Termination Transfer Authorization Reference | ID | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-TERMINATION-TRANSFER-VERSION | Pinned Termination Transfer Version | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-PERMITTED-SUBSET | Authorized Migratable Learning Record Subset | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-PERMITTED-SUBSET-DIGEST | Authorized Subset Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-RIGHTS | Source Rights and Material Exclusions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-SOURCE-RIGHTS-DIGEST | Source Rights Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-EFFECTIVE-AT | Authorization Effective At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-EXPIRY | Authorization Expiry or Membership End | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-REVOKED-AT | Authorization Revoked At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-STATUS | Student School Data Authorization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| IAM-001 | IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | IAM-SSDA-F-VERSION | Student School Data Authorization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-ID | Governance Policy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-SOURCE-REF | Governance Policy Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-SOURCE-VERSION | Governance Policy Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-SCHOOL-ID | Governed School ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-VERSION | Governance Policy Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-POLICY | DGV-POLICY-F-EXPLANATION | Data Use Explanation | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-RETENTION | DGV-RETENTION-F-ID | Retention Rule ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-RETENTION | DGV-RETENTION-F-CATEGORY | Data Category | STRING | OPTION_SET: OPT-ENUM-044 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-RETENTION | DGV-RETENTION-F-PERIOD | School-owned Retention Period | DURATION | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-RETENTION | DGV-RETENTION-F-ACTIVATED-BY | Activated By School Administrator | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-RETENTION | DGV-RETENTION-F-STATUS | Retention Configuration Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-AI-RULE | DGV-AI-F-ID | AI Data Use Rule ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-AI-RULE | DGV-AI-F-DATA-SCOPE | Allowed AI Data Scope | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-AI-RULE | DGV-AI-F-PURPOSE | Allowed AI Purpose | STRING | OPTION_SET: OPT-V2-CLS-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-AI-RULE | DGV-AI-F-MODEL-USE | Model Training Use | STRING | OPTION_SET: OPT-ENUM-045 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-AI-RULE | DGV-AI-F-STATUS | AI Data Use Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-ID | Export Request ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIENCE | Export Right Audience | STRING | OPTION_SET: OPT-GOV-006 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-SUBJECT-ID | Export Data Subject or Object Owner ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-DATA-RIGHT-ACTION | Export Data-right Action | STRING | OPTION_SET: OPT-GOV-005 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-SCOPE | Export Object Scope | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-PURPOSE | Export Purpose | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-SOURCE-RIGHTS | Source Rights and Third-party Privacy Constraints | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-APPROVER | Export Approver ID | STRING | SYSTEM | required before APPROVED；状态=APPROVED | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-DECISION-REASON | Export Decision Reason | TEXT | USER_INPUT | required for APPROVED or DENIED；状态=APPROVED/DENIED | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-EXPIRY | Export File Expiry | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-RESULT | Export Result | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-EXPORT | DGV-EXPORT-F-AUDIT-REF | Export Audit Reference | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-ID | Student Transfer Authorization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-STUDENT-PROFILE-ID | Transferring Student Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-FROM-SCHOOL-ID | Old School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-TO-SCHOOL-ID | New School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-PERMITTED-SUBSET | Authorized Learning Record Subset | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-SOURCE-RIGHTS | Source Rights and Material Exclusions | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-DISPUTE-STATUS | Guardian Dispute Status | STRING | OPTION_SET: OPT-GOV-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-EXPIRY | Transfer Authorization Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-STATUS | Transfer Authorization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-VERSION | Transfer Authorization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-RELATIONSHIP-SCOPE | Exact Transfer Relationship Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-MEMBERSHIP-REF | Pinned Old-school Membership Reference | ID | OBJECT_REF: ACC-OBJ-MEMBERSHIP | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-MEMBERSHIP-VERSION | Pinned Old-school Membership Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-REF | Pinned Old-school Student Data Authorization Reference | ID | OBJECT_REF: IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-SCHOOL-AUTHORIZATION-VERSION | Pinned Old-school Data Authorization Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-OLD-GUARDIAN-AUTHORIZATION-MANIFEST-DIGEST | Old-school Guardian Delegation Manifest Digest | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-PERMITTED-SUBSET-DIGEST | Authorized Migratable Subset Digest | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-SOURCE-RIGHTS-DIGEST | Source Rights and Exclusion Digest | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-CUTOVER-STARTED-AT | Transfer Cutover Started At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-MEMBERSHIP-REF | Activated New-school Membership Reference | ID | OBJECT_REF: ACC-OBJ-MEMBERSHIP | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-MEMBERSHIP-VERSION | Activated New-school Membership Version | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-REF | Activated New-school Student Data Authorization Reference | ID | OBJECT_REF: IAM-OBJ-STUDENT-SCHOOL-DATA-AUTHORIZATION | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-NEW-SCHOOL-AUTHORIZATION-VERSION | Activated New-school Data Authorization Version | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-JOINT-ACTIVATION-COMMIT-ID | Joint Membership and Data Authorization Activation Commit ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-JOINT-ACTIVATION-EFFECTIVE-AT | Joint Membership and Data Authorization Effective At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-CUTOVER-COMPLETED-AT | Transfer Cutover Completed At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-ID | High-impact Domain Execution ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TRANSFER-AUTHORIZATION | DGV-TRANSFER-F-HIGH-IMPACT-EXECUTION-VERSION | High-impact Domain Execution Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-ID | Old-school Restricted History Access ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-STUDENT-PROFILE-ID | Departed Student Profile ID | ID | OPTION_SET: OPT-COM-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-SCHOOL-ID | Old School ID | ID | OPTION_SET: OPT-COM-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-PURPOSE | Restricted Historical Access Purpose | STRING | OPTION_SET: OPT-V2-CLS-003 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-ROLE-SCOPE | Restricted Old-school Role Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-EXPIRY | Identifiable Access Expiry | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-DEIDENTIFIED-REF | Irreversibly Deidentified Result Reference | ID | SYSTEM | required after identifiable history is deidentified；状态=DEIDENTIFIED | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-STATUS | Old-school History Access Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-VERSION | Old-school History Access Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-REF | Pinned Completed Transfer Authorization Reference | ID | OBJECT_REF: DGV-OBJ-TRANSFER-AUTHORIZATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-TRANSFER-AUTHORIZATION-VERSION | Pinned Completed Transfer Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-OLD-MEMBERSHIP-REF | Pinned Terminated Old-school Membership Reference | ID | OBJECT_REF: ACC-OBJ-MEMBERSHIP | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-OLD-MEMBERSHIP-VERSION | Pinned Terminated Membership Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-OLD-SCHOOL-RESTRICTED-HISTORY | DGV-OLDHIST-F-PERMITTED-PURPOSE-DIGEST | Purpose, Role, Object, and Time Boundary Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-ID | Non-recoverable Author Surrogate ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-DELETION-EVENT-ID | Teacher Identity Deletion Event ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-TEACHING-FACT-SCOPE | Teaching Facts Requiring Historical Authorship | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-STATUS | Author Surrogate Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-VERSION | Author Surrogate Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-DELETION-EVENT-VERSION | Pinned Teacher Identity Deletion Event Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-TEACHING-FACT-SCOPE-DIGEST | Canonical Teaching Fact Scope Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-AUTHORSHIP-MAPPING-DIGEST | Applied Authorship Rewrite Mapping Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-TEACHER-AUTHOR-SURROGATE | DGV-SURROGATE-F-REWRITE-EVIDENCE | Atomic Authorship Rewrite Evidence | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-ID | Data Catalog Entry ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-CONTROL-SUBJECT | Governed Object Control Subject | STRING | OPTION_SET: OPT-BL2-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-CONTROL-SCOPE-REF | Governed Control Scope Instance | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SOURCE-OBJECT-KIND | Source Object Kind | STRING | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-NATURE | Data Nature | STRING | OPTION_SET: OPT-BL2-003 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-DATA-SUBJECT | Data Subject | STRING | OPTION_SET: OPT-BL2-004 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-MANAGEMENT-SCOPE | Management Scope | STRING | OPTION_SET: OPT-BL2-005 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SOURCE-RIGHTS | Source Rights Basis | STRING | OPTION_SET: OPT-BL2-006 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-PURPOSE | Authorized Purpose | STRING | OPTION_SET: OPT-BL2-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-SENSITIVITY | Sensitivity | STRING | OPTION_SET: OPT-BL2-008 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-PORTABILITY | Portability | STRING | OPTION_SET: OPT-BL2-009 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-LIFECYCLE | Lifecycle | STRING | OPTION_SET: OPT-BL2-010 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-REPLACEMENT-DRAFT-REF | Replacement Draft Catalog Entry | ID | OBJECT_REF: DGV-OBJ-DATA-CATALOG-ENTRY | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-REPLACEMENT-DRAFT-VERSION | Replacement Draft Catalog Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-STATUS | Catalog Entry Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-CATALOG-ENTRY | DGV-CATALOG-F-VERSION | Catalog Entry Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-ID | Data Governance Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-OBJECT-ID | Target Object ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-OBJECT-KIND | Target Object Kind | STRING | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-TARGET-CONTROL-SCOPE-REF | Target Control Scope Instance | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-CATALOG-ENTRY-REF | Pinned Active Eight-axis Catalog Entry | ID | OBJECT_REF: DGV-OBJ-DATA-CATALOG-ENTRY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-CATALOG-ENTRY-VERSION | Pinned Catalog Entry Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-ACTION-KIND | Governance Action Kind | STRING | OPTION_SET: OPT-BL2-011 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-LEGAL-BASIS | Verified Legal or Contractual Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-DISPUTE-BASIS | Dispute or Hold Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-EXECUTION-EVIDENCE | Governance Execution Evidence | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-STATUS | Governance Case Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-DATA-GOVERNANCE-CASE | DGV-GOVCASE-F-VERSION | Governance Case Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-ID | Student Deletion Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-PLATFORM-IDENTITY-ID | Platform Identity ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-STUDENT-PROFILE-ID | Student Profile ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-HIGH-IMPACT-AUTHORIZATION-ID | High-impact Authorization ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-LEGAL-BASIS | Case Legal Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-DISPUTE-BASIS | Case Dispute or Hold Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-CATEGORY-COVERAGE | Nine-category Decision Coverage | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-STATUS | Student Deletion Case Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-VERSION | Student Deletion Case Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-MATRIX-SNAPSHOT-REF | Pinned Evaluated Student Deletion Matrix Snapshot | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | written when the evaluated matrix is finalized and retained through identity deletion release；状态=MATRIX_COMPLETE/EXECUTING/COMPLETED/FAILED；动作=DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-MATRIX-SNAPSHOT-VERSION | Pinned Evaluated Matrix Snapshot Version | INTEGER | SYSTEM | required from matrix finalization through identity deletion release；状态=MATRIX_COMPLETE/EXECUTING/COMPLETED/FAILED；动作=DGV-ACT-FINALIZE-STUDENT-DELETION-MATRIX | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-SCHOOL-SCOPE | Exact School Scope at Student Deletion Request | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-CASE | DGV-DELCASE-F-RELATIONSHIP-SCOPE | Exact Relationship Scope at Student Deletion Request | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-ID | Student Deletion Inventory Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-DELETION-CASE-REF | Pinned Student Deletion Case for Inventory | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-SET | Exact Source-object ID Category and Version Set | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-COUNT | Source-object Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-SOURCE-OBJECT-DIGEST | Source-object Inventory Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-CAPTURED-AT | Inventory Captured At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-STATUS | Inventory Snapshot Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | DGV-INVENTORY-F-VERSION | Inventory Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-ID | Student Deletion Decision ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DELETION-CASE-REF | Pinned Student Deletion Case Reference | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-REF | Pinned Student Deletion Inventory Snapshot | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-VERSION | Pinned Student Deletion Inventory Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-ITEM-ID | Frozen Inventory Item ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-INVENTORY-ITEM-DIGEST | Frozen Inventory Item Digest | STRING | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-ID | Source Object ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-VERSION | Source Object Version | INTEGER | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-SOURCE-OBJECT-CATEGORY | Source Object Category | STRING | OPTION_SET: OPT-BL2-012 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-LEGAL-BASIS | Object-specific Legal Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-DISPUTE-BASIS | Object-specific Dispute or Hold Basis | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-HIGH-IMPACT-AUTHORIZATION-ID | Object Decision Authorization ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-GOVERNANCE-ACTION | Object-specific Governance Outcome | STRING | OPTION_SET: OPT-BL2-013 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-EXECUTION-STATUS | Object Decision Execution Status | STRING | OPTION_SET: OPT-BL2-014 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-EXECUTION-EVIDENCE | Object Decision Execution Evidence | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-DECISION | DGV-DELROW-F-VERSION | Student Deletion Decision Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-ID | Student Deletion Matrix Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DELETION-CASE-REF | Pinned Student Deletion Case for Matrix Evaluation | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-CASE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DELETION-CASE-VERSION | Pinned Student Deletion Case Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-REF | Pinned Student Deletion Inventory for Matrix Evaluation | ID | OBJECT_REF: DGV-OBJ-STUDENT-DELETION-INVENTORY-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-VERSION | Pinned Student Deletion Inventory Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-DIGEST | Pinned Inventory Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-INVENTORY-ITEM-COUNT | Inventory Item Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-VERSION-SET | Exact Decision ID and Version Set | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-SET-DIGEST | Decision Version Set Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DECISION-COUNT | Decision Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-MISSING-DECISION-COUNT | Missing Decision Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-DUPLICATE-DECISION-COUNT | Duplicate Decision Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-UNAUTHORIZED-DECISION-COUNT | Unauthorized Decision Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-UNRESOLVED-EXECUTION-COUNT | Unresolved Execution Count | INTEGER | SYSTEM | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-FAILED-EXECUTION-COUNT | Failed Execution Count | INTEGER | SYSTEM | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-FROZEN-EXECUTION-COUNT | Frozen Execution Count | INTEGER | SYSTEM | required when completing or blocking matrix execution；状态=COMPLETED/BLOCKED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT/DGV-ACT-BLOCK-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-LAWFUL-RETENTION-COUNT | Lawful Retention Decision Count | INTEGER | SYSTEM | required when completing matrix execution；状态=COMPLETED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-EXECUTION-DIGEST | Terminal Decision Execution Digest | STRING | SYSTEM | required when completing matrix execution；状态=COMPLETED；动作=DGV-ACT-COMPLETE-STUDENT-DELETION-MATRIX-SNAPSHOT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-STATUS | Deletion Matrix Snapshot Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| DGV-001 | DGV-OBJ-STUDENT-DELETION-MATRIX-SNAPSHOT | DGV-MATRIX-F-VERSION | Deletion Matrix Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-ID | Audit Event ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-TIME | Event Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-ACTOR | Actor ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-ACTION | Audited Action | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-SCOPE | Audited Object Scope | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-RESULT | Audited Result | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-EVENT | AUD-EVENT-F-EVENT-VERSION | Audit Event Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-ID | Sensitive Access Request ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-REQUESTER | Access Requester ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-SCOPE | Requested Sensitive Scope | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-PURPOSE | Sensitive Access Purpose | STRING | OPTION_SET: OPT-V2-CLS-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-EXPIRY | Requested Access Expiry | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-APPROVER | School Approver ID | STRING | SYSTEM | required before APPROVED；状态=APPROVED | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-DECISION-REASON | Sensitive Access Decision Reason | TEXT | USER_INPUT | required for APPROVED or DENIED；状态=APPROVED/DENIED | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-RESULT | Access Decision Result | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-REQUEST | AUD-REQUEST-F-VERSION | Sensitive Access Request Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-ID | Sensitive Session ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-REQUEST-ID | Approved Request ID | ID | OBJECT_REF: AUD-OBJ-ACCESS-REQUEST | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-REQUEST-VERSION | Approved Request Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-SCOPE | Session Object Scope | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-START | Session Start | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-EXPIRY | Session Expiry | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-STATUS | Session Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-ACCESS-SESSION | AUD-SESSION-F-VERSION | Sensitive Access Session Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-REVIEW | AUD-REVIEW-F-ID | Review Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-REVIEW | AUD-REVIEW-F-EVENT-IDS | Related Audit Event IDs | STRING_ARRAY | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-REVIEW | AUD-REVIEW-F-REASON | Review Reason | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-REVIEW | AUD-REVIEW-F-RESOLUTION | Review Resolution | STRING | USER_INPUT | required before RESOLVED；状态=RESOLVED | EDITABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-REVIEW | AUD-REVIEW-F-STATUS | Review Case Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-ID | Shared-device Session ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-ACTOR-ID | Shared-device Session Actor ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-CLEANUP-SCOPES | Product-controlled Cleanup Scopes | STRING_ARRAY | OPTION_SET: OPT-GOV-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-START | Shared-device Session Start | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-END | Shared-device Session End | DATETIME | SYSTEM | required after product-controlled cleanup；状态=CLEANED | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-CLEANUP-TRIGGER | Cleanup Trigger | STRING | SYSTEM | required after product-controlled cleanup；状态=CLEANED | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-CLEANUP-RESULT | Product-controlled Cleanup Result | JSON | SYSTEM | required after product-controlled cleanup；状态=CLEANED | IMMUTABLE | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-STATUS | Shared-device Session Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AUD-001 | AUD-OBJ-SHARED-DEVICE-SESSION | AUD-SHARED-F-VERSION | Shared-device Session Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-ID | Curriculum Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-NAME | Curriculum Version Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-SUBJECT | Curriculum Subject | STRING | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-VERSION | Curriculum Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-STATUS | Curriculum Version Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-VALIDATION | Version Validation Result | JSON | SYSTEM | required when the curriculum version reaches VALIDATED；状态=VALIDATED | READ_ONLY | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CURRICULUM | CURR-CURRICULUM-F-PUBLISHED-AT | Published At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-ID | Textbook Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-CURRICULUM-ID | Curriculum Version ID | STRING | SYSTEM | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-NAME | Textbook Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-EDITION | Textbook Edition | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-TEXTBOOK | CURR-TEXTBOOK-F-STATUS | Textbook Version Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CHAPTER | CURR-CHAPTER-F-ID | Chapter ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CHAPTER | CURR-CHAPTER-F-TEXTBOOK-ID | Textbook Version ID | STRING | SYSTEM | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CHAPTER | CURR-CHAPTER-F-TITLE | Chapter Title | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CHAPTER | CURR-CHAPTER-F-ORDER | Chapter Order | INTEGER | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-CHAPTER | CURR-CHAPTER-F-STATUS | Chapter Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-ID | Knowledge Point ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-NAME | Knowledge Point Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-DEFINITION | Knowledge Point Definition | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-PARENT-ID | Parent Knowledge Point ID | STRING | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-KNOWLEDGE-POINT | CURR-KP-F-STATUS | Knowledge Point Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-ID | Knowledge Mapping ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-CHAPTER-ID | Mapped Chapter ID | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-KP-ID | Mapped Knowledge Point ID | STRING | OPTION_SET: OPT-COM-011 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-RELATION | Mapping Relation | STRING | OPTION_SET: OPT-ENUM-043 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-VERSION | Mapping Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CURR-001 | CURR-OBJ-MAPPING | CURR-MAPPING-F-STATUS | Mapping Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-ID | Todo View Definition ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-TEACHER-ID | Teacher ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-SUBJECT-SCOPE | Subject Assignment Scope | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-SOURCE-REFS | External Todo Source References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-PROJECTION-SOURCE-REF | Todo Projection Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-PROJECTION-SOURCE-VERSION | Todo Projection Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TODO-VIEW | TEA-TODO-F-FILTER | Todo View Filter | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-ID | Coordination Item ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-CLASS-ID | Coordinated Class ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-SUBJECT-REFS | Referenced Subject Facts | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-TITLE | Coordination Title | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-NOTE | Coordination Note | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-COORDINATION | TEA-COORD-F-STATUS | Coordination Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-PREFERENCE | TEA-PREF-F-ID | Work Preference ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-PREFERENCE | TEA-PREF-F-TEACHER-ID | Preference Teacher ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-PREFERENCE | TEA-PREF-F-DEFAULT-VIEW | Default Workspace View | STRING | OPTION_SET: OPT-ENUM-046 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-PREFERENCE | TEA-PREF-F-FILTERS | Saved Workspace Filters | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-ID | Teaching Problem ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STUDENT-REF | Problem Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SUBJECT-ID | Problem Subject | ID | OPTION_SET: OPT-COM-007 | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-CLASS-ID | Problem Class | ID | OPTION_SET: OPT-COM-006 | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATEMENT | Teaching Problem Statement | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-SOURCE-REFS | Problem Evidence References | JSON | SYSTEM | 否 | READ_ONLY | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-AI-SUGGESTION-REF | AI Suggestion Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-RESPONSIBLE-TEACHER-REF | Responsible Teacher Reference | ID | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-PRIORITY | Problem Priority | STRING | OPTION_SET: OPT-ENUM-012 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-REVIEW-AT | Problem Review At | DATETIME | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-STATUS | Teaching Problem Status | STRING | OPTION_SET: OPT-V2-TL-009 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-RESOLUTION-EVIDENCE | Problem Resolution Evidence | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHING-PROBLEM | TEA-PROBLEM-F-MASTERY-STATUS | Mastery Status (not owned by action queue) | STRING | SYSTEM | 否 | READ_ONLY | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-ID | Teacher Judgment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-PROBLEM-REF | Judgment Problem Reference | ID | OBJECT_REF: TEA-OBJ-TEACHING-PROBLEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-TYPE | Teacher Judgment Type | STRING | OPTION_SET: OPT-V2-TL-010 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-RATIONALE | Teacher Judgment Rationale | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-ACTOR-REF | Judgment Actor Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-TEACHER-JUDGMENT | TEA-JUDGMENT-F-RECORDED-AT | Judgment Recorded At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-ID | Linked Teaching Action ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-PROBLEM-REF | Action Problem Reference | ID | OBJECT_REF: TEA-OBJ-TEACHING-PROBLEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-JUDGMENT-REF | Action Judgment Reference | ID | OBJECT_REF: TEA-OBJ-TEACHER-JUDGMENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-TITLE | Teaching Action Title | STRING | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-OWNER-REF | Teaching Action Owner | ID | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-DUE-AT | Teaching Action Due At | DATETIME | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-STATUS | Linked Teaching Action Status | STRING | OPTION_SET: OPT-V2-TL-011 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-COMPLETION-EVIDENCE | Teaching Action Completion Evidence | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-LINKED-TEACHING-ACTION | TEA-ACTION-F-OBSERVATION-RESULT | Teaching Action Observation Result | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-ID | Experience Resolution ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-ACTOR-ID | Current Actor ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-KIND | Experience Kind | STRING | OPTION_SET: OPT-BL2-001 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-DUTY-CONTEXT | Current Duty and Object Context | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-RESPONSIBILITY-DOMAINS | Resolved Responsibility Domains | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-RESOLVED-SURFACES | Resolved Cross-page Surfaces | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-FIXED-NAVIGATION-REQUIRED | Fixed Navigation Required | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-AGE-STAGE | Age Stage | STRING | OPTION_SET: OPT-BL2-002 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-SEMANTIC-IA-VERSION | Shared Semantic Information Architecture Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-AGE-ADAPTATION | Age-adapted Language Density and Interaction | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-KEYBOARD-OPERATION | Keyboard Operation Available | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-NON-VOICE-ALTERNATIVE | Non-voice Alternative Available | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-TEXT-SCALING | Text Scaling Available | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-VISIBLE-FOCUS | Visible Focus Available | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| TEA-001 | TEA-OBJ-EXPERIENCE-RESOLUTION | TEA-EXPERIENCE-F-VERSION | Experience Resolution Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-ID | School Activity Time Policy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-SCHOOL-REF | Policy School Reference | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-FORMAL-FULL-DURATION-MINUTES | Formal Assignment Full Answer Duration Minutes | INTEGER | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-EFFECTIVE-AT | Time Policy Effective At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-VERSION | School Activity Time Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-SCHOOL-TIME-POLICY | HW-TIME-POLICY-F-SAFETY-REASON | Policy Invalidation or Revocation Reason | TEXT | USER_INPUT | required when a policy version is invalidated or revoked；状态=INVALIDATED/REVOKED；动作=HW-ACT-INVALIDATE-SCHOOL-TIME-POLICY/HW-ACT-REVOKE-SCHOOL-TIME-POLICY | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-ID | Activity Help Rule ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-VERSION | Activity Help Rule Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-MODE | Activity Help Mode | STRING | OPTION_SET: OPT-V2-TL-021 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-RULES | Verifiable Allowed-help Rules | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-DIGEST | Help Rule Content Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-HELP-RULE | HW-HELP-RULE-F-PUBLISHED-AT | Help Rule Published At | DATETIME | SYSTEM | required when the help rule is published；状态=PUBLISHED；动作=HW-ACT-PUBLISH-HELP-RULE | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-ID | Publication Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-VERSION | Publication Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-ACTIVITY-REF | Published Activity Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-ACTIVITY-VERSION | Published Activity Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-ITEM-VERSION-MANIFEST | Published Item Identity and Version Manifest | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-ITEM-MANIFEST-DIGEST | Published Item Manifest Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-MATERIAL-RIGHTS-MANIFEST | Published Material and Rights Manifest | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-MATERIAL-RIGHTS-DIGEST | Published Material and Rights Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-REQUIREMENT-SNAPSHOT | Published Requirement Snapshot | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-REQUIREMENT-DIGEST | Published Requirement Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-PURPOSE | Published Primary Purpose | STRING | OPTION_SET: OPT-V2-TL-001 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-PURPOSE-DIGEST | Published Purpose Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-HELP-RULE-REF | Published Help Rule Reference | ID | OBJECT_REF: HW-OBJ-HELP-RULE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-HELP-RULE-VERSION | Published Help Rule Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-HELP-RULE-DIGEST | Published Help Rule Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-SNAPSHOT-HASH | Complete Publication Snapshot Hash | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-PUBLICATION-SNAPSHOT | HW-SNAPSHOT-F-SEALED-AT | Publication Snapshot Sealed At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ID | Assignment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-TITLE | Assignment Title | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-INSTRUCTIONS | Assignment Instructions | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-SUBJECT-ID | Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-COURSE-ID | Course | ID | OPTION_SET: OPT-COM-008 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-CLASS-SCOPE-IDS | Class Scope | STRING_ARRAY | OPTION_SET: OPT-COM-006 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-STUDENT-FANOUT-IDS | Published Student Fanout Set | STRING_ARRAY | SYSTEM | required when the assignment reaches PUBLISHED；状态=PUBLISHED | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-OPEN-AT | Open Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DUE-AT | Due Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-LATE-POLICY | Late Policy | STRING | OPTION_SET: OPT-ENUM-032 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-RESUBMISSION-POLICY | Resubmission Policy | STRING | OPTION_SET: OPT-ENUM-033 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ASSIGNMENT-TYPE | Assignment Type | STRING | OPTION_SET: OPT-ENUM-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PURPOSE | Activity Primary Purpose | STRING | OPTION_SET: OPT-V2-TL-001 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-HELP-RULE-REF | Activity Help Rule Reference | ID | OBJECT_REF: HW-OBJ-HELP-RULE | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-HELP-RULE-VERSION | Activity Help Rule Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ANSWER-OPEN-POLICY | Complete Answer Open Policy | STRING | OPTION_SET: OPT-V2-TL-022 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DIAGNOSTIC-USE | Diagnostic Activity Use | STRING | OPTION_SET: OPT-V2-TL-023 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-REF | School Activity Time Policy Reference | ID | OBJECT_REF: HW-OBJ-SCHOOL-TIME-POLICY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-SCHOOL-TIME-POLICY-VERSION | School Activity Time Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-LATE-ENROLLEE-WINDOW-POLICY | Late Enrollee Window Policy | STRING | OPTION_SET: OPT-V2-TL-015 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-LATE-ENROLLEE-WINDOW-REASON | Diagnostic Late Enrollee Window Reason | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DIAGNOSTIC-INDEPENDENT-DURATION-MINUTES | Diagnostic Independent Window Duration Minutes | INTEGER | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-GOVERNANCE-STATUS | Activity Governance Status | STRING | OPTION_SET: OPT-V2-TL-002 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-OPEN-WINDOW-STATUS | Activity Open Window Status | STRING | OPTION_SET: OPT-V2-TL-003 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-ARCHIVE-STATUS | Activity Archive Status | STRING | OPTION_SET: OPT-V2-TL-004 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PARTICIPATION-STATUS | Activity Participation Status | STRING | OPTION_SET: OPT-V2-TL-005 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-TIME-STATUS | Activity Time Status | STRING | OPTION_SET: OPT-V2-TL-006 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-AI-PROCESSING-STATUS | Activity AI Processing Status | STRING | OPTION_SET: OPT-V2-TL-007 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-QUESTION-ORDER | Question Order | STRING | OPTION_SET: OPT-TL-001 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-RUBRIC-VERSION | Assignment Rubric Version | ID | RUNTIME_QUERY: QUERY-AUTHORIZED-RUBRIC-VERSIONS | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-KNOWLEDGE-POINT-IDS | Assignment Knowledge Points | STRING_ARRAY | OPTION_SET: OPT-COM-011 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-FEEDBACK-POLICY | Feedback Policy | STRING | OPTION_SET: OPT-ENUM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-NOTIFICATION-POLICY | Notification Policy | STRING | OPTION_SET: OPT-TL-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PUBLICATION-VERSION | Publication Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-REF | Sealed Publication Snapshot Reference | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | required before scheduling or publishing an activity；状态=SCHEDULED/PUBLISHED；动作=HW-ACT-PUBLISH-NOW/HW-ACT-SCHEDULE-PUBLISH/HW-ACT-PUBLISH-SCHEDULED/HW-ACT-PUBLISH-REPLACEMENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-PUBLICATION-SNAPSHOT-VERSION | Sealed Publication Snapshot Version | INTEGER | SYSTEM | required before scheduling or publishing an activity；状态=SCHEDULED/PUBLISHED；动作=HW-ACT-PUBLISH-NOW/HW-ACT-SCHEDULE-PUBLISH/HW-ACT-PUBLISH-SCHEDULED/HW-ACT-PUBLISH-REPLACEMENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-REPLACED-ACTIVITY-REF | Replaced Activity Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | required when creating a semantic replacement draft；状态=DRAFT；动作=HW-ACT-CREATE-REPLACEMENT-DRAFT | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-REPLACED-ACTIVITY-VERSION | Replaced Activity Version | INTEGER | SYSTEM | required when creating a semantic replacement draft；状态=DRAFT；动作=HW-ACT-CREATE-REPLACEMENT-DRAFT | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-CANCELLATION-KIND | Activity Cancellation Kind | STRING | OPTION_SET: OPT-V2-TL-013 | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-CANCELLATION-REASON | Activity Cancellation Reason | TEXT | USER_INPUT | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-UNSUBMITTED-HANDLING | Cancelled Activity Unsubmitted Handling | STRING | OPTION_SET: OPT-V2-TL-018 | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-EXISTING-EVIDENCE-DISPOSITION | Cancelled Activity Existing Evidence Disposition | STRING | OPTION_SET: OPT-V2-TL-019 | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-EVIDENCE-INVALIDATION-SCOPE | Cancelled Activity Evidence Invalidation Scope | JSON | SYSTEM | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-DOWNSTREAM-INVALIDATION-ACTIONS | Cancelled Activity Downstream Action Set | STRING_ARRAY | OPTION_SET: OPT-V2-TL-020 | required when an activity is cancelled；状态=CANCELLED；动作=HW-ACT-CANCEL-ADMINISTRATIVE/HW-ACT-CANCEL-CONTENT-RIGHT-ERROR/HW-ACT-CANCEL-FOR-REPLACEMENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-CORRECTION-KIND | Activity Correction Kind | STRING | OPTION_SET: OPT-V2-TL-014 | required when versioning an allowed same-identity correction；状态=REVISION_DRAFT；动作=HW-ACT-VERSION-NON-SEMANTIC-CORRECTION/HW-ACT-VERSION-ASSESSMENT-STANDARD-CORRECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-NON-SEMANTIC-CORRECTION-PATCH | Non-semantic Correction Patch | JSON | USER_INPUT | required only for a non-semantic correction；状态=REVISION_DRAFT；动作=HW-ACT-VERSION-NON-SEMANTIC-CORRECTION | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ASSIGNMENT | HW-ASSIGNMENT-F-REVISION-REASON | Revision Reason | TEXT | USER_INPUT | required when versioning an allowed same-identity correction；状态=REVISION_DRAFT；动作=HW-ACT-VERSION-NON-SEMANTIC-CORRECTION/HW-ACT-VERSION-ASSESSMENT-STANDARD-CORRECTION | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-ID | Assignment Item ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-ITEM-VERSION | Item Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-QUESTION-TYPE | Question Type | STRING | OPTION_SET: OPT-ENUM-003 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-ORDER | Item Order | INTEGER | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-PROMPT | Question Prompt | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-ANSWER-KEY | Answer Key | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-POINTS | Item Points | DECIMAL | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-RUBRIC-VERSION | Item Rubric Version | ID | RUNTIME_QUERY: QUERY-AUTHORIZED-RUBRIC-VERSIONS | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-RUBRIC-REF | Item Rubric Reference | ID | OBJECT_REF: HW-OBJ-RUBRIC | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-ITEM | HW-ITEM-F-KNOWLEDGE-POINT-IDS | Item Knowledge Points | STRING_ARRAY | OPTION_SET: OPT-COM-011 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-RUBRIC | HW-RUBRIC-F-ID | Rubric ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-RUBRIC | HW-RUBRIC-F-RUBRIC-VERSION | Rubric Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-RUBRIC | HW-RUBRIC-F-SOURCE-REF | Rubric Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-RUBRIC | HW-RUBRIC-F-SOURCE-VERSION | Rubric Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-RUBRIC | HW-RUBRIC-F-CRITERIA | Rubric Criteria | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-ID | Student Activity Window ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-ACTIVITY-REF | Window Activity Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-ACTIVITY-VERSION | Window Activity Publication Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-PUBLICATION-SNAPSHOT-REF | Window Publication Snapshot Reference | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-PUBLICATION-SNAPSHOT-VERSION | Window Publication Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-STUDENT-REF | Late Enrollee Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-SCHOOL-POLICY-REF | Applied School Time Policy Reference | ID | OBJECT_REF: HW-OBJ-SCHOOL-TIME-POLICY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-SCHOOL-POLICY-VERSION | Applied School Time Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-POLICY | Applied Late Enrollee Window Policy | STRING | OPTION_SET: OPT-V2-TL-015 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-START-AT | Student Window Start At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-DUE-AT | Student Window Due At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-REASON | Applied Diagnostic Window Reason | TEXT | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-PARTICIPATION-STATUS | Per-student Activity Participation Status | STRING | OPTION_SET: OPT-V2-TL-005 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-TIME-STATUS | Per-student Activity Time Status | STRING | OPTION_SET: OPT-V2-TL-006 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| HW-001 | HW-OBJ-STUDENT-ACTIVITY-WINDOW | HW-STUDENT-WINDOW-F-VERSION | Student Activity Window Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-ID | Submission Draft ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-ASSIGNMENT-REF | Draft Assignment Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-ANSWER-PAYLOAD | Answer Payload by Question Type | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-IMAGE-REFS | Original Image References | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-FILE-REFS | Original File References | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-AUDIO-REFS | Original Audio References | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-EXPLANATION | Student Original Explanation | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-MEDIA-METADATA | Media Metadata | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-PAGE-ITEM-MAPPING | Page and Item Mapping | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-IMAGE-QUALITY | Image Quality | STRING | OPTION_SET: OPT-ENUM-027 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-UPLOAD-SESSION-ID | Upload Session | ID | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-PENDING-CHUNK | Pending Upload Chunk | FILE_REFERENCE | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-SUCCESSFUL-CHUNKS | Successful Upload Chunks | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-DRAFT-VERSION | Draft Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-WEAK-NETWORK-CHECKPOINT | Weak Network Recovery Checkpoint | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-DRAFT | SUB-DRAFT-F-ASSIGNMENT-VERSION | Assignment Publication Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ID | Submission Attempt ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ASSIGNMENT-REF | Submitted Assignment Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ASSIGNMENT-VERSION | Submitted Assignment Publication Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-REF | Submitted Activity Publication Snapshot | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-PUBLICATION-SNAPSHOT-VERSION | Submitted Activity Publication Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-DRAFT-REF | Accepted Draft Reference | ID | OBJECT_REF: SUB-OBJ-DRAFT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-DRAFT-VERSION | Submitted Draft Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RAW-ANSWER-PAYLOAD | Immutable Original Answer Payload | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RAW-IMAGE-REFS | Immutable Original Image References | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RAW-FILE-REFS | Immutable Original File References | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RAW-AUDIO-REFS | Immutable Original Audio References | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RAW-EXPLANATION | Immutable Student Original Explanation | TEXT | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-CONTENT-MANIFEST | Accepted Original Content Manifest | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-CONTENT-DIGEST | Accepted Original Content Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-CONTENT-TRUST-CLASS | Uploaded Content Trust Class | STRING | OPTION_SET: OPT-V2-TL-016 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ALLOWED-HELP | Allowed Help Rules at Submission | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-OBSERVED-HELP | System-observed Help Evidence | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-DECLARED-EXTERNAL-HELP | Student or Guardian Declared External Help | JSON | USER_INPUT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-UNKNOWN-HELP-CONDITIONS | Unknown Help Conditions Present | BOOLEAN | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-ACCEPTED-AT | Submission Accepted At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-SUBMISSION-VERSION | Submission Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-LATE-FLAG | Late Submission Flag | BOOLEAN | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-TIMELINESS-SOURCE | Submission Timeliness Source | STRING | OPTION_SET: OPT-V2-TL-024 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-TIMELINESS-EVALUATED-AT | Submission Timeliness Evaluated At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RESUBMISSION-OF | Resubmission Relationship | ID | OBJECT_REF: SUB-OBJ-ATTEMPT | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=SUB-ACT-RESUBMIT | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RESUBMISSION-OF-VERSION | Prior Submission Version | INTEGER | SYSTEM | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=SUB-ACT-RESUBMIT | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ID | Submission Receipt | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-RECEIPT-ISSUED-AT | Receipt Issued Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-INTENT-CREDENTIAL-REF | Protected Timeliness Intent Credential | ID | OBJECT_REF: SUB-OBJ-INTENT-CREDENTIAL | required only for a protected weak-network submission acceptance；状态=SUBMITTED；动作=SUB-ACT-SUBMIT-PROTECTED | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-ATTEMPT | SUB-ATTEMPT-F-INTENT-CREDENTIAL-VERSION | Protected Timeliness Intent Credential Version | INTEGER | SYSTEM | required only for a protected weak-network submission acceptance；状态=SUBMITTED；动作=SUB-ACT-SUBMIT-PROTECTED | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-ID | Platform Failure Incident Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-SCHOOL-ID | Affected School ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-SERVICE-CODE | Failed Platform Service Code | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-STARTED-AT | Incident Started At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-ENDED-AT | Incident Ended At | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-AFFECTED-SCOPE | Versioned Affected School and Service Scope | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-SCOPE-DIGEST | Canonical Incident Scope Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-DETECTION-EVIDENCE | Independent Platform Detection Evidence | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-STATUS | Platform Failure Incident Snapshot Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | SUB-PFINCIDENT-F-VERSION | Platform Failure Incident Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-ID | Intent Credential ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-ACTOR-REF | Credential Actor Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-ACTIVITY-REF | Credential Activity Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-ACTIVITY-VERSION | Credential Activity Publication Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PUBLICATION-SNAPSHOT-REF | Credential Activity Publication Snapshot | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PUBLICATION-SNAPSHOT-VERSION | Credential Activity Publication Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-SUBMISSION-VERSION | Credential Submission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-REF | Pinned Platform Failure Incident Snapshot | ID | OBJECT_REF: SUB-OBJ-PLATFORM-FAILURE-INCIDENT-SNAPSHOT | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-INCIDENT-VERSION | Pinned Platform Failure Incident Version | INTEGER | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-VERSION | Intent Credential Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-ISSUED-AT | Credential Issued At | DATETIME | SYSTEM | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-CONTENT-MANIFEST | Fixed Content Manifest | JSON | SYSTEM | required for a normal intent credential or platform-failure protection；状态=ISSUED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-MANIFEST-DIGEST | Fixed Content Manifest Digest | STRING | SYSTEM | required for a normal intent credential or platform-failure protection；状态=ISSUED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-EXPIRES-AT | Credential Expiry | DATETIME | SYSTEM | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-COMPLETION-WINDOW | Credential Completion Window | JSON | SYSTEM | required for an issued protected-timeliness credential；状态=ISSUED；动作=SUB-ACT-ISSUE-INTENT-CREDENTIAL | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-PROTECTED-AT | Platform Failure Timeliness Anchor | DATETIME | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-SCOPE | Exact Platform Failure Protection Scope | JSON | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-SCOPE-DIGEST | Canonical Platform Failure Protection Scope Digest | STRING | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-PROTECTION-EXPIRES-AT | Platform Failure Protection Completion Deadline | DATETIME | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-PLATFORM-FAILURE-SOURCE-ATTESTATION | Platform Failure Source Attestation | JSON | SYSTEM | required only for a platform-failure-protected credential；状态=PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-STATUS | Intent Credential Status | STRING | OPTION_SET: OPT-V2-TL-008 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INTENT-CREDENTIAL | SUB-INTENT-F-COMPLETED-MANIFEST-DIGEST | Completed Manifest Digest | STRING | SYSTEM | required after normal manifest completion or when platform failure protection freezes the failed request manifest；状态=COMPLETED/PLATFORM_FAILURE_PROTECTED；动作=SUB-ACT-COMPLETE-MANIFEST-INTENT/SUB-ACT-RECORD-PLATFORM-FAILURE-PROTECTION | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-ID | Input Quality Fact ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-ATTEMPT-REF | Quality Source Submission Reference | ID | OBJECT_REF: SUB-OBJ-ATTEMPT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-ATTEMPT-VERSION | Quality Source Submission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-BLUR | Blur Quality Fact | STRING | OPTION_SET: OPT-V2-TL-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-GLARE | Glare Quality Fact | STRING | OPTION_SET: OPT-V2-TL-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-CROP | Crop Quality Fact | STRING | OPTION_SET: OPT-V2-TL-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-MISSING-PAGE | Missing Page Quality Fact | STRING | OPTION_SET: OPT-V2-TL-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-SEQUENCE | Page Sequence Quality Fact | STRING | OPTION_SET: OPT-V2-TL-017 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-RECORDED-AT | Input Quality Recorded At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SUB-001 | SUB-OBJ-INPUT-QUALITY | SUB-QUALITY-F-VERSION | Input Quality Fact Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-ID | Capability Rule ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RULE-VERSION | Capability Rule Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-REF | Capability Rule Source Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SOURCE-VERSION | Capability Rule Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBJECT-FAMILY | Subject Family | STRING | OPTION_SET: OPT-TL-003 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-QUESTION-TYPE | Question Type | STRING | OPTION_SET: OPT-ENUM-003 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SUBMISSION-METHOD | Submission Method | STRING | OPTION_SET: OPT-ENUM-031 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-RECOGNITION-LEVEL | Recognition Level | STRING | OPTION_SET: OPT-TL-004 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-SCORING-LEVEL | Scoring Level | STRING | OPTION_SET: OPT-TL-005 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-REQUIRED-EVIDENCE | Required Evidence | STRING_ARRAY | OPTION_SET: OPT-TL-006 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-TEACHER-REVIEW | Professional Exception Review Requirement | STRING | OPTION_SET: OPT-ENUM-001 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-BATCH-CONFIRM | Automated Batch Determination Eligibility | STRING | OPTION_SET: OPT-TL-007 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-CAPABILITY-RULE | GRD-CAP-F-UNAVAILABLE-FALLBACK | Unable-to-determine Recovery Route | STRING | OPTION_SET: OPT-TL-008 | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ID | AI Assessment Result ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-ANSWER | Recognized Answer | TEXT | SYSTEM | required when AI assessment processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-RECOGNIZED-REGION | Recognized Region | TEXT | SYSTEM | required when AI assessment processing produces recognition evidence；状态=PROCESSING；动作=GRD-ACT-PROCESS | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-REF | Input Submission Reference | ID | OBJECT_REF: SUB-OBJ-ATTEMPT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-SUBMISSION-VERSION | Input Submission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-REF | Input Item Reference | ID | OBJECT_REF: HW-OBJ-ITEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ITEM-VERSION | Input Item Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-REF | Frozen Assessment Standard Reference | ID | OBJECT_REF: GRD-OBJ-ASSESSMENT-STANDARD-VERSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-RUBRIC-VERSION | Frozen Assessment Standard Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-REF | Capability Rule Reference | ID | OBJECT_REF: GRD-OBJ-CAPABILITY-RULE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CAPABILITY-RULE-VERSION | Capability Rule Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-SUGGESTED-SCORE | Suggested Score | DECIMAL | SYSTEM | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-SCORING-RATIONALE | Scoring Rationale | TEXT | SYSTEM | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CONFIDENCE | Confidence Status | STRING | OPTION_SET: OPT-ENUM-005 | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-LIMITATION | Limitation Note | TEXT | SYSTEM | required when AI assessment processing produces a scoring suggestion；状态=PROCESSING；动作=GRD-ACT-PROCESS | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-OFFICIAL-SCORE | Effective Activity Score or Level (optional) | DECIMAL | USER_INPUT | required when the AI assessment result reaches EXCEPTION_RESOLVED；状态=EXCEPTION_RESOLVED | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-TEACHER-FEEDBACK | Professional Exception Feedback (exception only) | TEXT | USER_INPUT | required when the AI assessment result reaches EXCEPTION_RESOLVED；状态=EXCEPTION_RESOLVED | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CORRECTION-REASON | Evidence-backed Correction or Exception Reason | STRING | OPTION_SET: OPT-ENUM-006 | required when correcting recognition, overriding a score, or revising a confirmed decision；状态=AI_DETERMINED/EXCEPTION_RESOLVED/CORRECTION_PENDING/QUEUED；动作=GRD-ACT-CORRECT-RECOGNITION/GRD-ACT-OVERRIDE-SCORE/GRD-ACT-OPEN-CONFIRMED-REVISION/GRD-ACT-CONFIRM-REVISION/GRD-ACT-RESOLVE-VERSION-CONFLICT | EDITABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-DECISION-VERSION | Decision Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-PRIOR-DECISION-VERSION | Prior Effective Assessment Result Version | INTEGER | SYSTEM | required when revising a confirmed decision；状态=CORRECTION_PENDING；动作=GRD-ACT-OPEN-CONFIRMED-REVISION | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ROUTE | AI Assessment Route | STRING | OPTION_SET: OPT-TL-011 | required when the AI assessment result reaches AI_DETERMINED or EXCEPTION_REVIEW_REQUIRED；状态=AI_DETERMINED/EXCEPTION_REVIEW_REQUIRED | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | required whenever the queued decision is processed by the second-stage AI assessment service；状态=PROCESSING；动作=GRD-ACT-PROCESS | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | SYSTEM | required with the exact school phase-two entitlement used for AI assessment；状态=PROCESSING；动作=GRD-ACT-PROCESS | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-PROCESSING-STATUS | AI Assessment Processing Status | STRING | OPTION_SET: OPT-AI2-001 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-NEXT-STEP | Explicit Completion-determination Next Step | STRING | OPTION_SET: OPT-AI2-005 | required for every determined, unable-to-determine, or professionally resolved assessment result；状态=AI_DETERMINED/EXCEPTION_REVIEW_REQUIRED/EXCEPTION_RESOLVED；动作=GRD-ACT-ROUTE/GRD-ACT-ROUTE-UNSUPPORTED/GRD-ACT-ROUTE-AI-UNAVAILABLE/GRD-ACT-ACCEPT-SUGGESTION/GRD-ACT-OVERRIDE-SCORE/GRD-ACT-MANUAL-GRADE/GRD-ACT-BATCH-CONFIRM/GRD-ACT-CONFIRM-REVISION | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-REF | Initial Attempt Classification Reference | ID | OBJECT_REF: GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-INITIAL-ATTEMPT-CLASSIFICATION-VERSION | Initial Attempt Classification Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-DERIVATION-VALIDITY-STATUS | Assessment Derivation Validity | STRING | OPTION_SET: OPT-AI2-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-DERIVATION-DISPUTE-STATUS | Assessment Derivation Dispute Status | STRING | OPTION_SET: OPT-AI2-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-PRIOR-DECISION-REF | Prior Assessment Decision Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | required when revising a confirmed decision；状态=CORRECTION_PENDING；动作=GRD-ACT-OPEN-CONFIRMED-REVISION | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ACTIVITY-SNAPSHOT-REF | Published Activity Snapshot Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-ACTIVITY-SNAPSHOT-VERSION | Published Activity Snapshot Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-HELP-ENVIRONMENT | Actual Help Environment | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-INPUT-QUALITY | Input and Recognition Quality | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-EVIDENCE-REFS | Verifiable Evidence References | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-CONCLUSION | AI Assessment Conclusion | TEXT | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-FEEDBACK-REF | Versioned Feedback Reference | ID | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-DECISION-F-NEXT-ACTION | Concrete Next Action | TEXT | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-BUSINESS-TASK-ID | AI Business Task ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-EXTERNAL-REFERENCE | External Processing Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-MODEL-VERSION | Model Version | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-CAPABILITY-VERSION | AI Capability Version | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-RULE-VERSION | Assessment Rule Version | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-SAFETY-VERSION | Safety Policy Version | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-EVIDENCE-REFERENCES | Trace Evidence References | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-RESULT-REFERENCE | Trace Result Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-DECISION | GRD-TRACE-F-GATE-OUTCOMES | Trace Gate Outcomes | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-ID | Assessment Standard Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-VERSION | Assessment Standard Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-ACTIVITY-SNAPSHOT-REF | Published Activity Snapshot Reference | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-ACTIVITY-SNAPSHOT-VERSION | Published Activity Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-ANSWER-OR-DIMENSIONS | Standard Answer or Evaluation Dimensions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-KEY-POINTS | Key Scoring or Evaluation Points | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-ACCEPTABLE-ANSWERS | Acceptable Answers and Variants | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-COMMON-ERRORS | Common Error Patterns | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-SCORE-OR-LEVEL-RULE | Optional Score, Level, or Feedback-only Rule | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-COMPLETION-THRESHOLD | Completion Threshold | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-HELP-BOUNDARY | Permitted Help Boundary | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-ASSESSMENT-STANDARD-VERSION | GRD-STANDARD-F-FROZEN-AT | Assessment Standard Frozen At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-ID | Initial Attempt Classification ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-SUBMISSION-REF | Source Submission Reference | ID | OBJECT_REF: SUB-OBJ-ATTEMPT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-SUBMISSION-VERSION | Source Submission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-CLASSIFICATION | Initial Attempt Classification | STRING | OPTION_SET: OPT-AI2-008 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-EVIDENCE | Classification Evidence | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-VALIDITY-STATUS | Classification Validity Status | STRING | OPTION_SET: OPT-AI2-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-DISPUTE-CORRECTION-STATUS | Classification Dispute and Correction Status | STRING | OPTION_SET: OPT-AI2-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-REF | Prior Classification Reference | ID | OBJECT_REF: GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-PRIOR-CLASSIFICATION-VERSION | Prior Classification Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-SUPERSESSION-REASON | Classification Supersession Reason | TEXT | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| GRD-001 | GRD-OBJ-INITIAL-ATTEMPT-CLASSIFICATION | GRD-ATTEMPT-CLASS-F-VERSION | Initial Attempt Classification Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-ID | Publication Batch ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-SELECTED-STUDENT-IDS | Selected Student Scope | STRING_ARRAY | OPTION_SET: OPT-COM-010 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-VISIBILITY-POLICY | Result Visibility Policy | STRING | OPTION_SET: OPT-ENUM-040 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-ANSWER-VISIBLE-AT | Configured Answer Visible Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-FEEDBACK-VISIBLE-AT | Configured Feedback Visible Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-NOTIFICATION-POLICY | Result Notification Policy | STRING | OPTION_SET: OPT-TL-012 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-BATCH-VERSION | Publication Batch Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-STUDENT-SCOPE-SNAPSHOT | Immutable Selected Student Scope | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-OBJECT-RESULTS | Student-level Publication Results | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-BATCH | PUB-BATCH-F-STATUS | Publication Batch Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ID | Publication Preview ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-BATCH-REF | Publication Batch Reference | ID | OBJECT_REF: PUB-OBJ-BATCH | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-STUDENT-REF | Selected Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-DECISION-REF | Confirmed Decision Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ELIGIBILITY | Preview Publication Eligibility | STRING | OPTION_SET: OPT-TL-009 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-BLOCKING-CODES | Preview Publication Blocking Codes | STRING_ARRAY | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-ANSWER-VISIBLE-AT | Resolved Answer Visible Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-FEEDBACK-VISIBLE-AT | Resolved Feedback Visible Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-PREVIEW | PUB-PREVIEW-F-NOTIFICATION-PREVIEW | Resolved Notification Preview | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ID | Published Result ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-STUDENT-REF | Selected Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-SOURCE-DECISION-REF | Source Decision Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-DECISION-VERSION | Confirmed Decision Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-DECISION-REF | Correction Decision Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-NEW-DECISION-VERSION | New Confirmed Decision Version | INTEGER | SYSTEM | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER | Published Answer | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-SCORE | Published Score | DECIMAL | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK | Published Feedback | TEXT | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ELIGIBILITY | Publication Eligibility | STRING | OPTION_SET: OPT-TL-009 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-BLOCKING-CODES | Publication Blocking Codes | STRING_ARRAY | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-VISIBLE-AT | Answer Visible Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-SCORE-VISIBLE-AT | Score Visible Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-VISIBLE-AT | Feedback Visible Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-RESULT-VERSION | Result Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-CORRECTION-VERSION | Correction Version | INTEGER | SYSTEM | required only for the declared version-preserving batch correction writer；状态=INVALIDATED；动作=PUB-ACT-CORRECT-RESULT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-INVALIDATION-VERSION | Dependent Invalidation Version | INTEGER | SYSTEM | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-PUBLIC-CORRECTION-NOTE | Public Correction Note | TEXT | USER_INPUT | required when a published result is corrected；状态=INVALIDATED | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-NOTIFICATION-STATUS | Notification Status | STRING | OPTION_SET: OPT-TL-010 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-DOWNSTREAM-INVALIDATIONS | Downstream Invalidation Records | JSON | SYSTEM | required only for the declared version-preserving batch correction writer；状态=INVALIDATED/PUBLISHED；动作=PUB-ACT-CORRECT-RESULT/PUB-ACT-RECONFIRM-INVALIDATED-EXPLANATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-PUBLICATION-STATUS | AI Result Publication Status | STRING | OPTION_SET: OPT-AI2-002 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-DISPUTE-CORRECTION-STATUS | AI Result Dispute and Correction Status | STRING | OPTION_SET: OPT-AI2-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-VALIDITY-STATUS | AI Result Validity Status | STRING | OPTION_SET: OPT-AI2-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-PERMISSION-GATE | Permission and Input-isolation Gate | STRING | OPTION_SET: OPT-AI2-006 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-SAFETY-GATE | Safety Gate | STRING | OPTION_SET: OPT-AI2-006 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-TEACHING-CORRECTNESS-GATE | Teaching Correctness Gate | STRING | OPTION_SET: OPT-AI2-006 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-1 | Feedback Layer 1: Result and Error Location | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-2 | Feedback Layer 2: Non-answer Scaffold | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-3 | Feedback Layer 3: Targeted Teaching | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-FEEDBACK-LAYER-4 | Feedback Layer 4: Complete Answer and Solution | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ASSESSMENT-STANDARD-CONTENT | Opened Assessment Standard Content | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-AT | Complete Answer Open Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-SOLUTION-OPEN-AT | Complete Solution Open Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-RUBRIC-OPEN-AT | Assessment Standard Open Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-POLICY-ID | Answer-open Policy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-ANSWER-OPEN-POLICY-VERSION | Answer-open Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-PRIOR-RESULT-REF | Prior Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-PRIOR-RESULT-VERSION | Prior Result Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-CHALLENGE-REF | Assessment Challenge Reference | ID | OBJECT_REF: PUB-OBJ-RESULT-CHALLENGE | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-CHALLENGE-VERSION | Assessment Challenge Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-RESOLUTION-KIND | Assessment Challenge Resolution Kind | STRING | OPTION_SET: OPT-AI2-010 | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT | PUB-RESULT-F-RESOLUTION-EVIDENCE-REFS | Resolution Evidence References | STRING_ARRAY | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-DEPENDENCY-SNAPSHOT | PUB-DEPENDENCY-SNAPSHOT-F-ID | Dependency Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-DEPENDENCY-SNAPSHOT | PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-REF | Dependency Snapshot Source Result | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-DEPENDENCY-SNAPSHOT | PUB-DEPENDENCY-SNAPSHOT-F-SOURCE-RESULT-VERSION | Dependency Snapshot Source Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-DEPENDENCY-SNAPSHOT | PUB-DEPENDENCY-SNAPSHOT-F-DEPENDENCY-SET | Resolved Dependency Set | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-DEPENDENCY-SNAPSHOT | PUB-DEPENDENCY-SNAPSHOT-F-SNAPSHOT-VERSION | Dependency Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-ID | Assessment Challenge ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-REF | Challenged Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESULT-VERSION | Challenged Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-REASON | Student Challenge Reason | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STUDENT-EVIDENCE-REFS | Student Challenge Evidence References | STRING_ARRAY | USER_INPUT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-PROFESSIONAL-EVIDENCE-REFS | Professional Resolution Evidence References | STRING_ARRAY | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-RESOLUTION | Assessment Challenge Resolution | STRING | OPTION_SET: OPT-AI2-010 | required when a challenge reaches RESOLVED；状态=RESOLVED；动作=PUB-ACT-CLOSE-RESULT-CHALLENGE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-STATUS | Assessment Challenge Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PUB-001 | PUB-OBJ-RESULT-CHALLENGE | PUB-CHALLENGE-F-VERSION | Assessment Challenge Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-ID | Gradebook View ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-STUDENT-REF | Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-DATA-ID | Source Result Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-REF | Source Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-RESULT-VERSION | Source Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-REF | Source Evidence Reference | ID | OBJECT_REF: INS-OBJ-EVIDENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-DATA-ID | Source Plan Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-REF | Source Plan Reference | ID | OBJECT_REF: PLN-OBJ-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-PLAN-VERSION | Source Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-QUERY-DEFINITION | Gradebook Query Definition | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-COLUMN-DEFINITION | Gradebook Column Definition | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-SAVED-VIEW-DEFINITION | Saved Gradebook View Definition | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-VIEW | SCO-VIEW-F-VIEW-VERSION | Gradebook View Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-ID | Gradebook Follow-up ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VIEW-REF | Gradebook View Reference | ID | OBJECT_REF: SCO-OBJ-VIEW | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VIEW-VERSION | Gradebook View Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-ATTENTION-KIND | Attention Event Kind | STRING | OPTION_SET: OPT-V2-CLS-005 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-NOTE | Follow-up Note | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCO-001 | SCO-OBJ-FOLLOW-UP | SCO-FOLLOW-UP-F-VERSION | Follow-up Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-ID | Student Todo Aggregation ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-STUDENT-REF | Todo Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-SOURCE-ASSIGNMENT-REF | Source Assignment Reference | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | required when the todo links to homework；状态=READY；动作=APP-ACT-CREATE-HOMEWORK-TODO | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-SOURCE-ASSIGNMENT-VERSION | Source Assignment Version | INTEGER | SYSTEM | required when the todo links to homework；状态=READY；动作=APP-ACT-CREATE-HOMEWORK-TODO | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-TASK-DEEP-LINK | Task Deep Link | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-LOCAL-PROGRESS | Student Local Progress | JSON | USER_INPUT | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | EDITABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-COMPLETION-EVIDENCE | Student Completion Evidence | JSON | USER_INPUT | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | EDITABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-DIFFICULTY-FEEDBACK | Student Difficulty Feedback | TEXT | USER_INPUT | required when the student records local todo execution state；状态=READY；动作=APP-ACT-UPDATE-LOCAL-PROGRESS | EDITABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-STUDENT-VISIBLE-AT | Todo Student Visible At | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-TODO | APP-TODO-F-AGGREGATION-VERSION | Todo Aggregation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-ID | Student Home Projection ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-STUDENT-REF | Home Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-SCHOOL-REQUIRED-REFS | School-required Activity References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-STUDENT-PENDING-REFS | Student-pending Action References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-SYSTEM-PROCESSING-REFS | System-processing References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-PERSONAL-OPTIONAL-REFS | Personal Optional Learning References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-COMPLETION-FACT-REFS | Source-owned Completion Fact References | JSON | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| APP-001 | APP-OBJ-STUDENT-HOME | APP-HOME-F-AGGREGATION-VERSION | Student Home Aggregation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-ID | Correction Task ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-STUDENT-REF | Correction Task Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-SOURCE-DATA-ID | Correction Task Source Result Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-SOURCE-RESULT-REF | Correction Task Source Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-SOURCE-RESULT-VERSION | Correction Task Source Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-DUE-AT | Correction Task Due Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-OVERDUE-HANDLING | Correction Task Overdue Handling | TEXT | SYSTEM | required when the correction task reaches OVERDUE；状态=OVERDUE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-TASK | CORR-TASK-F-TASK-VERSION | Correction Task Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-ID | Correction Attempt ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-STUDENT-REF | Correction Attempt Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TASK-REF | Correction Task Reference | ID | OBJECT_REF: CORR-OBJ-TASK | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TASK-VERSION | Correction Task Version at Submission | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-PRIOR-ATTEMPT-REF | Prior Correction Attempt Reference | ID | OBJECT_REF: CORR-OBJ-ATTEMPT | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=CORR-ACT-RESUBMIT | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-PRIOR-ATTEMPT-VERSION | Prior Correction Attempt Version | INTEGER | SYSTEM | required for a resubmission and absent for the first accepted submission；状态=SUBMITTED；动作=CORR-ACT-RESUBMIT | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-CORRECTION-ANSWER | Student Correction Answer | JSON | USER_INPUT | required when the correction reaches SUBMITTED；状态=SUBMITTED | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TEACHER-JUDGMENT | Professional Exception Resolution (exception only) | STRING | OPTION_SET: OPT-ENUM-028 | required when the correction reaches JUDGED or NEEDS_RETRY；状态=JUDGED/NEEDS_RETRY | EDITABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-TEACHER-CONFIRMER-REF | Authorized Professional Exception Resolver | ID | OBJECT_REF: ORG-OBJ-TEACHER | required when the correction reaches JUDGED or NEEDS_RETRY；状态=JUDGED/NEEDS_RETRY | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-REPEATED-CORRECTION-COUNT | Repeated Correction Count | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-OVERDUE-HANDLING | Correction Overdue Handling | TEXT | SYSTEM | required when an overdue correction is submitted；状态=SUBMITTED；动作=CORR-ACT-SUBMIT-LATE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT | CORR-ATTEMPT-F-CORRECTION-VERSION | Correction Attempt Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-ID | Correction Invalidation Record ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-SOURCE-DATA-ID | Invalidated Source Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-SOURCE-RESULT-REF | Invalidated Source Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-SOURCE-RESULT-VERSION | Invalidated Source Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-SOURCE-DECISION-REF | Invalidated Source Decision Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-SOURCE-DECISION-VERSION | Invalidated Source Decision Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-TARGET-KINDS | Invalidation Target Kinds | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-TARGET-TRANSITIONS | Per-target Invalidation Transitions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-TARGET-VERSIONS | Invalidation Target Versions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-TARGET-OUTCOMES | Per-target Invalidation Outcomes | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-HISTORY-PRESERVATION | Invalidation History Preservation | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-INVALIDATION | CORR-INVALIDATION-F-INVALIDATION-VERSION | Invalidation Record Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-ID | Correction Attempt Assessment ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SOURCE-ATTEMPT-REF | Source Correction Attempt Reference | ID | OBJECT_REF: CORR-OBJ-ATTEMPT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SOURCE-ATTEMPT-VERSION | Source Correction Attempt Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VALID-ATTEMPT | Correction Attempt Classification | STRING | OPTION_SET: OPT-AI2-008 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-NEXT-STEP | Correction AI Assessment Next Step | STRING | OPTION_SET: OPT-AI2-005 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-ANSWER-EXPOSURE | Answer Exposure Condition | STRING | OPTION_SET: OPT-AI2-009 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-EVIDENCE-KIND | Correction Evidence Kind | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VALIDITY-STATUS | Correction Assessment Validity Status | STRING | OPTION_SET: OPT-AI2-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-DISPUTE-CORRECTION-STATUS | Correction Assessment Dispute and Correction Status | STRING | OPTION_SET: OPT-AI2-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-REF | Prior Correction Assessment Reference | ID | OBJECT_REF: CORR-OBJ-ATTEMPT-ASSESSMENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-PRIOR-ASSESSMENT-VERSION | Prior Correction Assessment Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-SUPERSESSION-REASON | Correction Assessment Supersession Reason | TEXT | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CORR-001 | CORR-OBJ-ATTEMPT-ASSESSMENT | CORR-ASSESSMENT-F-VERSION | Correction Attempt Assessment Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-ID | Student Management Profile View ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-STUDENT-REF | Managed Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-DATA-ID | Source Result Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-REF | Source Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-RESULT-VERSION | Source Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-DATA-ID | Source Evidence Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-REF | Source Evidence Reference | ID | OBJECT_REF: INS-OBJ-EVIDENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-EVIDENCE-VERSION | Source Evidence Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-DATA-ID | Source Plan Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-REF | Source Plan Reference | ID | OBJECT_REF: PLN-OBJ-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-PLAN-VERSION | Source Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-QUERY-DEFINITION | Student Profile Query Definition | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-COLUMN-DEFINITION | Student Profile Column Definition | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-SAVED-VIEW-DEFINITION | Saved Student Profile View Definition | JSON | USER_INPUT | required when a teacher saves a custom profile view；状态=READY；动作=STU-ACT-SAVE-VIEW | EDITABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-PROFILE | STU-PROFILE-F-PROFILE-VERSION | Student Profile View Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-ID | Student Attention Record ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-PROFILE-REF | Student Profile View Reference | ID | OBJECT_REF: STU-OBJ-PROFILE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-PROFILE-VERSION | Student Profile View Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-KIND | Student Attention Event Kind | STRING | OPTION_SET: OPT-V2-CLS-005 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-FOLLOW-UP-NOTE | Student Attention Follow-up Note | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| STU-001 | STU-OBJ-ATTENTION | STU-ATTENTION-F-VERSION | Student Attention Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ID | AI Task Preview ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-TASK-ID | Registered AI Task ID | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-TARGET-ACTION-ID | Target Action ID | ID | OPTION_SET: OPT-COM-016 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-PERMISSION-RESULT | Permission Result | STRING | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-EXPIRES-AT | Preview Expiry Time | DATETIME | SYSTEM | 是 | READ_ONLY | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-VERSION | AI Task Preview Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-USER-REQUEST | User-visible AI Request | TEXT | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SOURCE-VERSION-REFS | Version-pinned Source References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SOURCE-RESULT-REF | Published Result Source Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | required when an AI preview may use a published assessment result；状态=PREVIEW_READY；动作=AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW/AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SOURCE-RESULT-VERSION | Published Result Source Version | INTEGER | SYSTEM | required with the exact published assessment result source；状态=PREVIEW_READY；动作=AIX-ACT-CREATE-FEEDBACK-DRAFT-PREVIEW/AIX-ACT-CREATE-PLAN-DRAFT-PREVIEW | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-USER-VISIBLE-CONTENT | User-visible Preview Content | TEXT | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-EVIDENCE-REFERENCES | Verifiable Evidence References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-RESULT-REFERENCE | Result Reference | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-MODEL-VERSION | Model Version | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-CAPABILITY-VERSION | Capability Version | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-RULE-VERSION | Rule Version | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SAFETY-VERSION | Safety Policy Version | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-PERMISSION-GATE | Permission Gate Outcome | STRING | OPTION_SET: OPT-AI2-006 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-SAFETY-GATE | Safety Gate Outcome | STRING | OPTION_SET: OPT-AI2-006 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-TEACHING-CORRECTNESS-GATE | Teaching-correctness Gate Outcome | STRING | OPTION_SET: OPT-AI2-006 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ANSWER-OPEN-GATE | Answer-open Gate Outcome | STRING | OPTION_SET: OPT-AI2-006 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ANSWER-OPEN-POLICY-ID | Answer-open Policy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-ANSWER-OPEN-POLICY-VERSION | Answer-open Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-AUTHORIZATION-CHECKED-AT | Access-time Authorization Check | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| AIX-001 | AIX-OBJ-TASK-PREVIEW | AIX-PREVIEW-F-RESTRICTED-CONTENT-CATEGORIES | Withheld Answer, Solution, and Rubric Categories | STRING_ARRAY | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-ID | Report Definition ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-NAME | Report Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-METRIC-IDS | Report Metric IDs | STRING_ARRAY | OPTION_SET: OPT-ENUM-037 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-DATA-SCOPE | Authorized Data Scope | STRING | OPTION_SET: OPT-ENUM-048 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-TIME-RANGE | Report Time Range | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DEFINITION | RPT-DEFINITION-F-VERSION | Report Definition Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-ID | Report Subscription ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-CREATOR-REF | Report Subscription Creator | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-DEFINITION-REF | Subscribed Report Definition | ID | OBJECT_REF: RPT-OBJ-DEFINITION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-DEFINITION-VERSION | Subscribed Report Definition Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-SCHEDULE-FREQUENCY | Schedule Frequency | STRING | OPTION_SET: OPT-ENUM-014 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-EXECUTION-TIME | Scheduled Execution Time | STRING | OPTION_SET: OPT-ENUM-036 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-TIMEZONE | Schedule Timezone | STRING | OPTION_SET: OPT-ENUM-035 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-RECIPIENTS | Authorized Report Recipients | STRING_ARRAY | OPTION_SET: OPT-ENUM-015 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-DATA-SCOPE | Subscription Data Scope | STRING | OPTION_SET: OPT-ENUM-048 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SUBSCRIPTION | RPT-SUBSCRIPTION-F-VERSION | Report Subscription Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-ID | Report Run ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-DEFINITION-REF | Run Report Definition | ID | OBJECT_REF: RPT-OBJ-DEFINITION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-DEFINITION-VERSION | Run Report Definition Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-SUBSCRIPTION-REF | Run Report Subscription | ID | OBJECT_REF: RPT-OBJ-SUBSCRIPTION | required only for a periodic report run；状态=QUEUED；动作=RPT-ACT-CREATE-RUN | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-SUBSCRIPTION-VERSION | Run Report Subscription Version | INTEGER | SYSTEM | required only for a periodic report run；状态=QUEUED；动作=RPT-ACT-CREATE-RUN | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-DATA-CUTOFF | Run Data Cutoff | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-PERMISSION-RESULT | Run Permission Result | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-SOURCE-VERSIONS | Pinned Run Source Versions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-RESULT | Report Run Result | JSON | SYSTEM | required when a report run succeeds；状态=SUCCEEDED；动作=RPT-ACT-COMPLETE-RUN | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-RUN | RPT-RUN-F-VERSION | Report Run Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-ID | Report Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-RUN-REF | Source Report Run | ID | OBJECT_REF: RPT-OBJ-RUN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-RUN-VERSION | Source Report Run Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-SOURCE-VERSIONS | Snapshot Source Versions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-DATA-CUTOFF | Snapshot Data Cutoff | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-PERMISSION-RESULT | Snapshot Permission Result | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-RUN-RESULT | Snapshot Run Result | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-SNAPSHOT | RPT-SNAPSHOT-F-VERSION | Report Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-ID | Report Delivery ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-SNAPSHOT-REF | Delivered Report Snapshot | ID | OBJECT_REF: RPT-OBJ-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-SNAPSHOT-VERSION | Delivered Report Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-RECIPIENTS | Delivery Recipients | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-CHANNEL | Delivery Channel | STRING | OPTION_SET: OPT-ENUM-047 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-STATE | Report Delivery State | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| RPT-001 | RPT-OBJ-DELIVERY | RPT-DELIVERY-F-VERSION | Report Delivery Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-ID | Business Event ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-SOURCE-OBJECT-ID | Source Business Object ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-SOURCE-VERSION | Source Business Object Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-EVENT-KIND | Business Event Kind | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-OCCURRED-AT | Business Event Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-BUSINESS-EVENT | NOTI-EVENT-F-VERSION | Business Event Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-ID | Action Todo ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-SOURCE-EVENT-ID | Source Business Event ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-ASSIGNEE-ID | Assigned Teacher ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-TEACHING-ISSUE | Teaching Issue | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-TEACHER-JUDGMENT | Teacher Judgment | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-LINKED-ACTIONS | Linked Teaching Actions | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-RESOLUTION-EVIDENCE | New Evidence Supporting Resolution | JSON | USER_INPUT | required only when observation supports resolution；状态=RESOLVED；动作=NOTI-ACT-RESOLVE-ACTION-TODO | EDITABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-STATUS | Action Todo Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-ACTION-TODO | NOTI-TODO-F-VERSION | Action Todo Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ID | Notification Message ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SOURCE-EVENT | Source Business Event ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-RECIPIENT | Notification Recipient | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-SUMMARY-TEMPLATE | Authorized Minimal Summary Template | STRING | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-DEEP-LINK | Reauthorized Product Deep Link | STRING | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-READ-AT | Read At | DATETIME | SYSTEM | required only after the recipient reads the message；状态=READ；动作=NOTI-ACT-MARK-READ | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-ARCHIVED-AT | Archived At | DATETIME | SYSTEM | required only when the recipient archives the message；状态=ARCHIVED；动作=NOTI-ACT-MARK-HANDLED | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-NOTIFICATION | NOTI-NOTIFICATION-F-VERSION | Notification Message Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-ID | Channel Delivery Attempt ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-MESSAGE-REF | Pinned Notification Message Reference | ID | OBJECT_REF: NOTI-OBJ-NOTIFICATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-MESSAGE-VERSION | Pinned Notification Message Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-CHANNEL | Delivery Channel | STRING | OPTION_SET: OPT-ENUM-047 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-DELIVERED-AT | Delivered At | DATETIME | SYSTEM | required only after a delivery receipt succeeds；状态=DELIVERED；动作=NOTI-ACT-DELIVER | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-FAILURE-CODE | Delivery Failure Code | STRING | SYSTEM | required only after a delivery attempt fails；状态=FAILED；动作=NOTI-ACT-FAIL-DELIVERY | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-RETRY-COUNT | Delivery Retry Count | INTEGER | SYSTEM | required when queueing or retrying an independent delivery；状态=QUEUED；动作=NOTI-ACT-QUEUE-DELIVERY/NOTI-ACT-RETRY-DELIVERY | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| NOTI-001 | NOTI-OBJ-CHANNEL-DELIVERY | NOTI-DELIVERY-F-VERSION | Channel Delivery Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-ID | Lesson Plan Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-SUBJECT | Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-COURSE | Course | ID | OPTION_SET: OPT-COM-008 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-TITLE | Lesson Plan Title | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-RUBRIC-VERSION | Lesson Rubric Version | ID | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-KNOWLEDGE-POINT-IDS | Lesson Knowledge Points | STRING_ARRAY | OPTION_SET: OPT-COM-011 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-VERSION | Lesson Plan Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-LESSON-PLAN | PREP-LESSON-F-STATUS | Lesson Plan Status | STRING | OPTION_SET: OPT-EXT-001 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-ID | Teaching Material Reference ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-REFERENCE | Teaching Material Reference | FILE_REFERENCE | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-USAGE-PURPOSE | Material Usage Purpose | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-MATERIAL-REF | PREP-MATERIAL-F-LICENSE-STATUS | Material License Status | STRING | OPTION_SET: OPT-EXT-002 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-ID | Classroom Activity Record ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-INSTRUCTIONS | Classroom Activity Instructions | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-EVIDENCE | Classroom Activity Evidence | JSON | USER_INPUT | required only when classroom activity completion is recorded；状态=RECORDED；动作=PREP-ACT-RECORD-CLASSROOM-ACTIVITY | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-CLASSROOM-ACTIVITY | PREP-ACTIVITY-F-STATUS | Classroom Activity Status | STRING | OPTION_SET: OPT-EXT-012 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-ID | Generated Assignment Draft ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-CONTENT | Generated and Teacher-completed Assignment Draft Content | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-REF | Pinned Confirmed Lesson Plan | ID | OBJECT_REF: PREP-OBJ-LESSON-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-SOURCE-LESSON-VERSION | Source Lesson Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PREP-001 | PREP-OBJ-ASSIGNMENT-DRAFT | PREP-DRAFT-F-STATUS | Assignment Draft Status | STRING | OPTION_SET: OPT-EXT-013 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ID | Question Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SCHOOL-ID | Content School | ID | OPTION_SET: OPT-COM-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SUBJECT-ID | Content Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-COURSE-ID | Content Course | ID | OPTION_SET: OPT-COM-008 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-STEM | Question Stem | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ANSWER | Question Answer | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-ANALYSIS | Question Analysis | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-KNOWLEDGE-MAPPINGS | Knowledge Point Mappings | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-VERSION | Question Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-AVAILABILITY | Question Availability | STRING | OPTION_SET: OPT-EXT-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-LICENSE-REF | Pinned Content License | ID | OBJECT_REF: CONTENT-OBJ-LICENSE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-LICENSE-VERSION | Pinned Content License Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-PERMISSION-REF | Pinned Content Permission | ID | OBJECT_REF: CONTENT-OBJ-PERMISSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-PERMISSION-VERSION | Pinned Content Permission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SOURCE-GRAPH-REF | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH Reference | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-SOURCE-GRAPH-VERSION | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH Pinned Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-RIGHTS-BUNDLE-REF | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE Reference | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-RIGHTS-BUNDLE-VERSION | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE Pinned Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-MANAGEMENT-SCOPE-REF | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE Reference | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-QUESTION-VERSION | CONTENT-QUESTION-F-MANAGEMENT-SCOPE-VERSION | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE Pinned Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-ID | Content License Record ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-RIGHTSHOLDER | Content Rightsholder | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-TERMS | Content License Terms | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-STATUS | Content License Status | STRING | OPTION_SET: OPT-EXT-011 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-LICENSE | CONTENT-LICENSE-F-VERSION | Content License Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-ID | Content Permission Grant ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SCOPE | Content Permission Scope | STRING | OPTION_SET: OPT-EXT-010 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SCHOOL-ID | Authorized School | ID | OPTION_SET: OPT-COM-002 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-SUBJECT-ID | Authorized Subject | ID | OPTION_SET: OPT-COM-007 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-COURSE-ID | Authorized Course | ID | OPTION_SET: OPT-COM-008 | 否 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-GRANTEE-ID | Permission Grantee | ID | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-EFFECTIVE-AT | Permission Effective Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-EXPIRES-AT | Permission Expiry Time | DATETIME | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PERMISSION | CONTENT-PERMISSION-F-VERSION | Content Permission Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-ID | Material Source Graph ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-ROOT-MATERIAL-ID | Root Material ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-SOURCE-KIND | Root Material Source Kind | STRING | OPTION_SET: OPT-BL2-015 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-DEPENDENCY-GRAPH | Source Dependency Graph | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-DEPENDENCY-VERSIONS | Pinned Dependency Versions | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-STATUS | Source Graph Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | CONTENT-SOURCE-F-VERSION | Source Graph Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-ID | Material Rights Bundle ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-MATERIAL-ID | Material ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-SOURCE-GRAPH-REF | Pinned Material Source Graph | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-SOURCE-GRAPH-VERSION | Pinned Material Source Graph Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-RIGHTS-BASIS | Rights Basis | STRING | OPTION_SET: OPT-BL2-006 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-USE-SCOPE | Permitted Use Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-ADAPTATION-SCOPE | Permitted Adaptation Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-SHARING-SCOPE | Permitted Sharing Scope | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-STUDENT-PRIVACY | Student Privacy Conditions | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-EFFECTIVE-AT | Rights Effective Time | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-EXPIRES-AT | Rights Expiry Time | DATETIME | USER_INPUT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-STATUS | Rights Bundle Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | CONTENT-RIGHTS-F-VERSION | Rights Bundle Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-ID | Material Management Scope ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-MATERIAL-ID | Material ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-SOURCE-GRAPH-REF | Pinned Source Graph for Product Management Scope | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-SOURCE-GRAPH-VERSION | Pinned Source Graph Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-RIGHTS-BUNDLE-REF | Pinned Rights Bundle for Product Management Scope | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-RIGHTS-BUNDLE-VERSION | Pinned Rights Bundle Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-SOURCE-KIND | Material Source Kind | STRING | OPTION_SET: OPT-BL2-015 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-MANAGEMENT-SCOPE | Product Management Scope | STRING | OPTION_SET: OPT-BL2-005 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-MANAGER-REF | Product Manager Reference | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-SCHOOL-AUTHORIZATION | School Authorization Evidence | JSON | USER_INPUT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-PLATFORM-REVIEW | Independent Platform Review Evidence | JSON | USER_INPUT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-STATUS | Management Scope Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-VERSION | Management Scope Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-PLATFORM-REVIEW-REF | Pinned Approved Platform-public Review | ID | OBJECT_REF: CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | required only for platform-public promotion；状态=ACTIVE；动作=CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-PLATFORM-REVIEW-VERSION | Pinned Approved Platform-public Review Version | INTEGER | SYSTEM | required only for platform-public promotion；状态=ACTIVE；动作=CONTENT-ACT-PROMOTE-TO-PLATFORM-PUBLIC | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-STUDENT-PROFILE-ID | Student Profile for Student-work Public Use | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-SCHOOL-SCOPE | Exact School Scope for Student-work Public Use | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-RELATIONSHIP-SCOPE | Exact Relationship Scope for Student-work Public Use | JSON | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-ID | Pinned High-impact Authorization | ID | OBJECT_REF: IAM-OBJ-HIGH-IMPACT-AUTHORIZATION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-HIGH-IMPACT-AUTHORIZATION-VERSION | Pinned High-impact Authorization Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-HIGH-IMPACT-EXECUTION-ID | High-impact Domain Execution ID | ID | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-MATERIAL-MANAGEMENT-SCOPE | CONTENT-SCOPE-F-HIGH-IMPACT-EXECUTION-VERSION | High-impact Domain Execution Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-ID | Platform-public Review ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-MATERIAL-ID | Reviewed Material ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-REF | Pinned Source Graph for Platform-public Review | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-SOURCE-GRAPH | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-SOURCE-GRAPH-VERSION | Pinned Reviewed Source Graph Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-REF | Pinned Rights Bundle for Platform-public Review | ID | OBJECT_REF: CONTENT-OBJ-MATERIAL-RIGHTS-BUNDLE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-RIGHTS-BUNDLE-VERSION | Pinned Reviewed Rights Bundle Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-SOURCE-RIGHTS-EVIDENCE | Source-rights Review Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-PRIVACY-EVIDENCE | Privacy Review Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-CONTENT-QUALITY-EVIDENCE | Content-quality Review Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-PLATFORM-AUTHORIZATION-EVIDENCE | Platform Authorization Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-STATUS | Platform-public Review Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-PLATFORM-PUBLICATION-REVIEW | CONTENT-PUBLICREVIEW-F-VERSION | Platform-public Review Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-ID | Student Sample Authorization ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-ID | Original Student Work ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-ORIGINAL-WORK-VERSION | Original Student Work Version | INTEGER | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-STUDENT-AUTHORIZATION | Student Authorization Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-GUARDIAN-AUTHORIZATION | Verified Guardian Authorization Evidence | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-LIMITED-PURPOSE | Authorized Teaching Sample Purpose | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-EXPIRES-AT | Authorization Expiry Time | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-STATUS | Student Sample Authorization Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | CONTENT-SAMPLEAUTH-F-VERSION | Student Sample Authorization Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-ID | Student Work Sample Copy ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-AUTHORIZATION-REF | Pinned Student Sample Authorization | ID | OBJECT_REF: CONTENT-OBJ-STUDENT-WORK-SAMPLE-AUTHORIZATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-AUTHORIZATION-VERSION | Pinned Sample Authorization Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-ORIGINAL-WORK-ID | Original Student Work ID | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-ORIGINAL-WORK-VERSION | Original Student Work Version | INTEGER | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-DEIDENTIFIED-COPY-REF | Independent Deidentified Copy Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-LIMITED-PURPOSE | Copy-specific Limited Purpose | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-MANAGEMENT-SCOPE | Sample Copy Management Scope | STRING | OPTION_SET: OPT-BL2-005 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-REMOVAL-EVIDENCE | Product-controlled Copy Removal Evidence | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-STATUS | Student Sample Copy Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| CONTENT-001 | CONTENT-OBJ-STUDENT-WORK-SAMPLE-COPY | CONTENT-SAMPLE-F-VERSION | Student Sample Copy Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-ID | Exam Event ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-NAME | Exam Event Name | STRING | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-TERM | Exam Term | STRING | OPTION_SET: OPT-COM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-STATUS | Exam Event Status | STRING | OPTION_SET: OPT-EXT-004 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-EXAM-EVENT | EXM-EVENT-F-PUBLICATION-AT | Exam Publication Time | DATETIME | SYSTEM | required only when the exam event is published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-EVENT | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-ID | Subject Score Import Batch ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-FILE | Subject Score Import File | FILE_REFERENCE | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-SUBJECT | Imported Subject | STRING | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VALIDATION | Import Validation Result | STRING | OPTION_SET: OPT-EXT-005 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-EVIDENCE | Import Validation Evidence | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-VERSION | Score Import Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SCORE-IMPORT | EXM-IMPORT-F-REJECTION-REASON | Score Import Rejection Reason | TEXT | USER_INPUT | required when score import validation is REJECTED；状态=REJECTED；动作=EXM-ACT-REJECT-SCORE-IMPORT | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-ID | Aggregate Score Rule Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-DEFINITION | Aggregate Score Rule Definition | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-AGGREGATE-RULE | EXM-RULE-F-VERSION | Aggregate Score Rule Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-ID | Published Subject Score Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-STUDENT-ID | Student | ID | OPTION_SET: OPT-COM-010 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SUBJECT | Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-SCORE | Published Subject Score | DECIMAL | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-EVIDENCE | Subject Score Evidence | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-REF | Pinned Passed Score Import | ID | OBJECT_REF: EXM-OBJ-SCORE-IMPORT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-IMPORT-VERSION | Pinned Score Import Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-TEACHER-CONFIRMED-AT | Subject Teacher Confirmation Time | DATETIME | SYSTEM | required only after subject-teacher confirmation；状态=TEACHER_CONFIRMED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VISIBLE-AT | Student Score Visible Time | DATETIME | SYSTEM | required when the subject score is first published；状态=PUBLISHED；动作=EXM-ACT-PUBLISH-SUBJECT-SCORE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-DECISION | Subject Score Confirmation Decision | STRING | OPTION_SET: OPT-EXT-018 | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-CONFIRMATION-REASON | Subject Score Confirmation Reason | TEXT | USER_INPUT | required for subject-teacher confirmation or rejection；状态=TEACHER_CONFIRMED/REJECTED；动作=EXM-ACT-CONFIRM-SUBJECT-SCORE/EXM-ACT-REJECT-SUBJECT-SCORE | EDITABLE | AUTHORIZED_SCOPE |
| EXM-001 | EXM-OBJ-SUBJECT-SCORE | EXM-SCORE-F-VERSION | Subject Score Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CALENDAR | SCH-CALENDAR-F-ID | School Calendar Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CALENDAR | SCH-CALENDAR-F-TERM | School Term | STRING | OPTION_SET: OPT-COM-004 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CALENDAR | SCH-CALENDAR-F-WORKING-DAYS | Working Days and Periods | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CALENDAR | SCH-CALENDAR-F-VERSION | Calendar Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-ID | Schedule Constraint ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-KIND | Constraint Kind | STRING | OPTION_SET: OPT-EXT-017 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-HARDNESS | Constraint Hardness | STRING | OPTION_SET: OPT-EXT-006 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-TEACHER-AVAILABILITY-WINDOWS | Teacher Availability Windows | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-CLASS-COURSE-PERIOD-RULES | Class Course Period Rules | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-TEACHER-LOAD-LIMITS | Teacher Course Load Limits | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-ROOM-CAPACITY-RULES | Room Capacity Rules | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT | SCH-CONSTRAINT-F-VERSION | Constraint Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-ID | Immutable Constraint Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-ITEMS | Constraint Snapshot Items | JSON | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-CONSTRAINT-IDS | Constraint Snapshot Stable IDs | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-HASH | Constraint Snapshot Hash | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-STATUS | Constraint Snapshot Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CONSTRAINT-SNAPSHOT | SCH-CONSTRAINT-SNAPSHOT-F-VERSION | Constraint Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-ID | Schedule Candidate Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-ASSIGNMENTS | Candidate Teacher Class Course Room Assignments | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-HARD-CHECK | Hard Constraint Check | STRING | OPTION_SET: OPT-EXT-007 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONFLICTS | Conflict Review Findings | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-SOFT-CONSTRAINT-ACKNOWLEDGED | Soft Constraint Acknowledgement | BOOLEAN | USER_INPUT | required when the schedule candidate is confirmed；状态=CONFIRMED；动作=SCH-ACT-CONFIRM-CANDIDATE | EDITABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-STATUS | Schedule Candidate Status | STRING | OPTION_SET: OPT-EXT-014 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-REF | Pinned Calendar Version | ID | OBJECT_REF: SCH-OBJ-CALENDAR | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CALENDAR-VERSION | Pinned Calendar Version Number | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-REF | Pinned Constraint Snapshot | ID | OBJECT_REF: SCH-OBJ-CONSTRAINT-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| SCH-001 | SCH-OBJ-CANDIDATE | SCH-CANDIDATE-F-CONSTRAINT-SNAPSHOT-VERSION | Pinned Constraint Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-ID | School Onboarding Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-SCHOOL | Onboarding School | ID | OPTION_SET: OPT-COM-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-IMPLEMENTATION-NOTES | Onboarding Implementation Notes | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-ONBOARDING-CASE | PLAT-CASE-F-STATUS | Onboarding Case Status | STRING | OPTION_SET: OPT-EXT-015 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-ID | School Service Plan ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-REF | Service Plan School | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-VERSION | Service Plan School Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCOPE | School Service Plan Scope | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SERVICE-STATE | School Service State | STRING | OPTION_SET: OPT-EXT-026 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-CONTINUITY-REF | Service Restriction Continuity Window | ID | OBJECT_REF: PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-CONTINUITY-VERSION | Service Restriction Continuity Window Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RESTRICTION-REASON | Service Plan Restriction Reason | STRING | OPTION_SET: OPT-EXT-022 | required when a service plan becomes restricted, terminated, or expired；状态=RESTRICTED/TERMINATED/EXPIRED；动作=PLAT-ACT-RESTRICT-SERVICE-PLAN/PLAT-ACT-TERMINATE-SERVICE-PLAN/PLAT-ACT-EXPIRE-SERVICE-PLAN | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RESTRICTION-EFFECTIVE-AT | Service Plan Restriction Effective At | DATETIME | SYSTEM | required when a service plan becomes restricted, terminated, or expired；状态=RESTRICTED/TERMINATED/EXPIRED；动作=PLAT-ACT-RESTRICT-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RECOVERY-PLAN-REF | Replacement Service Plan Version | ID | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | required when a restricted, terminated, or expired plan is superseded by a recovered version；状态=SUPERSEDED；动作=PLAT-ACT-SUPERSEDE-SERVICE-PLAN | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-RECOVERY-PLAN-VERSION | Replacement Service Plan Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-SCHOOL-CONFIRMED-AT | School Confirmation Time | DATETIME | SYSTEM | required only when the school confirms the service plan；状态=CONFIRMED；动作=PLAT-ACT-CONFIRM-SERVICE-PLAN | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-PLAN | PLAT-PLAN-F-VERSION | School Service Plan Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-ID | School Policy Template Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-CONTENT | School Policy Template Content | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-VERSION | Policy Template Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-POLICY-TEMPLATE | PLAT-POLICY-F-STATUS | Policy Template Status | STRING | OPTION_SET: OPT-EXT-016 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-ID | Audited School Support Case ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-PURPOSE | Support Case Purpose | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-REQUESTED-SCOPE | Requested Support Scope | JSON | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUDIT-REASON | Support Case Audit Reason | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-REF | Pinned Audited Access Session | ID | OBJECT_REF: AUD-OBJ-ACCESS-SESSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUD-SESSION-VERSION | Pinned Audited Session Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-AUTHORIZED-OPERATOR-ID | Authorized Session Operator Projection | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SUPPORT-CASE | PLAT-SUPPORT-CASE-F-STATUS | Support Case Status | STRING | OPTION_SET: OPT-EXT-009 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-ID | School-only Payer and Governance Boundary ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-REF | Commercial School | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-VERSION | Commercial School Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-PAYER-KIND | Commercial Payer Kind | STRING | OPTION_SET: OPT-EXT-019 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-FINANCIAL-CONTACT-REF | School Financial Contact Profile | ID | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-FINANCIAL-CONTACT-VERSION | Financial Contact Profile Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-GOVERNANCE-ADMIN-REF | School Governance Administrator Profile | ID | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-GOVERNANCE-ADMIN-VERSION | Governance Administrator Profile Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-PROHIBITED-CONSUMER-MODELS | Prohibited Consumer Monetization Models | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-SCHOOL-CONFIRMED-AT | School Commercial Boundary Confirmation Time | DATETIME | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-STATUS | School Commercial Boundary Status | STRING | OPTION_SET: OPT-EXT-008 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | PLAT-COMM-F-VERSION | School Commercial Boundary Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ID | Protected Activity and Exit Window ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SCHOOL-REF | Restricted Service School | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SCHOOL-VERSION | Restricted Service School Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SERVICE-PLAN-REF | Pinned Current School Service Plan | ID | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-SERVICE-PLAN-VERSION | Pinned Current Service Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-COMMERCIAL-BOUNDARY-REF | Pinned School Commercial Boundary | ID | OBJECT_REF: PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-COMMERCIAL-BOUNDARY-VERSION | Pinned School Commercial Boundary Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTION-REASON | Service Restriction Reason | STRING | OPTION_SET: OPT-EXT-022 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTED-AT | Service Restriction Eligibility Cutoff | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ACTIVITY-PROTECTION-UNTIL | Published Activity Protection Window End | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-EXIT-WINDOW-UNTIL | Explicit Exit Window End | DATETIME | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-PROTECTED-OPERATIONS | Operations Retained during Restricted Service | STRING_ARRAY | OPTION_SET: OPT-EXT-023 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-NEW-ACTIVITY-POLICY | New Activity Creation under Restricted Service | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CONTINUING-DATA-RIGHTS-BASIS | Continuing Data Rights Basis | TEXT | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-ENTRY-COUNT | Expected Eligible Activity Entry Count | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-SET-DIGEST | Expected Eligible Activity Set Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-ELIGIBLE-MAX-DUE-AT | Maximum Eligible Student Window Due Time | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURED-ENTRY-COUNT | Reconciled Captured Activity Entry Count | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURED-SET-DIGEST | Reconciled Captured Activity Set Digest | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-MANIFEST-STATUS | Protected Activity Manifest Status | STRING | OPTION_SET: OPT-EXT-025 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-MANIFEST-SEALED-AT | Protected Activity Manifest Sealed At | DATETIME | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-RESTRICTION-EFFECTIVE-AT | Service Restriction Effective At | DATETIME | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-FAILURE-REASON | Protected Activity Capture Failure Reason | TEXT | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-RETRY-COUNT | Protected Activity Capture Retry Count | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-CAPTURE-ATTEMPT-EPOCH | Protected Activity Capture Attempt Epoch | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-EXPECTED-CONTINUITY-VERSION | Capture Attempt Expected Continuity Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-STATUS | Service Continuity Status | STRING | OPTION_SET: OPT-EXT-024 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | PLAT-CONT-F-VERSION | Service Continuity Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-ID | Version-pinned Protected Student Activity Entry ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-CONTINUITY-REF | Service Continuity Window | ID | OBJECT_REF: PLAT-OBJ-SERVICE-CONTINUITY-WINDOW | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-CONTINUITY-VERSION | Service Continuity Window Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-CAPTURE-ATTEMPT-EPOCH | Capture Attempt Epoch | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-EXPECTED-CONTINUITY-VERSION | Expected Continuity Version for Capture | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-STUDENT-WINDOW-REF | Protected Student Activity Window | ID | OBJECT_REF: HW-OBJ-STUDENT-ACTIVITY-WINDOW | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-STUDENT-WINDOW-VERSION | Protected Student Activity Window Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-ACTIVITY-REF | Protected Published Activity | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-ACTIVITY-VERSION | Protected Activity Publication Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-REF | Protected Sealed Publication Snapshot | ID | OBJECT_REF: HW-OBJ-PUBLICATION-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-PUBLICATION-SNAPSHOT-VERSION | Protected Publication Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-CAPTURED-AT | Protection Entry Captured At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-PROTECTED-UNTIL | Exact Student Activity Protection End | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-STATUS | Protected Activity Entry Status | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-001 | PLAT-OBJ-PROTECTED-ACTIVITY-ENTRY | PLAT-PROTECT-F-VERSION | Protected Activity Entry Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-ID | Planned School-wide Phase-two Core Entitlement ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SCHOOL-REF | Phase-two Entitled School | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SCHOOL-VERSION | Phase-two Entitled School Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SERVICE-PLAN-REF | Pinned Active School Service Plan | ID | OBJECT_REF: PLAT-OBJ-SERVICE-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-SERVICE-PLAN-VERSION | Pinned Active Service Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-REF | Pinned School Commercial Boundary | ID | OBJECT_REF: PLAT-OBJ-SCHOOL-COMMERCIAL-BOUNDARY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-COMMERCIAL-BOUNDARY-VERSION | Pinned Commercial Boundary Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-CORE-AI-ENTITLEMENTS | School-wide Core AI Entitlements | STRING_ARRAY | OPTION_SET: OPT-EXT-021 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-PACKAGE-EXPANSION-SCOPE | Permitted Package Expansion Scope | STRING_ARRAY | OPTION_SET: OPT-EXT-020 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-STATUS | Phase-two Entitlement Status | STRING | OPTION_SET: OPT-EXT-026 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLAT-002 | PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | PLAT-P2ENT-F-VERSION | Phase-two Entitlement Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-ID | Progress Source Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-WORK-CONTEXT-REF | Pinned Current School Work Context | ID | OBJECT_REF: ACC-OBJ-CONTEXT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-WORK-CONTEXT-VERSION | Pinned Work Context Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-SCHOOL-PROFILE-REF | Pinned Current School Profile | ID | OBJECT_REF: ACC-OBJ-SCHOOL-PROFILE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-SCHOOL-PROFILE-VERSION | Pinned School Profile Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-GRADE-REF | Current Grade | ID | OBJECT_REF: ORG-OBJ-GRADE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-COURSE-REF | Current Course | ID | OBJECT_REF: ORG-OBJ-COURSE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-COURSE-SOURCE-VERSION | Pinned Course Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-CURRICULUM-REF | Pinned Curriculum Version | ID | OBJECT_REF: CURR-OBJ-CURRICULUM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-CURRICULUM-VERSION | Pinned Curriculum Version Number | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-UNIT-REF | Current Unit | ID | OBJECT_REF: CURR-OBJ-CHAPTER | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-UNIT-SOURCE-VERSION | Pinned Unit Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-TARGET-REF | Current Learning Target | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-TARGET-SOURCE-VERSION | Pinned Learning Target Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-TARGET-MAPPING-REF | Pinned Unit and Target Mapping | ID | OBJECT_REF: CURR-OBJ-MAPPING | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-TARGET-MAPPING-VERSION | Pinned Unit and Target Mapping Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-PREREQUISITE-TARGET-REFS | Pinned Prerequisite Target References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-PREREQUISITE-TARGET-VERSIONS | Pinned Prerequisite Target Versions | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-REF | Next Allowed Learning Target | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-NEXT-ALLOWED-TARGET-VERSION | Next Allowed Target Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-STATUS | Progress Source Snapshot Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-COURSE-TARGET-SNAPSHOT | PROG-SNAPSHOT-F-VERSION | Progress Source Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-ID | Student Current Target ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STUDENT-REF | Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-SNAPSHOT-REF | Pinned Course Target Snapshot | ID | OBJECT_REF: PROG-OBJ-COURSE-TARGET-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-SNAPSHOT-VERSION | Pinned Course Target Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STATUS | Current Target Status | STRING | OPTION_SET: OPT-P2-PROG-TARGET-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-COMPLETION-EVIDENCE-REF | Current Target Completion Evidence | ID | OBJECT_REF: PUB-OBJ-RESULT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-COMPLETION-EVIDENCE-VERSION | Current Target Completion Evidence Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-STATUS-AT | Current Target Status Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-STUDENT-TARGET | PROG-TARGET-F-VERSION | Student Current Target Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-ID | Next Target Choice ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STUDENT-REF | Choosing Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CURRENT-TARGET-REF | Pinned Completed Current Target | ID | OBJECT_REF: PROG-OBJ-STUDENT-TARGET | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CURRENT-TARGET-VERSION | Pinned Completed Current Target Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-COMPLETION-EVIDENCE-REF | Pinned Current Target Completion Evidence | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-COMPLETION-EVIDENCE-VERSION | Pinned Completion Evidence Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-NEXT-SNAPSHOT-REF | Pinned Next Allowed Target Snapshot | ID | OBJECT_REF: PROG-OBJ-COURSE-TARGET-SNAPSHOT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-NEXT-SNAPSHOT-VERSION | Pinned Next Allowed Target Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STUDENT-CHOICE | Student Next Target Choice | STRING | OPTION_SET: OPT-P2-PROG-STUDENT-CHOICE | 否 | EDITABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-PROPOSED-AT | Next Target Proposed Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-CHOSEN-AT | Next Target Choice Time | DATETIME | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-STATUS | Next Target Choice Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PROG-001 | PROG-OBJ-NEXT-TARGET-CHOICE | PROG-CHOICE-F-VERSION | Next Target Choice Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ID | Teaching Video Request ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-STUDENT-REF | Video Service Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-REQUESTER-REF | Video Requester | ID | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-REQUESTER-KIND | Video Requester Kind | STRING | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SERVICE-AUDIENCE | Video Service Audience | STRING | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SERVICE-OBJECT-REFS | Video Service Object References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MANAGEMENT-SCOPE | Video Management Scope | STRING | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SOURCE-MATERIALS | Pinned Source Materials | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCESS-SCOPE | Video Access Scope | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCESS-DOMAIN | Video Access Domain | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-KIND | Teaching Video Request Kind | STRING | OPTION_SET: OPT-P2-VIDEO-REQUEST-KIND | 是 | EDITABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACTIVITY-REF | Pinned Source Activity | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACTIVITY-VERSION | Pinned Source Activity Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SUBMISSION-REF | Pinned Source Submission | ID | OBJECT_REF: SUB-OBJ-ATTEMPT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SUBMISSION-VERSION | Pinned Source Submission Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-RESULT-REF | Pinned AI Assessment Result | ID | OBJECT_REF: GRD-OBJ-DECISION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-RESULT-VERSION | Pinned AI Assessment Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-STANDARD-REF | Pinned Assessment Standard | ID | OBJECT_REF: GRD-OBJ-ASSESSMENT-STANDARD-VERSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ASSESSMENT-STANDARD-VERSION | Pinned Assessment Standard Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-PUBLISHED-RESULT-REF | Pinned Published Assessment Result | ID | OBJECT_REF: PUB-OBJ-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-PUBLISHED-RESULT-VERSION | Pinned Published Assessment Result Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MINIMUM-PROGRESS-REF | Pinned Minimum Learning State | ID | OBJECT_REF: PROG-OBJ-STUDENT-TARGET | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MINIMUM-PROGRESS-VERSION | Pinned Minimum Learning State Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-REF | Pinned Student-selected Next Target | ID | OBJECT_REF: PROG-OBJ-NEXT-TARGET-CHOICE | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-NEXT-TARGET-CHOICE-VERSION | Pinned Student-selected Next Target Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-RIGHTS-REF | Pinned Source Material Rights | ID | OBJECT_REF: CONTENT-OBJ-LICENSE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-RIGHTS-VERSION | Pinned Source Material Rights Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-PERMISSION-REF | Pinned Source Material Permission | ID | OBJECT_REF: CONTENT-OBJ-PERMISSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-MATERIAL-PERMISSION-VERSION | Pinned Source Material Permission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-ID | Answer Open Policy ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-OPEN-POLICY-VERSION | Answer Open Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ANSWER-SOLUTION-RUBRIC-OPEN-AT | Pinned Answer Solution and Rubric Open Times | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-SOURCE-BINDING-DIGEST | Fixed Source Version Binding Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-ACCEPTED-AT | Video Request Accepted Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-STATUS | Video Request Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-REQUEST | VIDEO-REQUEST-F-VERSION | Teaching Video Request Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ID | School-private Teaching Video Request ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-REQUESTER-TEACHER-REF | Requesting Subject Teacher | ID | OBJECT_REF: ORG-OBJ-TEACHER | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-REQUESTER-KIND | School Video Requester Kind | STRING | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SERVICE-AUDIENCE | School Video Service Audience | STRING | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-CLASS-REF | Assigned Service Class | ID | OBJECT_REF: ORG-OBJ-CLASS | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SERVICE-OBJECT-REFS | Authorized Class or Student Group References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MANAGEMENT-SCOPE | School Video Management Scope | STRING | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SOURCE-MATERIALS | Pinned School Source Materials | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCESS-SCOPE | School Video Access Scope | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCESS-DOMAIN | School Video Access Domain | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-KIND | School Teaching Video Kind | STRING | OPTION_SET: OPT-P2-VIDEO-REQUEST-KIND | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-REF | Effective Teaching Assignment | ID | OBJECT_REF: ORG-OBJ-TEACHING-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-SCOPE-VERSION | Pinned Teaching Scope Snapshot Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACTIVITY-REF | Pinned School Teaching Activity | ID | OBJECT_REF: HW-OBJ-ASSIGNMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACTIVITY-VERSION | Pinned School Teaching Activity Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-REF | Pinned School Source Material Rights | ID | OBJECT_REF: CONTENT-OBJ-LICENSE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-RIGHTS-VERSION | Pinned School Source Material Rights Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-REF | Pinned School Source Material Permission | ID | OBJECT_REF: CONTENT-OBJ-PERMISSION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-MATERIAL-PERMISSION-VERSION | Pinned School Source Material Permission Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-TEACHING-BASIS | Versioned Group Teaching Basis | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-ID | School Video Answer Open Policy ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ANSWER-OPEN-POLICY-VERSION | School Video Answer Open Policy Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-SOURCE-BINDING-DIGEST | School Video Fixed Source Binding Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-ACCEPTED-AT | School Video Request Accepted Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-STATUS | School Video Request Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-REQUEST | VIDEO-SCHOOL-REQUEST-F-VERSION | School Video Request Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-ID | Video Recall Impact Snapshot ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-TRIGGER-KIND | Video Recall Trigger Kind | STRING | OPTION_SET: OPT-P2-VIDEO-RECALL-TRIGGER | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-EVENT-ID | Recall Source Event ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-EVENT-VERSION | Recall Source Event Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-MODULE-ID | Recall Source Module ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-OBJECT-ID | Recall Source Object ID | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-OBJECT-REF | Recall Source Object Reference | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-SOURCE-OBJECT-VERSION | Recall Source Object Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-AFFECTED-ASSET-REFS | Affected Video Asset References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-AFFECTED-ASSET-DIGEST | Affected Video Asset Set Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-CAPTURED-AT | Recall Impact Captured At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-STATUS | Recall Impact Snapshot Status | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | VIDEO-RECALL-F-VERSION | Video Recall Impact Snapshot Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ID | Teaching Video Asset ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-STUDENT-REF | Video Service Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUEST-REF | Pinned Teaching Video Request | ID | OBJECT_REF: VIDEO-OBJ-REQUEST | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUEST-VERSION | Pinned Teaching Video Request Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCHOOL-REQUEST-REF | Pinned School-private Teaching Video Request | ID | OBJECT_REF: VIDEO-OBJ-SCHOOL-REQUEST | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCHOOL-REQUEST-VERSION | Pinned School-private Teaching Video Request Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUESTER-REF | Recorded Video Requester | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-REQUESTER-KIND | Recorded Video Requester Kind | STRING | OPTION_SET: OPT-P2-VIDEO-REQUESTER-KIND | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SERVICE-AUDIENCE | Recorded Video Service Audience | STRING | OPTION_SET: OPT-P2-VIDEO-SERVICE-AUDIENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SERVICE-OBJECT-REFS | Recorded Video Service Object References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MANAGEMENT-SCOPE | Recorded Video Management Scope | STRING | OPTION_SET: OPT-P2-VIDEO-MANAGEMENT-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SOURCE-MATERIALS | Recorded Video Source Materials | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ACCESS-SCOPE | Recorded Video Access Scope | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-SCOPE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-ACCESS-DOMAIN | Recorded Video Access Domain | STRING | OPTION_SET: OPT-P2-VIDEO-ACCESS-DOMAIN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MANAGER-REF | Recorded Asset Manager | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PROMOTION-POLICY | Knowledge-layer Promotion Policy | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCRIPT-REF | Generated Script Reference | FILE_REFERENCE | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-MEDIA-REF | Generated Video Media Reference | FILE_REFERENCE | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SUBTITLE-REF | Accessible Subtitle Reference | FILE_REFERENCE | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SUMMARY | Teaching Video Summary | TEXT | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-LOW-BANDWIDTH-ALTERNATIVE | Text Image or Low-bandwidth Alternative | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SCRIPT-GATE | Script Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RENDER-GATE | Rendered Media Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-SAFETY-GATE | Safety Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PRIVACY-GATE | Privacy Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RIGHTS-GATE | Source Rights Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PEDAGOGY-GATE | Teaching Correctness Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-PLAYABILITY-GATE | Playability Gate | STRING | OPTION_SET: OPT-P2-VIDEO-GATE-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-DOWNLOAD-POLICY | Controlled Playback Download Policy | STRING | OPTION_SET: OPT-P2-VIDEO-DOWNLOAD-POLICY | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-EXTERNAL-RECORDING-BOUNDARY | External Recording Capability Boundary | STRING | OPTION_SET: OPT-P2-VIDEO-EXTERNAL-RECORDING-BOUNDARY | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-DELIVERY-STATUS | Teaching Video Delivery Status | STRING | OPTION_SET: OPT-P2-VIDEO-DELIVERY-STATUS | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-NOTIFIED-AT | Student Delivery Notification Time | DATETIME | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-REASON | Video Recall Reason | TEXT | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-IMPACT-REF | Pinned Video Recall Impact Snapshot | ID | OBJECT_REF: VIDEO-OBJ-RECALL-IMPACT-SNAPSHOT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-IMPACT-VERSION | Pinned Video Recall Impact Snapshot Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-TRIGGER-KIND | Applied Video Recall Trigger Kind | STRING | OPTION_SET: OPT-P2-VIDEO-RECALL-TRIGGER | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-SOURCE-EVENT-ID | Applied Recall Source Event ID | STRING | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-RECALL-SOURCE-EVENT-VERSION | Applied Recall Source Event Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-ASSET | VIDEO-ASSET-F-VERSION | Teaching Video Asset Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-ID | Student Minimum Video Entitlement ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-STUDENT-REF | Active Phase-two Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-PERIOD | Entitlement Period | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-MINIMUM-UNITS | Guaranteed Minimum Usable Video Units | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-AVAILABLE-UNITS | Available Guaranteed Units | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-STATUS | Student Minimum Entitlement Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-STUDENT-ENTITLEMENT | VIDEO-ENTITLEMENT-F-VERSION | Student Minimum Entitlement Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-ID | School Video Overflow Pool ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-SCHOOL-REF | School | ID | OBJECT_REF: ACC-OBJ-SCHOOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-CORE-ENTITLEMENT-REF | Pinned Active School Phase-two Core Entitlement | ID | OBJECT_REF: PLAT-OBJ-PHASE-TWO-CORE-ENTITLEMENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-CORE-ENTITLEMENT-VERSION | Pinned Active School Phase-two Core Entitlement Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-PERIOD | Overflow Pool Period | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-AVAILABLE-UNITS | School Shared Overflow Units | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-STATUS | School Overflow Pool Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | VIDEO-OVERFLOW-F-VERSION | School Overflow Pool Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-ID | Video Quota Ledger ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-STUDENT-REF | Quota Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-REQUEST-REF | Pinned Accepted Video Request | ID | OBJECT_REF: VIDEO-OBJ-REQUEST | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-REQUEST-VERSION | Pinned Accepted Video Request Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-ENTITLEMENT-REF | Student Minimum Entitlement | ID | OBJECT_REF: VIDEO-OBJ-STUDENT-ENTITLEMENT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-OVERFLOW-REF | School Shared Overflow Pool | ID | OBJECT_REF: VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-SOURCE | Quota Source | STRING | OPTION_SET: OPT-P2-VIDEO-QUOTA-SOURCE | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-PRIORITY | Quota Priority | STRING | OPTION_SET: OPT-P2-VIDEO-QUOTA-PRIORITY | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-RESERVED-UNITS | Reserved Video Units | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-SETTLED-UNITS | Settled Usable Delivery Units | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-RELEASE-REASON | Quota Release Reason | STRING | OPTION_SET: OPT-P2-VIDEO-RELEASE-REASON | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-STATUS | Quota Ledger Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-QUOTA-LEDGER | VIDEO-LEDGER-F-VERSION | Video Quota Ledger Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-ID | School-private Video Quota Ledger ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-REQUEST-REF | Pinned School-private Video Request | ID | OBJECT_REF: VIDEO-OBJ-SCHOOL-REQUEST | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-REQUEST-VERSION | Pinned School-private Video Request Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-OVERFLOW-REF | School Shared Overflow Pool | ID | OBJECT_REF: VIDEO-OBJ-SCHOOL-OVERFLOW-POOL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-SERVICE-OBJECT-REFS | School Video Service Object References | STRING_ARRAY | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-PRIORITY | School-private Video Quota Priority | STRING | OPTION_SET: OPT-P2-VIDEO-QUOTA-PRIORITY | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-RESERVED-UNITS | Reserved School Video Units | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-SETTLED-UNITS | Settled School Video Units | INTEGER | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-RELEASE-REASON | School Video Quota Release Reason | STRING | OPTION_SET: OPT-P2-VIDEO-RELEASE-REASON | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-STATUS | School-private Video Quota Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-SCHOOL-QUOTA-LEDGER | VIDEO-SCHOOL-LEDGER-F-VERSION | School-private Video Quota Ledger Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ID | Post-video Verification ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STUDENT-REF | Verifying Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ASSET-REF | Pinned Delivered Teaching Video Asset | ID | OBJECT_REF: VIDEO-OBJ-ASSET | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ASSET-VERSION | Pinned Delivered Teaching Video Asset Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-REF | Single Verification Ability Target | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-SOURCE-VERSION | Pinned Verification Target Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-TARGET-KIND | Verification Target Kind | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-TARGET-KIND | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STRATEGY | Verification Strategy | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-STRATEGY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-MODALITY | Verification Modality | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-MODALITY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-ABILITY-NODE-REFS | Verification Ability Node References | STRING_ARRAY | USER_INPUT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-NEW-CONTEXT-DIGEST | New-context Verification Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-FIRST-PROMPT-POLICY | First-expression Prompt Policy | STRING | OPTION_SET: OPT-P2-VIDEO-FIRST-PROMPT-POLICY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-MAX-SPECIFIC-GAPS-PER-TURN | Maximum Specific Gaps Per Follow-up | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-EXCLUDED-NONKNOWLEDGE-SIGNALS | Signals Excluded from Knowledge-gap Inference | STRING_ARRAY | OPTION_SET: OPT-P2-VIDEO-NONKNOWLEDGE-SIGNAL | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-FIRST-EXPRESSION | Student First Independent Expression | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-SPECIFIC-GAP | One Specific Follow-up Gap | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-UNKNOWN-DECLARATION | Student Unknown Declaration | BOOLEAN | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RETEACHING-REF | Returned Gap Teaching Reference | ID | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RETRY-REQUEST | Student Different-context Retry Request | BOOLEAN | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-DIGEST | Different-context Retry Digest | STRING | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-DIFFERENT-CONTEXT-EXPRESSION | Student Different-context Expression | JSON | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-RESULT | Verification Result without Mastery Claim | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-RESULT | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-EVIDENCE | Verifiable Post-video Evidence | JSON | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-STATUS | Post-video Verification Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-VERIFICATION | VIDEO-VERIFY-F-VERSION | Post-video Verification Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ID | Post-video Learning Fact ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STUDENT-REF | Learning Fact Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ASSET-REF | Pinned Teaching Video Asset | ID | OBJECT_REF: VIDEO-OBJ-ASSET | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-ASSET-VERSION | Pinned Teaching Video Asset Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERIFICATION-REF | Pinned Post-video Verification | ID | OBJECT_REF: VIDEO-OBJ-VERIFICATION | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERIFICATION-VERSION | Pinned Post-video Verification Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-TARGET-REF | Learning Fact Ability Target | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-TARGET-SOURCE-VERSION | Learning Fact Target Source Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-NEW-CONTEXT-DIGEST | Learning Fact New-context Digest | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STRATEGY | Learning Fact Verification Strategy | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-STRATEGY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-MODALITY | Learning Fact Verification Modality | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-MODALITY | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-RESULT | Learning Fact Verification Result | STRING | OPTION_SET: OPT-P2-VIDEO-VERIFICATION-RESULT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-EVIDENCE | Learning Fact Evidence | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-RECORDED-AT | Learning Fact Recorded Time | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-STATUS | Post-video Learning Fact Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| VIDEO-001 | VIDEO-OBJ-LEARNING-FACT | VIDEO-FACT-F-VERSION | Post-video Learning Fact Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-ID | Evidence Version ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-REF | Evidence Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-DATA-ID | Evidence Source Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-RESULT-REF | Source Published Result Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | required for evidence derived from a published result；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-RESULT-VERSION | Source Published Result Version | INTEGER | SYSTEM | required for evidence derived from a published result；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-CORRECTION-REF | Source Correction Attempt Reference | ID | OBJECT_REF: CORR-OBJ-ATTEMPT | required for correction-stage evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-SOURCE-CORRECTION-VERSION | Source Correction Version | INTEGER | SYSTEM | required for correction-stage evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-EVIDENCE-SOURCE | Evidence Source | STRING | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STAGE | Evidence Stage | STRING | OPTION_SET: OPT-ENUM-008 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-KNOWLEDGE-POINT-REF | Knowledge Point Reference | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-KNOWLEDGE-POINT-VERSION | Knowledge Point Version | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-RESULT | Answer Result | STRING | OPTION_SET: OPT-ENUM-009 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-ERROR-TYPE | Error Type | STRING | OPTION_SET: OPT-ENUM-010 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-WEIGHT | Evidence Weight | DECIMAL | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-VALIDITY | Evidence Validity | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-CANDIDATE | Mastery Interpretation Candidate | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-INTERPRETATION | Teacher-confirmed Mastery Interpretation | TEXT | USER_INPUT | required when evidence reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | EDITABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-TEACHER-CONFIRMATION | Teacher Confirmation | STRING | USER_INPUT | required when evidence reaches TEACHER_CONFIRMED；状态=TEACHER_CONFIRMED | EDITABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-STUDENT-VISIBLE-AT | Student Visible At | DATETIME | SYSTEM | required when evidence reaches STUDENT_VISIBLE；状态=STUDENT_VISIBLE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-INVALIDATION-REASON | Evidence Invalidation Reason | TEXT | SYSTEM | required when evidence becomes stale；状态=STALE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-PRIOR-EVIDENCE-REF | Prior Evidence Reference | ID | OBJECT_REF: INS-OBJ-EVIDENCE | required when a new evidence version supersedes prior evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-PRIOR-EVIDENCE-VERSION | Prior Evidence Version | INTEGER | SYSTEM | required when a new evidence version supersedes prior evidence；状态=CANDIDATE；动作=INS-ACT-CREATE-CANDIDATE | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-MASTERY-INTERPRETATION-VERSION | Mastery Interpretation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-EVIDENCE | INS-EVIDENCE-F-EVIDENCE-VERSION | Evidence Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-ID | Mastery Node State ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-STUDENT-REF | Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-SUBJECT | Subject | ID | OPTION_SET: OPT-COM-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-CAPABILITY-NODE-REF | Stable Capability Node Reference | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-CAPABILITY-NODE-VERSION | Stable Capability Node Version | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-STATUS | Node-level Mastery Status | STRING | OPTION_SET: OPT-PH3-001 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-LEARNING-PACE | Student-controlled Learning Pace | STRING | OPTION_SET: OPT-PH3-002 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-EVIDENCE-REFS | Current Evidence References | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-SOURCE-REASON | Status Change Source and Reason | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-EFFECTIVE-AT | Status Effective Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-NODE | INS-MASTERY-F-VERSION | Mastery Node State Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-ID | Mastery Challenge ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-MASTERY-REF | Challenged Mastery Node Reference | ID | OBJECT_REF: INS-OBJ-MASTERY-NODE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-MASTERY-VERSION | Challenged Mastery Node Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-STUDENT-REF | Challenging Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-REASON | Challenge Reason | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-RESPONSE | Subject Teacher Response | TEXT | USER_INPUT | 否 | EDITABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-CREATED-AT | Challenge Created At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-RESOLVED-AT | Challenge Resolved At | DATETIME | SYSTEM | 否 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| INS-001 | INS-OBJ-MASTERY-CHALLENGE | INS-CHALLENGE-F-VERSION | Mastery Challenge Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-ID | Improvement Plan ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-REF | Plan Student Reference | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-DATA-ID | Source Evidence Data ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-EVIDENCE-REF | Source Evidence Reference | ID | OBJECT_REF: INS-OBJ-EVIDENCE | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SOURCE-EVIDENCE-VERSION | Source Evidence Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-GOAL-CANDIDATE | Improvement Goal Candidate | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-TASK-CONTENT-CANDIDATE | Improvement Task Content Candidate | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-WORKLOAD-CANDIDATE | Planned Workload Candidate | DECIMAL | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-DUE-AT-CANDIDATE | Plan Due Time Candidate | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SUCCESS-CONDITION-CANDIDATE | Plan Success Condition Candidate | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-EVIDENCE-REQUIREMENT-CANDIDATE | Completion Evidence Requirement Candidate | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-REVALIDATION-METHOD-CANDIDATE | Plan Revalidation Method Candidate | TEXT | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-GOAL | Improvement Goal | TEXT | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SUBJECT | Improvement Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-KNOWLEDGE-POINT-REF | Plan Knowledge Point Reference | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-KNOWLEDGE-POINT-VERSION | Plan Knowledge Point Version | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-PRIORITY | Improvement Priority | STRING | OPTION_SET: OPT-ENUM-012 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-TASK-CONTENT | Improvement Task Content | TEXT | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-WORKLOAD | Planned Workload | DECIMAL | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-DUE-AT | Plan Due Time | DATETIME | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-SUCCESS-CONDITION | Plan Success Condition | TEXT | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-EVIDENCE-REQUIREMENT | Completion Evidence Requirement | STRING | OPTION_SET: OPT-ENUM-034 | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-REVALIDATION-METHOD | Plan Revalidation Method | TEXT | USER_INPUT | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-TEACHER-CONFIRMER-REF | Plan Teacher Confirmer Reference | ID | OBJECT_REF: ORG-OBJ-TEACHER | required when a candidate becomes an ACTIVE plan；状态=ACTIVE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-REF | Student Difficulty Feedback Reference | ID | OBJECT_REF: APP-OBJ-TODO | required when a student difficulty report changes the plan；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-STUDENT-DIFFICULTY-FEEDBACK-VERSION | Student Difficulty Feedback Version | INTEGER | SYSTEM | required when a student difficulty report changes the plan；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-ADJUSTMENT-REASON | Plan Adjustment Reason | TEXT | USER_INPUT | required when plan content or workload changes；状态=ACTIVE；动作=PLN-ACT-ADJUST-PLAN | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-CLOSE-REASON | Plan Close Reason | TEXT | USER_INPUT | required when the plan closes；状态=CLOSED；动作=PLN-ACT-CLOSE-PLAN | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-INVALIDATION-REF | Plan Evaluation Invalidation Reference | ID | OBJECT_REF: CORR-OBJ-INVALIDATION | required when the plan evaluation enters pending reconfirmation；状态=PENDING_RECONFIRM | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-INVALIDATION-VERSION | Plan Evaluation Invalidation Version | INTEGER | SYSTEM | required when the plan evaluation enters pending reconfirmation；状态=PENDING_RECONFIRM | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-EVALUATION-STATE | Plan Evaluation State | STRING | SYSTEM | required when an ACTIVE plan enters evaluation；状态=PENDING_RECONFIRM | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-EVALUATION-VERSION | Plan Evaluation Version | INTEGER | SYSTEM | required when an ACTIVE plan enters evaluation；状态=PENDING_RECONFIRM | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-PLAN | PLN-PLAN-F-PLAN-VERSION | Improvement Plan Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-ID | Subject Teacher Sync Output ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-PLAN-REF | Synced Plan Reference | ID | OBJECT_REF: PLN-OBJ-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-PLAN-VERSION | Synced Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-SUBJECT | Synced Subject | ID | OPTION_SET: OPT-COM-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-TEACHER-CONFIRMER-REF | Confirmed Subject Teacher Reference | ID | OBJECT_REF: ORG-OBJ-TEACHER | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-STATUS | Subject Teacher Sync Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-SUBJECT-SYNC | PLN-SUBJECT-SYNC-F-OUTPUT-VERSION | Subject Teacher Sync Output Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-ID | Homeroom Coordination Output ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-PLAN-REF | Coordinated Plan Reference | ID | OBJECT_REF: PLN-OBJ-PLAN | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-PLAN-VERSION | Coordinated Plan Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-CLASS-SCOPE | Homeroom Class Scope | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-LOAD-SUMMARY | Read-only Cross-subject Coordination Load | JSON | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-STATUS | Homeroom Coordination Status | STRING | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-HOMEROOM-COORDINATION | PLN-HOMEROOM-F-OUTPUT-VERSION | Homeroom Coordination Output Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-ID | Class Progress ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CLASS-REF | Class Reference | ID | OBJECT_REF: ORG-OBJ-CLASS | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-SUBJECT | Subject | ID | OPTION_SET: OPT-COM-007 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CURRICULUM-REF | Curriculum Reference | ID | OBJECT_REF: CURR-OBJ-CURRICULUM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CURRICULUM-VERSION | Curriculum Version | INTEGER | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-UNIT | Current Unit | ID | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TARGET-REF | Current Curriculum Target Reference | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TARGET-VERSION | Current Curriculum Target Version | ID | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-TEACHER-REF | Responsible Subject Teacher | ID | OBJECT_REF: ORG-OBJ-TEACHER | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-STATUS | Class Progress Status | STRING | OPTION_SET: OPT-PH3-003 | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-CHANGE-REASON | Progress Change Reason | TEXT | USER_INPUT | 是 | EDITABLE | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-EFFECTIVE-AT | Progress Effective Time | DATETIME | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| PLN-001 | PLN-OBJ-CLASS-PROGRESS | PLN-CLASS-PROGRESS-F-VERSION | Class Progress Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-ID | Learning Timeline Entry ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-STUDENT-REF | Learning Path Student | ID | OBJECT_REF: ORG-OBJ-STUDENT | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TERM-ID | Timeline Entry Term | ID | OPTION_SET: OPT-COM-004 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVENT-TYPE | Learning Path Event Type | STRING | OPTION_SET: OPT-ENUM-013 | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PUBLISHED-RESULT-REF | PUBLISHED-RESULT Source Reference | ID | OBJECT_REF: PUB-OBJ-RESULT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PUBLISHED-RESULT-VERSION | PUBLISHED-RESULT Source Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVIDENCE-REF | EVIDENCE Source Reference | ID | OBJECT_REF: INS-OBJ-EVIDENCE | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-EVIDENCE-VERSION | EVIDENCE Source Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-CORRECTION-REF | CORRECTION Source Reference | ID | OBJECT_REF: CORR-OBJ-ATTEMPT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-CORRECTION-VERSION | CORRECTION Source Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PLAN-EXECUTION-REF | PLAN-EXECUTION Source Reference | ID | OBJECT_REF: APP-OBJ-TODO | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-PLAN-EXECUTION-VERSION | PLAN-EXECUTION Source Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TEACHER-CONFIRMATION-REF | TEACHER-CONFIRMATION Source Reference | ID | OBJECT_REF: GRD-OBJ-DECISION | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-TEACHER-CONFIRMATION-VERSION | TEACHER-CONFIRMATION Source Version | INTEGER | SYSTEM | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-RECORDED-AT | Timeline Entry Recorded At | DATETIME | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-TIMELINE-ENTRY | LPATH-ENTRY-F-VERSION | Learning Timeline Entry Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-ID | Learning Path Interpretation ID | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUBJECT | Interpretation Subject | ID | OPTION_SET: OPT-COM-007 | 是 | EDITABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-REF | Interpretation Knowledge Point | ID | OBJECT_REF: CURR-OBJ-KNOWLEDGE-POINT | 否 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-KNOWLEDGE-POINT-VERSION | Interpretation Knowledge Point Version | ID | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-EVIDENCE-REFS | Versioned Evidence References | JSON | SYSTEM | 是 | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-EXPLANATION | Teacher-confirmed Explanation | TEXT | USER_INPUT | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | EDITABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-CONFIDENCE | Explanation Confidence | DECIMAL | USER_INPUT | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | EDITABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-LIMITATIONS | Explanation Limitations | TEXT | USER_INPUT | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | EDITABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-TEACHER-CONFIRMER | Corresponding Subject Teacher Confirmer | ID | OBJECT_REF: ORG-OBJ-TEACHER | required after corresponding subject-teacher confirmation；状态=TEACHER_CONFIRMED/STUDENT_VISIBLE；动作=LPATH-ACT-CONFIRM-INTERPRETATION | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-VISIBLE-FROM | Student Visible From | DATETIME | USER_INPUT | required when the interpretation becomes student visible；状态=STUDENT_VISIBLE；动作=LPATH-ACT-PUBLISH-INTERPRETATION | EDITABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUPERSEDED-BY-REF | Superseding Interpretation Reference | ID | OBJECT_REF: LPATH-OBJ-INTERPRETATION | required when a prior interpretation is superseded；状态=SUPERSEDED；动作=LPATH-ACT-SUPERSEDE-INTERPRETATION | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-SUPERSEDED-BY-VERSION | Superseding Interpretation Version | INTEGER | SYSTEM | required when a prior interpretation is superseded；状态=SUPERSEDED；动作=LPATH-ACT-SUPERSEDE-INTERPRETATION | IMMUTABLE | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-STALE-REASON | Interpretation Stale Reason | TEXT | SYSTEM | required when a source version makes the interpretation stale；状态=STALE；动作=LPATH-ACT-MARK-INTERPRETATION-STALE | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
| LPATH-001 | LPATH-OBJ-INTERPRETATION | LPATH-INTERPRETATION-F-VERSION | Learning Path Interpretation Version | INTEGER | SYSTEM | 是 | SYSTEM_MANAGED | AUTHORIZED_SCOPE |
