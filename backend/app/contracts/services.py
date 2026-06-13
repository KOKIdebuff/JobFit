from typing import Protocol


class UserAccessService(Protocol):
    """Public user access boundary; methods will be frozen with the auth contract."""


class ResumeReadService(Protocol):
    """Public resume read boundary; methods will be frozen with resume DTOs."""


class JobReadService(Protocol):
    """Public job read boundary; methods will be frozen with job DTOs."""


class ApplicationAccessService(Protocol):
    """Public application authorization boundary."""


class ProfileReadService(Protocol):
    """Public candidate profile read boundary."""


class MatchReadService(Protocol):
    """Public match result read boundary."""


class InterviewEvidenceService(Protocol):
    """Public confirmed interview evidence boundary."""


class TrialEvidenceService(Protocol):
    """Public final trial evidence boundary."""


class ReportPublicationService(Protocol):
    """Public report publication boundary."""
