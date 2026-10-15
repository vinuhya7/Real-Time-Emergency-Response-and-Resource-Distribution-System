from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from .database import connect, init_db, now_iso
from .models import Incident, Resource
from .algorithms import AllocationEngine, shortest_path

app = FastAPI(
    title="Intelligent Emergency Resource Allocation and Response System",
    description="Academic demonstration API for incident tracking and resource allocation.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

class IncidentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    incident_type: str
    location: str = Field(min_length=2, max_length=150)
    severity: int = Field(ge=1, le=5)

class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    resource_type: str
    location: str = Field(min_length=2, max_length=150)

class StatusUpdate(BaseModel):
    status: str

def row_to_incident(row):
    return dict(row)

def row_to_resource(row):
    result = dict(row)
    result["available"] = bool(result["available"])
    return result

@app.get("/")
def home():
    return {"message": "Emergency Resource Allocation API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/dashboard")
def dashboard():
    with connect() as conn:
        incidents = conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
        open_incidents = conn.execute("SELECT COUNT(*) FROM incidents WHERE status='Open'").fetchone()[0]
        allocated = conn.execute("SELECT COUNT(*) FROM incidents WHERE status='Allocated'").fetchone()[0]
        resources = conn.execute("SELECT COUNT(*) FROM resources").fetchone()[0]
        available = conn.execute("SELECT COUNT(*) FROM resources WHERE available=1").fetchone()[0]
    return {"incidents": incidents, "open_incidents": open_incidents, "allocated_incidents": allocated,
            "resources": resources, "available_resources": available}

@app.get("/api/incidents")
def list_incidents():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM incidents ORDER BY id DESC").fetchall()
    return [row_to_incident(r) for r in rows]

@app.post("/api/incidents", status_code=201)
def create_incident(item: IncidentCreate):
    allowed = {"Medical", "Accident", "Fire", "Flood", "Other"}
    if item.incident_type not in allowed:
        raise HTTPException(400, f"incident_type must be one of {sorted(allowed)}")
    with connect() as conn:
        cur = conn.execute(
            "INSERT INTO incidents(title, incident_type, location, severity, status, created_at) VALUES(?,?,?,?,?,?)",
            (item.title, item.incident_type, item.location, item.severity, "Open", now_iso()))
        row = conn.execute("SELECT * FROM incidents WHERE id=?", (cur.lastrowid,)).fetchone()
        conn.commit()
    return row_to_incident(row)

@app.patch("/api/incidents/{incident_id}/status")
def update_status(incident_id: int, item: StatusUpdate):
    if item.status not in {"Open", "Allocated", "Resolved"}:
        raise HTTPException(400, "status must be Open, Allocated, or Resolved")
    with connect() as conn:
        cur = conn.execute("UPDATE incidents SET status=? WHERE id=?", (item.status, incident_id))
        if cur.rowcount == 0:
            raise HTTPException(404, "Incident not found")
        row = conn.execute("SELECT * FROM incidents WHERE id=?", (incident_id,)).fetchone()
        conn.commit()
    return row_to_incident(row)

@app.get("/api/resources")
def list_resources():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM resources ORDER BY id DESC").fetchall()
    return [row_to_resource(r) for r in rows]

@app.post("/api/resources", status_code=201)
def create_resource(item: ResourceCreate):
    allowed = {"Ambulance", "Fire Unit", "Rescue Team"}
    if item.resource_type not in allowed:
        raise HTTPException(400, f"resource_type must be one of {sorted(allowed)}")
    with connect() as conn:
        cur = conn.execute("INSERT INTO resources(name, resource_type, location, available) VALUES(?,?,?,1)",
                           (item.name, item.resource_type, item.location))
        row = conn.execute("SELECT * FROM resources WHERE id=?", (cur.lastrowid,)).fetchone()
        conn.commit()
    return row_to_resource(row)

@app.post("/api/allocate")
def allocate_resources():
    with connect() as conn:
        incident_rows = conn.execute("SELECT * FROM incidents WHERE status='Open'").fetchall()
        resource_rows = conn.execute("SELECT * FROM resources WHERE available=1").fetchall()
        incidents = [Incident(**dict(r)) for r in incident_rows]
        resources = [Resource(id=r["id"], name=r["name"], resource_type=r["resource_type"],
                              location=r["location"], available=bool(r["available"])) for r in resource_rows]
        pairs = AllocationEngine().allocate(incidents, resources)
        results = []
        for incident_id, resource_id in pairs:
            conn.execute("UPDATE incidents SET status='Allocated', assigned_resource_id=? WHERE id=?",
                         (resource_id, incident_id))
            conn.execute("UPDATE resources SET available=0 WHERE id=?", (resource_id,))
            results.append({"incident_id": incident_id, "resource_id": resource_id})
        conn.commit()
    return {"message": f"Allocated {len(results)} resource(s)", "allocations": results}

@app.post("/api/sample-data")
def sample_data():
    with connect() as conn:
        count = conn.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
        if count == 0:
            examples = [
                ("Road accident near Central Road", "Accident", "Central Road", 5, "Open", now_iso()),
                ("House fire in Green Park", "Fire", "Green Park", 4, "Open", now_iso()),
                ("Person needs medical help", "Medical", "City Bus Stop", 3, "Open", now_iso()),
                ("Waterlogging reported", "Flood", "Market Street", 2, "Open", now_iso()),
            ]
            conn.executemany("INSERT INTO incidents(title,incident_type,location,severity,status,created_at) VALUES(?,?,?,?,?,?)", examples)
        resource_count = conn.execute("SELECT COUNT(*) FROM resources").fetchone()[0]
        if resource_count == 0:
            resources = [
                ("Ambulance A-01", "Ambulance", "Central Station", 1),
                ("Fire Unit F-01", "Fire Unit", "Fire Station", 1),
                ("Rescue Team R-01", "Rescue Team", "Rescue Base", 1),
            ]
            conn.executemany("INSERT INTO resources(name,resource_type,location,available) VALUES(?,?,?,?)", resources)
        conn.commit()
    return {"message": "Sample data is ready. Existing records were kept."}

@app.get("/api/route-demo")
def route_demo():
    graph = {
        "Control Room": {"Central Road": 4, "Market Street": 7},
        "Central Road": {"Control Room": 4, "Green Park": 3, "City Bus Stop": 6},
        "Market Street": {"Control Room": 7, "Green Park": 2},
        "Green Park": {"Central Road": 3, "Market Street": 2, "City Bus Stop": 4},
        "City Bus Stop": {"Central Road": 6, "Green Park": 4},
    }
    path, distance = shortest_path(graph, "Control Room", "City Bus Stop")
    return {"start": "Control Room", "destination": "City Bus Stop", "path": path,
            "distance_units": distance, "note": "Illustrative distances only; not real navigation data."}
