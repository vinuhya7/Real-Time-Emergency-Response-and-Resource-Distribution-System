
import { useState } from "react";
import { getShortestRoute } from "../utils/shortestRoute";

const incidents = [
  { id: 1, name: "Flood", location: "City Bus Stop" },
  { id: 2, name: "Road Accident", location: "Benz Circle" },
  { id: 3, name: "Fire", location: "KL University" },
];

const resources = [
  { id: 1, name: "Ambulance", location: "Control Room" },
  { id: 2, name: "Rescue Unit", location: "Hospital Gate" },
  { id: 3, name: "Fire Engine", location: "Benz Circle" },
];

export default function RouteDemo() {
  const [incidentId, setIncidentId] = useState(1);
  const [resourceId, setResourceId] = useState(1);

  const incident = incidents.find(
    (item) => item.id === incidentId
  )!;

  const resource = resources.find(
    (item) => item.id === resourceId
  )!;

  const route = getShortestRoute(
    resource.location,
    incident.location
  );

  return (
    <div className="route-demo">
      <h3>Shortest Route (Sample Demo)</h3>

      <label>Choose Incident: </label>
      <select
        value={incidentId}
        onChange={(e) => setIncidentId(Number(e.target.value))}
      >
        {incidents.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <br /><br />

      <label>Choose Resource: </label>
      <select
        value={resourceId}
        onChange={(e) => setResourceId(Number(e.target.value))}
      >
        {resources.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <p><b>Incident:</b> {incident.name}</p>
      <p><b>Assigned resource:</b> {resource.name}</p>

      {route.path.length > 0 ? (
        <>
          <p>
            <b>Route:</b> {route.path.join(" → ")}
          </p>
          <p>
            <b>Total distance:</b> {route.distance} units
          </p>
        </>
      ) : (
        <p>No route available.</p>
      )}
    </div>
  );
}
