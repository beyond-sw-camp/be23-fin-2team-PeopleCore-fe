# -*- coding: utf-8 -*-
"""5-1. HR 통합 플랫폼 — 9개 핵심 모듈 그리드.

modules 항목 = {"name": "근태관리", "desc": "출퇴근 자동 기록·집계"}
청중이 한눈에 "이 시스템이 다루는 영역"을 보도록 카드 그리드.
비전공자 톤: desc 는 사용자 행동/혜택 중심으로 작성 (코드/도메인 용어 X).
"""
from pptx.util import Inches
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from ..builder import (
    new_slide, add_rect, add_text, add_paragraphs,
    add_header, add_footer,
)
from ..tokens import (
    GREEN, GREEN_PALE, GREEN_BORDER,
    GRAY_900, GRAY_700, GRAY_500, GRAY_200, GRAY_100,
    WHITE,
)


def build(prs, *,
          eyebrow: str = "CORE SERVICE",
          title: str = "5-1. HR 통합 플랫폼 — 핵심 9개 모듈",
          headline: str = "회사가 인사·근태부터 평가·급여까지, 하나의 화면에서 처리합니다.",
          modules: list,
          page: str = None,
          columns: int = 3):
    """
    modules : 9개 (3x3 권장). columns 는 3 또는 4.
    """
    slide = new_slide(prs)
    add_header(slide, prs, eyebrow=eyebrow, title=title, page=page)
    add_footer(slide, prs)

    # 헤드라인 (한 줄, 청중에게 시스템 가치를 한 문장으로)
    add_text(slide, Inches(0.6), Inches(1.55), Inches(12.1), Inches(0.5),
             [{"text": headline, "size": 14, "color": GRAY_700}],
             line_spacing=1.4)

    # 그리드
    grid_top = Inches(2.2)
    grid_h = Inches(4.4)
    grid_w = Inches(12.1)
    grid_x = Inches(0.6)

    rows = (len(modules) + columns - 1) // columns
    gap = Inches(0.18)
    cell_w = (grid_w - gap * (columns - 1)) / columns
    cell_h = (grid_h - gap * (rows - 1)) / rows

    for i, m in enumerate(modules):
        r = i // columns
        c = i % columns
        x = grid_x + c * (cell_w + gap)
        y = grid_top + r * (cell_h + gap)
        _draw_card(slide, x, y, cell_w, cell_h,
                   index=i + 1, name=m["name"], desc=m["desc"])

    return slide


def _draw_card(slide, x, y, w, h, *, index, name, desc):
    add_rect(slide, x, y, w, h,
             fill=WHITE, line_color=GREEN_BORDER, corner_pt=0.07)

    # 인덱스 칩 (좌상단)
    idx_w = Inches(0.55)
    idx_h = Inches(0.32)
    add_text(slide, x + Inches(0.22), y + Inches(0.22), idx_w, idx_h,
             [{"text": "%02d" % index, "size": 11, "bold": True,
               "color": GREEN, "spacing": 100}],
             fill=GREEN_PALE, corner_pt=0.4,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE,
             line_spacing=1.0,
             margin=(0.0, 0.0, 0.0, 0.0))

    # 모듈명
    add_text(slide, x + Inches(0.22), y + Inches(0.7), w - Inches(0.44), Inches(0.5),
             [{"text": name, "size": 17, "bold": True, "color": GRAY_900,
               "spacing": -30}],
             line_spacing=1.0)

    # 설명
    add_text(slide, x + Inches(0.22), y + Inches(1.18), w - Inches(0.44), h - Inches(1.3),
             [{"text": desc, "size": 11.5, "color": GRAY_500}],
             line_spacing=1.5)
