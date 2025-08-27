
import argparse, json, os
from ziwei_core import compute_chart, ComputeOptions

def main():
    ap = argparse.ArgumentParser(description="Ziwei Doushu chart (backend-anchor)")
    ap.add_argument("--month", type=int, required=True, help="lunar month 1..12")
    ap.add_argument("--hour", type=str, required=True, help="hour branch (子..亥)")
    ap.add_argument("--stem", type=str, required=True, help="year stem (甲..癸)")
    ap.add_argument("--branch", type=str, required=True, help="year branch (子..亥)")
    ap.add_argument("--data-dir", type=str, default="", help="external project root (contains data/ziwei_anchor.json)")
    ap.add_argument("--hua", type=str, default="108s_tw", help="four-hua variant (108s_tw|alt_common)")
    args = ap.parse_args()
    res = compute_chart(args.month, args.hour, args.stem, args.branch, ComputeOptions(external_data_dir=args.data_dir, four_hua_variant=args.hua))
    print(json.dumps(res, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
