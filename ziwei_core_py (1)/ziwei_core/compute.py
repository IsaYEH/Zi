
from dataclasses import dataclass
from typing import Dict, Any, Optional, List, Tuple
from .loader import load_json, try_load_anchor

BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"]
STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"]

def bidx(b:str)->int:
    return BRANCHES.index(b)

@dataclass
class ComputeOptions:
    external_data_dir: Optional[str] = None
    four_hua_variant: str = "108s_tw"   # or "alt_common"

def _cw(start_idx:int, steps:int)->int:
    return (start_idx + steps) % 12

def _ccw(start_idx:int, steps:int)->int:
    return (start_idx - steps) % 12

def _branch_by_idx(i:int)->str:
    return BRANCHES[i%12]

def _ming_shen(lunar_month:int, hour_branch:str)->Tuple[str,str]:
    """
    寅宮起正月，順數至出生月；再由該宮起子，逆至生時為命宮；順至生時為身宮。
    """
    assert 1 <= lunar_month <= 12, "lunar_month must be 1..12"
    m_anchor = _cw(bidx("寅"), lunar_month-1)  # 寅為正月起點
    h_steps = bidx(hour_branch)  # 子=0, 丑=1, ...
    ming = _ccw(m_anchor, h_steps)
    shen = _cw(m_anchor, h_steps)
    return _branch_by_idx(ming), _branch_by_idx(shen)

def compute_chart(lunar_month:int, hour_branch:str, year_stem:str, year_branch:str, opts:ComputeOptions=ComputeOptions())->Dict[str,Any]:
    # load rules
    main = load_json("data/rules_main_stars.json")
    aux  = load_json("data/rules_auxiliary_stars.json")
    four = load_json("data/rules_four_hua.json")
    five = load_json("data/rules_five_bureau.json")

    # 命/身
    ming_b, shen_b = _ming_shen(lunar_month, hour_branch)

    # 紫微 anchor（後台）
    ziwei_anchor = try_load_anchor(opts.external_data_dir)
    if ziwei_anchor:
        ziwei_branch = ziwei_anchor[str(lunar_month)][hour_branch]
    else:
        # fallback：將紫微暫置於命宮（可由外層替換為你系統的安全預設）
        ziwei_branch = ming_b

    # 紫微系定位
    ziwei_idx = bidx(ziwei_branch)
    placements = {"紫微": ziwei_branch}
    for star, off in main["ziwei_series_offsets"].items():
        idx = (ziwei_idx + off) % 12  # off 是逆行位移（負值）
        placements[star] = _branch_by_idx(idx)

    # 天府定位：透過映射求天府位置，再展開天府系
    tianfu_branch = main["ziwei_to_tianfu_mapping"][ziwei_branch]
    tianfu_idx = bidx(tianfu_branch)
    placements["天府"] = tianfu_branch
    for star, off in main["tianfu_series_offsets"].items():
        idx = (tianfu_idx + off) % 12
        placements[star] = _branch_by_idx(idx)

    # 輔星（簡化：左右輔、文昌曲、空劫、魁鉞、祿存、羊陀、天馬）
    # 月基準/時基準的順逆起點計數
    def place_from(start_b:str, direction:str, steps:int)->str:
        si = bidx(start_b)
        return _branch_by_idx(_cw(si, steps) if direction=="cw" else _ccw(si, steps))

    # 左輔（辰起正月順）：步數=生月-1
    placements["左輔"] = place_from(aux["rules"]["左輔"]["start"], "cw", lunar_month-1)
    # 右弼（戌起正月逆）：步數=生月-1
    placements["右弼"] = place_from(aux["rules"]["右弼"]["start"], "ccw", lunar_month-1)
    # 文曲（辰起子時順）：步數=hour_index
    placements["文曲"] = place_from(aux["rules"]["文曲"]["start"], "cw", bidx(hour_branch))
    # 文昌（戌起子時逆）：步數=hour_index
    placements["文昌"] = place_from(aux["rules"]["文昌"]["start"], "ccw", bidx(hour_branch))
    # 地劫/地空（亥起子時順/逆）
    placements["地劫"] = place_from(aux["rules"]["地劫"]["start"], "cw", bidx(hour_branch))
    placements["地空"] = place_from(aux["rules"]["地空"]["start"], "ccw", bidx(hour_branch))

    # 天魁/天鉞：依年干
    qm = aux["rules"]["天魁天鉞"]["mapping"][year_stem]
    placements["天魁"], placements["天鉞"] = qm[0], qm[1]

    # 祿存、擎羊、陀羅
    lucun = aux["rules"]["祿存"]["mapping"][year_stem]
    placements["祿存"] = lucun
    lucun_idx = bidx(lucun)
    placements["擎羊"] = _branch_by_idx(_cw(lucun_idx, 1))
    placements["陀羅"] = _branch_by_idx(_ccw(lucun_idx, 1))

    # 天馬：年支四局
    quad = None
    for k,v in aux["rules"]["天馬"]["mapping"].items():
        if year_branch in k:
            placements["天馬"] = v
            break

    # 四化：選定變體
    fourtbl = four["variants"].get(opts.four_hua_variant, four["variants"]["108s_tw"])
    four_for_year = fourtbl[year_stem]

    # 五行局
    bureau = five["stem_to_bureau"][year_stem]

    return {
        "inputs": {"lunar_month": lunar_month, "hour_branch": hour_branch, "year_stem": year_stem, "year_branch": year_branch},
        "ming_branch": ming_b,
        "shen_branch": shen_b,
        "ziwei_anchor_used": bool(ziwei_anchor),
        "placements": placements,
        "four_hua": four_for_year,
        "five_bureau": bureau
    }
