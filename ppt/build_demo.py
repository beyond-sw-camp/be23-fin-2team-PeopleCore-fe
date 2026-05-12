# -*- coding: utf-8 -*-
"""1차 5종 템플릿 데모 — 한 .pptx 안에 표지/개요/모듈/개선점/완성도 점수 5장.

실행:
    python -m ppt.build_demo
또는:
    python ppt/build_demo.py
"""
import os
import sys

# 모듈 임포트 경로 보정 (직접 실행 시)
if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pptx import Presentation
from pptx.util import Inches

from ppt.templates import (
    cover, bullet_block, module_grid, compare_table, score_central,
)


def build():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # ── 1. 표지 ──
    cover.build(
        prs,
        project_name="PeopleCore",
        subtitle="회사 정책에 맞춰 커스텀할 수 있는 통합 HR 매니지먼트 플랫폼",
        team_name="2팀",
        members=["김OO (BE)", "박OO (BE)", "이OO (FE)", "최OO (FE)", "정OO (FE)"],
        mentor="홍길동",
    )

    # ── 2-1. 주제 선정 이유 (bullet_block) ──
    bullet_block.build(
        prs,
        eyebrow="PROJECT OVERVIEW",
        title="2-1. 프로젝트 주제 선정 이유",
        headline="회사마다 다른 인사 정책을, 회사가 직접 맞춰 쓸 수 있는 HR 시스템이 필요했습니다.",
        bullets=[
            {"title": "시중 HR 솔루션의 한계",
             "body": "정해진 양식 그대로 써야 해서, 회사별 운영 방식과 어긋나는 경우가 많았습니다."},
            {"title": "커스텀 가능한 플랫폼",
             "body": "근무·휴가·결재 정책을 회사 담당자가 직접 설정할 수 있게 만들었습니다."},
            {"title": "사용자 편의성",
             "body": "AI 챗봇·자동화로 휴가 신청·일정 등록 같은 반복 업무를 줄였습니다."},
            {"title": "보안 강화",
             "body": "사내 서버에 직접 설치할 수 있고, AI 영역은 분리 설계해 개인정보 노출을 막았습니다."},
        ],
        highlight_box="“우리 회사에 맞춰지는 HR 시스템”\n— 도입 부서가 직접 정책을 만지고, 직원은 챗봇으로 업무를 끝낸다.",
        page="2 / p",
    )

    # ── 5-1. HR 통합 플랫폼 (module_grid 9개) ──
    module_grid.build(
        prs,
        eyebrow="CORE SERVICE",
        title="5-1. HR 통합 플랫폼 — 핵심 9개 모듈",
        headline="인사부터 급여, 평가, 일정 관리까지 — 하나의 시스템으로 끝낸다.",
        modules=[
            {"name": "사원관리", "desc": "입사부터 발령·이직까지 한 곳에서 관리"},
            {"name": "근태관리", "desc": "출퇴근 자동 기록과 지각·초과근무 집계"},
            {"name": "전자결재", "desc": "휴가·품의·증빙을 클릭 한 번으로 신청·승인"},
            {"name": "파일함", "desc": "회사 문서·증명서를 안전하게 보관·공유"},
            {"name": "성과평가", "desc": "시즌 단위 평가, 점수 1차 산정 자동화"},
            {"name": "급여 / 퇴직금", "desc": "근태·세무 연동으로 자동 계산되는 명세서"},
            {"name": "휴가 / 일정", "desc": "캘린더에서 신청·확인이 한 번에 보이게"},
            {"name": "메신저", "desc": "팀 단위 빠른 소통과 알림 통합"},
            {"name": "AI 코파일럿", "desc": "“내 휴가 며칠 남았어?” 한 마디로 업무 처리"},
        ],
        page="n / p",
    )

    # ── 6-1. 개선·보완할 점 (compare_table) ──
    compare_table.build(
        prs,
        eyebrow="SELF EVALUATION",
        title="6-1. 결과물 개선·보완할 점",
        rows=[
            {
                "topic": "테스트 자동화",
                "current": "기능 동작은 직접 클릭으로 검증, 자동 테스트는 일부만",
                "improve": "주요 시나리오를 자동으로 매번 검사하도록 확장",
            },
            {
                "topic": "실시간 알림",
                "current": "결재·근태 알림은 새로고침 시점에 표시되는 케이스가 있음",
                "improve": "알림이 즉시 화면에 뜨도록 실시간 채널 연결",
            },
            {
                "topic": "모바일 화면",
                "current": "PC 기준 디자인, 좁은 화면에서 일부 레이아웃이 깨짐",
                "improve": "스마트폰·태블릿 가로/세로 모두 자연스러운 화면 제공",
            },
            {
                "topic": "배포 자동화",
                "current": "코드 변경 시 배포 일부 단계가 수동으로 이뤄짐",
                "improve": "코드 올리면 검사·배포·알림까지 한 번에 진행",
            },
            {
                "topic": "성능 최적화",
                "current": "사원 수가 많아질수록 통계 화면 응답이 느려짐",
                "improve": "자주 보는 통계는 미리 계산해두어 즉시 표시",
            },
        ],
        page="n+3 / p",
    )

    # ── 6-3. 완성도 평가 (score_central) ──
    score_central.build(
        prs,
        eyebrow="SELF EVALUATION",
        title="6-3. 프로젝트 결과물 완성도 평가",
        score=8.5,
        max_score=10,
        one_line="지금까지 짚어본 강점·보완점을 종합한 우리 팀의 자체 평가입니다.",
        tags=["통합 HR", "정책 커스텀", "AI 자동화", "보안 강화", "MSA"],
        page="n+3 / p",
    )

    out = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "PeopleCore_발표_데모.pptx",
    )
    prs.save(out)
    print("saved:", out)
    return out


if __name__ == "__main__":
    build()
