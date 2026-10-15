
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  Ambulance,
  AlertTriangle,
  MapPin,
  Users,
  Plus,
  RefreshCw,
  Route,
  Siren,
  CheckCircle2,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
import { api } from "./api";

import RouteDemo from "./components/RouteDemo";


type Page = "overview" | "incidents" | "resources";

type Incident = {
  id: number;
  title: string;
  incident_type: string;
  location: string;
  severity: number;
  status: string;
  assigned_resource_id?: number | null;
};

type Resource = {
  id: number;
  name: string;
  resource_type: string;
  location: string;
  available: boolean;
};

type Dashboard = {
  incidents: number;
  open_incidents: number;
  allocated_incidents: number;
  resources: number;
  available_resources: number;
};

const emptyStats: Dashboard = {
  incidents: 0,
  open_incidents: 0,
  allocated_incidents: 0,
  resources: 0,
  available_resources: 0,
};

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<Dashboard>(emptyStats);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  const [incidentForm, setIncidentForm] = useState({
    title: "",
    incident_type: "Accident",
    location: "",
    severity: 3,
  });

  const [resourceForm, setResourceForm] = useState({
    name: "",
    resource_type: "Ambulance",
    location: "",
  });

  const refresh = useCallback(async () => {
    try {
      const [s, i, r] = await Promise.all([
        api.dashboard(),
        api.incidents(),
        api.resources(),
      ]);

      setStats(s);
      setIncidents(i);
      setResources(r);
    } catch (error) {
      setMessage(
        `Cannot connect to backend. Make sure FastAPI is running on port 8000. ${
          error instanceof Error ? error.message : ""
        }`
      );
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(
    operation: () => Promise<any>,
    successMessage: string
  ) {
    setBusy(true);
    setMessage("");

    try {
      const result = await operation();
      setMessage(result?.message || successMessage);
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Operation failed"
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitIncident(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(
      () => api.addIncident(incidentForm),
      "Incident added successfully."
    );

    setIncidentForm({
      title: "",
      incident_type: "Accident",
      location: "",
      severity: 3,
    });
  }

  async function submitResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(
      () => api.addResource(resourceForm),
      "Resource added successfully."
    );

    setResourceForm({
      name: "",
      resource_type: "Ambulance",
      location: "",
    });
  }

  async function showRoute() {
    try {
      setRouteInfo(await api.route());
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Route calculation failed"
      );
    }
  }

  const pageTitles: Record<Page, string> = {
    overview: "Response dashboard",
    incidents: "Incident desk",
    resources: "Resource management",
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Siren size={24} />
          </div>
          <div>
            <b>ResQ</b>
            <span>RESPONSE CONTROL</span>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>

        <button
          type="button"
          className={`nav-item ${page === "overview" ? "active" : ""}`}
          onClick={() => {
            setPage("overview");
            setMessage("");
          }}
        >
          <LayoutDashboard size={18} />
          Overview
        </button>

        <button
          type="button"
          className={`nav-item ${page === "incidents" ? "active" : ""}`}
          onClick={() => {
            setPage("incidents");
            setMessage("");
          }}
        >
          <ClipboardList size={18} />
          Incident desk
        </button>

        <button
          type="button"
          className={`nav-item ${page === "resources" ? "active" : ""}`}
          onClick={() => {
            setPage("resources");
            setMessage("");
          }}
        >
          <Ambulance size={18} />
          Resources
        </button>

        <div className="side-bottom">
          <span className="pulse" />
          <div>
            <b>Demo system online</b>
            <small>Academic simulation</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">EMERGENCY OPERATIONS / WORKSPACE</div>
            <h1>{pageTitles[page]}</h1>
            <p>
              {page === "overview" &&
                "Monitor incidents and coordinate response resources."}
              {page === "incidents" &&
                "Report, prioritize, and track emergency incidents."}
              {page === "resources" &&
                "Register response units and monitor their availability."}
            </p>
          </div>

          <button
            type="button"
            className="btn secondary"
            onClick={() => void refresh()}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {message && (
          <div className="notice" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage("")}>
              ×
            </button>
          </div>
        )}

        {page === "overview" && (
          <OverviewPage
            stats={stats}
            incidents={incidents}
            resources={resources}
            busy={busy}
            routeInfo={routeInfo}
            onLoadSample={() =>
              void runAction(api.sample, "Sample data loaded.")
            }
            onAllocate={() =>
              void runAction(api.allocate, "Allocation completed.")
            }
            onShowRoute={() => void showRoute()}
            onOpenIncidents={() => setPage("incidents")}
            onOpenResources={() => setPage("resources")}
          />
        )}

        {page === "incidents" && (
          <IncidentPage
            incidents={incidents}
            busy={busy}
            form={incidentForm}
            setForm={setIncidentForm}
            onSubmit={submitIncident}
            onAllocate={() =>
              void runAction(api.allocate, "Allocation completed.")
            }
          />
        )}

        {page === "resources" && (
          <ResourcePage
            resources={resources}
            busy={busy}
            form={resourceForm}
            setForm={setResourceForm}
            onSubmit={submitResource}
          />
        )}

        <footer>
          ResQ · Intelligent Emergency Resource Allocation &amp; Response
          System
          <span>CTP academic project · Simulation only</span>
        </footer>
      </main>
    </div>
  );
}

function OverviewPage({
  stats,
  incidents,
  resources,
  busy,
  routeInfo,
  onLoadSample,
  onAllocate,
  onShowRoute,
  onOpenIncidents,
  onOpenResources,
}: {
  stats: Dashboard;
  incidents: Incident[];
  resources: Resource[];
  busy: boolean;
  routeInfo: any;
  onLoadSample: () => void;
  onAllocate: () => void;
  onShowRoute: () => void;
  onOpenIncidents: () => void;
  onOpenResources: () => void;
}) {
  return (
    <>
      <section className="stats-grid">
        <Stat
          icon={<AlertTriangle />}
          label="Total incidents"
          value={stats.incidents}
          tone="orange"
        />
        <Stat
          icon={<Activity />}
          label="Awaiting response"
          value={stats.open_incidents}
          tone="red"
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Allocated"
          value={stats.allocated_incidents}
          tone="green"
        />
        <Stat
          icon={<Users />}
          label="Available resources"
          value={`${stats.available_resources} / ${stats.resources}`}
          tone="blue"
        />
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent incidents</h2>
              <p>Current incident summary</p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={onOpenIncidents}
            >
              View all
            </button>
          </div>
          </div>

          <IncidentTable incidents={incidents.slice(0, 5)} />

          <div className="panel-actions">
            <button
              type="button"
              className="btn primary"
              disabled={busy}
              onClick={onAllocate}
            >
              <Activity size={16} /> Allocate resource
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={onLoadSample}
            >
              <Plus size={16} /> Load sample data
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={onShowRoute}
            >
              <Route size={16} /> Route demo
            </button>
          </div>

        <RouteDemo />

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Resource summary</h2>
              <p>Registered response units</p>
            </div>
            <button
              type="button"
              className="btn secondary"
              onClick={onOpenResources}
            >
              View all
            </button>
          </div>
          <ResourceList resources={resources.slice(0, 4)} />
        </div>
      </section>
    </>
  );
}

function IncidentPage({
  incidents,
  busy,
  form,
  setForm,
  onSubmit,
  onAllocate,
}: {
  incidents: Incident[];
  busy: boolean;
  form: {
    title: string;
    incident_type: string;
    location: string;
    severity: number;
  };
  setForm: (value: typeof form) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAllocate: () => void;
}) {
  return (
    <>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>All incidents</h2>
            <p>Review incident severity and allocation status</p>
          </div>
          <span className="count-pill">{incidents.length} records</span>
        </div>

        <IncidentTable incidents={incidents} />

        <div className="panel-actions">
          <button
            type="button"
            className="btn primary"
            disabled={busy}
            onClick={onAllocate}
          >
            <Activity size={16} /> Allocate resource
          </button>
        </div>
      </section>

      <section className="panel form-panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div>
            <h2>Report new incident</h2>
            <p>Enter the incident details below</p>
          </div>
          <span className="round-icon red-bg">
            <AlertTriangle size={18} />
          </span>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Incident title
            <input
              required
              minLength={2}
              value={form.title}
              placeholder="e.g. Road accident"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label>
              Incident type
              <select
                value={form.incident_type}
                onChange={(e) =>
                  setForm({ ...form, incident_type: e.target.value })
                }
              >
                <option>Accident</option>
                <option>Medical</option>
                <option>Fire</option>
                <option>Flood</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Severity
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: Number(e.target.value) })
                }
              >
                <option value={1}>1 · Low</option>
                <option value={2}>2 · Mild</option>
                <option value={3}>3 · Medium</option>
                <option value={4}>4 · High</option>
                <option value={5}>5 · Critical</option>
              </select>
            </label>
          </div>

          <label>
            Location
            <input
              required
              minLength={2}
              value={form.location}
              placeholder="Area or landmark"
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>

          <button className="btn primary full" disabled={busy}>
            <Plus size={16} /> Add incident
          </button>
        </form>
      </section>
    </>
  );
}

function ResourcePage({
  resources,
  busy,
  form,
  setForm,
  onSubmit,
}: {
  resources: Resource[];
  busy: boolean;
  form: { name: string; resource_type: string; location: string };
  setForm: (value: typeof form) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <>
      <section className="stats-grid">
        <Stat
          icon={<Users />}
          label="Total resources"
          value={resources.length}
          tone="blue"
        />
        <Stat
          icon={<CheckCircle2 />}
          label="Available"
          value={resources.filter((r) => r.available).length}
          tone="green"
        />
        <Stat
          icon={<Activity />}
          label="Allocated / busy"
          value={resources.filter((r) => !r.available).length}
          tone="orange"
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Resource availability</h2>
            <p>All registered response units</p>
          </div>
          <span className="count-pill">{resources.length} units</span>
        </div>

        <ResourceList resources={resources} />
      </section>

      <section className="panel form-panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div>
            <h2>Register resource</h2>
            <p>Add an ambulance, fire unit, or rescue team</p>
          </div>
          <span className="round-icon blue-bg">
            <Ambulance size={18} />
          </span>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Resource name
            <input
              required
              minLength={2}
              value={form.name}
              placeholder="e.g. Ambulance A-02"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <div className="form-row">
            <label>
              Resource type
              <select
                value={form.resource_type}
                onChange={(e) =>
                  setForm({ ...form, resource_type: e.target.value })
                }
              >
                <option>Ambulance</option>
                <option>Fire Unit</option>
                <option>Rescue Team</option>
              </select>
            </label>

            <label>
              Base location
              <input
                required
                minLength={2}
                value={form.location}
                placeholder="Station or area"
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
          </div>

          <button className="btn primary full" disabled={busy}>
            <Plus size={16} /> Add resource
          </button>
        </form>
      </section>
    </>
  );
}

function IncidentTable({ incidents }: { incidents: Incident[] }) {
  if (incidents.length === 0) {
    return (
      <p className="empty">
        No incidents found. Use Load sample data or report an incident.
      </p>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>INCIDENT</th>
            <th>SEVERITY</th>
            <th>STATUS</th>
            <th>RESOURCE</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr key={incident.id}>
              <td>
                <b>{incident.title}</b>
                <small>
                  <MapPin size={12} /> {incident.location} ·{" "}
                  {incident.incident_type}
                </small>
              </td>
              <td>
                <Severity value={incident.severity} />
              </td>
              <td>
                <span className={`status ${incident.status.toLowerCase()}`}>
                  {incident.status}
                </span>
              </td>
              <td>
                {incident.assigned_resource_id
                  ? `#${incident.assigned_resource_id}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <p className="empty">
        No resources found. Register a resource or load sample data.
      </p>
    );
  }

  return (
    <div className="resource-grid">
      {resources.map((resource) => (
        <div className="resource-card" key={resource.id}>
          <div className="resource-symbol">
            <Ambulance size={20} />
          </div>
          <div className="resource-detail">
            <b>{resource.name}</b>
            <small>
              {resource.resource_type} · {resource.location}
            </small>
          </div>
          <span
            className={`availability ${
              resource.available ? "available" : "busy"
            }`}
          >
            <i />
            {resource.available ? "Available" : "Allocated"}
          </span>
        </div>
      ))}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <small className="stat-mark">●</small>
    </div>
  );
}

function Severity({ value }: { value: number }) {
  const labels = ["", "Low", "Mild", "Medium", "High", "Critical"];

  return (
    <span className={`severity s${value}`}>
      <span>
        {"●".repeat(value)}
        {"○".repeat(5 - value)}
      </span>
      <small>{labels[value] || "Unknown"}</small>
    </span>
  );
}
