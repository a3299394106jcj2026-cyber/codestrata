export function assessRepositoryRisk({ profile, contributors, insight, asOf }) {
  const licenseRisk = assessLicense(profile)
  const maintenanceRisk = assessMaintenance(contributors)
  const scaleRisk = assessScale(profile)
  const activityRisk = assessActivity(profile, insight, asOf)

  return {
    license: licenseRisk,
    maintenance: maintenanceRisk,
    scale: scaleRisk,
    activity: activityRisk,
    overall: combineOverall([licenseRisk, maintenanceRisk, scaleRisk, activityRisk])
  }
}

function assessLicense(profile) {
  const license = profile.license
  if (!license || !license.spdx) {
    return {
      level: "caution",
      title: "许可证不可用",
      detail: "GitHub 没有返回许可证信息，直接修改和发布存在法律不确定性。",
      recommendation: "先阅读仓库说明或联系作者确认授权，再决定是否复用。"
    }
  }

  const permissive = ["MIT", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0"]
  if (permissive.includes(license.spdx)) {
    return {
      level: "ok",
      title: `${license.spdx} 许可证`,
      detail: "属于常见宽松许可证，允许修改、分发和闭源使用，但需要保留版权与许可声明。",
      recommendation: "二次开发时保留 LICENSE 与上游署名。"
    }
  }

  if (license.spdx === "GPL-3.0" || license.spdx === "AGPL-3.0") {
    return {
      level: "caution",
      title: `${license.spdx} 许可证`,
      detail: "该许可证要求衍生作品以相同许可证开放源码，闭源发布会受到限制。",
      recommendation: "仅在团队愿意开源时作为基线，否则只借鉴设计思路。"
    }
  }

  return {
    level: "caution",
    title: `${license.spdx} 许可证`,
    detail: "该许可证的再分发和修改条款需要人工确认。",
    recommendation: "查看许可证原文后再复用代码。"
  }
}

function assessMaintenance(contributors) {
  if (!Array.isArray(contributors) || contributors.length === 0) {
    return {
      level: "caution",
      title: "贡献者数据不可用",
      detail: "GitHub 未返回贡献者信息，无法评估维护集中度。",
      recommendation: "查看最近提交记录和 issue 活跃度后再判断。"
    }
  }

  const total = contributors.reduce((sum, item) => sum + item.contributions, 0)
  if (total === 0) {
    return {
      level: "caution",
      title: "贡献数据为空",
      detail: "贡献者存在，但贡献总数为 0，数据无法解释维护状态。",
      recommendation: "直接查看最近提交。"
    }
  }

  const top = [...contributors].sort((a, b) => b.contributions - a.contributions)[0]
  const share = Math.round((top.contributions / total) * 1000) / 10
  const level = share >= 80 ? "caution" : share >= 60 ? "watch" : "ok"

  return {
    level,
    title: `${top.login ?? "匿名贡献者"} 占 ${share}%`,
    detail: `贡献者快照中，${top.login ?? "匿名贡献者"} 的贡献占 ${share}%。`,
    recommendation: share >= 80
      ? "核心维护高度集中，长期分叉前需要评估上游停更风险。"
      : "维护分布相对健康，可以作为稳定基线参考。"
  }
}

function assessScale(profile) {
  const sizeKb = profile.sizeKb
  if (!Number.isFinite(sizeKb)) {
    return {
      level: "caution",
      title: "项目体量不可用",
      detail: "GitHub 未返回仓库大小。",
      recommendation: "打开仓库手动确认目录结构。"
    }
  }

  if (sizeKb <= 1000) {
    return {
      level: "ok",
      title: "体量较轻",
      detail: `${sizeKb} KB，适合课程项目或快速二次开发。`,
      recommendation: "可整仓参考，重点只抽取需要的模块。"
    }
  }

  if (sizeKb <= 10000) {
    return {
      level: "watch",
      title: "体量中等",
      detail: `${sizeKb} KB，包含一定工程结构，需要按模块复用。`,
      recommendation: "先抽取 UI 或工具模块，不建议直接整仓继承。"
    }
  }

  return {
    level: "caution",
    title: "体量较大",
    detail: `${sizeKb} KB，不适合校园小团队一次性继承。`,
    recommendation: "只借鉴架构和关键实现，重新组织项目结构。"
  }
}

function assessActivity(profile, insight, asOf) {
  const { activeMonths, gapCount, peakMonth, sampledTo } = insight
  const latestMonth = sampledTo?.slice(0, 7)
  const recent = latestMonth === peakMonth
  const lastKnownActivity = profile.pushedAt ?? sampledTo
  const inactiveMonths = countMonthsBetween(lastKnownActivity, asOf)

  if (inactiveMonths >= 12) {
    return {
      level: "caution",
      title: `已约 ${inactiveMonths} 个月没有新推送`,
      detail: `最近公开推送记录为 ${lastKnownActivity?.slice(0, 10) ?? "未知"}，项目可能已停止活跃维护。`,
      recommendation: "核对 issue、衍生分叉和替代项目后再决定是否依赖。"
    }
  }

  if (inactiveMonths >= 6) {
    return {
      level: "watch",
      title: `最近约 ${inactiveMonths} 个月活动较少`,
      detail: `最近公开推送记录为 ${lastKnownActivity?.slice(0, 10) ?? "未知"}，需要确认维护是否放缓。`,
      recommendation: "先检查近期 issue 和版本记录，再决定是否复用。"
    }
  }

  if (activeMonths <= 1) {
    return {
      level: "caution",
      title: "活跃度极低",
      detail: `样本内只有 ${activeMonths} 个活跃月，可能是个人实验项目。`,
      recommendation: "适合学习，不建议作为长期基线。"
    }
  }

  if (recent && gapCount === 0) {
    return {
      level: "ok",
      title: "持续生长",
      detail: "采样期内没有明显断层，活跃峰值即最近开发。",
      recommendation: "项目仍在演进，可关注 release 节奏。"
    }
  }

  return {
    level: "watch",
    title: `峰值在 ${peakMonth ?? "未知"}`,
    detail: `有 ${gapCount} 个停更断层，活跃峰值不是最近一个月。`,
    recommendation: "确认最近是否有持续维护再决定。"
  }
}

function countMonthsBetween(isoDate, asOf) {
  if (!isoDate || !asOf) return 0
  const start = new Date(isoDate)
  const end = new Date(asOf)
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) return 0
  return Math.max(0, (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth())
}

function combineOverall(risks) {
  if (risks.some(item => item.level === "caution")) {
    return "caution"
  }
  if (risks.some(item => item.level === "watch")) {
    return "watch"
  }
  return "ok"
}
