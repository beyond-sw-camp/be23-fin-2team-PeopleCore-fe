# -*- coding: utf-8 -*-
"""표지 슬라이드 — 프로젝트명/팀/팀원/멘토."""
from pptx.util import Inches
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from ..builder import new_slide, add_rect, add_text, add_line_h, set_runs
from ..tokens import (
    GREEN, GREEN_BORDER, GREEN_PALE,
    GRAY_900, GRAY_700, GRAY_500, GRAY_400,
    WHITE,
)


def build(prs, *,
          project_name: str,
          subtitle: str,
          team_name: str,
          members: list,
          mentor: str):
    """표지 슬라이드 생성."""
    slide = new_slide(prs)
    cx = prs.slide_width

    # 로고 (P 박스)
    logo_size = Inches(1.15)
    logo_x = (cx - logo_size) / 2
    logo = add_rect(slide, logo_x, Inches(1.6), logo_size, logo_size,
                    fill=GREEN, corner_pt=0.18)
    set_runs(logo, [{"text": "P", "size": 56, "bold": True, "color": WHITE,
                     "spacing": -100}],
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.0)

    # eyebrow
    add_text(slide, Inches(0.5), Inches(2.95), Inches(12.3), Inches(0.3),
             [{"text": "FINAL PROJECT  ·  2팀", "size": 11, "bold": True,
               "color": GREEN, "spacing": 300}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 프로젝트명
    add_text(slide, Inches(0.5), Inches(3.35), Inches(12.3), Inches(0.8),
             [{"text": project_name, "size": 40, "bold": True,
               "color": GRAY_900, "spacing": -50}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 서브타이틀
    add_text(slide, Inches(0.5), Inches(4.2), Inches(12.3), Inches(0.4),
             [{"text": subtitle, "size": 14, "color": GRAY_700}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 디바이더
    add_line_h(slide, (cx - Inches(2.4)) / 2, Inches(4.95), Inches(2.4),
               color=GREEN_BORDER, height_emu=18000)

    # 팀명
    add_text(slide, Inches(0.5), Inches(5.15), Inches(12.3), Inches(0.4),
             [{"text": team_name, "size": 16, "bold": True, "color": GRAY_900}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 팀원 (· 으로 구분)
    members_text = "  ·  ".join(members)
    add_text(slide, Inches(0.5), Inches(5.65), Inches(12.3), Inches(0.4),
             [{"text": members_text, "size": 13, "color": GRAY_700}],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    # 멘토
    add_text(slide, Inches(0.5), Inches(6.1), Inches(12.3), Inches(0.3),
             [
                 {"text": "Mentor  ", "size": 10, "bold": True, "color": GREEN,
                  "spacing": 200},
                 {"text": mentor, "size": 11, "color": GRAY_500},
             ],
             align=PP_ALIGN.CENTER, line_spacing=1.0)

    return slide
