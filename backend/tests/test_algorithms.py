from app.algorithms import shortest_path, AllocationEngine
from app.models import Incident, Resource

def test_dijkstra_shortest_path():
    graph = {"A": {"B": 4, "C": 1}, "B": {"A": 4, "C": 2}, "C": {"A": 1, "B": 2}}
    path, distance = shortest_path(graph, "A", "B")
    assert path == ["A", "C", "B"]
    assert distance == 3

def test_allocation_matches_resource_type():
    incident = Incident(1, "Fire", "Fire", "Road", 5, "Open", "2026-10-12T00:00:00+00:00")
    resource = Resource(10, "Fire engine", "Fire Unit", "Station", True)
    allocations = AllocationEngine().allocate([incident], [resource])
    assert allocations == [(1, 10)]
