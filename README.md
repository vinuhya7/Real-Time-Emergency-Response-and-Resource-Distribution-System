# Intelligent Emergency Resource Allocation and Response System
A lab-friendly full-stack CTP project with React + Vite frontend, FastAPI Python backend, and SQLite database.

> Academic demonstration only. This project is not a real emergency dispatch or medical decision system.

## Features
- Dashboard with incident/resource counts
- Create, view, and update emergency incidents
- Add and view response resources (ambulances, fire units, rescue teams)
- Greedy priority-based resource allocation (highest-priority eligible incident first)
- Priority scoring based on severity and waiting time
- Simple shortest-route demonstration using Dijkstra's algorithm
- SQLite persistence; database is created automatically
- API documentation at `/docs`
- Unit tests with `pytest`

## Requirements
- Python 3.10+
- Node.js 18+ and npm

## Run on Windows (VS Code)

### 1. Start the backend
Open a terminal in VS Code and run:
```powershell
cd backend
python -m venv .venv
```
If PowerShell blocks activation, **do not activate the environment**. Use the direct interpreter commands below.

Install packages:
```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```
Start the API:
```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```
If you prefer activation and it works:
```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

### 2. Start the frontend
Open a **second** terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite (normally http://localhost:5173).

## Default demo flow
1. Click **Load sample data** to insert demo incidents and resources.
2. Add an incident using the form.
3. Click **Allocate resource** to run the greedy allocation algorithm.
4. Use **Route demo** to see Dijkstra's shortest path example.
5. Refresh the page; data remains in `backend/emergency_system.db`.

## API endpoints
- `GET /` – API status
- `GET /health` – health check
- `GET /api/dashboard` – dashboard totals
- `GET /api/incidents` – list incidents
- `POST /api/incidents` – create incident
- `PATCH /api/incidents/{id}/status` – update status
- `GET /api/resources` – list resources
- `POST /api/resources` – create resource
- `POST /api/allocate` – greedy allocation
- `POST /api/sample-data` – insert sample records
- `GET /api/route-demo` – Dijkstra route demonstration

## CTP concepts demonstrated
- Decomposition: incidents, resources, allocation, route planning, dashboard
- Data structures: lists, dictionaries, priority ordering
- Greedy algorithm: allocate the best available matching resource to the top-ranked incident
- Dijkstra: shortest path on a small weighted graph
- OOP: `Incident`, `Resource`, `AllocationEngine`
- Testing: pytest tests for priority and shortest path
- Complexity: sorting incidents is O(n log n); Dijkstra with the simple adjacency-list implementation is O((V + E) log V) conceptually with a priority queue (this demo uses a basic selection approach, O(V²)); resource matching is O(I × R)
- API and database: FastAPI + SQLite
