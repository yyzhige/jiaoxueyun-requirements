import { RELEASE_STATUS } from "../model.mjs";

export const PLANNED_DELIVERY_BANNER =
  "交付状态：PLANNED；本文是目标产品需求合同，不表示该能力已上线或属于第一阶段交付。";

export function renderReleaseBanner(module) {
  return module?.releaseStatus === RELEASE_STATUS.PLANNED
    ? PLANNED_DELIVERY_BANNER
    : "";
}

export function isCurrentReleaseModule(module, model) {
  return module?.releaseStatus === RELEASE_STATUS.BUILD_READY
    && Array.isArray(model?.currentReleaseModuleIds)
    && model.currentReleaseModuleIds.includes(module.id);
}
