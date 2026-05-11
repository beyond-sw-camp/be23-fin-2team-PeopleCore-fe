# -*- coding: utf-8 -*-
"""6-1. 결과물 개선/보완할 점 — 좌:현재 상황 / 우:개선할 점 비교 표.

행 구조: { topic, current, improve }
  topic   : 한 줄 키워드 (예: "테스트 자동화")
  current : 현재 상황 (한 줄, 비전공자도 알아듣게)
  improve : 개선할 점 (한 줄)

목차 명시: "테이블 표 형태로 페이지 구성, 왼쪽 표는 현재 상황 / 오른쪽 표는 개선할 점,
키워드만 (두괄식 / 가독성 좋게)".
"""
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from ..builder import (
    new_slide, add_rect, add_text, add_paragraphs, add_pill,
    add_header, add_footer,
)
from ..tokens import (
    GREEN, GREEN_PALE, GREEN_PALE_SOFT, GREEN_BORDER,
    GRAY_900, GRAY_700, GRAY_500, GRAY_400, GRAY_300, GRAY_200, GRAY_100, GRAY_50,
    WHITE,
)


def build(prs, *,
          eyebrow: str = "SELF EVALUATION",
          title: str = "6-1. 결과물 개선·보완할 점",
          left_eyebrow: str = "AS - IS",
          left_title: str = "현재 상황",
          right_eyebrow: str = "TO - BE",
          right_title: str = "개선할 점",
          rows: list,
          page: str = None):
    """
    rows = [
        {"topic": "...", "current": "...", "improve": "..."},  # 또는
        {"topic": "...", "left": "...", "right": "..."},
        ...
    ]
    """
    slide = new_slide(prs)
    add_header(slide, prs, eyebrow=eyebrow, title=title, page=page)
    add_footer(slide, prs)

    body_top = Inches(1.55)
    body_h = Inches(5.0)

    # 컬럼 헤더 (좌/우)
    col_gap = Inches(0.4)
    col_w = (Inches(12.1) - col_gap) / 2
    left_x = Inches(0.6)
    right_x = left_x + col_w + col_gap

    header_h = Inches(0.55)

    # 좌측 헤더
    lh = add_rect(slide, left_x, body_top, col_w, header_h,
                  fill=GRAY_100, corner_pt=0.18)
    add_text(slide, left_x + Inches(0.25), body_top, col_w - Inches(0.5), header_h,
             [
                 {"text": left_eyebrow + "  ", "size": 11, "bold": True,
                  "color": GRAY_500, "spacing": 250},
                 {"text": left_title, "size": 13, "bold": True, "color": GRAY_900},
             ],
             anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)

    # 우측 헤더
    rh = add_rect(slide, right_x, body_top, col_w, header_h,
                  fill=GREEN_PALE, corner_pt=0.18)
    add_text(slide, right_x + Inches(0.25), body_top, col_w - Inches(0.5), header_h,
             [
                 {"text": right_eyebrow + "  ", "size": 11, "bold": True,
                  "color": GREEN, "spacing": 250},
                 {"text": right_title, "size": 13, "bold": True, "color": GRAY_900},
             ],
             anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)

    # 행 그리기
    rows_top = body_top + header_h + Inches(0.18)
    rows_h = body_h - header_h - Inches(0.18)
    if not rows:
        return slide
    row_h = (rows_h - Inches(0.1) * (len(rows) - 1)) / len(rows)
    gap = Inches(0.1)

    for i, row in enumerate(rows):
        y = rows_top + i * (row_h + gap)
        left_body = row.get("left", row.get("current", ""))
        right_body = row.get("right", row.get("improve", ""))
        # 좌측 셀
        _draw_cell(slide, left_x, y, col_w, row_h,
                   topic=row["topic"], body=left_body,
                   accent=GRAY_400, fill=GRAY_50, border=GRAY_200)
        # 우측 셀
        _draw_cell(slide, right_x, y, col_w, row_h,
                   topic=row["topic"], body=right_body,
                   accent=GREEN, fill=WHITE, border=GREEN_BORDER)

    return slide


def _draw_cell(slide, x, y, w, h, *, topic, body, accent, fill, border):
    """셀 1개 — 좌측 액센트 바 + 토픽 칩 + 본문."""
    add_rect(slide, x, y, w, h, fill=fill, line_color=border, corner_pt=0.06)
    # 좌측 액센트 바
    add_rect(slide, x, y + Inches(0.1), Inches(0.06), h - Inches(0.2), fill=accent)

    # 토픽 + 본문 (paragraph 2개)
    text_box = add_rect(slide, x + Inches(0.28), y, w - Inches(0.4), h)
    add_paragraphs(text_box, [
        {
            "runs": [
                {"text": topic, "size": 12, "bold": True, "color": accent,
                 "spacing": 100},
            ],
            "line_spacing": 1.0,
        },
        {
            "runs": [
                {"text": body, "size": 12.5, "color": GRAY_700},
            ],
            "line_spacing": 1.4,
            "space_before": 4,
        },
    ], margin=(0.1, 0.18, 0.1, 0.18))
