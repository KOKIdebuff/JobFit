from __future__ import annotations

import math
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

from app.modules.jobfit.profiles import COMPETENCY_PROFILES

KNOWLEDGE_VERSION = "jobfit-kb-2026.09.v1"


@dataclass(frozen=True, slots=True)
class KnowledgeChunk:
    source_id: str
    role: str
    competency_id: str
    text: str


def _tokens(text: str) -> list[str]:
    lowered = text.lower()
    words = re.findall(r"[a-z0-9+#.]{2,}|[\u4e00-\u9fff]{2,}", lowered)
    chinese = "".join(re.findall(r"[\u4e00-\u9fff]", lowered))
    words.extend(chinese[index : index + 2] for index in range(max(0, len(chinese) - 1)))
    return [token for token in words if token]


def _chunks() -> list[KnowledgeChunk]:
    chunks: list[KnowledgeChunk] = []
    for role, profile in COMPETENCY_PROFILES.items():
        for item in profile["competencies"]:
            rubric = " ".join(f"{key} {value}" for key, value in item["rubric"].items())
            text = " ".join(
                [
                    item["name"],
                    item["description"],
                    rubric,
                    " ".join(item["evidence_requirements"]),
                    "常见误区：只复述概念但没有具体场景、个人行动、取舍和结果。",
                    "追问策略：要求实例、设置故障场景、询问权衡、测试能力边界。",
                ]
            )
            chunks.append(
                KnowledgeChunk(
                    source_id=f"{KNOWLEDGE_VERSION}:{role}:{item['id']}",
                    role=role,
                    competency_id=item["id"],
                    text=text,
                )
            )
    return chunks


CHUNKS = _chunks()


def retrieve(role: str, competency_id: str, query: str, limit: int = 3) -> list[dict[str, Any]]:
    """Use a small deterministic BM25 index scoped to the requested job role."""
    query_tokens = set(_tokens(query))
    candidates = [chunk for chunk in CHUNKS if chunk.role == role]
    token_sets = [_tokens(chunk.text) for chunk in candidates]
    average_length = sum(len(tokens) for tokens in token_sets) / max(1, len(token_sets))
    document_frequency = Counter(token for tokens in token_sets for token in set(tokens))
    scored: list[tuple[float, KnowledgeChunk]] = []
    for chunk, chunk_tokens in zip(candidates, token_sets, strict=True):
        frequencies = Counter(chunk_tokens)
        score = 0.0
        for token in query_tokens:
            frequency = frequencies[token]
            if not frequency:
                continue
            idf = math.log(
                1
                + (len(candidates) - document_frequency[token] + 0.5)
                / (document_frequency[token] + 0.5)
            )
            denominator = frequency + 1.2 * (1 - 0.75 + 0.75 * len(chunk_tokens) / average_length)
            score += idf * frequency * 2.2 / denominator
        focus = 3 if chunk.competency_id == competency_id else 0
        scored.append((focus + score, chunk))
    scored.sort(key=lambda item: (-item[0], item[1].source_id))
    return [
        {
            "source_id": chunk.source_id,
            "score": round(score, 4),
            "text": chunk.text,
        }
        for score, chunk in scored[:limit]
    ]
