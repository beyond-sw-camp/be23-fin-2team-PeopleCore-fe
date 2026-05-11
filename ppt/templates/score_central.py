# -*- coding: utf-8 -*-
"""6-3. 프로젝트 결과물 완성도 평가 — 중앙 큰 점수 + 하단 한 줄 코멘트.

목차 명시: "중앙에 점수 (n/10)". 발표 임팩트 슬라이드라 청중 시선이 점수 한 곳에 집중되도록.
"""
from pptx.util import Inches
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from ..builder import (
    new_slide, add_rect, add_text, add_pill, add_header, add_footer, set_runs,
)
from ..tokens import (
    GREEN, GREEN_PALE, GREEN_PALE_SOFT, GREEN_BORDER,
    GRAY_900, GRAY_700, GRAY_500, GRAY_400, GRAY_200, GRAY_100,
    WHITE,
)


def build(prs, *,
          eyebrow: str = "SELF EVALUATION",
          title: str = "6-3. 프로젝트 결과물 완성도 평가",
          score: float = 8.5,
          max_score: float = 10,
          one_line: str = "지금까지 짚어온 강점과 보완점들을 종합한 우리 팀의 자체 평가입니다.",
          tags: list = None,
          page: str = None):
    """
    score      : 8.5 같은 소수 점수
    max_score  : 분모 (기본 10)
    one_line   : 점수 아래 한 줄 (대본용 코멘트, 청중에게 맥락 전달)
    tags       : 점수가 압축한 키워드 (예: ["통합 HR", "MSA", "AI 자동화", "보안"])
                 - 하단에 작은 칩으로 노출. 발표자가 "이 점수는 이런 항목들을 종합한 것"임을 시각화.
    """
    slide = new_slide(prs)
    add_header(slide, prs, eyebrow=eyebrow, title=title, page=page)
    add_footer(slide, prs)

    cx = prs.slide_width

    # 중앙 점수 — 라벨
    add_text(slide, Inches(0), Inches(2.3), cx, Inches(0.35),
             [{"text": "COMPLETENESS  SCORE", "size": 12, "bold": True,
               "color": GREEN, "spacing": 350}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 중앙 점수 — 큰 숫자
    score_h = Inches(2.0)
    score_box_w = Inches(7)
    score_box_x = (cx - score_box_w) / 2
    score_box_y = Inches(2.7)
    score_shape = add_rect(slide, score_box_x, score_box_y, score_box_w, score_h)
    set_runs(score_shape, [
        {"text": _fmt(score), "size": 130, "bold": True, "color": GREEN,
         "spacing": -200},
        {"text": f"  / {_fmt(max_score)}", "size": 36, "bold": True, "color": GRAY_400},
    ], align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, line_spacing=0.95)

    # 점수 하단 짧은 그린 디바이더
    add_rect(slide, (cx - Inches(0.7)) / 2, score_box_y + score_h + Inches(0.05),
             Inches(0.7), Inches(0.06), fill=GREEN)

    # 한 줄 코멘트
    add_text(slide, Inches(1.5), Inches(5.05), cx - Inches(3), Inches(0.7),
             [{"text": one_line, "size": 14, "color": GRAY_700}],
             align=PP_ALIGN.CENTER, line_spacing=1.55)

    # 키워드 칩들
    if tags:
        chip_h = Inches(0.42)
        chip_gap = Inches(0.18)
        # 폭은 글자수 비례 추정 — 단순화: 글자당 0.13 inch + padding
        chip_widths = [Inches(0.55) + Inches(0.135 * len(t)) for t in tags]
        total_w = sum((cw for cw in chip_widths), Inches(0)) + chip_gap * (len(tags) - 1)
        x = (cx - total_w) / 2
        y = Inches(6.0)
        for t, cw in zip(tags, chip_widths):
            add_pill(slide, x, y, cw, chip_h, t,
                     fill=GREEN_PALE, fg=GREEN, border=GREEN_BORDER, size=11)
            x = x + cw + chip_gap

    return slide


def _fmt(v):
    """8.5 → '8.5', 10 → '10' 처럼 소수 끝 0 정리."""
    if float(v).is_integer():
        return str(int(v))
    return ("%.1f" % v).rstrip("0").rstrip(".")
