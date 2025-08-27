
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os, yaml
from engine import compute_chart

BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.join(os.path.dirname(BASE_DIR), "frontend")

# 載入四化規則
rules_file = os.path.join(BASE_DIR,"data","rules","wenmo-1.0.yaml")
if os.path.exists(rules_file):
    with open(rules_file,"r",encoding="utf-8") as f:
        RULES = yaml.safe_load(f)
    BY_STEM_TABLE = RULES.get("transforms",{}).get("by_stem_table",{})
else:
    RULES = {}
    BY_STEM_TABLE = {}

class ChartRequest(BaseModel):
    date:str
    time:str
    place:str
    lat: float = 25.033
    lon: float = 121.565

app = FastAPI()
app.mount("/assets", StaticFiles(directory=FRONTEND_DIR), name="assets")

@app.get("/")
def index():
    return FileResponse(os.path.join(FRONTEND_DIR,"index.html"))

@app.post("/api/charts")
def create_chart(payload:ChartRequest):
    chart = compute_chart(payload.date, payload.time, payload.place)
    sky = chart["meta"]["birth"]["yearSky"]
    chart["natal"]["transforms"] = BY_STEM_TABLE.get(sky,{})
    chart["id"] = f"demo-{payload.date}-{payload.time}-{payload.place}"
    chart["meta"]["birth"]["lat"] = payload.lat
    chart["meta"]["birth"]["lon"] = payload.lon
    return chart
