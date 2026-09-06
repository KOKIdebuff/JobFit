from __future__ import annotations

from typing import Any


def _rubric(topic: str) -> dict[str, str]:
    return {
        "L0": "没有可验证证据",
        "L1": f"知道{topic}的基本概念",
        "L2": f"能够解释{topic}的关键原理",
        "L3": f"能够在真实项目中应用{topic}",
        "L4": f"能够定位并解决{topic}的复杂问题",
        "L5": f"能够权衡、设计并优化{topic}方案",
    }


def _item(identifier: str, name: str, description: str, weight: float) -> dict[str, Any]:
    return {
        "id": identifier,
        "name": name,
        "description": description,
        "weight": weight,
        "rubric": _rubric(name),
        "question_strategy": [
            "CLARIFICATION",
            "EVIDENCE_REQUEST",
            "SCENARIO",
            "TRADE_OFF",
            "DEBUGGING",
            "BOUNDARY_TESTING",
        ],
        "evidence_requirements": [
            "说明具体场景和个人职责",
            "给出采取的行动、取舍依据和结果",
            "能够处理一个更高难度的追问或反例",
        ],
    }


COMPETENCY_PROFILES: dict[str, dict[str, Any]] = {
    "ai_engineer": {
        "id": "ai_engineer",
        "name": "AI / 人工智能算法工程师",
        "version": "2026.09.v1",
        "competencies": [
            _item("technical_foundation", "技术基础", "数学、算法与机器学习基础", 0.14),
            _item("ai_llm_knowledge", "AI / LLM 知识", "模型、RAG、评估与应用边界", 0.20),
            _item("engineering", "工程能力", "数据、服务、部署、质量与可观测性", 0.18),
            _item("project_experience", "项目经验", "真实项目职责、结果与复盘", 0.16),
            _item("problem_solving", "问题解决", "定位、拆解和验证复杂问题", 0.16),
            _item("communication", "沟通表达", "结构化说明和跨角色协作", 0.08),
            _item("learning", "学习能力", "快速学习与知识迁移", 0.08),
        ],
    },
    "java_engineer": {
        "id": "java_engineer",
        "name": "Java 开发工程师",
        "version": "2026.09.v1",
        "competencies": [
            _item("java_foundation", "Java 基础", "语言、集合、并发和异常处理", 0.14),
            _item("jvm", "JVM", "内存、GC、类加载和性能诊断", 0.12),
            _item("framework", "框架", "Spring 生态与框架原理", 0.14),
            _item("database", "数据库", "SQL、事务、索引和数据建模", 0.13),
            _item("distributed_systems", "分布式系统", "缓存、消息、一致性与容错", 0.15),
            _item("engineering", "工程能力", "测试、交付、可观测性与质量", 0.13),
            _item("problem_solving", "问题解决", "故障定位与方案权衡", 0.11),
            _item("communication", "沟通表达", "结构化表达与协作", 0.08),
        ],
    },
    "product_manager": {
        "id": "product_manager",
        "name": "产品经理",
        "version": "2026.09.v1",
        "competencies": [
            _item("user_insight", "用户洞察", "发现真实用户问题与场景", 0.14),
            _item("requirement_analysis", "需求分析", "需求拆解与边界定义", 0.14),
            _item("product_design", "产品设计", "方案、流程和体验设计", 0.14),
            _item("data_thinking", "数据思维", "指标设计、分析与验证", 0.12),
            _item("prioritization", "优先级判断", "资源、价值与风险权衡", 0.12),
            _item("business_thinking", "商业思维", "业务价值与可持续性", 0.12),
            _item("communication", "沟通表达", "推动共识和跨团队协作", 0.11),
            _item("execution", "执行力", "落地、跟踪与复盘", 0.11),
        ],
    },
}


def profile_for(role: str) -> dict[str, Any]:
    return COMPETENCY_PROFILES[role]
