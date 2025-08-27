
from ziwei_core import compute_chart, ComputeOptions
res = compute_chart(6, "午", "辛", "卯", ComputeOptions(external_data_dir=""))
assert "placements" in res and "紫微" in res["placements"]
print("OK", res["placements"]["紫微"])
