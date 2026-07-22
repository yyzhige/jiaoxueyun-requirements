import {
  MODEL_COLLECTIONS,
  RELEASE_STATUS,
  deepFreeze,
  defineRequirementModel,
} from "../model.mjs";
import {
  baselineChapters,
  deliveryState,
  phases,
  productBaseline,
  productDecisions,
  productInvariants,
  releaseStatuses,
  terminology,
} from "./product-baseline-v2.mjs";
import { migrationChanges } from "./baseline-migration.mjs";
import {
  buildBaselineTraceability,
  buildDecisionTraceability,
} from "./baseline-traceability.mjs";
import { launchGates, metricGroups } from "./launch-governance.mjs";
import {
  baselineDecisions,
  duties,
  events as catalogEvents,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  optionSets as catalogOptionSets,
  roles,
  sensitivities,
} from "./catalogs.mjs";
import { foundationFlows, foundationModules } from "./foundation.mjs";
import {
  aiReportingAiTasks,
  aiReportingFlows,
  aiReportingModules,
} from "./ai-reporting.mjs";
import {
  teachingLoopFlows,
  teachingLoopEvents,
  teachingLoopModules,
  teachingLoopOptionSets,
} from "./teaching-loop.mjs";
import {
  extensionAiTasks,
  extensionEvents,
  extensionFlows,
  extensionModules,
  extensionOptionSets,
} from "./extensions.mjs";
import {
  bindPhaseThreeFlowActions,
  phaseTwoAssessmentOptionSets,
  replacePhaseTwoAssessmentAiTasks,
  replacePhaseTwoAssessmentEvents,
  replacePhaseTwoAssessmentFlows,
  replacePhaseTwoAssessmentModules,
  replacePhaseTwoAssessmentOptionSets,
} from "./phase-two-assessment.mjs";
import {
  phaseTwoEvents,
  phaseTwoFlows,
  phaseTwoModules,
  phaseTwoOptionSets,
} from "./phase-two.mjs";
import {
  phaseThreeEvents,
  phaseThreeFlows,
  phaseThreeModules,
  phaseThreeOptionSets,
} from "./phase-three.mjs";
import {
  applyGovernanceBaselineContracts,
  finalizeDataCatalogCoverage,
  governanceBaselineEvents,
  governanceBaselineOptionSets,
} from "./governance-baseline-contracts.mjs";
import { identityLifecycleFlows } from "./identity-lifecycle.mjs";
import { applyTeacherWriteScopePolicies } from "./teacher-write-scope.mjs";
import { applySchoolTermReferenceRoles } from "./school-term-reference.mjs";
import {
  applyClosedClassificationFieldValueSources,
  applyClosedClassificationOptionSets,
} from "./closed-classification-options.mjs";
import { applyAnswerOpenDeliveryContracts } from "./answer-open-delivery.mjs";
import {
  applyVideoRecallSourceContracts,
  applyVideoRecallSourceEvents,
  applyVideoRecallSourceFlowContracts,
} from "./video-recall-source-fanout.mjs";
import {
  applyHighImpactAuthorizationConsumptionContracts,
  applyHighImpactAuthorizationContracts,
  highImpactAuthorizationEvents,
} from "./high-impact-authorization.mjs";
import {
  applyTransferLifecycleContracts,
  applyTransferLifecycleEventContracts,
  transferLifecycleEvents,
  transferLifecycleFlows,
} from "./transfer-lifecycle.mjs";

export const optionSets = deepFreeze(applyClosedClassificationOptionSets(
  replacePhaseTwoAssessmentOptionSets([
  ...catalogOptionSets,
  ...teachingLoopOptionSets,
  ...extensionOptionSets,
  ...phaseTwoAssessmentOptionSets,
  ...phaseTwoOptionSets,
  ...phaseThreeOptionSets,
  ...governanceBaselineOptionSets,
])),
);

export const events = deepFreeze(applyVideoRecallSourceEvents(
  applyTransferLifecycleEventContracts(replacePhaseTwoAssessmentEvents([
    ...catalogEvents,
    ...teachingLoopEvents,
    ...extensionEvents,
    ...phaseTwoEvents,
    ...phaseThreeEvents,
    ...governanceBaselineEvents,
    ...transferLifecycleEvents,
    ...highImpactAuthorizationEvents,
  ])),
));

export {
  baselineDecisions,
  duties,
  extensions,
  lifecyclePolicies,
  metrics,
  nfrs,
  roles,
  sensitivities,
};

const sourceModules = [
  ...foundationModules,
  ...teachingLoopModules,
  ...aiReportingModules,
  ...extensionModules,
  ...phaseTwoModules,
  ...phaseThreeModules,
];
export const modules = deepFreeze(finalizeDataCatalogCoverage(
  applyClosedClassificationFieldValueSources(
    applyVideoRecallSourceContracts(
      applyAnswerOpenDeliveryContracts(
        applySchoolTermReferenceRoles(
          applyTeacherWriteScopePolicies(
            applyHighImpactAuthorizationConsumptionContracts(
              applyTransferLifecycleContracts(
                applyHighImpactAuthorizationContracts(
                  applyGovernanceBaselineContracts(
                    bindPhaseThreeFlowActions(replacePhaseTwoAssessmentModules(sourceModules)),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
));
export const currentReleaseModuleIds = deepFreeze(
  modules
    .filter(({ releaseStatus }) => releaseStatus === RELEASE_STATUS.BUILD_READY)
    .map(({ id }) => id),
);
const sourceFlows = [
  ...foundationFlows,
  ...identityLifecycleFlows,
  ...teachingLoopFlows,
  ...aiReportingFlows,
  ...extensionFlows,
  ...phaseTwoFlows,
  ...transferLifecycleFlows,
];
const phaseThreeLearningPathFlow = sourceFlows.find(({ id }) => id === "DF-011");
export const flows = deepFreeze(applyVideoRecallSourceFlowContracts([
  ...replacePhaseTwoAssessmentFlows(sourceFlows),
  ...(phaseThreeLearningPathFlow ? [phaseThreeLearningPathFlow] : []),
  ...phaseThreeFlows,
]));
export const decisionTraceability = buildDecisionTraceability(modules);
export const baselineTraceability = buildBaselineTraceability(
  modules,
  decisionTraceability,
);
export const aiTasks = deepFreeze(replacePhaseTwoAssessmentAiTasks([
  ...aiReportingAiTasks,
  ...extensionAiTasks,
]));

export {
  baselineChapters,
  deliveryState,
  phases,
  productBaseline,
  productDecisions,
  productInvariants,
  releaseStatuses,
  terminology,
  migrationChanges,
  metricGroups,
  launchGates,
};

export const reviewStatus = deepFreeze({
  code: "PRODUCT_BASELINE_V2_FINALIZED_PRD_REVIEW_PASSED",
  label: "v2.0 finalized product baseline; production PRD semantic review passed",
  reviewedAt: "2026-07-20",
});

const collectionFacts = {
  baselineDecisions,
  roles,
  duties,
  lifecyclePolicies,
  sensitivities,
  optionSets,
  events,
  metrics,
  nfrs,
  modules,
  flows,
  aiTasks,
  extensions,
  phases,
  productDecisions,
  baselineChapters,
  baselineTraceability,
  decisionTraceability,
  migrationChanges,
  metricGroups,
  launchGates,
};

export const requirementModel = defineRequirementModel({
  profile: "ZHIXU_V2",
  reviewStatus,
  productBaseline,
  deliveryState,
  terminology,
  productInvariants,
  currentReleaseModuleIds,
  ...Object.fromEntries(
    MODEL_COLLECTIONS.map(({ key }) => [key, collectionFacts[key]]),
  ),
});
