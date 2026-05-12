# -*- coding: utf-8 -*-
"""다목적 불릿 블록 — 제목 + 큰 문구(headline) + 항목 리스트.
2-1 주제선정 이유, 2-2 핵심 서비스 방향, 2-5 활용방안/기대효과, 6-4 회고 등에 재사용.

bullets 항목 형식:
  - "단일 텍스트"
  - {"title": "굵은 키워드", "body": "이어지는 부연 설명"}

비전공자 톤 가이드 (memory: feedback_ppt_audience_friendly.md):
  - 기술용어는 풀어쓰기, 코드 노출 금지, 사용자 시나리오로 연결
"""
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from ..builder import (
    new_slide, add_rect, add_text, add_paragraphs, add_header, add_footer,
)
from ..tokens import (
    GREEN, GREEN_PALE, GREEN_PALE_SOFT, GREEN_BORDER,
    GRAY_900, GRAY_700, GRAY_500, GRAY_200, GRAY_100,
    WHITE,
)


def build(prs, *,
          eyebrow: str,
          title: str,
          headline: str,
          bullets: list,
          page: str = None,
          highlight_box: str = None):
    """
    eyebrow      : 상단 작은 라벨 (예: "PROJECT OVERVIEW")
    title        : 큰 제목 (예: "2-1. 프로젝트 주제 선정 이유")
    headline     : 한 줄 핵심 문장 (가장 큰 카피, 청중이 한 줄만 읽어도 이해되도록)
    bullets      : 항목 리스트
    highlight_box: 우측 강조 박스 1개 (예: "한 줄 인사이트") - 선택
    """
    slide = new_slide(prs)
    add_header(slide, prs, eyebrow=eyebrow, title=title, page=page)
    add_footer(slide, prs)

    body_top = Inches(1.55)
    body_h = Inches(5.0)

    # 헤드라인 (큰 카피)
    add_text(slide, Inches(0.6), body_top, Inches(12.1), Inches(0.85),
             [{"text": headline, "size": 24, "bold": True,
               "color": GRAY_900, "spacing": -30}],
             line_spacing=1.25)

    # 그린 디바이더
    add_rect(slide, Inches(0.6), body_top + Inches(0.95),
             Inches(0.6), Inches(0.04), fill=GREEN)

    # 본문 영역 — bullet 만 또는 bullet + 우측 highlight
    list_top = body_top + Inches(1.2)
    list_h = body_h - Inches(1.2)

    if highlight_box:
        list_w = Inches(7.5)
        hl_x = Inches(0.6) + list_w + Inches(0.4)
        hl_w = Inches(12.1) - list_w - Inches(0.4)
        _draw_highlight(slide, hl_x, list_top, hl_w, list_h, highlight_box)
    else:
        list_w = Inches(12.1)

    # 불릿 박스
    box = add_rect(slide, Inches(0.6), list_top, list_w, list_h,
                   fill=GREEN_PALE_SOFT, line_color=GREEN_PALE, corner_pt=0.04)
    paragraphs = []
    for i, item in enumerate(bullets):
        if isinstance(item, dict):
            runs = [
                {"text": "—  ", "size": 13, "bold": True, "color": GREEN},
                {"text": item["title"], "size": 14, "bold": True, "color": GRAY_900},
                {"text": "  " + item["body"], "size": 12.5, "color": GRAY_700},
            ]
        else:
            runs = [
                {"text": "—  ", "size": 13, "bold": True, "color": GREEN},
                {"text": item, "size": 13, "color": GRAY_700},
            ]
        paragraphs.append({
            "runs": runs,
            "line_spacing": 1.4,
            "space_before": 8 if i > 0 else 0,
        })
    add_paragraphs(box, paragraphs, margin=(0.32, 0.28, 0.32, 0.28))

    return slide


def _draw_highlight(slide, x, y, w, h, text):
    """우측 강조 박스 — 한 줄 인사이트 카드."""
    box = add_rect(slide, x, y, w, h,
                   fill=WHITE, line_color=GREEN_BORDER, corner_pt=0.06)

    add_text(slide, x + Inches(0.3), y + Inches(0.32), w - Inches(0.6), Inches(0.3),
             [{"text": "INSIGHT", "size": 9, "bold": True,
               "color": GREEN, "spacing": 250}],
             line_spacing=1.0)
    add_text(slide, x + Inches(0.3), y + Inches(0.7), w - Inches(0.6), h - Inches(1.0),
             [{"text": text, "size": 14, "bold": True, "color": GRAY_900}],
             line_spacing=1.55)
