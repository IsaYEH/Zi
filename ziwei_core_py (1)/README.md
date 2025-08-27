# ziwei_core (Python)

後台錨點 + 規則驅動的紫微斗數核心套件。

## 安裝（本地來源）
```bash
pip install .
```

## 使用
```python
from ziwei_core import compute_chart, ComputeOptions
res = compute_chart(lunar_month=6, hour_branch="午", year_stem="辛", year_branch="卯",
                    opts=ComputeOptions(external_data_dir="/your/project/root", four_hua_variant="108s_tw"))
print(res)
```

- 若 `/your/project/root/data/ziwei_anchor.json` 存在，將以其（農曆月×時支→地支）決定 **紫微錨點**；否則 fallback 以 **命宮** 作為暫置錨點（你可在上層繫結你自己的安全預設）。
- 命/身宮推法：寅起正月，順至生月；由該宮起子，逆至生時為命；順至生時為身。
- 輔星（左右輔、文昌文曲、空劫、魁鉞、祿存/羊/陀、天馬）按月/時/年干支起點順逆定位。
- 四化提供兩個常見版本：`108s_tw` 與 `alt_common`（可切換）。
- 五行局：年干→局（甲乙=金四、丙丁=水二、戊己=火六、庚辛=土五、壬癸=木三）。

## CLI
```bash
python -m ziwei_core_cli --month 6 --hour 午 --stem 辛 --branch 卯 --data-dir /your/project/root
```

## 版次
Generated 2025-08-27T07:38:21.
