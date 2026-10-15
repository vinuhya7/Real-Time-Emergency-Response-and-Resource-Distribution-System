from typing import Dict, List, Optional, Tuple
from .models import Incident, Resource

# Academic demo matching rules: incident type -> suitable resource types.
MATCH_RULES = {
    "Medical": {"Ambulance", "Rescue Team"},
    "Accident": {"Ambulance", "Rescue Team"},
    "Fire": {"Fire Unit", "Rescue Team"},
    "Flood": {"Rescue Team", "Ambulance"},
    "Other": {"Rescue Team", "Ambulance", "Fire Unit"},
}

class AllocationEngine:
    """Greedy allocator: rank open incidents, then choose the first available match."""
    def allocate(self, incidents: List[Incident], resources: List[Resource]) -> List[Tuple[int, int]]:
        open_incidents = [i for i in incidents if i.status == "Open"]
        open_incidents.sort(key=lambda incident: incident.priority_score(), reverse=True)
        available = [r for r in resources if r.available]
        allocations = []
        used_resource_ids = set()
        for incident in open_incidents:
            allowed = MATCH_RULES.get(incident.incident_type, MATCH_RULES["Other"])
            match = next((r for r in available
                          if r.id not in used_resource_ids and r.resource_type in allowed), None)
            if match:
                allocations.append((incident.id, match.id))
                used_resource_ids.add(match.id)
        return allocations

def shortest_path(graph: Dict[str, Dict[str, int]], start: str, goal: str) -> Tuple[List[str], Optional[int]]:
    """Dijkstra's algorithm for a small non-negative weighted graph."""
    if start not in graph or goal not in graph:
        return [], None
    distances = {node: float("inf") for node in graph}
    previous = {}
    unvisited = set(graph)
    distances[start] = 0
    while unvisited:
        current = min(unvisited, key=lambda node: distances[node])
        if distances[current] == float("inf"):
            break
        unvisited.remove(current)
        if current == goal:
            break
        for neighbour, weight in graph[current].items():
            if neighbour in unvisited and distances[current] + weight < distances.get(neighbour, float("inf")):
                distances[neighbour] = distances[current] + weight
                previous[neighbour] = current
    if distances.get(goal, float("inf")) == float("inf"):
        return [], None
    path = [goal]
    while path[-1] != start:
        path.append(previous[path[-1]])
    path.reverse()
    return path, int(distances[goal])
