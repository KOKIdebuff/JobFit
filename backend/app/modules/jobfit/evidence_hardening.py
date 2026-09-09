from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator

from app.modules.jobfit.llm import (
    SemanticContradictionKind,
    SemanticDimension,
    SemanticJudgmentResponse,
)

EVIDENCE_BOUNDARY_JUDGMENT_SCHEMA_VERSION = "evidence_boundary_judgment_v1"
EVIDENCE_BOUNDARY_POLICY_VERSION = "jobfit_evidence_boundary_policy_v1"

EvidenceStrengthBand = Literal["weak", "partial", "sufficient"]
OwnershipStatus = Literal["explicit", "not_demonstrated"]
ContradictionStatus = Literal["none_detected", "needs_clarification"]
CompetencyBoundaryStatus = Literal["demonstrated", "not_demonstrated"]
HardeningReasonCode = Literal[
    "semantic_contradiction",
    "ownership_not_demonstrated",
    "evidence_below_sufficient",
    "boundary_not_demonstrated",
]

_OWNERSHIP_ASSERTION = re.compile(
    r"(?:我|本人)(?![^。；，]{0,8}(?:没有|未|并未|不曾|不负责|不参与))"
    r"[^。；，]{0,24}(?:负责|主导|亲自|设计|实现|定位|排查|验证|优化|上线|复盘|协调|推动|交付)"
)
_BOUNDARY_SIGNAL = re.compile(
    r"边界|适用|不适用|前提|限制|约束|风险|取舍|权衡|回退|降级|故障|失败|恢复|止损"
)


class EvidenceBoundaryPolicyError(ValueError):
    """Raised when the strict local hardening policy cannot form a safe payload."""


class EvidenceBoundaryJudgmentPayload(BaseModel):
    """Private, minimal, replayable hardening result; never contains candidate text."""

    model_config = ConfigDict(extra="forbid")

    evidence_strength_band: EvidenceStrengthBand
    ownership: OwnershipStatus
    contradiction: ContradictionStatus
    contradiction_kinds: list[SemanticContradictionKind] = Field(max_length=3)
    competency_boundary: CompetencyBoundaryStatus
    reason_codes: list[HardeningReasonCode] = Field(max_length=4)

    @model_validator(mode="after")
    def validate_consistency(self) -> EvidenceBoundaryJudgmentPayload:
        if len(set(self.contradiction_kinds)) != len(self.contradiction_kinds):
            raise ValueError("contradiction_kinds must not contain duplicates")
        if self.contradiction == "none_detected" and self.contradiction_kinds:
            raise ValueError("none_detected contradiction cannot include kinds")
        if self.contradiction == "needs_clarification" and not self.contradiction_kinds:
            raise ValueError("needs_clarification contradiction requires a kind")
        if len(set(self.reason_codes)) != len(self.reason_codes):
            raise ValueError("reason_codes must not contain duplicates")

        expected: list[HardeningReasonCode] = []
        if self.contradiction == "needs_clarification":
            expected.append("semantic_contradiction")
        if self.ownership == "not_demonstrated":
            expected.append("ownership_not_demonstrated")
        if self.evidence_strength_band != "sufficient":
            expected.append("evidence_below_sufficient")
        if self.competency_boundary == "not_demonstrated":
            expected.append("boundary_not_demonstrated")
        if self.reason_codes != expected:
            raise ValueError("reason_codes must match the structured policy result")
        return self


@dataclass(frozen=True, slots=True)
class EvidenceBoundaryFocusDecision:
    base_focus: SemanticDimension | None
    effective_focus: SemanticDimension | None
    applied: bool


def _strength_band(value: float) -> EvidenceStrengthBand:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise EvidenceBoundaryPolicyError("evidence strength must be numeric")
    if not 0.0 <= float(value) <= 1.0:
        raise EvidenceBoundaryPolicyError("evidence strength must be bounded")
    if value < 0.45:
        return "weak"
    if value < 0.65:
        return "partial"
    return "sufficient"


def build_evidence_boundary_judgment(
    *,
    answer: str,
    evidence_strength: float,
    semantic_judgment: SemanticJudgmentResponse,
) -> EvidenceBoundaryJudgmentPayload:
    """Classify only what the current answer text demonstrates; never verify external facts."""
    if not isinstance(answer, str):
        raise EvidenceBoundaryPolicyError("candidate answer must be text")

    contradiction_kinds = list(
        dict.fromkeys(item.kind for item in semantic_judgment.contradictions)
    )
    contradiction: ContradictionStatus = (
        "needs_clarification" if contradiction_kinds else "none_detected"
    )
    ownership: OwnershipStatus = (
        "explicit" if _OWNERSHIP_ASSERTION.search(answer) else "not_demonstrated"
    )
    competency_boundary: CompetencyBoundaryStatus = (
        "demonstrated" if _BOUNDARY_SIGNAL.search(answer) else "not_demonstrated"
    )
    strength = _strength_band(evidence_strength)

    reason_codes: list[HardeningReasonCode] = []
    if contradiction == "needs_clarification":
        reason_codes.append("semantic_contradiction")
    if ownership == "not_demonstrated":
        reason_codes.append("ownership_not_demonstrated")
    if strength != "sufficient":
        reason_codes.append("evidence_below_sufficient")
    if competency_boundary == "not_demonstrated":
        reason_codes.append("boundary_not_demonstrated")

    try:
        return EvidenceBoundaryJudgmentPayload(
            evidence_strength_band=strength,
            ownership=ownership,
            contradiction=contradiction,
            contradiction_kinds=contradiction_kinds,
            competency_boundary=competency_boundary,
            reason_codes=reason_codes,
        )
    except ValidationError as exc:
        raise EvidenceBoundaryPolicyError("hardening payload is invalid") from exc


def select_effective_focus(
    *,
    judgment: EvidenceBoundaryJudgmentPayload,
    base_focus: SemanticDimension | None,
    applies_to_same_competency: bool,
) -> EvidenceBoundaryFocusDecision:
    """Override only an already-decided same-competency whitelist focus."""
    if base_focus is None or not applies_to_same_competency:
        return EvidenceBoundaryFocusDecision(
            base_focus=base_focus,
            effective_focus=base_focus,
            applied=False,
        )

    if judgment.contradiction == "needs_clarification":
        effective_focus: SemanticDimension = "boundary"
    elif judgment.ownership == "not_demonstrated":
        effective_focus = "personal_action"
    elif judgment.evidence_strength_band != "sufficient":
        effective_focus = "measurable_result"
    elif judgment.competency_boundary == "not_demonstrated":
        effective_focus = "boundary"
    else:
        effective_focus = base_focus

    return EvidenceBoundaryFocusDecision(
        base_focus=base_focus,
        effective_focus=effective_focus,
        applied=effective_focus != base_focus,
    )
