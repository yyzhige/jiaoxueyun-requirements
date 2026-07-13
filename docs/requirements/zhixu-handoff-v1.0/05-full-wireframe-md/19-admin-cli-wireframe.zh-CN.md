# CLI-001 管理员 CLI 交互合同

## CLI-P01 连续会话

```text
zhixu> 使用石家庄明德实验中学的教务身份，检查七年级任课关系缺口
上下文：石家庄明德实验中学 / 教务 / 2026-2027第一学期
发现 2 项缺口：七二班地理、七三班生物。
zhixu> 把缺口导出
将导出当前 2 项结果。继续？ [y/N]
```

## CLI-P02 查询结果

```text
SCOPE  school=石家庄明德实验中学 grade=七年级 term=当前
COUNT  2
1  七二班  地理  缺任课教师
2  七三班  生物  缺任课教师
```

## CLI-P03 预览

```text
ACTION  create-assignment-draft
TARGET  七一班, 七二班 / 数学 / 82名学生
RESULT  仅创建草稿，不发布、不通知
Confirm? [y/N]
```

## CLI-P04 自动化授权

```text
Automation: nightly-organization-check
School: 石家庄明德实验中学
Allowed: read organization, create issue draft
Forbidden: change role, publish grade, publish timetable
Expires: 2026-12-31
```

