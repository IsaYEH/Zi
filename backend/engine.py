
from lunar_python import Solar
from typing import Dict, Any, List

PALACES: List[str] = [
    "命宮","兄弟宮","夫妻宮","子女宮","財帛宮","疾厄宮",
    "遷移宮","交友宮","官祿宮","田宅宮","福德宮","父母宮"
]

STEMS = ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"]

def hour_branch_index(h: int) -> int:
    if h == 23:
        return 0
    return ((h + 1) // 2) % 12

def ganzhi_year_stem(year: int) -> str:
    return STEMS[(year - 4) % 10]

def build_base_palaces() -> Dict[str, list]:
    return {p: [] for p in PALACES}

def locate_ming_shen(month: int, hour_idx: int):
    ming_idx = (month + hour_idx - 1) % 12
    shen_idx = (ming_idx + 2) % 12
    return PALACES[ming_idx], PALACES[shen_idx]

def demo_major_stars(ming: str) -> Dict[str, list]:
    stars = build_base_palaces()
    ring = PALACES
    i = ring.index(ming)
    stars[ming].extend([{"name":"紫微","type":"major"},{"name":"天相","type":"major"}])
    stars[ring[(i+1)%12]].append({"name":"太陽","type":"major"})
    stars[ring[(i+2)%12]].append({"name":"天機","type":"major"})
    stars[ring[(i+3)%12]].append({"name":"武曲","type":"major"})
    stars[ring[(i+4)%12]].append({"name":"天同","type":"major"})
    stars[ring[(i+5)%12]].extend([{"name":"廉貞","type":"major"},{"name":"火星","type":"inauspicious"}])
    stars[ring[(i+8)%12]].append({"name":"天梁","type":"major"})
    stars[ring[(i+9)%12]].append({"name":"天府","type":"major"})
    stars[ring[(i+10)%12]].append({"name":"七殺","type":"major"})
    stars[ring[(i+11)%12]].append({"name":"太陰","type":"major"})
    return stars

def compute_chart(date_str: str, time_str: str, place: str) -> Dict[str, Any]:
    y, m, d = [int(x) for x in date_str.split("-")]
    hh, mm = [int(x) for x in time_str.split(":")]
    Solar.fromYmdHms(y, m, d, hh, mm, 0)

    year_sky = ganzhi_year_stem(y)
    h_idx = hour_branch_index(hh)
    ming, shen = locate_ming_shen(m, h_idx)
    stars = demo_major_stars(ming)

    return {
        "meta": {
            "tz": "+08:00",
            "calendar": "Lunar",
            "ruleset": "wenmo-1.0",
            "birth": {"date": date_str, "time": time_str, "place": place, "yearSky": year_sky},
            "lifeLord": "",
            "bodyLord": ""
        },
        "natal": {
            "fiveElementBureau": "木三局",
            "lifePalace": ming,
            "bodyPalace": shen,
            "stars": stars
        },
        "aspects": {
            "sanFangSiZheng": [[ming, "官祿宮", "財帛宮"]],
            "sha": [{"name": "火星", "palace": "疾厄宮"}]
        }
    }
